# Daily Decision Queue

[PM]#daily-decision-queue@2026-07-02
⟦tag:v2|task|daily-decision-queue-2026-07-02⟧

objective:
- Consolidate today's remaining standby and blocked decisions into one PM-facing queue.
- Keep every role's next action executable without silently starting Git repair, staging review writes, connector execution, or pointer input; M4 implementation has been completed and summarized outside this standby queue.
- Keep summarized M5 ranch verification cards and the ranch-only UI convergence pass as evidence inputs to existing ranch follow-up items instead of reopening new decision-bearing lanes.

dispatch state:
- Standby decision queue.
- This queue does not authorize work by itself; each item still requires its own explicit user/PM decision or external condition.

truth sources:
- Current board: `docs/orchestration/status.json`.
- Current index: `docs/orchestration/index.md`.
- Daily supervision session: `docs/orchestration/sessions/daily-supervision-2026-07-02.md`.
- Git repair package: `docs/orchestration/tasks/git-repair-agentpet-v0.1.md`.
- Git staging review package: `docs/orchestration/tasks/git-staging-review-agentpet-v0.1.md`.
- Connector acceptance package: `docs/orchestration/tasks/connector-acceptance-review-v0.1.md`.
- M4 implementation package: `docs/orchestration/tasks/ranch-m4-implementation-v0.2.md`.
- M5 ranch window summary: `docs/orchestration/tasks/ranch-window-v0.1.md`.
- M5 ranch status/script summary: `docs/orchestration/tasks/ranch-status-script-v0.1.md`.
- M5 ranch personality summary: `docs/orchestration/tasks/ranch-personality-v0.1.md`.
- Pointer smoke evidence package: `docs/orchestration/tasks/ranch-pointer-smoke-manual-evidence-v0.2.md`.

decision queue:
| queue item | current owner | required decision or condition | allowed first action after decision | must remain blocked until |
| --- | --- | --- | --- | --- |
| AgentPet Git repair | `[短工]#git-repair-agentpet@v0.1` | Explicit same-message authorization for local Git metadata repair | Run only `git init -b main` -> `git remote add origin https://github.com/locooooooooo/AgentPet.git` -> `git fetch origin` -> `git status --ignored --short`, then stop | Authorization is absent |
| AgentPet Git state review | `[PM]#git-staging-review-agentpet@v0.1` | PM/user decides how to handle the currently observed valid repo and working-tree/index state | Run read-only Git state review first, then ask for stage/unstage/commit/push/leave-untouched decision | Review decision is absent |
| Connector acceptance | `[PM]#connector-acceptance-review@v0.1` | PM/user accepts, rejects, or revises connector machine gate fields | Update connector metadata only if the decision explicitly says so, then rerun `npm.cmd run orchestration:preflight` and `npm.cmd run orchestration:connector-safety` | No connector decision exists |
| Transparent pointer smoke | `[监督]#ranch-pointer-smoke-manual-evidence@v0.2` | Manual observer or alternate transparent-window capture route is available | Run parent pointer-smoke route and fill evidence table | Capture route is unavailable |
| Live sub-agent quota | `[监督]#multi-agent-control@v0.1` | Service-side `403 DAILY_LIMIT_EXCEEDED` can be rechecked without treating connectors as available | Recheck quota state and record exact result | Recheck route is unavailable |

coverage guard:
| open status lane | queue coverage |
| --- | --- |
| connector-policy | Connector acceptance |
| connector-acceptance-review | Connector acceptance |
| live-subagents | Live sub-agent quota |
| git-manager-agentpet | AgentPet Git state review |
| git-repair-agentpet | AgentPet Git repair |
| git-staging-review-agentpet | AgentPet Git state review |
| ranch-pointer-smoke | Transparent pointer smoke |
| ranch-pointer-smoke-manual-evidence | Transparent pointer smoke |

session closeout coverage:
| queue item | required closeout evidence |
| --- | --- |
| AgentPet Git repair | `AgentPet Git repair` |
| AgentPet Git state review | `git-staging-review-agentpet-v0.1` |
| Connector acceptance | `Connector acceptance review package exists` |
| Transparent pointer smoke | `Ranch pointer-smoke verification and manual evidence packages are standby` |
| Live sub-agent quota | `403 DAILY_LIMIT_EXCEEDED` |

- `daily-decision-queue` and `daily-role-accountability` are supervision artifacts; they remain standby but are not decision-bearing queue items.
- Summarized M5 ranch verification cards (`ranch-window-v0.1`, `ranch-status-script-v0.1`, `ranch-personality-v0.1`) plus the ranch 3-level UI convergence evidence feed existing ranch follow-up items and do not create new decision-bearing lanes.
- `ranch-window-v0.1` is the current residual-risk summary for the existing transparent pointer-smoke queue item, but it does not change that queue row's blocked-until condition.
- Any new `standby` or `blocked` lane in `docs/orchestration/status.json` must be added to this guard or explicitly exempted in `scripts/check-orchestration.mjs`.

non-goals:
- Do not repair Git, stage, commit, push, reset, clean, or remove files.
- Do not accept, enable, execute, or bind Codex, Trae, Qoder, or any connector.
- Do not widen the accepted M4 long-worker delivery beyond its declared write scope or edit locked M4/control-cockpit files from this standby queue.
- Do not run Electron pointer input or mark pointer smoke accepted.
- Do not create duplicate long-worker threads.

acceptance:
- Each open item has one named owner, one required decision or condition, one allowed first action, and one explicit blocked-until condition.
- The decision queue and coverage guard tables are parseable; queue items and coverage lanes are unique, every queue row has non-empty owner/decision/action/blocker fields, every queue owner resolves to a tracked `docs/orchestration/status.json` role title, every coverage row points to an existing queue item and a current decision-bearing `standby` or `blocked` lane, and every queue item is used by at least one coverage row.
- The session closeout coverage table is parseable, every queue item has exactly one required closeout evidence phrase, and every required phrase appears in the parsed `incomplete:`, `blockers:`, or `next action:` closeout sections of `docs/orchestration/sessions/daily-supervision-2026-07-02.md`.
- Every decision-bearing `standby` or `blocked` lane in `docs/orchestration/status.json` is covered by the coverage guard.
- `docs/orchestration/index.md` tracks this card.
- `docs/orchestration/status.json` keeps this queue standby.
- `npm.cmd run orchestration:check` passes.
- `npm.cmd run orchestration:report` shows this queue as standby, not active, and prints the coverage guard plus session closeout coverage, including each open lane -> queue item and queue item -> required closeout evidence row.
- Connector config remains no accepted/no enabled.
- Git repair, staging review, unstage, commit, and push remain blocked unless explicitly authorized in a later message.

next action:
- Use this queue as the PM callback surface for the next user decision.
- Keep daily supervision active and this queue standby until one queue item receives its required decision or condition.

summary:
- Standby daily decision queue; no blocked item executed.
