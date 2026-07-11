# m5-five-day-development-2026-07-14

[PM]#m5-five-day-development@2026-07-14
⟦tag:v2|session|m5-five-day-development-2026-07-14⟧

loop state: standby
dispatch state: standby
status: standby_waiting_w27_closeout

> **开发窗口**: 2026-07-14 ~ 2026-07-18 (W28 五日串行开发)
> **创建时间**: 2026-07-10 17:50 +08:00
> **当前准入门**: `docs/orchestration/sessions/weekly-closeout-2026-07-11.md` 必须先有真实 W27 final closeout 证据。
> **当前结论**: 本卡只完成五日跟踪与验收编排；W27 仍 active，W28 与全部 M5 implementation 卡仍 standby，当前不派 worker、不改产品代码。

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
| 1 | 2026-07-14 | `[长工]#ranch-window@v0.2` | FR-001 lifecycle, default desktop mode, size/position/mode persistence | W27 summarized + W28 active + clean baseline | pending_not_started |
| 2 | 2026-07-15 | same ranch-window worker | Double-click/right-click summon, desktop/floating, drag/dock, fence, Electron evidence | Day 1 callback absorbed; no second worker | pending_not_started |
| 3 | 2026-07-16 | `[短工]#ranch-status-script@v0.2` | Eight identities, visible status actions, one transient status band | ranch-window accepted, committed, pushed | pending_not_started |
| 4 | 2026-07-17 | `[短工]#ranch-personality@v0.2` | chatty/quiet/silent and persisted bubble/system/badge preferences | status-script accepted, committed, pushed | pending_not_started |
| 5A | 2026-07-18 | `[短工]#ranch-fence-pointer@v0.2` | Direct click-through, double-click, right-click, floating drag and dock evidence | personality accepted, committed, pushed | pending_not_started |
| 5B | 2026-07-18 | `[短工]#ranch-system-notify@v0.2` | Real Windows notification, disable path, icon fallback, shutdown cleanup | fence-pointer accepted, committed, pushed | pending_not_started |

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
- W27 final closeout has not reached its authorized time.
- W28 is not active.
- No M5 implementation worker has been dispatched.
- All five implementation callbacks, desktop evidence sets, and commits are pending.

blockers:
- Time gate: W27 final closeout is due no later than `2026-07-11 16:00 +08:00` and cannot be pre-recorded on 2026-07-10.
- Existing connector, pointer, protected-source, and live-subagent quota blockers remain separate; none is silently accepted by this plan.

next action:
- Keep this card in `standby_waiting_w27_closeout` and re-read live truth at the actual W27 closeout time.
- Do not dispatch `[长工]#ranch-window@v0.2` before W28 activation and the 2026-07-14 Day 1 gate.

evidence:
- Baseline at creation: `HEAD == origin/main == 1d9d5b0`; worktree clean.
- 2026-07-11 preflight baseline before its docs commit: `HEAD == origin/main == 5416f4d`; worktree clean; typed ranch bridge and existing renderer/main paths inspected read-only.
- W27 source remains active; W28 and `m5-longworker-dispatch-v0.1` remain standby.

summary:
- Five-day M5 serial development control card created without starting implementation; waiting for the W27 closeout and W28 activation gates.
