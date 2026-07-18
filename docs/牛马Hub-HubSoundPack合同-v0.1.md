# 牛马 Hub HubSoundPack 合同 v0.1

文档状态：R0 contract freeze candidate

合同身份：`niuma.hub-sound-pack`

schema version：`1`

## 1. 目标与边界

`HubSoundPack` 是声明式本地音频包，负责把固定业务回执语义映射到本地音频资产，并提供 Agent 身份尾音。它不能改变事件状态、优先级、全局静音、安静时段、去重、聚合、频率限制或通知真值。

R0 只冻结合同、校验、预览隔离和恢复语义。播放引擎、音效编辑器、导入 UI、市场和音频素材属于 R3。

## 2. 包与读取规则

- 包可以是只读目录或 `.niuma-soundpack` ZIP；先解包到隔离临时目录，校验完成前不可播放。
- 根目录必须只有一个 `manifest.json`，每个音频文件必须由清单登记且 digest 匹配。
- 路径必须是包内 `/` 相对路径；拒绝绝对路径、盘符、UNC、`.`、`..`、反斜杠、NUL、符号链接和硬链接。
- 只允许 `audio/wav`、`audio/ogg`、`audio/mpeg`；禁止播放列表、视频、HTML、脚本、可执行文件和远程 URL。
- 单文件最大 `2 MiB`，解包总量最大 `24 MiB`，最多 `80` 个音频；超限即整体拒绝。
- 解码后时长必须与清单误差不超过 `50ms`；普通回执不超过 `850ms`，身份尾音不超过 `160ms`，preview 不超过 `2s`。
- 解码器失败、NaN/Infinity、空声道、异常采样率或峰值超过安全阈值时拒绝资产，不允许回退为任意系统命令。

## 3. 根 schema

| 字段 | 类型 | 必填 | 规则 |
| --- | --- | --- | --- |
| `schema` | string | 是 | 固定 `niuma.hub-sound-pack` |
| `schemaVersion` | integer | 是 | v0.1 固定 `1` |
| `packId` | string | 是 | `^[a-z0-9][a-z0-9.-]{2,63}$` |
| `displayName` | string | 是 | 1-64 个可见字符 |
| `version` | semver string | 是 | 稳定内容版本 |
| `author` | Author | 是 | 作者与可选 https 主页，应用时不联网 |
| `compatibility` | Compatibility | 是 | Hub/schema 范围 |
| `license` | License | 是 | SPDX、NOTICE、逐资产来源 |
| `eventSounds` | record | 是 | 六种固定业务语义到资产路径 |
| `identityTails` | record | 是 | 必须有 `default`，Agent ID 为可选覆盖 |
| `assets` | SoundAsset[] | 是 | 路径唯一、至少 7 项 |
| `integrity` | Integrity | 是 | 清单和全部文件 SHA-256 |

根对象和任意子对象禁止 `globalMute`、`quietHours`、`priority`、`rateLimit`、`aggregation`、`eventId`、`dedupe`、`volumeOverride`、`script`、`command`、`args`、`env`、`url`、`connector`、`task`、`session` 或 `enabledByDefault` 字段。`success` 只允许作为 `eventSounds` 的固定语义 key，不能出现在其他对象。

## 4. 固定语义与资产

### 4.1 eventSounds

必须且只能包含：

- `accepted`
- `success`
- `attention`
- `failure`
- `stopped`
- `recovered`

语义、优先级和默认播放策略由 Hub 的《牛马状态回执音效规范 v0.1》决定。音效包只选择音色，不能把 `failure` 映射成 success 事件，也不能新增自动播放事件。每个 key 引用一项 `role=event-head` 的资产。

### 4.2 identityTails

- `default` 必填，用于未知 Agent、删除的 Agent 和未登记 ID。
- 其他 key 必须是已登记的规范 Agent ID；未知 key 可以 catalogued，但应用前必须被 Hub registry 识别，否则忽略并审计。
- 每个 value 引用 `role=identity-tail` 资产。
- 身份尾音只跟随已决定播放的业务回执，不能独立触发声音或改变主语义。

