# Ranch Pointer Smoke Manual Evidence Package

[监督]#ranch-pointer-smoke-manual-evidence@v0.2
⟦tag:v2|task|ranch-pointer-smoke-manual-evidence-v0.2⟧

objective:
- Make the standby transparent Electron ranch pointer-smoke verification directly recordable when a manual or alternate capture route is available.
- Preserve the current M3 implementation baseline without running pointer input or editing implementation code.

dispatch state:
- Standby evidence package.
- Do not execute this package until a manual observer or alternate transparent-window capture route is available.
- Do not treat browser-only rendering, accessibility tree output, or build success as sufficient proof for desktop transparent pointer behavior.

truth sources:
- Verification package: `docs/orchestration/tasks/ranch-pointer-smoke-v0.2.md`.
- Ranch session: `docs/orchestration/sessions/ranch-v0.2-2026-07-02.md`.
- Current PM board: `docs/orchestration/status.json`.

manual evidence route:
- Record the route used: human desktop observation, local screen recording that can capture the transparent Electron window, phone camera recording, or another route that explicitly avoids the previous `SetIsBorderRequired failed` failure.
- Record whether the route can see the transparent `桌面牧场` Electron window and the `桌面牧场 · 控制舱` window at the same time.
- Record the exact command session used to launch and stop Electron, including any failure output.
- 2026-07-07 route candidate: Windows MCP Snapshot observed both Electron windows and did not emit `SetIsBorderRequired failed`; full pointer input rows remain pending until they are directly observed.

evidence table template:
| check | expected result | result | evidence | blocker if incomplete |
| --- | --- | --- | --- | --- |
| lint | `npm.cmd run lint` passes | pending | command output |  |
| build | `npm.cmd run build` passes | pending | command output |  |
| orchestration | `npm.cmd run orchestration:check` passes | pending | command output |  |
| windows | `桌面牧场` and `桌面牧场 · 控制舱` are both visible | pending | route notes or recording timestamp |  |
| desktop click-through | click outside animal hot zones reaches the underlying desktop/app | pending | route notes or recording timestamp |  |
| double-click | double-clicking an animal summons/focuses the control cockpit | pending | route notes or recording timestamp |  |
| right-click | right-clicking an animal opens the ranch context menu | pending | route notes or recording timestamp |  |
| floating drag | floating mode drag moves the ranch | pending | route notes or recording timestamp |  |
| edge docking | edge dock preview and persisted bounds are observed after drag | pending | route notes or recording timestamp |  |
| cleanup | dev process is stopped | pending | terminal output or process list |  |

result rules:
- Use `pass` only when the current run directly observes the expected desktop behavior.
- Use `fail` when the behavior is observed and contradicts the expected result.
- Use `blocked` when the route cannot observe the behavior; include the exact route and failure text.
- Use `not-run` only if the step was intentionally skipped before execution started.
- A callback with any `fail`, `blocked`, or `not-run` pointer behavior remains incomplete.

forbidden scope:
- Do not edit `src/**`, `electron/**`, `docs/orchestration/connectors.json`, or M4 implementation files.
- Do not run Git repair, staging, commit, push, reset, clean, or file removal.
- Do not enable, accept, execute, or bind Codex, Trae, Qoder, or any connector.
- Do not mark pointer smoke accepted from browser-only proof.
- Do not mark M4 implementation active.

acceptance:
- Evidence table is fully filled for every check.
- Capture route is named and explicitly says whether it avoided `SetIsBorderRequired failed`.
- Every pointer behavior row is `pass`; otherwise the package remains incomplete.
- `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd run orchestration:check` pass in the same verification run.
- Callback confirms no implementation files, connector config, or Git metadata were changed.

blockers:
- Alternate transparent-window capture exists via Windows MCP Snapshot, but full pointer input evidence has not been run in the current PM thread.
- Prior Windows capture route failed with `SetIsBorderRequired failed: 不支持此接口 (0x80004002)`; use the 2026-07-07 Snapshot route or a manual recording route instead.

next action:
- Keep this package standby until the full click-through / double-click / right-click / floating drag / edge-dock evidence can be collected without interrupting user review.
- Then run the parent `ranch-pointer-smoke-v0.2` route and fill this evidence table before acceptance.

summary:
- Standby manual evidence package; no pointer smoke executed.
