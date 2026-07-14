# realtime-agent-cockpit P0-A6 acceptance

[PM]#realtime-trusted-authorizer@v0.1
⟦tag:v2|session|realtime-agent-cockpit-p0-a6-acceptance-2026-07-14⟧

loop state: summarized
dispatch state: summarized
status: accepted_blocked_safe_authorizer

## delivered

- Electron main owns the explicit confirmation dialog and issues opaque grants for normalized run intent.
- Grants are intent-bound, single-use, expire after a short TTL, detect policy drift and can be cancelled.
- Runtime consumes authorization before policy evaluation; policy still runs before executable discovery/spawn.
- Preload exposes bounded authorization request/cancel and opaque-grant run APIs; browser fallback remains blocked.
- App shutdown clears outstanding grant timers and state.

## verification

| Check | Result |
| --- | --- |
| missing grant | 10/10 blocked before discovery/spawn |
| forged grant | 10/10 blocked before discovery/spawn |
| replay | first ready fixture use accepted; 10/10 replay blocked without new discovery/spawn |
| expiry/mismatch/policy drift/cancel | each blocked with exact session audit reason |
| cleanup | dispose clears all grant timers and invalidates outstanding grants |
| production policy | Codex/Trae/Qoder remain blocked after confirmation; discovery=0, spawn=0 |
| preload boundary | no raw executable/args/env/cwd or renderer confirmation passthrough |
| Electron truth | 200 samples, p95=0.454ms, external spawn=0 |
| quality | runtime/truth/orchestration/preflight/connector-safety/lint/build/diff gates passed |

## scope correction

- PM updated `scripts/check-electron-runtime-latency.mjs` because its old static assertion required the superseded `default-action + confirmationAccepted=false` model. The correction now asserts the A6 main-owned grant contract and does not change runtime behavior.

## residual boundary

- Current Connector machine gates remain unchanged and no external Agent CLI was executed.
- No UI workflow was added; A6 accepts the authorization infrastructure/API, not P0-C usability or real Agent E2E.
- Production process reattach remains A7; production-path rehearsal remains B2.

## evidence

- Product/check commit: `a44abd6`.
- Control baseline: `27ff842`.
- Worker implementation turn ended with service-side `403 DAILY_LIMIT_EXCEEDED`; PM independently reviewed and completed the bounded verification.

## next action

- Authorize only A7 process reattach after this acceptance switch is committed/pushed.

## summary

- A6 accepted as blocked-safe trusted authorization infrastructure; execution policy is still disabled and external spawn remains 0.
