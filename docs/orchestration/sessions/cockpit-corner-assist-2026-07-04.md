[短工]#cockpit-corner-assist@2026-07-04

⟦tag:v2|session|cockpit-corner-assist-2026-07-04⟧
⟦tag:v2|task|cockpit-refactor-p0-v0.1⟧

loop state: summarized
dispatch state: summarized

date: 2026-07-04
source request: `C0-5挪到右下角小三角 全量 acceptedR0-2`
task card: `docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md`

objective:
- Implement C0-5 option B: move the central floating panel to a bottom-right small triangle trigger.
- Preserve the central 8-card workstation matrix as the primary visual surface.

scope guard:
- No connector approval, enablement, binding, or execution was changed.
- No Git stage/commit/push/reset/clean/checkout/revert was run.
- C0-6 0-byte protected selling-point confirmation remains a separate follow-up because this request explicitly opened C0-5 and R0-2.

implementation:
- `src/components/NiuMaWorkspace.tsx` sets `ACTIVE_COCKPIT_TASK_CARD_ID = 'c0-5'`.
- The old central `.mission-stage` render block is removed from `.center-stage`.
- A fixed bottom-right `.corner-assist` surface now renders a small triangle trigger and a compact selected-agent 200px quick panel.
- `src/index.css` changes `.center-stage` to a single row and adds `.corner-assist*` styles.
- The open state sets `transition: none` so Electron/CDP background validation does not pause the panel in its hidden transition frame.

acceptance result:
- C0-5 option B is accepted.

completed:
- Central `.mission-stage` no longer renders.
- Right-bottom trigger exists and opens the compact panel.
- Panel keeps the selected agent avatar, runtime status, quote, current task, and stress/energy/temperature metrics.
- Agent board still renders all 8 workstation cards.
- Active cockpit task card is C0-5.

incomplete:
- C0-6 selling-point 0-byte confirmation remains outside this C0-5 lane.

blockers:
- None for C0-5.

next action:
- Treat C0-5 as accepted.
- Continue to C0-6 only when explicitly opened.

evidence:
- Runtime setup: Vite `http://127.0.0.1:5191/`, Electron remote debugging port `9231`.
- CDP C0-5 DOM proof:
  - `.mission-stage` count: `0`
  - `.corner-assist-trigger` exists: `true`
  - `aria-expanded` after click: `true`
  - `.corner-assist-panel` visible: `true`
  - computed width: `200px`
  - computed min-height: `200px`
  - measured rect: `200x218`
  - `.agent-board .agent-card` count: `8`
  - active card text includes `C0-5active中央浮窗处置按 B 路径挪到右下角小三角。`
