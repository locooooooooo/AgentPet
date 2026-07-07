# ranch-real-integration-p0-v0.1

⟦tag:v2|task|ranch-real-integration-p0-v0.1⟧

> **任务卡 ID**：`ranch-real-integration-p0`
> **版本**：v0.1
> **创建日期**：2026-07-03
> **创建人**：Mavis（root session `mvs_5bb811db0b244b80a142de9d522cc90a`）
> **优先级**：**P0**（2026-07-03 用户拍板提升）
> **状态**：pending
> **关联 Q**：Q7（真 agent 开箱默认）由"不开"→**开**
> **关联文档**：
> - 状态打通方案：`docs/真实生产环境状态打通与牛马表情联动方案.md`
> - 工程需求：`docs/桌面牧场工程需求-v0.2.md` §FR-006 系统通知通道 / §5.2 IPC
> - 需求 v0.3：`docs/桌面牧场需求-v0.3.md` §〇·quarter / §九 / §十一
> - 修订说明：`docs/桌面牧场需求-v0.3-修订说明-2026-07-03.md` §三 README 措辞

---

## 〇、任务概述

将"真实生产环境状态打通"从**v0.3 默认关闭**（Q7=不开）提升为 **P0 优先级**——桌面牧场（和控制舱）真正吃本地真实进程管道，**表情/动作 = 真实任务执行状态的实时映射**（不再仅靠模拟 runner）。

### 0.1 现状

- `electron/main.ts` `agents:create-task` handler 跑的是**模拟 runner**（`progressRunningTasks` 推进 + 写假日志）
- `connectors.json` 默认 `disabled: true`
- README 写"模拟 runner：任务会自动推进进度并写入日志，不启动真实外部 agent 进程"
- 桌面牧场吃的 `AgentSnapshot` 来自模拟 runner

### 0.2 目标（P0 完成后）

- `connectors.json` 默认 `enabled: true`（按 connector 类型）
- `electron/main.ts` `agents:create-task` 支持真实 `child_process.spawn` 路径
- 状态映射规则（v0.3 §七）从"模拟进度"切到"真实 task lifecycle"：
  - `running 0~10%` → `coding`（疯狂码砖 + 🔥）
  - `running 10~90%` → 随机忙碌态（`coding` / `debugging` / `testing` / `demanding`）
  - `running deploy 阶段` → `deploying`（拜佛 + 🚀）
  - `running → success` → `done`（按时下班 + 🌸，10s 内）
  - `running → error` → `panicking`（生产救火 + 🚨，保留至下次任务下发）
- 桌面牧场表情 = 真实任务状态（**不再仅模拟**）

### 0.3 P0 范围

| 做 | 不做 |
|---|---|
| ✅ `child_process.spawn` + stdout/stderr 监听 | ❌ 不引入 shell executor（防注入）|
| ✅ exitCode → success/error 映射 | ❌ 不接外部 agent CLI（codex / trae / qoder）—— v0.4 才接 |
| ✅ `connectors.json` 默认 enabled | ❌ 不改 AgentSnapshot 顶层 schema |
| ✅ 系统通知带 agent accent icon（8 张 PNG 复活）| ❌ 不动 NiuMaAvatar / 中央 4×2 grid |
| ✅ README 措辞调整（"真实任务执行状态实时映射"）| ❌ 不动桌面牧场 §〇·quinary 简洁规范 |

---

## 一、P0 子任务（按实施顺序）

### R0-1 IPC handler 接真实 spawn（**2~3h**）

**改动**：
- `electron/main.ts` `agents:create-task` handler：
  ```typescript
  // 旧：模拟 runner
  // progressRunningTasks(task);
  
  // 新：真实 spawn + 监听
  const child = spawn(command, args, { cwd, shell: false });
  child.stdout.on('data', (data) => sendLogsToFrontend(taskId, data.toString()));
  child.stderr.on('data', (data) => sendLogsToFrontend(taskId, `[ERR] ${data.toString()}`));
  child.on('close', (code) => {
    if (code === 0) updateAgentTaskStatus(agentId, taskId, 'success');
    else updateAgentTaskStatus(agentId, taskId, 'error');
  });
  ```

