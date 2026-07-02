# Runtime Connector UI Binding Task

[短工]#connector-ui-binding@v0.1
⟦tag:v2|task|connector-ui-binding-v0.1⟧

objective:
- Bind connector policy and gate results into the desktop cockpit UI without enabling blocked connectors.

scope:
- Write only `src/components/NiuMaWorkspace.tsx`.
- Show connector status, approval status, enabled state, and blocked reason.
- Use the narrow preload API to request gated connector actions when available.

forbidden scope:
- Do not edit `electron/**`.
- Do not edit `src/types.ts`.
- Do not edit `docs/orchestration/connectors.json`.
- Do not add a UI path that executes raw commands.
- Do not enable any connector.
- Do not execute any connector.

input truth:
- `electron/preload.ts`
- `src/types.ts`
- `docs/orchestration/connectors.json`
- `docs/orchestration/tasks/runtime-connector-preload-api-v0.1.md`
- `docs/orchestration/tasks/runtime-connector-main-gate-v0.1.md`

acceptance gates:
- UI must not show an executable connector entry for Codex while it is draft/pending/enabled=false.
- UI must not show executable connector entries for Trae/Qoder while they are placeholder/not-requested/enabled=false.
- Any forced or stale renderer request must still receive a main-process blocked result.

verification:
- `npm run lint`
- `npm run build`
- Manual desktop check with `npm run dev` or `npm run start` if UI behavior changed.

negative test:
- Current Codex, Trae, and Qoder cards must remain disabled or blocked for execution.
- Callback must include evidence that UI disabled state is not the only protection; main gate remains the fallback.

callback requirements:
- Use the LPS callback package.
- Include changed files, UI disabled/block reason behavior, verification command results, and no-spawn negative test evidence from main gate.

current state:
- Pending dispatch after preload API and any agent-core adjustment callbacks are accepted.

blockers:
- Cannot bind UI execution path before preload API exists.

next action:
- Dispatch after ⟦tag:v2|task|connector-preload-api-v0.1⟧ and any needed ⟦tag:v2|task|connector-agent-core-v0.1⟧ callback acceptance.

summary:
- Pending.
