# realtime-agent-cockpit P0-B2 production-path evidence 2026-07-15

[长工]#realtime-production-path-e2e@v0.1
⟦tag:v2|session|realtime-agent-cockpit-p0-b2-production-path-evidence-2026-07-15⟧

loop state: summarized
dispatch state: summarized
status: accepted_after_a7_1

## scope statement

- This was a production-path rehearsal with controlled non-Agent Node processes.
- It was not real Agent E2E and did not execute Codex, Trae, Qoder, OpenClaw, Claude, MiniMax or OpenCode.
- The repository Connector policy and `status.json` `connectors[]` remained unchanged. The accepted `node` policy existed only under a generated OS temporary directory.

## production path proved

- Unmodified built production `electron/main.ts` loaded `dist-electron/main.cjs`.
- Production `electron/preload.ts` loaded `dist-electron/preload.cjs`.
- The actual built React renderer loaded `dist/index.html`.
- The renderer requested a main-owned one-shot grant, invoked production Connector IPC, received production runtime publications through preload, projected the runtime truth and made it observable in the actual DOM.
- One projected record exposed `taskId`, `sessionId`, `agentId`, `connectorId`, task source, instance source, `lastSeen`, PID and runtime task state without a separate renderer truth source.

## lifecycle evidence

- cancel: `running -> stopped`, `exitConfirmed=true`, duplicate `session-started=0`, duplicate `session-terminal=0`.
- timeout: `running -> timed-out`, `exitConfirmed=true`, duplicate `session-started=0`, duplicate `session-terminal=0`.
- renderer reload: production runtime sends `7`, B2 probe deliveries `7`, duplicate deliveries `0`; the previous terminal state remained `stopped`.
- production-controlled Node spawns: `2`; external Agent CLI spawns: `0`.
- Final controlled child count was `0`; no B2 Electron process remained.

## production restart evidence

- Production's default `detached:false` spawn envelope did not survive a forced Electron termination, so ordinary production-spawn crash survival and A7 reattach were not proved.
- A separate controlled detached Node seed was created by the outer harness with `stdio: ignore`, an explicit temporary cwd, a 120-second timeout and explicit cleanup.
- Real Windows CIM evidence produced the bounded A7 fingerprint/run envelope. A sanitized active runtime snapshot was written only to the temporary Electron userData data path.
- Unmodified production main consumed that snapshot, reattached the seed through real Windows CIM, and production preload plus the actual renderer projected its task/session/agent/connector/source/lastSeen/PID identity.
- In the PM independent rerun, killing the controlled seed made production runtime reach `session-lost` in `4345ms`, within the 10-second bound.
- The actual DOM converged to `data-runtime-state="session-lost"`; its visible `Runtime task state:` metric value was `session-lost`.

## terminal projection diagnosis

- Production runtime publication, the preload subscription delivery, the App projection's primary instance and selected task, and the final detail-panel DOM all contained the same terminal task and `session-lost` state.
- The earlier `blocked_by_terminal_projection_dom` result was a harness false negative. It required the case-sensitive contiguous substring `Runtime task state: session-lost` in `innerText`, while the label and value are separate elements and CSS renders the label uppercase.
- The corrected assertion checks `data-runtime-state`, the metric label element and the visible metric value separately. No App state, projection ordering or runtime/main defect was found.

## pre-A7.1 synchronous CIM latency

- Six samples began timing immediately before a real synchronous Windows CIM query. Each tagged snapshot was published only after that query returned, and completion required the tagged `lastSeen` to reach the actual DOM.
- PM independent visible-DOM samples in collection order: `1524ms`, `1522ms`, `1524ms`, `1521ms`, `1520ms`, `1521ms`.
- PM aggregate: `p50=1521ms`, `p95=1524ms`, `max=1524ms`, against the `500ms` P95 budget.
- PM CIM probe-duration aggregate: `p50=1019.402ms`, `p95=1417.502ms`, `max=1417.502ms`.
- The worker's final-build rerun also exceeded budget (`p95=1542ms`); the PM rerun is the acceptance authority used for classification.
- The harness emits `B2_OVERLAP_AGGREGATE` before the terminal-loss assertion, so later assertions cannot erase this latency evidence.

