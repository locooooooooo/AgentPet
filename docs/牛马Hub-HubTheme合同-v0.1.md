# 牛马 Hub HubTheme 合同 v0.1

文档状态：R0 contract freeze candidate

合同身份：`niuma.hub-theme`

schema version：`1`

## 1. 目标与边界

`HubTheme` 是牛马 Hub 自身的声明式表现包。它可以提供颜色、密度、动效偏好和本地位图资产，但不能携带代码、访问网络、修改 Connector 权限、创建任务、改变 Session 真值或注入第三方应用。

R0 只冻结合同、校验、预览事务和恢复语义。主题导入器、主题编辑器、市场、素材和运行时切换属于 R3，不由本合同宣称完成。

## 2. 包与读取规则

- 包可以是只读目录或 `.niuma-theme` ZIP；解包必须先进入隔离临时目录。
- 根目录必须只有一个 `manifest.json`，所有资产必须由清单登记。
- 所有路径使用 `/`、相对包根目录、Unicode NFC；拒绝绝对路径、盘符、UNC、空段、`.`、`..`、反斜杠、NUL、符号链接和硬链接。
- R0 允许资产 MIME：`image/png`、`image/webp`、`image/avif`。禁止 HTML、CSS、SVG、字体、脚本、可执行文件和未知 MIME。
- 单文件最大 `8 MiB`，主题包解包后最大 `32 MiB`，最多 `64` 个文件；超限即拒绝，不做部分导入。
- 清单、实际文件集合、字节数和 SHA-256 必须完全一致；多余文件、缺失文件或 digest 错误均拒绝。

## 3. 根 schema

| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| `schema` | string | 是 | 固定 `niuma.hub-theme` |
| `schemaVersion` | integer | 是 | v0.1 固定 `1` |
| `themeId` | string | 是 | `^[a-z0-9][a-z0-9.-]{2,63}$`，全局稳定 |
| `displayName` | string | 是 | 1-64 个可见字符，不参与身份 |
| `version` | semver string | 是 | 不接受前导 `v` |
| `author` | Author | 是 | 作者和可选主页；主页只作文本，不在 Hub 内自动打开 |
| `compatibility` | Compatibility | 是 | 声明 Hub 版本范围和支持的 schema |
| `license` | License | 是 | SPDX、NOTICE 和逐资产来源 |
| `modes` | ThemeMode[] | 是 | 1-4 项，`modeId` 唯一 |
| `assets` | ThemeAsset[] | 是 | 可以为空；路径唯一 |
| `integrity` | Integrity | 是 | 清单规范化摘要与文件摘要 |

根对象和任意子对象禁止出现 `script`、`command`、`args`、`env`、`url`、`remote`、`connector`、`permission`、`enabledByDefault`、`task`、`session` 或 `online` 字段。`success` 只允许作为 `ThemeTokens` 的固定状态色 key，不能出现在其他对象。

### 3.1 Author

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `name` | string | 1-64 个可见字符 |
| `homepage` | string 或 null | 仅允许 `https`，不在预览或应用时请求 |

### 3.2 Compatibility

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `minHubVersion` | semver | 必填 |
| `maxHubVersion` | semver 或 null | 不小于 min；null 表示作者未声明上限，不表示永久兼容 |
| `schemaVersions` | integer[] | 必须精确包含 `1` |

### 3.3 License

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `spdx` | string | 有效 SPDX ID 或 `LicenseRef-*` |
| `notice` | string | 1-512 字符 |
| `assetSources` | record | key 为资产路径，value 为来源、作者、许可和本地取得日期 |

未登记来源的资产不得导出或分发。`LicenseRef-*` 必须有本地许可文本；“可下载/已购买/AI 生成”不等于可再分发。

### 3.4 ThemeMode

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `modeId` | string | `default` 或稳定小写 ID |
| `colorScheme` | enum | `dark / light / high-contrast` |
| `tokens` | ThemeTokens | 只允许表 3.5 的 key |
| `density` | enum | `compact / comfortable` |
| `motion` | enum | `system / reduced / standard`；用户 reduced-motion 永远优先 |
| `background` | object 或 null | 只引用已登记资产，包含 focal point 与 safe area |

### 3.5 ThemeTokens

允许的 token：

