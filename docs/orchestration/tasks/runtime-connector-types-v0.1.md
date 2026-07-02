# Runtime Connector Types Task

[短工]#connector-types@v0.1
⟦tag:v2|task|connector-types-v0.1⟧

objective:
- Add machine-readable connector runtime types before any Electron or UI binding work.

scope:
- Write only `src/types.ts`.
- Define types for connector config, connector execution request, gate result, blocked reason, and preflight/runtime result as needed by later lanes.
- Keep audit fields separate from machine gate fields.

forbidden scope:
- Do not edit `electron/**`.
- Do not edit `src/components/**`.
- Do not edit `docs/orchestration/connectors.json`.
- Do not execute any connector.

input truth:
- `docs/orchestration/connectors.json`
- `docs/orchestration/connectors.schema.json`
- `docs/orchestration/tasks/connector-policy-v0.1.md`
- `docs/orchestration/tasks/runtime-connector-dispatch-v0.1.md`

acceptance gates:
- Types can express `status`, `approvalStatus`, `enabledByDefault`, `command`, `args`, `runner`, `cwdPolicy`, `envAllowlist`, `confirmation`, `timeoutSeconds`, and `blockedReason`.
- `acceptedBy`, `acceptedAt`, and `approvalEvidence` remain audit/display fields and are not sufficient for execution.

verification:
- `npm run lint`
- `npm run build`

negative test:
- Type-level contract must represent that `draft/pending/enabled=false` is blocked and cannot be treated as executable.
- Callback must state how later main-process code can return a blocked result without calling `spawn`.

callback requirements:
- Use the LPS callback package.
- Include changed files, verification command results, and the negative test result.
- Do not paste full diff unless PM requests it.

current state:
- Pending dispatch after Lane 0 acceptance.

blockers:
- None for blocked-path type work.

next action:
- Dispatch this lane before main process, preload, agent core, or UI binding lanes.

summary:
- Pending.
