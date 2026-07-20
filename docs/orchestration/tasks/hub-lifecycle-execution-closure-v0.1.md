# Hub Lifecycle Execution Closure v0.1

[长工]#hub-lifecycle-execution-closure@v0.1
⟦tag:v2|task|hub-lifecycle-execution-closure-v0.1⟧
loop state: active
dispatch state: active
status: implementation_in_progress_awaiting_user_acceptance
priority: P0

## goal

Advance Hub Agent Lifecycle P0 from action smoke to a pure executable InstallPlan closure with rollback evidence, without machine effects.

## file fence

Allowed writes:

- `src/lib/installPlanExecutor.ts`
- `scripts/check-install-plan-executor.mjs`

All other files are read-only. Do not modify Connector gates, Electron IPC, UI, package files, the existing InstallPlan contract or the existing foundation modules.

## required behavior

- Accept only a reviewed Plan whose version/effect/consent binding is intact and whose steps form a valid DAG.
- Drive the existing pure InstallRunJournal through injected effects only; no process, registry, service, network, credential, elevation or filesystem effect.
- Expose deterministic install/update/repair/uninstall step results, cancellation safe points, reverse compensation and last-known-good recovery.
- Produce explicit `execution-ready`, `blocked`, `recovery-failed` and `partial-rollback` outcomes; never treat review-only as executable.
- Cover three independent lifecycle rollback scenarios in fixtures without calling a real Agent or installer.

## verification

- `node scripts/check-install-plan-executor.mjs`
- `npx.cmd tsc --noEmit --pretty false`
- `git diff --check` on the two fenced files
- No package, external execution or acceptance claim.