### 4.3 SoundAsset

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `path` | string | 安全相对路径，唯一 |
| `role` | enum | `event-head / identity-tail` |
| `mime` | enum | `audio/wav / audio/ogg / audio/mpeg` |
| `bytes` | positive integer | 与实际文件一致，<=2 MiB |
| `durationMs` | positive integer | event <=850；tail <=160 |
| `sampleRate` | integer | `22050 / 44100 / 48000` |
| `channels` | integer | `1 / 2` |
| `integratedLufs` | number | `-30` 到 `-12`；不得通过包覆盖用户音量 |
| `truePeakDb` | number | 必须 `<= -1` |
| `sha256` | string | 64 位小写 hex |
| `licenseRef` | string | 对应 License/assetSources |

## 5. 用户策略优先级与事件真值

播放决策顺序固定：

```text
business event is trusted and new
-> eventId global dedupe
-> aggregation/rate limit
-> global mute
-> quiet hours / important-only
-> per-event setting
-> per-Agent setting
-> personality policy
-> resolve pack event head + identity tail
-> bounded playback
```

- 任一步拒绝播放，音效包不能覆盖。
- 同一 `eventId` 在控制舱、牧场、多窗口和重载后最多播放一次。
- stdout、heartbeat、进度、随机动画和 UI hover 默认无声，包不能登记这些事件。
- 历史完成事件在应用启动 hydration 时不播放。
- 未知 Agent 使用 `identityTails.default`；缺少 default 则整个包拒绝。
- 播放失败只影响声音，不能改变 Task/Session 终态或重复通知。

## 6. 兼容、迁移与派生状态

- 未知 schema/version、Hub 版本不兼容、类型错误、未知业务 event key：整体 `rejected`。
- v1 reader 不猜测未来字段；migration 必须是 Hub 内置纯函数并保留原包，包不能携带迁移脚本。
- `catalogued` 只表示清单可解析；`validated` 要求路径、资产、解码、响度、许可、digest 和兼容全部通过；`previewing` 是隔离 audition；`applied` 需要原子持久化和播放健康检查。
- 包中出现 global policy 或 Runtime 字段即拒绝，不以“忽略未知字段”处理。

## 7. Preview、应用与恢复

1. 全量校验和离线解码完成后才能 preview。
2. Preview 使用独立 `preview` channel、固定低音量上限、一次只播一个样本，不能创建业务 eventId、通知、Task、Session 或审计成功。
3. Preview 尊重全局 mute；用户主动试听可绕过 quiet hours，但 UI 必须明确是试听，且不能绕过系统音量。
4. 应用使用 pending -> atomic active -> last-known-good 事务；切换不重放历史事件。
5. 新包首个真实播放发生解码/设备错误时，声音降级为静默并回滚 LKG；业务状态继续正常。
6. 启动时 active 包缺失、digest 漂移或解码失败，加载内置默认包；默认包也失败则静默，不循环蜂鸣。

## 8. 有效示例

