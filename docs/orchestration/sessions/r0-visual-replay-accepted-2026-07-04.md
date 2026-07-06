[短工]#r0-visual-replay-accepted@2026-07-04

⟦tag:v2|session|r0-visual-replay-accepted-2026-07-04⟧
⟦tag:v2|task|ranch-real-integration-p0-v0.1⟧

loop state: summarized
dispatch state: summarized

date: 2026-07-04
source request: `C0-5挪到右下角小三角 全量 acceptedR0-2`
task card: `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`
supersedes: `docs/orchestration/sessions/r0-visual-replay-acceptance-2026-07-04.md` for the R0-2 `<500ms` acceptance item.

objective:
- Close R0-2 as full accepted by fixing visible replay latency, then rerunning Electron/CDP proof.
- Keep R0-3/R0-4/R0-5 outside this lane.

scope guard:
- No Codex/Trae/Qoder/external connector was enabled, bound, or executed.
- No `approvalStatus` was changed to `accepted`.
- No `enabledByDefault` was changed to `true`.
- No Git stage/commit/push/reset/clean/checkout/revert was run.

implementation:
- `src/lib/agentCore.ts` adds `syncAgentTaskRuntime(snapshot, agentId)` so task lifecycle changes update the selected agent runtime immediately.
- `createTask()` and `stopTask()` now call `syncAgentTaskRuntime()` instead of waiting for the 2.5s ranch physics tick.
- `electron/main.ts` `patchTask()` now returns `syncAgentTaskRuntime({ ...snapshot, agents, updatedAt }, agentId)` when task state changes, so local runner progress/completion broadcasts the visible pose in the same snapshot publish.

acceptance result:
- R0-2 is accepted in full for 8-animal visible replay and `<500ms` status switching.

completed:
- Deploy/release path accepted.
  - agent: `codex`
  - task: `task-1783140780436-gj8w5`
  - runtime at create: `deploying`
  - visible ranch class: `pose-deploy_pray`
  - latency from create return to visible class: `2ms`
- Failure path accepted.
  - agent: `trae`
  - task: `task-1783140780724-bg6xh`
  - task status: `error`
  - visible ranch class: `pose-panic_smoke`
  - latency from done-observed to visible class: `1ms`
- Long-running progress path accepted.
  - agent: `qoder`
  - task: `task-1783140781018-r80rv`
  - observed progress: `12`
  - runtime status: `coding`
  - visible ranch class: `pose-work_type`
  - latency from progress-observed to visible class: `1ms`
- Success path accepted for all 8 animals.
  - agents: `codex`, `trae`, `qoder`, `minimax`, `workbuddy`, `openclaw`, `openccode`, `hermes`
  - visible ranch class: `pose-done_cheer`
  - max latency from done-observed to visible class: `2ms`

incomplete:
- R0-3 connector default enablement remains outside this lane.
- R0-4 notification icon wiring remains outside this lane.
- R0-5 README closeout remains outside this lane.

blockers:
- None for R0-2.
- External connector execution remains blocked by connector policy, but that does not block R0-2 visual replay acceptance.

next action:
- Treat R0-2 as accepted.
- Keep the parent `ranch-real-integration-p0` card `in_progress` until R0-3/R0-4/R0-5 are separately accepted or formally closed.

evidence:
- Runtime setup: Vite `http://127.0.0.1:5191/`, Electron remote debugging port `9231`.
- CDP targets: control cockpit `http://127.0.0.1:5191/`, ranch `http://127.0.0.1:5191/ranch.html`.
- Ranch DOM evidence source: `.animal[data-agent-id]` class names.
- Task evidence source: `window.niumaDesk.createTask()` and `window.niumaDesk.getSnapshot()` through Electron preload API.
- All measured R0-2 visible state changes were `<500ms`.
