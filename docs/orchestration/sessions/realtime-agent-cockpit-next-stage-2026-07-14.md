# realtime-agent-cockpit next stage 2026-07-14

[PM]#realtime-cockpit-next-stage@2026-07-14
⟦tag:v2|session|realtime-agent-cockpit-next-stage-2026-07-14⟧

loop state: active
dispatch state: active
status: a7_authorized_after_a6_acceptance

## goal

- Move the realtime Agent cockpit from a partial blocked-safe slice to execution-ready infrastructure that remains disabled by policy, then prepare a separate P0-C authorization decision.

## confirmed true

- M5 is closed and pushed; its manual tray/pointer/Windows notification risks remain separate.
- Realtime A1-A5, selector, renderer truth, browser fallback matrix and Electron event p95 are partial-accepted.
- Current machine gates block every configured Connector and no external Agent CLI has been executed.

## missing

- Production main-owned trusted authorization.
- Production process identity proof and restart reattach.
- Production Electron lifecycle rehearsal through visible DOM.
- Separately authorized real Codex Session E2E.

## serial board

| Order | Card | State | Exit gate |
| --- | --- | --- | --- |
| 1 | `realtime-agent-cockpit-p0-a6-trusted-authorizer-v0.1` | accepted / `a44abd6` | callback -> PM verification -> commit -> push -> clean |
| 2 | `realtime-agent-cockpit-p0-a7-process-reattach-v0.1` | authorized | A6 closeout complete; same full gate |
| 3 | `realtime-agent-cockpit-p0-b2-production-path-e2e-v0.1` | standby | A7 closeout, then production-path evidence |
| 4 | `realtime-agent-cockpit-p0-c-codex-acceptance-v0.1` | authorization_required | A6/A7/B2 pass plus a new explicit user execution authorization |

## invariants

- At most one runtime product worker is active.
- A6/A7/B2 do not edit Connector machine gates and do not execute an external Agent CLI.
- Fixture, controlled local process and browser fallback evidence remain distinct from real Agent evidence.
- P0-C remains standby even when A6/A7/B2 pass.

## verification

- Targeted runtime/authorizer/reattach/Electron checks for the current lane.
- `npm.cmd run realtime:truth-check`
- `npm.cmd run orchestration:check`
- `npm.cmd run orchestration:report`
- `npm.cmd run orchestration:preflight`
- `npm.cmd run orchestration:connector-safety`
- `npm.cmd run lint`
- `npm.cmd run build`
- `git diff --check`

## next action

- Commit and push the A6 closeout/A7 authorization switch.
- Dispatch only `[长工]#realtime-process-reattach@v0.1` from the A7 card.

## summary

- Realtime cockpit next stage is active at A7 authorization after A6 blocked-safe acceptance; B2/P0-C remain serially gated.

## A6 acceptance evidence

- Commit: `a44abd6 feat: add trusted connector authorization grants` pushed to `origin/main`.
- Missing/forged/expired/replayed/mismatched/policy-drift/cancelled grants fail before discovery/spawn with exact audit payload.
- Current Codex/Trae/Qoder production policy after confirmed grant remains discovery=0 and spawn=0.
- Preload exposes bounded request/cancel/run APIs without command/args/env/cwd passthrough or renderer self-confirmation.
- Electron propagation: 200 samples, p95=0.454ms <=500ms, external Agent/Connector spawn=0.
- Worker implementation turn hit `403 DAILY_LIMIT_EXCEEDED`; PM completed the bounded test correction and full verification without widening product scope.
