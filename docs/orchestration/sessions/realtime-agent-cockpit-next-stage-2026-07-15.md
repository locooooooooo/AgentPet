# realtime-agent-cockpit next stage 2026-07-15

[PM]#realtime-cockpit-next-stage@2026-07-15
⟦tag:v2|session|realtime-agent-cockpit-next-stage-2026-07-15⟧

loop state: summarized
dispatch state: summarized
status: p0_c_authorization_required_after_a7_1_b2_acceptance

## goal

- Preserve accepted A7.1/B2 production-path evidence and hold P0-C behind a fresh explicit external execution authorization.

## confirmed true

- A6 trusted authorization is accepted and pushed as `a44abd6`.
- A7 process fingerprint/restart recovery is independently accepted and pushed as `e2031cd`.
- PID reuse, unproven identity and expired evidence fail closed; controlled child cleanup is zero.
- Connector machine gates remain unchanged and no external Agent CLI has been executed.
- B2 start/running/cancel/timeout/reload/restart and terminal `session-lost` DOM convergence passed with duplicate lifecycle/subscription counts `0`.
- The historical synchronous-CIM B2 blocker was PM p95 `1524ms` against the `500ms` budget.
- A7.1 asynchronous proof is accepted/pushed as `8866305`; PM rerun reached visible-DOM p95 `7ms` while real CIM worker p95 was `564.852ms`.
- Six of six DOM commits completed before proof worker close; child/proof-worker/external Agent residue remained `0`.

## remaining

- A new explicit user execution authorization before any P0-C real Codex E2E.

## serial board

| Order | Card | State | Exit gate |
| --- | --- | --- | --- |
| 1 | `realtime-agent-cockpit-p0-a6-trusted-authorizer-v0.1` | accepted / `a44abd6` | complete |
| 2 | `realtime-agent-cockpit-p0-a7-process-reattach-v0.1` | accepted / `e2031cd` | complete with sync-CIM residual risk |
| 3 | `realtime-agent-cockpit-p0-a7-1-async-process-proof-v0.1` | accepted / `8866305` | async proof + failure matrix + cleanup complete |
| 4 | `realtime-agent-cockpit-p0-b2-production-path-e2e-v0.1` | accepted_after_a7_1 | PM visible-DOM p95 `7ms`; complete |
| 5 | `realtime-agent-cockpit-p0-c-codex-acceptance-v0.1` | authorization_required / ready for decision | new explicit user execution authorization |

## B2 acceptance lock

- Use only a controlled Node child and production Electron main/preload/renderer code paths.
- Cover start, running, cancel, timeout, renderer reload and app restart.
- Render taskId/sessionId/agentId/connectorId/source/lastSeen/PID from one projection.
- Measure event-to-visible-DOM latency while the 5-second CIM identity poll is actually overlapping; idle-only samples are insufficient.
- Require p95 <=500ms, duplicate terminal events=0, duplicate UI subscriptions=0 and controlled child cleanup=0.
- Keep browser fallback simulated/blocked and describe the run as production-path rehearsal, not real Agent E2E.

## resolved failure branch

- The failure branch fired: PM independent overlapping-CIM p95 was `1524ms`.
- The historical blocker was resolved by A7.1 commit `8866305` without weakening identity proof.
- B2 is accepted from the PM fresh rerun; this does not authorize P0-C.

## invariants

- No runtime product worker is active after A7.1/B2 acceptance.
- No Codex, Trae, Qoder or other external Agent CLI execution.
- No Connector machine-gate, UI design, ranch, avatar, keyframe, icon or `agentCore.ts` changes.
- P0-C remains unauthorized even if B2 passes.

## next action

- Preserve the already-pushed A7.1/B2 acceptance control commit `74d8f50`.
- Keep P0-C at `authorization_required` until a new message explicitly authorizes the controlled Codex-only execution envelope.
- Do not execute any external Agent CLI or change Connector machine gates from this session.

## summary

- A7.1 and B2 are accepted; realtime cockpit is now waiting only at the separate P0-C explicit execution-authorization gate, with no external Agent run yet.
