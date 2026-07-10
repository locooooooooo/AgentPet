# ranch-window-v0.2

[短工]#ranch-window@v0.2
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
- `electron/main.ts` for window lifecycle, mode, bounds, passthrough, context menu, and prefs.
- `electron/preload.ts` for ranch bridge surface.
- `src/types.ts` for ranch prefs, bounds, and IPC type contracts.
- `src/ranch/RanchApp.tsx` and `src/ranch/hooks/useDockAndDrag.ts` for renderer interaction behavior.
- `src/lib/desktopClient.ts` for browser fallback parity.

no-touch boundaries:
- Do not edit this future lane from the readiness pass.
- Do not touch `src/components/NiuMaAvatar.tsx`, central 4x2 `src/components/NiuMaWorkspace.tsx`, central 8-card styles/keyframes in `src/index.css`, or key `src/lib/agentCore.ts` sections without a new explicit file fence.
- Do not edit connectors or run external connectors.

acceptance for a future implementation lane:
- `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd run orchestration:check` pass.
- Electron evidence shows ranch and control-cockpit windows can coexist.
- Manual or alternate capture evidence records click-through, double-click, right-click, floating drag, and dock persistence.
- Any skipped pointer behavior remains incomplete and must be routed through `ranch-pointer-smoke-v0.2`.

next action:
- Keep standby through W27 closeout.
- W28 serial route places this card first, but a fresh bounded dispatch is still required before source implementation starts.

summary:
- Requirements-ready child card for M5 window behavior; no source edit authorized here.
