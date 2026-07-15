# realtime-agent-cockpit P0-B2 production-path E2E

[长工]#realtime-production-path-e2e@v0.1
⟦tag:v2|task|realtime-agent-cockpit-p0-b2-production-path-e2e-v0.1⟧

loop state: active
dispatch state: active
status: authorized_pending_worker
priority: P0-B2

## objective

- Exercise the production Electron main -> preload -> renderer -> DOM lifecycle with a non-Agent controlled process, without presenting that rehearsal as real Agent E2E.

## start gate

- A6 `a44abd6` and A7 `e2031cd` are accepted, independently committed/pushed and the worktree is clean.
- The test envelope names the local non-Agent executable, cwd, timeout and cleanup route.

## allowed files

- Existing realtime Electron/runtime test helpers under `scripts/check-realtime-*.mjs`
- `src/lib/agentInstanceProjection.ts` only for a proven production-path truth defect
- `src/App.tsx` and `src/components/NiuMaWorkspace.tsx` only for a proven source/session/lastSeen rendering defect
- One evidence session under `docs/orchestration/sessions/`

## forbidden

- Connector machine-gate changes or external Agent CLI execution
- New visual design, layout polish, avatar/keyframe/ranch/agentCore changes
- Calling the controlled local process a real Agent session
- Worker Git writes

## acceptance

- Production main/preload/renderer path covers start, running, cancel, timeout, renderer reload and app restart.
- UI exposes taskId/sessionId/agentId/connectorId/source/lastSeen/PID from one projection.
- Event-to-visible-DOM p95 remains <=500ms while the production 5-second CIM identity poll overlaps the measured path; idle-only samples are insufficient.
- Duplicate terminal/UI subscriptions remain zero.
- Browser fallback remains simulated/blocked and production cleanup leaves zero controlled children.
- Full truth/runtime/orchestration/lint/build/diff gates pass.

## next action

- Dispatch exactly one B2 production-path worker after this control switch is committed and pushed.
- If overlapping CIM polling exceeds the 500ms budget, report `blocked_by_sync_cim_latency` and prepare an A7.1 packet without editing runtime/main from this lane.
- A passing B2 only prepares the P0-C authorization packet; it does not authorize Codex.

## summary

- Authorized B2 production-path rehearsal; real Agent E2E remains owned by separately authorized P0-C.
