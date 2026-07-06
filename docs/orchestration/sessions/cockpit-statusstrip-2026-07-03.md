[长工]#cockpit-statusstrip@2026-07-03

⟦tag:v2|session|cockpit-statusstrip-2026-07-03⟧
⟦tag:v2|task|cockpit-refactor-p0-v0.1⟧

loop state: summarized
dispatch state: summarized

source dispatch: `docs/orchestration/sessions/daily-longworker-dispatch-2026-07-03.md`
source plan: `docs/orchestration/sessions/daily-plan-2026-07-03.md`
task card: `docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md`

objective:
- Implement C0-3 / P0-2 StatusStrip only.

read first:
1. `docs/orchestration/index.md`
2. `docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md`
3. `docs/orchestration/sessions/cockpit-refactor-p0-progress.md`
4. `docs/主页面重构方案-v3.0-控制舱收口.md`
5. `src/components/NiuMaWorkspace.tsx`
6. `src/index.css`

allowed files:
- `src/components/StatusStrip.tsx`
- `src/components/NiuMaWorkspace.tsx` only for replacing existing connector/status presentation with StatusStrip
- `src/index.css` only for `.status-strip` and `.status-strip-dropdown` classes
- `docs/orchestration/sessions/cockpit-refactor-p0-progress.md` only for callback evidence

forbidden:
- Do not edit `src/components/NiuMaAvatar.tsx`.
- Do not edit `src/lib/agentCore.ts`.
- Do not alter central 4x2 agent board, `.agent-board`, or `AgentCard` behavior.
- Do not enable or execute Codex/Trae/Qoder connectors.
- Do not start C0-4 or C0-5.

acceptance:
- StatusStrip is one 36px row.
- It shows connector status, task count, and last event.
- Hover displays complete connector card details.
- Existing connector chip/status color semantics remain intact.
- `npm.cmd run lint` passes.
- `npm.cmd run build` passes.
- `npm.cmd run orchestration:check` passes.

callback format:
completed:
incomplete:
blockers:
next action:
evidence:

actual callback:
completed:
- C0-3 / P0-2 StatusStrip implemented inside the allowed code lane.
- `src/components/StatusStrip.tsx` renders one 36px row with connector gate summary, task count, and latest event.
- Hover/focus on StatusStrip opens complete connector detail cards without enabling or executing connectors.
- `src/components/NiuMaWorkspace.tsx` replaces the top header status stack with `StatusStrip` and marks C0-3 active in the P0 task cards.
- `src/index.css` positions `.status-strip-dropdown` below the top row and keeps existing connector status color semantics for draft/placeholder/ready/disabled.

incomplete:
- C0-4/C0-5 were not started.

blockers:
- None for C0-3 after manager-side validation.

next action:
- Wait for `cockpit-visual-acceptance` and `r0-evidence-reconcile` callbacks before `daily-closeout`.
- Keep C0-4/C0-5 closed until their own dispatch opens.

evidence:
- `src/components/StatusStrip.tsx`
- `src/components/NiuMaWorkspace.tsx`
- `src/index.css`
- `docs/orchestration/sessions/cockpit-refactor-p0-progress.md`
- `docs/orchestration/status.json`
- Manager re-run: `npm.cmd run lint` passed.
- Manager re-run: `npm.cmd run build` passed.
- Manager re-run: `npm.cmd run orchestration:check` passed, `Referenced cards: 45`.
