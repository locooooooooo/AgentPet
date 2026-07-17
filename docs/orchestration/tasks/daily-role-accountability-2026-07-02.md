# Daily Role Accountability Ledger

[PM]#daily-role-accountability@2026-07-02
⟦tag:v2|task|daily-role-accountability-2026-07-02⟧

objective:
- Keep every role in today's plan tied to a current state, evidence source, and next accountability action.
- Prevent summarized, standby, and blocked roles from being reported as completed implementation work, including summarized M5 verification cards.

dispatch state:
- Standby accountability ledger.
- This ledger is a supervision artifact only; it does not authorize Git repair, connector execution, pointer input, duplicate worker creation, or M4 scope expansion. M4 implementation has been summarized after long-worker delivery and PM verification.

truth sources:
- Current board: `docs/orchestration/status.json`.
- Current index: `docs/orchestration/index.md`.
- Daily supervision session: `docs/orchestration/sessions/daily-supervision-2026-07-02.md`.
- Daily decision queue: `docs/orchestration/tasks/daily-decision-queue-2026-07-02.md`.

role ledger:
| role | current state | evidence | accountability action |
| --- | --- | --- | --- |
| `[PM]#multi-agent-control@v0.1` | active | `docs/orchestration/index.md`, `docs/orchestration/status.json` | Keep dispatch/state truth aligned and record each supervision pass. |
| `[监督]#multi-agent-control@v0.1` | active | `docs/orchestration/roles/supervisor.md`, `scripts/check-orchestration.mjs` | Keep drift checks strict and preserve blocked/standby boundaries. |
| `[短工]#local-runner@v0.1` | summarized | `docs/orchestration/sessions/main-thread-2026-07-01-runtime-bootstrap.md` | No action until a connector policy decision creates a new runner lane. |
| `[短工]#orchestration-ui@v0.1` | summarized | `src/components/NiuMaWorkspace.tsx`, `src/lib/orchestrationStatus.ts` | Preserve status JSON as the UI source of truth. |
| `[短工]#connector-policy@v0.1` | standby | `docs/orchestration/tasks/connector-policy-v0.1.md` | Wait for connector machine-gate acceptance or revision. |
| `[PM]#connector-acceptance-review@v0.1` | standby | `docs/orchestration/tasks/connector-acceptance-review-v0.1.md` | Keep no accepted/no enabled/no execution until a decision exists. |
| `[短工]#runtime-dispatch-cards@v0.1` | summarized | `docs/orchestration/tasks/runtime-connector-dispatch-v0.1.md` | Keep execution binding paused. |
| `[PM]#daily-supervision@2026-07-02` daily-supervision lane | active | `docs/orchestration/sessions/daily-supervision-2026-07-02.md` | Preserve the 2026-07-17 closeout, current blockers and no-worker boundary. |
| `[PM]#daily-decision-queue@2026-07-02` | standby | `docs/orchestration/tasks/daily-decision-queue-2026-07-02.md` | Use as the next PM callback surface for blocked decisions. |
| `[PM]#daily-role-accountability@2026-07-02` | standby | `docs/orchestration/tasks/daily-role-accountability-2026-07-02.md` | Keep this ledger aligned with every `status.json` role. |
| `[长工]#ranch-m1-m2-correction@v0.2` | summarized | `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md` | Preserve accepted M1/M2 correction evidence; do not reopen implementation. |
| `[长工]#ranch-m3-plan@v0.2` | summarized | `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md` | Keep M3 planning summarized and superseded by accepted M3 owners. |
| `[监督]#ranch-v0.2-audit@v0.2` | summarized | `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md` | Treat pre-correction audit as historical evidence, not a reopened blocker. |
| `[长工]#m3-main-bridge@v0.2` | summarized | `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md` | Preserve passed main/preload/types/fallback evidence. |
| `[长工]#m3-ranch-entry@v0.2` | summarized | `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md` | Preserve passed ranch renderer interaction evidence while pointer smoke remains separate. |
| `[长工]#git-manager@AgentPet` | standby | `docs/orchestration/sessions/git-manager-agentpet-2026-07-02.md` | Collect post-push read-only callback; do not run further Git writes without explicit decision. |
| `[短工]#git-repair-agentpet@v0.1` | summarized | `docs/orchestration/tasks/git-repair-agentpet-v0.1.md` | Preserve completed repair/import history and never rerun the old repair command list. |
| `[PM]#git-staging-review-agentpet@v0.1` | standby | `docs/orchestration/tasks/git-staging-review-agentpet-v0.1.md` | Wait for a decision on the current valid repo and working-tree/index state. |
| `[PM]#ranch-m4-requirements@v0.2` | summarized | `docs/orchestration/tasks/ranch-m4-requirements-v0.2.md` | Keep requirements readiness linked to the accepted M4 implementation evidence. |
| `[长工]#ranch-m4-implementation@v0.2` | summarized | `docs/orchestration/tasks/ranch-m4-implementation-v0.2.md` | Preserve thread `019f227a-8978-7df1-8b3f-738ccdb01b18` callback and PM verification evidence. |
| `[监督]#ranch-window@v0.1` | summarized | `docs/orchestration/tasks/ranch-window-v0.1.md` | Preserve the M5 window + ranch 3-level UI evidence summary and leave direct transparent pointer smoke to the existing standby packages. |
| `[监督]#ranch-status-script@v0.1` | summarized | `docs/orchestration/tasks/ranch-status-script-v0.1.md` | Preserve the M5 animal/status/single-toast evidence summary without overstating direct OS-toast replay. |
| `[监督]#ranch-personality@v0.1` | summarized | `docs/orchestration/tasks/ranch-personality-v0.1.md` | Preserve the M5 personality/settings linkage summary and reopen direct replay only through a fresh bounded smoke lane. |
| `[短工]#ranch-m5-requirements@v0.2` | summarized | `docs/orchestration/tasks/ranch-m5-requirements-v0.2.md` | Preserve historical readiness evidence superseded by M5 closeout `8df940c`; do not reopen child cards. |
| `[监督]#ranch-pointer-smoke@v0.2` | standby | `docs/orchestration/tasks/ranch-pointer-smoke-v0.2.md` | Retry only when Windows can provide fresh screenshot-bound coordinates; preserve the 2026-07-17 blocked evidence. |
| `[监督]#ranch-pointer-smoke-manual-evidence@v0.2` | standby | `docs/orchestration/tasks/ranch-pointer-smoke-manual-evidence-v0.2.md` | Keep full click-through, double-click, right-click, drag, and dock rows pending until directly observed. |
| `[监督]#multi-agent-control@v0.1` live-subagents lane | summarized | `docs/orchestration/status.json` | Preserve the successful 2026-07-17 bounded in-app dispatch result; do not infer external Connector availability. |
| `[长工]#homepage-ui-design@v0.1` | summarized | `docs/orchestration/tasks/homepage-ui-p0-dispatch-v0.1.md` | Thread `mvs_237b464ebc78403d953b9ab93b398ab8` delivered H0-1; C implementation and H0-4 audit are accepted. |
| `[PM]#cockpit-ui-redesign-v3.1@v0.1` | summarized | `docs/orchestration/tasks/cockpit-ui-redesign-v3.1-v0.1.md` | Accepted/pushed 2026-07-12 bounded visual worker; preserve M5 lifecycle, avatar/keyframes, business logic, connectors, and separate commits for future changes. |
| `[PM]#cockpit-ui-redesign-v3.2@v0.1` | summarized | `docs/orchestration/sessions/cockpit-ui-redesign-v3.2-p1-p2-acceptance-2026-07-17.md` | Preserve independently accepted/pushed P0/P1/P2 evidence; do not open a new visual phase without a bounded scope. |
| `[长工]#realtime-connector-runtime@v0.1` | standby | `docs/orchestration/tasks/realtime-agent-cockpit-p0-a-connector-runtime-v0.1.md` | Preserve A1-A7.1/B2 accepted controlled-process evidence; no runtime worker or external Agent CLI execution is authorized. |
| `[长工]#realtime-trusted-authorizer@v0.1` | summarized | `docs/orchestration/sessions/realtime-agent-cockpit-p0-a6-acceptance-2026-07-14.md` | Preserve accepted A6 commit `a44abd6`, exact negative-path audit and production policy spawn=0 evidence. |
| `[长工]#realtime-process-reattach@v0.1` | summarized | `docs/orchestration/sessions/realtime-agent-cockpit-p0-a7-acceptance-2026-07-15.md` | Preserve accepted A7 commit `e2031cd`; A7.1 `8866305` resolves the synchronous-CIM residual risk. |
| `[长工]#realtime-production-path-e2e@v0.1` | summarized | `docs/orchestration/sessions/realtime-agent-cockpit-p0-b2-production-path-evidence-2026-07-15.md` | Preserve accepted B2 PM p95 `7ms`, six of six overlap evidence and zero child/proof-worker/external-Agent residue. |
| `[长工]#realtime-async-process-proof@v0.1` | summarized | `docs/orchestration/sessions/realtime-agent-cockpit-p0-a7-1-evidence-2026-07-15.md` | Preserve accepted/pushed A7.1 commit `8866305`, failure matrix, identity safety and cleanup evidence. |
| `[长工]#realtime-truth-ui@v0.1` | standby | `docs/orchestration/tasks/realtime-agent-cockpit-p0-b-data-truth-v0.1.md` | Preserve the partial-accepted truth projection; real E2E remains gated by P0-C and no worker is active. |
| `[长工]#realtime-requirements-control@v0.1` | summarized | `docs/orchestration/sessions/realtime-agent-cockpit-progress-2026-07-13.md` | Preserve historical serial-control evidence; the 2026-07-17 PM daily plan owns current control. |
| `[PM]#realtime-cockpit-next-stage@2026-07-15` | summarized | `docs/orchestration/sessions/realtime-agent-cockpit-next-stage-2026-07-15.md` | Preserve pushed control commit `74d8f50` and keep P0-C behind fresh explicit authorization. |
| `[PM]#cockpit-live-session-notification@2026-07-16` | summarized | `docs/orchestration/sessions/cockpit-live-session-notification-2026-07-16.md` | Preserve completed/pushed `c21a60b` live Session, Dock detail, bubble and sound evidence. |
| `[PM]#daily-plan@2026-07-17` | active | `docs/orchestration/sessions/daily-plan-2026-07-17.md` | Own current truth sync, v3.2 acceptance, pointer blocker evidence and final closeout. |
| `[PM]#ranch-real-integration-r0-3-dryrun@v0.1` | standby | `docs/orchestration/tasks/ranch-real-integration-r0-3-dryrun-v0.1.md` | Keep the W28 route standby; do not invoke Codex or touch machine-gate fields without a second execution-window confirmation. |
| `[PM]#protected-cockpit-source-drift@v0.1` | summarized | `docs/orchestration/sessions/protected-cockpit-source-drift-closeout-2026-07-16.md` | Preserve the clean baseline; reopen only for a new exact-file protected-source drift. |
| `[长工]#homepage-ui-design@v0.1` homepage-ui-design lane | summarized | `docs/orchestration/sessions/homepage-ui-p0-c0-6-style-2026-07-07.md` | C · 华丽 HomePage is verified; do not create a duplicate thread and keep §〇·quarter selling-point files untouched. |
| `[PM]#weekly-requirements@2026-07-07` | summarized | `docs/orchestration/sessions/weekly-requirements-2026-07-07.md` | Preserve W27 accepted outcomes and final closeout evidence as history. |
| `[PM]#weekly-requirements@2026-07-14` weekly-requirements lane | active | `docs/orchestration/status.json` | Own W28 buffer/closeout; keep M5 and v3.2 closed, pointer blocked, and P0-C authorization-required. |
| `[PM]#weekly-requirements@2026-07-14` | active | `docs/orchestration/sessions/weekly-requirements-2026-07-14.md` | Maintain W28 buffer and closeout truth without dispatching a product worker. |
| `[PM]#daily-plan@2026-07-09` | summarized | `docs/orchestration/sessions/daily-plan-2026-07-09.md` | Retain B②/C short-worker/D 今天/E1 as summarized historical evidence. |
| `[PM]#daily-plan@2026-07-10` | summarized | `docs/orchestration/sessions/daily-plan-2026-07-10.md` | Preserve the administrator decisions and W27/W28 preparation as summarized history. |
| `[PM]#m5-longworker-dispatch@v0.1` | summarized | `docs/orchestration/tasks/m5-longworker-dispatch-v0.1.md` | Preserve the completed five-card dispatch history and authorize no further M5 product worker. |
| `[PM]#m5-five-day-development@2026-07-14` | summarized | `docs/orchestration/sessions/m5-five-day-development-2026-07-14.md` | Preserve `completed_code_backed_with_manual_evidence_waived` and its direct tray/pointer/Windows notification residual risk. |

