# realtime P1 scheduler core v0.1

[长工]#realtime-p1-scheduler-core@v0.1
⟦tag:v2|task|realtime-p1-scheduler-core-v0.1⟧

loop state: active
dispatch state: active
status: active_ready_same_day_ddl_under_explicit_phase_waiver
date: 2026-07-17
ddl: 2026-07-17

## authorization

- The administrator's current instruction compresses the full later five-day board and all DDLs to 2026-07-17. PM records this as the explicit phase waiver required by the accepted intake for the local scheduler-core slice.
- This waiver does not authorize P0-C, R0-3, Codex/Trae/Qoder execution, Connector machine-gate changes or any other external Agent CLI.
- Exactly one repo-local worker may implement controlled local scheduler behavior and deterministic fixtures.

## single goal

- Implement the minimum deterministic scheduler contract frozen in `docs/orchestration/tasks/realtime-p1-scheduler-intake-v0.1.md` without widening into a complete multi-Agent scheduler.

## allowed files

- `src/types.ts`
- `src/lib/connectorRuntime.ts`
- `scripts/check-connector-scheduler.mjs`
- `docs/orchestration/sessions/realtime-p1-scheduler-core-evidence-2026-07-17.md`

## forbidden files and actions

- No `electron/**`, `src/lib/desktopClient.ts`, `src/lib/agentCore.ts`, `src/components/**`, `src/homepage/**`, `src/index.css`, `src/ranch/**`, `icon/**`, `package.json` or other script.
- No `docs/orchestration/connectors.json` machine-gate edit or `docs/orchestration/status.json` `connectors[]` edit.
- No `README.md` or `docs/牛马状态回执音效规范-v0.1.md` edit.
- No external Agent CLI, stage, commit, push, reset, clean or force-push.
- If implementation requires main/preload/Desktop API/UI changes, stop and return an exact fence-expansion request.

## required behavior

- Fixed global concurrency `1` and same-Agent single-active admission.
- Stable FIFO by `queuedAt`, then `taskId` for ties.
- Optional normalized `dependsOn`; unknown/self/duplicate/cycle fails closed.
- Downstream becomes `dependency-blocked` after any non-success dependency terminal and never spawns.
- Queued cancellation yields `stopped` with zero PID/kill/spawn and one terminal event.
- `queuedAt`, `processStartedAt` and `queueWaitMs` are distinct; process timeout starts after spawn confirmation.
- Slot release immediately runs the next deterministic ready task.
- Retry has no process overlap; retry backoff does not monopolize the global slot; non-retryable failures never retry.
- Enqueue, dependency decision, dequeue, spawn confirmation, cancellation, retry, slot release and terminal transitions remain redacted, persisted, ordered and idempotent.

## fixtures

- S-01 through S-16 from `realtime-p1-scheduler-intake-v0.1.md` are mandatory acceptance evidence.
- The verification script may use only fake/controlled local processes.
- Required counters: max global active, max same-Agent active, controlled spawn, external Agent spawn, duplicate terminal, residual process and residual timer.

## verification

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

## stop rules

- Stop on any forbidden-file need, machine-gate drift, external Agent invocation, second active process, overlapping retry, silent dependency deletion or residual process/timer.
- A passing build/lint cannot replace a failed behavior fixture.
- Worker reports completion but never self-accepts; PM owns acceptance, commit and push.

## callback

```text
completed:
incomplete:
blockers:
next action:
evidence:
changed files:
```

The callback must list S-01 through S-16 individually, all required counters, every command result and the exact diff file list.