- 颜色：`canvas`、`surface`、`surfaceElevated`、`text`、`textMuted`、`border`、`accent`、`success`、`warning`、`danger`、`info`。
- 数值：`panelRadius`（0-8）、`controlRadius`（0-8）、`borderWidth`（1-2）、`spaceScale`（0.8-1.2）。

颜色只接受 `#RRGGBB` 或 `#RRGGBBAA`。不接受 `var()`、`url()`、CSS 函数、选择器、声明块或任意 CSS 文本。应用前必须检查正文/表面、正文/画布和交互态的对比度；普通文字低于 WCAG AA 时拒绝该 mode。

### 3.6 ThemeAsset 与 Integrity

`ThemeAsset` 必须包含 `path`、`role`、`mime`、`bytes`、`sha256`、`licenseRef`。`role` 只允许 `background / texture / ranch-environment / agent-decoration`。

`Integrity` 必须包含：

- `algorithm: "sha256"`。
- `manifestSha256`：移除该字段后按 UTF-8、对象 key 字典序、无多余空白规范化得到的摘要。
- `files`：资产路径到 SHA-256 的完整映射，必须与 `assets` 一致。

## 4. 兼容、迁移与派生状态

- 未知 `schema`、未知 `schemaVersion`、Hub 版本不在范围内或字段类型错误：`rejected`，不得尝试宽松解析。
- v1 reader 只读取 v1；迁移必须是 Hub 内置、纯函数、版本逐级且保留原包。主题包不能自带 migration script。
- `catalogued` 只表示清单通过基础解析；`validated` 还要求路径、MIME、大小、许可、digest、兼容和对比度全部通过；`previewing` 是内存事务；`applied` 必须有持久化成功与 UI 健康检查；声明本身不能自称 applied。
- 主题不能影响 Agent 支持等级、Connector gate、Task/Session、通知去重或声音策略。

## 5. 预览、应用与恢复事务

1. 读取到隔离目录并完成全部校验。
2. 建立只读内存 preview，不写 active theme，不播放业务声音，不产生 Runtime 事件。
3. Preview 最长 60 秒；取消、超时、窗口重载或校验漂移立即恢复当前 applied theme。
4. 用户明确应用后，先写 `pending` 文档，再原子替换 active profile，保留 last-known-good。
5. 应用后验证主窗口可渲染、关键控件可见、焦点可达、对比度通过且无页面级溢出；失败自动回滚并隔离坏包。
6. 启动时 active 包缺失、digest 漂移或连续两次渲染失败，直接加载内置默认主题；不得白屏循环。

Preview 和 rollback 只能改变表现配置，不写任务、Session、Connector、Agent、授权或审计结果。

## 6. 有效示例

<!-- contract-example:theme-valid -->
```json
{
  "schema": "niuma.hub-theme",
  "schemaVersion": 1,
  "themeId": "niuma.neon-workshop",
  "displayName": "霓虹工坊",
  "version": "1.0.0",
  "author": { "name": "NiuMa Hub", "homepage": null },
  "compatibility": { "minHubVersion": "0.1.0", "maxHubVersion": "0.9.0", "schemaVersions": [1] },
  "license": {
    "spdx": "MIT",
    "notice": "Theme tokens and the local background are licensed for redistribution.",
    "assetSources": {
      "assets/workshop.webp": { "source": "local-original", "author": "NiuMa Hub", "license": "MIT", "acquiredAt": "2026-07-18" }
    }
  },
  "modes": [
    {
      "modeId": "default",
      "colorScheme": "dark",
      "tokens": {
        "canvas": "#101216",
        "surface": "#191C22",
        "surfaceElevated": "#232832",
        "text": "#F4F7FB",
        "textMuted": "#A9B2C2",
        "border": "#3A4352",
        "accent": "#35D07F",
        "success": "#45C878",
        "warning": "#F0B84B",
        "danger": "#EF6B73",
        "info": "#66A8FF",
        "panelRadius": 6,
        "controlRadius": 5,
        "borderWidth": 1,
        "spaceScale": 1
      },
      "density": "compact",
      "motion": "system",
      "background": { "asset": "assets/workshop.webp", "focalPoint": [0.5, 0.45], "safeArea": [0.08, 0.08, 0.08, 0.12] }
    }
  ],
  "assets": [
    { "path": "assets/workshop.webp", "role": "background", "mime": "image/webp", "bytes": 1024, "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "licenseRef": "MIT" }
  ],
  "integrity": {
    "algorithm": "sha256",
    "manifestSha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "files": { "assets/workshop.webp": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }
  }
}
```

