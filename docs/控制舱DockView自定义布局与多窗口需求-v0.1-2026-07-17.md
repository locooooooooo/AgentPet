# 控制舱 DockView 自定义布局与多窗口需求 v0.1

> 日期：2026-07-17
>
> 状态：`requirements_ready / implementation_not_started`
>
> 需求来源：控制舱当前截图与用户新增要求
>
> 适用范围：桌面牧场控制舱主窗口及其 Electron 子窗口
>
> 关联基线：控制舱 v3.x 已验收布局、实时 Agent 真值、牛马状态回执音效规范 v0.1

## 1. 结论先行

控制舱需要从固定三栏页面升级为 **可编排工作台**：除最小应用框架外，每个长期存在的业务模块都注册为独立 DockView Panel，用户可以拖动、停靠、分组、拆分、缩放、浮动、关闭和重新打开，并能保存自己的布局。

本需求中的“多窗口”分为两层：

1. **窗口内多视图**：同一个控制舱窗口内可同时存在多个标签组、水平/垂直分区和浮动面板。
2. **Electron 原生多窗口**：面板或面板组可以弹出为独立 `BrowserWindow`，并与主窗口共享同一份 Agent、任务、Connector 和通知真值。

核心原则：**布局可以自由，业务真值只能有一份。** 拖动面板不得复制任务、重复订阅副作用、改变 Connector 权限或导致同一状态回执重复响铃。

## 2. 目标与非目标

### 2.1 用户目标

- 用户可以按自己的工作习惯重新排列控制舱，而不是被固定左/中/右比例限制。
- 用户可以同时打开多个 Agent 详情、任务队列或日志视图，进行并排比较。
- 用户可以把高频模块留在主窗口，把日志、治理或某个 Agent 详情弹到第二显示器。
- 用户关闭并重启应用后，布局、面板实例和外部窗口位置能够恢复。
- 布局改乱后，用户可以一键回到稳定的默认布局。

### 2.2 本轮不等同于

- 不是旧需求里的“把任务卡拖到牛马工位进行派活”。
- 不是允许任意 DOM 卡片单独漂浮；DockView 的边界是有业务含义的模块。
- 不是插件系统，不允许渲染层加载任意 URL、脚本或未登记组件。
- 不是重写 Agent 真值、任务 runner、Connector gate 或桌面牧场窗口。
- 不是让每个窗口拥有独立业务数据副本；所有窗口只消费主进程拥有的统一真值。

## 3. 当前基线

| 项目 | 当前事实 | 新需求缺口 |
| --- | --- | --- |
| 主体布局 | `NiuMaWorkspace` 使用固定 CSS Grid 左/中/右三栏 | 只能折叠左右栏，不能换位、分组或保存布局 |
| 中央区域 | 牛马工位矩阵上方集中，剩余空间由固定容器占据 | 日志、队列等不能利用中央空余区域 |
| Operator | Agent 详情内嵌“下发任务 / 任务队列 / 流式日志”Tab | 三者不能拆开并排，也不能各自弹窗 |
| 治理区 | 治理摘要与完整角色/Lane 登记都绑定左轨 | 无法按需放到大窗口或第二显示器 |
| 桌面窗口 | Electron 当前有一个控制舱 `mainWindow` 和一个牧场 `ranchWindow` | 没有控制舱 Panel 子窗口注册、恢复和清理机制 |
| 数据同步 | `AgentSnapshot`、Connector runtime、Codex Host 已由主进程向全部窗口广播 | 已具备多窗口真值分发基础，但缺少 Panel surface 路由 |
| 布局持久化 | 只持久化牧场窗口偏好 | 没有控制舱布局 schema、迁移、坏数据回退 |
| 布局依赖 | 当前未引入 docking layout manager | 需要建立可替换的 DockView 适配层 |

截图所示界面作为第一份默认布局的视觉基线保留，不因引入 DockView 而丢失熟悉的“左治理、中工位、右操作”路径。

## 4. 术语

