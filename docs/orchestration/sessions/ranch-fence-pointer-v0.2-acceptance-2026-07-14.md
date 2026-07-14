# ranch-fence-pointer-v0.2 acceptance

[PM]#ranch-fence-pointer@v0.2
⟦tag:v2|session|ranch-fence-pointer-v0.2-acceptance-2026-07-14⟧

loop state: summarized
dispatch state: summarized
status: accepted_code_backed_residual_risk_pointer_waived

## scope

- M5 Day 5A fence, hot-zone, passthrough, double-click/right-click routing, floating drag and dock persistence.
- No UI/UX skill, visual redesign, connector execution, protected-source edit, or product-source expansion.

## disposition

- The administrator instruction `跳过验收，继续推进进度` waives the missing direct OS pointer replay as a serial release gate.
- This record does not claim click-through, double-click, right-click, floating drag, or docking was directly observed.
- `capturePage()` remains renderer visibility evidence only and is not pointer-input evidence.

## code-backed matrix

| Requirement | Current evidence | Disposition |
| --- | --- | --- |
| Desktop non-hot-zone passthrough | renderer reports only animal/action rectangles; main polls the screen cursor and uses `setIgnoreMouseEvents(true, { forward: true })` outside them | contract passed; direct click-through waived |
| Desktop hot-zone semantics | entering a reported region disables passthrough while desktop remains non-focusable | contract passed; direct focus replay waived |
| Double-click | animal double-click routes through `openCockpit` to `ranch:open-cockpit` | code-backed only; direct replay waived |
| Right-click | ranch context-menu events route to native `Menu.popup`; desktop blank space remains passthrough by design | code-backed only; direct replay waived |
| Floating drag and dock | left-button drag excludes `data-ranch-no-drag`, clamps bounds, snaps within 32px and persists position/size/`dockedEdge` | contract passed; direct drag replay waived |
| Fence boundary | fence, corners and zones do not receive pointer events; animal/action rectangles are the bounded desktop hot zones | contract passed; direct boundary replay waived |

## verification

- `node scripts/check-ranch-pointer-contract.mjs`: passed.
- Electron `webContents.capturePage()` on 2026-07-14: 640x360, 8 animals, 3 action buttons, desktop mode, transparent field, no boot/error card.
- Capture route recorded `avoidedSetIsBorderRequired=true` and `pointerInputExecuted=false`.
- Worker `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check`: passed.
- Full PM gates are required before the Day 5A commit.

## residual risk

- Direct desktop click-through, double-click, right-click, floating drag and edge-dock behavior remain unobserved.
- Desktop blank space intentionally passes input to the underlying app, so a blank-space ranch context menu is not reachable there; animal/action hot zones and floating mode retain context-menu routing.
- The standalone pointer-smoke and manual-evidence packages remain standby for any future direct observation.

## next action

- Commit this script/control-plane closeout locally; GitHub push remains a network blocker under the administrator override.
- Authorize only `ranch-system-notify-v0.2` next and keep real Windows notification visibility as a separate evidence boundary.

## summary

- Day 5A is accepted as code-backed implementation with explicit pointer residual risk. No product source changed and no direct pointer action is reported as passed.
