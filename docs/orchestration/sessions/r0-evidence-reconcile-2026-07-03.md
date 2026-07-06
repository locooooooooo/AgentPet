[长工]#r0-evidence-reconcile@2026-07-03

⟦tag:v2|session|r0-evidence-reconcile-2026-07-03⟧
⟦tag:v2|task|ranch-real-integration-p0-v0.1⟧

loop state: summarized
dispatch state: summarized

source dispatch: `docs/orchestration/sessions/daily-longworker-dispatch-2026-07-03.md`
source plan: `docs/orchestration/sessions/daily-plan-2026-07-03.md`
task card: `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`

objective:
- Reconcile R0 progress with the current Y route.
- This is a review/PM evidence lane, not a new R0 implementation lane.

read first:
1. `docs/orchestration/index.md`
2. `docs/orchestration/status.json`
3. `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`
4. `docs/orchestration/sessions/ranch-real-integration-p0-progress.md`
5. `docs/orchestration/tasks/connector-policy-v0.1.md`
6. `docs/orchestration/tasks/connector-acceptance-review-v0.1.md`

allowed:
- Read-only diagnosis.
- Propose exact status wording for R0 if needed.
- Report whether R0 should remain `in_progress`, move to `summarized`, or be marked `blocked` under the current connector policy.

forbidden:
- Do not modify `electron/main.ts`, `src/lib/agentCore.ts`, `docs/orchestration/connectors.json`, `README.md`, or connector gates.
- Do not set `approvalStatus` to `accepted`.
- Do not set `enabledByDefault` to `true`.
- Do not run real external agent connectors.

acceptance:
- Report clearly separates completed R0-1/R0-2 evidence from blocked R0-3/R0-4/R0-5.
- If proposing a status change, cite exact files and reason.
- No file changes unless PM explicitly opens a correction lane.

callback format:
completed:
- R0-1 code path is complete enough to count as implemented: `docs/orchestration/sessions/ranch-real-integration-p0-progress.md:13` records completion; `electron/main.ts:1186` registers `agents:create-task`, `electron/main.ts:1190` gates local running tasks, and `electron/main.ts:1191` starts `startLocalRunner()`.
- R0-1 runner evidence: `electron/main.ts:527` resolves a whitelist-style command surface, `electron/main.ts:624` starts `spawn(resolved.file, resolved.args, ...)`, `electron/main.ts:627` keeps `shell: false`, `electron/main.ts:666` / `electron/main.ts:672` stream stdout/stderr, and `electron/main.ts:688` / `electron/main.ts:693` close into completion.
- R0-2 code path/front half is implemented: `docs/orchestration/sessions/ranch-real-integration-p0-progress.md:20` records `getNiuMaEffectiveStatus()`, `src/lib/agentCore.ts:596` maps running/error/success into NiuMa status, `src/lib/agentCore.ts:599` maps deploy/release to `deploying`, and `src/lib/agentCore.ts:633` writes the effective status in `progressNiuMaTick()`.
incomplete:
- R0-2 is not fully accepted visually: `docs/orchestration/sessions/ranch-real-integration-p0-progress.md:26` says 8-animal expression replay and `<500ms` visible switching were not separately accepted, while `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md:110` requires visible expression acceptance.
- R0-3 is not complete and must not be advanced in this lane: `docs/orchestration/sessions/ranch-real-integration-p0-progress.md:27` says connector default enabling was not done; `docs/orchestration/connectors.json:30` / `docs/orchestration/connectors.json:34` keep Codex `pending` and `enabledByDefault=false`, with Trae/Qoder also disabled at `docs/orchestration/connectors.json:48` / `docs/orchestration/connectors.json:52` and `docs/orchestration/connectors.json:66` / `docs/orchestration/connectors.json:70`.
- R0-4 is not complete: `docs/orchestration/sessions/ranch-real-integration-p0-progress.md:28` says notification icon wiring was not done, and current `electron/main.ts:1165` creates a `Notification` with only `title` and `body`, not the per-agent icon required by `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md:128`.
- R0-5 is not counted complete for R0 closeout: `docs/orchestration/sessions/ranch-real-integration-p0-progress.md:29` says README wording was not done in that slice; current `README.md:9` and `README.md:18` have partial real-spawn wording, but no separate R0-5 acceptance/closeout under this review lane.
blockers:
- Current route is Y/cockpit refactor, not X/R0 implementation: `docs/orchestration/sessions/daily-longworker-dispatch-2026-07-03.md:10` selects route Y, `docs/orchestration/sessions/daily-longworker-dispatch-2026-07-03.md:15` forbids parallel X/Y implementation, and `docs/orchestration/sessions/daily-longworker-dispatch-2026-07-03.md:16` limits R0 to evidence/readiness review.
- Connector policy blocks R0-3: `docs/orchestration/tasks/connector-policy-v0.1.md:28` requires accepted + ready before enabling, `docs/orchestration/tasks/connector-policy-v0.1.md:50` to `docs/orchestration/tasks/connector-policy-v0.1.md:54` list quota/missing evidence/no PM acceptance blockers, and `docs/orchestration/tasks/connector-acceptance-review-v0.1.md:43` to `docs/orchestration/tasks/connector-acceptance-review-v0.1.md:49` forbid accepting/enabling/executing connectors from that package.
- R0 should remain `in_progress` but parked/evidence-only under current Y route: `docs/orchestration/status.json:15` to `docs/orchestration/status.json:18` already records `ranch-real-integration-p0` as `in_progress`; it should not move to `summarized` because R0-2 acceptance/R0-3/R0-4/R0-5 remain incomplete, and should not be marked globally `blocked` because R0-1 plus the R0-2 code path are implemented.
next action:
- Do not continue R0 implementation under route Y. If PM later opens a control-plane correction lane, use wording like: `R0 partial/in_progress: R0-1 complete; R0-2 code path complete but visual acceptance pending; R0-3 blocked by connector acceptance policy; R0-4 notification icon and R0-5 README closeout not accepted.`
evidence:
- Read-only reconciliation used `docs/orchestration/index.md`, `docs/orchestration/status.json`, `docs/orchestration/sessions/daily-plan-2026-07-03.md`, `docs/orchestration/sessions/daily-longworker-dispatch-2026-07-03.md`, `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`, `docs/orchestration/sessions/ranch-real-integration-p0-progress.md`, `docs/orchestration/tasks/connector-policy-v0.1.md`, `docs/orchestration/tasks/connector-acceptance-review-v0.1.md`, `docs/orchestration/connectors.json`, `electron/main.ts`, `src/lib/agentCore.ts`, and `README.md`.
- No connector command was executed, no Git command was run, and no files outside `docs/orchestration/sessions/r0-evidence-reconcile-2026-07-03.md` were edited.
