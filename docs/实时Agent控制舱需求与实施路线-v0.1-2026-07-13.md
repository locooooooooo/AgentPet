# 实时 Agent 控制舱需求与实施路线 v0.1

date: 2026-07-13
owner: `[长工]#realtime-requirements-control@v0.1`
status: implementation_in_progress

## 1. 结论

当前产品不是“真实多 Agent 实时控制舱”，而是“可执行本地命令的控制舱 + 静态编排状态 + 浏览器模拟 fallback”。

- 以“本地命令执行看板”为目标，当前约完成 **75%**。
- 以“真实多 Agent 实时控制舱”为目标，当前约完成 **35%**。
- 剩余约 **65%**，拆为 P0-A Connector runtime、P0-B data truth/UI、P0-C Codex controlled dry-run/acceptance，以及后续 P1/P2 扩展。
- 本轮需求控制工作不执行任何外部 Agent CLI，不把命令可发现等同于在线、可用或已验收。

完成度只能在量化门禁通过后上调。任务卡创建、类型声明、CLI 可发现、进程启动或 UI 出现“在线”字样，都不能单独证明实时控制能力完成。

## 2. 当前真相基线

### 2.1 已经具备

| 能力 | 当前状态 | 说明 |
| --- | --- | --- |
| 控制舱 UI、任务表单、日志、停止入口 | available | 可操作，但部分数据仍来自种子或静态控制面 |
| Electron 本地命令 runner | partial | 已有 spawn、PID、stdout/stderr、退出码和停止路径 |
| Connector policy/gate | blocked-safe | 可以评估 gate，但不能通过 Connector API 运行 |
| `ConnectorRunRequest` 类型 | declared-only | 类型存在，不等于 Desktop API、preload、main handler 已接通 |
| 浏览器 fallback | simulated | 每 2.5 秒模拟 tick，创建任务被强制为 `simulated` |
| 编排状态文档 | available | `status.json` 是人工控制面，不是 Agent 心跳探针 |

### 2.2 关键缺口

| 缺口 | 当前事实 | 用户风险 |
| --- | --- | --- |
| 在线真值 | Agent 数组/种子工位仍可被误读为在线数 | 假在线、假忙碌 |
| Session | 无统一 `sessionId`、`lastSeen`、`capabilities`、`source` | 无法区分配置项和真实实例 |
| Connector runtime | Desktop API 仅暴露 `evaluateConnectorGate` | 无 run/stop/status/events 合同 |
| 事件流 | stdout/stderr 与业务状态未形成统一结构事件 | 无法可靠审计、恢复或驱动 UI |
| 心跳与发现 | 无 Agent heartbeat/process discovery | 进程消失后 UI 可能继续显示可用 |
| 生命周期控制 | timeout/cancel/retry/restart recovery 不完整 | 失控进程、假完成、重启丢任务 |
| 调度 | 无统一并发、优先级、依赖、重试预算 | 多任务互相踩踏 |
| 安全与审计 | 有白名单/gate，但无完整 runtime isolation/audit | 参数注入、越权目录、证据缺失 |
| 模式标识 | browser/Electron、real/simulated/configured 未明确分层 | 用户无法判断数据可信度 |

### 2.3 本机命令发现快照

以下是进入本轮前的只发现评估；本轮未重新调用或执行这些外部 CLI：

| CLI | 发现状态 | 是否是当前项目 Connector | 是否允许执行 |
| --- | --- | --- | --- |
| `codex` | 可发现 | 是，`draft/pending` | 否；等待 controlled dry-run 二次授权 |
| `openclaw` | 可发现 | 否 | 否；P1 才能建 Adapter/Policy |
| `claude` | 可发现 | 否 | 否；P1 才能建 Adapter/Policy |
| `minimax` | 可发现 | 否 | 否；P1 才能建 Adapter/Policy |
| `trae` | 未发现 | 是，command-empty placeholder | 否 |
| `qoder` | 未发现 | 是，command-empty placeholder | 否 |
| `opencode` | 未发现 | 否 | 否 |

