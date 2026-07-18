# 牛马 Hub 下一阶段需求与目标 v0.1

日期：2026-07-18

状态：ready for execution decision

## 1. 单一目标

把牛马 Hub 从“能真实发现、启动和观察本机 Agent 的控制舱”推进为“能让两个真实 Headless Agent 在同一个受控工作流中协作并留下完整证据的本地优先 Hub”，同时保留牛马场作为统一状态反馈空间。

下一阶段不以接入 Agent 数量、按钮数量或动画数量衡量成功。成功必须同时满足：

1. 至少 3 个 Agent 完成可信生命周期闭环。
2. 至少 2 个 Headless Agent 通过独立 Adapter 验收。
3. 至少 1 条双 Agent 依赖工作流真实完成，并覆盖取消或失败分支。
4. 控制舱、Session、牛马场、通知和声音对同一事实保持一致。
5. 所有执行仍经过权限、cwd、env、timeout、审计和显式授权。

## 2. 已确认基线

- Electron 控制舱、桌面牧场、8 个固定工位和本地持久化已存在。
- Trae、WorkBuddy、Qoder、MiniMax、OpenClaw 已进入不同层级的本机发现或生命周期管理；支持等级不得合并成模糊的“已支持”。
- Codex Desktop 生命周期 Session 与 Connector Runtime Session 已进入统一只读 Inspector；宿主进程不会伪造 Session。
- Connector gate/runtime、授权 grant、进程证明、恢复和本地 scheduler 已有安全基线。
- `AgentManifest + InstallPlan`、Adapter Capability、`HubTheme`、`HubSoundPack` 四份 R0 合同已形成；Theme/SoundPack 仍待独立 exact-file acceptance。
- 最新 Windows 包和真实 Electron CDP 截图已通过，控制舱稳定态横向 overflow 为 0。

## 3. 当前缺口

| 缺口 | 当前真值 | 不允许的捷径 |
| --- | --- | --- |
| OpenClaw 初始化 | 官方向导已打开，Gateway/认证未完成 | 自动接受风险、代填凭据、把 CLI installed 当 Gateway ready |
| Codex P0-C | 技术前置存在，缺完整执行授权包络 | 从“继续推进”推导外部执行授权 |
| 第二 Headless Agent | Trae 有 CLI 但缺 Models/auth 成功证据；Qoder 无独立 headless API | 用桌面进程、UI 自动化或模拟任务冒充 Adapter |
| Agent Library | 目前是固定工位和探针，不是清单/安装计划产品 | 把硬编码卡片数量当 Agent 库 |
| 工作流产品 | scheduler 内核存在，没有用户可见的依赖工作流闭环 | 只展示排队动画或静态 DAG |
| DockView | 只有 Selected-Agent Sessions 切片 | 把右栏 Tab 称为完整自由停靠/多窗口 |
| Theme/Sound | R0 合同存在，R3 runtime/UI 未实现 | 把合同存在写成可导入、可切换 |

## 4. 产品原则

1. **真值优先**：进程、Session、Task、工作流、通知和声音分别建立证据，不互相越权推导。
2. **能力分级**：固定使用 `catalogued -> detected -> installed -> launchable -> connectable -> coordinatable`，每一级都必须有来源和时间。
3. **本地优先**：文件、凭据和任务输出默认留在本机；只允许白名单 Connector 和明确网络行为。
4. **显式授权**：安装、外部执行、写操作、权限提升和风险条款都必须由用户确认。
5. **可恢复**：安装、布局、主题、音效和 Runtime 状态都需要取消、回滚或 last-known-good。
6. **牛马场不退化**：牛马场继续承担跨 Agent 实时状态、回执和情绪价值，不退化为普通启动器皮肤。

## 5. 用户主路径

```text
打开 Hub
-> Agent Library 查看支持等级和本机状态
-> 安装/启动/连接一个 Agent
-> 创建带依赖的双 Agent 工作流
-> 审阅每个节点的权限、cwd、输入输出和 timeout
-> 显式确认并运行
-> 在工作台查看 Session、队列和日志
-> 在牛马场接收一致状态、通知与声音
-> 完成、取消或失败后查看审计和产物
```

任何一步缺少真实证据，都必须显示 unavailable/unknown/blocked，不能回退为模拟成功。

## 6. 功能需求

### 6.1 Agent Library 与生命周期

