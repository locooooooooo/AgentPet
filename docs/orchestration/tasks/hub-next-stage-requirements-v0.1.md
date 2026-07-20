# Hub Next-Stage Requirements v0.1

[PM]#hub-next-stage-requirements@v0.1
⟦tag:v2|task|hub-next-stage-requirements-v0.1⟧

loop state: standby
dispatch state: standby
status: decision_matrix_ready_for_user
date: 2026-07-18
priority: P0 planning

## single goal

冻结下一阶段唯一产品目标、需求 ID、非目标、里程碑依赖和退出条件，使后续实现按“3 Agent 生命周期 + 2 Headless Agent 真实依赖工作流”推进，而不是按页面或接入数量漂移。

## source of truth

- `docs/牛马Hub下一阶段需求与目标-v0.1-2026-07-18.md`

## readiness

- Lifecycle/Session P0.5 implementation, contracts, package and screenshot evidence exist in the current delivery; M1.1 read-only Agent Library is also packaged and verified.
- M0 still needs user-controlled OpenClaw setup, a complete P0-C authorization envelope or explicit defer decision, and product-input/full-UI-truth reconciliation for broader R0 closure. Theme/Sound contracts are exact-file reviewed at the contract boundary.
- No external execution worker is authorized by this planning card; M1.1 remains a bounded read-only projection and does not close full M1.

## next action

Close or explicitly defer the remaining M0 decisions, then open a separately fenced M1.2 lifecycle execution card for InstallPlan/version evidence and rollback closure.
