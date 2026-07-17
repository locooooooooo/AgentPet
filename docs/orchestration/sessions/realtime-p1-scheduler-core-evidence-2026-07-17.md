# realtime P1 scheduler core implementation evidence

[长工]#realtime-p1-scheduler-core@v0.1
⟦tag:v2|session|realtime-p1-scheduler-core-evidence-2026-07-17⟧

loop state: summarized
dispatch state: summarized
status: accepted_pushed_ccedb15
date: 2026-07-17
baseline control commit: `42b6385`

## Scope decision

- This delivery implements only the fixed-concurrency local scheduler core authorized by the phase waiver.
- Global process concurrency is fixed at `1`; the same Agent also has at most one active task.
- The scheduler is main-runtime owned. No Electron, preload, renderer, UI or Connector machine-gate change was required.
- Fixtures use in-memory fake processes only. No Codex, Trae, Qoder or other external Agent CLI was executed.
- The worker reports evidence only; PM owns acceptance, Git integration and push.

## Implementation summary

- Added `queued` and `dependency-blocked` lifecycle truth plus normalized `dependsOn` contracts.
- Added deterministic FIFO admission by `queuedAt`, then `taskId`, with one global slot.
- Added fail-closed unknown, duplicate and cyclic dependency decisions and downstream failure propagation.
- Added queued cancellation with zero spawn/PID/kill and one terminal event.
- Separated `queuedAt`, `processStartedAt` and `queueWaitMs`; timeout begins only after spawn confirmation.
- Released the global slot on confirmed close, allowed independent work during retry backoff, and prevented attempt overlap.
- Preserved ordered, redacted, persisted and terminal-idempotent audit events.
- Replaced the legacy `selectorHarness` and `tieHarness` concurrent fixtures and, after explicit PM fence expansion, updated only the conflicting dispose fixture in `scripts/check-connector-runtime.mjs`.

## First-run correction

The first complete scheduler fixture run reached the final counter assertion with:

```text
maxGlobalActive=2
witness=[
  { taskName: "S01 second", agentId: "beta", state: "starting" },
  { taskName: "S01 first", agentId: "alpha", state: "starting" }
]
```

Root cause: `ConnectorRuntime.start()` initially published every new Session as `starting` before scheduler admission. The second request therefore created a false concurrent-active snapshot even though only one fake process had spawned.

Correction: a new Session now starts as `queued` with `queuedAt=createdAt`; it becomes `starting` only when the scheduler dequeues it into the global slot. The fixture retains the peak-state witness in failed assertion output so future regressions identify the exact tasks and states.

## Independent review corrections

The first implementation callback was not accepted. Independent review identified three P1 gaps, all reproduced and corrected inside the existing five-file fence:

| ID | Result | Correction evidence |
| --- | --- | --- |
| R-01 | PASS | Removed cached `preparedExecution`. Start performs static gate admission without discovery; every dequeue and retry runs fresh `prepareExecution(plan.request)`. Queued and retry policy drift both fail closed with spawn `0`. |
| R-02 | PASS | A termination final timer may mark the Session `session-lost`, but the live process remains in `active` with close/error observation and retains the global slot. Next spawn remains `0` until real close; `disposeAndWait` returns false before close and true afterward. |
| R-03 | PASS | Persisted `recovering` proof reserves the global slot. New spawn stays `0` before proof; success holds the slot through reattached close, while proof failure/deadline timeout release it fail closed. Late proof cannot revive or overlap the next task. |

The R-02 runtime fixture preserves the original kill count, timer cleanup, `session-lost`, `exitConfirmed=false`, redaction and single-terminal assertions. Only the conflicting listener/settlement expectations were tightened under the PM's explicit fence expansion.

## S-01 through S-16

| ID | Result | Evidence |
| --- | --- | --- |
| S-01 | PASS | Two independent requests spawned serially; maximum global active count was `1`. |
| S-02 | PASS | The second same-Agent request remained queued until the first released the slot; maximum same-Agent active count was `1`. |
| S-03 | PASS | Equal `queuedAt` tasks used the lexical `taskId` tie-break; observed winner `connector-task-12` across three fresh harness runs. |
| S-04 | PASS | A single dependent spawned exactly once after its prerequisite reached success. |
| S-05 | PASS | A multi-dependency task stayed queued until both prerequisites succeeded. |
| S-06 | PASS | Error, cancellation and timeout each produced downstream `dependency-blocked`, spawn `0`, and one terminal event. |
| S-07 | PASS | Unknown, duplicate and self-cycle edges failed closed with explicit reasons and spawn `0`; unknown forward edges are rejected, so a multi-node forward cycle cannot be registered through the public start contract. |
| S-08 | PASS | Queued cancel produced spawn `0`, PID `0`, kill `0`, state `stopped`, and one terminal event. |
| S-09 | PASS | Active cancellation held the slot until close evidence, then admitted the next ready task. |
| S-10 | PASS | Queue wait was `7000ms`; no timeout timer existed before spawn confirmation; timeout origin equaled `processStartedAt`. |
| S-11 | PASS | Retry reused task/session identity, began after old-process close, and never overlapped attempts. |
| S-12 | PASS | Cancel, policy, permission and dependency failures had retry count `0`. |
| S-13 | PASS | Independent ready work used the slot during retry backoff; retry re-entered the deterministic queue afterward. |
| S-14 | PASS | Dispose and persisted queued recovery spawned nothing new and left no process or timer residue. |
| S-15 | PASS | Prompt/token secrets were absent from audit/persistence; event sequence was strict and every Session had one terminal event. |
| S-16 | PASS | All scheduler spawns targeted `C:\\fixture\\codex.exe` with `shell:false`; external Agent CLI spawn was `0`. |