<!-- contract-example:sound-valid -->
```json
{
  "schema": "niuma.hub-sound-pack",
  "schemaVersion": 1,
  "packId": "niuma.quiet-workshop",
  "displayName": "安静工坊",
  "version": "1.0.0",
  "author": { "name": "NiuMa Hub", "homepage": null },
  "compatibility": { "minHubVersion": "0.1.0", "maxHubVersion": "0.9.0", "schemaVersions": [1] },
  "license": {
    "spdx": "CC0-1.0",
    "notice": "All included tones are original and distributable.",
    "assetSources": {
      "audio/accepted.ogg": { "source": "local-original", "author": "NiuMa Hub", "license": "CC0-1.0", "acquiredAt": "2026-07-18" },
      "audio/success.ogg": { "source": "local-original", "author": "NiuMa Hub", "license": "CC0-1.0", "acquiredAt": "2026-07-18" },
      "audio/attention.ogg": { "source": "local-original", "author": "NiuMa Hub", "license": "CC0-1.0", "acquiredAt": "2026-07-18" },
      "audio/failure.ogg": { "source": "local-original", "author": "NiuMa Hub", "license": "CC0-1.0", "acquiredAt": "2026-07-18" },
      "audio/stopped.ogg": { "source": "local-original", "author": "NiuMa Hub", "license": "CC0-1.0", "acquiredAt": "2026-07-18" },
      "audio/recovered.ogg": { "source": "local-original", "author": "NiuMa Hub", "license": "CC0-1.0", "acquiredAt": "2026-07-18" },
      "audio/default-tail.ogg": { "source": "local-original", "author": "NiuMa Hub", "license": "CC0-1.0", "acquiredAt": "2026-07-18" }
    }
  },
  "eventSounds": {
    "accepted": "audio/accepted.ogg",
    "success": "audio/success.ogg",
    "attention": "audio/attention.ogg",
    "failure": "audio/failure.ogg",
    "stopped": "audio/stopped.ogg",
    "recovered": "audio/recovered.ogg"
  },
  "identityTails": { "default": "audio/default-tail.ogg" },
  "assets": [
    { "path": "audio/accepted.ogg", "role": "event-head", "mime": "audio/ogg", "bytes": 4000, "durationMs": 110, "sampleRate": 44100, "channels": 1, "integratedLufs": -22, "truePeakDb": -3, "sha256": "1111111111111111111111111111111111111111111111111111111111111111", "licenseRef": "CC0-1.0" },
    { "path": "audio/success.ogg", "role": "event-head", "mime": "audio/ogg", "bytes": 5000, "durationMs": 320, "sampleRate": 44100, "channels": 1, "integratedLufs": -20, "truePeakDb": -3, "sha256": "2222222222222222222222222222222222222222222222222222222222222222", "licenseRef": "CC0-1.0" },
    { "path": "audio/attention.ogg", "role": "event-head", "mime": "audio/ogg", "bytes": 5000, "durationMs": 350, "sampleRate": 44100, "channels": 1, "integratedLufs": -20, "truePeakDb": -3, "sha256": "3333333333333333333333333333333333333333333333333333333333333333", "licenseRef": "CC0-1.0" },
    { "path": "audio/failure.ogg", "role": "event-head", "mime": "audio/ogg", "bytes": 6000, "durationMs": 430, "sampleRate": 44100, "channels": 1, "integratedLufs": -18, "truePeakDb": -2, "sha256": "4444444444444444444444444444444444444444444444444444444444444444", "licenseRef": "CC0-1.0" },
    { "path": "audio/stopped.ogg", "role": "event-head", "mime": "audio/ogg", "bytes": 4000, "durationMs": 180, "sampleRate": 44100, "channels": 1, "integratedLufs": -22, "truePeakDb": -3, "sha256": "5555555555555555555555555555555555555555555555555555555555555555", "licenseRef": "CC0-1.0" },
    { "path": "audio/recovered.ogg", "role": "event-head", "mime": "audio/ogg", "bytes": 5000, "durationMs": 270, "sampleRate": 44100, "channels": 1, "integratedLufs": -21, "truePeakDb": -3, "sha256": "6666666666666666666666666666666666666666666666666666666666666666", "licenseRef": "CC0-1.0" },
    { "path": "audio/default-tail.ogg", "role": "identity-tail", "mime": "audio/ogg", "bytes": 3000, "durationMs": 100, "sampleRate": 44100, "channels": 1, "integratedLufs": -24, "truePeakDb": -4, "sha256": "7777777777777777777777777777777777777777777777777777777777777777", "licenseRef": "CC0-1.0" }
  ],
  "integrity": {
    "algorithm": "sha256",
    "manifestSha256": "8888888888888888888888888888888888888888888888888888888888888888",
    "files": {
      "audio/accepted.ogg": "1111111111111111111111111111111111111111111111111111111111111111",
      "audio/success.ogg": "2222222222222222222222222222222222222222222222222222222222222222",
      "audio/attention.ogg": "3333333333333333333333333333333333333333333333333333333333333333",
      "audio/failure.ogg": "4444444444444444444444444444444444444444444444444444444444444444",
      "audio/stopped.ogg": "5555555555555555555555555555555555555555555555555555555555555555",
      "audio/recovered.ogg": "6666666666666666666666666666666666666666666666666666666666666666",
      "audio/default-tail.ogg": "7777777777777777777777777777777777777777777777777777777777777777"
    }
  }
}
```

## 9. 无效示例

远程音频和全局策略覆盖必须拒绝：

