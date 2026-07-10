# weekly-requirements-2026-07-14

[PM]#weekly-requirements@2026-07-14
⟦tag:v2|session|weekly-requirements-2026-07-14⟧
⟦tag:v2|session|weekly-requirements-w28⟧

loop state: standby
dispatch state: standby

> **计划周期**: 2026-07-14 ~ 2026-07-20 (W28)
> **当前状态**: standby placeholder
> **激活条件**: 2026-07-11 (周六) 16:00 W27 closeout 完成后,由 PM 将本卡转为 active。
> **硬边界**: 本卡只登记候选与顺序;不启动 M5 实施、不执行 R0-3 dry-run、不修改 protected source 或 connector machine gate。

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
| P0-1 | M5 v0.2 串行实施,首卡 `ranch-window-v0.2` | 仅路线已选;未派 long-worker,未改 source | 新 bounded dispatch 明确文件 fence、验收和回滚面 |
| P0-2 | R0-3 Codex controlled dry-run | 仍 standby;不改 `approvalStatus` / `enabledByDefault` / `command` | W28 明确执行窗口、隔离 cwd 和 evidence 路径后再二次确认 |
| P0-3 | Transparent ranch full pointer input evidence | capturePage 仅证明可见渲染;完整 pointer input 未 accepted | 明确 observer/automation route,保持 implementation 与 evidence 分离 |

## 二、W28 P1 候选

| 优先级 | 候选 | 当前边界 |
| --- | --- | --- |
| P1-1 | Protected trailing whitespace bounded lane | 仅处理已登记的 protected whitespace;本周不修、不回退、不扩大 source scope |
| P1-2 | `cockpit-ui-redesign-v3.1` 范围拍板 | 当前仅 task intake;不得直接修改中央 4x2 grid、8 卡 keyframes、`NiuMaAvatar.tsx` 或关键 `agentCore.ts` |
| P1-3 | live-subagents `403 DAILY_LIMIT_EXCEEDED` quota 复查 | 本周不主动复查;W28 仅在安全 route 可用时记录精确结果 |
| P1-4 | M5 后续子卡排队 | `ranch-status-script-v0.2` / `ranch-personality-v0.2` / `ranch-fence-pointer-v0.2` / `ranch-system-notify-v0.2` 均不得与 P0-1 并行抢占 protected/shared surface |

## 三、W28 P2 候选

- 桌面牧场 v0.4 外部 agent CLI / 多进程管理方案,继续受 R0-3 machine-gate 约束。
- `orchestration:report` 周期化输出,仅在不引入 connector execution 的前提下评估。
- ranch v0.3.1 bounded polish,只处理用户明确反馈,不主动扩展视觉重构。
- W27 文档归档与历史 wording 清理,不得改写 accepted evidence。

## 四、排期建议

| 日期 | 建议动作 |
| --- | --- |
| 2026-07-14 (周二) | 激活 W28;复核 W27 closeout;只拍 P0-1 bounded dispatch |
| 2026-07-15 (周三) | 若 P0-1 获明确派工,只跑 `ranch-window-v0.2` 串行实施与验证 |
| 2026-07-16 (周四) | 收口 P0-1 evidence;不自动启动其余 M5 子卡 |
| 2026-07-17 (周五) | 评估 R0-3 dry-run 执行窗口;没有二次确认则继续 standby |
| 2026-07-18 (周六) | 处理 pointer evidence / protected whitespace / quota 中最多 1 个 bounded lane |
| 2026-07-19 ~ 2026-07-20 | W28 buffer、回归、周 closeout 准备 |

acceptance:
- 本卡保持 `standby` 直到 W27 closeout。
- P0/P1/P2 候选与 2026-07-14 ~ 2026-07-20 排期存在。
- `docs/orchestration/index.md`, `docs/orchestration/status.json`, and `daily-role-accountability-2026-07-02.md` track this standby role。
- 本卡不授权 M5 implementation、Codex dry-run、Trae/Qoder、connector machine-gate edit 或 protected source edit。
- `npm.cmd run orchestration:check` passes。

next action:
- 2026-07-11 16:00 W27 closeout 后补最终上下文。
- W28 激活时只把本卡状态改为 active;任何 implementation / dry-run 仍需独立 bounded dispatch 或二次执行确认。

summary:
- W28 standby placeholder;管理员已选定 M5 串行首卡和三项 deferred 路线,但本周不执行。
