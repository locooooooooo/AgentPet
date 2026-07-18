# Realtime P1 Scheduler Configurable Concurrency Evidence - 2026-07-18

[短工]#realtime-p1-scheduler-configurable-concurrency@v0.1
⟦tag:v2|session|realtime-p1-scheduler-configurable-concurrency-evidence-2026-07-18⟧

loop state: summarized
dispatch state: summarized
status: accepted_pushed_4508ce3
date: 2026-07-18
dispatch baseline: `e237b7c`
resume baseline: `c395feb`

## scope

Implement the accepted runtime-internal immutable `maxGlobalActive` contract with default `1`, legal integer range `1..4`, same-Agent reservation `1` and deterministic C-01 through C-12 fixtures.

Allowed files:

- `src/lib/connectorRuntime.ts`
- `scripts/check-connector-scheduler.mjs`
- `docs/orchestration/sessions/realtime-p1-scheduler-configurable-concurrency-evidence-2026-07-18.md`

No `src/types.ts`, Electron, preload, Desktop API, UI/CSS, Hub, DockView, sound, quota, Connector machine-gate or external Agent execution is included.

## serial worker history

- The first short worker added the initial allowed runtime option/reservation implementation, then its turn stopped on service-side `403 DAILY_LIMIT_EXCEEDED` before fixtures or evidence.
- PM preserved the allowed partial diff and pushed rollover control commit `c395feb` with the real evidence date.
- The replacement short worker completed runtime and C-01 through C-12 fixture edits, then its turn also stopped on service-side `403 DAILY_LIMIT_EXCEEDED` before final callback/evidence.
- PM treated neither 403 as implementation success or failure. PM independently inspected the exact diff and ran all evidence commands from the shared worktree.
- Workers never overlapped. No external Agent CLI was executed.

## implementation summary

- `ConnectorRuntimeDependencies.maxGlobalActive` is optional; absence preserves `1`.
- Constructor validation runs before injected clocks, ids, persisted loads, publishes, timers, authorization, discovery or process callbacks.
- Only integers `1..4` are accepted; invalid values throw `RangeError`.
- Scheduler admission counts active processes plus recovering reservations and fills only genuinely free configured capacity.
- Reserved Agent identities include active, recovering and reattached processes, preserving same-Agent concurrency `1`.
- Spare capacity may run a different Agent while recovery proof owns another Agent identity.
- Persisted active Sessions are all retained for proof/close observation; over-cap recovery does not silently terminalize extra taskIds to manufacture capacity.
- Dequeue/retry policy drift, unconfirmed close reservation, dependency, timeout, cancellation, retry, redaction, terminal idempotency and dispose behavior remain fail closed.

## scheduler fixtures

| Fixture | Result | Evidence |
| --- | --- | --- |
| S-01 through S-16 | PASS | Existing single-slot, dependency, cancel, timeout, retry, recovery, redaction and external guard regressions remain green |
| R-01 | PASS | Dequeue and retry policy drift fail closed; spawn `0` |
| R-02 | PASS | Unconfirmed close retains reservation; dispose reports residue until real close |
| R-03 | PASS | Recovery reserves capacity until confirmed close or fail/timeout release |
| C-01 | PASS | Missing setting preserves global limit `1` |
| C-02 | PASS | Legal limits `2/3/4` each fill exact configured capacity |
| C-03 | PASS | Same-Agent reservation remains `1` with global limit `2` |
| C-04 | PASS | Limits `2/3/4` queue one excess and refill once per confirmed close |
| C-05 | PASS | Two-slot equal-time ordering uses stable taskId selection |
| C-06 | PASS | Dependency waiting/failure wins over spare capacity |
| C-07 | PASS | Unconfirmed close retains one slot until real close |
| C-08 | PASS | Recovering/reattached identity blocks same Agent while different Agent uses spare capacity |
| C-09 | PASS | Three over-cap restored taskIds release through proof, timeout and confirmed-close evidence |
| C-10 | PASS | Retry uses spare capacity without same-Agent overlap |
| C-11 | PASS | Six invalid classes reject before all injected side effects |
| C-12 | PASS | Re-entrant callbacks, duplicate close and repeated dispose remain bounded |

## counters

