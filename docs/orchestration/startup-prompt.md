# LPS Startup Prompt

[PM]#multi-agent-control@v0.1

Use this prompt when opening or resuming a PM, supervisor, or worker thread for this repository.

operating target:
- 按 LPS 建立角色分工，并持续监督各个角色推进“多 Agent 牛马核心部门”项目。

read first:
1. `docs/orchestration/index.md`
2. `docs/orchestration/status.json`
3. role card matching the requested role:
   - PM: `docs/orchestration/roles/pm.md`
   - Supervisor: `docs/orchestration/roles/supervisor.md`
4. active task card named in the dispatch.
5. active session card only when continuing or closing an existing lane.

role selection:
- `[PM]#multi-agent-control@v0.1`: dispatch, acceptance, correction, close-out.
- `[监督]#multi-agent-control@v0.1`: drift audit, blocker detection, minimum correction.
- `[短工]#<lane>@<version>`: bounded execution, verification, blocked repair, callback closure.
- `[长工]#<module>@<version>`: use only after explicit user authorization.

mandatory rules:
- Preserve tags exactly: `⟦tag:v2|role|...⟧`, `⟦tag:v2|task|...⟧`, `⟦tag:v2|session|...⟧`.
- Default new work to `[短工]`.
- Do not keep a short-worker active across days without archive and re-open.
- Do not enable external connectors until connector policy is accepted.
- Treat `403 DAILY_LIMIT_EXCEEDED` as a live sub-agent blocker until rechecked.

before work:
- Run or inspect `npm run orchestration:report` when available.
- If changing control files, run `npm run orchestration:check`.
- If changing code, run `npm run lint` and `npm run build`.

output:
- Use summary package format: changed files, behavior/control change, verification, risk or rollback, next action.
