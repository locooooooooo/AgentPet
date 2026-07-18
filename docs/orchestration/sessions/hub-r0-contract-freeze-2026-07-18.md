# Hub R0 Contract Freeze Supervision - 2026-07-18

[PM]#weekly-requirements@2026-07-21
⟦tag:v2|session|hub-r0-contract-freeze-2026-07-18⟧

loop state: active
dispatch state: active
status: control_baseline_ready_for_commit
date: 2026-07-18
ddl: 2026-07-18

## single goal

Move Hub from untracked candidate documents to a governed R0 contract-freeze lane without accepting implementation or overwriting user-owned worktree changes.

## supervision callbacks

| Supervisor | Scope | Result | Key finding | Changed files |
| --- | --- | --- | --- | --- |
| `/root/hub_ui_status_audit` | Workspace truth versus synthetic UI semantics | completed | Physiological meters are removed, but avatar animation and status color still consume synthetic local runtime state; UI is not accepted | none |
| `/root/hub_contract_gap_audit` | Positioning, README, DockView and sound inputs | completed | All four formal contracts are missing; three product decisions and contract-specific negative tests are required | none |
| `/root/hub_orchestration_intake` | Truth source, control baseline and Owner split | completed after bounded follow-up | Reuse the two existing active lanes, write an eight-file control baseline and keep four contract files mutually exclusive | none |

No supervisor edited, staged, committed or pushed files. No supervisor ran an external Agent CLI or encountered `403 DAILY_LIMIT_EXCEEDED`.

## PM decisions

- Six support states are independent evidence facets, never a Manifest-authored maturity level.
- `accepted / success / attention / failure / stopped / recovered` is the canonical sound receipt vocabulary; view status labels cannot create receipts.
- Simulation and audition are isolated `preview` events with no Runtime, online, terminal or business-completion side effects.
- Existing Connector policy remains authoritative and every external execution gate stays closed.

## completed

- Re-read `docs/orchestration/index.md`, `status.json`, the active daily/weekly truth, scheduler closeout evidence and the five user-owned Hub candidate changes.
- Confirmed `HEAD == origin/main == b4789cb` and an empty Git index before this control edit.
- Collected all three formal read-only callbacks and independently reran the baseline orchestration check/report plus `git diff --check`.
- Frozen the four contract filenames, non-overlapping Owner fences, dependency order, negative-test expectations and full recurring gate set in `hub-r0-contract-freeze-v0.1.md`.

## incomplete

- This eight-file control baseline is not accepted until it passes recurring gates, is selectively committed and is pushed with remote parity.
- The four contract files do not yet exist.
- README, the three product documents and `NiuMaWorkspace.tsx` remain candidate changes, not accepted Hub R0 evidence.
- UI truth remains mixed: real Session labels coexist with synthetic local animation/status semantics.

## blockers

- No platform, Agent quota or contract file-fence blocker is currently known.
- Product implementation remains blocked by the missing four accepted contracts.
- UI acceptance remains blocked by synthetic business-state semantics outside the current docs-only fence.

## next action

1. Rerun the full control gates and exact eight-file diff review.
2. Selectively commit/push only the Hub R0 orchestration baseline and confirm remote parity.
3. Dispatch Wave A contract workers for AgentManifest + InstallPlan, HubTheme and HubSoundPack.
4. Independently accept AgentManifest + InstallPlan, then dispatch Adapter Capability as Wave B.
5. Cross-review all four contracts before any implementation lane opens.

## changed files

- `docs/orchestration/tasks/hub-r0-contract-freeze-v0.1.md`
- `docs/orchestration/sessions/hub-r0-contract-freeze-2026-07-18.md`
- `docs/orchestration/index.md`
- `docs/orchestration/status.json`
- `docs/orchestration/sessions/weekly-requirements-2026-07-21.md`
- `docs/orchestration/sessions/daily-plan-2026-07-17.md`
- `docs/orchestration/sessions/daily-supervision-2026-07-02.md`
- `docs/orchestration/tasks/daily-role-accountability-2026-07-02.md`
