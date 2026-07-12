# ranch-window-v0.2 Day 1 progress

[长工]#ranch-window@v0.2
⟦tag:v2|session|ranch-window-v0.2-progress⟧

status: implementation_complete_pending_pm_acceptance
scope: Day 1 only

## Day 1 boundary

- Allowed implementation surface: `electron/main.ts`.
- No product changes outside the Day 1 window lifecycle and preference-recovery path.
- Day 2 interactions (summon input, desktop/floating switching, drag, dock, fence) remain unexecuted and unaccepted.

## Implemented pending verification

- Normalized ranch preference and bounds recovery now selects the matching active display and clamps the persisted window rectangle to its work area.
- A user close hides the ranch in both desktop and floating mode; a real application quit destroys the ranch window, clears hot-zone polling, and disposes the tray.

## Worker verification

- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.
- `git diff --check` passed.
- An isolated Electron profile started with invalid JSON in `ranch-prefs.json` and rewrote it to the desktop seed: `mode=desktop`, `size=640x360`, position `{x:1840,y:960}` on the active test display layout.
- The same profile was then seeded with `{x:999999,y:-999999}`. Electron rewrote it to `{x:4480,y:0}`, retained `640x360` and `desktop`, and a subsequent relaunch persisted exactly that recovered state. Both `桌面牧场` and `多 Agent 牛马核心部门` renderer targets loaded under Electron remote debugging.

## PM evidence still required

- Independently replay close -> hidden -> tray `召唤桌面牧场` in the desktop shell and observe the existing window is shown rather than recreated.
- Independently observe the tray `退出` route through `before-quit` cleanup. The implementation is in the bounded main-process path, but this worker did not claim a tray click as observed evidence.
- Run the full PM gate set before commit.
