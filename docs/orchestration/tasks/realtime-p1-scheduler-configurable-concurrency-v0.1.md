# Realtime P1 Scheduler Configurable Concurrency Intake v0.1

[短工]#realtime-p1-scheduler-configurable-concurrency@v0.1
⟦tag:v2|task|realtime-p1-scheduler-configurable-concurrency-v0.1⟧

loop state: active
dispatch state: active
status: accepted_dispatch_ready_after_independent_review
date: 2026-07-17
ddl: 2026-07-17

## single goal

Freeze the smallest runtime-internal configurable global-concurrency contract on top of accepted scheduler commit `ccedb15`, without opening priority, starvation, recursive cancellation, Connector quotas, UI configuration or external Agent execution.

## confirmed baseline

- Scheduler S-01 through S-16 and review regressions R-01 through R-03 are accepted/pushed at `ccedb15`.
- Current production behavior remains global concurrency `1`, same-Agent active concurrency `1`, and external Agent spawn `0`.
- `ConnectorRuntime` owns queue admission, dependency evaluation, retry, timeout, recovery reservations and terminal idempotency.
- The shared worktree contains unrelated Hub, Electron, UI, quota, Vite and user-document changes. In particular, `src/types.ts` contains account-quota hunks owned by another Lane and is forbidden to this intake.

## first-principles boundary

1. This moves the active scheduler P1 buffer forward by closing exactly one missing capability: a bounded runtime concurrency setting.
2. It preserves all current non-goals: no external execution, no machine-gate change, no renderer-owned scheduling and no unrelated Hub/quota absorption.
3. It is verifiable with deterministic fake-process fixtures and the existing runtime/truth/orchestration gates.

## minimum contract

### configuration source

- Add one runtime-construction setting named `maxGlobalActive`; absence preserves the current default `1`.
- The accepted range is integer `1` through `4`. Zero, negative, fractional, non-finite or values above `4` fail construction before any Session, timer, process or audit side effect exists.
- The setting is immutable for one runtime lifetime. Live reconfiguration, persisted user preference, command-line flags, Electron IPC and UI controls are out of scope.
- A request, renderer, Connector policy record or recovered Session may not override the runtime-owned limit.

### admission and reservations

- Concurrent confirmed or still-reserved process slots never exceed `maxGlobalActive` because of a new spawn.
- Same-Agent active concurrency remains fixed at `1`, independent of the global value.
- Unconfirmed process close retains its slot. A `session-lost` label alone is not exit evidence and cannot release admission.
- Each in-flight recovery proof reserves one global slot. No queued task may spawn into a slot still owned by recovery evidence.
- A recovering or reattached Session also reserves its Agent identity. Spare global capacity may admit a different Agent, but never another task for the recovering/reattached Agent before confirmed close or explicit proof failure/timeout releases that identity.
- A restored snapshot already above the configured limit must fail closed: start no new process until proof/close handling reduces reservations to the configured limit. The runtime must not kill or silently forget restored processes merely to satisfy a counter.

### deterministic ordering

- Ready tasks continue to use stable `queuedAt`, then `taskId`, ordering.
- With capacity greater than `1`, the scheduler fills only independent ready tasks whose Agent identity is not already active.
- Dependency-blocked, retry-backoff and recovering tasks do not become ready by inference.
- Releasing one slot schedules at most the next eligible work needed to refill the configured capacity; re-entrant close events cannot oversubscribe it.

### unchanged safety contracts

- Authorization and the latest machine policy are re-evaluated at dequeue and retry admission.
- Timeout starts only after confirmed spawn; queue wait remains separate.
- Queued cancellation remains zero-spawn and terminal-idempotent.
- Retry never overlaps its prior process and never bypasses same-Agent admission.
- Redaction, persistence, recovery proof, bounded termination and dispose cleanup remain mandatory.

## explicit non-goals

- Priority classes or priority queues.
- Starvation protection or aging.
- Recursive cancellation DAG behavior.
- Per-Agent, per-account or per-Connector quota policy.
- Dynamic concurrency changes while the runtime is alive.
- Electron/preload/Desktop API, UI/CSS, Ranch, Hub positioning, DockView, sound-pack or account-quota work.
- P0-C, R0-3, Connector machine-gate changes or any external Agent CLI execution.

## file fence

This active intake may change only this task card.

A future implementation may be dispatched only after independent PM acceptance and a clean fence review. Candidate files are:

- `src/lib/connectorRuntime.ts`
- `scripts/check-connector-scheduler.mjs`
- `docs/orchestration/sessions/realtime-p1-scheduler-configurable-concurrency-evidence-2026-07-17.md`

