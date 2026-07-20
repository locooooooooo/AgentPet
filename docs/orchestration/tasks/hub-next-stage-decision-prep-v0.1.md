# Hub Next-Stage Decision Preparation v0.1

[长工]#hub-next-stage-decision-prep@v0.1
⟦tag:v2|task|hub-next-stage-decision-prep-v0.1⟧
loop state: active
dispatch state: active
status: implementation_in_progress_waiting_user_decision
priority: P0 planning

## goal

Reconcile the canonical Hub next-stage requirements with current code and evidence, then prepare one concise execute/defer decision matrix for the user.

## file fence

This is a read-only long-worker lane. It may inspect code, task cards, sessions, status and test outputs, but it may not edit product code, Connector gates, status truth or canonical requirements.

## required output

- Map M0 decisions: OpenClaw onboarding, P0-C authorization, Theme/Sound product-input reconciliation and full UI truth.
- Map M1/M2 exit conditions: executable Plan, three lifecycle rollback closures, two accepted Headless Adapters and one real dependency workflow.
- Distinguish already implemented/tested foundations from accepted product outcomes and real external evidence.
- Give the user explicit options with consequences. Do not choose a material user decision on the user's behalf.

## verification

- Reconcile `status.json`, `index.md`, the canonical Hub requirements and current task/session evidence.
- Run only read-only repository checks needed to prove the matrix.
- Report execute/defer options, blockers and stale-control discrepancies; do not claim acceptance.
