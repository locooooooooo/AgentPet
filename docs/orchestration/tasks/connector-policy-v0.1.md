# Connector Policy Task

[短工]#connector-policy@v0.1
⟦tag:v2|task|connector-policy-v0.1⟧

objective:
- 为真实外部 agent connector 定义最小安全策略，使桌面控制舱能从“本地命令 runner”推进到“可监督的真实 agent 执行器”。

scope:
- Define connector fields: command, cwd, env allowlist, runner type, timeout, and confirmation level.
- Define safety rules for dangerous commands and long-running tasks.
- Define PM acceptance gates before enabling a connector by default.
- Record the explicitly dispatched bounded Trae adapter and structured-error safety contract without enabling production execution.

not in scope:
- Implementing full Codex/Qoder protocol adapters or a generic adapter framework.
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
- Standby policy lane after bounded implementation: policy is visible and non-executing; next movement requires new acceptance-grade evidence.
- Local command runner plus bounded Codex/Trae adapters exist; production machine gates still block every spawn.
- Draft connector policy is represented in `docs/orchestration/status.json` under `connectors`.
- Detailed connector policy is represented in `docs/orchestration/connectors.json`.
- `npm run orchestration:report` reads connector details from `docs/orchestration/connectors.json`.
- Codex is draft-only; command discovery resolves `codex` on PATH, but that is readiness evidence only and not a connected agent.
- Trae resolves as `trae-cli` and is `draft/pending/enabled=false`; one read-only smoke failed closed on `Models is required`.
- Qoder is `disabled/rejected/enabled=false` with an empty command because static inspection found no independent headless Agent API.
- Connector cards are visible in the cockpit, but no connector is enabled by default.
- Current preflight finds both `codex` and `trae-cli` on PATH while every production Connector remains statically blocked; Qoder has no command to discover.
- Codex and Trae approval are `pending`; Qoder approval is `rejected`.

readiness matrix:
| connector | truth source | discovery evidence | missing before attach | next responsible |
| --- | --- | --- | --- | --- |
| Codex | `draft / pending / enabled=false` | `Get-Command` and `orchestration:preflight` resolve `codex` on PATH | Controlled dry-run design, non-interactive JSON/auth-quota/timeout evidence, no-interactive-UI proof, PM acceptance | `[PM]#connector-acceptance-review@v0.1` decides; `[短工]#connector-policy@v0.1` only updates metadata after that decision |
| Trae | `draft / pending / enabled=false` | CLI/headless/JSON discovery plus one exit-0 structured-error smoke | Non-secret Models configuration, successful response, auth proof, fresh explicit smoke authorization | `[PM]#connector-acceptance-review@v0.1` keeps disabled until all evidence exists |
| Qoder | `disabled / rejected / enabled=false` | Desktop wrapper and UI chat only; no prompt executed | Independent headless API with captured structured output, timeout and failure semantics | Reconsider only after a new headless interface is installed |

blockers:
- External sub-agent quota remains blocked by `403 DAILY_LIMIT_EXCEEDED`.
- Codex still lacks acceptance-grade non-interactive evidence; command discovery alone is insufficient.
- Trae is blocked by missing Models configuration; Qoder is rejected for lacking a headless Agent API.
- PM/user has not accepted connector execution binding.
- `docs/orchestration/connectors.schema.json` disallows ad-hoc connector fields, so the Qoder rejection reason remains in existing approval evidence and acceptance wording.

next action:
- Keep `docs/orchestration/connectors.json` and `docs/orchestration/status.json` as readiness-only truth; do not treat discovery, adapter availability, or rejected metadata as connected.
- Wait for PM/user acceptance or revision of machine gate fields before wiring any connector to quick actions.
- PM/user must authorize a controlled Codex dry-run plan before any Codex status change.
- Do not rerun Trae without non-secret Models configuration and fresh authorization; keep Qoder command-empty/rejected.
- After acceptance, dispatch a short-worker implementation lane with disjoint write scope.

summary:
- Standby.
