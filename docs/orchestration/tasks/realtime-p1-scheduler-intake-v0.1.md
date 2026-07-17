# realtime P1 scheduler intake v0.1

[短工]#realtime-p1-scheduler-intake@v0.1
⟦tag:v2|task|realtime-p1-scheduler-intake-v0.1⟧

loop state: standby
dispatch state: standby
status: ready_waiting_phase_gate_under_time_waiver
date: 2026-07-17
priority: P1-intake

## authorization boundary

- 管理员已明确豁免 Day 4 的日期门，仅授权提前冻结后续需求。
- 本卡是 docs-only intake，不授权产品实现、外部 Agent CLI、Connector machine-gate 修改或 P0-C controlled dry-run。
- scheduler-core 实现仍须等待 P0-C accepted，或管理员在新的明确消息中单独豁免 phase gate。
- 日期门豁免不是 phase waiver，也不是 Codex、Trae、Qoder 或其他外部 Agent 的执行授权。

## objective

冻结最小本地 scheduler-core 的行为合同、文件围栏、deterministic fixtures、失败矩阵与回滚面，使未来单一代码工人只能实现可预测的单并发队列，不得把该切片宣称为完整 P1 多 Agent 调度。

## existing capabilities

- Connector runtime 已有 main-owned authorization、policy gate、`shell: false`、workspace cwd 围栏和 env allowlist。
- 已有 run/stop/runtime snapshot/session audit/event publication 合同，以及 browser fallback 的 simulated/blocked 同形表面。
- 已有 timeout、cancel、规范化 retry、restart recovery、PID/process identity proof、heartbeat/liveness、输出背压、脱敏和单一终态保护。
- A7.1 asynchronous process proof 与 B2 controlled non-Agent production path 已验收；这些能力可复用，但不等同于 scheduler 或真实 Agent E2E。
- 当前 Connector machine gates 保持不可执行；外部 Agent CLI spawn count 仍为 `0`。

## minimum gaps

- `ConnectorRuntime.start()` 当前通过授权和 policy 后立即启动 attempt，没有全局队列或并发 admission。
- 当前 fixture 允许同一 Agent 同时存在多个 active Session，因此不满足单 Agent 单 running task。
- run request、Session 和 runtime state 没有 `dependsOn`、queued 状态、dependency-blocked 状态或 queue-wait 证据。
- queued task 无独立取消路径；依赖失败、取消和不存在时没有确定的下游决定。
- timeout 目前在 attempt 创建时启动，尚未严格冻结为从实际 process spawn confirmation 开始计时。
- priority、可配置并发、饥饿保护、取消 DAG、跨 Connector 配额不属于本次最小切片，必须继续列为 P1 incomplete。

## minimum scheduler contract

### admission and ordering

- 全局并发固定为 `1`；本切片不得增加配置入口。
- 同一 `AgentInstance` 最多一个 active task；即使未来提高全局并发，该约束仍必须独立成立。
- 通过 authorization 和 policy 的请求先创建 Session 并进入 `queued`，不得立即 spawn。
- ready task 使用稳定 FIFO：先比较 `queuedAt`，相同则按 `taskId` 字典序；不得依赖对象枚举顺序或 wall-clock 抖动。
- 调度只由 runtime 拥有；renderer、preload 和 UI 不得推断出队或终态。

### dependency contract

- 最小请求增加可选 `dependsOn: string[]`，只接受规范化、去重后的已登记 taskId。
- self、重复、未知或形成环的依赖必须 fail closed，并产生明确 reason；不得静默删除依赖后运行。
- 只有全部依赖进入 `success` 后任务才成为 ready。
- 任一依赖进入 `error`、`stopped`、`timed-out`、`permission-denied`、`policy-blocked` 或 `session-lost`，下游进入 `dependency-blocked`，spawn count 为 `0`。
- 当前任务取消后，未运行下游默认 dependency-blocked；本切片不自动级联取消，必须用事件记录该决定。

### time and lifecycle contract

- Session 增加 `queuedAt`；实际 spawn confirmation 后记录 `processStartedAt` 和 `queueWaitMs`。
- timeout 从 `processStartedAt` 开始；排队时间不得占用 process timeout。
- queued task 被 stop 时直接进入 `stopped`，无 PID、无 kill、无 spawn，并恰好产生一个 terminal event。
- active task 沿用现有 bounded termination；释放 active slot 后必须立即进行下一次确定性调度。
- dispose 后不得启动新任务；queued/retrying/recovering task 必须得到明确 terminal 或 recovery 决定。

### retry and audit contract

- retry 继续只由规范化 retryable failure 触发；cancel、policy block、permission denial 和 dependency failure不得自动 retry。
- retry attempt 必须复用原 task/session identity，不得和旧 process overlap。
- retry backoff 期间允许其他独立 ready task 使用全局 slot；backoff 结束后原任务按确定性规则重新参与调度。
- enqueue、dependency evaluation、dequeue、spawn confirmation、cancel decision、retry scheduling、slot release 和 terminal transition 都必须生成脱敏、持久化、sequence 单调的事件。
- UI 不得根据 queue length、日志或退出文本自行制造终态。

## exact future worker file fence

allowed:

