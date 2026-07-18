# Hub Agent Lifecycle P0 - 2026-07-18

[PM]#hub-agent-lifecycle-p0@v0.1
⟦tag:v2|session|hub-agent-lifecycle-p0-2026-07-18⟧

loop state: standby
dispatch state: standby
status: action_smoke_and_screenshot_verified
date: 2026-07-18
priority: P0

## delivered

- 新增统一宿主生命周期事实：`not-installed / stopped / idle / working`。
- Windows 探针同时识别应用注册、进程、OpenClaw CLI 与 `OpenClaw Gateway` 服务注册状态。
- Qoder / MiniMax 使用固定 Windows AppID 打开或聚焦；OpenClaw 使用固定官方 CLI 安装、初始化和 Gateway start 命令。
- Codex 继续同步真实 Session turn 生命周期；renderer 用 `observedStatus` 覆盖个性模拟，避免 MiniMax idle 被渲染为 meeting。
- 卡片新增安装、启动、聚焦按钮、执行反馈和失败回显；没有扩展任意命令执行面。

## live machine evidence

2026-07-18 本机只读探针观察到：

- Qoder：`installed=true`、`running=false`、`state=stopped`、`primaryAction=launch`。
- MiniMax Code：`installed=true`、`running=true`、`processCount=5`、`state=idle`、`primaryAction=focus`。
- OpenClaw：CLI `2026.4.11` 已安装，Gateway Scheduled Task/Startup service 未安装，`state=stopped`、`primaryAction=install`。
- Codex Desktop：生命周期监控可见 3 个 active sessions；浏览器预览控制舱显示 `Codex Desktop 同步中 · 3 活动对话`。

## verification

- `npm.cmd run realtime:truth-check`: pass；新增 discovery、action safety、MiniMax idle animation 和 OpenClaw service-missing DOM assertions。
- `npm.cmd run lint`: pass。
- `npm.cmd run build`: pass。
- 1280x720 控制舱回放：8 张卡片均无横向/纵向内容溢出，页面无横向溢出。
- 固定动作检查确认没有 `shell: true`，没有静默 `--accept-risk` / `--non-interactive`，过期动作 fail closed。
- 最终打包 Electron 通过 CDP `Page.captureScreenshot` 生成 `hub-agent-lifecycle-p0-electron-2026-07-18.png`（225990 bytes，1204×795），绕过 `SetIsBorderRequired`；稳定态页面、详情和 Session Tab 横向 overflow 均为 `0`，截图人工审查无重叠或不可达控件。
- 打包版真实点击回执：Trae stopped->launch->idle `4384.5ms`、WorkBuddy focus `153.8ms`、Qoder focus `192.7ms`；Qoder stopped->launch 由固定 AppID fixture 覆盖，当前运行中状态不为制造冷启动证据而强制退出用户应用。
- OpenClaw 卡片“安装服务”已真实点击并返回 `official-wizard-started`；随后用同一固定命令打开独立可见终端，PID `40732`，未自动接受风险或配置认证。

## incomplete

- OpenClaw 首次初始化需要用户确认风险并选择认证方式；Hub 不代填凭据或接受条款。
- Qoder 仍没有已接受的 headless API；本 P0 只管理桌面应用生命周期，不改变 Connector rejected/disabled 状态。

## next action

1. 用户在已打开的 OpenClaw 可见终端完成风险确认与认证；完成后确认 Gateway 从 service-missing 切换到 stopped/launch，再到 idle。
2. Qoder、OpenClaw headless Connector acceptance 继续走独立 gate，不由桌面生命周期动作推导。
