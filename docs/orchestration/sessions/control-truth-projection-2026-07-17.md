# Control Truth Projection Acceptance - 2026-07-17

[监督]#control-truth-projection@2026-07-17

⟦tag:v2|session|control-truth-projection-2026-07-17⟧

loop state: summarized
dispatch state: summarized
status: accepted

## objective

- Prove that the control cockpit visibly consumes the 2026-07-17 orchestration truth after commit `658efd0`, rather than accepting JSON and governance checks alone.

## visible evidence

| Check | Result | Evidence |
| --- | --- | --- |
| current target and plan | pass | Target and today plan show 2026-07-17; the 2026-07-15 next-stage session appears only as summarized history |
| v3.2 | pass | `v3.2 + summarized` returns one role; P1 `51d5501` and P2 `0dfaadf` are accepted/pushed with no pending/unauthorized copy |
| live Session | pass | `live-session-notification + summarized` returns one completed/pushed role for `c21a60b` |
| realtime carry-over | pass | runtime and truth UI are standby; old requirements control and next-stage are summarized |
| live subagents | pass | Lane is summarized and explicitly says the historical 403 is not current availability truth |
| pointer | pass | Two roles and two Lanes remain standby with the Windows screenshot/input binding blocker and no implementation-failure claim |
| active control | pass | Four of 46 roles and two of 30 Lanes are active: PM, Supervisor, W28 weekly, 7-17 daily; daily supervision and weekly planning |
| governance tools | pass | Dock governance details, search and state filters locate every expected entry |
| layout and console | pass | At 2560x1257, `scrollWidth == clientWidth == 2560`; console warning/error count is zero |

## control gates

- `npm.cmd run orchestration:check`: passed with 109 referenced cards.
- `npm.cmd run orchestration:report`: passed.
- `HEAD == origin/main == 658efd0` and the worktree was clean during the read-only replay.

## projection boundaries

- `Connector 策略 · 3 blocked` represents Connector machine policy; governance `0 blocked` represents current orchestration Lane state. The two counters intentionally have different scopes.
- Browser fallback runtime observation time can remain older than `status.json`; it is not the governance truth timestamp.
- Transparent pointer behavior remains unaccepted despite correct blocker projection.

## cleanup

- Reused the existing port 5173 process without starting or terminating any process.
- Released the browser page and made no file or Git change.
