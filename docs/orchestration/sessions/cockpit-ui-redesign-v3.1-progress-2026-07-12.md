# cockpit-ui-redesign-v3.1 progress - 2026-07-12

worker: `[长工]#cockpit-ui-redesign-v3.1@v0.1`
status: accepted_pushed
timestamp: 2026-07-12 13:31:24 +08:00

completed:
- Replaced the touched cockpit brand emoji with the existing Lucide `Workflow` icon.
- Compressed the header into a stable operations band and reduced KPI height without removing return-home, status strip, settings, or reset controls.
- Rebalanced the desktop cockpit to keep the workstation matrix as the primary visual layer while preserving both collapsible rails.
- Added a three-line blocker summary with full text available through the native title/accessible label instead of allowing the blocker to consume the left rail.
- Reduced right operator-panel spacing and made the tab body independently scrollable so tabs, form fields, CTA, and logs remain reachable.
- Moved the corner assist above the bottom dock and reduced dock visual weight without removing status items.
- Added bounded responsive containment rules for 1280-wide, 1440-wide, wider desktop, and narrow fallback layouts.
- Preserved all AgentCard actions, Agent selection, role/lane accordions, detail tabs, task dispatch, corner assist, and bottom status behavior.

incomplete:
- Controlled screenshots at 1280x720 and 1440x900 are not captured yet.
- Visual pixel/non-overlap acceptance remains pending because no Codex in-app browser instance was available in this worker session.

blockers:
- The Vite fallback started successfully at `http://127.0.0.1:5178/`, but browser runtime discovery returned no `iab` target. The worker did not substitute an unrelated browser backend or claim screenshot evidence.

next action:
- PM should open the local fallback in an available browser and capture 1280x720 and 1440x900 screenshots.
- Confirm no horizontal scroll, central workstation visibility, reachable right-side CTA, truncated blocker summary, and no corner-assist/dock overlap before acceptance.
- Keep this visual lane separate from the uncommitted M5 Day 1 `electron/main.ts` correction.

evidence:
- `src/components/NiuMaWorkspace.tsx`
- `src/index.css`
- `npm.cmd run orchestration:check` -> passed, 80 referenced cards.
- `npm.cmd run orchestration:report` -> passed.
- `npm.cmd run orchestration:preflight` -> passed.
- `npm.cmd run orchestration:connector-safety` -> passed; connectors remain status-only and blocked.
- `npm.cmd run lint` -> passed.
- `npm.cmd run build` -> passed.
- `git diff --check` -> passed.

## PM browser replay

- 1280x720 PM screenshot replay: `document.documentElement.scrollWidth == clientWidth == 1280`, page height remained 720, compact detail bubble count was 0, right tab body measured 110px, dock bottom was 708px, and corner assist bottom was 650px; no horizontal overflow or dock overlap observed.
- 1440x900 PM screenshot replay: `scrollWidth == clientWidth == 1440`, page height remained 900, compact detail bubble count was 0, right tab body measured approximately 266px, dock bottom was 888px, and corner assist bottom was 830px; central matrix, right CTA, and bottom status remained visible without overlap.
- The 1440 right tab body had `scrollHeight > clientHeight`, confirming the task form/CTA remains reachable through its own scroll container rather than being clipped.
- PM accepted the visual lane behaviorally and visually. This acceptance is separate from the still-uncommitted M5 Day 1 `electron/main.ts` correction.
- Visual implementation was committed as `aa4cfa5` and pushed to `origin/main` after the PM replay.
- No `@keyframes`, connector machine-gate field, M5 implementation path, or protected source was changed by this worker.

## Second-round visual correction

completed:
- Removed `showBubble` from the compact avatar used by `AgentDetailPanel`; the operator quote remains rendered once in the dedicated quote box, preventing compressed Chinese bubble text from covering the identity block.
- Accounted for the conditional system-toast child in the right-panel grid with a dedicated seventh row, leaving `detail-tab-content` as the only scroll container.
- Tightened the 1280x720 containment budget: right-panel gap and padding are reduced, identity/quote/metrics blocks have bounded density, and `.detail-desc` is clamped to two lines.
- Reserved at least `110px` for the tab body and kept task title, runner switch, quick-task buttons, form inputs, CTA, queue, and logs in the existing behavior path.

incomplete:
- Controlled 1280x720 and 1440x900 screenshots, pixel overlap checks, and live browser interaction replay remain pending.

blockers:
- No Codex in-app browser target was available in this worker session, so screenshot/runtime evidence cannot be collected here without substituting an unrelated backend.

next action:
- PM should open the local Vite fallback in an available browser and verify the 1280x720 right rail has no bubble overlap, at least 110px of usable tab content, and no horizontal scroll before acceptance.

evidence:
- `src/components/NiuMaWorkspace.tsx` (`showBubble` removed from `AgentDetailPanel`)
- `src/index.css` (v3.1 right-rail containment correction)
- `npm.cmd run orchestration:check` -> passed, 80 referenced cards.
- `npm.cmd run orchestration:report` -> passed.
- `npm.cmd run orchestration:preflight` -> passed.
- `npm.cmd run orchestration:connector-safety` -> passed; connectors remain status-only and blocked.
- `npm.cmd run lint` -> passed.
- `npm.cmd run build` -> passed.
- `git diff --check` -> passed.
