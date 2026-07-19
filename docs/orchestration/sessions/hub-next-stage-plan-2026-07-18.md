# Hub Next-Stage Plan - 2026-07-18

[PM]#hub-next-stage-requirements@v0.1
⟦tag:v2|session|hub-next-stage-plan-2026-07-18⟧

loop state: standby
dispatch state: standby
status: m1_1_read_only_library_accepted_remaining_m0
date: 2026-07-18

## completed

- Consolidated the current Hub lifecycle, Session, scheduler, Connector and content-contract truth.
- Set one measurable next-stage goal: 3 verified lifecycle Agents, 2 accepted Headless Agents and 1 real dependency workflow.
- Defined HUB-LC, HUB-AD, HUB-WF, HUB-UX, HUB-PS and HUB-NF requirements with explicit acceptance.
- Sequenced M0 acceptance debt -> M1 Agent Library -> M2 real orchestration -> M3 workbench -> M4 personalization.
- M1.1 read-only Agent Library is now packaged and CDP verified; this does not close full M1 or permit external execution.

## blocked decisions

- User completes or defers OpenClaw onboarding.
- User provides the complete P0-C envelope or keeps Codex external execution disabled.
- Product inputs and full UI truth are reconciled before the broader R0 batch is closed.

## M1.1 acceptance boundary

- Six registered lifecycle candidates expose support level, version evidence, installed/running state, Connector readiness and evidence source/time.
- Unbound host facts remain discovery-only; process presence cannot self-grant installed, connectable or coordinatable.
- Full M1 remains gated on InstallPlan/version evidence and three lifecycle rollback closures; M2 remains gated on two accepted Headless Adapters and a real dependency workflow.

## evidence

- Canonical requirements: `docs/牛马Hub下一阶段需求与目标-v0.1-2026-07-18.md`.
- Current blocker remediation: `docs/orchestration/sessions/hub-blocker-remediation-2026-07-18.md`.
