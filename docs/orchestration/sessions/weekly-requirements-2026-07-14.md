# weekly-requirements-2026-07-14

[PM]#weekly-requirements@2026-07-14
⟦tag:v2|session|weekly-requirements-2026-07-14⟧
⟦tag:v2|session|weekly-requirements-w28⟧

loop state: summarized
dispatch state: summarized

> **计划周期**: 2026-07-14 ~ 2026-07-20 (W28)
> **当前状态**: summarized under the administrator's full schedule waiver on 2026-07-17; seven carry-over items remain non-blocking and separately gated
> **激活证据**: 2026-07-11 16:00 +08:00 W27 final closeout 已通过 fresh gates，并将 W27 summarized。
> **硬边界**: A7.1/B2 technical gates pass at PM visible-DOM p95 `7ms`; P0-C external execution still requires a new explicit authorization, and Connector machine gates remain unchanged.

---

## 〇、W27 closeout 上下文

- W27 closeout 真源: `docs/orchestration/sessions/weekly-closeout-2026-07-11.md`。
- 2026-07-10 管理员默认拍板已落档:
  - protected trailing whitespace 选择 ④,路由到 W28 bounded lane,本周不修。
  - M5 选择 ②,串行优先 `ranch-window-v0.2`,本周不启动 long-worker。
  - live-subagents quota 选择 ②,推到 W28,本周不主动复查。
  - R0-3 controlled dry-run 选择 ②,推到 W28,本周不执行 Codex。
- W27 已完成的 capture-only evidence、M5 docs-only readiness 和 cockpit v3.1 task intake 作为 W28 输入,不等同于实施验收。
- 2026-07-11 actual-time closeout 已完成: W27 summarized，W28 active；随后管理员授权将 M5 Day 1 提前至今天，M5 控制卡为 `active_ready_day1`，但尚未派 worker。
- 2026-07-12 truth refresh:唯一 Day 1 worker 已完成 allowed-scope 实现并回调；PM 未获得直接 tray lifecycle 证据，当前转为 `blocked_day1_acceptance`，未 commit/push，Day 2 未启动。
- 2026-07-14 administrator override: `跳过验收，继续推进进度`。缺失的 tray replay 保留为 residual risk，不伪写为通过；Day 1 correction 可在自动门禁后 commit/push，并放行同一 ranch-window worker 继续 Day 2。
- Pre-edit baseline: `HEAD == origin/main == b17c717`; 80-card orchestration check、report、preflight、connector-safety、lint、build 全绿。
- W27 遗留项保持分离：M5 serial implementation、direct pointer evidence、R0-3 execution-window confirmation、protected bounded disposition、quota recheck；没有任何一项因 W28 激活被自动接受。
- 2026-07-17 truth refresh: `HEAD == origin/main == c21a60b` at dispatch; bounded in-app short workers launched successfully, so the historical `403 DAILY_LIMIT_EXCEEDED` is no longer current availability truth. This does not authorize external Connectors.
- 2026-07-17 pointer evidence: gates and both Electron windows passed, but Computer Use screenshots failed with `SetIsBorderRequired failed (0x80004002)`; click-through, double-click, right-click, drag and dock remain blocked rather than accepted.
- v3.2 P1 `51d5501` and P2 `0dfaadf` are independently accepted/pushed; `c21a60b` live Codex Desktop Session count plus completion bubble/sound is completed and summarized.
- 2026-07-17 administrator date-gate waiver: the non-complete W28 closeout template and docs-only P1 scheduler intake were prepared early. This does not finalize W28, waive P0-C/phase gates or authorize any external Agent execution.
- 2026-07-17 full schedule/DDL decision: the administrator then compressed the entire later five-day board to today. W28 closes early through `weekly-closeout-2026-07-20.md`; the local scheduler phase dependency is waived, while P0-C and every external execution gate remain closed.

## 一、W28 P0 候选

| 优先级 | 候选 | 当前边界 | 激活前置 |
| --- | --- | --- | --- |
| P0-1 | M5 v0.2 五日串行实施 | Code-backed complete and pushed through `8df940c`; manual evidence retained as residual risk | No further M5 product action; preserve closeout during W28 buffer |
| P0-2 | Realtime Agent cockpit execution readiness | A7.1/B2 accepted at PM visible-DOM p95 `7ms` | Preserve accepted controlled-process boundary |
| P0-3 | A7.1 asynchronous process proof | accepted/pushed as `8866305` | Complete |
| P0-4 | P0-C Codex controlled dry-run | decision packet ready; authorization_required | New explicit execution authorization |
| P0-5 | Transparent ranch full pointer input evidence | capturePage 仅证明可见渲染;完整 pointer input 未 accepted | 明确 observer/automation route,保持 implementation 与 evidence 分离 |

## 二、W28 P1 候选

