# 牛马 Hub AgentManifest 与 InstallPlan 合同 v0.1

> 合同身份：`niuma.hub.agent-manifest-install-plan`
>
> 合同版本：`0.1.0`
>
> 状态：`r0-contract-candidate / implementation-not-started`
>
> Owner：`[长工]#hub-agent-install-contract@v0.1`
>
> 适用范围：Windows 首发版 Agent 目录、宿主发现声明与安装计划描述

## 1. 单一目标

冻结 Agent 的不可变身份、可信来源、宿主可执行文件身份、Connector 候选绑定、证据派生规则和结构化安装计划，使 Hub 能在不执行安装器、不启动外部 Agent、不修改 Connector 策略的前提下，明确回答：

1. 目录里描述的是哪一个 Agent；
2. 哪些文件或进程只能算候选，哪些证据足以确认安装或运行；
3. 安装将读取、下载、修改、提权或恢复什么；
4. 失败、取消、版本不兼容或证据不足时为什么必须停下。

本合同只定义数据与判定规则，不实现发现器、安装器、更新器、启动器、Adapter、Session 读取或任务执行。

## 2. 规范用语与文档形态

- **必须**：违反即合同无效或操作失败关闭。
- **不得**：命中即拒绝，不允许降级为警告后继续。
- **可以**：实现可选；缺失不得改变必需语义。
- **Manifest**：一个 Agent 身份和兼容声明的版本化文档。
- **InstallPlan**：针对一个 Manifest、平台和安装方法的版本化声明，不是命令脚本。
- **EvidenceRecord**：由受信评估器在 Manifest 外生成的观察记录。
- **candidate**：仅命中提示性事实，不能证明支持、安装、运行或任务状态。
- **verified**：满足本合同所列证据条件且仍在有效期内。
- **unknown**：证据缺失、冲突、过期、权限不足或版本无法解释。
- **rejected**：已取得足以否定该判断的证据。

分发形态使用 UTF-8 JSON。本文的 JSON 示例是合同样本；正式实现必须提供机器可验证的 JSON Schema，但不得以实现细节反向改变本文语义。

## 3. 版本、兼容与迁移

### 3.1 Schema 身份

| 文档 | `schema` 固定值 | 当前 `schemaVersion` |
| --- | --- | --- |
| AgentManifest | `niuma.agent-manifest` | `0.1.0` |
| InstallPlan | `niuma.install-plan` | `0.1.0` |
| EvidenceRecord | `niuma.agent-evidence` | `0.1.0` |
| InstallRunJournal | `niuma.install-run-journal` | `0.1.0` |

### 3.2 读取规则

- Reader 只接受自己明确列出的 `schema`。
- v0 阶段只接受 `>=0.1.0 <0.2.0`；未知 minor、未知 enum、未知必需字段或缺失必需字段一律拒绝。
- 只有 `extensions` 对象内的未知命名空间可以保留并忽略；根对象和规范字段中的未知键必须拒绝，防止拼写错误被静默吞掉。
- 未知 major、无法完成的迁移、签名或摘要不匹配必须失败关闭；不得回退为旧版本继续安装。
- 迁移必须生成新文档，保留原文档、来源、原摘要、迁移器版本和迁移时间；不得原地重写已签名或已审计文档。
- 迁移只转换表示，不能新增支持证据、改变 `agentId`、扩大权限或把未知状态改成 verified。

### 3.3 完整性

- `documentSha256` 使用小写 64 位十六进制 SHA-256，计算对象为去除 `integrity.documentSha256` 与 `integrity.signature` 后的 RFC 8785 canonical JSON 字节。
- `lifecycle=draft` 时 `documentSha256` 可以为 `null`；进入 `distributed` 或 `accepted` 时必须存在且匹配。
- 签名可选；一旦声明就必须完整验证。未知签名算法、未知 key、过期或撤销证书均不得被当成“未签名但可继续”。
- 文件、安装包和可执行文件的摘要属于各自 artifact/evidence，不得复用 Manifest 文档摘要冒充二进制摘要。

## 4. 不可变 Agent 身份

### 4.1 身份规则

- `agentId` 是跨 Manifest 版本、安装路径、窗口、进程、Connector 和 Session 的唯一稳定键。
- `agentId` 必须匹配 `^[a-z][a-z0-9-]{1,63}$`，全局使用小写 ASCII。
- `identityKey` 必须严格等于 `agent:${agentId}`，由 Reader 计算并核对，不允许作者另定。
- `displayName` 是可展示名称，可以在新 Manifest 版本中修改，但不参与身份相等判断。
- host product 名、可执行文件名、安装目录、快捷方式名、窗口标题、进程 PID、Connector ID 和旧昵称都不得成为 Agent 主键。
- 修改 `agentId` 等于创建新身份。迁移只能通过 `supersedesAgentIds` 明确声明并要求用户确认；不得自动合并历史 Session、授权、凭据或审计记录。
- `legacyAgentIds` 仅用于导入提示，不参与运行时匹配；它不得与任何已接受 Manifest 的 canonical `agentId` 相同。

### 4.2 WorkBuddy、Kimi、MiniMax R0 身份冻结

以下表是 R0 canonical identity。文件路径是本机观测提示，不是可移植身份，也不是 installed/running 证据。

| `agentId` | `identityKey` | `displayName` | `legacyAgentIds` | host product aliases（非身份 alias） | Windows primary executable binding | helper executable alias | 本机非权威 path hint | `connectorBindings` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `workbuddy` | `agent:workbuddy` | `WorkBuddy` | `[]` | `WorkBuddy` | `workbuddy.desktop.windows.primary` -> exact basename `WorkBuddy.exe` | none | `E:\\WorkBuddy\\WorkBuddy.exe` | `[]` |
| `kimi` | `agent:kimi` | `Kimi` | `[]` | `Kimi Desktop`, `kimi-desktop` | `kimi.desktop.windows.primary` -> exact basename `Kimi.exe` | `kimi.desktop.windows.webbridge` -> exact basename `kimi-webbridge.exe` | `%LOCALAPPDATA%\\Programs\\kimi-desktop\\Kimi.exe` | `[]` |
| `minimax` | `agent:minimax` | `MiniMax` | `[]` | `MiniMax Code` | `minimax.desktop.windows.primary` -> exact basename `MiniMax Code.exe` | none | `H:\\MiniMax\\MiniMax Code\\MiniMax Code.exe` | `[]` |

