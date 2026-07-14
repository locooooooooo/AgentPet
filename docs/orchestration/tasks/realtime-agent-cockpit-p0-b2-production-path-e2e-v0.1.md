# realtime-agent-cockpit P0-B2 production-path E2E

[长工]#realtime-production-path-e2e@v0.1
⟦tag:v2|task|realtime-agent-cockpit-p0-b2-production-path-e2e-v0.1⟧

loop state: standby
dispatch state: standby
status: pending_a7_closeout
priority: P0-B2

## objective

- Exercise the production Electron main -> preload -> renderer -> DOM lifecycle with a non-Agent controlled process, without presenting that rehearsal as real Agent E2E.

## start gate

- A6 and A7 are accepted, independently committed/pushed and the worktree is clean.
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
- Event-to-visible-DOM p95 remains <=500ms and duplicate terminal/UI subscriptions remain zero.
- Browser fallback remains simulated/blocked and production cleanup leaves zero controlled children.
- Full truth/runtime/orchestration/lint/build/diff gates pass.

## next action

- Keep standby until A7 closeout.
- A passing B2 only prepares the P0-C authorization packet; it does not authorize Codex.

## summary

- Requirements-ready B2 production-path rehearsal; real Agent E2E remains owned by separately authorized P0-C.
