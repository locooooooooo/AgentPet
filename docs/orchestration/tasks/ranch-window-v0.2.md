# ranch-window-v0.2

[长工]#ranch-window@v0.2
⟦tag:v2|task|ranch-window-v0.2⟧

loop state: standby
dispatch state: standby
status: standby

parent: `docs/orchestration/tasks/ranch-m5-requirements-v0.2.md`
source summary: `docs/orchestration/tasks/ranch-window-v0.1.md`

objective:
- Prepare a bounded implementation lane for FR-001/005/008/009/011 ranch window behavior without starting source edits.

FR coverage:
- FR-001 ranch window lifecycle: launch, default size, default position, persistence, always-on-top behavior.
- FR-005 summon control cockpit: double-click, context menu, settings entry, unread reset.
- FR-008 desktop vs floating mode: transparent desktop mode, focus behavior, passthrough semantics.
- FR-009 floating drag and edge docking: drag, dock preview, persisted bounds.
- FR-011 fence boundary: visible fence, 8 animals remain inside ranch, outside area does not become an accidental hit zone.

future scope paths:
- `src/ranch/**` for ranch renderer, hooks, and child components.
- `electron/main.ts` for window lifecycle, mode, bounds, passthrough, context menu, and prefs using the existing bridge contract.
- `src/components/NiuMaWorkspace.tsx` for app-header-only ranch/cockpit entry changes; the central 4x2 grid remains forbidden.
- `src/components/CockpitSettingsPanel.tsx` or the existing equivalent only for bounded ranch-window preference linkage.
- `docs/orchestration/sessions/ranch-window-v0.2-progress.md` and the dated acceptance card for worker evidence.

no-touch boundaries:
- Do not edit this future lane from the readiness pass.
- Do not touch `src/components/NiuMaAvatar.tsx`, central 4x2 `src/components/NiuMaWorkspace.tsx`, central 8-card styles/keyframes in `src/index.css`, or key `src/lib/agentCore.ts` sections without a new explicit file fence.
- Do not touch `electron/preload.ts`, `src/types.ts`, `src/lib/desktopClient.ts`, `icon/**`, `package.json`, or other non-ranch product source from this lane.
- Do not edit connectors or run external connectors.

acceptance for the Day 1/2 implementation lane:
- Day 1 proves lifecycle, default desktop mode, size/position/mode persistence, and relaunch restoration in Electron.
- Day 2 proves summon behavior (double-click animal and right-click ranch), desktop/floating semantics, floating drag, dock/fence persistence, and ranch/control-cockpit coexistence.
- Electron evidence covers success, disabled/failure handling, relaunch persistence, and exit cleanup; capture-only evidence cannot prove pointer input.
- `npm.cmd run orchestration:check`, `npm.cmd run orchestration:report`, `npm.cmd run orchestration:preflight`, `npm.cmd run orchestration:connector-safety`, `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check` pass.
- Any skipped pointer behavior remains incomplete and must be routed through `ranch-pointer-smoke-v0.2`.

next action:
- Administrator authorized Day 1 on 2026-07-11; keep standby until the schedule-rebaseline commit/push and a fresh clean baseline, then PM dispatches this card as the only active product worker using `m5-longworker-dispatch-v0.1.md`.

summary:
- Requirements-ready child card for M5 window behavior; no source edit authorized here.