冻结含义：

- Windows basename 比较使用 ordinal case-insensitive equality；禁止通配符、正则、contains、starts-with 或只匹配 `node.exe`、`electron.exe` 等通用宿主。
- `Kimi.exe` 与 `kimi-webbridge.exe` 是不同 executable identity。webbridge 单独存在只能形成 helper candidate，不能证明 Kimi 主程序 installed、running、connectable 或 active-task。
- `installer.exe`、updater、uninstaller、crash reporter、GPU/helper renderer 和任意通用 Electron 子进程默认排除；除非未来 Manifest 版本为其新增精确 `executableId` 与角色。
- 主文件名命中只产生 candidate。要成为 verified executable，还必须满足已接受 Manifest 中的强身份条件：受信发布者签名或已验证 artifact SHA-256 至少一项，并且 product metadata 不冲突。
- 上表没有经过独立发布者/签名复核的字段保持 unknown。Reader 不得根据本机安装目录名称补写发布者或支持状态。
- 三个 `connectorBindings` 在 v0.1 均固定为空数组。现有牛马卡片、示例命令、正在运行的桌面应用或文件名命中都不构成 Connector 注册、启用或授权。

R0 的 Hub 工位绑定是 Manifest 之外的本机 registry 事实，不能由 Manifest 自己写入：

| `agentId` | Hub workstation registry | `workstationConfigured` | `bindingState` | Connector configured/enabled |
| --- | --- | --- | --- | --- |
| `workbuddy` | 现有受控种子 `workbuddy -> workbuddy` | `true` | `bound` | `false / false` |
| `kimi` | 无工位种子 | `false` | `unbound` | `false / false` |
| `minimax` | 现有受控种子 `minimax -> minimax` | `true` | `bound` | `false / false` |

这里的 `workstationConfigured` 只表示 Hub 能把一个发现事实投影到确定工位；它不表示 Adapter、Connector、Session、授权或执行能力存在。

## 5. AgentManifest Schema

### 5.1 根字段

| 字段 | 类型 | 必需 | 约束 |
| --- | --- | --- | --- |
| `schema` | string | 是 | 固定 `niuma.agent-manifest` |
| `schemaVersion` | semver string | 是 | 当前 `0.1.0` |
| `lifecycle` | enum | 是 | `draft / distributed / accepted / revoked` |
| `manifestId` | string | 是 | `manifest:${agentId}`；不可随版本改变 |
| `manifestVersion` | semver string | 是 | 内容版本；必须单调递增 |
| `agentId` | string | 是 | 遵循 4.1 |
| `identityKey` | string | 是 | 严格等于 `agent:${agentId}` |
| `displayName` | string | 是 | 1..80 个可见字符；不得只含空白 |
| `publisher` | PublisherIdentity | 是 | 发布者声明与验证状态分离 |
| `legacyAgentIds` | string[] | 是 | 默认空；唯一、无 canonical 冲突 |
| `supersedesAgentIds` | string[] | 是 | 默认空；仅用户确认迁移使用 |
| `platforms` | PlatformDeclaration[] | 是 | 至少一项，组合唯一 |
| `officialSources` | SourceReference[] | 是 | 可以为空；为空时 catalog provenance 为 unknown |
| `hostExecutables` | HostExecutableIdentity[] | 是 | 可以为空；每个 `executableId` 全局唯一 |
| `connectorBindings` | ConnectorBinding[] | 是 | 可以为空；不得携带 enable/authorization |
| `installPlanRefs` | InstallPlanRef[] | 是 | 可以为空；引用不证明 installable |
| `supportRequirements` | SupportRequirement[] | 是 | 六个 facet 各一项，不包含结果 |
| `provenance` | ManifestProvenance | 是 | 作者、来源和时间 |
| `integrity` | DocumentIntegrity | 是 | 遵循 3.3 |
| `extensions` | object | 否 | key 必须是反向域名命名空间 |

### 5.2 复合类型

#### PublisherIdentity

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `publisherId` | string | 是 | Hub 内稳定归一化 ID；不是法律实体证明 |
| `displayName` | string | 是 | 展示声明 |
| `verification` | enum | 是 | `verified / unknown / rejected` |
| `evidenceRefs` | string[] | 是 | verified 时至少一项；否则可以为空 |

#### PlatformDeclaration

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `os` | enum | 是 | v0.1 仅 `windows` |
| `architectures` | enum[] | 是 | `x64 / arm64`，至少一项 |
| `minOsVersion` | string \| null | 是 | null 即 unknown，不代表无限兼容 |
| `maxOsVersion` | string \| null | 是 | null 即 unknown；超出已知范围必须 unknown/rejected |
| `distributionKinds` | enum[] | 是 | `desktop / cli / web-deeplink` |

#### SourceReference

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `sourceId` | string | 是 | Manifest 内唯一 |
| `kind` | enum | 是 | `official-site / official-release / package-manager / local-observation` |
| `uri` | string | 是 | remote 必须为 HTTPS；local 仅允许 `file:` 且不得作为分发下载源 |
| `publisherId` | string | 是 | 必须与声明或受信代理一致 |
| `retrievedAt` | ISO-8601 string | 是 | 不得晚于当前时间 |
| `verification` | enum | 是 | `verified / unknown / rejected` |
| `license` | LicenseDeclaration | 是 | 软件许可事实与素材许可分开记录 |
| `evidenceRefs` | string[] | 是 | verified 时至少一项 |

#### HostExecutableIdentity

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `executableId` | string | 是 | `${agentId}.${surface}.${os}.${role}` 风格，跨版本稳定 |
| `role` | enum | 是 | `primary / helper / updater / installer / uninstaller` |
| `surface` | enum | 是 | `desktop / cli / service / bridge` |
| `fileNameAliases` | string[] | 是 | 精确 basename，至少一项，大小写折叠后唯一 |
| `productNameAliases` | string[] | 是 | 精确 product metadata；不得模糊匹配 |
| `publisherSignature` | SignatureRequirement \| null | 是 | null 表示未验证，不表示可跳过 |
| `artifactSha256` | string[] | 是 | 每项 64 位小写 hex；可以为空 |
| `pathHints` | string[] | 是 | 仅提示；不得单独形成 verified |
| `requiredForInstalled` | boolean | 是 | 只有 primary 可以为 true |
| `requiredForRunning` | boolean | 是 | helper 默认 false |

