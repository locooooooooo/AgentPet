[PM]#ranch-real-integration-p0@v0.1

⟦tag:v2|session|ranch-real-integration-p0-progress⟧

loop state: summarized
dispatch state: summarized

date: 2026-07-03
source plan: `docs/orchestration/sessions/daily-plan-2026-07-03.md`
task card: `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`

completed:
- R0-1 code path is implemented in `electron/main.ts`.
- `agents:create-task` starts `startLocalRunner()` for `runner: local`.
- Local runner uses a command whitelist and `spawn(file, args, { shell: false })`.
- `echo`, `exit`, `node`, `npm`, `npx`, and `git` are resolved without shell execution.
- Electron-specific bug fixed: Node-backed commands now locate real `node.exe` instead of using Electron's `process.execPath`.
- stdout/stderr are streamed into task logs, `close` maps exit code `0` to `success` and non-zero/null to `error`.
- Local running tasks now get a lightweight progress heartbeat up to 90% so long-running commands can leave the initial `<10%` state.
- R0-2 front half is implemented in `src/lib/agentCore.ts`: `getNiuMaEffectiveStatus()` maps running/success/error task lifecycle into NiuMa runtime status.
- `deploy` / `release` commands now map to `deploying` before the early-progress `coding` fallback.
- `progressNiuMaTick()` writes effective status/quote/customState changes into `runtime`.
- Final dev server and Electron dev instance were restarted after the fixes.
- R0-2 full visible replay is accepted in `docs/orchestration/sessions/r0-visual-replay-accepted-2026-07-04.md`.
- `syncAgentTaskRuntime()` now pushes task lifecycle changes into runtime immediately, and `electron/main.ts` `patchTask()` publishes that runtime status without waiting for the 2.5s tick.
- Electron/CDP proof accepted deploy, failure, long-running progress, and all 8 success paths with max visible latency `2ms`.
- R0-4 notification icon wiring is accepted in `docs/orchestration/sessions/r0-notification-icons-accepted-2026-07-04.md`.
- R0-5 README wording is accepted in `docs/orchestration/sessions/r0-readme-closeout-2026-07-04.md`.
- R0-3 connector decision is recorded in `docs/orchestration/sessions/r0-connector-decision-2026-07-04.md`: default connector enablement remains no-go/deferred until explicit connector acceptance exists.

incomplete:
- R0-3 connectors default enabled is not accepted; connector policy still intentionally blocks Codex/Trae/Qoder execution.
- Control-cockpit central 4x2 matrix remains locked by user instruction and was not used as a write surface.
- `docs/orchestration/index.md` and `docs/orchestration/status.json` still primarily track the 2026-07-02 supervision control plane; migrating 2026-07-03 P0 cards into that control plane should be a separate bounded PM update.

blockers:
- External connector execution remains disabled and evaluate-only.
- Transparent Electron pointer screenshot still hits `SetIsBorderRequired failed: 0x80004002`; do not count that as pointer-smoke acceptance.
- Browser fallback cannot validate real spawn because `src/lib/desktopClient.ts` forces browser-created tasks to simulated runner.

next action:
- Treat R0-1, R0-2, R0-4, and R0-5 as accepted.
- Keep R0-3 connector enablement deferred until PM/user explicitly accepts connector machine-gate changes.
- Keep central matrix files locked unless the user explicitly opens a new UI lane.
- If 2026-07-03 P0 needs to become report-visible, update orchestration index/status/report rules as a control-plane migration, not as an incidental code change.

evidence:
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.
- `npm.cmd run orchestration:check` passed, `Referenced cards: 34`.
- `npm.cmd run orchestration:preflight` passed; codex remains draft/pending/enabled=false, trae/qoder remain placeholder/not-requested/enabled=false.
- `npm.cmd run orchestration:connector-safety` passed; raw connector execution surface remains absent.
- In-app browser smoke after restart: title `多 Agent 牛马核心部门`, H1 `桌面牧场 · 控制舱`, 8 `.agent-card-hit` cards, `本地命令` and `立即派活` visible.
- Electron CDP smoke `echo codex-r0-smoke-fixed`: `taskStatus=success`, `progress=100`, `exitCode=0`, logs included `stdout: codex-r0-smoke-fixed`, runtime status `done`.
- Electron CDP long-task smoke `node -e "setTimeout(console.log, 3500, 12345)"`: mid-run `status=running`, `progress=18`; final `status=success`, `progress=100`, `exitCode=0`, logs included `stdout: 12345`, runtime status `done`.
- R0-2 accepted CDP run on 2026-07-04: deploy `2ms`, failure `1ms`, long-running progress `1ms`, all-8 success max `2ms`; visible classes were `pose-deploy_pray`, `pose-panic_smoke`, `pose-work_type`, and `pose-done_cheer`.
- R0-4 accepted CDP run on rebuilt dist: `notifyDirect.codexIcon=true`, `openclawAlias=true`, `openccodeAlias=true`, `fallbackMissing=true`; success message `agentId=codex`, error message `agentId=trae`.
- R0-5 README evidence: first paragraph contains `Electron 主进程 IPC + child_process.spawn`; current scope contains `真实 spawn 失败时回退到模拟 runner fallback`.

protected-file note:
- Earlier 2026-07-03 R0 slice did not edit the cockpit matrix or selling-point files.
- The 2026-07-04 user-requested acceptance pass intentionally edited `src/lib/agentCore.ts`, `electron/main.ts`, and `src/index.css` to close R0-2 latency; it did not enable connectors or run external agents.
