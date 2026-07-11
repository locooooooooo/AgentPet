# ranch-system-notify-v0.2

[短工]#ranch-system-notify@v0.2
⟦tag:v2|task|ranch-system-notify-v0.2⟧

loop state: standby
dispatch state: standby
status: standby

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
- Keep standby until `ranch-fence-pointer-v0.2` is accepted, committed, pushed, and the worktree is clean; only then, on 2026-07-18, PM may dispatch this card as the only `[短工]` product worker.

summary:
- Requirements-ready child card for system notification behavior; no implementation started.
