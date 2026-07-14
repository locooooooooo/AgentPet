# m5-five-day-development-2026-07-14

[PM]#m5-five-day-development@2026-07-14
⟦tag:v2|session|m5-five-day-development-2026-07-14⟧

loop state: active
dispatch state: active
status: day2_authorized_by_day1_manual_waiver

> **开发窗口**: 2026-07-11 ~ 2026-07-15 (管理员授权滚动五日串行开发)
> **创建时间**: 2026-07-10 17:50 +08:00
> **当前准入门**: 2026-07-14 管理员明确跳过 Day 1 人工验收并接受残余风险；保留失败历史，完成自动门禁与 bounded commit/push 后放行同一 ranch-window 长工继续 Day 2。
> **当前结论**: W27 summarized，W28 active，本卡为 `day2_authorized_by_day1_manual_waiver`；Day 1 人工 tray 证据仍缺失但不再阻塞 Day 2，不得改写为直接验收通过。

## objective

- 在 W27 正确收口并激活 W28 后，按严格串行顺序完成五张 M5 v0.2 子卡。
- 每张卡都形成实际 callback、独立 acceptance 文档、Electron/Windows 证据和独立提交。
- 大管家只负责 PM、监督、派工、验收、提交、推送和收口；产品实现由内部子 agent 执行。

## truth sources

- `docs/orchestration/index.md`
- `docs/orchestration/status.json`
- `docs/orchestration/sessions/weekly-closeout-2026-07-11.md`
- `docs/orchestration/sessions/weekly-requirements-2026-07-14.md`
- `docs/orchestration/tasks/m5-longworker-dispatch-v0.1.md`
- `docs/桌面牧场需求-v0.3.md`
- `docs/桌面牧场工程需求-v0.2.md`

## phase 0 admission gate

- Before `2026-07-11 16:00 +08:00`: keep this card, W28, and all five M5 child cards standby; do not dispatch implementation.
- At the actual W27 closeout time: run the full gate set, complete `weekly-closeout-2026-07-11.md`, summarize W27, activate W28, synchronize index/status/accountability, then commit and push.
- Before Day 1: prove `HEAD == origin/main`, a clean worktree, W27 summarized, W28 active, connector gates unchanged, and no other product worker active.
- A calendar date never satisfies a gate by itself; missing evidence keeps the next phase pending.

## five-day serial board

| Day | Date | Only allowed product lane | Intended outcome | Start gate | Current state |
| --- | --- | --- | --- | --- | --- |
| 1 | 2026-07-11 | `[长工]#ranch-window@v0.2` | FR-001 lifecycle, default desktop mode, size/position/mode persistence | Administrator authorization + W27 summarized + W28 active + fresh clean baseline | accepted_residual_risk_manual_evidence_waived |
| 2 | 2026-07-12 | same ranch-window worker | Double-click/right-click summon, desktop/floating, drag/dock, fence, Electron evidence | Day 1 residual risk accepted by administrator + bounded commit/push; no second worker | authorized_pending_same_worker |
| 3 | 2026-07-13 | `[短工]#ranch-status-script@v0.2` | Eight identities, visible status actions, one transient status band | ranch-window accepted, committed, pushed | pending_not_started |
| 4 | 2026-07-14 | `[短工]#ranch-personality@v0.2` | chatty/quiet/silent and persisted bubble/system/badge preferences | status-script accepted, committed, pushed | pending_not_started |
| 5A | 2026-07-15 | `[短工]#ranch-fence-pointer@v0.2` | Direct click-through, double-click, right-click, floating drag and dock evidence | personality accepted, committed, pushed | pending_not_started |
| 5B | 2026-07-15 | `[短工]#ranch-system-notify@v0.2` | Real Windows notification, disable path, icon fallback, shutdown cleanup | fence-pointer accepted, committed, pushed | pending_not_started |

## serial dispatch invariant

- At most one product worker may be active.
- The next lane may start only after the previous lane has: callback -> independent PM acceptance -> full gates -> commit -> push -> clean worktree.
- Day 1 and Day 2 use the same ranch-window long-worker; do not create a second implementation owner.
- Day 5B cannot start until Day 5A has direct pointer evidence and its commit is on `origin/main`.
- If work exceeds a calendar day, carry the same lane forward and leave later lanes pending; do not force a false daily pass.

## behavior-first FR interpretation

- Use `docs/桌面牧场工程需求-v0.2.md` behavior definitions as acceptance truth where older dispatch wording swaps FR-005 and FR-008 labels.
- Summon behavior means double-click animal and right-click ranch -> control cockpit appears and focuses.
- Mode behavior means desktop passthrough versus floating focus/drag semantics.
- `capturePage()` proves visible rendering only; it never proves pointer input.
- Browser fallback notification calls never prove a Windows OS notification displayed.

## worker contract

- Before each dispatch, write the exact write whitelist, no-touch list, acceptance, evidence paths, and rollback surface into the worker prompt.
- Workers may edit only their current card's bounded source and progress/acceptance documents.
- Workers do not stage, commit, push, reset, clean, or force-push.
- Worker callback format: `completed / incomplete / blockers / next action / evidence`.
- Any required cross-boundary edit stops the lane and returns a bounded correction proposal to PM.

## protected boundaries

