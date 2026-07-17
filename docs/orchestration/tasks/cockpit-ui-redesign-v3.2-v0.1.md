# cockpit-ui-redesign-v3.2-v0.1

[PM]#cockpit-ui-redesign-v3.2@v0.1
⟦tag:v2|task|cockpit-ui-redesign-v3.2-v0.1⟧

loop state: summarized
dispatch state: summarized
status: p0_p1_p2_accepted_pushed

date: 2026-07-13
source: `docs/控制舱UI体验诊断与v3.2开工方案-2026-07-13.md`

## objective

在不重写控制舱、不改变任务业务合同的前提下，减少重复状态和低价值信息，缩短“发现异常 -> 选 Agent -> 派任务 -> 看结果”的路径，并保证 1280x720 首屏可完成派活。

## user outcomes

- 操作者进入控制舱后能快速识别在线、运行、阻塞和最近事件。
- 选择 Agent 后，任务表单与 CTA 优先于 quote 和详细指标。
- 角色、Lanes、长 blocker 和低频详情按需展开。
- 中央矩阵保持第一视觉层级，非选中卡不再暴露大量同级按钮。
- 键盘、长文本、窄高度和高 DPI 下仍可稳定操作。

## implementation strategy

只启动一个 P0 长工，不一次完成 P0/P1/P2：

1. P0 accepted/pushed 后再决定是否开 P1。
2. P1 accepted/pushed 后再决定是否开 P2。
3. 每段独立 callback、PM acceptance、gates、commit、push。

## P0 scope

1. 收敛全局状态：Header 保留在线/运行/阻塞与 connector/latest event；Dock 只保留更新时间和全局反馈；左轨移除重复 latest tile。
2. 右 Operator 改为任务优先：紧凑 Agent 头，quote/详细指标折叠；1280x720 首屏显示任务名、命令和 CTA。
3. 非选中 AgentCard 只保留选中和一个主动作；其余动作在选中卡或“更多”菜单可达。
4. 右轨展开时隐藏 Corner Assist；右轨收起或窄屏时才显示。

## P1 follow-up

- 左轨治理信息加入状态过滤/搜索或等价快速定位。
- blocker 摘要与全文分层，保留复制与真源路径。
- 建立区域级键盘跳转和稳定焦点顺序。

## P2 follow-up

- 收敛字号、边框、阴影、选中/hover/focus/disabled。
- reduced-motion、DPI、长文本、空态和错误态打磨。

## non-goals

- 不改 Agent 状态机、任务执行、connector 策略或数据合同。
- 不改动物身份、代号、头像、动画资源和牧场窗口。
- 不执行项目 Codex/Trae/Qoder connector。
- 不处理 M5 Day 1/2。
- 不做 landing page、全页重写或新设计系统。

## allowed files

- `src/components/NiuMaWorkspace.tsx`
- `src/components/StatusStrip.tsx`
- `src/index.css` 仅 cockpit 规则
- `docs/orchestration/sessions/cockpit-ui-redesign-v3.2-progress.md`
- `docs/orchestration/sessions/cockpit-ui-redesign-v3.2-acceptance-2026-07-XX.md`

## forbidden files

- `electron/**`
- `src/ranch/**`
- `src/components/NiuMaAvatar.tsx`
- `src/lib/agentCore.ts`
- `src/lib/desktopClient.ts`
- `src/types.ts`
- `docs/orchestration/connectors.json`
- `docs/orchestration/status.json` 的 `connectors[]`
- `package.json`
- `icon/**`
- 所有现有 `@keyframes`
- 当前未提交的 M5 Day 1 `electron/main.ts`

## acceptance matrix

| Requirement | Evidence | Failure |
| --- | --- | --- |
| Global state dedupe | Header/Dock/left screenshots + DOM text count | 同一 KPI/latest event 仍在多处同级展示 |
| Task-first right rail | 1280x720 screenshot | 任务名、命令或 CTA 需要滚动才能看到 |
| Central matrix priority | 1280/1440 screenshots | 左右轨覆盖或挤压中央核心内容 |
| Card action reduction | selected/unselected screenshots and keyboard replay | 动作丢失或非选中卡仍保留按钮洪水 |
| Conditional corner assist | right rail open/closed screenshots | 与右详情同时重复出现或遮挡 dock |
| Keyboard path | before/after focus count | 任务 tab 仍需穿越大部分卡片动作 |
| Long text | blocker/command stress case | 撑宽、互压、无 tooltip/复制路径 |
| Accessibility | labels/focus/status audit | 只靠颜色、图标无名称、隐藏区可聚焦 |
| Quality gates | command logs | 任一 gate 失败 |

