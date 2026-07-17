# Daily Decision Queue

[PM]#daily-decision-queue@2026-07-02
⟦tag:v2|task|daily-decision-queue-2026-07-02⟧

objective:
- Consolidate today's remaining standby and blocked decisions into one PM-facing queue.
- Keep every role's next action executable without silently starting staging review writes, connector execution, or pointer input; historical Git repair and M4 implementation are summarized outside this standby queue.
- Keep summarized M5 ranch verification cards and the ranch-only UI convergence pass as evidence inputs to existing ranch follow-up items instead of reopening new decision-bearing lanes.
- Preserve protected cockpit drift as closed history; reopen only for a new exact-file drift.

dispatch state:
- Standby decision queue.
- This queue does not authorize work by itself; each item still requires its own explicit user/PM decision or external condition.

truth sources:
- Current board: `docs/orchestration/status.json`.
- Current index: `docs/orchestration/index.md`.
- Daily supervision session: `docs/orchestration/sessions/daily-supervision-2026-07-02.md`.
- Historical Git repair package: `docs/orchestration/tasks/git-repair-agentpet-v0.1.md`.
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
| AgentPet Git state review | `[PM]#git-staging-review-agentpet@v0.1` | PM/user decides how to handle the currently observed valid repo and working-tree/index state | Run read-only Git state review first, then ask for stage/unstage/commit/push/leave-untouched decision | Review decision is absent |
| Connector acceptance | `[PM]#connector-acceptance-review@v0.1` | PM/user accepts, rejects, or revises connector machine gate fields | Update connector metadata only if the decision explicitly says so, then rerun `npm.cmd run orchestration:preflight` and `npm.cmd run orchestration:connector-safety` | No connector decision exists |
| Transparent pointer smoke | `[监督]#ranch-pointer-smoke-manual-evidence@v0.2` | Manual observer or alternate transparent-window capture route is available | Run parent pointer-smoke route and fill evidence table | Capture route is unavailable |
| R0-3 Codex dry-run authorization | `[PM]#ranch-real-integration-r0-3-dryrun@v0.1` | PM/user authorizes the controlled dry-run execution window | Run a single `codex --output-format json --quiet "<prompt>"` in an isolated cwd, exit 0, archive evidence to `docs/orchestration/sessions/codex-dryrun-2026-07-XX.{json,png,md}`; Codex machine-gate fields remain untouched | Authorization is absent |

coverage guard:
| open status lane | queue coverage |
| --- | --- |
| connector-policy | Connector acceptance |
| connector-acceptance-review | Connector acceptance |
| git-manager-agentpet | AgentPet Git state review |
| git-staging-review-agentpet | AgentPet Git state review |
| ranch-pointer-smoke | Transparent pointer smoke |
| ranch-pointer-smoke-manual-evidence | Transparent pointer smoke |
| ranch-real-integration-r0-3-dryrun | R0-3 Codex dry-run authorization |

session closeout coverage:
| queue item | required closeout evidence |
| --- | --- |
| AgentPet Git state review | `git-staging-review-agentpet-v0.1` |
| Connector acceptance | `Connector acceptance review package exists` |
| Transparent pointer smoke | `Ranch pointer-smoke verification and manual evidence packages are standby` |
| R0-3 Codex dry-run authorization | `R0-3 Codex controlled dry-run lane is standby` |

- `daily-decision-queue` and `daily-role-accountability` are supervision artifacts; they remain standby but are not decision-bearing queue items.
- Summarized M5 ranch verification cards (`ranch-window-v0.1`, `ranch-status-script-v0.1`, `ranch-personality-v0.1`) plus the ranch 3-level UI convergence evidence feed existing ranch follow-up items and do not create new decision-bearing lanes.
- `ranch-window-v0.1` is the current residual-risk summary for the existing transparent pointer-smoke queue item; 2026-07-07 adds a Windows MCP Snapshot capture route, but full pointer input evidence is still pending.
- 2026-07-09 user approved PM default B②/C short-worker/D 今天/E1. B② keeps R0-3 deferred with the controlled dry-run lane on standby; the separate dry-run execution window is still not authorized. D completed capture-route investigation only: Electron `webContents.capturePage()` evidence exists, but full pointer input remains pending.
- 2026-07-10 administrator decision overlay routed protected cockpit source drift to W28; the 2026-07-16 fresh audit found no current drift and removed that resolved item from the open queue. M5 and R0-3 retain their recorded boundaries.
- 2026-07-17 bounded in-app short-worker dispatch succeeded. The historical `403 DAILY_LIMIT_EXCEEDED` is retained in history but removed from this current decision queue; external Connector execution remains a separate blocked policy.
- 2026-07-17 W28 readiness audit confirmed the authorized AgentPet import/push is complete; `git-repair-agentpet` is summarized and removed from the open queue. Only the separate Git state review remains standby.
- Any new `standby` or `blocked` lane in `docs/orchestration/status.json` must be added to this guard or explicitly exempted in `scripts/check-orchestration.mjs`.

non-goals:
- Do not repair Git, stage, commit, push, reset, clean, or remove files.
- Do not accept, enable, execute, or bind Codex, Trae, Qoder, or any connector.
- Do not widen the accepted M4 long-worker delivery beyond its declared write scope or edit locked M4/control-cockpit files from this standby queue.
- Do not run Electron pointer input or mark pointer smoke accepted.
- Do not create duplicate long-worker threads.
- Do not create another `homepage-ui-design` long-worker; thread `mvs_237b464ebc78403d953b9ab93b398ab8` has delivered H0-1 and user selected C gorgeous.
- Do not edit `NiuMaAvatar.tsx` / `index.css` central 8-card styles / `agentCore.ts` / `NiuMaWorkspace.tsx` central 4x2 grid from the homepage-ui-design lane; those remain under §〇·quarter selling-point protection.

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
- Git staging review, unstage, commit, and push remain blocked unless explicitly authorized in a later message; the historical Git repair package remains summarized and non-executable.

next action:
- Use this queue as the PM callback surface for the next user decision.
- Keep daily supervision active and this queue standby until one queue item receives its required decision or condition.

summary:
- Standby daily decision queue; no blocked item executed.
