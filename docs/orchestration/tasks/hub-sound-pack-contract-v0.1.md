# HubSoundPack Contract v0.1

[短工]#hub-sound-pack-contract@v0.1
⟦tag:v2|task|hub-sound-pack-contract-v0.1⟧

loop state: standby
dispatch state: standby
status: implemented_automated_verified_pending_independent_review
date: 2026-07-18
priority: R0

## single goal

冻结 `HubSoundPack` 声明式内容合同，使事件语义音和 Agent 身份尾音可被版本化校验、隔离试听和安全回滚，且音效包不能覆盖静音、安静时段、优先级、聚合、频率限制或 eventId 去重。

## delivered

- Canonical contract: `docs/牛马Hub-HubSoundPack合同-v0.1.md`。
- Valid example、两份 invalid example、HS-01~HS-15 负向矩阵。
- `scripts/check-hub-content-contracts.mjs` 自动验证 schema、路径、音频限制、digest、策略字段、fallback、示例和矩阵完整性。

## acceptance boundary

- 本卡只完成 R0 contract，不声明 R3 播放引擎、导入、切换或素材已实现。
- 自动检查已通过；按 `hub-r0-contract-freeze-v0.1` 仍需独立 exact-file reviewer 后才可标记 accepted。
- 全局声音策略、Connector machine gate、Runtime 和产品 UI 不因本合同改变。
