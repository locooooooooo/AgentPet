# Hub Agent Lifecycle P0 v0.1

[PM]#hub-agent-lifecycle-p0@v0.1
⟦tag:v2|task|hub-agent-lifecycle-p0-v0.1⟧

loop state: standby
dispatch state: standby
status: action_smoke_and_screenshot_verified
date: 2026-07-18
priority: P0

## single goal

让牛马 Hub 对本机 Agent 的安装、启动与任务状态给出真实可操作反馈：未安装可进入一键安装，已安装未启动可打开，已运行无任务显示 idle，真实任务运行时显示 working。

## P0 user outcomes

1. OpenClaw 未安装时显示“安装 OpenClaw”；CLI 已安装但 Gateway 服务缺失时显示“安装服务”，进入官方安装/初始化流程。
2. Qoder 已安装但未运行时显示“打开 Qoder”；运行后切换为“聚焦 Qoder”。
3. Codex Desktop 已开启时同步本机会话生命周期；有 active turn 显示 working，无 active turn 显示 idle。
4. MiniMax Code 已运行但没有 Hub 任务时显示 `idle · 暂无任务`，头像使用 idle 动画，不再套用随机“废话周会”状态。
5. 所有安装/启动动作只能来自 Electron 主窗口，且只允许固定 Agent ID、固定动作和固定本机入口。

## truth model

- `installed`、`serviceInstalled`、`running` 与 `state` 是独立事实。
- 状态空间固定为 `not-installed | stopped | idle | working`。
- 进程存在只建立应用运行事实，不建立 Session、online、busy 或任务成功事实。
- `working` 只能由受控 Connector Runtime 的活跃任务或 Codex Desktop 的 active turn 建立。
- OpenClaw 安装不静默传入 `--accept-risk` 或 `--non-interactive`；官方风险确认与认证配置必须由用户完成。

## implementation fence

- `src/types.ts`
- `electron/agentHostDiscovery.ts`
- `electron/agentHostActions.ts`
- `electron/main.ts`
- `electron/preload.ts`
- `src/App.tsx`
- `src/lib/agentInstanceProjection.ts`
- `src/lib/desktopClient.ts`
- `src/lib/niuMaAnimations.ts`
- `src/components/NiuMaWorkspace.tsx`
- `src/index.css`
- `scripts/check-agent-host-discovery.mjs`
- `scripts/check-agent-host-actions.mjs`
- `scripts/check-realtime-truth-renderer.mjs`
- `package.json`

## protected boundaries

- 不修改 `docs/orchestration/connectors.json` 或 Connector machine gate。
- 不把 Qoder Desktop 启动能力解释为 Qoder headless Connector acceptance。
- 不运行外部 Agent prompt，不读取会话正文，不向 renderer 暴露可执行路径、命令行或窗口标题。
- 不自动点击安装、启动或聚焦；这些动作只在用户点击对应按钮后发生。

## acceptance

- Qoder `installed/stopped -> launch`、MiniMax `running/idle -> focus`、OpenClaw `CLI installed/service missing -> install` fixture 通过。
- OpenClaw 完全未安装、服务已安装未启动和运行中状态均有确定动作映射。
- Codex working/idle 继续由生命周期日志建立，不读取对话正文。
- MiniMax idle 卡片文案与 idle 头像状态同时出现。
- 非白名单或过期动作 fail closed。
- `npm.cmd run realtime:truth-check`、`npm.cmd run lint`、`npm.cmd run build` 与 `git diff --check` 通过。
- 打包版 Qoder 固定入口动作、OpenClaw 官方向导打开动作与 Electron CDP 截图通过；OpenClaw 风险确认和认证仍由用户在可见终端完成。
