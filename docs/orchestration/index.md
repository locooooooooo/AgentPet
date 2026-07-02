# 多 Agent 牛马编排索引

[PM]#multi-agent-control@v0.1

loop state: active
dispatch state: active

read order:
1. `docs/orchestration/index.md`
2. `docs/orchestration/roles/pm.md`
3. `docs/orchestration/roles/supervisor.md`
4. tracked task cards under `docs/orchestration/tasks/`
5. tracked session cards under `docs/orchestration/sessions/`

tracked control cards:
- role: ⟦tag:v2|role|pm-control-v0.1⟧ -> `docs/orchestration/roles/pm.md`
- role: ⟦tag:v2|role|supervisor-control-v0.1⟧ -> `docs/orchestration/roles/supervisor.md`
- startup: `docs/orchestration/startup-prompt.md`
- callback template: `docs/orchestration/callback-summary-template.md`
- connector schema: `docs/orchestration/connectors.schema.json`
- connector config: `docs/orchestration/connectors.json`

tracked business cards:
- task: ⟦tag:v2|task|multi-agent-runtime-v0.1⟧ -> `docs/orchestration/tasks/multi-agent-runtime-v0.1.md`
- task: ⟦tag:v2|task|connector-policy-v0.1⟧ -> `docs/orchestration/tasks/connector-policy-v0.1.md`
- task: ⟦tag:v2|task|connector-acceptance-review-v0.1⟧ -> `docs/orchestration/tasks/connector-acceptance-review-v0.1.md`
- task: ⟦tag:v2|task|codex-evidence-closeout-v0.1⟧ -> `docs/orchestration/tasks/codex-evidence-closeout-v0.1.md`
- task: ⟦tag:v2|task|runtime-connector-dispatch-v0.1⟧ -> `docs/orchestration/tasks/runtime-connector-dispatch-v0.1.md`
- task: ⟦tag:v2|task|runtime-blocked-path-closeout-v0.1⟧ -> `docs/orchestration/tasks/runtime-blocked-path-closeout-v0.1.md`
- task: ⟦tag:v2|task|daily-decision-queue-2026-07-02⟧ -> `docs/orchestration/tasks/daily-decision-queue-2026-07-02.md`
- task: ⟦tag:v2|task|daily-role-accountability-2026-07-02⟧ -> `docs/orchestration/tasks/daily-role-accountability-2026-07-02.md`
- task: ⟦tag:v2|task|git-repair-agentpet-v0.1⟧ -> `docs/orchestration/tasks/git-repair-agentpet-v0.1.md`
- task: ⟦tag:v2|task|ranch-m4-requirements-v0.2⟧ -> `docs/orchestration/tasks/ranch-m4-requirements-v0.2.md`
- task: ⟦tag:v2|task|ranch-m4-implementation-v0.2⟧ -> `docs/orchestration/tasks/ranch-m4-implementation-v0.2.md`
- task: ⟦tag:v2|task|ranch-pointer-smoke-v0.2⟧ -> `docs/orchestration/tasks/ranch-pointer-smoke-v0.2.md`
- task: ⟦tag:v2|task|ranch-pointer-smoke-manual-evidence-v0.2⟧ -> `docs/orchestration/tasks/ranch-pointer-smoke-manual-evidence-v0.2.md`
- session: ⟦tag:v2|session|ranch-v0.2-2026-07-02⟧ -> `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md`
- session: ⟦tag:v2|session|daily-supervision-2026-07-02⟧ -> `docs/orchestration/sessions/daily-supervision-2026-07-02.md`
- session: ⟦tag:v2|session|git-manager-agentpet-2026-07-02⟧ -> `docs/orchestration/sessions/git-manager-agentpet-2026-07-02.md`
- session: ⟦tag:v2|session|main-thread-2026-07-01-runtime-bootstrap⟧ -> `docs/orchestration/sessions/main-thread-2026-07-01-runtime-bootstrap.md`
- session: ⟦tag:v2|session|runtime-blocked-path-closeout-2026-07-01⟧ -> `docs/orchestration/sessions/runtime-blocked-path-closeout-2026-07-01.md`
- session: ⟦tag:v2|session|codex-evidence-closeout-2026-07-01⟧ -> `docs/orchestration/sessions/codex-evidence-closeout-2026-07-01.md`

recently closed cards:
- accepted blocked-path lanes: ⟦tag:v2|task|connector-types-v0.1⟧, ⟦tag:v2|task|connector-main-gate-v0.1⟧, ⟦tag:v2|task|connector-preload-api-v0.1⟧, ⟦tag:v2|task|connector-ui-binding-v0.1⟧
- insufficient Codex acceptance evidence: ⟦tag:v2|task|codex-execution-evidence-v0.1⟧

dispatch gate:
- Dispatch only from an active task card, a waiting callback session, or an explicit user request.
- Default worker type is `[短工]` unless the user explicitly authorizes `[长工]`.
- PM owns dispatch, acceptance, correction, and close-out.
- Supervisor owns drift detection, blocker surfacing, and minimum correction.

