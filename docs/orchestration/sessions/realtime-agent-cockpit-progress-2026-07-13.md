# realtime-agent-cockpit progress 2026-07-13

⟦tag:v2|session|realtime-agent-cockpit-progress-2026-07-13⟧

[长工]#realtime-requirements-control@v0.1
loop state: summarized
dispatch state: summarized
status: partial_acceptance_waiting_electron_e2e

## current truth

- 本地命令执行看板约 75%；真实多 Agent 实时控制舱暂记约 60%。已完成 blocked-safe runtime foundation、AgentInstance projection、renderer truth 接线和 SSR DOM state matrix，但仍没有真实 Electron Agent session E2E、production trusted authorizer 或可证明的生产进程重挂。
- Codex、Trae、Qoder machine-gate 维持 blocked；Codex 仍 `draft/pending/enabled=false`，Trae/Qoder 仍 placeholder。没有执行任何外部 Agent CLI。
- 8 个 seeds 只代表 configured 工位；浏览器 fallback 明确 `simulated/unavailable/browser-fallback`，online 永远为 0。

## implementation state

| lane | owner | state | acceptance |
| --- | --- | --- | --- |
| Requirements/control | `[长工]#realtime-requirements-control@v0.1` | active | control-plane docs updated；保持 C standby |
| P0-A runtime | `[长工]#realtime-connector-runtime@v0.1` | partial_accepted_blocked_safe_foundation | A1-A5 fixture/full gates 通过；无 production authorizer、无真实 reattach、未执行外部 CLI |
| P0-B selector | `[长工]#realtime-data-truth-projection@v0.1` | partial_accepted_selector | selector、边界、终态、duplicate、causality fixture 通过；由 renderer 消费 |
| P0-B renderer | `[长工]#realtime-truth-ui@v0.1` | partial_accepted_renderer_truth_slice | App/Home/Cockpit 订阅与真值标签、SSR fresh/late/stale/session-lost/capabilities unknown fixture、1280/1440/1920 fallback 视口和 Electron p95 通过；真实 E2E 待补 |
| P0-C Codex dry-run | PM + requirements control | standby | authorization_required，未执行 |

## completed

- 冻结 configured/discovered/online/busy/degraded/offline/unknown/simulated 词典、A/B 文件围栏和 P0-C 二次授权门禁。
- A1-A5：run/stop/session IPC、Codex `exec --json` Adapter、spawn handshake、heartbeat/process liveness、retry/backoff/budget、双阶段 termination、restart recovery/session-lost、persistence/audit、eventId/lifecycle 幂等、bounded output、publish 前脱敏、renderer trusted intent fail-closed。
- B selector：5 秒 fresh、15 秒 degraded/offline、terminal precedence、unique Session KPI、duplicate conflict fail-closed、`agentId + connectorId` identity、`lastSeen <= observedAt` 因果校验、task 四 ID 关联和输入不变性。
- B renderer：App 单点 runtime snapshot 订阅、1 秒 freshness tick、首页与控制舱 `configured != online`、source/sessionId/lastSeen/capabilities/mode/availability 真值详情；拟人状态明确标为“本地牧场表现/应用快照”。
- 浏览器独立复核：1280x720、1440x900、1920x1080 均 `scrollWidth == viewport width`。1920 控制舱实测 `scrollWidth=1920`、`scrollHeight=1080`、configured=8、真实在线 Session=0、runtime=`simulated/unavailable/browser-fallback`、本地命令 disabled、8 个模拟派活入口、CTA `inViewport=true`。
- Electron 传播复核：`npm.cmd run realtime:electron-latency` 使用真实 Electron main、production preload、renderer callback 与 DOM 可见状态，200 samples/10 warmups，p50=0.216ms、p95=0.421ms、max=1.564ms，预算 500ms；外部 Agent/Connector spawn=0。
- 代码与测试已分离提交为 `8fcc0a1 feat: add realtime agent cockpit foundation` 和 `6ac3239 test: add realtime truth renderer matrix`；用户原有 M5 `electron/main.ts` hunks 仍留在工作区，未纳入两次提交。

## incomplete

- production 不安装 `authorizeRun`；没有一次性主进程确认 token，也不允许 renderer 自证授权。
- production 不提供可证明的 `reattachProcess`；无重挂证明时 truthful 进入 `session-lost/exitConfirmed=false`，不能宣称无残留进程。
- 未进行 P0-C controlled dry-run、真实 Session E2E、8 Agent 长稳或 process-tree 生产验收。

## blockers

- P0-C 必须等待 A/B full acceptance、production authorizer/真实重挂和 PM/user 新消息中的第二次明确执行授权。
- Connector machine-gate 不得自动变更；任何真实 Adapter、trusted authorizer、PID/process-tree recovery 都要开独立任务。
- Electron `main.ts` M5 Day 1 dirty hunks 已保留且未提交；A/B realtime hunks 已隔离提交为 `8fcc0a1`、`6ac3239`，未 push。

## validation

- `node scripts/check-connector-runtime.mjs` -> passed；A1-A5、10/10 blocked、spawn handshake、termination、redaction、retry truth、evaluate-gate fail-closed。
- `node scripts/check-agent-instance-projection.mjs` -> passed；8/0、fresh/stale、terminal、duplicate、causality、simulation 和 task 四 ID。
- `node scripts/check-realtime-truth-renderer.mjs` -> passed；browser fallback、fresh、5 秒 late、15 秒 stale、session-lost、capabilities unknown 的真实控制舱 SSR DOM。
- `npm.cmd run realtime:truth-check` -> passed；selector + renderer truth 标准验收入口。
- `npm.cmd run realtime:electron-latency` -> passed；200 samples，p95=0.421ms <= 500ms，external spawn=0。
- `npm.cmd run lint` -> passed。
- `npm.cmd run build` -> passed。
- `npm.cmd run orchestration:check` -> passed；88 referenced cards。
- `npm.cmd run orchestration:report` -> passed。
- `npm.cmd run orchestration:preflight` -> passed；仅 discovery，未执行外部 CLI。
- `npm.cmd run orchestration:connector-safety` -> passed；blocked、无 raw passthrough、UI status-only。
- `git diff --check` -> passed。

## next action

- 保持 P0-C standby 和所有 machine-gate 原值。
- 补 production trusted authorizer、process-tree 重挂和真实 Agent E2E 证据；不得用 Electron fixture、SSR 或浏览器 fallback 替代真实 E2E。
- 保持 P0-C standby；没有第二次明确授权时不启用 Connector 或运行 Codex。

## callback

```text
completed: A1-A5 blocked-safe runtime、B selector、B renderer truth 接线、SSR DOM state matrix、1280/1440/1920 浏览器 fallback、Electron event p95 和全门禁。
incomplete: trusted authorizer、真实 reattach、P0-C/真实 Agent E2E。
blockers: machine-gate disabled；P0-C 需要 A/B full acceptance + 第二次明确执行授权。
next action: 保持 C standby，补 trusted authorizer/process-tree/真实 Agent E2E 证据，不以 fixture、SSR 或浏览器 fallback 替代真实 E2E。
evidence: docs/实时Agent控制舱需求与实施路线-v0.1-2026-07-13.md；A/B task cards；runtime/selector/renderer fixtures；Electron p95 200 samples；lint/build/orchestration gates；1280/1440/1920 browser DOM 与 1920 首屏 CTA 边界。
```
