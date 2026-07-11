# ranch-m5-requirements-v0.2

[短工]#ranch-m5-requirements@v0.2
⟦tag:v2|task|ranch-m5-requirements-v0.2⟧

loop state: standby
dispatch state: standby
status: standby

date: 2026-07-09
decision: C=short-worker approved by user in PM-direct route.
implementation route: 2026-07-10 administrator selected serial option ②, with `ranch-window-v0.2` first; W27 does not dispatch implementation.

objective:
- Convert the summarized M5 v0.1 evidence cards into v0.2 implementation-readiness cards.
- Keep this pass docs-only; do not implement M5 behavior or dispatch a long-worker.
- Preserve the accepted M0-M4 and ranch v0.3 baselines while making every future M5 slice independently dispatchable.

child cards:
- `docs/orchestration/tasks/ranch-window-v0.2.md` for FR-001/005/008/009/011 window, summon, mode, drag, dock, and fence boundaries.
- `docs/orchestration/tasks/ranch-status-script-v0.2.md` for FR-002/003/004/006 animal identity, status scripts, status band, and bubble rules.
- `docs/orchestration/tasks/ranch-personality-v0.2.md` for FR-007 personality and control-cockpit prefs linkage.
- `docs/orchestration/tasks/ranch-fence-pointer-v0.2.md` for fence, hot-zone, passthrough, and pointer smoke integration.
- `docs/orchestration/tasks/ranch-system-notify-v0.2.md` for system notification and existing agent icon usage.

shared file fence:
- This readiness pass may edit only `docs/orchestration/**` and `scripts/ranch-pointer-capture.mjs`.
- Future implementation lanes must declare their own file fences before touching source.
- Protected source remains out of scope here: `src/components/NiuMaAvatar.tsx`, central 4x2 `src/components/NiuMaWorkspace.tsx`, central 8-card/keyframe areas in `src/index.css`, and key `src/lib/agentCore.ts` sections.
- Do not touch `electron/**`, `src/ranch/**`, `icon/**`, `package.json`, or connector config from this readiness pass.

future implementation candidates:
- Ranch renderer: `src/ranch/**`.
- Electron integration: `electron/main.ts`, `electron/preload.ts`.
- Shared type/desktop fallback: `src/types.ts`, `src/lib/desktopClient.ts`.
- Control-cockpit settings entry only if a future child card explicitly allows a bounded `NiuMaWorkspace.tsx` app-header/settings change.

non-goals:
- Do not run Codex, Trae, Qoder, or any connector.
- Do not change `docs/orchestration/connectors.json` machine-gate fields.
- Do not mark pointer smoke accepted from browser-only or capture-only evidence.
- Do not create or resume a long-worker from this card.
- Do not reopen M1, M2, M3, M4, homepage, or cockpit accepted baselines.

acceptance:
- Main card plus five child cards exist and are tracked by `docs/orchestration/index.md`.
- Each child card names its FR coverage, future scope paths, no-touch boundaries, and acceptance evidence.
- `docs/orchestration/sessions/daily-plan-2026-07-09.md` records C=short-worker as approved and still separate from long-worker implementation.
- `npm.cmd run orchestration:check` passes.

next action:
- Keep all five cards standby through W27 closeout.
- After W27 is summarized and W28 is active, keep all five cards standby until their calendar/dependency gate; on 2026-07-14 PM dispatches only `[长工]#ranch-window@v0.2` through the bounded package.
- Continue strictly through `ranch-status-script` -> `ranch-personality` -> `ranch-fence-pointer` -> `ranch-system-notify`; every next card waits for callback, PM acceptance, full gates, commit, push, and a clean worktree.

summary:
- Docs-only M5 v0.2 readiness lane; five-day serial route and dependency gates are selected for W28, but no implementation or connector execution started.
