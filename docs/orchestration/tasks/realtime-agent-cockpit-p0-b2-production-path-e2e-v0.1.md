# realtime-agent-cockpit P0-B2 production-path E2E

[长工]#realtime-production-path-e2e@v0.1
⟦tag:v2|task|realtime-agent-cockpit-p0-b2-production-path-e2e-v0.1⟧

loop state: summarized
dispatch state: summarized
status: accepted_after_a7_1
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

- Preserve the historical pre-A7.1 synchronous-CIM blocker (`p95=1524ms`) and the accepted A7.1 commit `8866305`.
- PM fresh B2 rerun passed at visible-DOM `p95=7ms` with six real async-CIM overlaps and 6/6 DOM commits before proof close.
- Duplicate terminal/subscription counts, controlled child residue, proof worker residue and external Agent spawn all remained `0`.
- P0-C is technically eligible for a decision but remains `authorization_required` until a new explicit user execution authorization.

## summary

- B2 is accepted after A7.1 asynchronous process proof; the controlled production path passes, while real Agent E2E remains unexecuted and unauthorized.