| 术语 | 定义 |
| --- | --- |
| Module | 有稳定职责、数据输入和生命周期的业务模块 |
| Panel | Module 的一个可渲染实例，拥有唯一 `panelId` |
| Group | 一个标签组；同组 Panel 以 Tab 切换 |
| Dock | Panel/Group 停靠到目标的上、下、左、右或中心标签区 |
| In-window floating | 仍在当前渲染窗口内的浮动 Group，不是系统窗口 |
| Pop-out window | 由 Electron 主进程创建的独立 `BrowserWindow` |
| Layout profile | 用户保存的一套 Panel、分组、尺寸和窗口位置配置 |
| Follow selection | Panel 跟随全局当前 Agent 切换 |
| Pinned instance | Panel 固定展示指定 `agentId/sessionId`，不跟随全局选择 |

## 5. 固定框架与可停靠边界

### 5.1 保持固定的最小应用框架

以下内容不作为可拖动 Panel：

- 窗口标题/品牌、返回首页和窗口控制。
- 布局工具入口：模块库、保存布局、锁定布局、恢复默认。
- 全局临时层：拖放指示、菜单、确认对话框、权限对话框和瞬时 Toast。
- 无障碍焦点跳转与全局错误兜底。

固定框架只承担“管理工作台”的职责，不继续承载大块业务内容。

### 5.2 第一版模块注册表

| Module ID | 模块 | 实例策略 | 默认区域 | 最小建议尺寸 |
| --- | --- | --- | --- | --- |
| `overview.kpis` | 已配置工位、在线 Session、策略阻塞 KPI | singleton | 顶部 | `520×92` |
| `connectors.status` | Connector 策略、最近事件与状态详情 | singleton | 顶部 | `420×110` |
| `governance.summary` | 阻塞摘要、治理状态 | singleton | 左侧 | `240×180` |
| `governance.registry` | 角色/Lane 搜索、过滤与登记详情 | singleton | 左侧 Tab | `300×360` |
| `agents.workstations` | 牛马工位矩阵 | singleton | 中央主区 | `680×360` |
| `agent.inspector` | Agent 身份、Session、指标与状态详情 | multi，按 `agentId` 固定 | 右侧 | `320×300` |
| `tasks.dispatch` | 下发任务与快捷任务 | multi，按 `agentId/draftId` | 右侧 Tab | `340×360` |
| `tasks.queue` | 任务队列，可按 Agent/状态过滤 | multi，按 `filterKey` | 右侧或底部 Tab | `360×280` |
| `runtime.logs` | Session/任务流式日志 | multi，按 `sessionId/taskId` | 右侧或底部 Tab | `440×260` |
| `status.details` | 本地快照、在线 Session、Codex Host、治理登记详情 | singleton | 底部 | `480×180` |
| `ranch.settings` | 桌面牧场模式、性格档和通知偏好 | singleton | 按需打开 | `340×300` |

规则：

- `singleton` 模块重复打开时激活已有 Panel，不创建副本。
- `multi` 模块允许多个实例，但同一个稳定实例键不得重复创建。
- 牛马矩阵作为一个完整模块迁移；不把 8 张 AgentCard 各自变成 DockView。
- `tasks.dispatch`、`tasks.queue`、`runtime.logs` 从当前 Operator 内部 Tab 拆成真正独立 Panel，仍可重新停靠为同一标签组。
- 每个 Panel 必须独立处理 loading、empty、error 和 unavailable，不能依赖相邻 Panel 才能解释状态。

## 6. 默认布局

默认布局延续现有认知，同时释放中央下半区：

```text
┌──────────────── 固定应用框架 / 布局工具 ────────────────┐
├──────────── overview.kpis ────────┬─ connectors.status ┤
├──────────────┬────────────────────┬────────────────────┤
│ governance   │ agents.workstations│ agent.inspector    │
│ .summary     │                    │ tasks.dispatch     │
│ .registry    │                    │ tasks.queue        │
│              ├────────────────────┤ runtime.logs       │
│              │ status.details     │ （右侧 Tab 组）     │
└──────────────┴────────────────────┴────────────────────┘
```