<!-- contract-example:sound-invalid-policy -->
```json
{
  "schema": "niuma.hub-sound-pack",
  "schemaVersion": 1,
  "packId": "unsafe.policy",
  "displayName": "Unsafe",
  "version": "1.0.0",
  "author": { "name": "Unknown", "homepage": null },
  "compatibility": { "minHubVersion": "0.1.0", "maxHubVersion": null, "schemaVersions": [1] },
  "license": { "spdx": "MIT", "notice": "invalid", "assetSources": {} },
  "eventSounds": { "accepted": "https://example.invalid/a.ogg", "success": "audio/a.ogg", "attention": "audio/a.ogg", "failure": "audio/a.ogg", "stopped": "audio/a.ogg", "recovered": "audio/a.ogg" },
  "identityTails": { "default": "audio/a.ogg" },
  "globalMute": false,
  "quietHours": null,
  "assets": [],
  "integrity": { "algorithm": "sha256", "manifestSha256": "bad", "files": {} }
}
```

路径穿越、缺少 fallback 和超长 tail 必须拒绝：

<!-- contract-example:sound-invalid-path -->
```json
{
  "schema": "niuma.hub-sound-pack",
  "schemaVersion": 1,
  "packId": "unsafe.path",
  "displayName": "Unsafe",
  "version": "1.0.0",
  "author": { "name": "Unknown", "homepage": null },
  "compatibility": { "minHubVersion": "0.1.0", "maxHubVersion": null, "schemaVersions": [1] },
  "license": { "spdx": "MIT", "notice": "invalid", "assetSources": {} },
  "eventSounds": { "accepted": "../a.ogg", "success": "../a.ogg", "attention": "../a.ogg", "failure": "../a.ogg", "stopped": "../a.ogg", "recovered": "../a.ogg" },
  "identityTails": {},
  "assets": [{ "path": "../a.ogg", "role": "identity-tail", "mime": "audio/ogg", "bytes": 20, "durationMs": 5000, "sampleRate": 44100, "channels": 1, "integratedLufs": -8, "truePeakDb": 0, "sha256": "bad", "licenseRef": "MIT" }],
  "integrity": { "algorithm": "sha256", "manifestSha256": "bad", "files": { "../a.ogg": "bad" } }
}
```

## 10. 负向验收矩阵

| ID | 输入 | 预期 |
| --- | --- | --- |
| HS-01 | 未知 schema/version 或未知 event key | reject，active/LKG 不变 |
| HS-02 | URL、绝对路径、`..`、UNC、链接 | reject，网络请求 0 |
| HS-03 | 非允许 MIME、解码失败、时长/采样率异常 | reject，不调用系统命令 fallback |
| HS-04 | 缺失/多余文件、bytes/digest 不符 | reject，不能 preview |
| HS-05 | 缺少六个 eventSounds 或 `identityTails.default` | reject |
| HS-06 | 包含 mute/quiet/priority/rate/dedupe/eventId 覆盖 | reject，全局策略 hash 不变 |
| HS-07 | 包含 Connector/Task/Session/权限字段 | reject，Runtime snapshot 不变 |
| HS-08 | 同一 eventId 从三个窗口到达 | 只播放一次 |
| HS-09 | stdout/heartbeat/历史 hydration | 播放 0 次 |
| HS-10 | global mute 或 quiet-hours 拦截 | 包不能覆盖，播放 0 次 |
| HS-11 | preview | 只走 preview channel，业务事件/通知/审计成功 0 |
| HS-12 | 新包真实播放失败 | 静默并回滚 LKG，Task/Session 不变 |
| HS-13 | 未知 Agent | 使用 default tail；没有 default 的包已拒绝 |
| HS-14 | 许可或 assetSources 不完整 | 本地导入拒绝；不得导出/分发 |
| HS-15 | 压缩炸弹、文件数/体积超限 | 解包中止，临时资源释放 |

## 11. R0 完成定义

合同文档、有效/无效示例、自动负向检查和独立 exact-file review 全部通过，且全局声音策略、Connector machine gate 与运行时真值未改变，才可把 `HubSoundPack` R0 合同标记为 accepted。R3 播放与切换能力仍需独立实现及听觉验收。
