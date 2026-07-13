# realtime-agent-cockpit-p0-b-data-truth-v0.1

[长工]#realtime-truth-ui@v0.1
⟦tag:v2|task|realtime-agent-cockpit-p0-b-data-truth-v0.1⟧

loop state: active
dispatch state: active
status: partial_accepted_renderer_truth_slice
acceptance: partial_accepted
date: 2026-07-13
priority: P0-B

## objective

把控制舱从“种子工位/模拟状态看起来在线”改成可追溯的实时真值投影。明确 configured、discovered、online、busy、degraded、offline、unknown 和 simulated，顶部 KPI、Agent 卡、详情和任务终态共享同一来源。

## must deliver

1. `AgentInstance` projection：展示身份与运行实例分离。
2. 在线数只统计 heartbeat 未过期的真实 Session；8 个 seeds 只显示“已配置工位”。
3. `sessionId/lastSeen/capabilities/source` 在 Agent 详情可读；缺失时显示 unknown，不填成功默认值。
4. 顶部 KPI 和卡片状态由同一 selector/projection 生成，禁止重复猜值。
5. 浏览器 fallback 醒目标记“模拟模式”；Connector run 保持 blocked。
6. Electron runtime unavailable、policy blocked、heartbeat stale、session lost、无能力信息有明确降级/空态。
7. taskId/sessionId/agentId/connectorId 可追踪，任务终态与 Session terminal event 一致。
8. 更新时间必须标明更新对象和 source，模拟 tick 不得文案化成“外部数据刚同步”。

## truth rules

- `AGENT_SEEDS.length` 只能计算 configured，不得计算 online。
- `status.json` 的 role/lane 状态只能标“编排控制面”，不得当 Agent 运行状态。
- CLI discovered 只显示“已发现命令”，不能显示 online/ready。
- online 要求非静态 source、sessionId 和 fresh lastSeen。
- heartbeat 5 秒内 fresh；15 秒 stale 后 degraded/offline，具体阈值从 runtime 合同读取。
- 无 runtime API 时使用 unknown/simulated，不保留上次真实在线数字。
- 颜色必须辅以文本/图标；source 与时间不可只放 tooltip。

## file fence

allowed:

- `src/App.tsx`
- `src/components/NiuMaWorkspace.tsx`
- `src/homepage/HomePage.tsx`
- `src/homepage/types.ts`
- `src/components/StatusStrip.tsx`
- `src/homepage/hooks/useHomePageData.ts` 仅同步首页指标的真实语义，避免继续把已配置工位称为在线
- `src/lib/agentInstanceProjection.ts`
- `scripts/check-agent-instance-projection.mjs`
- `src/index.css` 仅 data truth、simulation、degraded/unknown 所需规则
- `docs/orchestration/sessions/realtime-agent-cockpit-p0-b-progress-2026-07-13.md`

forbidden:

- `src/types.ts`
- `electron/**`
- `src/lib/desktopClient.ts`
- `src/lib/agentCore.ts`
- `src/ranch/**`
- `src/components/NiuMaAvatar.tsx`
- 现有 `@keyframes`、`icon/**`
- `package.json`、除 `scripts/check-agent-instance-projection.mjs` 外的 `scripts/**`
- `docs/orchestration/connectors.json` machine-gate
- `docs/orchestration/status.json` `connectors[]`

B 不得为绕过 A 的合同所有权复制第二套核心 runtime 类型。若 A 尚未冻结类型，B 可以先完成纯 selector/文案/状态矩阵，但必须把最终接线列为 incomplete。

## acceptance

| Scenario | Expected |
| --- | --- |
| 8 seeds，0 Session | 已配置工位=8，实时在线=0 |
| command discovered，无 Session | 显示已发现，在线仍为 0 |
| fresh real Session | online + source + lastSeen + sessionId 可追踪 |
| task running | busy=1，关联 task/session 一致 |
| heartbeat stale | 15 秒内转 degraded/offline，不继续显示 online |
| runtime unavailable | unknown/degraded，不显示旧成功值 |
| browser fallback | 全局 simulation 标识，任务/更新时间明确为模拟 |
| session lost | 任务不再 running，显示 lost reason |
| long source/error text | 1280x720 无水平滚动、无遮挡，详情可访问 |
| accessibility | 状态不只靠颜色，图标按钮有名称，焦点无隐藏项 |

quantitative:

- 假在线 0。
- 100% 顶部 KPI 和 Agent 详情可追溯 source/lastSeen/mode。
- 1280x720、1440x900、1920x1080：`scrollWidth == clientWidth`。
- 本地 runtime event 到 UI 可见 p95 <= 500ms（由 A/B 联合验收）。
- browser fallback 100% 显示 simulation，0 次外部 spawn。

## validation

```text
npm.cmd run orchestration:check
npm.cmd run orchestration:report
npm.cmd run orchestration:preflight
npm.cmd run orchestration:connector-safety
npm.cmd run lint
npm.cmd run build
git diff --check
```

## failure handling

- A 类型未冻结：不改共享文件，不复制合同，回报接线 blocker。
- 无法证明 source：显示 unknown/simulated。
- KPI 与详情不一致：不进入验收，统一 selector 后重测。
- 任何 connector machine-gate 漂移：停止并单独上报。

## callback

```text
completed: AgentInstance selector、5s/15s freshness、terminal/duplicate/session 因果规则、App runtime snapshot 订阅与 1s tick、首页/控制舱 configured-vs-online/source/session 真值接线；browser fallback 0 online。
incomplete: 尚未完成独立 SSR/DOM fresh-stale-session-lost fixture；未做真实 Electron Agent session E2E；不宣称完整 P0-B accepted。
blockers: 无代码门禁 blocker；真实 session/heartbeat 仍受 P0-C 授权与 production authorizer 缺失约束。
next action: PM 保留浏览器 fallback 证据，补 renderer state-matrix fixture 后再决定是否把 P0-B 标为 accepted。
evidence: node scripts/check-agent-instance-projection.mjs；1280x720/1440x900 DOM+边界复核；npm.cmd run lint/build/orchestration:check/report/preflight/connector-safety；git diff --check。
```

必须提供状态矩阵截图/DOM 数值、source/lastSeen 样本、viewport 结果和 git diff 文件清单。不得 stage/commit/push/reset/clean，不得自报 accepted。