## Required counters

```text
maxGlobalActive=1
maxSameAgentActive=1
maxGlobalReserved=1
fakeSpawn=43
controlledLocalSpawn=0
externalAgentSpawn=0
duplicateTerminal=0
residualProcess=0
residualTimer=0
policyDriftSpawn=0
unconfirmedNextSpawn=0
recoverySpawnBeforeProof=0
recoveryReleaseSpawn=3
```

The separate A7 reattach regression used bounded controlled non-Agent child processes and reported child cleanup `0`, proof-worker cleanup `0`, recovered kill calls `3`, and external Agent CLI spawn `0`.

## Validation

All required commands passed in the implementation run:

```text
PASS node scripts/check-connector-scheduler.mjs
PASS node scripts/check-connector-runtime.mjs
PASS node scripts/check-realtime-process-reattach.mjs
PASS npm.cmd run realtime:truth-check
PASS npm.cmd run orchestration:check
PASS npm.cmd run orchestration:report
PASS npm.cmd run orchestration:preflight
PASS npm.cmd run orchestration:connector-safety
PASS npm.cmd run lint
PASS npm.cmd run build
PASS git diff --check
```

Additional observed evidence:

```text
orchestration referenced cards=117
reattach evidence source=windows-cim
reattach samples=18
reattach p95=915.090ms
reattach max=915.090ms
authorization blocked-path audit=10/10
production-policy discovery/spawn after grant=0
external Agent CLI execution=not performed
```

Connector preflight remained unchanged:

```text
Codex: draft / pending / enabled=false
Trae: draft / pending / enabled=false
Qoder: disabled / rejected / enabled=false
```

## PM independent acceptance

- PM reproduced S-01 through S-16 and R-01 through R-03 after the final corrections. All counters matched the required limits.
- PM reran connector runtime, reattach, realtime truth, orchestration check/report/preflight/Connector safety, lint, build, both script syntax checks and `git diff --check`; all passed.
- Independent review first rejected the callback with the three P1 findings captured by R-01 through R-03, then re-reviewed the corrected code and returned `No blocking findings`.
- `src/types.ts` was selectively staged: only Connector scheduler hunks are in the scheduler index; concurrent account-quota types and Desktop API hunks remain unstaged for their owning Lane.
- PM validated the exact staged patch in a temporary detached worktree based on `42b6385`. Scheduler/runtime passed; the first isolated reattach run had one Windows CIM 5-second timeout, followed by two consecutive isolated passes. The remaining isolated truth/orchestration/safety/lint/build gates passed with an explicit success marker.
- Residual boundary: if a real process never confirms close, the scheduler deliberately holds the global slot. Recovery proof failure/timeout releases the reservation fail closed because the old process cannot be reattached; this remains explicit conservative runtime behavior, not proof of old OS-process exit.

## File fence

Scheduler-core fenced files:

- `src/types.ts`
- `src/lib/connectorRuntime.ts`
- `scripts/check-connector-runtime.mjs`
- `scripts/check-connector-scheduler.mjs`
- `docs/orchestration/sessions/realtime-p1-scheduler-core-evidence-2026-07-17.md`

The shared worktree also contained concurrent Electron/UI/quota/Vite/user-document changes owned by other lanes. This worker did not edit, stage, revert, clean or otherwise modify those files. In particular, `src/types.ts` already contained concurrent account-quota type hunks; scheduler ownership is limited to the Connector request/session/runtime additions in that shared file.

## Callback

completed:
- Local scheduler-core implementation, S-01 through S-16 deterministic fixtures and independent review regressions R-01 through R-03.
- Runtime, reattach, realtime truth, orchestration, Connector safety, lint, build and whitespace regression gates.

incomplete:
- Configurable concurrency, priority, starvation prevention, DAG cancellation and cross-Connector quotas remain outside this minimum slice.

blockers:
- No implementation blocker.
- Global worktree cleanliness cannot be attributed to this Lane while concurrent out-of-fence lanes remain dirty; scheduler-owned index changes are restricted to the five-file fence above.

next action:
- Preserve `ccedb15` as the accepted minimum scheduler slice; any future scheduler feature must open a new bounded task and keep external execution separately gated.