| ID | 需求 | 验收 |
| --- | --- | --- |
| HUB-LC-01 | Agent 清单显示身份、支持等级、版本、安装/运行/连接状态和证据来源 | 每个字段有 source/observedAt；未知值明确显示 unknown |
| HUB-LC-02 | 至少 3 个 Agent 完成检测、安装或官方引导、启动/聚焦、重新检测 | 三条真实 Windows smoke；失败和取消不留下假 running |
| HUB-LC-03 | 安装严格执行 `InstallPlan` | 来源、digest、网络、提权、写入路径、取消和恢复可见且可审计 |
| HUB-LC-04 | Agent 动作只允许固定 ID 和固定入口 | renderer 无路径/命令透传；过期动作 fail closed |
| HUB-LC-05 | 版本不兼容、未认证或服务缺失时明确降级 | 不授予 connectable/coordinatable，不生成 Session |

首批生命周期候选：Codex、Trae、WorkBuddy、Qoder、MiniMax、OpenClaw。候选不等于全部达到相同支持等级。

### 6.2 Headless Adapter 与真实 Session

| ID | 需求 | 验收 |
| --- | --- | --- |
| HUB-AD-01 | 选择两个有独立结构化接口的 Agent | 每个 Adapter 独立通过 protocol、auth、timeout、cancel、terminal、redaction 证据 |
| HUB-AD-02 | Codex P0-C 受控只读 dry-run | C-01~C-12 有完整包络、事件、截图、前后 hash/diff 和 0 残留 |
| HUB-AD-03 | 第二 Adapter 通过能力三态验收 | declared 不等于 supported；冲突或过期证据为 unknown |
| HUB-AD-04 | Session 四元组稳定 | `taskId/sessionId/agentId/connectorId` 完整且不串线 |
| HUB-AD-05 | 浏览器 fallback 永远不执行 | run blocked，simulation 不进入在线 KPI |

第二 Agent 选择规则：Trae 只有在 Models/auth 和成功 stream-json smoke 后可入选；OpenClaw 只有在 Gateway/API 结构化能力验收后可入选；Qoder 在出现独立 headless API 前不入选。

### 6.3 多 Agent 工作流

| ID | 需求 | 验收 |
| --- | --- | --- |
| HUB-WF-01 | 用户可创建 2-8 节点的有向无环工作流 | 环检测、缺失依赖和重复节点在运行前拒绝 |
| HUB-WF-02 | 节点绑定 Agent、任务、cwd、权限、timeout、retry 和产物合同 | 提交前可审阅；运行时不可由 renderer 偷换 |
| HUB-WF-03 | 依赖成功后才启动下游 | 上游失败/取消/超时后下游进入 dependency-blocked，spawn=0 |
| HUB-WF-04 | 并发遵守 scheduler 合同 | `maxGlobalActive=1..4`，同 Agent 并发 1，恢复 Session 保留槽位 |
| HUB-WF-05 | 工作流可取消并清理 | 1 秒收到取消，5 秒内终态或升级清理，残留进程 0 |
| HUB-WF-06 | 完整工作流审计 | 请求、授权、节点、Session、事件、产物 digest 和终态可查询且脱敏 |

首条验收工作流建议：Agent A 只读分析 `package.json` -> Agent B 校验摘要结构和约束。两节点都不得写工作区。

### 6.4 工作台、DockView 与牛马场

| ID | 需求 | 验收 |
| --- | --- | --- |
| HUB-UX-01 | Selected-Agent Inspector 展示真实 Session、来源、状态和详情 | 已实现切片继续保留；宿主进程单独显示空态 |
| HUB-UX-02 | DockView D0 建立适配层和模块注册表 | workstations + logs 可停靠、序列化；不得宣称完整需求 |
| HUB-UX-03 | D1/D2 支持 Tab、Split、锁定、恢复、多 Agent/Session 实例 | 关闭视图不停止任务，固定实例不串 Agent/Session |
| HUB-UX-04 | 多窗口只消费主进程同一真值 | 主窗口 + 3 子窗口无重复任务、通知或声音 |
| HUB-UX-05 | 牛马状态映射同一业务终态 | working/success/failure/blocked 与控制舱、通知、声音一致 |
| HUB-UX-06 | 视觉与无障碍 | 1280×720、1440×900、宽屏无重叠；reduced-motion、键盘等价路径通过 |

DockView 改造必须与 `NiuMaWorkspace.tsx` 其他 UI lane 串行，避免共享壳层并发修改。

### 6.5 Theme 与 SoundPack 产品化