Host executable 的 verified match 必须满足：精确 basename 命中、role 相符，并且签名或 artifact digest 至少一项验证通过；任何已声明 product/publisher 条件冲突时直接 rejected。PID 重用、只有窗口标题、只有快捷方式、只有 path hint 或只有 helper 均不足。

#### ConnectorBinding

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `connectorId` | string | 是 | 仅候选引用，不等于已登记 Connector |
| `bindingKind` | enum | 是 | `candidate / declared`；v0.1 不允许 `enabled` |
| `capabilityProfileRef` | string \| null | 是 | 由 Adapter Capability 合同定义 |
| `policyRef` | string \| null | 是 | 必须指向外部机器策略；Manifest 不内嵌策略 |
| `evidenceRefs` | string[] | 是 | 可以为空；空时全部连接能力 unknown |

禁止字段包括 `enabled`、`enabledByDefault`、`approvalStatus`、授权 grant、raw credential、cwd、env、prompt 和可执行命令。机器上的 Connector policy 始终优先；Manifest 与 InstallPlan 都不能更改它。

#### InstallPlanRef

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `planId` | string | 是 | 指向同一 `agentId` |
| `versionRange` | semver range | 是 | Reader 必须理解完整范围 |
| `platform` | PlatformSelector | 是 | 必须与 Manifest platform 相交 |

#### 共享声明类型

`PlatformSelector`：

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `os` | enum | 是 | v0.1 固定 `windows` |
| `architecture` | enum | 是 | `x64 / arm64` |

`SignatureRequirement`：

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `algorithm` | string | 是 | 必须在 Reader 受信算法清单内 |
| `publisherNames` | string[] | 是 | 至少一项精确名称 |
| `thumbprints` | string[] | 是 | 可以为空；非空时必须命中一项 |
| `chainPolicyId` | string | 是 | 指向本机受信验证策略，不内嵌证书私钥 |

`LicenseDeclaration`：

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `licenseId` | string | 是 | SPDX ID 或 `LicenseRef-Proprietary` |
| `licenseUrl` | HTTPS URI \| null | 是 | unknown 时为 null，不能虚构 |
| `redistribution` | enum | 是 | `allowed / restricted / unknown` |
| `evidenceRefs` | string[] | 是 | redistribution 非 unknown 时至少一项 |

`ManifestProvenance`：

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `authoredBy` | string | 是 | 可审计 Owner/工具身份 |
| `createdAt` | ISO-8601 string | 是 | 不得在未来 |
| `sourceEvidenceRefs` | string[] | 是 | 可以为空；空时来源 assessment 保持 unknown |

`DocumentIntegrity`：

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `algorithm` | enum | 是 | 固定 `sha256` |
| `documentSha256` | string \| null | 是 | draft 可以为 null；distributed/accepted 必须为 64 位小写 hex |
| `signature` | object \| null | 是 | 非 null 时包含 algorithm、keyId、signatureBase64 和 signedAt |

#### SupportRequirement

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `facet` | enum | 是 | 下列六项之一且各出现一次 |
| `evidenceKinds` | enum[] | 是 | 至少一项；仅描述验收所需来源 |
| `requirements` | string[] | 否 | 机器可识别 requirement ID；不得写结果 |

`evidenceKinds` 允许值为 `manifest-review / file-inspection / signature / install-plan-review / process-proof / window-proof / adapter-session / install-run`。未知值必须拒绝。

`facet` 必须恰好覆盖以下六项且各出现一次：

| facet | Manifest 可以声明 | verified 结果所需最小证据 |
| --- | --- | --- |
| `discoverable` | 精确发现规则和强身份要求 | 受信评估器命中规则，并输出未冲突 EvidenceRecord |
| `installable` | InstallPlan ref、平台与权限边界 | Plan schema、来源、完整性、权限、取消和恢复全部验证通过 |
| `launchable` | primary executable 与启动/聚焦前置条件 | 已验证安装身份、机器策略允许、一次独立 launch/focus 验收 |
| `connectable` | ConnectorBinding candidate | Adapter 合同、机器策略和真实连接证据 |
| `observable` | 可观察事件/Session 的要求 | Adapter 真实读取、来源、时效和断线降级证据 |
| `coordinatable` | 调度/取消/超时/终态要求 | Adapter、Connector gate、真实任务与审计闭环证据 |

Manifest 的 `supportRequirements` 只能描述 requirements 与 `evidenceKinds`，不得出现 `supported=true`、`level`、`maturity`、`verifiedAt` 或任何结果字段。一个 facet verified 不得推导另一个 facet verified。

## 6. EvidenceRecord 与派生状态

### 6.1 EvidenceRecord 字段

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `schema` | string | 是 | 固定 `niuma.agent-evidence` |
| `schemaVersion` | string | 是 | 当前 `0.1.0` |
| `evidenceId` | string | 是 | 全局唯一、不可变 |
| `agentId` | string | 是 | 必须匹配已接受 Manifest |
| `subject` | enum | 是 | 六个 `support.*` 或三个 `lifecycle.*` |
| `assessment` | enum | 是 | `verified / rejected / unknown` |
| `observedAt` | ISO-8601 string | 是 | 不得在未来 |
| `expiresAt` | ISO-8601 string \| null | 是 | 动态进程/Session 证据必须有值 |
| `evaluatorId` | string | 是 | 受信评估器身份与版本 |
| `sourceKind` | enum | 是 | `manifest-review / file-inspection / signature / process-proof / window-proof / adapter-session / install-run` |
| `subjectIdentity` | object | 是 | executableId、PID fingerprint、Session ID 等脱敏稳定字段 |
| `facts` | object | 是 | 结构化事实；不得含凭据或 raw command line |
| `evidenceSha256` | string | 是 | canonical evidence digest |
| `supersedesEvidenceIds` | string[] | 是 | 默认空；保留历史，不覆盖删除 |

冲突、过期或无法读取时结果为 unknown；不能沿用最近一次 verified。只有 accepted Manifest、受信 evaluator、未过期、digest 有效且 identity 未冲突的 EvidenceRecord 才能参与派生。

### 6.2 `installed / running / active-task` 独立证据

