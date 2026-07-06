[长工]#r0-visual-replay-acceptance@2026-07-04

⟦tag:v2|session|r0-visual-replay-acceptance-2026-07-04⟧
⟦tag:v2|task|ranch-real-integration-p0-v0.1⟧

loop state: summarized
dispatch state: summarized

date: 2026-07-04
source thread: `019f26de-64b4-7420-82b5-017687a18e48`
task card: `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`

supersession:
- Historical partial evidence below is superseded for R0-2 by `docs/orchestration/sessions/r0-visual-replay-accepted-2026-07-04.md`.
- The superseding pass fixed immediate runtime propagation and accepted R0-2 with all visible replay latencies under `500ms`.

objective:
- R0-2 visible replay acceptance only.
- Collect Electron/CDP/runtime evidence for local runner task lifecycle to ranch visible state mapping.
- Do not implement fixes and do not execute external connectors.

scope guard:
- No Codex/Trae/Qoder/external connector was enabled, bound, or executed.
- No `approvalStatus` was changed to `accepted`.
- No `enabledByDefault` was changed to `true`.
- No implementation file was edited in this lane.
- No Git stage/commit/push/reset/clean/checkout/revert was run.

runtime setup:
- Started Vite on `http://127.0.0.1:5187/`.
- Started Electron with `--remote-debugging-port=9223`.
- CDP targets found:
  - `多 Agent 牛马核心部门` at `http://127.0.0.1:5187/`
  - `桌面牧场` at `http://127.0.0.1:5187/ranch.html`
- Electron preload API check: `window.niumaDesk` present, `agentCount=8`.
- Ranch DOM check: `.animal[data-agent-id]` count `8`.

acceptance result:
- Partially accepted for R0-2 data-to-visible replay evidence.
- Not accepted for `<500ms` complete visual switching requirement.

completed:
- Success path verified with local runner commands for all 8 animals.
  - run id: `r0-visual2-mr5rgqch`
  - representative command: `node -e "setTimeout(()=>console.log('all8 codex done'),1400)"`
  - representative task: `task-1783133194342-oqr1t`
  - task result: `status=success`, `progress=100`, `exitCode=0`
  - visible initial work pose: all 8 animals reached `pose-work_type` / `coding`
  - visible final pose: all 8 animals reached `pose-done_cheer` / `done`
  - `done` appeared within 10s of task end; measured max visible latency after task end: `1313ms`
- Failure path verified with a non-zero local runner command.
  - command: `node -e "console.error('r0 failure path');process.exit(7)"`
  - task: `task-1783133197258-4mfdp`
  - task result: `status=error`, `progress=8`, `exitCode=7`
  - visible ranch pose: `pose-panic_smoke` / `panicking`
  - measured visible latency after task end: `2339ms`
- Long-running path verified.
  - command: `node -e "let n=0;const t=setInterval(()=>{console.log('r0 long '+(++n));if(n>=9){clearInterval(t)}},1000)"`
  - task: `task-1783133199770-xpiqa`
  - running progress left initial segment: observed `progress=12`
  - visible busy mapping observed: `pose-test_drip` / `testing`
  - final result: `status=success`, `progress=100`, `exitCode=0`
- Deploy/release keyword path verified as visible mapping, but not under `<500ms`.
  - command: `node -e "console.log('deploy start');let n=0;const t=setInterval(()=>{console.log('deploy '+(++n));if(n>=6){clearInterval(t)}},1000)"`
  - task: `task-1783133209213-zcb1q`
  - command contains `deploy`
  - visible pose while task still running: `pose-deploy_pray` / `deploying`
  - measured visible latency after invoke: `623ms`
  - final result: `status=success`, `progress=100`, `exitCode=0`

incomplete:
- `<500ms` visual switch is not accepted.
  - initial `coding` switch was observed at `0ms` after all 8 create calls returned.
  - success-to-`done` visible switch measured `1313ms`, so not `<500ms`.
  - failure-to-`panicking` visible switch measured `2339ms`, so not `<500ms`.
  - deploy command-to-`deploying` visible switch measured `623ms`, so not `<500ms`.
- This lane did not validate OS notification icon behavior; that remains R0-4.
- This lane did not enable connectors or connector defaults; R0-3 remains outside this acceptance lane.
- This lane did not update README wording; R0-5 remains outside this acceptance lane.

blockers:
- R0-2 cannot be called fully visually accepted because the `<500ms` visible-switch requirement failed for `done`, `panicking`, and `deploying`.
- Current visible status update cadence appears bounded by runtime/tick propagation rather than immediate task close propagation; this is recorded as evidence only, not fixed in this lane.
- External connector execution remains blocked by connector policy and was not used as evidence.

next action:
- PM should keep R0-2 as partial/incomplete for the `<500ms` visual acceptance item.
- If PM wants full R0-2 acceptance, open a separate implementation lane to reduce visible replay latency and then rerun this acceptance set.
- Keep R0-3/R0-4/R0-5 closed to this lane unless PM opens separate bounded lanes.

evidence:
- CDP target enumeration succeeded before task testing.
- First large CDP evidence pass created local runner tasks but produced oversized output and had a status parsing issue; the second compact pass used DOM class names as visible evidence.
- Compact evidence run id: `r0-visual2-mr5rgqch`.
- DOM evidence source: `.animal[data-agent-id]` `className` values:
  - `pose-work_type` => visible `coding`
  - `pose-done_cheer` => visible `done`
  - `pose-panic_smoke` => visible `panicking`
  - `pose-test_drip` => visible `testing`
  - `pose-deploy_pray` => visible `deploying`
- Task evidence source: `window.niumaDesk.createTask()` and `window.niumaDesk.getSnapshot()` through Electron preload API.
- Commands used only local runner safe `node -e ...` commands.
- No external connector command was executed.
