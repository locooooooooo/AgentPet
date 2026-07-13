# cockpit-ui-redesign-v3.2 progress

⟦tag:v2|session|cockpit-ui-redesign-v3.2-progress⟧

[长工]#cockpit-ui-redesign-v3.2@v0.1
loop state: summarized
dispatch state: summarized

worker: `[长工]#cockpit-ui-redesign-v3.2@v0.1`
date: 2026-07-13
status: p0_accepted_pushed
scope: P0 only

## completed

- Kept online/running/blocked KPIs, connector state, and latest event as the single global expression in the Header.
- Removed the duplicate latest-event tile from the left summary and reduced the Dock to data update time plus a generic live-region sync result.
- Rebuilt the right Operator hierarchy as compact Agent identity, collapsed status/connection details, tabs, and task content.
- Moved task name, command, and `立即派活` before quick-task templates so the complete form is visible at 1280x720 without scrolling.
- Reduced every unselected Agent card to selection plus one visible dispatch action.
- Kept all secondary card actions in the selected card's native `details/summary` menu: pie, coffee, whip, slack, and status cycle.
- Removed duplicate avatar focus stops from Agent cards with an inert call-site wrapper; the card selection button remains the interaction target.
- Hid Corner Assist while the desktop right rail is open. It becomes available when the rail is collapsed and remains available in the narrow breakpoint.
- Added explicit accessible names/tooltips to touched rail, corner, card, and input controls.
- Ensured closed action menus and collapsed rail content do not participate in the focus order.

## runtime evidence

### 1280x720

- `document.documentElement.scrollWidth == clientWidth == 1280`.
- Right detail panel: top `180`, bottom `636`, width `320`.
- Task content: top `359`, bottom `626`, height `267`.
- `立即派活`: top `484`, bottom `520`, height `36`; visible without right-panel scrolling.
- Right rail open: Corner Assist computed `display: none`.
- Long command stress: input `scrollWidth 1665` within a `334px` field while page `scrollWidth` remained `1280`.
- Existing long blocker remained within a `213px` summary width and did not widen the page.

### 1440x900

- `document.documentElement.scrollWidth == clientWidth == 1440`.
- Right detail panel: top `180`, bottom `816`, height `636`.
- Task content height `447`; CTA bottom remained `520`.
- Right rail open: Corner Assist computed `display: none`.

### 1920x1080

- `document.documentElement.scrollWidth == clientWidth == 1920`.
- Eight Agent cards remained mounted in the workstation matrix.
- Right detail panel: top `180`, bottom `996`, width `552`.
- CTA bottom remained `520`; Corner Assist remained hidden while the right rail was open.

### keyboard and disclosure

- Audit baseline: task Tab approximately focus position `75` with about `85` focusable elements.
- P0 replay at desktop: task Tab position `29`, task-name input `34`, CTA `36`, and `38` visible focusable elements.
- Agent-card focusables reduced to `17`: eight selection buttons, eight primary dispatch buttons, and one selected-card menu summary.
- Closed selected-card menu exposed `0` child buttons to focus.
- Opening the menu by keyboard exposed all five secondary actions.
- Collapsed right rail left only its expand toggle visible/focusable; its content stayed hidden.
- Collapsed right rail exposed Corner Assist; its panel opened with visible close control and bounds inside the viewport.

## validation

- `npm.cmd run orchestration:check` -> passed; 81 referenced cards.
- `npm.cmd run orchestration:report` -> passed.
- `npm.cmd run orchestration:preflight` -> passed.
- `npm.cmd run orchestration:connector-safety` -> passed; connectors remain status-only and blocked.
- `npm.cmd run lint` -> passed.
- `npm.cmd run build` -> passed.
- `git diff --check` -> passed.

## incomplete

- P1/P2 were not started and have no dispatch authorization.

## PM P0 correction replay

PM independent replay found the first action-menu implementation was not acceptable:

- At 1280x720 the selected Codex card ended at `488`, while primary/summary controls ended at `550`.
- The summary center hit-tested against the following MiniMax card, so clicking changed selection instead of opening the menu.
- The absolute menu could also be clipped by the board scroll container.

The bounded correction made two implementation changes:

- Restored a stable `318px` card minimum height so primary and summary controls stay inside every card's clickable layer.
- Kept controlled native `details/summary`, but rendered the open action group through a body portal positioned from the summary, viewport, and Dock bounds. This removes board-overflow clipping without changing the action contract.

Correction evidence:

- 1280x720, all eight cards: every primary control reported `contained=true`; selected summary reported `contained=true` and its center hit the summary's own `更多` span.
- Codex click replay: selected Agent stayed `Codex`, `details.open=true`, portal menu bounds `top 221 / bottom 411`, Dock top `648`, page width `1280 == 1280`.
- Menu action replay: clicking `给杯咖啡` kept selected Agent `Codex`, closed details, and removed the portal.
- MiniMax point-click replay after board scroll: summary center hit `更多`; selected Agent stayed `MiniMax`, `details.open=true`, menu `top 353 / bottom 543`, above Dock.
- OpenCCode point-click replay: selected Agent stayed `OpenCCode`, `details.open=true`, menu `top 374 / bottom 564`, above Dock.
- 1440x900: OpenCCode summary hit `更多`; selection stayed `OpenCCode`, menu `top 554 / bottom 744`, no horizontal overflow, above Dock.
- 1920x1080: selected OpenClaw summary hit `更多`; selection stayed `OpenClaw`, menu `top 647 / bottom 837`, no horizontal overflow, above Dock.

## PM P0 visual correction replay

PM's second independent replay found that the portal buttons inherited the browser's white default surface because the old dark-button rule was scoped below `.card-actions`.

The correction gives portal buttons their own complete cockpit control styling: dark surface, visible text/icon color, border, 32px minimum hit area, pointer cursor, hover state, and focus-visible state.

1280x720 cropped-menu and computed-style evidence:

- All five buttons rendered at `32px` height with `rgb(21, 21, 21)` background.
- Text, Lucide icons, and nested spans computed to `rgb(226, 232, 240)` with opacity `1` and visible state.
- Menu surface remained `rgba(15, 23, 42, 0.98)` with visible item borders.
- Keyboard Tab moved focus to `给杯咖啡`; `:focus-visible=true`, background `rgb(31, 41, 55)`, text `rgb(248, 250, 252)`, and a `2px` cyan outline.
- Pointer hover on `强制开工` computed `:hover=true`, background `rgb(31, 41, 55)`, visible accent border, and `rgb(248, 250, 252)` text.
- A direct 180x190 menu crop showed all five icons and labels on dark rows; the white blank-rectangle failure was no longer present.

## blockers

- No remaining P0 acceptance blocker.
- The worker's initial full-page screenshot returned a stale homepage frame, but PM later captured fresh 1280x720 cockpit screenshots before and after both bounded corrections; the stale worker frame is retained only as historical tool risk.

## next action

- Preserve the accepted P0 commit and evidence.
- Do not open P1/P2 without a fresh administrator decision, bounded task card, and independent acceptance cycle.