**验收**：
- `npm run lint && npm run build` 0 错
- 控制舱下任务 → `child_process` 实际启动 → stdout 推到前端日志
- exitCode 0 → success；非 0 → error

### R0-2 状态映射规则接入（**2~3h**）

**改动**：
- `src/lib/agentCore.ts` 新增 `getNiuMaEffectiveStatus(agent, runtime)`：
  ```typescript
  export function getNiuMaEffectiveStatus(agent: AIAgent, runtime: NiuMaRuntimeState): NiuMaStatus {
    const runningTask = agent.tasks.find(t => t.status === 'running');
    if (runningTask) {
      if (runningTask.progress < 10) return 'coding';
      if (runningTask.progress >= 10 && runningTask.progress < 90) {
        // 10~90% 随机忙碌
        const busyStates: NiuMaStatus[] = ['coding', 'debugging', 'testing', 'demanding'];
        return busyStates[Math.floor(runningTask.progress % busyStates.length)] ?? 'coding';
      }
      // deploy 阶段（基于 task.command 包含 deploy/release）
      if (runningTask.command.includes('deploy') || runningTask.command.includes('release')) {
        return 'deploying';
      }
    }
    // 最近任务是 error → panicking
    const latestTask = agent.tasks[0];
    if (latestTask?.status === 'error') return 'panicking';
    // 最近任务是 success → done（10s 内）
    if (latestTask?.status === 'success' && Date.now() - new Date(latestTask.endTime || '').getTime() < 10000) {
      return 'done';
    }
    return runtime.customState ?? 'idle';
  }
  ```

**验收**：
- 控制舱下任务 → 桌面牧场 8 动物表情按真实进度切换
- 任务成功 → 牧场对应动物 10s 内呈现 `done_cheer` + 🌸
- 任务失败 → 牧场对应动物呈现 `panic_smoke` + 🚨

**验收状态（2026-07-04）**：
- accepted: `docs/orchestration/sessions/r0-visual-replay-accepted-2026-07-04.md`
- Electron/CDP 复测覆盖 deploy、failure、long-running progress、8 动物 success；最大可见切换延迟 `2ms`，满足 `<500ms`。

### R0-3 connectors.json 默认 enabled（**30min**）

**改动**：
- `docs/orchestration/connectors.json` 默认 `enabled: true`
- `electron/main.ts` `loadConnectors()` 读 JSON 时不强校验 enabled

**验收**：
- 启动后 connectors 状态显示 `enabled`
- 控制舱 "Connectors" 区域显示 `ready` 状态

**决策状态（2026-07-04）**：
- no-go/deferred: `docs/orchestration/sessions/r0-connector-decision-2026-07-04.md`
- Do not set connector `approvalStatus` to `accepted` or `enabledByDefault` to `true` until PM/user explicitly accepts the connector machine gate.

**分支② standby 状态（2026-07-07）**：
- Controlled dry-run evidence lane is registered at `docs/orchestration/tasks/ranch-real-integration-r0-3-dryrun-v0.1.md`.
- Codex remains `draft / pending / enabled=false`; Trae/Qoder remain `placeholder / command-empty`.
- No dry-run command has been executed from this branch; wait for user second confirmation of timing before collecting evidence.
- Do not change connector `approvalStatus`, `enabledByDefault`, or `command` from this standby lane.

### R0-4 系统通知 icon 接通（8 张 PNG 复活）（**1h**）

**改动**：
- `electron/main.ts:858` `new Notification({ title, body, icon: \`icon/${agentId}.png\` }).show()`
- `8` 张 PNG 已在 `icon/` 目录（codex / trae / qoder / minimax / workbuddy / openclaw / openccode / hermes）

**验收**：
- 控制舱下任务 → OS 收到通知 toast + icon 显示对应 agent 头像
- icon 缺失时 fallback 到默认 icon（不报错）

**验收状态（2026-07-04）**：
- accepted: `docs/orchestration/sessions/r0-notification-icons-accepted-2026-07-04.md`
- Electron/CDP verified standard icon, current alias icon names, missing-icon fallback, and success/error messages with `agentId`.

### R0-5 README 措辞调整（**10min**）

**改动**：
- `README.md` "产品定位" 段更新：
  > "桌面牧场（项目代号 multi-agent-niuma）从 E:\个人服务导航面板 的多 agent 控制舱拆出，**通过 Electron 主进程 IPC + `child_process.spawn` 打通本地真实进程管道**，表情/动作 = 真实任务执行状态的实时映射。"
