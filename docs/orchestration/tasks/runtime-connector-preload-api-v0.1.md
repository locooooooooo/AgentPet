# Runtime Connector Preload API Task

[短工]#connector-preload-api@v0.1
⟦tag:v2|task|connector-preload-api-v0.1⟧

objective:
- Expose a narrow renderer API for connector status and gated execution requests.

scope:
- Write only `electron/preload.ts`.
- Expose connector APIs that call main-process IPC by connector id.
- Keep renderer access narrower than the main-process gate.

forbidden scope:
- Do not edit `electron/main.ts`.
- Do not edit `src/components/**`.
- Do not edit `docs/orchestration/connectors.json`.
- Do not expose a raw shell, raw command, or arbitrary process execution API.
- Do not execute any connector.

input truth:
- `src/types.ts`
- IPC names and payload contracts from ⟦tag:v2|task|connector-main-gate-v0.1⟧
- `docs/orchestration/tasks/runtime-connector-main-gate-v0.1.md`

acceptance gates:
- Renderer can request connector data and create connector tasks only through connector id and typed payload.
- Renderer cannot pass arbitrary command strings to bypass the main-process gate.

verification:
- `npm run lint`
- `npm run build`

negative test:
- Preload API must not provide any method equivalent to `run(command)` or `spawn(command)`.
- Callback must show that raw command execution remains unavailable from renderer connector APIs.

callback requirements:
- Use the LPS callback package.
- Include exposed API names, payload boundary, verification command results, and negative test result.

current state:
- Pending dispatch after ⟦tag:v2|task|connector-main-gate-v0.1⟧ callback is accepted.

blockers:
- Cannot finalize API contract before main-process IPC names and payloads exist.

next action:
- Dispatch after main gate callback is accepted.

summary:
- Pending.
