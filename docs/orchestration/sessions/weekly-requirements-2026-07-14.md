# weekly-requirements-2026-07-14

[PM]#weekly-requirements@2026-07-14
⟦tag:v2|session|weekly-requirements-2026-07-14⟧
⟦tag:v2|session|weekly-requirements-w28⟧

loop state: standby
dispatch state: standby

> **计划周期**: 2026-07-14 ~ 2026-07-20 (W28)
> **当前状态**: standby placeholder
> **激活条件**: 2026-07-11 (周六) 16:00 W27 closeout 完成后,由 PM 将本卡转为 active。
> **硬边界**: W27 closeout 前本卡只登记候选与顺序;W28 激活后仅按 `m5-five-day-development-2026-07-14.md` 使用 Codex 内部子 agent 串行实施,不执行项目 Codex/Trae/Qoder connector、不修改 protected source 或 connector machine gate。

---

## 〇、W27 closeout 上下文

- W27 closeout 真源: `docs/orchestration/sessions/weekly-closeout-2026-07-11.md`。
- 2026-07-10 管理员默认拍板已落档:
  - protected trailing whitespace 选择 ④,路由到 W28 bounded lane,本周不修。
  - M5 选择 ②,串行优先 `ranch-window-v0.2`,本周不启动 long-worker。
  - live-subagents quota 选择 ②,推到 W28,本周不主动复查。
  - R0-3 controlled dry-run 选择 ②,推到 W28,本周不执行 Codex。
- W27 已完成的 capture-only evidence、M5 docs-only readiness 和 cockpit v3.1 task intake 作为 W28 输入,不等同于实施验收。
- 本段在 2026-07-11 closeout 后补最终 commit、遗留项和 W27 acceptance 摘要。

## 一、W28 P0 候选

| 优先级 | 候选 | 当前边界 | 激活前置 |
| --- | --- | --- | --- |
| P0-1 | M5 v0.2 五日串行实施,首卡 `ranch-window-v0.2` | 仅路线已选;未派 long-worker,未改 source | 派工包与五日总控已落档;W27 summarized、W28 active、clean baseline 后,PM 在 2026-07-14 派 Codex 内部 `[长工]#ranch-window@v0.2` |
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
| 2026-07-14 (周二) | Day 1:PM 派 `[长工]#ranch-window@v0.2`;完成 FR-001 lifecycle、default desktop、size/position/mode persistence |
| 2026-07-15 (周三) | Day 2:继续同一 ranch-window worker;完成召唤、desktop/floating、drag/dock/fence 与 Electron evidence;验收后 PM commit/push |
| 2026-07-16 (周四) | Day 3:仅在 ranch-window accepted/pushed 后派 `[短工]#ranch-status-script@v0.2` |
| 2026-07-17 (周五) | Day 4:仅在 status-script accepted/pushed 后派 `[短工]#ranch-personality@v0.2` |
| 2026-07-18 (周六) | Day 5:先派 `[短工]#ranch-fence-pointer@v0.2`;直接 pointer evidence accepted/pushed 后才派 `[短工]#ranch-system-notify@v0.2` |
| 2026-07-19 ~ 2026-07-20 | W28 buffer、回归、周 closeout 准备 |

acceptance:
- 本卡保持 `standby` 直到 W27 closeout。
- P0/P1/P2 候选与 2026-07-14 ~ 2026-07-20 排期存在。
- `docs/orchestration/index.md`, `docs/orchestration/status.json`, and `daily-role-accountability-2026-07-02.md` track this standby role。
- W27 closeout 前本卡不授权 M5 implementation;W28 激活后 M5 implementation 仅由五日总控和逐卡 bounded dispatch 授权。
- Codex 内部子 agent 是授权 worker 机制;项目 Codex/Trae/Qoder connector、R0-3 dry-run、connector machine-gate edit 和 protected source edit 仍不授权。
- `npm.cmd run orchestration:check` passes。

next action:
- 2026-07-11 16:00 W27 closeout 后补最终上下文。
- W28 激活时同步五日总控准入状态;M5 按逐卡 bounded dispatch 串行执行,R0-3 dry-run 仍需二次执行确认。

summary:
- W28 standby placeholder;M5 已对齐 2026-07-14 ~ 2026-07-18 五日串行 Goal,但 W27 closeout 前不执行。
