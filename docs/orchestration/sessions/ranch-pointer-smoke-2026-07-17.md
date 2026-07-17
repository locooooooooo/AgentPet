# Ranch Pointer Smoke - 2026-07-17

[监督]#ranch-pointer-smoke@2026-07-17

⟦tag:v2|session|ranch-pointer-smoke-2026-07-17⟧

loop state: summarized
dispatch state: summarized
status: completed_with_capture_blocker

## scope

- Run the existing transparent Electron ranch pointer evidence package against the current checkout.
- Directly observe pointer behavior where the Windows capture route permits it.
- Do not edit implementation or treat static/browser evidence as pointer acceptance.

## evidence

| Check | Result | Evidence or exact blocker |
| --- | --- | --- |
| lint | pass | `npm.cmd run lint`; `tsc --noEmit` exited 0 |
| build | pass | Vite and Electron main/preload builds completed |
| orchestration | pass | `orchestration:check` passed with 104 referenced cards |
| windows | pass | Computer Use enumerated `桌面牧场` and `桌面牧场 · 控制舱`; both UIA trees were readable and exposed the eight animals |
| capture route | fail | Electron and ordinary File Explorer screenshots both returned `SetIsBorderRequired failed: 不支持此接口 (0x80004002)` |
| desktop click-through | blocked | No fresh screenshot id was available to bind safe transparent-area coordinates or observe the underlying target |
| animal double-click | blocked | UIA located the Codex animal, but coordinate input was rejected with `call get_window_state before issuing coordinate input` |
| animal right-click | blocked | The same screenshot-bound coordinate precondition prevented input and direct menu observation |
| floating drag | blocked | No safe screenshot-bound coordinates were available for mode switch and drag |
| edge dock and persistence | blocked | Drag could not run, so dock preview and persisted bounds could not be observed |
| cleanup | pass | The Lane-owned Electron/Vite tree exited, port 5174 closed, and pre-existing port 5173 was left untouched |
| repository integrity | pass | No file edit or Git write; pre-closeout `git status --short --branch` remained `main...origin/main` and `git diff --check` passed |

## decision

- The product gates and window startup passed.
- Full transparent pointer acceptance remains incomplete.
- The only observed failure is in the current Windows screenshot/input binding route; this run did not prove an implementation defect.
- Do not open a bugfix Lane until a direct pointer route produces a product-behavior failure.

## boundaries preserved

- No `src/**`, `electron/**`, Connector config or Git metadata change.
- No external Agent CLI execution.
- No process or port started by this Lane remains running.
