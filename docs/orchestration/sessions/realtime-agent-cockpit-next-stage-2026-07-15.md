# realtime-agent-cockpit next stage 2026-07-15

[PM]#realtime-cockpit-next-stage@2026-07-15
⟦tag:v2|session|realtime-agent-cockpit-next-stage-2026-07-15⟧

loop state: active
dispatch state: active
status: b2_blocked_by_sync_cim_latency

## goal

- Preserve the completed controlled production-path evidence, stop B2 at the proven synchronous-CIM latency blocker, and prepare A7.1 plus P0-C decision packets without authorizing implementation or external Agent execution.

## confirmed true

- A6 trusted authorization is accepted and pushed as `a44abd6`.
- A7 process fingerprint/restart recovery is independently accepted and pushed as `e2031cd`.
- PID reuse, unproven identity and expired evidence fail closed; controlled child cleanup is zero.
- Connector machine gates remain unchanged and no external Agent CLI has been executed.
- B2 start/running/cancel/timeout/reload/restart and terminal `session-lost` DOM convergence passed with duplicate lifecycle/subscription counts `0`.
- PM independent overlapping-CIM visible-DOM latency was `p50=1521ms`, `p95=1524ms`, `max=1524ms` against the `500ms` budget.

## remaining

- Separate user/PM authorization for A7.1 asynchronous process proof implementation.
- A7.1 acceptance followed by a fresh B2 overlap rerun at `p95 <=500ms`.
- A new explicit user execution authorization before any P0-C real Codex E2E.

## serial board

| Order | Card | State | Exit gate |
| --- | --- | --- | --- |
| 1 | `realtime-agent-cockpit-p0-a6-trusted-authorizer-v0.1` | accepted / `a44abd6` | complete |
| 2 | `realtime-agent-cockpit-p0-a7-process-reattach-v0.1` | accepted / `e2031cd` | complete with sync-CIM residual risk |
| 3 | `realtime-agent-cockpit-p0-b2-production-path-e2e-v0.1` | blocked_by_sync_cim_latency | PM p95 `1524ms` > `500ms`; no acceptance |
| 4 | `realtime-agent-cockpit-p0-a7-1-async-process-proof-v0.1` | authorization_required | packet only; no implementation dispatched |
| 5 | `realtime-agent-cockpit-p0-c-codex-acceptance-v0.1` | authorization_required / not eligible | A7.1 + B2 pass plus a new explicit user execution authorization |

## B2 acceptance lock

- Use only a controlled Node child and production Electron main/preload/renderer code paths.
- Cover start, running, cancel, timeout, renderer reload and app restart.
- Render taskId/sessionId/agentId/connectorId/source/lastSeen/PID from one projection.
- Measure event-to-visible-DOM latency while the 5-second CIM identity poll is actually overlapping; idle-only samples are insufficient.
- Require p95 <=500ms, duplicate terminal events=0, duplicate UI subscriptions=0 and controlled child cleanup=0.
- Keep browser fallback simulated/blocked and describe the run as production-path rehearsal, not real Agent E2E.

## failure branch result

- The failure branch fired: PM independent overlapping-CIM p95 was `1524ms`.
- B2 is not accepted and is classified `blocked_by_sync_cim_latency`.
- A7.1 is requirements-only and does not authorize runtime/main edits.

## invariants

- No runtime product worker is active after the B2 callback.
- No Codex, Trae, Qoder or other external Agent CLI execution.
- No Connector machine-gate, UI design, ranch, avatar, keyframe, icon or `agentCore.ts` changes.
- P0-C remains unauthorized even if B2 passes.

## next action

- Commit and push the B2 blocker evidence plus the A7.1 and P0-C decision packets.
- Wait for a new explicit A7.1 implementation authorization; do not dispatch runtime work from this session.
- Keep P0-C at `authorization_required` and do not execute any external Agent CLI.

## summary

- Realtime cockpit next stage is stopped at the proven B2 synchronous-CIM latency blocker; A7.1 and P0-C packets exist, but neither implementation nor external execution is authorized.
