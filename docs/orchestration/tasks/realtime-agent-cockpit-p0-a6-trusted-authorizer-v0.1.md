# realtime-agent-cockpit P0-A6 trusted authorizer

[长工]#realtime-trusted-authorizer@v0.1
⟦tag:v2|task|realtime-agent-cockpit-p0-a6-trusted-authorizer-v0.1⟧

loop state: summarized
dispatch state: summarized
status: accepted_blocked_safe_authorizer
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

- A6 implementation/check commit `a44abd6` is pushed and independently PM-verified.
- Continue serially with A7 process reattach only; B2 and P0-C remain standby.

## summary

- A6 is accepted as blocked-safe authorization infrastructure: main-owned dialog/grant, intent binding, single use, TTL, replay/expiry/mismatch/policy-drift/cancel cleanup and exact audit reasons pass; current production policy remains `discovery=0/spawn=0` and no external Agent CLI ran.
