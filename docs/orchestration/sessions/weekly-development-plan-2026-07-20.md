# Weekly Development Plan - 2026-07-20

[PM]#weekly-development-plan@2026-07-20
⟦tag:v2|session|weekly-development-plan-2026-07-20⟧
loop state: active
dispatch state: active
status: implemented_tested_awaiting_user_acceptance
date: 2026-07-20
time gate: none

## one goal

- Turn the accepted read-only Agent Library, InstallPlan review gate and version evidence into a fail-closed execution and Adapter-admission foundation, then open real two-Agent orchestration only if two Headless Adapters earn acceptance with fresh authorized evidence.

## live baseline

- Git baseline is `1a6040e`; local `main`, `origin/main` and remote `main` matched before this plan.
- M1.1 Agent Library, M1.2 review-only InstallPlan and M1.3 version evidence are implemented, tested and packaged-verified.
- Trae `2.3.55932`, WorkBuddy `5.2.5`, Qoder `1.15.1` and MiniMax `3.0.51.82` have verified registered-candidate version evidence.
- Kimi `3.1.2` is unbound discovery evidence only; installed state and publisher/artifact/document/signature trust remain unknown.
- The latest verified package is `release/desktop-ranch-win-unpacked-20260719-212416/桌面牧场.exe`.
- No executable InstallPlan is accepted, three lifecycle rollback closures remain open, no Headless Adapter is accepted, and no real dual-Agent dependency workflow is accepted.
- External Agent execution count for this planning transition is `0`; Connector machine gates remain unchanged and disabled.

## planning decisions

- Kimi InstallPlan execution is deferred until publisher, artifact, document and signature trust are independently resolved.
- OpenClaw install/auth remains outside the weekly critical path until the user completes the official risk and authentication flow.
- Qoder is excluded from the two-Adapter acceptance count until an independent Headless API exists.
- Codex is the primary conditional Adapter candidate. Trae is the second conditional candidate only after non-secret Models configuration and a fresh authorized smoke.
- DockView expansion, Theme/SoundPack product implementation, transparent ranch pointer acceptance and broad UI redesign are not this week's development lanes.

## combined implementation batch

All work below belongs to one combined weekly batch. Calendar order, DDL and per-day entry gates are removed.

| Owner | Scope | File fence | Worker exit |
| --- | --- | --- | --- |
| `[长工]#hub-adapter-capability@v0.1` | Pure fail-closed Adapter Capability admission evaluator | `src/lib/adapterCapability.ts`; `scripts/check-adapter-capability.mjs` | Implementation and targeted fixtures complete; not accepted |
| `[长工]#hub-install-run-core@v0.1` | Pure InstallRunJournal, cancellation, compensation and recovery core | `src/lib/installRunJournal.ts`; `scripts/check-install-run-journal.mjs` | Implementation and targeted fixtures complete; not accepted |
| `[长工]#hub-dependency-workflow-core@v0.1` | Pure two-Agent dependency, cancellation propagation and audit-correlation core | `src/lib/dependencyWorkflow.ts`; `scripts/check-dependency-workflow.mjs` | Implementation and targeted fixtures complete; not accepted |
| `[长工]#hub-runtime-foundation-integration@v0.1` | Integrate the three completed foundations with existing runtime boundaries | Separate fence set after the three foundation callbacks | Integrated implementation and regression evidence complete; not accepted |

The first three long workers run in parallel because their write fences do not overlap. The integration long worker starts when all three foundation callbacks and diffs are available; this is a code dependency, not a date or PM acceptance gate.

Foundation callback state:

- Adapter Capability: `implemented_tested_awaiting_user_acceptance`.
- InstallRun core: `implemented_tested_awaiting_user_acceptance`.
- Dependency workflow core: `implemented_tested_awaiting_user_acceptance`.
- Hub execution coordinator integration: `implemented_tested_awaiting_user_acceptance`.
- Manager independent replay: all three targeted matrices and full TypeScript check pass; external execution remains `0`.

Combined verification state:

- Adapter, InstallRun, dependency workflow and coordinator matrices pass.
- `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd run realtime:truth-check`, `npm.cmd run orchestration:connector-safety` and `npm.cmd run orchestration:check` pass.
- External Agent/Connector/process/filesystem/registry/service/network/credential/elevation effects from this batch: `0`.
- No Windows package, packaged smoke, PM acceptance or acceptance session was produced.
- Eight implementation files are ready for one combined user review; real Agent execution evidence remains separate and unverified.

## active P0 long-worker batch