- "当前范围" 段：
  - "模拟 runner" 改为 "回退到模拟 runner（真实 spawn 失败时的 fallback）"

**验收**：
- README 描述与实际实施一致

**验收状态（2026-07-04）**：
- accepted: `docs/orchestration/sessions/r0-readme-closeout-2026-07-04.md`
- README now describes Electron IPC + `child_process.spawn` and simulated runner fallback.

---

## 二、不在 P0 范围（明确推迟）

| 项 | 推迟到 |
|---|---|
| 接外部 agent CLI（codex / trae / qoder / openclaw）| v0.4+ connector 扩展 |
| 多进程管理 / 进程隔离 / sandbox | v0.4+ |
| 进程树可视化（任务 → 进程 → 子进程）| v0.4+ |
| 真实 agent session 标识 | v0.4+ |
| shell executor（`shell: true`）| 永远不做（防注入）|

---

## 三、P0 验收基线

### 3.1 自动验收

```bash
npm run lint                                          # 0 错
npm run build                                         # 通过
npm run orchestration:check                           # 23+ 张卡一致（含本卡）
git diff src/components/NiuMaAvatar.tsx               # 应为空（§〇·quarter）
git diff src/index.css                                # 应为空（§〇·bis）
git diff src/lib/agentCore.ts                        # 应仅 R0-2 增量（getNiuMaEffectiveStatus 函数）
```

### 3.2 手工 smoke

| 测试 | 期望 |
|---|---|
| 控制舱下 `echo hello` 任务 | 桌面牧场 codex 动物切 `coding` → `done`，OS 通知显示 |
| 控制舱下 `exit 1` 任务 | codex 动物切 `coding` → `panicking`，OS 通知显示 |
| 控制舱下 `npm test`（10s+ 任务）| codex 动物 0~10% → `coding`；10~90% → 随机忙碌；100% → `done` |
| 控制舱下 `npm run deploy` | codex 动物 `coding` → `deploying`（含 deploy/release 关键字）|
| 8 张 PNG icon 显示 | OS 通知显示对应 agent 头像 |
| 关闭 system 通知偏好 | 下任务不再弹 OS 通知 |
| 桌面牧场 8 动物表情切换延迟 | < 500ms |

---

## 四、P0 工时汇总

| 子任务 | 工时 | 累计 |
|---|---|---|
| R0-1 IPC spawn | 2~3h | 2~3h |
| R0-2 状态映射接入 | 2~3h | 4~6h |
| R0-3 connectors enabled | 0.5h | 4.5~6.5h |
| R0-4 通知 icon 接通 | 1h | 5.5~7.5h |
| R0-5 README 措辞 | 0.2h | 5.7~7.7h |
| **P0 总计** | **5.7~7.7h ≈ 1 个工作日** | |

---

## 五、P0 风险与回退

| 风险 | 触发 | 回退 |
|---|---|---|
| `child_process.spawn` 注入风险 | 用户输入恶意命令 | 强制 `shell: false` + 命令白名单 |
| exitCode 监听不到 | 子进程被外部 kill | 主进程兜底 30s 超时 → error |
| 桌面牧场状态延迟 | 主进程 → renderer IPC 慢 | 已 < 500ms 验收基线 |
| connectors 默认 enabled 引发用户疑问 | "为啥我的 agent 真在跑" | README 措辞明确（任务 R0-5）|
| 8 张 PNG icon 缺失或格式错 | 用户删了 icon 目录 | Notification API 用默认 icon fallback（不报错）|

---

## 六、orchestration 登记

- 本卡路径：`docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`
- 引用本卡的文档：
  - `docs/orchestration/index.md`（P0 任务清单）
  - `docs/orchestration/status.json`（status: pending → in_progress）
  - `docs/orchestration/sessions/daily-plan-2026-07-03.md`（今日 P0 路线）
- 完成验收后：`status: in_progress` → `accepted`；`index.md` 加入 accepted 任务清单

---

> **本任务卡状态**：pending
> **触发实施**：用户说"开 P0-R0-1"或类似指令
> **配套 task card**：`docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md`（同步 P0 推进）