## pre-A7.1 acceptance result

- Passed: start, running, actual DOM identity, cancel, timeout, renderer reload, app restart reattach through an external controlled seed, terminal `session-lost` DOM convergence, lifecycle uniqueness, subscription uniqueness and cleanup.
- Passed: duplicate started events `0`, duplicate terminal events `0`, duplicate renderer subscriptions `0`, controlled child residue `0`, external Agent CLI spawn `0`.
- Not proved: ordinary production-spawn crash survival under forced Electron termination.
- Blocked: PM independent overlapping-CIM visible-DOM `p95=1524ms` exceeds the `500ms` budget.
- At this historical checkpoint B2 was not accepted and was classified `blocked_by_sync_cim_latency`; this blocker is superseded by accepted A7.1 commit `8866305` and the fresh PM rerun below.

## changed files

- `scripts/check-realtime-production-path.mjs`
- `src/lib/agentInstanceProjection.ts`
- `src/components/NiuMaWorkspace.tsx`
- `docs/orchestration/sessions/realtime-agent-cockpit-p0-b2-production-path-evidence-2026-07-15.md`

## validation results

- PASS: `node scripts/check-realtime-production-path.mjs` with final status `blocked_by_sync_cim_latency`.
- PASS: `npm.cmd run realtime:truth-check`.
- PASS: `node scripts/check-connector-runtime.mjs`.
- PASS: `node scripts/check-realtime-process-reattach.mjs` (`p95=1167.756ms`, controlled child cleanup `0`, external Agent CLI spawn `0`).
- PASS: `npm.cmd run realtime:electron-latency` (`p95=0.371ms`; no overlapping synchronous CIM in this isolated propagation check).
- PASS: `npm.cmd run orchestration:check`.
- PASS: `npm.cmd run orchestration:report`.
- PASS: `npm.cmd run orchestration:preflight`.
- PASS: `npm.cmd run orchestration:connector-safety`.
- PASS: `npm.cmd run lint`.
- PASS: `npm.cmd run build` with fresh production main, preload and renderer assets.
- PASS: `node --check scripts/check-realtime-production-path.mjs`.
- PASS: `git diff --check`.
- PASS: repository `docs/orchestration/connectors.json` remained byte-for-byte unchanged and `status.json` `connectors[]` remained unchanged under harness hard assertions.

## pre-A7.1 summary

- B2's terminal projection was sound, but synchronous Windows CIM blocked the <=500ms visible-DOM budget before A7.1; no external Agent ran.

## A7.1 PM rerun acceptance

- A7.1 implementation commit: `8866305`.
- Production main rejects synchronous CIM and uses one asynchronous proof worker per task/session.
- Six real async-CIM overlaps reached the actual React DOM at `p50=5ms`, `p95=7ms`, `max=7ms` against the `500ms` budget.
- Real CIM worker duration was `p50=485.346ms`, `p95=564.852ms`, `max=564.852ms`; 6/6 DOM commits completed before worker close.
- Peak proof workers `1`; proof worker residue `0`.
- Runtime reached `session-lost` in `5054ms`; terminal DOM, preload delivery and App projection agreed.
- Duplicate started/terminal/subscription counts were `0/0/0`; controlled child residue `0`; external Agent CLI spawn `0`.
- PM independently reran connector runtime, A7.1 reattach/failure matrix, B2, truth, Electron latency, orchestration gates, lint, build and diff checks.

## final summary

- B2 is accepted after A7.1. This is controlled non-Agent production-path evidence only; P0-C real Agent E2E remains unexecuted and requires a fresh explicit authorization.
