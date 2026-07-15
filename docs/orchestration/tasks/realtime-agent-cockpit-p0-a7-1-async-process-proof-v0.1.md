# realtime-agent-cockpit P0-A7.1 asynchronous process proof

[长工]#realtime-async-process-proof@v0.1
⟦tag:v2|task|realtime-agent-cockpit-p0-a7-1-async-process-proof-v0.1⟧

loop state: standby
dispatch state: standby
status: authorization_required
priority: P0-A7.1

## objective

- Move Windows process identity proof off the Electron main event loop while preserving A7 fingerprint, PID-reuse, fail-closed and cleanup guarantees.
- Restore the B2 overlapping-CIM event-to-visible-DOM budget to `p95 <=500ms` without weakening process identity evidence.

## trigger evidence

- B2 controlled production-path lifecycle and terminal DOM passed.
- PM independent six-sample overlap measured `p50=1521ms`, `p95=1524ms`, `max=1524ms` against the `500ms` budget.
- The isolated Electron publication path remained fast (`p95=0.371ms`), while A7 Windows CIM proof itself measured `p95=1167.756ms`.
- The blocker is synchronous Windows CIM on the Electron main path, not renderer subscription, App projection or DOM convergence.

## required design

- Run Windows CIM/process proof in an asynchronous worker boundary that cannot block Electron's event loop.
- Keep one authoritative process-proof result envelope containing PID, executable, creation time, normalized cwd, observedAt, expiry and request generation.
- Ignore late, stale, cancelled or superseded worker results; they must never resurrect a stopped or `session-lost` session.
- Bound every proof request with timeout and cancellation. Worker timeout/crash/unavailable must fail closed and publish an auditable reason.
- Coalesce polling so one active session cannot accumulate overlapping proof requests.
- Reprove identity before kill/stop escalation. PID reuse or identity mismatch must keep process kill count at `0`.
- Preserve restart reattach and 10-second `session-lost` convergence with deterministic cleanup on stop, timeout, dispose and app shutdown.

## proposed file fence

- `src/types.ts` only if the asynchronous proof result contract needs a shared type.
- `src/lib/connectorRuntime.ts` for bounded proof scheduling, ordering and fail-closed state handling.
- `electron/main.ts` for the Electron-owned asynchronous worker boundary.
- One narrowly named worker/helper under `electron/` if required.
- `scripts/check-connector-runtime.mjs` and `scripts/check-realtime-process-reattach.mjs` for deterministic A7.1 coverage.
- `scripts/check-realtime-production-path.mjs` only to rerun the existing B2 acceptance measurement.
- One A7.1 evidence session and necessary control-plane state files.

The exact implementation fence must be reapproved in the dispatch message. This packet does not authorize edits.

## forbidden

- Connector machine-gate, `docs/orchestration/connectors.json` or `status.json` `connectors[]` changes.
- Preload, renderer, UI, CSS, ranch, avatar, keyframe, icon or `agentCore.ts` changes.
- Relaxing executable/cwd/start-time/freshness/PID-reuse checks to gain latency.
- Treating cached or stale proof as fresh without a generation and expiry match.
- Executing Codex, Trae, Qoder, OpenClaw, Claude, MiniMax, OpenCode or another external Agent CLI.
- Calling the controlled Node proof a real Agent E2E.

## acceptance

- Static and runtime evidence proves no synchronous Windows CIM call runs on Electron's event loop during poll, reattach, stop or kill reproof.
- A7 positive and negative fingerprint cases remain green, including missing/wrong/expired/future/reused PID/executable/start/cwd/identity.
- PID-reuse kill count remains `0`.
- Worker crash, timeout, cancellation, late result and superseded-generation fixtures all fail closed.
- Restart recovery still reaches `reattached` or `session-lost` within 10 seconds.
- Stop, timeout, dispose and app shutdown leave `0` controlled children and `0` proof workers.
- Fresh B2 production overlap uses at least six real CIM samples and reaches visible DOM at `p95 <=500ms`.
- Duplicate lifecycle events and renderer subscriptions remain `0`.
- External Agent CLI spawn remains `0`; Connector machine gates remain byte-for-byte unchanged.

## required validation

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
git diff --check
```

## authorization gate

- Current decision: requirements packet prepared, implementation not authorized.
- A new explicit PM/user message must authorize the exact file fence and one runtime worker.
- B2 and P0-C remain blocked until A7.1 is independently accepted, committed and pushed.

## callback

```text
completed:
incomplete:
blockers:
latency evidence:
identity safety:
cleanup:
external Agent spawn:
next action:
```

## summary

- A7.1 is a decision-ready asynchronous process-proof repair packet created from the proven B2 latency blocker; no implementation or external Agent execution is authorized.