acceptance:
- Every non-summarized open item has an accountability action and evidence source.
- Every role ledger `current state` matches the corresponding `docs/orchestration/status.json` role status.
- Every role ledger row resolves to either a tracked `docs/orchestration/status.json` role title or a real `docs/orchestration/status.json` lane responsibility label, each parsed state matches that source, and each row has a non-empty accountability action.
- Every non-summarized `docs/orchestration/status.json` lane is covered by either its tracked role owner or a lane-specific role ledger row.
- Every role ledger evidence cell contains at least one repo path, every referenced path exists, and every `docs/orchestration/*.md` evidence path is tracked by `docs/orchestration/index.md`.
- Completed implementation work is represented as summarized only when its verification already passed.
- The only active lanes in `docs/orchestration/status.json` are `daily-supervision` and `weekly-requirements`; no implementation, connector, Git, M4, homepage-ui-design, or pointer-smoke lane is active without a fresh dispatch.
- Standby roles are not called complete.
- Blocked lanes retain the exact blocker and do not imply a connector or sub-agent is available.
- `npm.cmd run orchestration:check` passes.
- `npm.cmd run orchestration:report` shows this ledger as standby, not active, and prints the active lane control, daily supervision closeout, daily decision coverage, and daily supervision closeout coverage summaries.

non-goals:
- Do not run Git repair, staging, commit, push, reset, clean, or file removal.
- Do not accept, enable, execute, or bind Codex, Trae, Qoder, or any connector.
- Do not widen M4 beyond the accepted long-worker delivery scope.
- Do not launch Electron for pointer smoke or run pointer input.
- Do not create duplicate long-worker threads; homepage-ui-design is already assigned to `mvs_237b464ebc78403d953b9ab93b398ab8`.

next action:
- Keep this ledger aligned with `docs/orchestration/status.json` whenever a role state changes.
- Use it with the daily decision queue during the next PM callback.

summary:
- Standby accountability ledger; records accepted M4 long-worker delivery and keeps other blocked/standby roles bounded.
- Summarized M5 verification cards are also tracked here as evidence-only rows without reopening active implementation lanes.
- Historical W27 is summarized; homepage H0-1/H0-2/H0-3/H0-4 plus density follow-up are accepted/pushed through `7cdb1fe`.