- `src/types.ts`
- `src/lib/connectorRuntime.ts`
- `scripts/check-connector-scheduler.mjs`，仅用于 scheduler deterministic fixtures
- `docs/orchestration/sessions/realtime-p1-scheduler-core-evidence-2026-07-22.md`，仅记录 callback 与验收证据

forbidden:

- `electron/**`
- `src/lib/desktopClient.ts`
- `src/lib/agentCore.ts`
- `src/components/**`
- `src/homepage/**`
- `src/index.css`
- `src/ranch/**`
- `icon/**`
- `package.json`
- 除新建 `scripts/check-connector-scheduler.mjs` 外的 `scripts/**`
- `docs/orchestration/connectors.json` 的任何 machine-gate 字段
- `docs/orchestration/status.json` 的 `connectors[]`
- `README.md`
- `docs/牛马状态回执音效规范-v0.1.md`
- 任何外部 Agent CLI 执行、stage、commit、push、reset、clean 或 force-push

若实现必须修改 main/preload/Desktop API 或 UI，立即停止并回调 fence expansion request；不得在本 lane 静默扩围。

## deterministic fixtures

| ID | Fixture | Required result |
| --- | --- | --- |
| S-01 | 两个独立请求同时入队 | 同时 active/spawn 最多 `1`；第一个终态后第二个才 spawn |
| S-02 | 同 Agent 两个请求 | 第二个保持 queued，直到第一个释放 Agent slot |
| S-03 | 相同 `queuedAt` | 使用 `taskId` 稳定 tie-break，多次运行顺序一致 |
| S-04 | 单依赖成功 | 下游在依赖 success 前 spawn=0，之后恰好 spawn 一次 |
| S-05 | 多依赖成功 | 所有依赖 success 后才 ready |
| S-06 | 依赖 error/cancel/timeout | 下游 dependency-blocked，spawn=0，reason 和 audit 完整 |
| S-07 | unknown/self/duplicate/cycle | fail closed；0 spawn；无被静默忽略的边 |
| S-08 | queued cancel | 0 PID、0 kill、0 spawn、一个 terminal event |
| S-09 | active cancel | bounded termination 后释放 slot，下一 ready task 才能启动 |
| S-10 | timeout origin | queue wait 不消耗 timeout；spawn-confirmed 后才启动 timeout timer |
| S-11 | retryable failure | 旧 process close 后才 retry；无 overlap；预算/退避可审计 |
| S-12 | non-retryable failure | cancel/policy/permission/dependency 均 retry=0 |
| S-13 | retry backoff fairness | backoff 中独立 ready task 可运行，结束后原任务确定性回队 |
| S-14 | dispose/recovery | 无新 spawn、无残留 timer/process、每个非终态 Session 有明确结果 |
| S-15 | redaction/idempotency | secret 不进入 snapshot/event/persistence；每 Session 恰好一个 terminal |
| S-16 | external execution guard | fixture 仅使用 fake/controlled local process；外部 Agent CLI spawn=`0` |

## acceptance commands

```text
node scripts/check-connector-scheduler.mjs
node scripts/check-connector-runtime.mjs
node scripts/check-realtime-process-reattach.mjs
npm.cmd run realtime:truth-check
npm.cmd run orchestration:check
npm.cmd run orchestration:report
npm.cmd run orchestration:preflight
npm.cmd run orchestration:connector-safety
npm.cmd run lint
npm.cmd run build
git diff --check
```

验收还必须证明：Connector machine gates 无漂移、外部 Agent CLI spawn=`0`、同时 active process 最大值=`1`、同 Agent active 最大值=`1`、fixture S-01 至 S-16 全通过、工作树只包含允许文件。

## failure and rollback

- P0-C 未 accepted 且没有新的显式 phase waiver：保持 `ready_waiting_phase_gate_under_time_waiver`，不得派代码工人。
- 任一 fixture 失败：保持 implementation incomplete，不得写 accepted，也不得用 build/lint 代替行为证据。
- 发现第二个 active process、旧 attempt 未退出即 retry、queued task 发生 spawn 或依赖被静默忽略：立即停止本 lane，清理受控 fixture，并记录 task/session/PID/event 证据。
- 需要修改禁止文件：停止并向 PM 提交精确 expansion request，不先行实现。
- machine-gate 漂移或外部 Agent CLI 被调用：立即停止验收，保留负面证据并单独上报。
- 集成后的回滚只允许 PM 对独立 scheduler implementation commit 执行 `git revert`；worker 不执行 Git 写操作。
- 回滚后必须重跑 runtime/truth/orchestration/Connector safety/lint/build，并证明无残留 queued/running 假状态。

## worker callback

```text
completed:
incomplete:
blockers:
next action:
evidence:
changed files:
```

callback 必须列出 S-01 至 S-16 结果、最大并发计数、fake/controlled spawn 计数、外部 Agent CLI spawn 计数、terminal 重复计数、残留 process/timer、完整命令结果和精确 diff 文件。worker 不得自报 accepted，由 PM 独立验收。

## current decision

- docs-only Day 4 intake 已在日期门豁免下准备。
- scheduler-core 实现仍为 `waiting_phase_gate`。
- 在 P0-C accepted 或管理员新的明确 phase waiver 之前，不得修改产品代码、创建代码 worker 或执行外部 Agent CLI。
