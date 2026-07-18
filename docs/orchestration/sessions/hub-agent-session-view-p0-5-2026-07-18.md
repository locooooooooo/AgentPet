# Hub Agent Session View P0.5 - 2026-07-18

[PM]#hub-agent-session-view-p0-5@v0.1
⟦tag:v2|session|hub-agent-session-view-p0-5-2026-07-18⟧

loop state: standby
dispatch state: standby
status: implemented_click_verified
date: 2026-07-18
priority: P0.5

## delivered

- Windows 宿主注册新增 Trae `ByteDance.Trae` 与 WorkBuddy `WorkBuddy.WorkBuddy` 固定 AppID。
- Trae/WorkBuddy 进入统一 `not-installed / stopped / idle / working` 生命周期和 launch/focus 白名单。
- 新增 `AgentSession` 只读投影，统一 Codex Desktop 与 Connector Runtime，保留 source/status/updatedAt/taskId/workspace 元数据。
- Inspector 默认展示 `Sessions`，随工位选择切换，并提供列表、详情、真实空态与宿主打开/聚焦动作。
- 打包 smoke 自动选择最新时间戳包，滚动目标进入视口后再发送真实鼠标事件。

## live packaged evidence

- 新包：`release/desktop-ranch-win-unpacked-20260718-185300/桌面牧场.exe`。
- Trae：最终包从 stopped 冷启动到 idle，回执 `4384.5ms`。
- WorkBuddy：最终包聚焦回执 `153.8ms`，状态 `idle`。
- Trae Session：`0`，显示真实空态。
- WorkBuddy Session：`0`，显示真实空态。
- Codex Session：`8`，来源全部为 `codex-desktop`，最终回放为 `4 working / 4 idle`。
- OpenClaw：`not-requested`，没有触发安装或向导。

## verification

- `npm.cmd run realtime:truth-check`: pass。
- `npm.cmd run lint`: pass。
- `npm.cmd run build`: pass。
- `npm.cmd run orchestration:check`: pass。
- `npm.cmd run orchestration:preflight`: pass。
- `npm.cmd run orchestration:connector-safety`: pass；外部 Agent CLI execution 未发生。
- `npm.cmd run realtime:packaged-smoke`: pass；真实打包 Electron DOM 点击与状态回流通过。
- 包内 `main.cjs` / `preload.cjs` 哈希与当前构建一致。
- `git diff --check`: pass。

## residual risk

- 真实 Electron 屏幕截图仍受 `SetIsBorderRequired failed (0x80004002)` 阻塞；本轮有打包窗口真实点击与 DOM 状态证据，但没有新的截图证据。
- 完整 DockView D0-D4 尚未实现；下一阶段必须单独建立架构探针、依赖与文件围栏。
- Trae/WorkBuddy 没有已接受的结构化本地 Session API，因此只有 Connector Runtime 产生任务时才会出现对应 Session。