current target:
- 按 LPS 建立角色分工，并持续监督各个角色推进“多 Agent 牛马核心部门”项目；今日督办重点是保持 M3 已收口、Git 管理长工回调已收且 Git repair standby 派工包已落成但修复待授权、connector acceptance review 已落成但 policy 待决不误报 active，M4 需求准入已总结为 standby 实现派工包，透明窗口 pointer smoke 与手工证据包均为 standby，日内决策队列与角色问责台账已落成。

current role split:
- `[PM]#multi-agent-control@v0.1`: maintain this index, dispatch bounded lanes, collect callbacks, write acceptance.
- `[监督]#multi-agent-control@v0.1`: audit index/task/session consistency and stop drift.
- `[短工]#local-runner@v0.1`: desktop local command runner implementation and verification.
- `[短工]#orchestration-ui@v0.1`: show current role split and supervision state inside the control cockpit.
- `[短工]#connector-policy@v0.1`: connector policy is drafted and visible; standby until PM/user accepts or revises machine gate fields.
- `[PM]#connector-acceptance-review@v0.1`: standby decision-review package for connector acceptance; no connector accepted, enabled, or executed.
- `[短工]#runtime-dispatch-cards@v0.1`: control-card setup for blocked-safe connector runtime implementation lanes.
- `[短工]#runtime-blocked-path-closeout@v0.1`: close accepted blocked-path lanes and hold before execution binding.
- `[短工]#codex-evidence-closeout@v0.1`: record Codex evidence result and keep acceptance pending.
- `[PM]#daily-decision-queue@2026-07-02`: standby PM queue for Git repair, connector acceptance, M4 dispatch, pointer smoke route, and live-subagent quota decisions.
- `[PM]#daily-role-accountability@2026-07-02`: standby ledger mapping each role to state, evidence, and accountability action.
- `[长工]#ranch-m1-m2-correction@v0.2`: corrected ranch M1/M2 drift; accepted for M3 entry after code/build/browser/Electron prefs evidence.
- `[长工]#ranch-m3-plan@v0.2`: read-only M3 plan complete; superseded by two active M3 implementation owners.
- `[监督]#ranch-v0.2-audit@v0.2`: pre-correction audit complete; findings are superseded by the current corrected worktree evidence.
- `[长工]#m3-main-bridge@v0.2`: summarized M3 owner for main/preload/types/browser fallback.
- `[长工]#m3-ranch-entry@v0.2`: summarized M3 owner for ranch renderer interactions.
- `[长工]#git-manager@AgentPet`: standby Git-management owner for `https://github.com/locooooooooo/AgentPet.git`; thread `019f20fc-9b77-74f3-aa3d-ba8348cdec1c` confirmed local `.git` is empty metadata and remote AgentPet is an empty repo, no repair/commit/push/reset without explicit confirmation.
- `[短工]#git-repair-agentpet@v0.1`: standby Git repair dispatch package; no `git init`, remote add, fetch, staging, commit, or push before explicit same-message authorization.
- `[PM]#ranch-m4-requirements@v0.2`: summarized docs-only requirements readiness for M4 rename/control-cockpit linkage.
- `[短工]#ranch-m4-implementation@v0.2`: standby implementation package for M4; no file edit before explicit dispatch.
- `[监督]#ranch-pointer-smoke@v0.2`: standby verification package for transparent ranch pointer smoke; no implementation edit.
- `[监督]#ranch-pointer-smoke-manual-evidence@v0.2`: standby manual evidence package for pointer-smoke callback recording; no pointer input executed yet.

blockers:
- External connector execution remains disabled; do not bind agentCore or run real Codex/Trae/Qoder connectors until connector policy is accepted.
- Treat service-side `403 DAILY_LIMIT_EXCEEDED` as a live sub-agent blocker until rechecked; today's Codex app long-worker threads were used only as explicit user-authorized role sessions.
- Control-cockpit selling-point files remain locked until M4 or explicit user approval.
- Transparent Electron ranch pointer smoke still needs a manual or alternate-capture route because Windows capture reports `SetIsBorderRequired failed`.

next action:
- Keep M3 code gates accepted as passed after `lint`, `build`, and `orchestration:check`; rerun transparent-window pointer smoke manually or through a capture route that does not hit `SetIsBorderRequired failed`.
- Keep connector policy and `connector-acceptance-review-v0.1` on standby until PM/user accepts or revises machine gate fields; do not dispatch connector execution binding.
- Keep AgentPet Git repair/commit decisions behind explicit user confirmation. The standby repair package is `docs/orchestration/tasks/git-repair-agentpet-v0.1.md`; if authorized, run only `git init -b main` -> `git remote add origin ...` -> `git fetch origin` -> `git status --ignored --short`, then stop for staging review.
- Do not touch control-cockpit selling-point files before M4.
- Keep M4 implementation package standby until PM/user explicitly dispatches implementation.
- Keep ranch pointer-smoke verification and `ranch-pointer-smoke-manual-evidence-v0.2` standby until a manual or alternate transparent-window capture route is available.
- Keep Codex draft/pending/enabled=false and Trae/Qoder placeholder/not-requested/enabled=false until connector machine gate fields change.
- Use `docs/orchestration/tasks/daily-decision-queue-2026-07-02.md` as the next PM callback surface for standby decisions.
- Keep `docs/orchestration/tasks/daily-role-accountability-2026-07-02.md` aligned with role states before closing any daily supervision pass.
