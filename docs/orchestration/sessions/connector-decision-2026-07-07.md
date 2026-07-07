# connector-decision-2026-07-07

[PM]#connector-decision@2026-07-07
⟦tag:v2|session|connector-decision-2026-07-07⟧

loop state: standby
dispatch state: documented

truth sources:
- `docs/orchestration/tasks/connector-policy-v0.1.md`
- `docs/orchestration/tasks/connector-acceptance-review-v0.1.md`
- `docs/orchestration/connectors.schema.json`
- `docs/orchestration/connectors.json`
- `docs/orchestration/status.json`

decision:
- No connector is accepted.
- No connector is enabled.
- No connector command is executed.
- `docs/orchestration/connectors.json` only gets wording changes in `approvalEvidence`; status, command, approval, and enabled fields stay unchanged.

schema check:
- `docs/orchestration/connectors.schema.json` has `additionalProperties: false` for connector entries.
- The weekly plan's proposed `permanently_placeholder` field would break the schema unless the schema is explicitly revised.
- This pass records the Trae/Qoder permanence in existing wording fields instead of adding a new JSON key.

connector matrix:
| connector | current truth | 2026-07-07 wording decision | missing before status can change |
| --- | --- | --- | --- |
| Codex | `draft / pending / enabled=false` | Discovery-only. `codex` on PATH is not execution readiness. | Controlled dry-run plan, JSON/non-interactive behavior, auth/quota/timeout evidence, no-UI proof, PM acceptance. |
| Trae | `placeholder / not-requested / enabled=false / command=""` | Intentionally command-empty placeholder in current scope. | Exact executable path, exact non-interactive args, safety evidence, PM acceptance. |
| Qoder | `placeholder / not-requested / enabled=false / command=""` | Intentionally command-empty placeholder in current scope. | Exact executable path, exact verification surface, safety evidence, PM acceptance. |

accepted wording updates:
- `status.json` connector summaries should say Trae/Qoder are intentionally command-empty placeholders in the current scope.
- `connector-policy-v0.1.md` and `connector-acceptance-review-v0.1.md` should distinguish discovery/placeholder evidence from connected execution.
- `connectors.json` must remain schema-valid; do not add `permanently_placeholder` in this pass and do not change any machine-gate field.

non-goals:
- Do not set `"approvalStatus": "accepted"`.
- Do not set `"enabledByDefault": true`.
- Do not edit `src/lib/agentCore.ts`, `electron/**`, `src/**`, or connector runtime binding code.
- Do not run Codex, Trae, Qoder, or any external connector.

next action:
- Keep connector-policy and connector-acceptance-review standby.
- If the user later wants Codex dry-run, open a new bounded dry-run evidence lane before any machine gate change.
