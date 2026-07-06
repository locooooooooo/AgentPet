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
- Codex is draft-only; command discovery resolves `codex` on PATH, but that is readiness evidence only and not a connected agent.
- Trae and Qoder remain placeholders; `Get-Command` does not currently resolve either executable, so they must stay command-empty and disconnected.
- Connector cards are visible in the cockpit, but no connector is enabled by default.
- Current preflight finds `codex` on PATH and leaves Trae/Qoder pending.
- Codex approval is `pending`; Trae/Qoder approval is `not-requested`.

readiness matrix:
| connector | truth source | discovery evidence | missing before attach | next responsible |
| --- | --- | --- | --- | --- |
| Codex | `draft / pending / enabled=false` | `Get-Command` and `orchestration:preflight` resolve `codex` on PATH | Controlled dry-run design, non-interactive JSON/auth-quota/timeout evidence, no-interactive-UI proof, PM acceptance | `[PM]#connector-acceptance-review@v0.1` decides; `[短工]#connector-policy@v0.1` only updates metadata after that decision |
| Trae | `placeholder / not-requested / enabled=false` | No executable resolved; `command` intentionally stays empty | Exact executable path, exact non-interactive args, safety evidence, PM acceptance decision | PM/user must supply the invocation; `[短工]#connector-policy@v0.1` keeps placeholder until then |
| Qoder | `placeholder / not-requested / enabled=false` | No executable resolved; `command` intentionally stays empty | Exact executable path, exact verification surface, safety evidence, PM acceptance decision | PM/user must supply the invocation; `[短工]#connector-policy@v0.1` keeps placeholder until then |

blockers:
- External sub-agent quota remains blocked by `403 DAILY_LIMIT_EXCEEDED`.
- Codex still lacks acceptance-grade non-interactive evidence; command discovery alone is insufficient.
- Exact Trae/Qoder executable commands are not yet confirmed.
- PM/user has not accepted connector execution binding.

next action:
- Keep `docs/orchestration/connectors.json` and `docs/orchestration/status.json` as readiness-only truth; do not treat discovery or placeholders as connected.
- Wait for PM/user acceptance or revision of machine gate fields before wiring any connector to quick actions.
- PM/user must authorize a controlled Codex dry-run plan before any Codex status change.
- PM/user must confirm or replace Trae/Qoder executable commands before any implementation.
- After acceptance, dispatch a short-worker implementation lane with disjoint write scope.

summary:
- Standby.