| 状态 | verified 的必要条件 | 明确不足的事实 |
| --- | --- | --- |
| `lifecycle.installed` | required primary executable 强身份验证通过；版本在 Manifest/Plan 允许范围；安装结果或 existing-install 检查可审计 | 下载完成、目录存在、快捷方式存在、basename 单独命中、helper/updater 存在 |
| `lifecycle.running` | 当前 live PID 的 process identity 与 verified primary executable 匹配；PID fingerprint 未复用；证据未过期 | installed、窗口标题、历史 PID、helper 进程、系统托盘图标 |
| `lifecycle.active-task` | 受信 Adapter Session 绑定同一 `agentId + connectorId + sessionId + taskId`，任务为非终态且有新鲜 lifecycle evidence | running、CPU 占用、窗口前台、日志文件变动、动画或 UI 文案 |

三项不得互推：

- installed verified 不能推出 running。
- running verified 不能推出 active-task、connectable 或 coordinatable。
- active-task 必须有 Adapter/Runtime 证据；它不从进程或窗口猜测。对于远程/Web Adapter，active-task 可以在本机 running unknown 时成立，因此也不得反推本机进程存在。
- 进程消失只使 running unknown/rejected；不得擅自把任务标记 success、failure 或 stopped。
- 多 helper PID 必须聚合到一个 Agent identity，不得生成多个 canonical Agent。

### 6.3 应用存在、绑定、Session 与任务状态

这些状态属于不同所有者，必须分别显示：

| 事实 | 唯一权威来源 | 可以产生的视图 | 绝不能产生 |
| --- | --- | --- | --- |
| Manifest accepted | Manifest registry | catalogued identity | installed、workstation configured、Connector configured、online、busy |
| primary executable candidate/verified | host discovery EvidenceRecord | detected/discovered；verified 后可支持 installed 判定 | Connector configured、Session、active-task |
| explicit Hub workstation binding | Hub workstation registry | `workstationConfigured=true`、`bindingState=bound` | Connector configured/enabled、online、busy |
| explicit Connector binding + user/machine config | Connector registry 与 machine policy | `connectorConfigured=true` | Connector enabled、online、busy、task success |
| fresh Adapter Session | Adapter/Runtime lifecycle evidence | online/observable | installed、support coordinatable 自动通过 |
| fresh non-terminal task tied to the Session | Runtime task identity evidence | busy/active-task | business success、failure或stopped |

- **Kimi v0.1 必须可见但未绑定**：accepted Manifest 或主程序 discovery 可以让 Agent Library 出现 `agentId=kimi`；由于没有 Hub workstation binding，Runtime 投影必须保持 `workstationConfigured=false`、`bindingState=unbound`、`sessionId` 缺失、`isOnline=false`、`activeTask=false`。
- WorkBuddy 和 MiniMax 已有精确的 Hub workstation binding，因此可投影为 `workstationConfigured=true / discovered` 并在对应工位显示“本机应用已运行”。两者的 `connectorBindings=[]` 仍意味着 `connectorConfigured=false / connectorEnabled=false`；工位绑定绝不构成 Connector configuration。
- 发现正在运行的 primary executable 只更新 `lifecycle.running`，不创建 Session。Session 只能由已登记 Adapter 输出，并通过机器策略与身份关联验证。
- Manifest 中出现 `configured`、`online`、`busy`、`activeTask`、`taskStatus`、`sessionId`、`isOnline` 或 terminal result 字段必须拒绝，而不是忽略。这些都是 Runtime 事实，Manifest 无权声明或授权。
- 显式 ConnectorBinding 也只代表候选/声明；只有外部 machine policy 与用户配置可以产生 configured。Manifest 永远不能自授权 online、busy、任务执行或业务终态。

### 6.4 产品状态映射

现有产品词汇只作为视图，不是 Manifest 字段：

| 产品词汇 | 数据来源 |
| --- | --- |
| `catalogued` | accepted Manifest 存在且 provenance 未撤销 |
| `detected` | discoverable/lifecycle candidate 或 evidence；必须展示证据强度 |
| `installed` | `lifecycle.installed` |
| `launchable` | `support.launchable` |
| `connectable` | `support.connectable` |
| `coordinatable` | `support.coordinatable` |

`observable` 保留为独立 facet；UI 可以组合展示，但不得丢失原始 assessment 或把 unknown 展示为支持。

## 7. InstallPlan Schema

### 7.1 根字段

| 字段 | 类型 | 必需 | 约束 |
| --- | --- | --- | --- |
| `schema` | string | 是 | 固定 `niuma.install-plan` |
| `schemaVersion` | semver string | 是 | 当前 `0.1.0` |
| `lifecycle` | enum | 是 | `draft / distributed / accepted / revoked` |
| `planId` | string | 是 | 全局唯一，版本间稳定 |
| `planVersion` | semver string | 是 | 单调递增 |
| `agentId` | string | 是 | 必须等于 Manifest `agentId` |
| `manifestVersionRange` | semver range | 是 | 执行前锁定具体版本 |
| `method` | enum | 是 | `package-manager / official-installer / official-guidance / existing-install` |
| `platform` | PlatformSelector | 是 | v0.1 为 Windows + architecture |
| `sourceArtifacts` | InstallArtifact[] | 是 | guidance/existing-install 可以为空；其他方法至少一项 |
| `preconditions` | Precondition[] | 是 | 每项有失败结果 |
| `permissions` | PermissionManifest | 是 | 全部显式声明 |
| `steps` | InstallStep[] | 是 | 至少一项，DAG 无环，ID 唯一 |
| `successEvidence` | EvidenceRequirement[] | 是 | 必须包含 `lifecycle.installed` |
| `failurePolicy` | FailurePolicy | 是 | 停止、恢复和人工处理规则 |
| `cancellationPolicy` | CancellationPolicy | 是 | 取消边界与补偿规则 |
| `journalPolicy` | JournalPolicy | 是 | 原子写入、脱敏和恢复 |
| `provenance` | ManifestProvenance | 是 | 来源与作者 |
| `integrity` | DocumentIntegrity | 是 | 遵循 3.3 |
| `extensions` | object | 否 | 仅命名空间扩展 |

