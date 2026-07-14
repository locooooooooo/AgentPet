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
- task: ⟦tag:v2|task|git-staging-review-agentpet-v0.1⟧ -> `docs/orchestration/tasks/git-staging-review-agentpet-v0.1.md`
- task: ⟦tag:v2|task|ranch-m4-requirements-v0.2⟧ -> `docs/orchestration/tasks/ranch-m4-requirements-v0.2.md`
- task: ⟦tag:v2|task|ranch-m4-implementation-v0.2⟧ -> `docs/orchestration/tasks/ranch-m4-implementation-v0.2.md`
- task: ⟦tag:v2|task|ranch-window-v0.1⟧ -> `docs/orchestration/tasks/ranch-window-v0.1.md`
- task: ⟦tag:v2|task|ranch-status-script-v0.1⟧ -> `docs/orchestration/tasks/ranch-status-script-v0.1.md`
- task: ⟦tag:v2|task|ranch-personality-v0.1⟧ -> `docs/orchestration/tasks/ranch-personality-v0.1.md`
- task: ⟦tag:v2|task|ranch-m5-requirements-v0.2⟧ -> `docs/orchestration/tasks/ranch-m5-requirements-v0.2.md`
- task: ⟦tag:v2|task|ranch-window-v0.2⟧ -> `docs/orchestration/tasks/ranch-window-v0.2.md`
- task: ⟦tag:v2|task|ranch-status-script-v0.2⟧ -> `docs/orchestration/tasks/ranch-status-script-v0.2.md`
- task: ⟦tag:v2|task|ranch-personality-v0.2⟧ -> `docs/orchestration/tasks/ranch-personality-v0.2.md`
- task: ⟦tag:v2|task|ranch-fence-pointer-v0.2⟧ -> `docs/orchestration/tasks/ranch-fence-pointer-v0.2.md`
- task: ⟦tag:v2|task|ranch-system-notify-v0.2⟧ -> `docs/orchestration/tasks/ranch-system-notify-v0.2.md`
- task: ⟦tag:v2|task|ranch-pointer-smoke-v0.2⟧ -> `docs/orchestration/tasks/ranch-pointer-smoke-v0.2.md`
- task: ⟦tag:v2|task|ranch-pointer-smoke-manual-evidence-v0.2⟧ -> `docs/orchestration/tasks/ranch-pointer-smoke-manual-evidence-v0.2.md`
- task: ⟦tag:v2|task|ranch-real-integration-p0-v0.1⟧ -> `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`
- task: ⟦tag:v2|task|ranch-real-integration-r0-3-dryrun-v0.1⟧ -> `docs/orchestration/tasks/ranch-real-integration-r0-3-dryrun-v0.1.md`
- task: ⟦tag:v2|task|protected-cockpit-source-drift-v0.1⟧ -> `docs/orchestration/tasks/protected-cockpit-source-drift-v0.1.md`
- task: ⟦tag:v2|task|cockpit-refactor-p0-v0.1⟧ -> `docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md`
- task: ⟦tag:v2|task|cockpit-ui-redesign-v3.1-v0.1⟧ -> `docs/orchestration/tasks/cockpit-ui-redesign-v3.1-v0.1.md`
- task: ⟦tag:v2|task|cockpit-ui-redesign-v3.2-v0.1⟧ -> `docs/orchestration/tasks/cockpit-ui-redesign-v3.2-v0.1.md`
- session: ⟦tag:v2|session|cockpit-ui-redesign-v3.2-progress⟧ -> `docs/orchestration/sessions/cockpit-ui-redesign-v3.2-progress.md`
- session: ⟦tag:v2|session|cockpit-ui-redesign-v3.2-acceptance-2026-07-13⟧ -> `docs/orchestration/sessions/cockpit-ui-redesign-v3.2-acceptance-2026-07-13.md`
- task: ⟦tag:v2|task|realtime-agent-cockpit-v0.1⟧ -> `docs/orchestration/tasks/realtime-agent-cockpit-v0.1.md`
- task: ⟦tag:v2|task|realtime-agent-cockpit-p0-a-connector-runtime-v0.1⟧ -> `docs/orchestration/tasks/realtime-agent-cockpit-p0-a-connector-runtime-v0.1.md`
- task: ⟦tag:v2|task|realtime-agent-cockpit-p0-b-data-truth-v0.1⟧ -> `docs/orchestration/tasks/realtime-agent-cockpit-p0-b-data-truth-v0.1.md`
- task: ⟦tag:v2|task|realtime-agent-cockpit-p0-c-codex-acceptance-v0.1⟧ -> `docs/orchestration/tasks/realtime-agent-cockpit-p0-c-codex-acceptance-v0.1.md`
- session: ⟦tag:v2|session|realtime-agent-cockpit-progress-2026-07-13⟧ -> `docs/orchestration/sessions/realtime-agent-cockpit-progress-2026-07-13.md`
- task: ⟦tag:v2|task|m5-longworker-dispatch-v0.1⟧ -> `docs/orchestration/tasks/m5-longworker-dispatch-v0.1.md`
- task: ⟦tag:v2|task|homepage-ui-p0-v0.1⟧ -> `docs/orchestration/tasks/homepage-ui-p0-v0.1.md`
- task: ⟦tag:v2|task|homepage-ui-p0-dispatch-v0.1⟧ -> `docs/orchestration/tasks/homepage-ui-p0-dispatch-v0.1.md`
- session: ⟦tag:v2|session|ranch-v0.2-2026-07-02⟧ -> `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md`
- session: ⟦tag:v2|session|daily-supervision-2026-07-02⟧ -> `docs/orchestration/sessions/daily-supervision-2026-07-02.md`
- session: ⟦tag:v2|session|daily-plan-2026-07-03⟧ -> `docs/orchestration/sessions/daily-plan-2026-07-03.md`
- session: ⟦tag:v2|session|daily-plan-2026-07-09⟧ -> `docs/orchestration/sessions/daily-plan-2026-07-09.md`
- session: ⟦tag:v2|session|daily-plan-2026-07-10⟧ -> `docs/orchestration/sessions/daily-plan-2026-07-10.md`
- session: ⟦tag:v2|session|daily-supervision-2026-07-03⟧ -> `docs/orchestration/sessions/daily-supervision-2026-07-03.md`
- session: ⟦tag:v2|session|daily-longworker-dispatch-2026-07-03⟧ -> `docs/orchestration/sessions/daily-longworker-dispatch-2026-07-03.md`
- session: ⟦tag:v2|session|cockpit-statusstrip-2026-07-03⟧ -> `docs/orchestration/sessions/cockpit-statusstrip-2026-07-03.md`
- session: ⟦tag:v2|session|cockpit-visual-acceptance-2026-07-03⟧ -> `docs/orchestration/sessions/cockpit-visual-acceptance-2026-07-03.md`
- session: ⟦tag:v2|session|r0-evidence-reconcile-2026-07-03⟧ -> `docs/orchestration/sessions/r0-evidence-reconcile-2026-07-03.md`
- session: ⟦tag:v2|session|daily-closeout-2026-07-03⟧ -> `docs/orchestration/sessions/daily-closeout-2026-07-03.md`
- session: ⟦tag:v2|session|ranch-real-integration-p0-progress⟧ -> `docs/orchestration/sessions/ranch-real-integration-p0-progress.md`
- session: ⟦tag:v2|session|cockpit-refactor-p0-progress⟧ -> `docs/orchestration/sessions/cockpit-refactor-p0-progress.md`
- session: ⟦tag:v2|session|r0-visual-replay-accepted-2026-07-04⟧ -> `docs/orchestration/sessions/r0-visual-replay-accepted-2026-07-04.md`
- session: ⟦tag:v2|session|cockpit-corner-assist-2026-07-04⟧ -> `docs/orchestration/sessions/cockpit-corner-assist-2026-07-04.md`
- session: ⟦tag:v2|session|cockpit-c0-6-accepted-2026-07-04⟧ -> `docs/orchestration/sessions/cockpit-c0-6-accepted-2026-07-04.md`
- session: ⟦tag:v2|session|r0-notification-icons-accepted-2026-07-04⟧ -> `docs/orchestration/sessions/r0-notification-icons-accepted-2026-07-04.md`
- session: ⟦tag:v2|session|r0-readme-closeout-2026-07-04⟧ -> `docs/orchestration/sessions/r0-readme-closeout-2026-07-04.md`
- session: ⟦tag:v2|session|r0-connector-decision-2026-07-04⟧ -> `docs/orchestration/sessions/r0-connector-decision-2026-07-04.md`
- session: ⟦tag:v2|session|git-manager-agentpet-2026-07-02⟧ -> `docs/orchestration/sessions/git-manager-agentpet-2026-07-02.md`
- session: ⟦tag:v2|session|main-thread-2026-07-01-runtime-bootstrap⟧ -> `docs/orchestration/sessions/main-thread-2026-07-01-runtime-bootstrap.md`
- session: ⟦tag:v2|session|runtime-blocked-path-closeout-2026-07-01⟧ -> `docs/orchestration/sessions/runtime-blocked-path-closeout-2026-07-01.md`
- session: ⟦tag:v2|session|codex-evidence-closeout-2026-07-01⟧ -> `docs/orchestration/sessions/codex-evidence-closeout-2026-07-01.md`
- session: ⟦tag:v2|session|daily-closeout-2026-07-06⟧ -> `docs/orchestration/sessions/daily-closeout-2026-07-06.md`
- session: ⟦tag:v2|session|daily-closeout-2026-07-10⟧ -> `docs/orchestration/sessions/daily-closeout-2026-07-10.md`
- session: ⟦tag:v2|session|daily-supervision-2026-07-06⟧ -> `docs/orchestration/sessions/daily-supervision-2026-07-06.md`
- session: ⟦tag:v2|session|ranch-smoke-desktop-exe-2026-07-06⟧ -> `docs/orchestration/sessions/ranch-smoke-desktop-exe-2026-07-06.md`
- session: ⟦tag:v2|session|weekly-requirements-2026-07-07⟧ -> `docs/orchestration/sessions/weekly-requirements-2026-07-07.md`
- session: ⟦tag:v2|session|weekly-requirements-2026-07-14⟧ -> `docs/orchestration/sessions/weekly-requirements-2026-07-14.md`
- session: ⟦tag:v2|session|weekly-closeout-2026-07-11⟧ -> `docs/orchestration/sessions/weekly-closeout-2026-07-11.md`
- session: ⟦tag:v2|session|m5-five-day-development-2026-07-14⟧ -> `docs/orchestration/sessions/m5-five-day-development-2026-07-14.md`
- session: ⟦tag:v2|session|homepage-ui-p0-progress⟧ -> `docs/orchestration/sessions/homepage-ui-p0-progress.md`
- session: ⟦tag:v2|session|homepage-ui-p0-design-2026-07-07⟧ -> `docs/orchestration/sessions/homepage-ui-p0-design-2026-07-07.md`
- session: ⟦tag:v2|session|homepage-ui-p0-design-accepted-2026-07-07⟧ -> `docs/orchestration/sessions/homepage-ui-p0-design-accepted-2026-07-07.md`
- session: ⟦tag:v2|session|homepage-ui-p0-c0-6-style-2026-07-07⟧ -> `docs/orchestration/sessions/homepage-ui-p0-c0-6-style-2026-07-07.md`
- session: ⟦tag:v2|session|ranch-pointer-smoke-investigation-2026-07-07⟧ -> `docs/orchestration/sessions/ranch-pointer-smoke-investigation-2026-07-07.md`
- session: ⟦tag:v2|session|connector-decision-2026-07-07⟧ -> `docs/orchestration/sessions/connector-decision-2026-07-07.md`
- session: ⟦tag:v2|session|ranch-pointer-capture-2026-07-09⟧ -> `docs/orchestration/sessions/ranch-pointer-capture-2026-07-09.md`

