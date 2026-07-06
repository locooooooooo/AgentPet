# daily-plan-2026-07-03

[PM]#daily-plan@2026-07-03

⟦tag:v2|session|daily-plan-2026-07-03⟧

loop state: summarized
dispatch state: summarized

> **计划日期**：2026-07-03（周五）
> **计划人**：Mavis（root session `mvs_5bb811db0b244b80a142de9d522cc90a`）
> **计划范围**：今日（2026-07-03）开发路线
> **关联任务卡**：
> - [ranch-real-integration-p0](../tasks/ranch-real-integration-p0-v0.1.md)
> - [cockpit-refactor-p0](../tasks/cockpit-refactor-p0-v0.1.md)
> - [ranch-m4-implementation-v0.2](../tasks/ranch-m4-implementation-v0.2.md)

---

## 〇、今日 P0 路线总览

| 时段 | 路线 | 任务 |
|---|---|---|
| **上午（11:30 ~ 12:30）** | **文档契约收口** | A/B/C/D 4 件事落文档 + README 措辞调整 |
| **下午（13:30 ~ 17:30）** | **P0 实施**（用户选） | 真实打通 P0（R0-1）**或** 控制舱重构 P0（C0-2）|
| **傍晚（17:30 ~ 18:00）** | **进度日志** | 写 `cockpit-refactor-p0-progress` / `ranch-real-integration-p0-progress` |

> **总可用工时**：约 5~6 小时有效开发时间
> **P0 总工时估计**：真实打通 ~ 6h / 控制舱重构 ~ 9h（**单日不能全部完成**，按用户拍板优先级）

---

## 一、上午路线（11:30 ~ 12:30）· 文档契约收口

> **目标**：ABCD 都落成文档契约，建立 P0 路线图。**不动代码**。

| 时段 | 任务 | 工时 | 产出 |
|---|---|---|---|
| 11:30 ~ 11:50 | A. 写桌面牧场需求 v0.3 修订说明（7 个偏离的文档对齐）| 20min | `docs/桌面牧场需求-v0.3-修订说明-2026-07-03.md` ✅ |
| 11:50 ~ 12:10 | C. 写主页面重构方案 v3.0（4 份并行方案收口）| 20min | `docs/主页面重构方案-v3.0-控制舱收口.md` ✅ |
| 12:10 ~ 12:20 | 真实打通 P0 task card | 10min | `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md` ✅ |
| 12:20 ~ 12:30 | 控制舱重构 P0 task card + README 措辞调整（D）| 10min | `docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md` ✅ + `README.md` ✅ |
| 12:30 ~ 12:45 | 写今日开发计划（本文件）| 15min | `docs/orchestration/sessions/daily-plan-2026-07-03.md` ✅ |

**上午产出**：5 份文档契约 + README 更新。**全部不依赖实施**，跑完即可挂入 P0 路线。

**登记**：
- `docs/orchestration/index.md` 加 2 张 P0 task card 引用
- `docs/orchestration/status.json` 加 2 张卡 `status: pending`

---

## 二、下午路线（13:30 ~ 17:30）· P0 实施

> **决策点**：用户拍板"今日优先 P0 哪一条"。

### 方案 X：**先开真实打通 P0**（推荐）

**理由**：真实打通是 §〇·quarter"卖点保护"的下游，价值 3 直接落地；改动收敛（仅 `electron/main.ts` + `agentCore.ts` + `connectors.json` + README）；工时 6h 内可控。

| 时段 | 子任务 | 工时 | 产出 |
|---|---|---|---|
| 13:30 ~ 13:45 | **R0-1 准备**：读 `electron/main.ts` 现有 `agents:create-task` handler | 15min | 现状梳理 |
| 13:45 ~ 16:45 | **R0-1 实施**：handler 接 `child_process.spawn` + stdout/stderr/exitCode 监听 | 3h | `electron/main.ts` 增量 |
| 16:45 ~ 17:15 | **R0-2 实施**：`getNiuMaEffectiveStatus` 接入（仅前 50% 子任务：状态映射函数 + 单元测试思路）| 30min | `src/lib/agentCore.ts` 增量 |
| 17:15 ~ 17:30 | 跑 `npm run lint && npm run build` + 写进度日志 | 15min | `docs/orchestration/sessions/ranch-real-integration-p0-progress.md` |

**下午产出**：
- R0-1 完成（IPC spawn 接通）
- R0-2 完成 50%（状态映射函数 + 接入，但 8 动物表情真实联动验收挪到明日）
- 进度日志登记

**明日延续**：R0-2 后 50% + R0-3 + R0-4 + R0-5（约 3~4h）

### 方案 Y：**先开控制舱重构 P0**

**理由**：用户是 UI 方向，关心视觉降噪 / 拟物化 / 视觉规范落地；P0-2 StatusStrip + P0-3 Tab 化直接落地"页面安静度"；中央 8 卡不动，价值 4 直接改善。

