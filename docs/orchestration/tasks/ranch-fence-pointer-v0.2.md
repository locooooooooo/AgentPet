# ranch-fence-pointer-v0.2

[短工]#ranch-fence-pointer@v0.2
⟦tag:v2|task|ranch-fence-pointer-v0.2⟧

loop state: standby
dispatch state: standby
status: standby

parent: `docs/orchestration/tasks/ranch-m5-requirements-v0.2.md`
related verification: `docs/orchestration/tasks/ranch-pointer-smoke-v0.2.md`

objective:
- Prepare a bounded lane for fence, hot-zone, passthrough, and pointer-smoke integration without marking pointer behavior accepted prematurely.

FR coverage:
- FR-008 desktop-mode passthrough outside interactive regions.
- FR-009 drag/dock behavior in floating mode.
- FR-011 fence and transparent boundary behavior.

future scope paths:
- `electron/main.ts` for `setIgnoreMouseEvents`, focusability, hot-zone polling, and persisted bounds.
- `src/ranch/RanchApp.tsx` for interactive region reporting.
- `src/ranch/components/RanchCanvas.tsx` for fence and animal hit-zone boundaries.
- `src/ranch/hooks/useDockAndDrag.ts` for drag/dock behavior.
- `src/ranch/styles/ranch.css` for fence and dock-preview visual states.
- `scripts/ranch-pointer-capture.mjs` for capture-route evidence only.

no-touch boundaries:
- Capture evidence is not pointer input evidence.
- Do not mark click-through, double-click, right-click, drag, or dock rows as `pass` unless directly observed.
- Do not edit product source from the capture investigation itself.
- Do not interrupt a user preview without an explicit run window.

acceptance for a future implementation lane:
- Capture route evidence explicitly states whether `SetIsBorderRequired failed` was avoided.
- Direct desktop evidence records click-through outside hot zones.
- Direct desktop evidence records double-click cockpit summon and right-click context menu.
- Floating mode evidence records drag and dock persistence.
- `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd run orchestration:check` pass in the same verification pass.

next action:
- The `capturePage` visibility route is already archived and does not satisfy this card.
- Keep standby until `ranch-personality-v0.2` is accepted, committed, pushed, and the worktree is clean; on 2026-07-18 PM may dispatch this card as the only `[短工]` product worker.
- Do not accept or commit this card until click-through, double-click, right-click, floating drag, and dock persistence are directly observed and recorded under the pointer-smoke evidence route.

summary:
- Requirements-ready child card for fence/pointer integration; capture investigation allowed, pointer acceptance still pending.
