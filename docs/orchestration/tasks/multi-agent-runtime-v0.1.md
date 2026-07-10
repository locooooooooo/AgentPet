# Multi-Agent Runtime Task

[PM]#multi-agent-runtime@v0.1
⟦tag:v2|task|multi-agent-runtime-v0.1⟧

objective:
- 按 LPS 建立角色分工，并持续监督各个角色推进项目。
- 让桌面控制舱具备可见的角色分工、监督状态和最小真实本地 runner 接入。

scope:
- Maintain repo-local orchestration truth source under `docs/orchestration/**`.
- Keep PM, supervisor, and short-worker responsibilities explicit.
- Preserve the existing simulated runner behavior.
- Use Electron main process for local command execution, not renderer Node access.
- Surface role split and supervision status in the React UI.
- Keep connector policy visible but disabled until PM acceptance.

not in scope:
- Full Codex/Trae/Qoder external protocol integration.
- Cloud deployment.
- Git workflow automation, because this checkout currently has no `.git` directory.
- Cross-day long-worker ownership unless the user explicitly authorizes it.

acceptance:
- `docs/orchestration/index.md` defines loop state, dispatch state, read order, role cards, tracked task/session cards, blockers, and next action.
- PM and supervisor role cards exist and match LPS boundaries.
- Tracked task/session cards exist and are referenced by the index; active work is represented by current session/lane state.
- Desktop UI shows current role split and supervision state from a repo-local source.
- Desktop UI shows connector policy status from `docs/orchestration/status.json`.
- New PM/supervisor/worker threads have a startup prompt and callback template.
- `npm run orchestration:report` prints the current PM board from `docs/orchestration/status.json`.
- `npm run orchestration:preflight` reports connector command discovery without executing connectors.
- `npm run orchestration:check` passes.
- `npm run lint` passes.
- `npm run build` passes.

current state:
- Local command runner has been implemented in Electron main process.
- Simulated runner remains available.
- Sub-agent spawn attempt failed with `403 DAILY_LIMIT_EXCEEDED`.
- Orchestration control files have been bootstrapped in this lane.
- Desktop cockpit now imports a repo-local orchestration status module and displays PM, supervisor, short-worker lanes, loop state, dispatch state, and current blocker.
- Desktop cockpit displays draft connector policy cards for Codex, Trae, and Qoder.
- Connector policy schema/config files now exist and are covered by `npm run orchestration:check`.
- Connector policy now has explicit approval fields, and enabled connectors require `ready + accepted`.
- `docs/orchestration/startup-prompt.md` and `docs/orchestration/callback-summary-template.md` define the repeatable role handoff entry points.
- `npm run orchestration:report` prints the active PM board.
- `npm run orchestration:preflight` finds Codex on PATH and leaves Trae/Qoder pending.
- `npm run orchestration:check`, `npm run lint`, and `npm run build` pass.

blockers:
- Live sub-agent execution cannot be relied on until quota is restored; the 2026-07-10 administrator decision defers the next quota recheck to W28.
- External agent connector safety policy is drafted but not yet accepted for execution.

next action:
- Accept or revise connector policy before wiring connectors to quick actions.
- Keep live sub-agent execution blocked until quota is restored; do not proactively recheck before the W28 window.
- Use `npm run orchestration:report` at the start of each supervision turn.

summary:
- Tracked runtime bootstrap; implementation summarized, with daily supervision active.