默认尺寸只作为首启和恢复默认的起点。用户完成第一次拖动后，以用户布局为准，不再被响应式逻辑强行改回三栏。

## 7. 核心交互需求

### 7.1 拖动与停靠

- 只有 Panel Tab、标题栏或明确拖动把手可以开始拖动，表单、日志选择和滚动区域不能误触拖拽。
- 拖动时显示中心合并、上/下/左/右拆分、浮动和可弹出窗口目标。
- 放到 Group 中心时形成 Tab；放到边缘时形成水平或垂直 Split。
- Group Splitter 可拖动调整比例，并遵守每个 Panel 的最小尺寸。
- Panel 可重排 Tab、最大化当前 Group、关闭、重新打开和移动到其他 Group。
- 布局锁定后禁止拖动、拆分和缩放，但 Panel 内业务操作保持可用。

### 7.2 模块库与恢复

- 固定框架提供模块库，展示已打开和可打开模块。
- 关闭 Panel 只关闭视图，不停止任务、不终止 Session、不改变 Agent 状态。
- singleton 关闭后可从模块库重新打开。
- multi 模块从 Agent、任务或 Session 的上下文动作创建，并带入稳定实例键。
- 提供“撤销最近一次布局变更”和“恢复默认布局”；恢复默认前应确认，但不清理业务数据。

### 7.3 多实例行为

- `agent.inspector` 默认可跟随全局 Agent 选择，也可钉住为某个 Agent 的独立实例。
- `runtime.logs` 必须固定到明确 `sessionId/taskId`；对象不存在时显示终态/已失效，不自动跳到别的日志。
- 两个 `tasks.dispatch` Panel 可以保留各自草稿，但真正提交仍走同一主进程授权与调度合同。
- Panel 标题必须包含足以区分实例的短标签，例如 `日志 · Codex · task-42`。

### 7.4 键盘与非拖拽路径

- 所有拖动结果都必须在 Panel 菜单提供等价命令：移到左/右/上/下、新建标签组、弹出窗口、移回主窗口。
- 键盘可以在 Group、Tab 与 Panel 内容之间循环，激活后焦点进入 Panel 主区。
- 拖动预览、激活态和键盘焦点不能只靠颜色表达。

## 8. 布局配置与持久化

### 8.1 布局档案

第一版内置以下只读预设，用户可基于预设另存为自定义档案：

| 预设 | 重点 |
| --- | --- |
| `默认总览` | 延续当前左治理、中工位、右操作 |
| `单牛马处置` | Agent 详情、派活、队列和日志占主要区域 |
| `多牛马监控` | 工位矩阵 + 多个固定 Agent/日志实例 |
| `治理审查` | 治理登记、状态详情和 Connector 证据占主要区域 |

要求：

- 布局变更后 `400ms` debounce 自动保存。
- 用户可命名、复制、切换和删除自定义档案；内置预设不可覆盖。
- Electron 保存到 `app.getPath('userData')/cockpit-layouts.json`。
- 浏览器 fallback 可用 `localStorage` 保存窗口内布局，但不得伪装成 Electron 多窗口恢复。
- 文件写入采用临时文件 + 原子替换，并保留一份 last-known-good。
- schema 校验或迁移失败时回退到默认布局，保留坏文件副本并显示一次可恢复提示。

### 8.2 推荐数据合同

```ts
type CockpitModuleId =
  | 'overview.kpis'
  | 'connectors.status'
  | 'governance.summary'
  | 'governance.registry'
  | 'agents.workstations'
  | 'agent.inspector'
  | 'tasks.dispatch'
  | 'tasks.queue'
  | 'runtime.logs'
  | 'status.details'
  | 'ranch.settings';

interface CockpitPanelDescriptor {
  panelId: string;
  moduleId: CockpitModuleId;
  instanceKey?: string;
  params: Record<string, string | number | boolean | null>;
}

interface CockpitNativeWindowState {
  windowId: string;
  displayId?: string;
  bounds: { x: number; y: number; width: number; height: number };
  maximized: boolean;
  dockviewLayout: unknown;
}

interface CockpitLayoutDocument {
  schemaVersion: 1;
  activeProfileId: string;
  updatedAt: string;
  mainDockviewLayout: unknown;
  panels: CockpitPanelDescriptor[];
  windows: CockpitNativeWindowState[];
}
```

