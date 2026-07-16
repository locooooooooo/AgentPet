# Connector Acceptance Review Package

[PM]#connector-acceptance-review@v0.1
⟦tag:v2|task|connector-acceptance-review-v0.1⟧

objective:
- Make the connector policy decision reviewable without accepting, enabling, or executing any connector.
- Convert the current standby policy into explicit approve/reject/revise criteria for Codex, Trae, and Qoder.

dispatch state:
- Standby. This is a future acceptance review package, not an execution binding lane.
- Do not change `approvalStatus` to `accepted`, set `enabledByDefault` to `true`, or run connector commands from this package.

truth sources:
- Policy card: `docs/orchestration/tasks/connector-policy-v0.1.md`.
- Connector config: `docs/orchestration/connectors.json`.
- Connector schema: `docs/orchestration/connectors.schema.json`.
- Preflight command: `npm.cmd run orchestration:preflight`.
- Connector safety command: `npm.cmd run orchestration:connector-safety`.

superseded baseline markers:
- Historical pre-discovery baseline required the sentence: Trae is `placeholder / not-requested / enabled=false`. This was superseded by the bounded 2026-07-16 evidence and is not current machine truth.
- Historical pre-discovery baseline required the sentence: Qoder is `placeholder / not-requested / enabled=false`. This was superseded by the bounded 2026-07-16 rejection decision and is not current machine truth.

current decision state:
- Codex is `draft / pending / enabled=false`; `Get-Command` and preflight resolve `codex` on PATH, but that is discovery only and not an accepted connector.
- Trae is `draft / pending / enabled=false`; `trae-cli` resolves, but the only authorized smoke returned exit `0` with top-level `Models is required`.
- Qoder is `disabled / rejected / enabled=false`; static inspection found only a desktop UI chat surface and no independent headless Agent API.
- No connector satisfies `status=ready + approvalStatus=accepted + enabledByDefault=true`.

review matrix:
| connector | current truth | missing before acceptance | next responsible |
| --- | --- | --- | --- |
| Codex | `draft / pending / enabled=false` | Controlled dry-run design; JSON output behavior; auth/quota behavior; timeout/exit-code behavior; proof that no interactive UI appears | PM/user decides whether to authorize the dry-run evidence plan; `[短工]#connector-policy@v0.1` may only edit metadata after that decision |
| Trae | `draft / pending / enabled=false` | Non-secret Models configuration, successful structured response, authentication evidence, and a fresh explicitly authorized read-only smoke | PM/user decides only after the blocker is resolved |
| Qoder | `disabled / rejected / enabled=false` | Independent headless API with structured output, timeout and error semantics | Reopen review only after a new interface is installed |

acceptance review checklist:
- Confirm whether Codex should remain `draft / pending` or be revised toward `ready`.
- Confirm Models configuration and successful stream-JSON behavior before Trae can leave `draft/pending`.
- Confirm an independent headless verification surface before Qoder can leave `disabled/rejected`.
- Confirm cwd policy, env allowlist, timeout, confirmation level, and dangerous-command handling for any connector before approval.
- Confirm live-subagent quota state before using any connector as an execution resource.
- Confirm `npm.cmd run orchestration:preflight` passes after any proposed connector metadata change.
- Confirm `npm.cmd run orchestration:connector-safety` passes after any proposed connector metadata or runtime-surface change.

forbidden scope:
- Do not edit `src/lib/agentCore.ts`, `electron/**`, `src/**`, or runtime binding code.
- Do not execute Codex, Trae, Qoder, or any connector command.
- Do not set `"approvalStatus": "accepted"`.
- Do not set `"enabledByDefault": true`.
- Do not dispatch connector-agent-core or execution binding.
- Do not run Git repair, staging, commit, push, reset, clean, or file removal.
- Do not edit M4/control-cockpit implementation files.

future acceptance output:
- If accepted later, the callback must name the connector id, acceptedBy, acceptedAt, command, args, cwd policy, env allowlist, confirmation level, timeout, and verification evidence.
- If rejected or revised, the callback must record the exact failed criterion and keep the connector disabled.
- Any future accepted connector still needs a separate implementation lane before runtime execution binding.

blockers:
- PM/user has not accepted connector execution binding.
- Trae remains blocked by Models configuration; Qoder remains rejected because the installed CLI is UI-bound.
- Live sub-agent execution remains blocked by the recorded `403 DAILY_LIMIT_EXCEEDED` until rechecked.
- `docs/orchestration/connectors.schema.json` disallows ad-hoc connector fields, so Qoder's rejection rationale remains in the existing approval fields and this review text.

next action:
- Wait for PM/user acceptance or revision of connector machine gate fields after the missing evidence above is explicitly filled in.
- Keep status and connector policy aligned on Trae `draft/pending/disabled` and Qoder `disabled/rejected`; adapter code and discovery must not be reported as connected.
- Keep connector-policy and connector-acceptance-review on standby until that decision exists.

summary:
- Standby connector acceptance review package; no connector accepted, enabled, or executed.