### 7.2 InstallArtifact

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `artifactId` | string | 是 | Plan 内唯一 |
| `sourceRef` | string | 是 | 指向 Manifest official source |
| `uri` | HTTPS URI | 是 | 禁止 HTTP、data、javascript、UNC 与隐式重定向 |
| `publisherId` | string | 是 | 必须与 Manifest 一致或有受信委托证据 |
| `version` | string | 是 | 禁止 `latest` 作为执行锁定版本 |
| `sizeBytes` | positive integer | 是 | 下载前展示并限制 |
| `sha256` | string | 是 | 64 位小写 hex；下载后、执行前验证 |
| `signature` | SignatureRequirement \| null | 是 | 声明时必须验证；null 不可冒充已签名 |
| `license` | LicenseDeclaration | 是 | SPDX 或明确的 proprietary 标识及 URL |

### 7.3 Preconditions 与结果要求

`Precondition`：

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `preconditionId` | string | 是 | Plan 内唯一 |
| `kind` | enum | 是 | `platform-match / disk-space / source-reachable / policy-allowed / existing-path-selected` |
| `parameters` | object | 否 | 只允许 kind 对应的结构字段 |
| `onFailure` | enum | 是 | `stop-rejected / stop-unknown / request-user-decision` |

`EvidenceRequirement`：

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `subject` | string | 是 | 根 success 必须含 `lifecycle.installed`；step 可以使用 `candidate.*` |
| `assessment` | enum | 是 | 成功要求固定 `verified` |
| `evidenceKinds` | enum[] | 否 | 缺失时继承对应 Manifest requirement |

`StepEffect`：

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `kind` | enum | 是 | 必须映射到 PermissionManifest 的一项 |
| `scopeRef` | string | 否 | 引用已声明 path/host/process/service scope |
| `reversible` | boolean | 否 | 写入效果必须出现；false 时需 destructive consent |

### 7.4 PermissionManifest

每一项都必须出现；未声明等于禁止：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `network` | `{ required, hosts[], purposes[] }` | 只允许列出的 HTTPS host 和目的 |
| `elevation` | `{ required, reason, promptStepId }` | 提权必须单独确认；`required=true` 时 reason 不得为空 |
| `filesystemReads` | PathScope[] | 精确目录/文件及目的 |
| `filesystemWrites` | PathScope[] | 写入、创建、覆盖、删除分开声明 |
| `pathMutation` | `{ required, scope, previousValueCapture }` | 修改 PATH 必须保存旧值 |
| `shellProfileMutation` | `{ required, files[], previousValueCapture }` | 默认禁止 |
| `serviceChanges` | ServiceEffect[] | 安装、启动、停止、删除分别声明 |
| `processLaunches` | ProcessEffect[] | 精确 executable identity 与 args 模板 |
| `credentialAccess` | `{ required, kinds[] }` | v0.1 InstallPlan 不允许明文凭据 |

任一实际效果超出 PermissionManifest 必须在效果发生前停止，并记录 `undeclared-effect`。不得动态扩权后继续同一次 run。

`PathScope` 必须包含 `scopeId`、`locationKind`（`exact-file / exact-directory / user-selected / hub-data`）、`path`（user-selected 时为 null）、`operations[]` 与 `purpose`。禁止 `..`、未解析环境变量、目录根和无界 glob。

`ServiceEffect` 必须包含精确 `serviceName`、`operation`（`install / start / stop / remove`）、`purpose`、`reversible` 与 `confirmation`。

`ProcessEffect` 必须包含 `executableId`、`argsTemplate[]`、`purpose`、`requiresElevation` 与 `confirmation`；不得包含 raw command line 或 shell metacharacter expansion。

### 7.5 InstallStep

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `stepId` | string | 是 | Plan 内唯一、稳定 |
| `kind` | enum | 是 | 见下表 |
| `dependsOn` | string[] | 是 | 必须存在且无环 |
| `inputRefs` | string[] | 是 | 只能引用已声明 artifact/evidence/用户输入 |
| `effects` | StepEffect[] | 是 | 读取也要声明；不得用自由文本代替 |
| `confirmation` | enum | 是 | `none / plan-consent / separate-elevation / separate-destructive` |
| `cancellability` | enum | 是 | `before-start / cooperative / non-interruptible` |
| `timeoutSeconds` | positive integer | 是 | 不含用户等待时间 |
| `idempotency` | enum | 是 | `safe-repeat / check-before-repeat / never-repeat` |
| `compensationStepIds` | string[] | 是 | 可以为空；有需恢复的机器副作用时不得为空。仅原子写入本次 run 的 journal/evidence 且保留 last-known-good 时可为空 |
| `successEvidence` | EvidenceRequirement[] | 是 | 结构化判定，不得只看 exit code |
| `auditEventKinds` | string[] | 是 | 至少 start/finish/failure |

允许的 `kind`：

- `collect-user-selection`
- `inspect-existing-install`
- `resolve-package-version`
- `download-official-artifact`
- `verify-artifact-hash`
- `verify-publisher-signature`
- `request-plan-consent`
- `request-elevation-consent`
- `invoke-package-manager`
- `invoke-official-installer`
- `open-official-guidance`
- `verify-primary-executable`
- `verify-installed-version`
- `record-installation-evidence`
- `restore-previous-state`
- `remove-partial-artifact`

禁止 `shell`、`powershell-script`、`cmd-string`、任意脚本下载执行和未登记 plugin step。进程参数必须是结构化 string array，禁止 `shell=true` 和拼接整条命令。

### 7.6 失败、取消与 Journal Policy

`FailurePolicy`：

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `defaultAction` | enum | 是 | 固定 `stop`；v0.1 不支持忽略错误 |
| `recoverOnPartialEffect` | boolean | 是 | 有部分可逆效果时必须 true |
| `manualDecisionOnUnknown` | boolean | 是 | 必须 true |

`CancellationPolicy`：

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `startNoNewNormalStep` | boolean | 是 | 必须 true |
| `runAuthorizedCompensation` | boolean | 是 | 必须 true |
| `preserveJournal` | boolean | 是 | 必须 true |

`JournalPolicy`：

| 字段 | 类型 | 必需 | 规则 |
| --- | --- | --- | --- |
| `atomicWrite` | boolean | 是 | 必须 true |
| `hashChain` | boolean | 是 | 必须 true |
| `lastKnownGood` | boolean | 是 | 必须 true |
| `redactSecrets` | boolean | 是 | 必须 true |

### 7.7 执行状态机