`dockviewLayout` 必须包在项目自己的版本化合同内，不能把第三方序列化结果直接当永久数据格式。布局文件只保存视图结构和允许的 Panel 参数，不保存 Agent 真值、任务结果、日志正文、授权 grant 或凭据。

## 9. 技术架构决策

### 9.1 DockView 选择

第一选择为 `dockview-react@7.0.2`：

- MIT License。
- peer dependency 已覆盖 React 19。
- 提供 tabs、groups、split/grid、drag-and-drop、floating groups、popout groups、state save/load 和键盘能力。
- 与当前 React + TypeScript + Electron 技术栈一致，不需要原生模块。

实现时不得让业务组件直接依赖第三方 API。建议增加：

```text
src/cockpit/layout/
  CockpitDockHost.tsx
  cockpitModuleRegistry.tsx
  cockpitLayoutAdapter.ts
  cockpitLayoutStore.ts
  cockpitLayoutDefaults.ts
  cockpitPanelErrorBoundary.tsx
```

`cockpitLayoutAdapter` 隔离 Dockview 的创建、事件和序列化；未来升级或替换库时，业务 Panel 不需要重写。

未选择的方向：

- 手写 CSS Grid 拖拽：无法低风险补齐 Tab、Split Tree、浮动、序列化和键盘等完整工作台能力。
- `react-grid-layout`：更适合卡片仪表盘，不适合 IDE 式 Tab Group、嵌套 Split 和 Panel 弹窗。
- 直接把当前三栏做成可调宽：只解决尺寸，不满足模块换位、多实例和多窗口。

### 9.2 跨层所有权

| 层 | 责任 |
| --- | --- |
| Electron main | 布局文件、原生窗口注册、bounds/display 恢复、窗口白名单与清理 |
| preload | 暴露最小、类型化的布局与窗口 IPC |
| renderer shell | Surface 路由、DockView Host、模块注册、布局交互 |
| business panels | 只消费统一 API/真值，维护自己的纯视图状态 |
| runtime/domain | 不感知 Panel 位于哪个 Group 或 BrowserWindow |

推荐 IPC：

```text
cockpit-layout:get
cockpit-layout:save
cockpit-layout:reset
cockpit-window:open
cockpit-window:close
cockpit-window:list
cockpit-window:state-changed
```

所有 `moduleId`、`instanceKey` 和参数必须经主进程白名单校验。Renderer 不得提交任意 URL、preload 路径或 `BrowserWindow` 选项。

## 10. Electron 多窗口要求

### 10.1 创建与路由

- 原生弹窗由 main 进程创建，沿用 `contextIsolation:true`、`nodeIntegration:false` 和受控 preload。
- 使用同一 renderer 构建入口，通过受控 surface 参数进入 `cockpit-popout`，不加载首页或完整控制舱壳。
- 每个窗口可承载一个 Panel 或一个 DockView Group；Group 内仍可有多个 Tab。
- 主窗口关闭到托盘时，子窗口按用户偏好一起隐藏；应用退出时全部销毁并清理监听器。
- 子窗口关闭只移除/隐藏对应视图，不停止正在运行的任务或 Connector Session。

### 10.2 真值与副作用

- Agent、Connector runtime 和 Codex Host 继续由 main 进程广播；多窗口不得建立第二套业务 store。
- 多个 renderer 可以投影同一快照，但终态、任务提交、取消和授权仍以 main 为唯一权威。
- 系统通知、声音回执和未读计数按稳定 `eventId` 全局去重，不能因打开三个窗口播放三次。
- 每个 Panel 的筛选、滚动、Tab 和草稿属于视图状态；任务与 Session 属于全局业务状态。

