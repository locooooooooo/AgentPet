# Cockpit live Session and completion notification - 2026-07-16

⟦tag:v2|session|cockpit-live-session-notification-2026-07-16⟧

[PM]#cockpit-live-session-notification@2026-07-16
status: completed
loop state: summarized
dispatch state: summarized

scope:
- Compact the left governance rail and keep the full role/Lane registry on demand.
- Make all four Dock status items inspectable.
- Include active Codex Desktop conversations in the online Session count.
- Notify with a ranch bubble and sound when a Codex turn completes.

implementation:
- The left rail defaults to one governance summary. Full role/Lane data is mounted only after `详情`; horizontal legacy scrollbars are suppressed while vertical inspection remains available.
- The Dock exposes `本地快照`, `在线 Session`, `Codex Desktop`, and `治理登记`; each opens a stable detail panel with source and interpretation.
- `CodexHostMonitor` reads only user-owned Codex Desktop lifecycle metadata and `task_started` / `task_complete` / `turn_aborted` events. It excludes subagent sessions and never reads conversation text.
- Connector runtime truth and Codex Desktop lifecycle truth remain separate. Active desktop turns contribute to the displayed online Session KPI when Codex is not already online through the controlled Connector runtime.
- A new completion key signals Codex `done`, publishes a six-second ranch bubble and success message, and plays `shell.beep()` when sound is enabled. Browser development preview uses a short Web Audio chime.

evidence:
- Browser fallback observed Codex Desktop open with two to four live conversations while other tasks changed; Home, cockpit header, board, Codex card, Operator and Dock stayed consistent with the current snapshot.
- Four of four Dock status buttons opened their matching detail content.
- 1440x900, 1280x720, and 1024x768/DPI-equivalent replay had no document horizontal overflow or three-column overlap. Left summary/detail horizontal scrollbars were removed.
- Browser console warnings/errors: `0`.
- Electron preload exposed `getCodexHostSnapshot`, `onCodexHostSnapshotChanged`, and `requestNotificationSound`; the subscription delivered a live `codex-desktop-session-log` snapshot.
- Electron sound request returned `true` when enabled and `false` when disabled; the saved preference was restored to enabled after the check.
- Electron startup showed no historical completion toast. The pure completion signal produced `done`, `bubbleTimer=6`, `Codex 对话完成，来验收吧。`, and a success message.

validation:
- `npm.cmd run orchestration:check`
- `npm.cmd run orchestration:report`
- `npm.cmd run orchestration:preflight`
- `npm.cmd run orchestration:connector-safety`
- `npm.cmd run realtime:truth-check`
- `npm.cmd run lint`
- `npm.cmd run build`
- `git diff --check`

boundaries:
- No external Agent CLI was executed.
- Codex, Trae, and Qoder Connector machine gates remain unchanged and disabled.
- Codex conversation content, credentials, and subagent session logs are not exposed.
- Temporary Electron/CDP verification was stopped and port 9223 was confirmed closed.
