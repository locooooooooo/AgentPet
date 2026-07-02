# Runtime Connector Dispatch Task

[短工]#runtime-dispatch-cards@v0.1
⟦tag:v2|task|runtime-connector-dispatch-v0.1⟧

objective:
- Create control cards for the connector runtime implementation lanes without implementing runtime code.
- Preserve the current blocked/no-spawn posture until a connector satisfies the PM acceptance gates.

scope:
- Define the ordered implementation lanes for connector runtime binding.
- Record each lane's write scope, forbidden scope, acceptance gates, verification commands, and negative no-spawn test.
- Keep Codex as `draft / pending / enabled=false`.
- Keep Trae and Qoder as `placeholder / not-requested / enabled=false`.

not in scope:
- Editing `src/**` or `electron/**`.
- Editing `docs/orchestration/connectors.json` or `docs/orchestration/connectors.schema.json`.
- Executing Codex, Trae, Qoder, or any connector command.
- Enabling any connector.

ordered lanes:
1. ⟦tag:v2|task|connector-types-v0.1⟧ -> `docs/orchestration/tasks/runtime-connector-types-v0.1.md`
2. ⟦tag:v2|task|connector-main-gate-v0.1⟧ -> `docs/orchestration/tasks/runtime-connector-main-gate-v0.1.md`
3. ⟦tag:v2|task|connector-preload-api-v0.1⟧ -> `docs/orchestration/tasks/runtime-connector-preload-api-v0.1.md`
4. ⟦tag:v2|task|connector-agent-core-v0.1⟧ -> `docs/orchestration/tasks/runtime-connector-agent-core-v0.1.md`
5. ⟦tag:v2|task|connector-ui-binding-v0.1⟧ -> `docs/orchestration/tasks/runtime-connector-ui-binding-v0.1.md`

acceptance:
- This card and all ordered lane cards exist under `docs/orchestration/tasks/`.
- `docs/orchestration/index.md` references this dispatch task.
- `docs/orchestration/status.json` shows a runtime connector dispatch lane without marking any connector enabled.
- Each lane card requires proof that unmet gates do not call `spawn`.
- `npm run orchestration:check` passes after control file changes.

current state:
- Control-card setup is summarized; blocked-safe implementation lane cards were created and later closeout recorded accepted blocked-path lanes.
- Connector agent-core and execution binding remain intentionally not dispatched.
- Current connectors remain blocked for execution: Codex is draft/pending/enabled=false; Trae and Qoder are placeholder/not-requested/enabled=false.

blockers:
- No connector currently satisfies `status=ready + approvalStatus=accepted + enabledByDefault=true`.
- External sub-agent quota remains blocked by `403 DAILY_LIMIT_EXCEEDED`.

next action:
- PM/user must accept or revise connector machine gate fields before any new connector execution binding lane is opened.

summary:
- Summarized dispatch plan for blocked-safe connector runtime implementation.