`src/types.ts` is explicitly excluded while account-quota hunks remain owner-unresolved. Any need for it, `electron/**`, preload, Desktop API, UI, config files or another script requires a new PM fence-expansion decision before editing.

## deterministic fixtures

| ID | Fixture | Required result |
| --- | --- | --- |
| C-01 | Setting absent | Existing global `1` behavior and S-01 through S-16/R-01 through R-03 remain unchanged |
| C-02 | `maxGlobalActive=2/3/4`, matching independent Agents | Each legal value is accepted and exactly fills its configured capacity; maximum active/reserved equals the tested limit |
| C-03 | Limit `2`, same Agent twice plus another Agent | Same-Agent maximum remains `1`; independent Agent may use the second slot |
| C-04 | Limits `2/3/4`, one more independent task than capacity | Extra task remains queued; one confirmed close releases exactly one refill without oversubscription |
| C-05 | Equal `queuedAt` with two available slots | Selection is stable by `taskId` across repeated runs |
| C-06 | Dependency waiting/blocked under spare capacity | Dependency rules win; no premature spawn |
| C-07 | One unconfirmed close under limit `2` | Reservation remains occupied; only genuinely free capacity may be used |
| C-08 | Limit `2`, one recovering Agent plus same-Agent and different-Agent queued tasks; then two recovering Agents | The different Agent uses spare capacity, same-Agent spawn remains `0`, and two recovery reservations fill capacity until proof/close or explicit fail/timeout release |
| C-09 | Limit `2`, three restored active taskIds | Initial reserved may be `3` but new spawn is `0`; every taskId retains proof/close observation, a terminal label alone does not release reservation, and refill occurs only after confirmed close or explicit proof fail/timeout reduces reservations below `2` |
| C-10 | Retry with spare global capacity | Independent Agent may run; retry still cannot overlap its previous process or same Agent |
| C-11 | Missing value plus `0`, negative, fractional, `NaN`, `Infinity` and `>4` | Missing uses `1`; every invalid value rejects construction with load/publish/persist/timer/process/Session/audit side-effect counts all `0` |
| C-12 | Limit `2`, duplicate/same-tick close, synchronous publish/spawn callback and repeated dispose | Peak active/reserved never exceeds `2`; no post-dispose spawn, residue `0`, duplicate terminal `0`, external Agent spawn `0` |

## implementation admission

- PM must independently accept C-01 through C-12, the internal-only configuration source and the three-file fence before a code worker starts.
- Exactly one `[短工]` code worker may run; no long worker or parallel product Lane is implied by this intake.
- The allowed implementation files must be clean against `HEAD` at dispatch. Shared dirty files stay untouched.
- The worker may not stage, commit, push, reset, clean, edit machine gates or invoke an external Agent.

## acceptance commands

```text
node scripts/check-connector-scheduler.mjs
node scripts/check-connector-runtime.mjs
node scripts/check-realtime-process-reattach.mjs
npm.cmd run realtime:truth-check
npm.cmd run orchestration:check
npm.cmd run orchestration:report
npm.cmd run orchestration:preflight
npm.cmd run orchestration:connector-safety
npm.cmd run lint
npm.cmd run build
git diff --check
```

Acceptance requires per-fixture C-01 through C-12 results; maximum active/reserved counters for limits `1`, `2`, `3` and `4`; maximum same-Agent active/reserved `1`; invalid-construction side-effect counters; and exact taskId-by-taskId over-cap recovery release evidence. An over-cap restored snapshot may initially reserve more than the configured limit, but new spawn must remain `0` until confirmed close or explicit proof fail/timeout makes capacity available. External spawn must remain `0`, duplicate terminal `0`, residual process/timer `0/0`, and the callback must include an exact diff list.

## worker callback

```text
completed:
incomplete:
blockers:
next action:
evidence:
changed files:
```

## current decision

- The administrator's `开始推进计划` instruction starts this docs-only intake under the active weekly requirements truth.
- Product worker count remains `0`; no implementation or external execution has started.
- First independent review rejected dispatch with three P1 gaps and one P2: recovering Agent identity/spare-capacity behavior, legal `3/4`, over-cap taskId release evidence and re-entrant close coverage were underspecified. The contract now makes each observable and keeps the same three-file fence.
- Second independent review returned `dispatch-ready PASS`: all first-review findings are observable in C-02/C-04/C-08/C-09/C-11/C-12, and the three-file fence remains sufficient.
- PM accepts the intake for dispatch. The accepted control baseline must be committed/pushed before exactly one short implementation worker starts.
