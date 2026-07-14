# realtime-agent-cockpit P0-A7 process reattach

[长工]#realtime-process-reattach@v0.1
⟦tag:v2|task|realtime-agent-cockpit-p0-a7-process-reattach-v0.1⟧

loop state: active
dispatch state: active
status: authorized_pending_worker
priority: P0-A7

## objective

- Prove production restart recovery from persisted process identity without trusting PID alone or showing an unproven process as running.

## start gate

- A6 is accepted, committed and pushed; worktree is clean; no other runtime worker is active.
- PM freezes the exact process identity fields and platform fallback before dispatch.

## allowed files

- `src/types.ts`
- `src/lib/connectorRuntime.ts`
- Connector-only hunks in `electron/main.ts`
- `scripts/check-connector-runtime.mjs`
- One new dedicated reattach check under `scripts/check-realtime-*.mjs`

## forbidden

- UI/CSS/ranch/agentCore/icon changes
- Connector machine-gate changes
- External Agent CLI execution
- Treating PID liveness alone as identity proof
- Worker Git writes

## contract

- Persist a bounded process fingerprint sufficient to reject PID reuse.
- Reattach only when current process evidence matches the persisted fingerprint and run envelope.
- Evidence unavailable, mismatched or expired results in `session-lost` within 10 seconds.
- A recovered handle must support liveness polling and bounded stop/cleanup truth without inventing stdout/stderr history.
- Local verification uses a non-Agent controlled child process only.

## acceptance

- Matching controlled process reaches `reattached` with `source=restart-recovery` and fresh proof time.
- Wrong start time/executable/cwd/identity, reused PID and missing process all reach one terminal `session-lost`.
- App restart, stop, timeout and cleanup leave zero controlled child processes.
- No duplicate started/terminal events and no fake running state.
- Full runtime/orchestration/lint/build/diff gates pass.

## next action

- Dispatch exactly one A7 process-reattach worker after this control switch is committed and pushed.
- After A7 independent verification/commit/push, authorize B2 only.

## summary

- Requirements-ready A7 lane; no implementation or process probing is authorized yet.
