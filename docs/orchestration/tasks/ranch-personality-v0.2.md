# ranch-personality-v0.2

[短工]#ranch-personality@v0.2
⟦tag:v2|task|ranch-personality-v0.2⟧

loop state: standby
dispatch state: standby
status: standby

parent: `docs/orchestration/tasks/ranch-m5-requirements-v0.2.md`
source summary: `docs/orchestration/tasks/ranch-personality-v0.1.md`

objective:
- Prepare a bounded implementation lane for FR-007 personality and notify preference behavior.

FR coverage:
- FR-007 personality modes: `chatty`, `quiet`, and `silent`.
- Notify prefs: bubble, system notification, and cockpit badge toggles.
- Control-cockpit linkage for ranch settings without reopening the central 4x2 grid.

future scope paths:
- `electron/main.ts` for persisted ranch prefs and notification gating.
- `electron/preload.ts` and `src/types.ts` for typed prefs bridge.
- `src/ranch/hooks/useRanchMode.ts` and `src/ranch/hooks/useRanchNotifications.ts` for renderer preference behavior.
- `src/lib/desktopClient.ts` for browser fallback prefs.
- `src/components/NiuMaWorkspace.tsx` only if a future lane explicitly allows a settings-entry/header-only change.

no-touch boundaries:
- Do not touch the central 4x2 grid, central 8-card styles/keyframes, `NiuMaAvatar.tsx`, or key `agentCore.ts` sections from this readiness pass.
- Do not change connector state.
- Do not add new top-level product modes outside `desktop` and `floating`.

acceptance for a future implementation lane:
- `chatty` shows normal status messages; `quiet` reduces chatter without breaking critical state; `silent` suppresses non-critical bubble/system notifications.
- Notify prefs persist across relaunch.
- Control-cockpit settings reflect and update the same prefs source as the ranch window.
- `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd run orchestration:check` pass.

next action:
- Keep standby until PM decides whether M5 long-worker implementation should start.

summary:
- Requirements-ready child card for personality and notification preferences; no source edit authorized here.
