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

current decision state:
- Codex is `draft / pending / enabled=false`; command discovery currently resolves `codex` on PATH.
- Trae is `placeholder / not-requested / enabled=false`; executable command is not confirmed.
- Qoder is `placeholder / not-requested / enabled=false`; executable command is not confirmed.
- No connector satisfies `status=ready + approvalStatus=accepted + enabledByDefault=true`.

acceptance review checklist:
- Confirm whether Codex should remain `draft / pending` or be revised toward `ready`.
- Confirm exact non-interactive command and args before Trae can leave `placeholder`.
- Confirm exact non-interactive command and verification surface before Qoder can leave `placeholder`.
- Confirm cwd policy, env allowlist, timeout, confirmation level, and dangerous-command handling for any connector before approval.
- Confirm live-subagent quota state before using any connector as an execution resource.
- Confirm `npm.cmd run orchestration:preflight` passes after any proposed connector metadata change.

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
- Trae and Qoder executable commands remain unconfirmed.
- Live sub-agent execution remains blocked by the recorded `403 DAILY_LIMIT_EXCEEDED` until rechecked.

next action:
- Wait for PM/user acceptance or revision of connector machine gate fields.
- Keep connector-policy and connector-acceptance-review on standby until that decision exists.

summary:
- Standby connector acceptance review package; no connector accepted, enabled, or executed.
