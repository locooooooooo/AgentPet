# HubTheme Contract v0.1

[短工]#hub-theme-contract@v0.1
⟦tag:v2|task|hub-theme-contract-v0.1⟧

loop state: standby
dispatch state: standby
status: implemented_automated_verified_pending_independent_review
date: 2026-07-18
priority: R0

## single goal

冻结 `HubTheme` 声明式内容合同，使主题包可被版本化校验、隔离预览、原子应用和 last-known-good 回滚，同时绝不能执行代码或改变 Connector/Task/Session 真值。

## delivered

- Canonical contract: `docs/牛马Hub-HubTheme合同-v0.1.md`。
- Valid example、两份 invalid example、HT-01~HT-12 负向矩阵。
- `scripts/check-hub-content-contracts.mjs` 自动验证 schema、路径、MIME、digest、权限字段、示例和矩阵完整性。

## acceptance boundary

- 本卡只完成 R0 contract，不声明 R3 导入、预览、切换或 UI 已实现。
- 自动检查已通过；按 `hub-r0-contract-freeze-v0.1` 仍需独立 exact-file reviewer 后才可标记 accepted。
- Connector machine gate、Runtime 和产品 UI 不因本合同改变。
