# ranch-window-v0.2 Day 1 acceptance

[PM]#ranch-window@v0.2
⟦tag:v2|session|ranch-window-v0.2-acceptance-2026-07-11⟧

status: day1_correction_required
scope: Day 1 only

## Acceptance matrix

| Requirement | Expected Day 1 evidence | Current state |
| --- | --- | --- |
| FR-001 lifecycle | Electron creates ranch in desktop mode; close hides; tray summons; quit destroys resources | PM replay pending |
| Default desktop | Fresh or invalid preferences seed `desktop` | worker verified |
| Persistence | Size, position, and mode restore after relaunch | worker verified |
| Work-area recovery | Missing, corrupt, and off-screen preference cases recover to a visible active display work area | worker verified |
| Cleanup | Quit stops ranch hot-zone polling and destroys the ranch/tray resources | PM replay pending |

## Explicit exclusions

- This record does not accept Day 2 double-click/right-click, mode switching, drag/dock, fence, or pointer-input evidence.
- `capturePage()` is not pointer-input evidence.

## Worker verification log

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `git diff --check`: passed.
- Isolated Electron launch with malformed `ranch-prefs.json` rewrote valid default preferences with `mode: desktop`, `size: 640x360`, and a visible active-display position.
- With persisted coordinates forced to `x:999999`, `y:-999999`, Electron rewrote the profile to `x:4480`, `y:0` on the matching display work area. A second Electron launch preserved the recovered position, size, and mode; remote-debugging targets confirmed both ranch and cockpit renderer pages loaded.

## PM verification still required

- Replay the existing desktop-shell close -> hidden -> tray summon sequence and record the result.
- Replay tray exit and observe process/window cleanup. Do not substitute a `capturePage()` result for either interaction.
- Run the complete orchestration, connector-safety, lint, build, and diff gate set before acceptance.

## PM replay attempt

- 2026-07-11 PM independently launched the local Electron shell and located both `桌面牧场` and `桌面牧场 · 控制舱` windows through the Windows automation surface.
- The transparent ranch window could not provide a reliable interaction state: `get_window_state` returned `SetIsBorderRequired failed: 不支持此接口 (0x80004002)`. PM stopped input immediately rather than clicking with stale coordinates or treating capture/CDP output as tray evidence.
- Result: direct close -> hidden -> tray summon and tray exit -> cleanup remain **not accepted**. This is a real evidence blocker, not an implementation failure; Day 2 and all later M5 cards stay pending.

## 2026-07-12 direct manual replay

- PM launched the current local Electron build and verified project root PID `62196` plus its renderer children were running before the action.
- The administrator closed only the `桌面牧场` window as instructed. The subsequent process check found PID `62196` and all project Electron children absent.
- Result: close -> hide **failed** because the full application exited. Tray summon could not be tested after exit. Day 1 is rejected and requires bounded correction; this is stronger evidence than the previous automation limitation.

## 2026-07-12 worker correction evidence (not PM acceptance)

- The worker could not reproduce PID `62196`'s exit with a controlled Windows close: the ranch hid and Electron remained alive. Because the administrator's exact close input is unknown, the original trigger is not claimed as proven.
- The worker removed the confirmed unconditional Windows exit escape hatch by requiring `isQuitting` before `window-all-closed` may call `app.quit()`.
- Corrected-build isolated replay used root PID `62148`: Electron `window.close()` retained ranch `BrowserWindow id=2` as hidden and not destroyed while the root stayed alive; summon-equivalent `showInactive()` restored the same `id=2` without recreation.
- An explicit inspector `app.quit()` removed renderer targets and closed the debugging endpoint, but the attached debugger held the root in `Waiting for the debugger to disconnect`; the remaining isolated test processes were stopped afterward and verified absent.
- This section does **not** accept Day 1. PM must still directly click tray `召唤桌面牧场`, observe the existing ranch return, click tray `退出`, and observe a clean non-debug process exit before changing acceptance status or starting Day 2.