| 优先级 | 候选 | 当前边界 |
| --- | --- | --- |
| P1-1 | Protected trailing whitespace bounded lane | 2026-07-16 fresh audit found no current drift; closed docs-only with zero source edits |
| P1-2 | `cockpit-ui-redesign-v3.2` P1/P2 acceptance | Independently accepted on 2026-07-17; no new visual phase authorized |
| P1-3 | live-subagents availability | 2026-07-17 bounded in-app dispatch succeeded; historical 403 retained as history only, not a current blocker |
| P1-4 | M5 后续子卡串行队列 | M5 is closed; no further product worker is authorized during W28 buffer |
| P1-5 | Trae/Qoder Connector discovery | Trae adapter implemented but blocked by `Models is required`; Qoder rejected because no headless Agent API exists; production spawn remains 0 |

## 三、W28 P2 候选

- 桌面牧场 v0.4 外部 agent CLI / 多进程管理方案,继续受 R0-3 machine-gate 约束。
- `orchestration:report` 周期化输出,仅在不引入 connector execution 的前提下评估。
- ranch v0.3.1 bounded polish,只处理用户明确反馈,不主动扩展视觉重构。
- W27 文档归档与历史 wording 清理,不得改写 accepted evidence。

## 四、排期建议

| 日期 | 建议动作 |
| --- | --- |
| 2026-07-11 | Day 1:PM 派 `[长工]#ranch-window@v0.2`;完成 FR-001 lifecycle、default desktop、size/position/mode persistence |
| 2026-07-12 | Day 2:继续同一 ranch-window worker;完成召唤、desktop/floating、drag/dock/fence 与 Electron evidence;验收后 PM commit/push |
| 2026-07-13 | Day 3:仅在 ranch-window accepted/pushed 后派 `[短工]#ranch-status-script@v0.2` |
| 2026-07-14 | Day 4:仅在 status-script accepted/pushed 后派 `[短工]#ranch-personality@v0.2` |
| 2026-07-15 | Day 5:先派 `[短工]#ranch-fence-pointer@v0.2`;直接 pointer evidence accepted/pushed 后才派 `[短工]#ranch-system-notify@v0.2` |
| 2026-07-14 onward | Realtime A6 -> A7 -> B2 blocker -> A7.1 authorization/implementation -> B2 rerun，严格串行 |
| 2026-07-16 ~ 2026-07-20 | W28 buffer、P0-C 决策包与周 closeout 准备 |
| 2026-07-17 | Sync truth, independently review v3.2 P1/P2, archive blocked pointer evidence, and keep external execution gates closed |
| 2026-07-18 | Non-complete `weekly-closeout-2026-07-20.md` template was prepared early on 7-17 under the date-gate waiver; preserve it as standby and non-final |
| 2026-07-19 | Run one read-only pre-closeout audit plus fresh full gates; freeze owners, prerequisites and evidence |
| 2026-07-20 | After the real time gate, finalize W28, summarize the weekly role/session, commit/push control truth and prove clean parity |
| 2026-07-21 | Docs-only P1 scheduler intake was prepared early on 7-17 under the date-gate waiver; preserve `ready_waiting_phase_gate` and the exact contract/file/failure boundaries |
| 2026-07-22 | Dispatch at most one scheduler-core worker only if the intake is accepted and the P0-C/phase-waiver gate is satisfied; otherwise record `waiting_phase_gate` |

acceptance:
- 本卡已在真实 W27 closeout 后切换为 `active`。
- P0/P1/P2 候选与 2026-07-11 ~ 2026-07-20 滚动排期存在。
- `docs/orchestration/index.md`, `docs/orchestration/status.json`, and `daily-role-accountability-2026-07-02.md` track this active role。
- 管理员已将 M5 Day 1 日历门改为 2026-07-11；M5 implementation 仍仅由五日总控、今日 fresh baseline 和逐卡 bounded dispatch 授权。
- Codex 内部子 agent 是授权 worker 机制;protected source red point is closed with no current drift, while connector execution and machine-gate edits remain separately gated.
- `npm.cmd run orchestration:check` passes。
- The early W28 template has zero checked acceptance items, and the scheduler intake changes no product code or Connector machine gate.

next action:
- M5 已收口并推送；保留直接 tray/pointer 与 Windows notification visibility 残余风险，不重开产品 lane。
- A7.1 `8866305` 与 B2 已验收推送；提交/推送控制面后不派 runtime worker，等待新的 P0-C 明确执行授权。
- Protected source is closed with no current drift; in-app worker availability was refreshed successfully, while pointer input remains blocked by the Windows screenshot/input binding route.
- Preserve independently accepted v3.2 P1/P2 evidence; do not open another visual phase without a new bounded scope.
- Preserve `weekly-closeout-2026-07-20.md` as a non-complete template; do not finalize it before fresh evidence and the real final gate.
- Preserve `realtime-p1-scheduler-intake-v0.1.md` as requirements-only; do not treat its conditional Day 5 route as current implementation authorization.
- Keep Trae draft/pending/disabled until Models is configured and a new read-only smoke is authorized; keep Qoder disabled/rejected until a headless API exists.
- Current weekly ownership transfers to `weekly-requirements-2026-07-21.md`, activated early with DDL 2026-07-17 for the bounded local scheduler slice.

summary:
- W28 summarized early under the administrator's full schedule waiver; completed inputs remain accepted, seven carry-over items remain non-blocking, and P0-C remains unexecuted behind a fresh explicit authorization gate.
