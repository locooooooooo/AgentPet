# Runtime Connector Main Gate Task

[短工]#connector-main-gate@v0.1
⟦tag:v2|task|connector-main-gate-v0.1⟧

objective:
- Implement the Electron main-process connector gate so unmet connector policy never reaches `spawn`.

scope:
- Write only `electron/main.ts`.
- Resolve connector requests by connector id.
- Read connector policy from repo-local truth source.
- Return blocked reasons when gate fields are unmet.
- Preserve existing simulated runner and local task behavior unless directly required for the gated connector path.

forbidden scope:
- Do not edit `electron/preload.ts`.
- Do not edit `src/components/**`.
- Do not edit `docs/orchestration/connectors.json`.
- Do not enable any connector.
- Do not execute Codex, Trae, Qoder, or any connector command during development or verification.

input truth:
- `src/types.ts`
- `docs/orchestration/connectors.json`
- `docs/orchestration/tasks/runtime-connector-types-v0.1.md`
- `docs/orchestration/tasks/connector-policy-v0.1.md`

acceptance gates:
- Main process must require `status === "ready"`.
- Main process must require `approvalStatus === "accepted"`.
- Main process must require `enabledByDefault === true` for default execution entry.
- Main process must require non-empty `command`.
- Main process must enforce cwd policy, env allowlist, timeout, confirmation level, and dangerous command blocking.
- Main process must not parse natural language `approvalEvidence` as a gate.

verification:
- `npm run orchestration:preflight`
- `npm run lint`
- `npm run build`

negative test:
- With current `docs/orchestration/connectors.json`, requests for Codex, Trae, and Qoder must return blocked results.
- Callback must prove those blocked requests did not call `spawn`.

callback requirements:
- Use the LPS callback package.
- Include changed files, verification command results, blocked reasons, and no-spawn evidence.
- Do not claim connector execution success.

current state:
- Pending dispatch after ⟦tag:v2|task|connector-types-v0.1⟧ callback is accepted.

blockers:
- Real execution remains blocked until PM acceptance makes a connector ready/accepted/enabled.

next action:
- Dispatch only after connector runtime types are accepted.

summary:
- Pending.
