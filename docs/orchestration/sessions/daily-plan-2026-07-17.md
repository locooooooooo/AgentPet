# daily-plan-2026-07-17

[PM]#daily-plan@2026-07-17

⟦tag:v2|session|daily-plan-2026-07-17⟧

loop state: active
dispatch state: active
status: active_supervision_after_control_closeout

## single goal

- Restore the 2026-07-17 control plane to current repository truth and close only acceptance gaps that can be directly verified without reopening completed product implementation.

## confirmed baseline

- `HEAD == origin/main == c21a60b2929fe6c41b63ee5f749256c76e963508` before this control update.
- The working tree was clean before dispatch.
- `npm.cmd run orchestration:check` passed with 104 referenced cards.
- `npm.cmd run orchestration:report`, `npm.cmd run orchestration:preflight`, and `npm.cmd run orchestration:connector-safety` passed.
- Codex and Trae remain `draft/pending/enabled=false`; Qoder remains `disabled/rejected/enabled=false`.
- P0-C external Codex execution is not authorized by the request to arrange today's work.

## dispatch board

| Order | Lane | Boundary | State | Evidence |
| --- | --- | --- | --- | --- |
| 1 | `[监督]#control-truth-audit@2026-07-17` | Read-only index/status/session/git audit | summarized | Current-date, stale-role, P1/P2 review, live-session and blocker corrections returned with no file changes |
| 2 | `[监督]#ranch-pointer-smoke@2026-07-17` | Real Electron pointer evidence only; no implementation edits | completed_with_blockers | `ranch-pointer-smoke-2026-07-17.md` |
| 3 | `[监督]#cockpit-ui-redesign-v3.2-acceptance@2026-07-17` | Independent read-only P1/P2 browser replay | summarized / accepted | `cockpit-ui-redesign-v3.2-p1-p2-acceptance-2026-07-17.md` |
| 4 | `[PM]#daily-plan@2026-07-17` | Control-plane truth sync, acceptance and closeout | active supervision | This card, `index.md`, `status.json`, W28 truth and final gates |

## completed

- Confirmed that the old `403 DAILY_LIMIT_EXCEEDED` wording is not current availability truth: two bounded in-app short workers were dispatched successfully in this run.
- Confirmed v3.2 P1 `51d5501` and P2 `0dfaadf` are implemented and pushed, but their progress cards still require independent PM acceptance.
- Confirmed protected cockpit source drift is closed with no current drift.
- Confirmed Trae/Qoder discovery and the live Codex Desktop Session/completion-notification feature are completed and pushed.
- Ran a fresh transparent Electron ranch pointer lane. Static gates and both windows passed, but the coordinate-input route remained blocked by the Windows capture failure recorded in the evidence card.
- Accepted v3.2 P1 `51d5501` and P2 `0dfaadf` after independent viewport, governance, keyboard, Portal, state, CSSOM, console and full-gate replay.

## current blockers

- P0-C requires a new explicit Codex-only external execution authorization with cwd, read-only task, timeout and stop conditions.
- Trae requires non-secret Models configuration, a successful model response and a new smoke authorization.
- Qoder requires an independent headless Agent API before reconsideration.
- Full transparent Electron pointer input remains blocked because the current Windows capture route cannot produce the screenshot state required for safe coordinate input.

## non-goals

- No P0-C, R0-3, Codex, Trae, Qoder or other external Agent CLI execution.
- No Connector machine-gate change.
- No M5, protected-source, cockpit feature or ranch implementation reopening.
- No product-code edit from the PM control lane.

## acceptance

- `index.md`, `status.json`, W28 truth and affected task/session cards describe the 2026-07-17 state without stale 7-15 actions.
- v3.2 P1/P2 are accepted only after the independent acceptance callback and evidence card.
- Pointer evidence is recorded as blocked, not passed, and the Lane-owned 5174/Electron process tree is cleaned.
- Governance checks, realtime truth checks, lint, build and `git diff --check` pass after the control update.
- The final control-plane commit is pushed and `HEAD == origin/main`.

## gate results

- `npm.cmd run orchestration:check`: passed with 109 referenced cards.
- `npm.cmd run orchestration:report`: passed with only daily supervision and W28 weekly planning active.
- `npm.cmd run orchestration:preflight`: passed; Codex/Trae remain pending and disabled, Qoder remains rejected and disabled.
- `npm.cmd run orchestration:connector-safety`: passed; external Agent CLI execution remained zero.
- `npm.cmd run realtime:truth-check`: passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `git diff --check`: passed.

## next action

- Keep W28 in buffer/closeout mode with no implementation worker active.
- Keep pointer evidence standby until a working screenshot-bound coordinate route exists.
- Keep P0-C and every production Connector behind their explicit authorization gates.
