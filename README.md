# 牛马 Hub（多 Agent 牛马场）

牛马 Hub（项目代号 `multi-agent-niuma`）是一个**本地优先的多 Agent 安装、运行与协作中枢**。它把散落在电脑里的 Codex、Trae、Qoder、OpenCode、OpenClaw 等 Agent 收进统一入口，并用同一套任务、Session、日志、权限和调度真值协调工作。

牛马场仍是产品最鲜明的特色：**每只牛马对应一个真实 Agent 或 Agent 实例，动作、表情、台词和音效由控制舱实时同步。** 完整定位与首期边界见 [牛马 Hub 项目定位 v1.0](docs/牛马Hub项目定位-v1.0-2026-07-17.md)。

## 5 大核心价值

1. **统一 Agent 生命周期** — 在一个 Hub 中发现、安装、检测、启动、聚焦和管理多个 Agent，明确区分“已收录、已安装、可启动、可接入、可协调”。
2. **多 Agent 协调核心** — 通过 Connector Runtime 与本地 scheduler 统一 Session、依赖、并发、取消、重试、日志和审计，而不是只做应用启动器。
3. **真实状态的牛马场** — 牛马动作、表情、通知和音效只映射真实任务状态；余光扫一眼就知道谁在干活、等待、完成或报错。
4. **可定制的工作氛围** — Hub 原生支持可预览、切换、导入和恢复的皮肤与音效包，同时保留安静模式和无障碍边界。
5. **本地优先与安全可控** — 安装来源、外部命令、工作目录、环境变量和写操作均显式授权、可审计、可降级、可恢复。

## 当前产品状态

- 已有启动首页：App 第一屏进入 HomePage，展示 8 个 Agent 概览、控制舱入口和关键指标；后续将演进为 Hub 总览。
- Electron 桌面壳：窗口、托盘、隐藏到托盘、退出菜单。
- React 控制舱：8 个 agent 工位、牛马状态、交互按钮、任务队列和日志终端。
- 桌面牧场：640×360 圈养 widget，8 只动物在桌面右下角活物感（[桌面牧场需求 v0.3](docs/桌面牧场需求-v0.3.md)）。
- 本地持久化：数据写入 Electron `userData/agent-data/agents.json`；牧场偏好写入 `ranch-prefs.json`。
- 已有 Connector gate/runtime、AgentInstance 真值投影、本地 scheduler 与进程恢复基础；当前 Agent 机器门仍以 `docs/orchestration/connectors.json` 为准。
- R0 已形成 `AgentManifest + InstallPlan`、Adapter Capability、`HubTheme` 与 `HubSoundPack` 版本化合同；Agent Library、自动下载安装闭环和 R3 主题/音效导入切换仍未实现，README 不把合同写成产品能力。

## 命令

```bash
npm install
npm run dev
npm run build
npm start
```

`npm run dev` 会启动 Vite renderer 和 Electron 窗口。`npm run build` 会生成 `dist/` 与 `dist-electron/`。

## 启动流程

```text
npm run dev
  -> HomePage 首页（当前入口；目标演进为 Hub 总览）
  -> 进控制舱
  -> 桌面牧场 · 控制舱（8 工位矩阵 / 派活 / 队列 / 日志）
  -> 返回首页
```

首页是 `homepage-ui-p0` 的 C · 华丽方案落地结果；控制舱中央 4×2 牛马工位和 `NiuMaAvatar` 动效仍按卖点保护契约保持独立。新定位不会自动开启任何外部 Agent 执行门。

## Hub 演进路线（2026-07-17 重定位）

| 阶段 | 主题 | 交付标准 |
|---|---|---|
| **R0** | 定位与合同 | 固化六级支持状态及 `AgentManifest`、Adapter、主题包、音效包合同 |
| **R1** | Agent Library 与生命周期 | 至少 3 个 Agent 完成可信发现、安装/引导、检测和启动闭环 |
| **R2** | 多 Agent 协作 | 至少 2 个 Headless Agent 完成真实、可取消、可审计的依赖工作流 |
| **R3** | 个性化 | Hub 原生主题/音效包支持预览、切换、导入、恢复与坏包回退 |
| **R4** | 生态扩展 | Adapter SDK、审核与分享机制；不开放任意脚本执行 |

## 配套文档

- **项目定位**：[牛马 Hub 项目定位 v1.0](docs/牛马Hub项目定位-v1.0-2026-07-17.md) — 产品北极星、能力分级、MVP 与演进边界
- **下一阶段需求与目标**：[牛马 Hub 下一阶段需求与目标 v0.1](docs/牛马Hub下一阶段需求与目标-v0.1-2026-07-18.md) — 3 Agent 生命周期、2 Headless Agent、真实依赖工作流与阶段退出条件
- **牧场子产品需求**：[桌面牧场需求 v0.3](docs/桌面牧场需求-v0.3.md) — 牛马场状态空间的产品需求来源
- **工程实施**：[桌面牧场工程需求 v0.2](docs/桌面牧场工程需求-v0.2.md) — 数据 + IPC + FR + 验收命令
- **开发计划**：[桌面牧场开发计划 v0.2](docs/桌面牧场开发计划-v0.2.md) — M0~M5 milestone
- **状态回执音效**：[牛马状态回执音效规范 v0.1](docs/牛马状态回执音效规范-v0.1.md) — 8 个 Agent 的状态语义音、身份尾音、防打扰与验收契约
- **HubTheme 合同**：[牛马 Hub HubTheme 合同 v0.1](docs/牛马Hub-HubTheme合同-v0.1.md) — 声明式主题 schema、完整性、预览事务与坏包回滚
- **HubSoundPack 合同**：[牛马 Hub HubSoundPack 合同 v0.1](docs/牛马Hub-HubSoundPack合同-v0.1.md) — 事件语义音、身份尾音、策略优先级、去重与许可边界
- **控制舱自由布局**：[控制舱 DockView 自定义布局与多窗口需求 v0.1](docs/控制舱DockView自定义布局与多窗口需求-v0.1-2026-07-17.md) — 模块停靠、分组、多实例、布局持久化与 Electron 多窗口契约
- **控制舱重构**：[主页面重构方案 v3.0-控制舱收口](docs/主页面重构方案-v3.0-控制舱收口.md) — 4 份原方案收口版
- **状态打通**：[真实生产环境状态打通与牛马表情联动方案](docs/真实生产环境状态打通与牛马表情联动方案.md)
- **v0.3 修订**：[桌面牧场需求 v0.3 修订说明 2026-07-03](docs/桌面牧场需求-v0.3-修订说明-2026-07-03.md) — 7 个偏离的文档契约

## 后续扩展位置

- **Agent Library / 安装计划**：[AgentManifest 与 InstallPlan 合同](docs/牛马Hub-AgentManifest与InstallPlan合同-v0.1.md) 已冻结；产品实现待 R1
- **真实 spawn 入口**：`electron/main.ts` `agents:create-task` handler（R0-1 实施）
- **状态映射函数**：`src/lib/agentCore.ts` 新增 `getNiuMaEffectiveStatus`（R0-2 实施）
- **外部 Agent 接入**：`docs/orchestration/connectors.json` + 主进程 Connector gate/runtime
- **Hub 原生皮肤 / 音效包**：R0 合同已冻结；预览、切换、导入、恢复与坏包回退待 R3 实现