当前项目只定义 **3 个 Connector**：Codex、Trae、Qoder。三者当前均不可执行：Codex 为 `draft/pending/enabledByDefault=false`；Trae/Qoder 为 `placeholder/command-empty/not-requested/enabledByDefault=false`。本路线不修改这些 machine-gate 字段。

## 3. 真值词典

控制舱必须把以下概念分开，禁止继续合并成“在线”：

| 字段/状态 | 定义 | 可用证据 |
| --- | --- | --- |
| `configured` | 项目配置了一个 Agent 工位或 Connector 条目 | 静态配置、种子数据 |
| `discovered` | 可执行文件或服务入口可被发现 | 只读 discovery 结果 |
| `reachable` | 一次受控健康检查成功 | 探针时间、结果、延迟 |
| `online` | 有存活 Session，心跳未过期，来源可验证 | `sessionId + lastSeen + source` |
| `busy` | 在线 Session 正在执行已登记任务 | `taskId + runtime state` |
| `degraded` | Session 存活，但事件、权限、配额或健康异常 | 原因码、最近成功时间 |
| `offline` | 无 Session、进程已退出或心跳超时 | 退出事件或 TTL 超时 |
| `simulated` | 数据来自浏览器 fallback/测试 fixture | `source=simulation` |
| `unknown` | 缺少足够证据 | 必须保守显示，不得猜在线 |

顶部指标建议使用：`已配置工位`、`实时在线`、`执行中`、`阻塞/降级`。若数据源仍是种子数组，只能计入“已配置工位”。

## 4. 目标合同

### 4.1 AgentInstance

P0 必须建立独立于展示身份的运行实例：

```ts
interface AgentInstance {
  instanceId: string;
  agentId: string;
  connectorId: string;
  state: 'configured' | 'online' | 'busy' | 'degraded' | 'offline' | 'unknown';
  sessionId?: string;
  pid?: number;
  capabilities: string[];
  source: 'electron-runtime' | 'process-discovery' | 'remote-heartbeat' | 'simulation' | 'static-config';
  connectedAt?: string;
  lastSeen?: string;
  lastEventAt?: string;
  degradationReason?: string;
}
```

规则：

- `AGENT_SEEDS` 只定义展示身份和已配置工位，不产生 `online`。
- `online/busy/degraded` 必须有未过期的 `lastSeen` 和非静态 `source`。
- `sessionId` 在一次 Connector 会话内稳定，重连后必须变化或提供明确 continuation ID。
- `capabilities` 来自 Adapter/握手，不从 Agent 名称猜测。
- UI 必须展示 source、采样时间和模式；未知值不得填默认成功值。

### 4.2 Connector runtime API

P0 需要至少提供以下受控合同，具体 IPC 名可在实现时统一，但语义不得缺失：

```text
connectors:run(request) -> blocked | started(sessionId, taskId)
connectors:stop(sessionId, reason) -> stopping | stopped | not-found
connectors:status(sessionId?) -> ConnectorSession[]
connectors:events:subscribe -> ConnectorEvent
connectors:events:unsubscribe
```

`run` 请求不能接受渲染层传入任意 command/args/env。main 进程必须从已验收 policy 和 Adapter 生成命令；renderer 只能提交 task、connector、workspace 和授权上下文。

### 4.3 结构化事件

统一事件至少包含：

```ts
interface ConnectorEvent {
  eventId: string;
  sequence: number;
  timestamp: string;
  connectorId: string;
  agentId: string;
  sessionId: string;
  taskId?: string;
  type: 'session-started' | 'heartbeat' | 'log' | 'progress' | 'tool-call' |
    'approval-required' | 'artifact' | 'retrying' | 'completed' | 'failed' |
    'cancelled' | 'timed-out' | 'session-lost';
  source: 'real' | 'simulation' | 'fixture';
  payload: unknown;
}
```

