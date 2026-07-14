# ranch-personality-v0.2

[短工]#ranch-personality@v0.2
⟦tag:v2|task|ranch-personality-v0.2⟧

loop state: summarized
dispatch state: summarized
status: accepted_existing_implementation_code_backed

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
- `silent` does not stop agent/status refresh, and `quiet` preserves critical notifications.
- Control-cockpit settings reflect and update the same prefs source as the ranch window.
- `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd run orchestration:check` pass.

next action:
- Day 4 is closed without product-code changes: existing personality, notify preference, persistence and shared-settings implementation passes the repeatable matrix check. Continue the serial plan with `ranch-fence-pointer-v0.2`; real Windows notification visibility remains residual risk for the system-notify lane.

summary:
- Existing implementation accepted as code-backed evidence: chatty allows all four message types, quiet allows success/warning/error, silent suppresses all ranch toasts and clears current output, system-disabled is renderer/main fail-closed, and bubble/system/cockpitBadge share persisted RanchPrefs.

evidence:
- `node scripts/check-ranch-personality.mjs` -> chatty=4/4, quiet=3/4 critical, silent=0/4, system-disabled renderer+main fail-closed.
- Long-worker audit found no product gap and changed no files; real Windows notification visibility was not directly observed and remains residual risk.
