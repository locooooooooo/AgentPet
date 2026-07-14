# realtime-agent-cockpit P0-A6 trusted authorizer

[长工]#realtime-trusted-authorizer@v0.1
⟦tag:v2|task|realtime-agent-cockpit-p0-a6-trusted-authorizer-v0.1⟧

loop state: active
dispatch state: active
status: authorized_pending_worker
priority: P0-A6

## objective

- Add a production main-process authorization boundary that can prove one explicit user confirmation belongs to exactly one Connector run attempt.
- Keep every configured Connector blocked by its existing machine gate; this card must not execute an external Agent CLI.

## confirmed baseline

- A1-A5 blocked-safe runtime, gate evaluation, structured events, persistence, retry/termination and renderer trusted-intent fail-closed are already partial-accepted.
- Production `createConnectorRuntime()` intentionally has no `authorizeRun`; renderer-supplied confirmation is forced false.
- `HEAD == origin/main == 79c3669` and the worktree was clean when this card was authorized.

## allowed files

- `src/types.ts`
- `src/lib/connectorRuntime.ts`
- Connector-only hunks in `electron/main.ts`
- `electron/preload.ts`
- `src/lib/desktopClient.ts`
- `scripts/check-connector-runtime.mjs`
- `scripts/check-preload-connector-api.mjs`
- One new dedicated authorizer check under `scripts/check-realtime-*.mjs`

## forbidden

- `docs/orchestration/connectors.json` and `docs/orchestration/status.json` `connectors[]`
- `src/components/**`, `src/homepage/**`, `src/index.css`, `src/lib/agentCore.ts`, `src/ranch/**`, `icon/**`, `package.json`
- Any Codex/Trae/Qoder/OpenClaw/Claude/MiniMax/OpenCode execution
- Arbitrary renderer command/args/env/cwd input
- Stage, commit, push, reset, clean or force-push by the worker

## contract

- Confirmation is owned by Electron main and bound to a normalized run intent.
- Grants are opaque, single-use, short-lived and invalid after use, expiry, cancellation, policy drift or app restart.
- Renderer cannot set `requestedBy`, `confirmationAccepted`, final command, args, environment or cwd.
- Missing, forged, expired, replayed or mismatched grants fail before discovery/spawn and emit a bounded audit reason.
- Existing policy remains authoritative after confirmation; a trusted confirmation never upgrades draft/pending/disabled policy.
- Browser fallback remains simulated and blocked.

## acceptance

| Check | Pass condition |
| --- | --- |
| missing confirmation | 10/10 blocked before discovery/spawn |
| forged/replayed grant | 10/10 blocked; stable audit reason; spawn=0 |
| expiry | deterministic clock proves expired grant cannot run |
| intent binding | changed connector/agent/task/prompt invalidates the grant |
| single use | first accepted fixture consumes grant; second attempt blocked |
| policy authority | current production Codex/Trae/Qoder policy still produces spawn=0 |
| renderer boundary | no raw executable/args/env/cwd or self-confirmation surface |
| cleanup | app shutdown clears all outstanding grants/listeners/timers |
| quality | realtime runtime checks, orchestration gates, lint, build and diff check pass |

## callback

```text
completed:
incomplete:
blockers:
next action:
evidence:
changed files:
```

## next action

- Dispatch exactly one A6 runtime worker after this card is committed and pushed.
- Keep A7, B2 and P0-C standby until A6 callback, independent PM verification and commit/push.

## summary

- A6 is the only authorized product lane. It may install the trusted authorization boundary but may not enable or execute a Connector.
