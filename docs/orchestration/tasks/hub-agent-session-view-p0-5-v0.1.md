# Hub Agent Session View P0.5 v0.1

[PM]#hub-agent-session-view-p0-5@v0.1
⟦tag:v2|task|hub-agent-session-view-p0-5-v0.1⟧

loop state: standby
dispatch state: standby
status: implemented_click_verified
date: 2026-07-18
priority: P0.5

## single goal

让用户选择 Trae、WorkBuddy、Codex 或其他工位后，在控制舱 Inspector 中看到该 Agent 的真实 Session 列表；只有宿主进程时显示空态，不把“应用已打开”伪装成 Session。

## user outcomes

1. Trae 与 WorkBuddy 进入统一 Windows 安装、运行、idle/working 与打开/聚焦生命周期。
2. Inspector 默认打开 `Sessions` 页，随当前 Agent 选择切换。
3. Codex Desktop 生命周期 Session 与 Connector Runtime Session 进入统一只读投影，同时保留来源。
4. Session 行显示状态、标题、更新时间、来源与稳定 ID；点击行可查看详情。
5. 没有结构化证据时显示“未观察到 Session”，并明确宿主进程不计 Session。

## truth boundary

- Session 来源只允许 `codex-desktop` 与 `connector-runtime`。
- `host-process` 只能建立 installed/running 事实，不生成 Session。
- 不读取对话正文，不向 renderer 暴露进程路径、命令行或窗口标题。
- 不修改 Connector machine gate，不把桌面应用启动解释为 headless Connector acceptance。

## implementation fence

- `electron/agentHostDiscovery.ts`
- `electron/agentHostActions.ts`
- `src/lib/agentInstanceProjection.ts`
- `src/lib/agentSessionProjection.ts`
- `src/components/NiuMaWorkspace.tsx`
- `src/index.css`
- `scripts/check-agent-host-discovery.mjs`
- `scripts/check-agent-host-actions.mjs`
- `scripts/check-agent-session-projection.mjs`
- `scripts/check-realtime-truth-renderer.mjs`
- `scripts/smoke-packaged-agent-lifecycle.mjs`
- `package.json`

## acceptance

- Trae/WorkBuddy 固定 AppID、精确进程名、stopped/idle 与 launch/focus fixture 通过。
- Codex Desktop 与 Connector Runtime Session 映射、排序和状态映射通过。
- WorkBuddy 只有宿主进程时 Session 列表必须为空。
- 打包版真实点击 Trae、WorkBuddy 与 Codex 后，Inspector 不串 Agent 数据。
- `realtime:truth-check`、`lint`、`build`、治理门禁与 `git diff --check` 通过。

## excluded

- 本卡不是完整 DockView：不包含自由停靠、拖放、布局持久化、档案、多实例或 Electron 原生弹窗。
- OpenClaw 官方向导仍需用户显式交互，本卡不自动接受风险或配置认证。