要求：

- 同 Session `sequence` 单调递增；重复事件可以按 `eventId` 幂等处理。
- stdout/stderr 只是 `log` 事件来源，不能直接代表任务成功。
- 完成态必须来自进程退出、Adapter 终态或受控取消结果。
- 日志脱敏后再进入 renderer 和持久化；秘密、token、完整环境变量不得输出。

## 5. P0 需求

### P0-A Connector runtime

| ID | 需求 | 完成定义 |
| --- | --- | --- |
| RT-A01 | run/stop/status/events IPC | main/preload/types/browser fallback 合同完整；blocked path 不产生进程 |
| RT-A02 | Codex Adapter | 非交互参数、事件解析、退出状态、能力声明可被 fixture 验证 |
| RT-A03 | heartbeat/process discovery | 进程存活和心跳分别记录；静态 discovery 不产生 online |
| RT-A04 | timeout/cancel | 超时进入 `timed-out`；取消进入 `cancelled`；子进程可回收 |
| RT-A05 | retry policy | 只重试明确的可重试故障；默认 0 次；有退避和预算 |
| RT-A06 | restart recovery | 重启后重新挂接可确认实例，否则标记 `session-lost`，不得假装 running |
| RT-A07 | structured event transport | 顺序、幂等、脱敏、订阅清理和终态完整 |

### P0-B Data truth/UI

| ID | 需求 | 完成定义 |
| --- | --- | --- |
| RT-B01 | AgentInstance projection | configured/discovered/online/busy/degraded/offline/unknown 分层 |
| RT-B02 | 指标去假 | 在线数只统计未过期真实 Session；种子数显示为已配置工位 |
| RT-B03 | 来源与时间 | 关键指标和 Agent 详情展示 source、lastSeen、更新时间 |
| RT-B04 | real/simulated 标识 | 浏览器 fallback 全局显示模拟模式，禁止伪装真实运行 |
| RT-B05 | 降级/空态 | runtime unavailable、policy blocked、heartbeat stale、session lost 有明确状态 |
| RT-B06 | 任务与 Session 关联 | taskId/sessionId/agentId/connectorId 可追踪，终态一致 |

### P0-C Codex controlled dry-run / acceptance

| ID | 需求 | 完成定义 |
| --- | --- | --- |
| RT-C01 | 执行前门禁 | A/B 通过静态与 fixture 验收；PM/user 明确第二次授权执行窗口 |
| RT-C02 | blocked-path E2E | 未确认、未验收、策略关闭时 100% 阻止启动且留审计 |
| RT-C03 | controlled dry-run | 只读、限定 cwd/env/timeout 的 Codex 非交互任务完整闭环 |
| RT-C04 | 生命周期 E2E | started -> events -> completed/failed/cancelled/timed-out 可观测 |
| RT-C05 | 重启/丢失 E2E | 可恢复则重挂；不可恢复则 `session-lost`，无假 running |
| RT-C06 | 证据包 | 请求、gate、PID/session、事件序列、终态、清理、截图和命令日志齐全 |

P0-C 当前为 `standby`。本需求整理工作不构成执行授权，不调用 `codex`，也不改变 connector approval/enabled/command。

## 6. P1 与 P2

### P1：可扩展的真实多 Agent 调度

- 为本机可发现但未注册的 OpenClaw、Claude、MiniMax 分别建立 Adapter 和独立 policy acceptance。
- Trae/Qoder/OpenCode 在可执行入口和非交互协议被真实发现前保持 unavailable，不创建假在线工位。
- 引入每 Connector/Agent/全局并发上限、优先级、依赖 DAG、取消传播、重试预算和队列饥饿保护。
- 增加审批事件、配额/速率限制、artifact 索引和会话历史查询。
- 建立每个 Adapter 的契约测试和故障 fixture。

### P2：稳定性与运营

