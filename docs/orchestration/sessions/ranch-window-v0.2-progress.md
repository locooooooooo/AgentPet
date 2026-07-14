# ranch-window-v0.2 Day 1/2 progress

[长工]#ranch-window@v0.2
⟦tag:v2|session|ranch-window-v0.2-progress⟧

status: day2_accepted_residual_risk_pointer_waived
scope: Day 1 and Day 2

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

## 2026-07-14 Day 2 continuation

- Administrator instruction `跳过验收，继续推进进度` applies to the missing direct Day 1 tray replay and Day 2 OS-pointer replay. Both remain explicit residual risk, not passed evidence.
- Source audit confirmed existing chains for animal double-click -> `ranch:open-cockpit`, ranch right-click -> native menu, desktop/floating preference persistence, floating drag/dock persistence, bounded interactive regions, and ranch/cockpit coexistence.
- One real Day 2 defect was corrected in `electron/main.ts`: desktop hot-zone transitions no longer call `setFocusable(true)`; focusability is now determined only by `ranchPrefs.mode === 'floating'`.
- Two isolated Electron automation attempts did not reach their readiness selectors, so they produced no behavioral pass/fail evidence and were cleaned up. Direct double-click/right-click/click-through/drag/dock remain `code-backed only / waived residual risk`.
- PM independently passed lint, build, orchestration check/report/preflight/connector-safety, realtime truth, Electron latency and `git diff --check` after the one-line fix.

## Day 2 callback

```text
completed: desktop focusability defect fixed; summon/menu/mode/drag/dock/fence/coexistence source chains audited; full automated gates passed.
incomplete: no direct OS pointer replay for double-click, right-click, click-through, drag or dock.
blockers: none under the administrator acceptance waiver; direct pointer evidence remains residual risk for the dedicated pointer lane.
next action: commit Day 2 independently, then continue the serial M5 plan with ranch-status-script-v0.2.
evidence: electron/main.ts focusability hunk; RanchApp/useDockAndDrag/main source audit; full PM gate output.
```
