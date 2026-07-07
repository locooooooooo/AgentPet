# ranch-pointer-smoke-investigation-2026-07-07

[PM]#ranch-pointer-smoke-investigation@2026-07-07
⟦tag:v2|session|ranch-pointer-smoke-investigation-2026-07-07⟧

loop state: standby
dispatch state: investigated

truth sources:
- `docs/orchestration/tasks/ranch-pointer-smoke-v0.2.md`
- `docs/orchestration/tasks/ranch-pointer-smoke-manual-evidence-v0.2.md`
- `docs/orchestration/status.json`

scope:
- Investigate whether the previous transparent-window capture blocker can be bypassed without editing `src/**` or `electron/**`.
- Keep the user's active game preview running; do not interrupt it with click/right-click/drag pointer smoke.

not in scope:
- Editing implementation files.
- Marking transparent pointer smoke accepted.
- Running connector commands.
- Stopping Electron while the user is reviewing the launched game.

investigation result:
- Current preview is live at `http://127.0.0.1:5173/`.
- Electron desktop windows are visible: `桌面牧场` and `桌面牧场 · 控制舱`.
- Windows MCP `Snapshot` can observe the transparent `桌面牧场` window and its ranch UI tree directly.
- This route did not produce the prior `SetIsBorderRequired failed` error.
- This proves an alternate capture/observation route exists for window visibility evidence.
- It does not prove pointer behavior by itself; click-through, double-click cockpit focus, right-click context menu, floating drag, and dock persistence still need direct input observation.

evidence table:
| check | result | evidence | blocker if incomplete |
| --- | --- | --- | --- |
| capture route can see transparent ranch window | pass | Windows MCP `Snapshot` returned `桌面牧场` with ranch animal controls and `桌面牧场 · 控制舱` focused |  |
| avoids previous capture failure | pass | No `SetIsBorderRequired failed` was emitted by this route |  |
| desktop click-through | pending | not run | user is actively reviewing the launched game |
| double-click cockpit summon/focus | pending | not run | user is actively reviewing the launched game |
| right-click context menu | pending | not run | user is actively reviewing the launched game |
| floating drag + dock persistence | pending | not run | user is actively reviewing the launched game |

conclusion:
- P1-2 investigation is complete at route level: use Windows MCP Snapshot/click tooling as the next bounded transparent-window pointer-smoke route.
- The parent pointer-smoke package remains standby until the full pointer input evidence table is run and filled.

next action:
- After the user finishes visual review, run the full `ranch-pointer-smoke-v0.2` route with Windows MCP input and fill `ranch-pointer-smoke-manual-evidence-v0.2.md`.
