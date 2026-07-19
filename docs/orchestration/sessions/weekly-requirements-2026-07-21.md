# weekly-requirements-2026-07-21

[PM]#weekly-requirements@2026-07-21
⟦tag:v2|session|weekly-requirements-2026-07-21⟧

loop state: active
dispatch state: active
status: active_hub_r0_contracts_reviewed

> **Original planning window**: 2026-07-21 through 2026-07-27
> **Compressed activation and DDL**: 2026-07-17
> **Administrator decision**: The later five-day plan and all DDLs are due today. This explicitly waives the W28 closeout date gate and the local scheduler-core phase dependency.
> **Hard boundary**: The waiver authorizes one local/fixture-only scheduler-core worker. It does not authorize P0-C, R0-3, external Agent CLI execution, Connector machine-gate changes or pointer input.

## single goal

- Preserve delivered truthful host presence at `04524e8`, preserve exact-file accepted Theme/SoundPack contracts, then reconcile product inputs and full UI truth while every external execution gate stays closed.

## accepted inputs

- W28 closeout candidate and seven non-blocking carry-over rows are frozen in `weekly-closeout-2026-07-20.md` under the administrator's full schedule waiver.
- Scheduler requirements, exact file fence and S-01 through S-16 fixtures were accepted in `realtime-p1-scheduler-intake-v0.1.md`; implementation plus R-01 through R-03 are accepted/pushed at `ccedb15`.
- Baseline before this transition is `HEAD == origin/main == a1637c1` with only unrelated user-owned `README.md` and `docs/牛马状态回执音效规范-v0.1.md` changes present.
- Current product implementation worker count is `0`; external Agent CLI spawn count is `0`.

## same-day development board

| Order | Requirement | Owner | DDL | Exit evidence |
| --- | --- | --- | --- | --- |
| 1 | W28 pre-closeout and carry-over freeze | `[监督]#w28-closeout-readiness@2026-07-17` | 2026-07-17 | Closeout candidate, seven non-blocking rows, fresh gates |
| 2 | W28 final control transition | `[PM]#weekly-closeout@2026-07-20` | 2026-07-17 | W28 summarized, next weekly truth active, pushed parity |
| 3 | Scheduler requirements acceptance | `[短工]#realtime-p1-scheduler-intake@v0.1` | 2026-07-17 | Exact contract, file fence, failure matrix and S-01 through S-16 |
| 4 | Scheduler-core implementation | `[长工]#realtime-p1-scheduler-core@v0.1` | 2026-07-17 | Accepted S-01 through S-16 plus R-01 through R-03; `ccedb15` |
| 5 | PM acceptance and publication | `[PM]#multi-agent-control@v0.1` | 2026-07-17 | Full recurring gates, selective integration, commit, push and remote parity complete |

## P0 requirement

- Implement only the contract in `realtime-p1-scheduler-intake-v0.1.md`.
- Keep global process concurrency fixed at `1` with no configuration UI.
- Keep one active task per Agent identity.
- Fail closed on unknown, self, duplicate and cyclic dependencies.
- Start timeout only after confirmed spawn; expose queue wait separately.
- Stop queued tasks without PID, kill or spawn and emit exactly one terminal event.
- Preserve normalized retry rules, redaction, persistence, restart recovery and terminal idempotency.

## incomplete after this slice

- P0-C real Codex Agent E2E remains authorization-required and unexecuted.
- Priority, starvation protection, recursive cancellation DAG and per-Connector quotas remain future P1 work.
- Trae Models readiness, Qoder headless API, pointer evidence and AgentPet review remain separate carry-over items.

## completed configurable-concurrency slice

- Single gap: runtime-internal immutable `maxGlobalActive` with default `1` and accepted range `1..4`.
- Same-Agent active limit remains `1`; unconfirmed close and recovery proof continue to reserve slots.
- Accepted implementation changed only `src/lib/connectorRuntime.ts`, `scripts/check-connector-scheduler.mjs` and the dated evidence session; unrelated shared-worktree files remained excluded.
- Product worker count returned to `0`; external Agent spawn stayed `0`, and no machine gate changed.
- Priority, aging/starvation, cancellation DAG, Connector quota, Electron/preload/UI and dynamic reconfiguration are non-goals.

