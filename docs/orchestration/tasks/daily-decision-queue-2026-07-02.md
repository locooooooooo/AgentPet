# Daily Decision Queue

[PM]#daily-decision-queue@2026-07-02
⟦tag:v2|task|daily-decision-queue-2026-07-02⟧

objective:
- Consolidate today's remaining standby and blocked decisions into one PM-facing queue.
- Keep every role's next action executable without silently starting Git repair, connector execution, M4 implementation, or pointer input.

dispatch state:
- Standby decision queue.
- This queue does not authorize work by itself; each item still requires its own explicit user/PM decision or external condition.

truth sources:
- Current board: `docs/orchestration/status.json`.
- Current index: `docs/orchestration/index.md`.
- Daily supervision session: `docs/orchestration/sessions/daily-supervision-2026-07-02.md`.
- Git repair package: `docs/orchestration/tasks/git-repair-agentpet-v0.1.md`.
- Connector acceptance package: `docs/orchestration/tasks/connector-acceptance-review-v0.1.md`.
- M4 implementation package: `docs/orchestration/tasks/ranch-m4-implementation-v0.2.md`.
- Pointer smoke evidence package: `docs/orchestration/tasks/ranch-pointer-smoke-manual-evidence-v0.2.md`.

decision queue:
| queue item | current owner | required decision or condition | allowed first action after decision | must remain blocked until |
| --- | --- | --- | --- | --- |
| AgentPet Git repair | `[短工]#git-repair-agentpet@v0.1` | Explicit same-message authorization for local Git metadata repair | Run only `git init -b main` -> `git remote add origin https://github.com/locooooooooo/AgentPet.git` -> `git fetch origin` -> `git status --ignored --short`, then stop | Authorization is absent |
| Connector acceptance | `[PM]#connector-acceptance-review@v0.1` | PM/user accepts, rejects, or revises connector machine gate fields | Update connector metadata only if the decision explicitly says so, then rerun `npm.cmd run orchestration:preflight` | No connector decision exists |
| M4 implementation | `[短工]#ranch-m4-implementation@v0.2` | Explicit M4 implementation dispatch | Open bounded M4 implementation lane with declared write scope | M4 dispatch is absent |
| Transparent pointer smoke | `[监督]#ranch-pointer-smoke-manual-evidence@v0.2` | Manual observer or alternate transparent-window capture route is available | Run parent pointer-smoke route and fill evidence table | Capture route is unavailable |
| Live sub-agent quota | `[监督]#multi-agent-control@v0.1` | Service-side `403 DAILY_LIMIT_EXCEEDED` can be rechecked without treating connectors as available | Recheck quota state and record exact result | Recheck route is unavailable |

non-goals:
- Do not repair Git, stage, commit, push, reset, clean, or remove files.
- Do not accept, enable, execute, or bind Codex, Trae, Qoder, or any connector.
- Do not run M4 implementation or edit locked M4/control-cockpit files.
- Do not run Electron pointer input or mark pointer smoke accepted.
- Do not create duplicate long-worker threads.

acceptance:
- Each open item has one named owner, one required decision or condition, one allowed first action, and one explicit blocked-until condition.
- `docs/orchestration/index.md` tracks this card.
- `docs/orchestration/status.json` keeps this queue standby.
- `npm.cmd run orchestration:check` passes.
- `npm.cmd run orchestration:report` shows this queue as standby, not active.
- Connector config remains no accepted/no enabled.
- Git state remains unrepaired unless the Git repair item is explicitly authorized in a later message.

next action:
- Use this queue as the PM callback surface for the next user decision.
- Keep daily supervision active and this queue standby until one queue item receives its required decision or condition.

summary:
- Standby daily decision queue; no blocked item executed.
