# 桌面牧场

桌面牧场（项目代号 `multi-agent-niuma`）从 `E:\个人服务导航面板` 的多 agent 控制舱拆出，通过 Electron 主进程 IPC + `child_process.spawn` 打通本地真实进程管道，表情/动作 = 真实任务执行状态的实时映射。**8 只牛马在桌面右下角默默干活，状态由控制舱实时同步。**

## 4 大核心价值

1. **极强的情绪共鸣（"牛马"黑话）** — Emoji 动画 + 黑话台词 + 性格差异，让枯燥的 agent 监控变成"云养宠物 / 电子斗蛐蛐"的解压体验。
2. **一眼即知的直观状态（无脑可视化）** — 余光扫一眼：🚨 剧烈抖动 = 崩溃，🌴 惬意晃动 = 摸鱼，不用翻日志。
3. **真实打通的技术壁垒（非花架子）** — 通过 Electron 主进程 `child_process.spawn` 打通本地真实进程管道，桌面牧场/控制舱的表情与动作 = **真实任务执行状态的实时映射**（[状态打通方案](docs/真实生产环境状态打通与牛马表情联动方案.md)）。
4. **干净克制的桌面陪伴（无负担）** — desktop widget 形态，常驻桌面右下角，圈外透明穿透，不抢焦点不干扰工作。

## 当前范围

- Electron 桌面壳：窗口、托盘、隐藏到托盘、退出菜单。
- React 控制舱：8 个 agent 工位、牛马状态、交互按钮、任务队列和日志终端。
- 桌面牧场：640×360 圈养 widget，8 只动物在桌面右下角活物感（[桌面牧场需求 v0.3](docs/桌面牧场需求-v0.3.md)）。
- 本地持久化：数据写入 Electron `userData/agent-data/agents.json`；牧场偏好写入 `ranch-prefs.json`。
- **真实任务执行**（**P0 推进中**，见 [ranch-real-integration-p0](docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md)）：IPC handler 接 `child_process.spawn`，exitCode → success/error，状态联动到桌面牧场表情；真实 spawn 失败时回退到**模拟 runner fallback**（任务自动推进进度并写日志）。

## 命令

```bash
npm install
npm run dev
npm run build
npm start
```

`npm run dev` 会启动 Vite renderer 和 Electron 窗口。`npm run build` 会生成 `dist/` 与 `dist-electron/`。

## P0 路线图（2026-07-03 拍板）

| 优先级 | 主题 | 任务卡 |
|---|---|---|
| **P0** | 真实打通（IPC 接 spawn + exitCode + 状态映射）| [ranch-real-integration-p0](docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md) |
| **P0** | 主页面优化（控制舱重构 v3.0 收口 + 4 根因解决）| [cockpit-refactor-p0](docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md) |
| P1 | 控制台 UI 清理（桌面牧场 v0.3 偏离文档对齐）| [桌面牧场需求 v0.3 修订说明](docs/桌面牧场需求-v0.3-修订说明-2026-07-03.md) |
| P2 | 接外部 agent CLI（codex / trae / qoder / openclaw）| v0.4+ 规划 |

## 配套文档

- **产品需求**：[桌面牧场需求 v0.3](docs/桌面牧场需求-v0.3.md) — 桌面牧场产品需求的唯一对外来源
- **工程实施**：[桌面牧场工程需求 v0.2](docs/桌面牧场工程需求-v0.2.md) — 数据 + IPC + FR + 验收命令
- **开发计划**：[桌面牧场开发计划 v0.2](docs/桌面牧场开发计划-v0.2.md) — M0~M5 milestone
- **控制舱重构**：[主页面重构方案 v3.0-控制舱收口](docs/主页面重构方案-v3.0-控制舱收口.md) — 4 份原方案收口版
- **状态打通**：[真实生产环境状态打通与牛马表情联动方案](docs/真实生产环境状态打通与牛马表情联动方案.md)
- **v0.3 修订**：[桌面牧场需求 v0.3 修订说明 2026-07-03](docs/桌面牧场需求-v0.3-修订说明-2026-07-03.md) — 7 个偏离的文档契约

## 后续扩展位置

- **真实 spawn 入口**：`electron/main.ts` `agents:create-task` handler（R0-1 实施）
- **状态映射函数**：`src/lib/agentCore.ts` 新增 `getNiuMaEffectiveStatus`（R0-2 实施）
- **外部 agent CLI 接入**：`docs/orchestration/connectors.json` + 主进程 connector gate（v0.4+）