recently closed cards:
- accepted blocked-path lanes: ⟦tag:v2|task|connector-types-v0.1⟧, ⟦tag:v2|task|connector-main-gate-v0.1⟧, ⟦tag:v2|task|connector-preload-api-v0.1⟧, ⟦tag:v2|task|connector-ui-binding-v0.1⟧
- accepted homepage lane: ⟦tag:v2|task|homepage-ui-p0-v0.1⟧ with evidence ⟦tag:v2|session|homepage-ui-p0-c0-6-style-2026-07-07⟧
- insufficient Codex acceptance evidence: ⟦tag:v2|task|codex-execution-evidence-v0.1⟧

dispatch gate:
- Dispatch only from an active task card, a waiting callback session, or an explicit user request.
- Default worker type is `[短工]` unless the user explicitly authorizes `[长工]`.
- PM owns dispatch, acceptance, correction, and close-out.
- Supervisor owns drift detection, blocker surfacing, and minimum correction.

current target:
- 2026-07-12 M5 Day 1 direct manual replay confirmed a lifecycle failure: closing `桌面牧场` terminated verified project Electron PID `62196` instead of hiding the window. Current status is `day1_correction_required`; Day 2 and all later cards remain pending. W27 summarized、W28 active；R0-3 dry-run、protected source、quota、cockpit redesign、pointer evidence 和项目 Codex/Trae/Qoder connector 继续各自 standby/blocked。

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
- `[PM]#daily-decision-queue@2026-07-02`: standby PM queue for Git staging/log decisions, connector acceptance, pointer smoke route, and live-subagent quota decisions; M4 dispatch has completed and is summarized.
- `[PM]#daily-role-accountability@2026-07-02`: standby ledger mapping each role to state, evidence, and accountability action.
- `[长工]#ranch-m1-m2-correction@v0.2`: corrected ranch M1/M2 drift; accepted for M3 entry after code/build/browser/Electron prefs evidence.
- `[长工]#ranch-m3-plan@v0.2`: read-only M3 plan complete; superseded by two active M3 implementation owners.
- `[监督]#ranch-v0.2-audit@v0.2`: pre-correction audit complete; findings are superseded by the current corrected worktree evidence.
- `[长工]#m3-main-bridge@v0.2`: summarized M3 owner for main/preload/types/browser fallback.
- `[长工]#m3-ranch-entry@v0.2`: summarized M3 owner for ranch renderer interactions.
- `[长工]#git-manager@AgentPet`: standby Git-management owner for `https://github.com/locooooooooo/AgentPet.git`; thread `019f20fc-9b77-74f3-aa3d-ba8348cdec1c` supplied the historical diagnosis and then, after explicit user authorization, completed `fa9e08b Import AgentPet workspace` pushed to `origin/main`; PM has requested a post-push read-only callback.
- `[短工]#git-repair-agentpet@v0.1`: standby historical Git repair dispatch package; do not rerun `git init`, remote add, fetch, staging, commit, or push before explicit same-message authorization.
- `[PM]#git-staging-review-agentpet@v0.1`: standby review package for the currently observed valid Git repo and working-tree/index state; no stage, unstage, commit, push, reset, clean, or file removal before explicit decision.
- `[PM]#ranch-m4-requirements@v0.2`: summarized docs-only requirements readiness for M4 rename/control-cockpit linkage.
- `[长工]#ranch-m4-implementation@v0.2`: summarized M4 implementation long-worker; thread `019f227a-8978-7df1-8b3f-738ccdb01b18` completed rename/header settings scope and PM verified lint/build/orchestration/browser smoke.
- `[监督]#ranch-window@v0.1`: summarized M5 window evidence for FR-001/005/008/009/011 plus ranch 3-level UI convergence; manual transparent pointer smoke remains delegated to the standby verification packages.
- `[监督]#ranch-status-script@v0.1`: summarized M5 animal/status/single-toast notification evidence for FR-002/003/004/006 without reopening connector state.
- `[监督]#ranch-personality@v0.1`: summarized M5 personality and control-cockpit prefs-linkage evidence for FR-007 and notifyPrefs.
- `[短工]#ranch-m5-requirements@v0.2`: standby docs-only M5 requirements readiness lane; main card plus five child cards are created, but no M5 implementation or long-worker dispatch is authorized.
- `[PM]#m5-longworker-dispatch@v0.1`: standby dispatch package; Day 1 worker callback is absorbed, but PM acceptance is blocked on direct tray lifecycle evidence and no Day 2 continuation is authorized.
- `[PM]#m5-five-day-development@2026-07-14`: active five-day serial control card with custom status `day1_correction_required`; calendar dates do not override the failed lifecycle gate.
- `[监督]#ranch-pointer-smoke@v0.2`: standby verification package for transparent ranch pointer smoke; no implementation edit.
- `[监督]#ranch-pointer-smoke-manual-evidence@v0.2`: standby manual evidence package for pointer-smoke callback recording; no pointer input executed yet.
- `[长工]#homepage-ui-design@v0.1`: summarized HomePage / landing / 启动页 P0 lane; H0-1 design drafts accepted as C · 华丽, H0-2/H0-3 implemented, H0-4 protected-file audit passed in `homepage-ui-p0-c0-6-style-2026-07-07.md`; no edit to `NiuMaAvatar.tsx` / `index.css` / `agentCore.ts` / central 4x2 control-cockpit grid.
- `[PM]#ranch-real-integration-r0-3-dryrun@v0.1`: standby R0-3 Codex controlled dry-run evidence collection lane; P0 ranch-real-integration-p0 整体 accepted(2026-07-07 拍板 ②),R0-3 段已转交本 lane;Codex approvalStatus/enabledByDefault/command 维持原值,trae/qoder 维持 placeholder;不主动启动 dry-run,等用户二次确认时机。
- `[PM]#protected-cockpit-source-drift@v0.1`: standby PM disposition lane in W28;administrator selected bounded routing, but no source edit, format repair, acceptance, or rollback is authorized yet.
- `[PM]#cockpit-ui-redesign-v3.1@v0.1`: summarized accepted visual-refinement lane pushed as `aa4cfa5`; future cockpit changes require a fresh bounded scope, while M5 lifecycle, protected animation/avatar, business logic, and connectors remain untouched.
- `[PM]#cockpit-ui-redesign-v3.2@v0.1`: standby after accepted/pushed P0; task-first state dedupe, first-screen dispatch, card-action reduction, and conditional Corner Assist passed PM replay after two bounded menu corrections. P1/P2 remain unauthorized.
- `[长工]#realtime-connector-runtime@v0.1`: partial-accepted after A1-A5 PM verification of the blocked-safe runtime foundation. Heartbeat/retry/recovery/persistence/audit, termination truth, bounded redacted events and trusted-intent fail-closed are covered; production authorizer, real reattach and external Agent CLI remain unavailable.
- `[长工]#realtime-truth-ui@v0.1`: partial-accepted after selector plus App/Home/Cockpit truth wiring, 1280/1440/1920 browser fallback replay, renderer SSR fresh/late/stale/session-lost fixture and Electron event p95; configured/online/simulated/source/session semantics are separated, while real E2E remains pending.
- `[长工]#realtime-requirements-control@v0.1`: active docs/control owner; records the approximately 60% bounded baseline, A/B fences, quantitative acceptance and remaining trusted-authorizer/real-reattach/real-E2E gaps. P0-C Codex controlled dry-run remains standby pending full A/B acceptance and a second explicit execution authorization.
- `[PM]#weekly-requirements@2026-07-07`: summarized W27 (2026-07-07~2026-07-13) weekly-requirements history; final closeout is recorded in `weekly-closeout-2026-07-11.md`.
- `[PM]#weekly-requirements@2026-07-14`: active W28 planner; tracks the administrator-authorized M5 rolling schedule beginning 2026-07-11 while preserving per-card serial gates.
- `[PM]#daily-plan@2026-07-09`: summarized 2026-07-09 daily plan;B②/C short-worker/D 今天/E1 evidence is retained as history.
- `[PM]#daily-plan@2026-07-10`: summarized 2026-07-10 daily plan;administrator decisions and W28/closeout preparation are retained as history.