## active Hub R0 contract-freeze slice

- The scheduler baseline remains accepted at `4508ce3`; Hub does not reopen scheduler behavior or external execution.
- `hub-r0-contract-freeze-v0.1.md` freezes three product decisions, four mutually exclusive contract files, Wave A/Wave B ordering and the negative-test acceptance gates.
- Existing README, positioning, DockView, sound and Workspace changes remain unaccepted candidate inputs and stay outside the control-baseline commit.
- Active control lanes remain `daily-supervision` and `weekly-requirements`; no third active implementation lane is introduced.
- DDL is 2026-07-18 for the control baseline and contract batch. Date compression does not waive review, recurring gates, exact staging or remote parity.

## accepted host-presence slice

- User priority moved to the missing real status for locally running WorkBuddy, Kimi and MiniMax. The smallest truthful slice is application-process presence only.
- AgentManifest + InstallPlan and Adapter Capability are independently accepted only for canonical identity and the presence/Session separation. Theme/SoundPack are exact-file accepted at the contract boundary; the full R0 batch remains open for product-input and full-UI-truth reconciliation.
- Current live evidence is Kimi discovered as one unbound application with 9 primary processes; WorkBuddy/MiniMax are not observed running. None contributes to online or busy.
- Electron control-cockpit replay visibly shows Kimi's process count, `Connector 0 · Codex Desktop 2`, and zero application tasks. Direct Windows capture remains unavailable, with isolated DevTools DOM/PNG used as the bounded fallback.
- External Agent spawn, Connector binding/enabling, task inference from process/window/log facts, installer work, DockView and theme/sound implementation remain zero/non-goals.
- Exact staged-snapshot gates passed and `04524e8` was pushed; local `HEAD`, `origin/main` and GitHub `main` match.

## accepted file history

The original minimum scheduler slice `ccedb15` used:

- `src/types.ts`
- `src/lib/connectorRuntime.ts`
- `scripts/check-connector-scheduler.mjs`
- `scripts/check-connector-runtime.mjs` only for the legacy `selectorHarness` / `tieHarness` concurrency conflict confirmed by PM
- `docs/orchestration/sessions/realtime-p1-scheduler-core-evidence-2026-07-17.md`

The configurable-concurrency slice `4508ce3` changed only `src/lib/connectorRuntime.ts`, `scripts/check-connector-scheduler.mjs` and `docs/orchestration/sessions/realtime-p1-scheduler-configurable-concurrency-evidence-2026-07-18.md`. Electron, UI/CSS, ranch, protected cockpit, package/config, Connector machine gates, README, Hub/DockView/sound/quota inputs and external Agent execution remained excluded.

## acceptance

- Product worker concurrency never exceeded one during either accepted scheduler slice.
- S-01 through S-16, R-01 through R-03 and C-01 through C-12 pass; configured global active/reserved limits `1..4` match exactly, same-Agent active/reserved remains `1`, external Agent CLI spawn is `0` and duplicate terminal count is `0`.
- Existing connector runtime, reattach, realtime truth, orchestration, Connector safety, lint, build and diff checks pass in the shared worktree and exact staged snapshot.
- PM independently reviews the diff and does not infer real Agent E2E from controlled local fixtures.

next action:
- Preserve `4508ce3`, `2a2f7f5` and delivered presence commit `04524e8`; preserve the exact-file contract review and open only a separately fenced reconciliation or M1 lifecycle card after remaining M0 decisions.

summary:
- Next-stage requirements now preserve the delivered presence slice and exact-file accepted content contracts. The full R0 batch remains incomplete until product-input and separate UI truth acceptance pass; every external execution gate stays closed.