```text
maxGlobalActive=4
maxGlobalReserved=4
maxSameAgentActive=1
maxSameAgentReserved=1

limit 1: maxActive=1 maxReserved=1 maxSameAgent=1
limit 2: maxActive=2 maxReserved=2 maxSameAgent=1
limit 3: maxActive=3 maxReserved=3 maxSameAgent=1
limit 4: maxActive=4 maxReserved=4 maxSameAgent=1

invalid cases=6
invalid side effects:
  load=0 publish=0 persist=0 timer=0 process=0
  authorization=0 discovery=0 clock=0 id=0

fakeSpawn=97
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

## over-cap recovery timeline

Limit `2`, restored taskIds `a/b/c`:

| Step | Reserved | New spawn | Restored state |
| --- | ---: | ---: | --- |
| initial | 3 | 0 | `a/b/c=recovering` |
| a proof reattached | 3 | 0 | `a=reattached`, `b/c=recovering` |
| b proof failed but grace held | 3 | 0 | no terminal-label release |
| b explicit timeout release | 2 | 0 | `b=session-lost`; configured capacity still full |
| c explicit timeout release | 2 | 1 | one queued task refills the newly available slot |
| a confirmed close | 2 | 2 | second queued task refills only after real close |

All three restored taskIds remain in the snapshot and each receives exactly one terminal event.

## full worktree gates

```text
PASS node scripts/check-connector-scheduler.mjs
PASS node scripts/check-connector-runtime.mjs
PASS node scripts/check-realtime-process-reattach.mjs
  samples=16 p95=max=1880.550ms externalAgentSpawn=0 workerResidue=0
PASS npm.cmd run realtime:truth-check
PASS npm.cmd run orchestration:check (119 referenced cards)
PASS npm.cmd run orchestration:report
PASS npm.cmd run orchestration:preflight
PASS npm.cmd run orchestration:connector-safety
PASS npm.cmd run lint
PASS npm.cmd run build
PASS git diff --check
```

## isolated staged-snapshot gates

PM staged only the three allowed files and exported the Git index with `git checkout-index` into an isolated `%TEMP%` directory. The snapshot reused the workspace dependency tree through a junction; no unstaged README/UI/user-document change was exported.

```text
PASS node scripts/check-connector-scheduler.mjs
PASS node scripts/check-connector-runtime.mjs
PASS node scripts/check-realtime-process-reattach.mjs
  samples=16 p95=max=1236.267ms externalAgentSpawn=0 workerResidue=0
PASS npm.cmd run realtime:truth-check
PASS npm.cmd run orchestration:check (119 referenced cards)
PASS npm.cmd run orchestration:report
PASS npm.cmd run orchestration:preflight
PASS npm.cmd run orchestration:connector-safety
PASS npm.cmd run lint
PASS npm.cmd run build
PASS git diff --cached --check in the source worktree
```

The local execution policy rejected both computed-path and fixed-`LiteralPath` cleanup commands for the exported `%TEMP%` snapshot. PM did not bypass that policy. This leaves a non-repository verification directory only; no child process, proof worker or runtime timer remains.

## current acceptance state

completed:
- Runtime and scheduler fixture implementation are complete inside the three-file fence.
- Shared-worktree full gates pass with external Agent spawn `0`.
- Isolated staged-snapshot gates pass for the exact three-file index.
- PM accepted and pushed implementation commit `4508ce3`; local, `origin/main` and remote main matched after push.

incomplete:
- No implementation or evidence item remains incomplete in this slice.
- Priority/starvation, cancellation DAG and Connector quotas remain separate future P1 work.

blockers:
- No implementation or file-fence blocker is currently known.
- Service-side worker 403s prevented a formal worker callback; PM fresh command evidence replaces no result and remains explicitly recorded.
- `%TEMP%` staged-snapshot cleanup is blocked by local command policy; this is an operational residue outside the repository, not an implementation or test blocker.

next action:
- Preserve `4508ce3`; open a new bounded task for the next scheduler P1 gap instead of reopening this evidence session.

changed files:
- `src/lib/connectorRuntime.ts`
- `scripts/check-connector-scheduler.mjs`
- `docs/orchestration/sessions/realtime-p1-scheduler-configurable-concurrency-evidence-2026-07-18.md`
