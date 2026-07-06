[PM]#cockpit-c0-6-accepted@2026-07-04

⟦tag:v2|session|cockpit-c0-6-accepted-2026-07-04⟧
⟦tag:v2|task|cockpit-refactor-p0-v0.1⟧

loop state: summarized
dispatch state: summarized

date: 2026-07-04
source request: `C0-6 -> cockpit P0 accepted -> R0-4 -> R0-5 -> 最后再决策 R0-3 connector`
task card: `docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md`

objective:
- Close C0-6 protection audit.
- Accept the cockpit refactor P0 only if the current worktree proves the central 8-card workstation surface remains stable.

acceptance result:
- C0-6 accepted.
- `cockpit-refactor-p0` accepted.

completed:
- `git diff -- src/components/NiuMaAvatar.tsx` is empty after restoring a protected hover/tap drift.
- `src/lib/agentCore.ts` has intentional R0-2 runtime mapping changes only; this is outside cockpit selling-point UI and is accepted by `docs/orchestration/sessions/r0-visual-replay-accepted-2026-07-04.md`.
- `src/index.css` has accepted cockpit P0 additions including task-card/status-strip/tab/corner-assist styles; the central 8-card DOM still renders 8 cards.
- Electron/CDP proof on the rebuilt dist confirmed:
  - `.agent-board .agent-card` count `8`
  - `.agent-board .niuma-avatar` count `8`
  - `.mission-stage` count `0`
  - `.corner-assist-panel` visible, measured `200x218`
  - ranch window `[data-agent-id]` count `8`

incomplete:
- None for cockpit refactor P0.

blockers:
- None for C0-6 or cockpit P0.

next action:
- Keep cockpit P0 accepted.
- Do not reopen C0 lanes unless a new user request changes the scope.

evidence:
- Runtime evidence source: Electron CDP on `file:///E:/%E5%A4%9Aagent%E7%89%9B%E9%A9%AC/dist/index.html` and `dist/ranch.html`.
- Build used before CDP proof: `npm.cmd run build` passed.
- `NiuMaAvatar.tsx` protected diff check returned empty.