- 运行隔离：最小环境变量、cwd 围栏、命令模板、输出大小上限、秘密脱敏。
- 审计检索、保留周期、异常告警、崩溃恢复、版本迁移和数据清理。
- 大日志背压、断连重放、多窗口订阅一致性、性能与资源预算。
- 8 Agent 规模的长稳测试、故障注入和升级/回滚演练。

## 7. 队列与调度规则

P0 至少实现单 Connector 的可预测调度：

- 默认全局并发 `1`，配置上限在 P1 再开放。
- 同一 `AgentInstance` 同时最多一个 running task。
- 任务支持 `dependsOn: taskId[]`；依赖失败时下游进入 `blocked`，不得静默运行。
- timeout 从进程实际 started 计时，排队时间单独记录。
- cancel 向当前任务传播；依赖于它的未运行任务保持 blocked 或按用户选择取消。
- retry 只能由规范化错误码触发，用户取消、策略阻止、权限拒绝不得自动重试。
- 所有状态转换写入审计事件，禁止 UI 本地自行猜终态。

## 8. 安全、隔离与审计

- renderer 不得传入最终 shell command；禁止 `shell: true`。
- command、args、cwd、env 来自 Adapter + accepted policy；env 只保留 allowlist。
- cwd 必须解析后位于 workspace root 或明确批准目录内。
- 默认需要显式用户动作；写操作遵循 `required-for-write`。
- 未通过 gate 时 discovery 次数可以记录，spawn 次数必须为 0。
- 每个 run/stop/retry/timeout/recovery 写入不可变审计条目：actor、time、request、decision、session、result。
- 审计和日志在持久化前脱敏；token、Cookie、密钥和完整 prompt secret 不进入 UI。
- 浏览器 fallback 不得执行外部进程；只能模拟并醒目标明 `simulation`。

## 9. 量化门禁

| 门禁 | 阈值 |
| --- | --- |
| 假在线 | 0；无有效 Session 时 `online=0`，即使配置了 8 个工位 |
| 心跳新鲜度 | 默认 5 秒内为 fresh；15 秒无心跳转 degraded/offline，阈值可配置且 UI 可见 |
| 事件延迟 | 本地事件从 main 产生到 renderer 可见 p95 <= 500ms |
| 事件完整性 | 每个 Session 恰好一个 started 和一个终态；sequence 无倒退 |
| blocked path | 10/10 fixture 请求不 spawn；均有 blocked reason 和审计 |
| cancel | 1 秒内返回 stopping/cancelled 接收态，5 秒内进程退出或明确升级失败 |
| timeout | 到点后 5 秒内进入 timed-out 终态并完成清理 |
| restart recovery | 应用恢复后 10 秒内重挂或标记 session-lost；不得保留假 running |
| 来源标识 | 100% 顶部 KPI 与 Agent 详情可追溯 source/lastSeen |
| fallback | 浏览器模式 100% 显示 simulation，Connector run 恒为 blocked |
| 审计 | 100% run/stop/retry/timeout/recovery 决策可按 sessionId 查询 |
| E2E | P0-C 矩阵全部通过，0 个高危残留进程，0 个未解释终态 |

## 10. 工人拆分与依赖

| 工人 | 状态 | 职责 | 依赖 |
| --- | --- | --- | --- |
| `[长工]#realtime-connector-runtime@v0.1` | active | P0-A：运行时、IPC、Adapter、事件、生命周期、安全 | 先冻结共享合同 |
| `[长工]#realtime-truth-ui@v0.1` | active | P0-B：真值投影、指标、来源/时间、降级与模拟标识 | 消费 A 冻结的类型，不改 runtime |
| `[长工]#realtime-requirements-control@v0.1` | active | 需求、文件围栏、验收矩阵、回调与漂移控制 | 不执行外部 CLI |
| P0-C controlled dry-run | standby | PM 验收与 Codex 受控 E2E | A/B callback + 二次执行授权 |

共享合同规则：