| ID | 需求 | 验收 |
| --- | --- | --- |
| HUB-PS-01 | 两套内置 HubTheme 可预览、切换和恢复默认 | 坏包/低对比/坏 digest 回滚 LKG，启动不白屏 |
| HUB-PS-02 | 本地导入/导出遵守 HubTheme 合同 | 路径穿越、远程 URL、脚本、未知 MIME 和许可缺失拒绝 |
| HUB-PS-03 | 两套 HubSoundPack 可试听、切换和静音 | 六种事件语义、default identity tail 和响度限制通过 |
| HUB-PS-04 | 声音策略不可被包覆盖 | global mute、quiet hours、important-only、rate limit 和 eventId dedupe 优先 |
| HUB-PS-05 | Preview 与业务真值隔离 | preview 不创建 Runtime event、通知、成功或在线状态 |

R3 实现只能在两份 R0 合同独立 accepted 后启动。

## 7. 非功能需求

| ID | 要求 | 门槛 |
| --- | --- | --- |
| HUB-NF-01 | 安全 | `contextIsolation=true`、`nodeIntegration=false`；无 raw command/path/env IPC |
| HUB-NF-02 | 可恢复 | 重启后无未解释 running；恢复或 session-lost 在 10 秒内确定 |
| HUB-NF-03 | 性能 | 生命周期动作 focus <5s，冷启动预算 <15s；事件到 UI p95 <500ms |
| HUB-NF-04 | 资源 | idle 无高频轮询；关闭窗口释放 timer/listener/renderer |
| HUB-NF-05 | 隐私 | 不读取会话正文；日志和审计脱敏；凭据不进入 renderer/文档 |
| HUB-NF-06 | 可测试 | 每个真实主路径至少有一个 failure fixture 和一个打包 smoke |

## 8. 明确非目标

- 不在下一阶段支持所有 Agent、所有 OS 或远程云控制。
- 不开放任意 shell、插件脚本、网页 Panel 或 marketplace 自动执行。
- 不用 UI 自动化冒充 Headless Adapter。
- 不自动接受 OpenClaw 风险条款或配置用户凭据。
- 不把 Theme/Sound 合同当成 R3 产品交付。
- 不为证明 launch 强制退出正在工作的用户应用。
- 不在 P0-C 授权前运行 Codex/Trae/Qoder 外部 Connector。

## 9. 里程碑与退出条件

### M0：验收债清零

- 用户完成 OpenClaw 可见向导或明确推迟。
- Theme/SoundPack 独立 exact-file review 通过或给出精确修订。
- 用户给出 P0-C 完整执行包络，或明确继续保持 disabled。

退出条件：没有“代码可修但未修”的 P0 blocker；外部决定单独列账。

### M1：Agent Library + 三 Agent 生命周期

- Manifest registry、支持等级、安装计划和证据 UI。
- 三个 Agent 的检测/安装或引导/启动/聚焦/重检真实闭环。

退出条件：HUB-LC-01~05 全过，打包 Windows smoke 和回滚证据齐全。

### M2：双 Headless Adapter + 工作流

- Codex P0-C；第二 Adapter capability acceptance。
- 双 Agent DAG、依赖阻塞、取消、timeout、审计和产物 digest。

退出条件：HUB-AD 与 HUB-WF 全过，至少一条成功链和一条失败/取消链。

### M3：可组合工作台

- DockView D0 -> D2 串行推进，Session/日志多实例和布局恢复。

退出条件：窗口内工作台可恢复、不串真值、不重复副作用；多窗口另行进入 D3。

### M4：个性化产品化

- Theme/Sound runtime、设置 UI、两套内置包、导入/恢复和许可。

退出条件：HUB-PS-01~05 全过，坏包和静音/去重负向路径通过。

## 10. 核心指标

- 生命周期闭环 Agent 数：目标 `>=3`。
- coordinatable Headless Agent 数：目标 `>=2`，必须有当前证据。
- 双 Agent 工作流成功率：验收 fixture `100%`，失败分支不误 spawn。
- 假在线/假成功：`0`。
- 未解释残留进程/Session：`0`。
- 重复任务提交、通知或声音：`0`。
- 打包主路径横向溢出和不可达按钮：`0`。

## 11. 下一步执行顺序

1. 完成 M0 三个外部决定：OpenClaw、Theme/Sound 独立 review、P0-C 授权。
2. 建立 M1 `Agent Library + Lifecycle` 独立任务卡和文件围栏。
3. M1 验收后做第二 Headless Agent 选择 spike，不预选 Qoder。
4. 完成 M2 后再扩大 DockView；避免 UI 壳和 Runtime 同时大改。
5. Theme/Sound runtime 保持在 M4，不抢占真实协作闭环优先级。

任何阶段如果不能证明真值、边界或验收，应停在当前支持等级，不通过模拟或文案升级状态。