| 时段 | 子任务 | 工时 | 产出 |
|---|---|---|---|
| 13:30 ~ 13:45 | **C0-1 准备**：读 `src/components/NiuMaWorkspace.tsx` + `PortraitWorkspacePanel.tsx` 现状 | 15min | 现状梳理 |
| 13:45 ~ 15:45 | **C0-2 P0-1 实施**：orchestration 视觉权重分级 | 2h | `NiuMaWorkspace.tsx` + `index.css` 增量 |
| 15:45 ~ 17:00 | **C0-3 P0-2 实施**：StatusStrip 单行合并 | 1h15min | `src/components/StatusStrip.tsx` 新建 + 集成 |
| 17:00 ~ 17:30 | 跑 `npm run lint && npm run build` + 写进度日志 | 30min | `docs/orchestration/sessions/cockpit-refactor-p0-progress.md` |

**下午产出**：
- P0-1 完成（task card 视觉分级）
- P0-2 完成（StatusStrip）
- 进度日志登记

**明日延续**：P0-3（Tab 化，3h）+ P0-4（中央浮窗，1h）+ 卖点文件 0 字节确认（30min）

### 方案 Z：**两线并行**

> 不可行——单日工时 5h 不能同时跑两条 P0（真实打通 6h + 控制舱重构 9h = 15h）。

### 方案 W：**上午路线已完成，下午停一停**

**理由**：让用户 review 上午的 5 份文档 + 决定下午开哪一条；今日先收口契约，明日开 P0 实施。

---

## 三、傍晚路线（17:30 ~ 18:00）· 进度日志

| 文件 | 内容 |
|---|---|
| `docs/orchestration/sessions/ranch-real-integration-p0-progress.md` | R0-1 完成情况 + 剩余 R0-2~R0-5 工时估计 |
| `docs/orchestration/sessions/cockpit-refactor-p0-progress.md` | P0-1/P0-2 完成情况 + 剩余 P0-3/P0-4 工时估计 |
| `docs/orchestration/status.json` | 更新 2 张 P0 卡 `status: pending → in_progress`（如开实施）|

---

## 四、晚间路线（19:00 ~）· 自检与明日预告

| 任务 |
|---|
| 跑 `npm run orchestration:check`（含 2 张新 P0 卡）|
| 跑 `npm run lint && npm run build` |
| 在 `daily-supervision-2026-07-03.md` 写今日总结 |
| 明日 09:00 自我提醒：cron 启动今日延续 P0 |

---

## 五、不在今日范围（明确推迟）

| 项 | 推迟到 |
|---|---|
| P1 路线（操作按钮 hover 露 / Header 瘦身 / 卡片文案黑话化等）| 7-4 起按 P1 推进 |
| 桌面牧场 §〇·quinary §5 L3' hover 图标（v0.4 后续）| v0.4 |
| 桌面牧场 §〇·quinary 偏离 #3/#4/#5 实施回归 | 待用户拍板是否走 B 路径（改实施）|
| 控制舱重构 P2（数据管道流光 / 霓虹投影 / 工位装饰物 / 拖拽派活）| v0.4+ |
| 接外部 agent CLI（codex / trae / qoder / openclaw）| v0.4+ connector 扩展 |
| ranch-m4 命名 cascade 收尾 | 派工 `ranch-m4-implementation-v0.2` 继续 |

---

## 六、今日决策待办（**等用户拍板**）

| # | 决策点 | 候选 | 默认 |
|---|---|---|---|
| **Q1** | 下午 P0 优先级 | X 真实打通 / Y 控制舱重构 / W 停一停 | **X 真实打通**（价值 3 直接落地，工时可控）|
| **Q2** | 桌面牧场偏离 #3/#4/#5 实施回归（不只文档）| 走 B 路径改实施 / 维持 A 路径只改文档 | **A 路径**（已落文档契约）|
| **Q3** | 真实打通 R0-1 默认 connector 类型 | npm script / python 脚本 / shell 命令 | **shell 命令 + 强制 `shell: false` + 命令白名单** |
| **Q4** | 控制舱重构 P0-4 中央浮窗处置 | A 删 / B 挪右下角 | **A 删**（最克制；快捷键 Ctrl+Shift+B 唤回）|

> **等你拍 Q1（下午开哪条），其他默认走。**

---

## 七、orchestration 登记

- 本计划路径：`docs/orchestration/sessions/daily-plan-2026-07-03.md`
- 引用本计划的文档：
  - `docs/orchestration/index.md`（今日 active session）
  - `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`（今日 P0 候选 1）
  - `docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md`（今日 P0 候选 2）

---

> **本计划状态**：pending
> **触发实施**：用户拍 Q1 + 说"开 P0-R0-1"或"开 P0-C0-2"或"停一停"
> **预计今日产出**：5 份文档契约 + README 更新 + 1 条 P0 子任务实施（如开 X 或 Y）