## 7. 无效示例

远程资产和脚本字段必须被拒绝：

<!-- contract-example:theme-invalid-remote -->
```json
{
  "schema": "niuma.hub-theme",
  "schemaVersion": 1,
  "themeId": "unsafe.remote",
  "displayName": "Unsafe",
  "version": "1.0.0",
  "author": { "name": "Unknown", "homepage": null },
  "compatibility": { "minHubVersion": "0.1.0", "maxHubVersion": null, "schemaVersions": [1] },
  "license": { "spdx": "MIT", "notice": "invalid", "assetSources": {} },
  "modes": [{ "modeId": "default", "colorScheme": "dark", "tokens": { "canvas": "url(https://example.invalid/a.png)" }, "density": "compact", "motion": "system", "background": null }],
  "assets": [{ "path": "https://example.invalid/a.png", "role": "background", "mime": "image/png", "bytes": 20, "sha256": "bad", "licenseRef": "MIT", "script": "run()" }],
  "integrity": { "algorithm": "sha256", "manifestSha256": "bad", "files": {} }
}
```

路径穿越和权限字段必须被拒绝：

<!-- contract-example:theme-invalid-privilege -->
```json
{
  "schema": "niuma.hub-theme",
  "schemaVersion": 1,
  "themeId": "unsafe.privilege",
  "displayName": "Unsafe",
  "version": "1.0.0",
  "author": { "name": "Unknown", "homepage": null },
  "compatibility": { "minHubVersion": "0.1.0", "maxHubVersion": null, "schemaVersions": [1] },
  "license": { "spdx": "MIT", "notice": "invalid", "assetSources": {} },
  "modes": [{ "modeId": "default", "colorScheme": "dark", "tokens": { "canvas": "#000000", "text": "#FFFFFF" }, "density": "compact", "motion": "system", "background": { "asset": "../secret.png", "focalPoint": [0.5, 0.5], "safeArea": [0, 0, 0, 0] } }],
  "assets": [{ "path": "../secret.png", "role": "background", "mime": "image/png", "bytes": 20, "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "licenseRef": "MIT" }],
  "connector": { "enabledByDefault": true },
  "integrity": { "algorithm": "sha256", "manifestSha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "files": { "../secret.png": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" } }
}
```

## 8. 负向验收矩阵

| ID | 输入 | 预期 |
| --- | --- | --- |
| HT-01 | 未知 schema/version | reject，active/LKG 不变 |
| HT-02 | 绝对路径、`..`、UNC、符号链接 | reject，隔离目录清理 |
| HT-03 | URL、HTML/CSS/SVG/JS/EXE 或未知 MIME | reject，网络请求 0 |
| HT-04 | 缺失/多余文件、bytes 或 SHA-256 不符 | reject，不能 preview |
| HT-05 | 未知 token、CSS 函数、低对比度 | reject 对应 mode；无可用 mode 则拒绝包 |
| HT-06 | 试图声明 Connector/Task/Session/权限字段 | reject，machine gate hash 不变 |
| HT-07 | preview 取消、超时或窗口重载 | 恢复 applied theme，Runtime 事件 0 |
| HT-08 | 应用后渲染/焦点/溢出健康检查失败 | 原子回滚 LKG，坏包隔离 |
| HT-09 | 启动时 active digest 漂移 | 加载内置默认主题，不白屏 |
| HT-10 | reduced-motion 用户偏好与包冲突 | 用户偏好获胜 |
| HT-11 | 许可或 assetSources 不完整 | 本地导入拒绝；不得导出/分发 |
| HT-12 | 压缩炸弹、文件数/体积超限 | 解包中止，临时资源释放 |

## 9. R0 完成定义

合同文档、有效/无效示例、自动负向检查和独立 exact-file review 全部通过，且 Connector machine gate 与运行时真值未改变，才可把 `HubTheme` R0 合同标记为 accepted。R3 产品能力仍需独立实现和视觉验收。