### 10.3 窗口恢复

- 记录 `displayId`、bounds 和 maximized 状态；恢复时适配当前显示器工作区与 DPI。
- 原显示器不存在时，把窗口完整夹回主显示器可见区域，标题栏必须可操作。
- 验收至少覆盖 100%、125%、150% DPI 和主窗口 + 3 个子窗口。
- 第一阶段必须提供“移动到窗口”菜单路径；跨原生窗口直接拖拽可在稳定后开放，不能作为首版唯一移动方式。

## 11. 自适应、性能与稳定性

- 默认布局在 `1280×720`、`1440×900` 和宽屏下无页面级横向溢出。
- Window/Group 小于 Panel 最小尺寸时使用 Tab、内部滚动或明确空态，不允许控件互压。
- 拖动和 Splitter resize 期间不重算业务真值，不触发任务请求。
- 非活动日志 Panel 应暂停不必要的高频渲染；订阅可共享或按可见性节流。
- 每个 Panel 使用独立 Error Boundary；一个 Panel 渲染失败时保留其他模块和“重新加载/恢复默认”入口。
- 关闭子窗口后，对应 renderer、定时器和 IPC listener 必须释放；重复开关 20 次不能累计回调。
- 布局保存失败不得阻塞业务操作；显示一次错误并继续使用内存中的当前布局。

## 12. 安全要求

- 不允许任意网页或插件注册为 Panel。
- Pop-out 必须继承现有 preload 白名单，不暴露 Node、文件系统或 shell。
- Panel 参数只允许基础类型和登记字段；禁止把 command、env、token 或完整 prompt 写入布局文件。
- 多窗口不会放宽 Connector gate、cwd 围栏、授权确认或审计要求。
- 浏览器 fallback 只能验证窗口内 docking；`window.open` 不作为 Electron 原生多窗口验收证据。

## 13. 可量化验收

| ID | 验收项 | 通过条件 |
| --- | --- | --- |
| DV-01 | 模块注册完整 | 表中 11 个业务模块均可从模块库打开，singleton 不重复 |
| DV-02 | 自定义拖动 | 任一 Panel 可通过标题区停靠到上/下/左/右或合并为 Tab |
| DV-03 | Split/Tab/Resize | Splitter、Tab 重排、Group 最大化和最小尺寸约束工作正常 |
| DV-04 | 布局锁定 | 锁定后布局不能被拖改，Panel 内表单、日志和按钮仍可操作 |
| DV-05 | 自动保存 | 改动布局后重启应用，Panel、比例、Tab 和激活项恢复 |
| DV-06 | 坏数据回退 | 注入非法 schema 后启动回到默认布局，业务数据不丢失 |
| DV-07 | 恢复默认 | 一次确认后恢复默认总览，不停止任何运行任务 |
| DV-08 | 多实例 | 同时固定两个 Agent Inspector 和三个不同 Session 日志，互不串数据 |
| DV-09 | 窗口内多视图 | 至少 4 个 Group 同时可见并可继续拖动重组 |
| DV-10 | Electron 多窗口 | 主窗口 + 3 个子窗口同时显示一致的 Agent/Session 真值 |
| DV-11 | 副作用去重 | 同一任务提交一次、终态一次、通知/音效一次，无窗口数倍增 |
| DV-12 | 窗口关闭语义 | 关闭日志子窗口不停止任务；关闭后 listener/timer 不残留 |
| DV-13 | 多显示器恢复 | 拔掉原显示器后重启，所有窗口仍完整可见并可拖回 |
| DV-14 | 浏览器降级 | 浏览器可验证 docking/布局保存，并明确禁用原生弹窗能力 |
| DV-15 | 无障碍 | 所有拖动结果都有菜单/键盘等价路径，焦点与状态不只靠颜色 |

性能与视觉门禁：

