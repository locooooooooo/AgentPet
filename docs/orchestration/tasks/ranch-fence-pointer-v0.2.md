# ranch-fence-pointer-v0.2

[短工]#ranch-fence-pointer@v0.2
⟦tag:v2|task|ranch-fence-pointer-v0.2⟧

loop state: summarized
dispatch state: summarized
status: accepted_code_backed_residual_risk_pointer_waived

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
- Day 5A is closed under the administrator's explicit `跳过验收，继续推进进度` waiver. The implementation contract and Electron capture route passed, while direct click-through, double-click, right-click, floating drag, and dock evidence remains residual risk rather than pass evidence.
- Continue the serial plan with `ranch-system-notify-v0.2`; keep the real Windows notification observation separate and truthful.

summary:
- Existing fence/pointer implementation is code-backed closed without product changes. Desktop hot zones, forwarded passthrough, non-focusable desktop behavior, floating drag/snap persistence and non-interactive fence boundaries are verified by source contract; direct OS pointer behavior remains waived residual risk.

evidence:
- `node scripts/check-ranch-pointer-contract.mjs` -> bounded desktop hot zones, forwarded passthrough, floating-only drag, 32px snap and persisted dock edge passed.
- 2026-07-14 Electron `capturePage` -> 640x360, 8 animals, 3 actions, transparent desktop field, no boot/error card, `avoidedSetIsBorderRequired=true`, `pointerInputExecuted=false`.
- Long-worker audit found no new product defect and changed no product files; lint, build and diff checks passed.
- Acceptance record: `docs/orchestration/sessions/ranch-fence-pointer-v0.2-acceptance-2026-07-14.md`.
