# ranch-window-v0.2 Day 1 progress

[长工]#ranch-window@v0.2
⟦tag:v2|session|ranch-window-v0.2-progress⟧

status: day1_correction_required
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

## PM correction return

- 2026-07-12 direct manual replay disproved the expected lifecycle: after closing the ranch window, the verified project Electron root PID `62196` exited instead of remaining resident with the ranch hidden.
- The current Day 1 implementation is not accepted. Diagnose the actual close/quit sequence and correct it within the existing Day 1 whitelist; do not start Day 2.

## 2026-07-12 Day 1 bounded correction

- A controlled Windows close against the pre-correction build hid the ranch and kept Electron alive, so the administrator's exact close trigger could not be reconstructed from the available evidence.
- Source review found a separate tray-lifecycle defect: `window-all-closed` called `app.quit()` unconditionally on Windows. That escape path could convert an unexpected all-window closure into full application exit even when no explicit tray quit was requested.
- The bounded correction now allows the `window-all-closed` exit path only after `isQuitting` is true. The existing ranch `close` handler still prevents close and hides the window; explicit `before-quit` still destroys the ranch, stops hot-zone polling, disposes the tray, and terminates managed child processes.
- In isolated corrected-build PID `62148`, Electron `window.close()` left the root process alive and retained ranch `BrowserWindow id=2` as `visible=false`, `destroyed=false`. A subsequent summon-equivalent `showInactive()` restored the same `id=2` as `visible=true`, `destroyed=false`.
- An inspector-triggered explicit `app.quit()` closed the renderer targets and debugging endpoint. The debugger kept the root at `Waiting for the debugger to disconnect`, so the test instance and its remaining helper children were then stopped and verified absent. This is cleanup diagnostics, not accepted tray-click evidence.
- Direct tray `召唤桌面牧场` and `退出` clicks remain for PM manual replay. No `capturePage()` result or summon-equivalent call is claimed as tray interaction evidence.
