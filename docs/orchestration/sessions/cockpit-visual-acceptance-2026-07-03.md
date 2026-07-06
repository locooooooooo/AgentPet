[长工]#cockpit-visual-acceptance@2026-07-03

⟦tag:v2|session|cockpit-visual-acceptance-2026-07-03⟧
⟦tag:v2|task|cockpit-refactor-p0-v0.1⟧

loop state: summarized
dispatch state: summarized

source dispatch: `docs/orchestration/sessions/daily-longworker-dispatch-2026-07-03.md`
source plan: `docs/orchestration/sessions/daily-plan-2026-07-03.md`
task card: `docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md`

objective:
- Verify C0-2 visual behavior and collect rendered evidence.
- This is read-only except optional evidence notes.

read first:
1. `docs/orchestration/index.md`
2. `docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md`
3. `docs/orchestration/sessions/cockpit-refactor-p0-progress.md`

scope:
- Confirm 5 P0 task cards render in the orchestration panel.
- Confirm exactly 1 active card and 4 dimmed cards.
- Confirm hover temporarily highlights the hovered card and dims the others.
- Confirm central 4x2 agent board still renders unchanged enough for smoke acceptance.

allowed:
- Browser/Electron visual smoke.
- Screenshots or DOM assertions.
- Append evidence to cockpit progress only if needed.

forbidden:
- No implementation edits.
- No connector execution.
- No Git staging, commit, or push.

acceptance:
- Evidence includes URL/runtime surface, card count, active/dimmed count, hover observation, and screenshot path if captured.
- `npm.cmd run orchestration:check` remains passing if docs are touched.

callback format:
completed:
incomplete:
blockers:
next action:
evidence:

actual callback:
completed:
- Browser visual smoke completed against `http://127.0.0.1:4174/`.
- Screenshot captured at `tmp-cockpit-visual-acceptance-2026-07-03.png`.
- 5 P0 task cards render in `.orchestration-task-cards`.
- Exactly 1 task card is active: C0-3 / StatusStrip.
- The remaining 4 task cards are dimmed: C0-1, C0-2, C0-4, C0-5.
- StatusStrip renders in the top header and shows connector summary, task count, and latest event.
- Connector detail cards are present in `.status-strip-dropdown`; CSS exposes them on hover/focus.
- Central agent board remains protected by `.board-panel .agent-board, .agent-board { grid-template-columns: repeat(4, minmax(134px, 1fr)); }` and the rendered screenshot shows the 4-column workstation row.

incomplete:
- No manual mouse-hover screenshot was captured; hover/focus acceptance is based on DOM presence plus CSS reveal rules.

blockers:
- None blocking C0-2/C0-3 visual smoke after manager-side browser capture.

next action:
- Wait for `daily-closeout`; keep C0-4/C0-5 closed until separately dispatched.

evidence:
- `tmp-cockpit-visual-acceptance-2026-07-03.png`
- DOM dump from `http://127.0.0.1:4174/` showed `.status-strip`, `.status-strip-dropdown`, five `.orchestration-task-card` elements, one `.task-card-active`, and four `.task-card-dimmed`.
- `src/components/NiuMaWorkspace.tsx` sets `ACTIVE_COCKPIT_TASK_CARD_ID = 'c0-3'`.
- `src/index.css` keeps `.status-strip` at `height: 36px`.
- `src/index.css` reveals `.status-strip-dropdown` through `.status-strip-shell:hover` and `.status-strip-shell:focus-within`.
