# realtime-agent-cockpit P0-A7.1 asynchronous process proof evidence

[长工]#realtime-async-process-proof@v0.1
⟦tag:v2|task|realtime-agent-cockpit-p0-a7-1-async-process-proof-v0.1⟧

loop state: summarized
dispatch state: summarized
status: accepted

Date: 2026-07-15

## Decision

- Result: accepted by PM independent code review and runtime verification.
- Scope: controlled non-Agent Node processes only. This is not a real Agent E2E.
- External Agent CLI spawn count: `0`.
- Connector machine-gate changes: `0`.

## Implementation evidence

- Windows `Get-CimInstance Win32_Process` now runs through an asynchronous `child_process.spawn` boundary owned by Electron.
- Production fingerprint capture, restart reattach, liveness polling and kill-time reproof do not call synchronous CIM from the Electron main event loop.
- Each proof request carries `taskId`, `sessionId`, PID, generation, hard timeout and `AbortSignal`.
- A task/session has one authoritative in-flight proof. Cancelled, late and superseded generations are discarded.
- Proof results carry generation, observed time, expiry and bounded process evidence.
- Worker crash, unavailable executable, timeout, abort, late result and superseded generation all fail closed.
- A persisted terminal session cannot be revived by a late proof.
- A main-owned child whose initial proof fails before `running` uses one owned-handle rollback kill. It is never published as running.
- A stop requested while initial proof is pending supersedes that proof and waits for a new fresh kill reproof.
- A PID/start-time identity mismatch keeps `process.kill` count at `0`.
- App shutdown waits for runtime termination and proof-service disposal before `app.exit(0)`.

## A7.1 process evidence

Command:

```text
node scripts/check-realtime-process-reattach.mjs
```

Observed result:

```text
OS evidence source=windows-cim
samples=19
p95=628.309ms
max=628.309ms
restart recovery=reattached
negative identity cases=one session-lost each
worker crash=crashed
worker unavailable=unavailable
worker timeout=timeout
worker abort=cancelled
late result=cancelled
superseded generation=cancelled
controlled non-Agent child cleanup=0
asynchronous proof worker cleanup=0
external Agent CLI spawn count=0
```

## Fresh B2 production-path evidence

Command:

```text
node scripts/check-realtime-production-path.mjs
```

Production path:

```text
electron/main.ts -> production preload -> actual React renderer -> visible DOM
```

Observed result:

```text
status=pass
real asynchronous CIM overlap samples=6
visible DOM p50=5ms
visible DOM p95=7ms
visible DOM max=7ms
budget=500ms
CIM worker duration p50=485.346ms
CIM worker duration p95=564.852ms
CIM worker duration max=564.852ms
visible before proof close=6/6
peak proof workers=1
proof worker residue=0
session-lost convergence=5054ms
duplicate started events=0
duplicate terminal events=0
duplicate renderer subscriptions=0
controlled child residue=0
external Agent CLI spawn count=0
```

The DOM probe uses `MutationObserver` against the final detail-panel data attribute. This avoids hidden-window `requestAnimationFrame` throttling while still requiring the actual React DOM commit. A synchronous CIM call in production main is rejected by the harness.

## Lifecycle and identity safety

- Controlled start reaches `running` only after bounded process fingerprint proof succeeds.
- Controlled cancel reaches `stopped` with `exitConfirmed=true`.
- Controlled timeout reaches `timed-out` with `exitConfirmed=true`.
- Renderer reload delivers each production snapshot once.
- Restart reattach preserves task/session/agent/connector/source/lastSeen/PID projection.
- Missing or mismatched process identity reaches `session-lost` within 10 seconds.
- Stop, timeout, dispose and app quit leave no controlled child and no proof worker.

## Residual limitation

- The production default child remains `detached:false`, so forced Electron termination does not prove child survival. Restart recovery remains proven with an externally started detached controlled Node seed only.
- No Codex, Trae, Qoder, OpenClaw, Claude, MiniMax, OpenCode or other Agent CLI was executed.

## Validation

The PM independent acceptance run includes:

```text
node scripts/check-connector-runtime.mjs
node scripts/check-realtime-process-reattach.mjs
node scripts/check-realtime-production-path.mjs
npm.cmd run realtime:truth-check
npm.cmd run realtime:electron-latency
npm.cmd run orchestration:check
npm.cmd run orchestration:report
npm.cmd run orchestration:preflight
npm.cmd run orchestration:connector-safety
npm.cmd run lint
npm.cmd run build
node --check scripts/check-connector-runtime.mjs
node --check scripts/check-realtime-process-reattach.mjs
node --check scripts/check-realtime-production-path.mjs
git diff --check
```

The isolated production Electron propagation check also passed at `p95=0.498ms`. The final candidate left `0` controlled verifier processes, `0` proof workers and `0` external Agent CLI spawns.