1. A 拥有 `src/types.ts`、`src/lib/connectorRuntime.ts`、`electron/main.ts`、`electron/preload.ts`、`src/lib/desktopClient.ts` 的 runtime 合同，并只可新增/修改两项 Connector 专用静态验收脚本。
2. B 不并行修改上述文件；先用已冻结合同消费 `AgentInstance`/event projection。
3. `electron/main.ts` 现有 M5 Day 1 未提交改动必须保留；A 只能在自己的 hunk 内工作，回调列出基线与新增 diff。
4. 两个代码工人不得 stage/commit/push/reset/clean；由 PM 在独立验收后决定集成。
5. C 只改 `docs/**`，不修改产品实现和 Connector machine-gate。

## 11. 文件围栏

### P0-A 允许

- `src/types.ts`
- `src/lib/connectorRuntime.ts`
- `electron/main.ts` 的 Connector runtime 独立区域
- `electron/preload.ts`
- `src/lib/desktopClient.ts`
- `scripts/check-preload-connector-api.mjs`
- `scripts/check-connector-runtime.mjs`
- P0-A 进度/验收文档

### P0-B 允许

- `src/components/NiuMaWorkspace.tsx`
- `src/components/StatusStrip.tsx`
- `src/homepage/hooks/useHomePageData.ts` 仅同步首页指标的真实语义
- `src/index.css` 仅状态来源、模拟/降级标识所需规则
- P0-B 进度/验收文档

### 全局禁止

- 修改 `docs/orchestration/connectors.json` 的 machine-gate 字段。
- 修改 `docs/orchestration/status.json` 的 `connectors[]`。
- 执行 Codex/Trae/Qoder/OpenClaw/Claude/MiniMax/OpenCode CLI。
- 修改 `package.json`、A 明确两项专用验收脚本之外的 `scripts/**`、`src/ranch/**`、`src/components/NiuMaAvatar.tsx`、`src/lib/agentCore.ts`、`icon/**`。
- 覆盖、删除或提交现有 `electron/main.ts` M5 Day 1 改动。
- stage、commit、push、reset、clean、force-push。

## 12. 失败与回滚

- gate 或 fixture 失败：保持 implementation_in_progress，不得写 accepted。
- A/B 合同冲突：暂停 B 的共享合同消费，由 C 记录差异，A 先冻结唯一版本。
- runtime 产生未知进程：立即停止新调度，尝试按 PID/session 清理，并记录残留；不继续 UI 验收。
- recovery 无法证明：Session 标记 `session-lost`，禁止恢复为 running。
- 数据来源不明：回退为 `unknown` 或 `simulated`，不得回退成 online。
- Connector policy 漂移：停止本 lane，将 machine-gate diff 单独上报，不混入实现。
- 集成回滚使用独立实现 commit 的 `git revert`，但只有 PM 在未来提交后可执行；长工本身不运行 Git 写操作。

## 13. 工时估算

| 目标 | 估算 | 范围 |
| --- | --- | --- |
| 单 Codex 实时 MVP | 4-6 开发日 | P0-A/B/C，单并发、受控 dry-run |
| 接通本机 3 个已有候选 Agent | 8-12 开发日 | Codex + 另外两个完成 policy/Adapter/验收的 CLI |
| 稳定 8 Agent 控制舱 | 12-20 开发日 | 多 Adapter、调度、安全、恢复、长稳测试 |

估算前提：Adapter 有稳定非交互协议，认证可用，且不被服务配额阻塞。Trae/Qoder/OpenCode 当前未发现，不计入可立即开工的 Adapter 数。

## 14. 固定回调

每个工人必须只按以下结构回调，并在 evidence 中给出文件、命令、截图/事件样本和未通过项：

```text
completed:
incomplete:
blockers:
next action:
evidence:
```

“代码已写”“build 通过”“CLI 可发现”都不能单独作为 accepted。PM 必须按 P0-C E2E 证据独立验收。
