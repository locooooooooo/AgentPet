# ranch-system-notify-v0.2

[短工]#ranch-system-notify@v0.2
⟦tag:v2|task|ranch-system-notify-v0.2⟧

loop state: summarized
dispatch state: summarized
status: accepted_code_backed_residual_risk_windows_notification_waived

parent: `docs/orchestration/tasks/ranch-m5-requirements-v0.2.md`
source summary: `docs/orchestration/tasks/ranch-status-script-v0.1.md`

objective:
- Prepare a bounded implementation lane for system notifications and existing agent icon usage.

FR coverage:
- FR-006 system notification bridge and notification preference gating.
- Agent-specific notification icon lookup using existing icon assets only.
- Single transient ranch status message aligned with the notification event.

future scope paths:
- `electron/main.ts` for `Notification`, icon lookup, and `ranch:request-notify`.
- `electron/preload.ts` and `src/types.ts` for typed notification IPC.
- `src/ranch/hooks/useRanchNotifications.ts` and `src/ranch/components/StatusBand.tsx` for renderer-triggered notification timing.
- `src/lib/desktopClient.ts` for browser fallback behavior.
- Existing `icon/**` assets are read-only inputs unless a future PM lane explicitly authorizes asset changes.

no-touch boundaries:
- Do not create or edit icon assets from this readiness pass.
- Do not connect notifications to external connector execution.
- Do not treat browser fallback `requestSystemNotify()` as proof that OS notifications displayed.
- Do not change connector machine-gate fields.

acceptance for a future implementation lane:
- A real Electron/Windows system notification displays for a current ranch event when enabled and is suppressed when disabled; browser fallback is not acceptance evidence.
- Existing agent icon is used when available; missing icon falls back gracefully.
- Status band and OS notification do not create duplicate persistent UI cards.
- Window close/application exit removes notification listeners and releases related resources without duplicate callbacks on relaunch.
- `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd run orchestration:check`, and connector safety gates pass.

next action:
- Day 5B is closed under the administrator's explicit manual-acceptance waiver. Do not report a Windows notification as displayed; retain that observation as residual risk.
- Preserve pushed Day 5B commit `115c621` and final M5 closeout `8df940c`; any real Windows notification replay requires a fresh evidence lane.

summary:
- System notification behavior is code-backed closed after fixing stale toast timers. Enabled success/error routing, disabled renderer/main fail-closed, 8/8 existing icon lookup, missing-icon fallback, single 1500ms status band and unmount cleanup are verified; real Windows notification visibility remains waived residual risk.

evidence:
- `node scripts/check-ranch-system-notify.mjs` -> 8/8 icons, default missing-icon fallback, renderer/main disable gate, single timer and `windowsNotificationObserved=false`.
- `node scripts/check-ranch-personality.mjs` and `node scripts/check-ranch-status-coverage.mjs` -> personality matrix, 8 identities, 14 statuses, one 1500ms status band.
- Worker fixed `src/ranch/hooks/useRanchNotifications.ts` so rapid messages, silent/bubble-off transitions and unmount clear the single active timer.
- Day 5B implementation/check commit: `115c621`.
- Acceptance record: `docs/orchestration/sessions/ranch-system-notify-v0.2-acceptance-2026-07-14.md`.
