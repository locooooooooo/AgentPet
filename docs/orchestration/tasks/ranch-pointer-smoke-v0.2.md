# Ranch Pointer Smoke Verification Package

[监督]#ranch-pointer-smoke@v0.2
⟦tag:v2|task|ranch-pointer-smoke-v0.2⟧

objective:
- Turn the remaining transparent Electron ranch pointer-smoke risk into an executable verification package.
- Verify M3 interactions without changing implementation code.

dispatch state:
- Standby verification package.
- Do not run destructive commands, Git repair, connector execution, or M4 implementation while executing this package.

truth sources:
- Session source: `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md`.
- M4 implementation package: `docs/orchestration/tasks/ranch-m4-implementation-v0.2.md`.
- Current PM board: `docs/orchestration/status.json`.

scope:
- Recheck transparent ranch window visual/click-through/right-click/drag behavior.
- Prefer a manual or alternate-capture route because the previous Windows capture route reported `SetIsBorderRequired failed`.
- Confirm that M3 renderer interactions remain intact before any M4 implementation starts.

not in scope:
- Editing `src/**`, `electron/**`, `docs/orchestration/connectors.json`, or M4 implementation files.
- Git repair, staging, commit, push, reset, clean, or file removal.
- Enabling or executing Codex, Trae, Qoder, or any connector.
- Treating browser-only rendering proof as sufficient for transparent desktop pointer behavior.

verification route:
1. Run `npm.cmd run lint`.
2. Run `npm.cmd run build`.
3. Run `npm.cmd run orchestration:check`.
4. Launch Electron with `npm.cmd run dev`.
5. Confirm both windows exist: `桌面牧场` and `桌面牧场 · 控制舱`.
6. Use a manual desktop check or the Windows MCP Snapshot route recorded in `docs/orchestration/sessions/ranch-pointer-smoke-investigation-2026-07-07.md`; the route must see transparent windows and avoid `SetIsBorderRequired failed`.
7. Verify desktop mode click-through outside animal hot zones.
8. Verify animal double-click summons/focuses the control cockpit.
9. Verify animal right-click opens the ranch context menu.
10. Switch to floating mode and verify drag + edge docking persists bounds.
11. Stop the dev process and record evidence.

acceptance:
- Evidence lists the capture route used and whether it avoided `SetIsBorderRequired failed`.
- Evidence includes desktop mode click-through result.
- Evidence includes double-click cockpit summon result.
- Evidence includes right-click context menu result.
- Evidence includes floating drag and dock persistence result.
- `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd run orchestration:check` pass in the same verification pass.
- If any pointer step cannot be observed, the callback records it as incomplete with the exact blocked route.

blockers:
- Prior Windows capture route failed with `SetIsBorderRequired failed: 不支持此接口 (0x80004002)`.
- 2026-07-07 investigation found Windows MCP Snapshot can see the transparent ranch window without emitting that error, but it has not yet run click-through, double-click, right-click, drag, or dock persistence.
- Computer-use or Windows MCP input requires a fresh screenshot state before click/right-click/drag input, and should not interrupt the user's active preview.

next action:
- Run this package only when the user preview can be interrupted or a manual observer records the pointer steps.
- Keep it standby until full pointer input evidence can be collected.

summary:
- Standby pointer-smoke verification package; no implementation started.
