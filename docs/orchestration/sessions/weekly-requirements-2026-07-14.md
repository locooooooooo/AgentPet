# weekly-requirements-2026-07-14

[PM]#weekly-requirements@2026-07-14
⟦tag:v2|session|weekly-requirements-2026-07-14⟧
⟦tag:v2|session|weekly-requirements-w28⟧

loop state: active
dispatch state: active

> **计划周期**: 2026-07-14 ~ 2026-07-20 (W28)
> **当前状态**: active; M5 Day 1 implementation complete but PM tray lifecycle acceptance blocked on 2026-07-12
> **激活证据**: 2026-07-11 16:00 +08:00 W27 final closeout 已通过 fresh gates，并将 W27 summarized。
> **硬边界**: Day 1 未接受和推送前不得以 2026-07-12 日历门启动 Day 2；仍仅按 `m5-five-day-development-2026-07-14.md` 串行实施,不执行项目 Codex/Trae/Qoder connector、不修改 protected source 或 connector machine gate。

---

## 〇、W27 closeout 上下文

- W27 closeout 真源: `docs/orchestration/sessions/weekly-closeout-2026-07-11.md`。
- 2026-07-10 管理员默认拍板已落档:
  - protected trailing whitespace 选择 ④,路由到 W28 bounded lane,本周不修。
  - M5 选择 ②,串行优先 `ranch-window-v0.2`,本周不启动 long-worker。
  - live-subagents quota 选择 ②,推到 W28,本周不主动复查。
  - R0-3 controlled dry-run 选择 ②,推到 W28,本周不执行 Codex。
- W27 已完成的 capture-only evidence、M5 docs-only readiness 和 cockpit v3.1 task intake 作为 W28 输入,不等同于实施验收。
- 2026-07-11 actual-time closeout 已完成: W27 summarized，W28 active；随后管理员授权将 M5 Day 1 提前至今天，M5 控制卡为 `active_ready_day1`，但尚未派 worker。
- 2026-07-12 truth refresh:唯一 Day 1 worker 已完成 allowed-scope 实现并回调；PM 未获得直接 tray lifecycle 证据，当前转为 `blocked_day1_acceptance`，未 commit/push，Day 2 未启动。
- Pre-edit baseline: `HEAD == origin/main == b17c717`; 80-card orchestration check、report、preflight、connector-safety、lint、build 全绿。
- W27 遗留项保持分离：M5 serial implementation、direct pointer evidence、R0-3 execution-window confirmation、protected bounded disposition、quota recheck；没有任何一项因 W28 激活被自动接受。

## 一、W28 P0 候选

| 优先级 | 候选 | 当前边界 | 激活前置 |
| --- | --- | --- | --- |
| P0-1 | M5 v0.2 五日串行实施,首卡 `ranch-window-v0.2` | Day 1 implementation complete but PM acceptance blocked; source and evidence remain uncommitted | Direct tray lifecycle evidence -> PM acceptance -> full gates -> commit/push -> clean baseline; only then resume the same worker for Day 2 |
| P0-2 | R0-3 Codex controlled dry-run | 仍 standby;不改 `approvalStatus` / `enabledByDefault` / `command` | W28 明确执行窗口、隔离 cwd 和 evidence 路径后再二次确认 |
| P0-3 | Transparent ranch full pointer input evidence | capturePage 仅证明可见渲染;完整 pointer input 未 accepted | 明确 observer/automation route,保持 implementation 与 evidence 分离 |

## 二、W28 P1 候选

| 优先级 | 候选 | 当前边界 |
| --- | --- | --- |
| P1-1 | Protected trailing whitespace bounded lane | 仅处理已登记的 protected whitespace;本周不修、不回退、不扩大 source scope |
| P1-2 | `cockpit-ui-redesign-v3.1` 范围拍板 | 当前仅 task intake;不得直接修改中央 4x2 grid、8 卡 keyframes、`NiuMaAvatar.tsx` 或关键 `agentCore.ts` |
| P1-3 | live-subagents `403 DAILY_LIMIT_EXCEEDED` quota 复查 | 本周不主动复查;W28 仅在安全 route 可用时记录精确结果 |
| P1-4 | M5 后续子卡串行队列 | 按五日总控在前一卡 callback、PM acceptance、full gates、commit、push、clean worktree 后接续;任何时候最多一个产品 worker |

## 三、W28 P2 候选

- 桌面牧场 v0.4 外部 agent CLI / 多进程管理方案,继续受 R0-3 machine-gate 约束。
- `orchestration:report` 周期化输出,仅在不引入 connector execution 的前提下评估。
- ranch v0.3.1 bounded polish,只处理用户明确反馈,不主动扩展视觉重构。
- W27 文档归档与历史 wording 清理,不得改写 accepted evidence。

## 四、排期建议

| 日期 | 建议动作 |
| --- | --- |
| 2026-07-11 | Day 1:PM 派 `[长工]#ranch-window@v0.2`;完成 FR-001 lifecycle、default desktop、size/position/mode persistence |
| 2026-07-12 | Day 2:继续同一 ranch-window worker;完成召唤、desktop/floating、drag/dock/fence 与 Electron evidence;验收后 PM commit/push |
| 2026-07-13 | Day 3:仅在 ranch-window accepted/pushed 后派 `[短工]#ranch-status-script@v0.2` |
| 2026-07-14 | Day 4:仅在 status-script accepted/pushed 后派 `[短工]#ranch-personality@v0.2` |
| 2026-07-15 | Day 5:先派 `[短工]#ranch-fence-pointer@v0.2`;直接 pointer evidence accepted/pushed 后才派 `[短工]#ranch-system-notify@v0.2` |
| 2026-07-16 ~ 2026-07-20 | W28 buffer、回归、周 closeout 准备 |

acceptance:
- 本卡已在真实 W27 closeout 后切换为 `active`。
- P0/P1/P2 候选与 2026-07-11 ~ 2026-07-20 滚动排期存在。
- `docs/orchestration/index.md`, `docs/orchestration/status.json`, and `daily-role-accountability-2026-07-02.md` track this active role。
- 管理员已将 M5 Day 1 日历门改为 2026-07-11；M5 implementation 仍仅由五日总控、今日 fresh baseline 和逐卡 bounded dispatch 授权。
- Codex 内部子 agent 是授权 worker 机制;项目 Codex/Trae/Qoder connector、R0-3 dry-run、connector machine-gate edit 和 protected source edit 仍不授权。
- `npm.cmd run orchestration:check` passes。

next action:
- 保持 M5 五日总控为 `blocked_day1_acceptance`；获取真实 tray lifecycle 证据前不接受、不 commit/push、不启动 Day 2。
- Day 1 通过 PM acceptance、full gates、commit/push、clean baseline 后，才允许继续同一 `[长工]#ranch-window@v0.2` 承接 Day 2；后续卡继续受逐卡门约束。
- R0-3 dry-run、protected source、quota recheck 和 pointer evidence 仍需各自 bounded activation。

summary:
- W28 active;M5 保持 2026-07-11 ~ 2026-07-15 串行 Goal，但当前阻塞在 Day 1 PM tray lifecycle acceptance，日历不自动放行 Day 2。