InstallPlan 本身没有运行状态。实现若执行，必须建立独立 InstallRunJournal：

```text
created
  -> validating
  -> awaiting-plan-consent
  -> ready
  -> running
  -> succeeded
       or failed -> recovering -> recovered | recovery-failed
       or cancelling -> cancelled | recovering
```

- 任意 schema、来源、权限或完整性失败在 `validating` 终止，零安装副作用。
- `awaiting-plan-consent` 必须展示 source、publisher、锁定版本、命令/步骤、下载大小、目标目录、网络、提权、PATH、shell profile、service 和恢复能力。
- 用户同意只对当前 `planId + planVersion + manifestVersion + artifact digest + effects digest` 有效；任何一项改变都要重新同意。
- `succeeded` 只在全部 required step 完成且 `lifecycle.installed` EvidenceRecord verified 后成立。下载、installer exit 0、窗口出现或目录存在都不能单独成功。
- 取消后不得启动新 normal step；仅允许已授权的 compensation/recovery step。
- `non-interruptible` step 必须在开始前单独展示；取消请求在安全点生效并保留审计。
- Hub 崩溃或重启后，只能重放 `safe-repeat`，或先检查后处理 `check-before-repeat`；`never-repeat` 必须进入人工决定或恢复，不能猜测已完成。

### 7.8 审计与恢复

- Journal 每条记录包含 `runId`、`sequence`、`timestamp`、`planDigest`、`stepId`、事件、结果、效果摘要和前一条 hash；不得写 token、cookie、完整 env、raw command line 或用户文件内容。
- Journal 使用临时文件 + fsync + 原子替换，并保留 last-known-good；损坏时进入 `recovery-failed`，不得继续安装。
- 每个可逆写入必须在写入前捕获 previous state digest 和恢复位置；无法捕获时必须标记 irreversible 并要求单独确认。
- 恢复不得删除 Manifest 未声明的用户文件，不得撤销其他安装程序在本 run 之外的修改。
- 安装失败、取消与恢复结果不改变 Connector policy，也不自动启动或登录 Agent。

## 8. 合同有效示例

以下 Kimi 样本是**结构有效的 draft**。它冻结身份和 existing-install 检查计划，但因为发布者、签名和 artifact digest 尚未成为 verified evidence，不授予任何支持 facet，也不能产生 installed verified。

```json
{
  "manifest": {
    "schema": "niuma.agent-manifest",
    "schemaVersion": "0.1.0",
    "lifecycle": "draft",
    "manifestId": "manifest:kimi",
    "manifestVersion": "0.1.0",
    "agentId": "kimi",
    "identityKey": "agent:kimi",
    "displayName": "Kimi",
    "publisher": {
      "publisherId": "moonshot-ai",
      "displayName": "Moonshot AI",
      "verification": "unknown",
      "evidenceRefs": []
    },
    "legacyAgentIds": [],
    "supersedesAgentIds": [],
    "platforms": [{
      "os": "windows",
      "architectures": ["x64"],
      "minOsVersion": null,
      "maxOsVersion": null,
      "distributionKinds": ["desktop"]
    }],
    "officialSources": [],
    "hostExecutables": [
      {
        "executableId": "kimi.desktop.windows.primary",
        "role": "primary",
        "surface": "desktop",
        "fileNameAliases": ["Kimi.exe"],
        "productNameAliases": ["Kimi"],
        "publisherSignature": null,
        "artifactSha256": [],
        "pathHints": ["%LOCALAPPDATA%\\Programs\\kimi-desktop\\Kimi.exe"],
        "requiredForInstalled": true,
        "requiredForRunning": true
      },
      {
        "executableId": "kimi.desktop.windows.webbridge",
        "role": "helper",
        "surface": "bridge",
        "fileNameAliases": ["kimi-webbridge.exe"],
        "productNameAliases": ["Kimi WebBridge"],
        "publisherSignature": null,
        "artifactSha256": [],
        "pathHints": ["%USERPROFILE%\\.kimi-webbridge\\bin\\kimi-webbridge.exe"],
        "requiredForInstalled": false,
        "requiredForRunning": false
      }
    ],
    "connectorBindings": [],
    "installPlanRefs": [{
      "planId": "install:kimi:windows:existing",
      "versionRange": ">=0.1.0 <0.2.0",
      "platform": { "os": "windows", "architecture": "x64" }
    }],
    "supportRequirements": [
      { "facet": "discoverable", "evidenceKinds": ["file-inspection", "signature"] },
      { "facet": "installable", "evidenceKinds": ["install-plan-review"] },
      { "facet": "launchable", "evidenceKinds": ["process-proof", "window-proof"] },
      { "facet": "connectable", "evidenceKinds": ["adapter-session"] },
      { "facet": "observable", "evidenceKinds": ["adapter-session"] },
      { "facet": "coordinatable", "evidenceKinds": ["adapter-session", "install-run"] }
    ],
    "provenance": {
      "authoredBy": "niuma-hub-r0-contract",
      "createdAt": "2026-07-18T00:00:00.000Z",
      "sourceEvidenceRefs": ["local-observation:kimi:windows:2026-07-18"]
    },
    "integrity": {
      "algorithm": "sha256",
      "documentSha256": null,
      "signature": null
    }
  },
  "installPlan": {
    "schema": "niuma.install-plan",
    "schemaVersion": "0.1.0",
    "lifecycle": "draft",
    "planId": "install:kimi:windows:existing",
    "planVersion": "0.1.0",
    "agentId": "kimi",
    "manifestVersionRange": ">=0.1.0 <0.2.0",
    "method": "existing-install",
    "platform": { "os": "windows", "architecture": "x64" },
    "sourceArtifacts": [],
    "preconditions": [{
      "preconditionId": "windows-x64",
      "kind": "platform-match",
      "onFailure": "stop-unknown"
    }],
    "permissions": {
      "network": { "required": false, "hosts": [], "purposes": [] },
      "elevation": { "required": false, "reason": "", "promptStepId": null },
      "filesystemReads": [{
        "scopeId": "selected-primary",
        "locationKind": "user-selected",
        "path": null,
        "operations": ["read-metadata"],
        "purpose": "inspect-existing-install"
      }],
      "filesystemWrites": [{
        "scopeId": "hub-agent-evidence",
        "locationKind": "hub-data",
        "path": "agent-data/evidence",
        "operations": ["create", "replace"],
        "purpose": "record-evidence"
      }],
      "pathMutation": { "required": false, "scope": null, "previousValueCapture": false },
      "shellProfileMutation": { "required": false, "files": [], "previousValueCapture": false },
      "serviceChanges": [],
      "processLaunches": [],
      "credentialAccess": { "required": false, "kinds": [] }
    },
    "steps": [
      {
        "stepId": "select-primary",
        "kind": "collect-user-selection",
        "dependsOn": [],
        "inputRefs": ["kimi.desktop.windows.primary"],
        "effects": [{ "kind": "read-user-selected-file", "scopeRef": "selected-primary" }],
        "confirmation": "plan-consent",
        "cancellability": "before-start",
        "timeoutSeconds": 300,
        "idempotency": "safe-repeat",
        "compensationStepIds": [],
        "successEvidence": [{ "subject": "candidate.primary-selected", "assessment": "verified" }],
        "auditEventKinds": ["step-started", "step-succeeded", "step-failed"]
      },
      {
        "stepId": "verify-primary",
        "kind": "verify-primary-executable",
        "dependsOn": ["select-primary"],
        "inputRefs": ["kimi.desktop.windows.primary"],
        "effects": [{ "kind": "read-file-metadata", "scopeRef": "selected-primary" }],
        "confirmation": "none",
        "cancellability": "cooperative",
        "timeoutSeconds": 30,
        "idempotency": "safe-repeat",
        "compensationStepIds": [],
        "successEvidence": [{ "subject": "candidate.primary-identity", "assessment": "verified" }],
        "auditEventKinds": ["step-started", "step-succeeded", "step-failed"]
      },
      {
        "stepId": "record-installation",
        "kind": "record-installation-evidence",
        "dependsOn": ["verify-primary"],
        "inputRefs": ["candidate.primary-identity"],
        "effects": [{
          "kind": "write-hub-evidence",
          "scopeRef": "hub-agent-evidence",
          "reversible": true
        }],
        "confirmation": "none",
        "cancellability": "cooperative",
        "timeoutSeconds": 10,
        "idempotency": "check-before-repeat",
        "compensationStepIds": [],
        "successEvidence": [{ "subject": "lifecycle.installed", "assessment": "verified" }],
        "auditEventKinds": ["step-started", "step-succeeded", "step-failed"]
      }
    ],
    "successEvidence": [{ "subject": "lifecycle.installed", "assessment": "verified" }],
    "failurePolicy": {
      "defaultAction": "stop",
      "recoverOnPartialEffect": true,
      "manualDecisionOnUnknown": true
    },
    "cancellationPolicy": {
      "startNoNewNormalStep": true,
      "runAuthorizedCompensation": true,
      "preserveJournal": true
    },
    "journalPolicy": {
      "atomicWrite": true,
      "hashChain": true,
      "lastKnownGood": true,
      "redactSecrets": true
    },
    "provenance": {
      "authoredBy": "niuma-hub-r0-contract",
      "createdAt": "2026-07-18T00:00:00.000Z",
      "sourceEvidenceRefs": ["local-observation:kimi:windows:2026-07-18"]
    },
    "integrity": {
      "algorithm": "sha256",
      "documentSha256": null,
      "signature": null
    }
  }
}
```