| Owner | P0 slice | Mode | File fence / output |
| --- | --- | --- | --- |
| `[长工]#p0-c-authorization-prep@v0.1` | P0-C Codex E2E readiness | Read-only preparation | Current authorization envelope and exact blockers; no CLI execution |
| `[长工]#hub-lifecycle-execution-closure@v0.1` | Lifecycle executable Plan and rollback closure | Pure implementation | `src/lib/installPlanExecutor.ts`; `scripts/check-install-plan-executor.mjs` |
| `[长工]#hub-next-stage-decision-prep@v0.1` | M0/M1/M2 execute-or-defer decision | Read-only preparation | User decision matrix; no control-plane rewrite |
| `[长工]#hub-session-dockview-d0@v0.1` | Session View P0.5 / DockView D0 | Bounded UI/model implementation | `src/lib/dockViewRegistry.ts`; `src/components/NiuMaWorkspace.tsx`; `src/index.css`; `scripts/check-dock-view-d0.mjs` |

These four P0 workers are dispatched as one batch. Authorization and user decisions remain user-owned gates, not schedule gates. No worker performs package acceptance; all callbacks return to one combined user review.

P0 callback state:

- P0-C: `ready_for_user_authorization`; exact Codex-only read-only envelope prepared, external spawn remains `0`.
- Lifecycle execution closure: `implemented_tested_awaiting_user_acceptance`; pure executor matrix and three rollback fixture classes pass, real machine evidence remains open.
- Next-stage decision preparation: `decision_matrix_ready_for_user`; execute/defer options are prepared without substituting user decisions.
- Session View DockView D0: `implemented_tested_awaiting_user_acceptance`; D0 registry/layout, Session truth, TypeScript and build checks pass, while D1-D4 remain open.

## external execution boundary

- Codex P0-C, Trae smoke and OpenClaw risk/auth are not time gates. They are external execution permissions and remain closed until their exact prerequisites are supplied.
- Long workers may implement and test local contracts without executing Codex, Trae, Qoder, OpenClaw or any other external Agent.
- Real Connector evidence and real lifecycle rollback rows remain `unverified` until separately authorized execution occurs; local fixtures cannot satisfy them.
- Qoder remains excluded from any accepted Headless Adapter count until an independent Headless API exists.

## dispatch rules

- Dispatch the three foundation long workers together under their separately tracked task cards and exact non-overlapping file fences.
- Workers may read the full repository but may edit only their fenced files. They do not stage, commit, push or change orchestration truth.
- Each worker reports `implemented`, targeted test results, incomplete items, blockers and exact changed files. No worker claims acceptance.
- The manager reviews overlap, integrates callbacks, opens the bounded integration worker and keeps final state `awaiting_user_acceptance`.
- Adapter admission must reject unknown fields, stale or mismatched evidence, incompatible versions, incomplete permission/error/session contracts, missing cancellation semantics and unverified event bindings.
- InstallRun recovery must fail closed on Journal integrity failure, consent drift, missing LKG state, duplicate terminal events and unsafe compensation.
- Dependency workflow execution must fail closed on missing adapters, self/duplicate/cyclic dependencies, failed prerequisites, duplicate terminal events and cancellation races.
- Process discovery, package presence, synthetic callback, controlled Node process or fixture success is not Headless Adapter acceptance.

## worker verification floor

- Each foundation worker runs its own deterministic script and `git diff --check` for its fenced files.
- The integration pass runs relevant runtime/truth/Connector safety checks plus repository lint and build.
- No per-worker Windows package, packaged CDP smoke, PM acceptance or acceptance session is required.
- After the combined batch is implemented and tested, the manager reports one exact integrated diff and one verification summary to the user.
- Only the user performs the unified product acceptance requested for this batch.

## no-fabrication boundary

- No fresh authorization means no external Connector execution.
- No trusted executable Plan means no real install, update, repair or uninstall effect.
- A locally implemented workflow core is not a real two-Agent acceptance result.
- `implemented`, `tested`, `integrated`, `committed`, `pushed` and `user_accepted` remain separate states.

## combined handoff state

- `in_progress`: one or more foundation/integration long workers have not returned a complete callback.
- `implemented_tested_awaiting_user_acceptance`: all in-scope code and integrated tests are complete; no acceptance is claimed.
- `externally_blocked`: implementation is complete but real Agent or machine-effect evidence still lacks its explicit prerequisite.
- `user_accepted`: may be set only after the user's unified review.

next action:
- Keep all four P0 workers parked and hand one combined review to the user. P0-C execution remains forbidden until the user explicitly authorizes the prepared envelope.