blockers:
- External connector execution remains disabled; Codex is draft/pending/discovery-only, Trae/Qoder are intentionally command-empty placeholders, and no Codex/Trae/Qoder connector may be accepted, enabled, or executed until connector policy is accepted.
- Real-time cockpit A/B implementation is partial-accepted as bounded fixture/browser slices, not execution-ready. Configured seeds, CLI discovery, static orchestration roles, and simulated ticks must not be reported as online Agent sessions; P0-C dry-run remains standby.
- Treat service-side `403 DAILY_LIMIT_EXCEEDED` as a live sub-agent blocker until a quota recheck path is available; today's Codex app long-worker threads were used only as explicit user-authorized role sessions.
- Control-cockpit central 4x2 grid and protected selling-point files remain locked; M4 header settings entry has been completed and accepted.
- Transparent Electron ranch pointer smoke now has an additional Electron `webContents.capturePage()` evidence route that captured `ranch.html` without `SetIsBorderRequired failed`; full click-through / double-click / right-click / drag / dock evidence is still pending.

next action:
- PM has independently verified P0-A/P0-B callbacks, file fences, M5 hunk preservation, fixtures, truth UI, 1280/1440/1920 browser fallback and Electron event p95; keep P0-C blocked until trusted authorizer/real reattach/full A/B checks pass and a fresh explicit Codex dry-run authorization exists.
- Keep M3 code gates accepted as passed after `lint`, `build`, and `orchestration:check`; use the identified Windows MCP Snapshot route only as capture evidence until full transparent-window pointer input is observed.
- Keep connector policy and `connector-acceptance-review-v0.1` on standby until PM/user accepts or revises machine gate fields; do not dispatch connector execution binding and do not add schema-breaking connector fields.
- Keep AgentPet Git log ignore / staging decisions behind explicit user confirmation. **2026-07-07 Git log ignore = ① 推 main 即可 已落档**(不引 pre-commit / pre-push hook,backup 为每周 manual 巡检);lane `git-staging-review-agentpet` 仍 standby 等待 PM/user 决定是否处理当前 Git state。The historical repair package is `docs/orchestration/tasks/git-repair-agentpet-v0.1.md`; the current Git state review package is `docs/orchestration/tasks/git-staging-review-agentpet-v0.1.md` and remains standby.
- Preserve the accepted M4 evidence from thread `019f227a-8978-7df1-8b3f-738ccdb01b18`; future ranch work must open a new bounded lane.
- Keep `ranch-window-v0.1`, `ranch-status-script-v0.1`, and `ranch-personality-v0.1` summarized as M5 evidence cards; do not treat them as fresh active implementation lanes.
- Keep ranch pointer-smoke verification and `ranch-pointer-smoke-manual-evidence-v0.2` standby for full pointer input; capture-only evidence is archived, but click-through / double-click / right-click / drag / dock are not accepted yet.
- Keep Codex draft/pending/enabled=false and Trae/Qoder placeholder/not-requested/enabled=false until connector machine gate fields change.
- Use `docs/orchestration/tasks/daily-decision-queue-2026-07-02.md` as the next PM callback surface for standby decisions.
- Keep `docs/orchestration/tasks/daily-role-accountability-2026-07-02.md` aligned with role states before closing any daily supervision pass.
- Keep the uncommitted Day 1 delivery bounded to `electron/main.ts` and its two evidence cards; do not stage/commit/push until direct tray lifecycle evidence is accepted.
- Obtain direct close -> hide -> tray summon and tray exit -> cleanup evidence, rerun full gates, then PM may accept and push Day 1; Day 2 and every later M5 card remain pending meanwhile.
