# Connector Policy Task

[短工]#connector-policy@v0.1
⟦tag:v2|task|connector-policy-v0.1⟧

objective:
- 为真实外部 agent connector 定义最小安全策略，使桌面控制舱能从“本地命令 runner”推进到“可监督的真实 agent 执行器”。

scope:
- Define connector fields: command, cwd, env allowlist, runner type, timeout, and confirmation level.
- Define safety rules for dangerous commands and long-running tasks.
- Define PM acceptance gates before enabling a connector by default.
- Keep implementation separate from this policy lane unless PM explicitly dispatches a short-worker implementation task.

not in scope:
- Implementing full Codex/Trae/Qoder protocol adapters.
- Storing secrets in repository files.
- Enabling live sub-agents while `403 DAILY_LIMIT_EXCEEDED` persists.

acceptance:
- Connector policy is visible in `docs/orchestration/status.json`.
- Connector policy details are defined in `docs/orchestration/connectors.json`.
- Connector config shape is documented by `docs/orchestration/connectors.schema.json`.
- `docs/orchestration/index.md` references this task as a tracked business card.
- `npm run orchestration:check` verifies this task card exists and is represented in the UI status source.
- Desktop cockpit shows connector policy fields for Codex, Trae, and Qoder.
- `npm run orchestration:preflight` reports command discovery without executing any connector.
- Connector config includes explicit PM approval fields and cannot be enabled unless `approvalStatus` is `accepted` and status is `ready`.
- PM can dispatch a later implementation short-worker from this task without guessing safety boundaries.

current state:
- Standby policy lane: policy is drafted, visible, and non-executing; next movement requires PM/user acceptance or revision.
- Local command runner exists, but connector safety fields are not implemented yet.
- Draft connector policy is represented in `docs/orchestration/status.json` under `connectors`.
- Detailed connector policy is represented in `docs/orchestration/connectors.json`.
- `npm run orchestration:report` reads connector details from `docs/orchestration/connectors.json`.
- Codex is draft-only; Trae and Qoder remain placeholders until executable commands and non-interactive arguments are confirmed.
- Connector cards are visible in the cockpit, but no connector is enabled by default.
- Current preflight finds `codex` on PATH and leaves Trae/Qoder pending.
- Codex approval is `pending`; Trae/Qoder approval is `not-requested`.

blockers:
- External sub-agent quota remains blocked by `403 DAILY_LIMIT_EXCEEDED`.
- Exact external agent executable commands are not yet confirmed.
- PM/user has not accepted connector execution binding.

next action:
- Wait for PM/user acceptance or revision of machine gate fields before wiring any connector to quick actions.
- Confirm or replace external executable commands before any implementation.
- After acceptance, dispatch a short-worker implementation lane with disjoint write scope.

summary:
- Standby.