- 拖动和 Splitter resize 过程中无持续卡死、无模块内容重置。
- `1280×720`、`1440×900`、超宽屏及 125%/150% DPI 无重叠、不可达按钮或失控横向滚动。
- 主窗口 + 3 个子窗口持续运行 30 分钟，数据不漂移、通知不重复、关闭后 renderer 数量回落。
- 现有牛马身份、状态动画、任务提交、队列、日志、治理搜索和通知偏好功能不回退。

## 14. 实施分阶

| 阶段 | 范围 | 退出条件 | 估算 |
| --- | --- | --- | --- |
| D0 架构探针 | 引入适配层、模块注册表、默认布局，不迁移全部模块 | workstations + logs 两模块可停靠、可序列化 | 0.5-1 天 |
| D1 窗口内工作台 | 11 个模块迁移、Tab/Split/浮动、锁定与恢复默认 | DV-01~DV-07、DV-09 通过 | 2-3 天 |
| D2 多实例/档案 | 固定 Agent、多个日志、布局预设与自定义档案 | DV-08 通过，切换档案不串状态 | 1-2 天 |
| D3 Electron 多窗口 | main/preload IPC、子窗口路由、恢复和全局去重 | DV-10~DV-14 通过 | 2-3 天 |
| D4 稳定性收口 | DPI、多显示器、键盘、错误恢复、长稳与打包验证 | 全部门禁与回归通过 | 1-2 天 |

总量级：约 `6.5-11` 个开发日。D0 是技术准入，不得把两个可拖动示例 Panel 宣称为需求完成。

## 15. 预计文件影响

实现阶段预计涉及：

- `package.json` / lockfile：登记 `dockview-react` 的固定兼容版本。
- `src/types.ts`：布局、Panel、Window 与 IPC 合同。
- `src/App.tsx`：主窗口与 pop-out surface 路由。
- `src/components/NiuMaWorkspace.tsx`：从固定网格壳迁移为 Panel 组合，业务逻辑逐步下沉。
- `src/components/StatusStrip.tsx`：转为可复用模块内容。
- `src/cockpit/layout/**`：DockView 适配、注册、默认布局、持久化和错误边界。
- `src/cockpit/panels/**`：治理、工位、Inspector、派活、队列、日志、状态和设置模块。
- `electron/main.ts` / `electron/preload.ts`：布局持久化与受控多窗口。
- `src/index.css`：DockView 主题、拖动反馈、焦点、最小尺寸与窗口壳。
- 针对布局 schema、模块注册、窗口白名单、去重和恢复的检查脚本/测试。

正式实施前应按 D0-D4 建立独立任务卡和文件围栏，避免与实时调度、Connector 或其他控制舱 UI lane 并行修改同一壳层文件。

## 16. 验证命令与证据

自动门禁至少包括：

```text
npm.cmd run orchestration:check
npm.cmd run orchestration:report
npm.cmd run orchestration:preflight
npm.cmd run orchestration:connector-safety
npm.cmd run realtime:truth-check
npm.cmd run lint
npm.cmd run build
git diff --check
```

桌面证据必须来自 Electron：

- 默认布局、自由停靠、标签合并、四向 Split、浮动和锁定录屏。
- 主窗口 + 3 子窗口截图，至少一个子窗口位于第二显示器或模拟的不同 bounds。
- 重启前后布局 JSON 摘要和对应截图。
- 同一完成事件在多个窗口存在时只产生一次气泡/系统通知/声音的事件证据。
- 子窗口反复开关 20 次后的窗口数、listener 清理和业务任务连续性证据。

## 17. 最终完成定义

只有当全部业务模块已进入注册表、窗口内布局可自由组合并可靠恢复、多个 Agent/日志实例可并行查看、Electron 子窗口与主窗口共享同一真值且无重复副作用，并通过多显示器/DPI/关闭清理验证后，才能将该需求标记为完成。

仅做到“左中右栏可拖宽”“卡片可排序”“两个示例 Panel 能拖动”或“浏览器能 `window.open`”均不算完成。