该样本合法但保持 fail-closed：`verify-primary` 若没有签名或 artifact digest 强证据，只能得到 candidate/unknown，最后一步不得输出 installed verified，run 不能 succeeded。

## 9. 无效示例

### 9.1 无效 Manifest：自行授予支持并模糊匹配进程

```json
{
  "schema": "niuma.agent-manifest",
  "schemaVersion": "0.1.0",
  "agentId": "MiniMax",
  "identityKey": "minimax",
  "displayName": "MiniMax",
  "supportLevel": "coordinatable",
  "hostExecutables": [{
    "executableId": "minimax-any",
    "fileNameAliases": ["*minimax*", "node.exe"]
  }],
  "connectorBindings": [{
    "connectorId": "minimax",
    "enabledByDefault": true
  }]
}
```

必须拒绝：`agentId` 非小写 canonical、`identityKey` 错误、缺失必需字段、自授支持、模糊/通用进程匹配，并试图启用 Connector。

### 9.2 无效 InstallPlan：隐式提权、任意脚本和无恢复写入

```json
{
  "schema": "niuma.install-plan",
  "schemaVersion": "0.1.0",
  "planId": "install:workbuddy:unsafe",
  "planVersion": "0.1.0",
  "agentId": "workbuddy",
  "method": "official-installer",
  "permissions": {
    "elevation": { "required": false }
  },
  "steps": [{
    "stepId": "run",
    "kind": "powershell-script",
    "command": "iwr http://mirror.invalid/install.ps1 | iex",
    "effects": ["write anywhere", "change PATH"],
    "confirmation": "none",
    "compensationStepIds": []
  }],
  "successEvidence": [{ "subject": "download.finished", "assessment": "verified" }]
}
```

必须拒绝：非 HTTPS/未知镜像、下载执行脚本、未声明提权与 PATH 修改、自由文本效果、无独立确认、无 artifact hash/signature、无恢复，并把下载完成冒充 installed。

### 9.3 无效 Evidence：Kimi helper 冒充主程序和活跃任务

```json
{
  "schema": "niuma.agent-evidence",
  "schemaVersion": "0.1.0",
  "evidenceId": "evidence:kimi:webbridge-only",
  "agentId": "kimi",
  "subject": "lifecycle.active-task",
  "assessment": "verified",
  "sourceKind": "process-proof",
  "subjectIdentity": {
    "executableId": "kimi.desktop.windows.webbridge",
    "fileName": "kimi-webbridge.exe"
  },
  "facts": {
    "windowTitle": "Kimi",
    "inferredTask": "running"
  }
}
```

必须拒绝：helper 不能证明 primary running，process/window 不能证明 active-task，且缺失时间、evaluator、expiry、digest 和 Adapter Session 四元组。

## 10. 负向验收矩阵

