# realtime-agent-cockpit P0-A7 acceptance

[PM]#realtime-process-reattach@v0.1
⟦tag:v2|session|realtime-agent-cockpit-p0-a7-acceptance-2026-07-15⟧

loop state: summarized
dispatch state: summarized
status: accepted_with_sync_cim_residual_risk

## delivered

- Persisted bounded process fingerprints bind PID, executable path, process start time, cwd source, command-line hash and the task/session/connector/agent run envelope.
- Recovery accepts only matching OS evidence and otherwise reaches one terminal `session-lost` within the fixed 10-second budget.
- Recovered handles provide identity polling plus bounded stop/timeout/dispose cleanup without inventing stdout or stderr history.
- Stop re-proves strong identity immediately before `process.kill`; PID reuse produces zero kill calls.
- Windows uses CIM, Linux uses procfs, and unsupported or unavailable evidence fails closed.

## verification

| Check | Result |
| --- | --- |
| matching recovery | `reattached`, `source=restart-recovery`, fresh proof |
| wrong start/executable/cwd/identity, reused PID, missing/expired/future evidence | one `session-lost` each |
| stop/timeout/dispose | controlled child cleanup=0, terminal event count=1 |
| real local evidence | Windows CIM, 17 samples, p95/max=998.977ms |
| Electron propagation | 200 samples, p95=0.479ms <=500ms |
| production policy | Codex/Trae/Qoder discovery=0 before static unblock; external Agent spawn=0 |
| quality | runtime/reattach/truth/orchestration/preflight/connector-safety/lint/build/diff gates passed |

## residual risk

- Windows CIM inspection is synchronous. With a 5-second polling interval, a recovered session can briefly block the Electron main thread; the current acceptance proves the 10-second recovery deadline, not smooth UI behavior during an overlapping probe.
- A prior independent run observed a 1696.933ms CIM maximum, so B2 must measure visible DOM latency while CIM polling is active instead of relying on idle propagation samples.
- Linux procfs support is code-covered but was not executed on this Windows host. macOS remains fail-closed.
- This is controlled Node process evidence, not real Agent E2E.

## evidence

- Product commit: `e2031cd feat: add connector process reattach proof`.
- A6 prerequisite: `a44abd6 feat: add trusted connector authorization grants`.
- Connector machine gates and `status.json` `connectors[]` were unchanged.

## next action

- Authorize only B2 production-path rehearsal.
- If overlapping CIM polling makes event-to-visible-DOM p95 exceed 500ms, mark B2 `blocked_by_sync_cim_latency` and prepare an A7.1 asynchronous-proof packet; do not widen B2 into runtime repair.
- P0-C remains `authorization_required` and no external Agent CLI may run.

## summary

- A7 is accepted and pushed with an explicit synchronous-CIM performance risk; B2 is the only next runtime lane.
