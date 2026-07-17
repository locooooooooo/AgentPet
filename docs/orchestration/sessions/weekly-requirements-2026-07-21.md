# weekly-requirements-2026-07-21

[PM]#weekly-requirements@2026-07-21
⟦tag:v2|session|weekly-requirements-2026-07-21⟧

loop state: active
dispatch state: active
status: active_early_under_full_schedule_and_phase_waiver

> **Original planning window**: 2026-07-21 through 2026-07-27
> **Compressed activation and DDL**: 2026-07-17
> **Administrator decision**: The later five-day plan and all DDLs are due today. This explicitly waives the W28 closeout date gate and the local scheduler-core phase dependency.
> **Hard boundary**: The waiver authorizes one local/fixture-only scheduler-core worker. It does not authorize P0-C, R0-3, external Agent CLI execution, Connector machine-gate changes or pointer input.

## single goal

- Deliver and independently verify the smallest deterministic scheduler core: global concurrency `1`, same-Agent single-active admission, explicit dependencies, queued cancellation, spawn-based timeout and auditable retry/terminal transitions.

## accepted inputs

- W28 closeout candidate and seven non-blocking carry-over rows are frozen in `weekly-closeout-2026-07-20.md` under the administrator's full schedule waiver.
- Scheduler requirements, exact future file fence and S-01 through S-16 fixtures are accepted in `realtime-p1-scheduler-intake-v0.1.md`.
- Baseline before this transition is `HEAD == origin/main == a1637c1` with only unrelated user-owned `README.md` and `docs/牛马状态回执音效规范-v0.1.md` changes present.
- Current product implementation worker count is `0`; external Agent CLI spawn count is `0`.

## same-day development board

| Order | Requirement | Owner | DDL | Exit evidence |
| --- | --- | --- | --- | --- |
| 1 | W28 pre-closeout and carry-over freeze | `[监督]#w28-closeout-readiness@2026-07-17` | 2026-07-17 | Closeout candidate, seven non-blocking rows, fresh gates |
| 2 | W28 final control transition | `[PM]#weekly-closeout@2026-07-20` | 2026-07-17 | W28 summarized, next weekly truth active, pushed parity |
| 3 | Scheduler requirements acceptance | `[短工]#realtime-p1-scheduler-intake@v0.1` | 2026-07-17 | Exact contract, file fence, failure matrix and S-01 through S-16 |
| 4 | Scheduler-core implementation | `[长工]#realtime-p1-scheduler-core@v0.1` | 2026-07-17 | Bounded callback, S-01 through S-16, max concurrency evidence, external spawn `0` |
| 5 | PM acceptance and publication | `[PM]#multi-agent-control@v0.1` | 2026-07-17 | Full recurring gates, exact diff review, commit, push and remote parity |

## P0 requirement

- Implement only the contract in `realtime-p1-scheduler-intake-v0.1.md`.
- Keep global process concurrency fixed at `1` with no configuration UI.
- Keep one active task per Agent identity.
- Fail closed on unknown, self, duplicate and cyclic dependencies.
- Start timeout only after confirmed spawn; expose queue wait separately.
- Stop queued tasks without PID, kill or spawn and emit exactly one terminal event.
- Preserve normalized retry rules, redaction, persistence, restart recovery and terminal idempotency.

## incomplete after this slice

- P0-C real Codex Agent E2E remains authorization-required and unexecuted.
- Configurable concurrency, priority, starvation protection, recursive cancellation DAG and per-Connector quotas remain future P1 work.
- Trae Models readiness, Qoder headless API, pointer evidence and AgentPet review remain separate carry-over items.

## file boundary

Allowed only:

- `src/types.ts`
- `src/lib/connectorRuntime.ts`
- `scripts/check-connector-scheduler.mjs`
- `scripts/check-connector-runtime.mjs` only for the legacy `selectorHarness` / `tieHarness` concurrency conflict confirmed by PM
- `docs/orchestration/sessions/realtime-p1-scheduler-core-evidence-2026-07-17.md`

Everything else is forbidden unless the worker stops and PM explicitly expands the fence. The runtime script expansion may not weaken unrelated safety assertions. In particular: no `electron/**`, UI/CSS, ranch, protected cockpit, package/config, Connector machine-gate, `README.md`, audio-spec, external Agent CLI or Git write.

## acceptance

- Exactly one product worker is active at a time.
- All S-01 through S-16 fixtures pass with maximum global active process `1`, maximum same-Agent active process `1`, external Agent CLI spawn `0` and duplicate terminal count `0`.
- Existing connector runtime, reattach, realtime truth, orchestration, Connector safety, lint, build and `git diff --check` all pass.
- PM independently reviews the diff and does not infer real Agent E2E from controlled local fixtures.

next action:
- Publish the same-day control baseline, dispatch exactly one scheduler-core worker, collect its callback and perform independent PM acceptance today.

summary:
- Next-stage requirements are active early under the administrator's full schedule and phase waiver; one local scheduler-core slice is due today while every external execution gate remains closed.