| ID | 输入/场景 | 必须结果 | 禁止结果 |
| --- | --- | --- | --- |
| AI-N01 | 未知 `schema` 或 `schemaVersion=0.2.0` | 拒绝加载，零副作用 | 以 0.1 解释 |
| AI-N02 | 根对象出现拼错字段 `agentID` | 拒绝 | 忽略后继续 |
| AI-N03 | `agentId=MiniMax` 或 `identityKey=minimax` | 拒绝身份 | 自动小写/修正 |
| AI-N04 | 新版本把 `workbuddy` 改为 `genie-workbuddy` | 新身份 + 显式迁移决定 | 静默合并历史 |
| AI-N05 | Manifest 声明任一 support boolean/level | 拒绝 Manifest | 生成 verified facet |
| AI-N06 | `WorkBuddy.exe` basename 命中但无签名/hash | candidate/unknown | installed verified |
| AI-N07 | 仅发现 `kimi-webbridge.exe` | helper candidate | Kimi installed/running/active-task |
| AI-N08 | `node.exe`、`electron.exe` 或窗口标题包含 MiniMax | 忽略或 candidate unknown | MiniMax running verified |
| AI-N09 | PID 与 verified executable 不符或 PID 已重用 | running rejected/unknown | 沿用上次 running |
| AI-N10 | installed verified，但无当前进程证据 | running unknown | running/online |
| AI-N11 | primary 正在运行但无 Adapter Session | active-task unknown | busy/coordinating |
| AI-N12 | ConnectorBinding 存在但 policy pending/disabled | 保持不可执行 | 启用或授权 Connector |
| AI-N13 | unknown publisher、HTTP source 或 redirect 到未列 host | Plan validation 失败 | 下载 |
| AI-N14 | artifact hash/signature 不匹配 | 删除隔离的 partial artifact，失败关闭 | 执行 installer |
| AI-N15 | 实际效果超出 PermissionManifest | 效果前停止并审计 `undeclared-effect` | 动态扩权继续 |
| AI-N16 | 提权、PATH、shell profile 或 service 变化未单独确认 | 停止 | 复用通用 consent |
| AI-N17 | 用户在 queued/ready 取消 | 零后续 normal step，journal 保留 | 启动 installer |
| AI-N18 | 用户在 non-interruptible step 中取消 | 安全点转 cancelling/recovery | 强杀后声称 clean rollback |
| AI-N19 | 崩溃后遇到 `never-repeat` step 状态未知 | 人工决定或恢复 | 自动重跑 |
| AI-N20 | installer exit 0 但 primary/version 验证失败 | run failed/unknown | succeeded/installed |
| AI-N21 | Journal hash chain 损坏 | `recovery-failed` | 继续执行 |
| AI-N22 | Manifest/Plan integrity 变化但复用旧 consent | 要求重新确认 | 使用旧授权 |
| AI-N23 | 证据过期、冲突或 evaluator 未受信 | assessment unknown | 最近成功缓存 |
| AI-N24 | 多个 helper PID 命中同一 Agent | 聚合为一项 candidate | 多个 canonical Agent |
| AI-N25 | Plan 写 credential、raw env 或 raw command line 到 journal | 拒绝/脱敏失败 | 持久化敏感值 |
| AI-N26 | 安装成功后试图自动登录、启动任务或修改 Connector gate | 拒绝越界效果 | 执行外部 Agent |

## 11. 独立验收要求

独立 reviewer 必须确认：

1. WorkBuddy/Kimi/MiniMax 的 `agentId`、`identityKey`、`displayName` 与 executable identity 表完全一致。
2. 三个 `legacyAgentIds` 与 `connectorBindings` 均为空，且合同中没有任何可启用 Connector 的字段。
3. Kimi discovery 能形成可见的 unbound identity，但必须保持 `workstationConfigured=false / sessionId missing / isOnline=false / activeTask=false`；WorkBuddy/MiniMax 的既有工位绑定只能产生 `workstationConfigured=true / discovered`，不能产生 Connector 或 Session 状态。
4. 六个支持 facet 只有 requirements；Manifest 不能声明 configured、online、busy、Session、task 或 terminal result。
5. installed、running、active-task 各有独立 EvidenceRecord，任何一项都不能从另一项、进程名、窗口标题或 UI 文案推导。
6. Kimi webbridge、updater/installer/helper、通用 Electron/Node 进程不会冒充 primary。
7. InstallPlan 的网络、提权、文件、PATH、shell profile、service、process 和 credential 效果全部显式。
8. 所有 step 结构化、可审计、有 timeout、取消语义、幂等策略和必要恢复；不存在 raw shell script 入口。
9. success 只由安装后 primary/version 强验证产生，不由 download 或 exit code 产生。
10. 有效样本保持 unknown 而不越权，三个无效样本均能被矩阵中的确定规则拒绝。
11. 未知版本、未知字段、迁移失败、hash/signature 冲突、权限不足和 Journal 损坏全部失败关闭。

合同批次仍需通过控制卡规定的全量门禁与 exact-file diff audit；本文件单独通过不等于 Hub R0 或任何 Agent 接入完成。

## 12. 非目标

- 不实现进程、窗口、快捷方式、注册表、包管理器或文件系统发现。
- 不下载、安装、更新、卸载、启动、聚焦或停止 WorkBuddy、Kimi、MiniMax。
- 不定义或实现三者的 Adapter Capability、Session 日志/API、任务协议或错误归一化。
- 不增加 Connector 配置，不修改 machine policy，不申请授权，不执行外部 Agent。
- 不把现有静态牛马种子、快捷任务、头像、动画、音效或用户报告当作支持证据。
- 不创建通用应用商店、脚本/插件运行时、第三方镜像或静默后台服务。
- 不修改 README、控制舱、牛马场、DockView、主题、音效、Electron、preload、Runtime 或 UI。
- 不承诺现有本机 path hint、文件名或产品别名在其他机器、其他版本继续有效；变化必须以新 Manifest 版本和新证据处理。

## 13. 冻结结论

R0 v0.1 冻结三个 canonical Agent 身份：`workbuddy / WorkBuddy`、`kimi / Kimi`、`minimax / MiniMax`；冻结各自主 executable identity 与 Kimi webbridge helper 边界；冻结空 `connectorBindings`；冻结 Manifest 不自授支持以及 installed/running/active-task 三证据互不推导。

InstallPlan 只是一份版本化、结构化、可审计、可取消、可恢复的效果声明。只有未来实现通过独立证据验证，才可以改变机器事实或支持视图；本合同本身不会安装任何内容、不会启动任何 Agent，也不会开启任何 Connector。
