# ranch-system-notify-v0.2 acceptance

[PM]#ranch-system-notify@v0.2
⟦tag:v2|session|ranch-system-notify-v0.2-acceptance-2026-07-14⟧

loop state: summarized
dispatch state: summarized
status: accepted_code_backed_residual_risk_windows_notification_waived

## scope

- M5 Day 5B renderer notification timing, system notification gate, existing agent icon lookup, fallback and cleanup.
- No UI/UX skill, visual redesign, icon edit, connector execution, protected-source edit, or machine-gate change.

## implemented correction

- Replaced the accumulated toast-timeout array with one active timeout reference.
- A new visible message clears the previous timer before starting its own 1500ms lifetime.
- Silent mode, disabled bubble preference and component unmount clear the timer; silent/disabled transitions also clear the visible status band.

## code-backed matrix

| Requirement | Current evidence | Disposition |
| --- | --- | --- |
| Enabled system notification | renderer requests only for success/error; typed preload invokes `ranch:request-notify`; main creates and shows `Notification` when supported | code-backed only; Windows display observation waived |
| Disabled system notification | renderer does not request when `notifyPrefs.system=false`; main independently returns false | accepted automated/static |
| Agent icon | eight current agent IDs resolve to existing files, including OpenClaw/OpenCode aliases | accepted static asset lookup |
| Missing/invalid icon | resolver returns null and creates Notification without an icon option | accepted fallback contract |
| Status band | one visible message, 1500ms TTL and one active timer | accepted automated/static |
| Cleanup | new message, silent/bubble-off transition and unmount clear the renderer timer; no Notification listeners are registered | accepted source contract |

## verification

- `node scripts/check-ranch-system-notify.mjs`: passed; `windowsNotificationObserved=false`.
- `node scripts/check-ranch-personality.mjs`: passed.
- `node scripts/check-ranch-status-coverage.mjs`: passed.
- Worker `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check`: passed.
- Full PM gates are required before the Day 5B and M5 closeout commit.

## residual risk

- No real Windows notification was directly observed in this lane.
- Browser fallback, source checks and Electron support checks are not substituted for OS display evidence.

## next action

- Day 5B correction/check is committed as `115c621`. Commit the final M5 control-plane closeout, then attempt the accumulated local commits push without reopening any connector or product lane.

## summary

- Day 5B is accepted as code-backed behavior with a real single-timer correction. Windows notification visibility remains explicit waived residual risk.