- Do not modify `docs/orchestration/connectors.json` machine-gate fields or `docs/orchestration/status.json` `connectors[]`.
- Do not execute project connectors Codex, Trae, or Qoder; internal Codex sub-agents are the authorized worker mechanism.
- Do not add top-level dependencies, Tailwind, Live2D, Spine, account/cloud/monetization, or pet progression systems.
- Keep `AgentSnapshot` read-only from the ranch; task operations remain in the control cockpit.
- Do not touch central control-cockpit 4x2 behavior, `src/components/NiuMaAvatar.tsx`, protected `src/index.css` keyframes, key `src/lib/agentCore.ts` sections, `icon/**`, or `package.json` unless a fresh bounded correction is explicitly approved.
- Do not use `git reset --hard`, `git clean -fd`, or `git push --force`.

## recurring gate set

Run before and after every PM commit:

```text
npm.cmd run orchestration:check
npm.cmd run orchestration:report
npm.cmd run orchestration:preflight
npm.cmd run orchestration:connector-safety
npm.cmd run lint
npm.cmd run build
git diff --check
```

Additional Electron acceptance must cover the relevant success path, failure/disabled path, relaunch persistence, and shutdown cleanup. Record exact missing evidence instead of treating a green build as broad desktop acceptance.

## evidence ledger

| Lane | Worker/thread | Callback | Acceptance card | Electron/Windows evidence | Commit | State |
| --- | --- | --- | --- | --- | --- | --- |
| ranch-window-v0.2 | pending | pending | `docs/orchestration/sessions/ranch-window-v0.2-acceptance-2026-07-XX.md` | pending | pending | standby |
| ranch-status-script-v0.2 | pending | pending | `docs/orchestration/sessions/ranch-status-script-v0.2-acceptance-2026-07-XX.md` | pending | pending | standby |
| ranch-personality-v0.2 | pending | pending | `docs/orchestration/sessions/ranch-personality-v0.2-acceptance-2026-07-XX.md` | pending | pending | standby |
| ranch-fence-pointer-v0.2 | pending | pending | `docs/orchestration/sessions/ranch-fence-pointer-v0.2-acceptance-2026-07-XX.md` | pending | pending | standby |
| ranch-system-notify-v0.2 | pending | pending | `docs/orchestration/sessions/ranch-system-notify-v0.2-acceptance-2026-07-XX.md` | pending | pending | standby |

## completion criteria

- All five M5 child cards are summarized only after current evidence proves their acceptance.
- Every ledger row contains a real worker callback, acceptance card, desktop evidence, and independent pushed commit.
- W27 is summarized, W28 is active, `HEAD == origin/main`, and the worktree is clean.
- Connector machine gates and protected boundaries remain intact.
- Final callback uses `completed / incomplete / blockers / next action / evidence / commits`.
- If any lane is not accepted after the five-day window, write a truthful closeout and keep the goal active.

## current checkpoint

completed:
- Five-day dates, serial lane order, evidence contract, acceptance gates, and protected boundaries are recorded.
- Day 1 cross-layer preflight confirms the existing preload/types/browser-fallback ranch contract is sufficient; the bounded worker can stay within `src/ranch/**`, `electron/main.ts`, allowed header/settings surfaces, and orchestration evidence files.
- Day 1 allowed-scope risks are identified before dispatch: desktop close/hide semantics and display-work-area recovery for persisted x/y require explicit correction/evidence in `electron/main.ts`.

incomplete:
- Day 1 direct tray lifecycle evidence remains missing by explicit administrator waiver; it must stay recorded as residual risk rather than pass evidence.
- Day 2 and all later implementation callbacks, desktop evidence sets, and commits remain pending; Day 2 is now authorized for the same ranch-window owner after the bounded Day 1 commit/push.

blockers:
- Windows automation identified the Electron windows but failed to obtain a reliable transparent-window interaction state with `SetIsBorderRequired failed: 不支持此接口 (0x80004002)`; capture/CDP evidence does not prove tray interaction.
- Day 1 still lacks direct close -> hide -> tray summon and tray exit -> cleanup acceptance, but the administrator waived this manual gate on 2026-07-14 and accepted the residual risk for Day 2 progression.
- 2026-07-12 direct replay produced a failing result: closing the ranch removed verified Electron PID `62196`, so the implementation does not currently provide the required resident close -> hide behavior.
- Existing connector, pointer, protected-source, and live-subagent quota blockers remain separate; none is silently accepted by this plan.

next action:
- Commit/push the bounded Day 1 correction with the waiver record after automated gates; do not describe the waived tray replay as passed.
- Resume the same `[长工]#ranch-window@v0.2` for Day 2 only. Day 3 and later cards remain pending behind Day 2 callback and bounded commit/push.

evidence:
- Baseline at creation: `HEAD == origin/main == 1d9d5b0`; worktree clean.
- 2026-07-11 preflight baseline before its docs commit: `HEAD == origin/main == 5416f4d`; worktree clean; typed ranch bridge and existing renderer/main paths inspected read-only.
- 2026-07-11 actual-time transition baseline: `HEAD == origin/main == b17c717`; fresh 80-card check, report, preflight, connector-safety, lint, and build passed before edits.
- 2026-07-11 administrator schedule authorization moves Day 1 to today and rolls the serial window through 2026-07-15; product evidence remains pending.
- 2026-07-11 Day 1 worker completed the allowed `electron/main.ts` implementation and isolated prefs/relaunch checks; PM direct tray replay remained unaccepted after Windows automation returned `0x80004002`.
- W27 is summarized and W28 is active; `m5-longworker-dispatch-v0.1` and all five implementation cards remain standby.

summary:
- Five-day M5 serial development control is active at Day 2 authorization after an explicit Day 1 manual-acceptance waiver. Day 1 residual risk remains recorded; Day 3 and later cards remain pending.
