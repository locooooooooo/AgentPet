# Runtime Connector Agent Core Task

[短工]#connector-agent-core@v0.1
⟦tag:v2|task|connector-agent-core-v0.1⟧

objective:
- Keep task naming and quick-task helpers aligned with gated connector runtime behavior.

scope:
- Write only `src/lib/agentCore.ts`.
- Adjust quick-task names or connector-aware task metadata only if needed by the gated runtime flow.
- Preserve simulated runner behavior.

forbidden scope:
- Do not edit `electron/**`.
- Do not edit `src/components/**`.
- Do not edit `docs/orchestration/connectors.json`.
- Do not create a path that executes draft or placeholder connectors.
- Do not execute any connector.

input truth:
- `src/types.ts`
- `docs/orchestration/tasks/runtime-connector-types-v0.1.md`
- `docs/orchestration/tasks/runtime-connector-main-gate-v0.1.md`
- Existing `getQuickTasks` behavior in `src/lib/agentCore.ts`

acceptance gates:
- Quick tasks must not present blocked connectors as default executable tasks.
- Any connector-aware metadata must still rely on main-process gate enforcement.
- Simulated runner must remain available.

verification:
- `npm run lint`
- `npm run build`

negative test:
- Current Codex draft/pending/enabled=false and Trae/Qoder placeholder/not-requested/enabled=false must not become default executable quick actions through agent core.

callback requirements:
- Use the LPS callback package.
- State whether `getQuickTasks` changed.
- Include verification command results and negative test result.

current state:
- Pending dispatch after main gate callback is accepted.

blockers:
- May be unnecessary if connector execution is fully isolated behind new APIs.

next action:
- Dispatch after main gate callback, before UI binding if quick-task behavior needs adjustment.

summary:
- Pending.
