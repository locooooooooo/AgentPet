# Realtime P1 Scheduler Configurable Concurrency Intake v0.1

[短工]#realtime-p1-scheduler-configurable-concurrency@v0.1
⟦tag:v2|task|realtime-p1-scheduler-configurable-concurrency-v0.1⟧

loop state: active
dispatch state: active
status: active_docs_only_intake_waiting_independent_review
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
| C-02 | `maxGlobalActive=2`, two independent Agents | Exactly two processes may become active; maximum active/reserved is `2` |
| C-03 | Limit `2`, same Agent twice plus another Agent | Same-Agent maximum remains `1`; independent Agent may use the second slot |
| C-04 | Limit `2`, three independent ready tasks | Third remains queued until one confirmed close releases a slot |
| C-05 | Equal `queuedAt` with two available slots | Selection is stable by `taskId` across repeated runs |
| C-06 | Dependency waiting/blocked under spare capacity | Dependency rules win; no premature spawn |
| C-07 | One unconfirmed close under limit `2` | Reservation remains occupied; only genuinely free capacity may be used |
| C-08 | Two recovery proofs under limit `2` | Both reserve capacity; queued spawn remains `0` until proof/close or fail-closed release |
| C-09 | Restored reservations exceed configured limit | No new spawn until reservations are at or below limit; no silent process forgetting |
| C-10 | Retry with spare global capacity | Independent Agent may run; retry still cannot overlap its previous process or same Agent |
| C-11 | Invalid values | Construction fails before Session/process/timer/audit side effects |
| C-12 | Dispose and external guard | No post-dispose spawn, residue `0`, duplicate terminal `0`, external Agent spawn `0` |

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

Acceptance requires per-fixture C-01 through C-12 results, maximum active/same-Agent/reserved counters for limits `1` and `2`, invalid-construction side-effect counters, external spawn `0`, duplicate terminal `0`, residual process/timer `0/0` and an exact diff list.

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
- Next transition is independent PM review of the contract and current three-file candidate fence. Only an accepted/pushed control baseline may authorize one short implementation worker.