## quantitative gates

- 1280x720、1440x900、宽屏：`scrollWidth == clientWidth`。
- 1280x720：任务名称、命令和“立即派活”首屏可见。
- Header/Dock/左轨重复 KPI 明显减少；latest event 只有一个主表达。
- 右轨展开时 Corner Assist 不出现。
- 记录任务 tab 的 before/after 焦点序号，after 必须显著低于当前约 75。
- 正常文本对比度不低于 4.5:1；状态包含文本或图标。

## validation commands

```text
npm.cmd run orchestration:check
npm.cmd run orchestration:report
npm.cmd run orchestration:preflight
npm.cmd run orchestration:connector-safety
npm.cmd run lint
npm.cmd run build
git diff --check
```

## rollback

- v3.2 使用独立 commit。
- 验收失败时 `git revert <v3.2-commit> --no-edit`，然后重跑全部 gates。
- 不回滚 v3.1 `aa4cfa5`，不触碰 M5 未提交改动。

## worker callback

固定格式：

```text
completed:
incomplete:
blockers:
next action:
evidence:
```

## implementation prompt

```text
你是 `[长工]#cockpit-ui-redesign-v3.2@v0.1`，在 E:\多agent牛马 只实施控制舱 v3.2 P0，不进入 P1/P2。

先阅读：
- docs/控制舱UI体验诊断与v3.2开工方案-2026-07-13.md
- docs/orchestration/tasks/cockpit-ui-redesign-v3.2-v0.1.md
- docs/orchestration/tasks/cockpit-ui-redesign-v3.1-v0.1.md
- docs/orchestration/sessions/cockpit-ui-redesign-v3.1-progress-2026-07-12.md

目标：
1. Header 成为在线/运行/阻塞/connector/latest event 的唯一全局主表达；Dock 只保留更新时间和全局反馈；左轨移除重复 latest tile。
2. 右 Operator 改为任务优先。紧凑 Agent 头；quote 与详细指标折叠；1280x720 首屏必须看到任务名、命令和“立即派活”。
3. 非选中 AgentCard 只保留选择与一个主动作，其余动作在选中卡或可访问的更多菜单中可达。
4. 右轨展开时隐藏 Corner Assist；右轨收起或窄屏时再显示。

允许：
- src/components/NiuMaWorkspace.tsx
- src/components/StatusStrip.tsx
- src/index.css 的 cockpit 规则
- v3.2 progress/acceptance 文档

禁止：
- electron/**、src/ranch/**、NiuMaAvatar.tsx、agentCore.ts、desktopClient.ts、types.ts
- connectors.json、status.json connectors[]、package.json、icon/**、现有 @keyframes
- 当前未提交的 electron/main.ts
- 任何项目 Codex/Trae/Qoder connector
- M5 Day 1/2

不要删除功能换取整洁。所有被收起的动作必须有明确替代路径；状态不能只靠颜色；图标按钮必须有 accessible name 和 tooltip；隐藏区不得继续参与焦点顺序。

验证 1280x720、1440x900 和宽屏：无水平滚动、无重叠；1280 首屏 CTA 可见；右轨展开时 Corner Assist 不重复；长 blocker/命令稳定；记录任务 tab 焦点序号 before/after。

运行 orchestration:check/report/preflight/connector-safety、lint、build、git diff --check。
不得 stage/commit/push/reset/clean/force-push。
回调必须为 completed / incomplete / blockers / next action / evidence。
```

## next action

- P0 已完成 PM 独立视觉/交互验收并推送；保留本卡为后续增量边界。
- P1 `51d5501` 与 P2 `0dfaadf` 已在 2026-07-17 独立 PM 回放中验收通过。
- 保留 active reduced-motion profile 与自然 error-toast replay 为非阻塞残余证据；不因此开启新视觉阶段。

## summary

- v3.2 P0/P1/P2 accepted and pushed；后续变化必须开启新的 bounded scope。
