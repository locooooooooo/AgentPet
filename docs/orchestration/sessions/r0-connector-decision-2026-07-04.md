[PM]#r0-connector-decision@2026-07-04

⟦tag:v2|session|r0-connector-decision-2026-07-04⟧
⟦tag:v2|task|ranch-real-integration-p0-v0.1⟧

loop state: summarized
dispatch state: summarized

date: 2026-07-04
source request: `C0-6 -> cockpit P0 accepted -> R0-4 -> R0-5 -> 最后再决策 R0-3 connector`
task card: `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`

decision:
- R0-3 connector default enablement is not accepted in this pass.
- Keep Codex/Trae/Qoder connector execution disabled until PM/user provides explicit same-message approval for machine-gate changes.

reason:
- `docs/orchestration/connectors.json` still records no connector satisfying ready + accepted + enabled.
- Connector policy requires `approvalStatus === "accepted"` plus `enabledByDefault === true` before execution binding.
- The current objective says to decide R0-3 last, not to bypass the connector policy.

completed:
- R0-3 decision is recorded.
- No connector config was changed to `approvalStatus: "accepted"`.
- No connector config was changed to `enabledByDefault: true`.
- No external connector command was run.

incomplete:
- R0-3 implementation remains blocked/deferred until explicit connector acceptance exists.

blockers:
- Missing explicit PM/user connector acceptance for machine-gate changes.
- Missing controlled dry-run evidence for Codex and exact executable/args evidence for Trae/Qoder.

next action:
- Keep `ranch-real-integration-p0` open/in_progress with R0-3 as the remaining connector policy decision.
- If PM/user later accepts connector execution, open a fresh bounded connector lane and rerun `orchestration:preflight`, `orchestration:connector-safety`, `lint`, `build`, and `orchestration:check`.

evidence:
- R0-1, R0-2, R0-4, and R0-5 are accepted in separate session cards.
- R0-3 is explicitly decided as no-go/deferred for this pass.
