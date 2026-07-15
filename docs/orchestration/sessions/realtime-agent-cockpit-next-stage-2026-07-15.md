# realtime-agent-cockpit next stage 2026-07-15

[PM]#realtime-cockpit-next-stage@2026-07-15
⟦tag:v2|session|realtime-agent-cockpit-next-stage-2026-07-15⟧

loop state: active
dispatch state: active
status: b2_authorized_after_a7_acceptance

## goal

- Exercise the production Electron main -> preload -> renderer -> visible DOM lifecycle with a controlled non-Agent process while every external Connector remains disabled.

## confirmed true

- A6 trusted authorization is accepted and pushed as `a44abd6`.
- A7 process fingerprint/restart recovery is independently accepted and pushed as `e2031cd`.
- PID reuse, unproven identity and expired evidence fail closed; controlled child cleanup is zero.
- Connector machine gates remain unchanged and no external Agent CLI has been executed.

## remaining

- B2 production-path lifecycle rehearsal through visible DOM.
- A decision packet for separately authorized P0-C real Codex E2E.
- A7.1 asynchronous process-proof packet only if B2 proves overlapping synchronous CIM violates the 500ms visible-DOM budget.

## serial board

| Order | Card | State | Exit gate |
| --- | --- | --- | --- |
| 1 | `realtime-agent-cockpit-p0-a6-trusted-authorizer-v0.1` | accepted / `a44abd6` | complete |
| 2 | `realtime-agent-cockpit-p0-a7-process-reattach-v0.1` | accepted / `e2031cd` | complete with sync-CIM residual risk |
| 3 | `realtime-agent-cockpit-p0-b2-production-path-e2e-v0.1` | authorized | one worker -> callback -> PM verification -> commit -> push |
| 4 | `realtime-agent-cockpit-p0-c-codex-acceptance-v0.1` | authorization_required | B2 pass plus a new explicit user execution authorization |

## B2 acceptance lock

- Use only a controlled Node child and production Electron main/preload/renderer code paths.
- Cover start, running, cancel, timeout, renderer reload and app restart.
- Render taskId/sessionId/agentId/connectorId/source/lastSeen/PID from one projection.
- Measure event-to-visible-DOM latency while the 5-second CIM identity poll is actually overlapping; idle-only samples are insufficient.
- Require p95 <=500ms, duplicate terminal events=0, duplicate UI subscriptions=0 and controlled child cleanup=0.
- Keep browser fallback simulated/blocked and describe the run as production-path rehearsal, not real Agent E2E.

## failure branch

- If overlapping CIM polling produces p95 >500ms, stop B2 acceptance at `blocked_by_sync_cim_latency`.
- Prepare an A7.1 asynchronous process-proof requirements packet; do not edit runtime/main from the B2 lane without new authorization.

## invariants

- At most one runtime product worker is active.
- No Codex, Trae, Qoder or other external Agent CLI execution.
- No Connector machine-gate, UI design, ranch, avatar, keyframe, icon or `agentCore.ts` changes.
- P0-C remains unauthorized even if B2 passes.

## next action

- Commit and push this A7 acceptance/B2 authorization control switch.
- Dispatch exactly one `[长工]#realtime-production-path-e2e@v0.1` from the B2 card.

## summary

- Realtime cockpit next stage is active at B2 after A7 acceptance; P0-C remains authorization-required.
