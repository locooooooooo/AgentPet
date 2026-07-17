# Next Five-Day Development Control - 2026-07-18

[PM]#next-five-day-development@2026-07-18
⟦tag:v2|session|next-five-day-development-2026-07-18⟧

loop state: active
dispatch state: active
status: active_same_day_scheduler_delivery_under_full_schedule_and_phase_waiver

> **Original control window**: 2026-07-18 through 2026-07-22
> **Compressed control window and DDL**: 2026-07-17 for all five rows
> **Authorized input**: On 2026-07-17 the administrator requested that the following five-day development plan be advanced.
> **Date-gate waiver**: On 2026-07-17 the administrator explicitly authorized early preparation of later requirements. Day 1 template and Day 4 intake artifacts may therefore exist early.
> **Full schedule/phase waiver**: The administrator then set the later five-day development plan and every DDL to 2026-07-17. PM records this as authority to close W28 early and dispatch one local scheduler-core worker today.
> **Interpretation boundary**: This does not authorize P0-C, R0-3, external Agent CLI execution, Connector machine-gate changes or pointer input.

## single goal

- Close W28 truthfully under the explicit full schedule waiver, then deliver the smallest local-only scheduler slice today without reopening completed M5/v3.2 work or enabling external execution.

## confirmed baseline

- The plan was created at clean baseline `0e66ba9`; the current same-day transition baseline is `HEAD == origin/main == a1637c1` with only unrelated user-owned files dirty.
- M5, cockpit v3.2 P1/P2, A7.1/B2, protected-source closeout, live Session notification and homepage density are completed/pushed.
- Active control is PM, Supervisor, the 2026-07-17 daily plan, same-day five-day control, next-stage weekly requirements and the scheduler-core dispatch role; active Lanes remain daily supervision and weekly requirements only.
- Product implementation worker count remains zero until this control baseline is committed/pushed, then exactly one scheduler-core worker may run.
- P0-C and R0-3 still need separate explicit execution authorization; Pointer, Trae and Qoder retain their recorded external prerequisites.

## five-day serial board

| Day | Original date | Compressed DDL | Only allowed lane | Intended outcome | Current/exit state |
| --- | --- | --- | --- | --- | --- |
| 1 | 2026-07-18 | 2026-07-17 | PM control plane | Prepare the non-complete W28 closeout template and seven carry-over rows | completed under waiver |
| 2 | 2026-07-19 | 2026-07-17 | Supervisor read-only audit | Freeze carry-over owner/prerequisite/evidence and prepare a closeout candidate | completed; fresh PM gates pending |
| 3 | 2026-07-20 | 2026-07-17 | PM W28 closeout | Summarize W28, activate the next weekly truth and publish the control transition | active in current control commit |
| 4 | 2026-07-21 | 2026-07-17 | `[短工]#realtime-p1-scheduler-intake@v0.1` docs-only lane | Freeze contract, file fence, fixtures, failure matrix and rollback | accepted/summarized |
| 5 | 2026-07-22 | 2026-07-17 | `[长工]#realtime-p1-scheduler-core@v0.1` single worker | Implement the accepted local scheduler core with external spawn fixed at zero | active after control baseline push |

## Day 4 intake contract

The intake must define these behaviors before any code worker exists:

- Default global concurrency remains `1`; each `AgentInstance` has at most one running task.
- `dependsOn` failure blocks downstream work rather than silently running it.
- Timeout starts from actual process start; queue wait is measured separately.
- Cancellation propagates to the current task and produces an explicit downstream decision.
- Retry uses normalized retryable error codes only; user cancel, policy block and permission rejection never auto-retry.
- Every transition produces an immutable, redacted audit event; the UI never invents a terminal state.
- Candidate write scope must be exact. Expected candidates are `src/types.ts`, `src/lib/connectorRuntime.ts`, one scheduler-specific verification script and orchestration evidence; the accepted intake may narrow this list but may not silently widen it.

## Day 5 implementation authorization

- The administrator's current same-day DDL instruction is the explicit phase waiver required by this local slice.
- Day 5 remains bounded implementation, not promised acceptance; fixture failures remain truthful failures.
- A phase waiver does not authorize an external CLI. The scheduler-core lane remains fixture/local-process only with external Agent spawn count `0`.
- The worker may not stage, commit, push, reset, clean or edit Connector machine gates.
- PM accepts only after callback, deterministic success/failure/cancel/dependency/retry evidence, full gates, independent diff review, commit, push and clean parity.
- If behavior acceptance fails today, record the exact incomplete fixture or blocker; do not substitute unrelated polish work.

## protected boundaries

- No external Codex, Trae, Qoder or other Agent CLI execution is authorized by this plan.
- Do not edit `docs/orchestration/connectors.json` machine-gate fields or `docs/orchestration/status.json` `connectors[]`.
- Do not reopen M5, cockpit v3.2, homepage, protected source, live Session notification or completed realtime A7.1/B2 work.
- Do not rerun transparent pointer input without a changed screenshot-bound observation route.
- Do not modify `src/ranch/**`, protected `NiuMaAvatar`/4x2 matrix/keyframes, `icon/**` or `package.json` from the future scheduler lane.
- At most one product worker may be active; every day waits for the previous day's acceptance and pushed clean baseline.

## recurring gate set

```text
npm.cmd run orchestration:check
npm.cmd run orchestration:report
npm.cmd run orchestration:preflight
npm.cmd run orchestration:connector-safety
npm.cmd run realtime:truth-check
npm.cmd run lint
npm.cmd run build
git diff --check
```

## completion criteria

- Days 1-3 retain their original dates as history but execute on the compressed 2026-07-17 DDL under the explicit waiver.
- Day 4 produces an acceptance-grade scheduler intake with exact ownership, failure behavior and no-touch boundaries.
- Day 5 either produces one bounded accepted/pushed scheduler-core slice today or records the exact failed fixture/blocker.
- Product worker concurrency never exceeds one; external Agent spawn remains zero unless a separate explicit authorization is granted and accepted outside this plan.
- Every control transition is synchronized across index, status, weekly truth, daily supervision and accountability, then committed/pushed with `HEAD == origin/main`.

## 2026-07-17 pre-gate long-worker callbacks

| Long worker | Scope | Result | Key evidence | Changed files |
| --- | --- | --- | --- | --- |
| `/root/w28_day1_prep_audit` | Day 1 closeout-template preparation under the date-gate waiver | completed | Created a non-complete template with 18 unchecked items and seven carry-over rows; no final evidence was filled | `docs/orchestration/sessions/weekly-closeout-2026-07-20.md` |
| `/root/scheduler_intake_gap_audit` | Day 4 scheduler requirements under the date-gate waiver | completed | Created the requirements-only contract, exact four-file future fence and S-01 through S-16 fixtures | `docs/orchestration/tasks/realtime-p1-scheduler-intake-v0.1.md` |

PM supervision attempted a third independent gate thread, but the task hit the current agent thread limit. PM did not call that attempt completed; instead PM directly reran orchestration check/report/preflight/Connector safety and verified the clean control state.

The W28 worker froze these seven carry-over items as non-blocking: P0-C, R0-3, Trae, Qoder, transparent pointer, AgentPet staging review and AgentPet Git-manager callback. Their prerequisites remain unchanged.

The scheduler worker froze the future Day 5 candidate scope to `src/types.ts`, `src/lib/connectorRuntime.ts`, a new `scripts/check-connector-scheduler.mjs` and one scheduler evidence session. `electron/**`, preload/desktopClient, UI/CSS, ranch, protected cockpit, other scripts, package/config and external Agent execution remain forbidden.

## current checkpoint

completed:
- The five dates, serial order, admission rules, conditional Day 5 branch and protected boundaries are recorded.
- Date-waiver artifacts pass the recurring gate set with 115 referenced cards: orchestration check/report/preflight/Connector safety, realtime truth check, lint, build and `git diff --check`.
- Two bounded long workers first returned read-only gap callbacks, then created the two declared docs-only artifacts after the administrator's date-gate waiver; no product implementation was activated.
- The compressed closeout/next-stage/scheduler dispatch baseline passed the full recurring gates with 117 referenced cards and external Agent CLI execution `0`.

incomplete:
- PM fresh gates, closeout control commit/push and remote parity remain to complete Day 3.
- Scheduler-core implementation and S-01 through S-16 acceptance remain to complete Day 5.

blockers:
- No schedule or local scheduler phase blocker remains after the administrator set all five DDLs to 2026-07-17.
- Evidence gates remain mandatory: failed fixtures, forbidden-file needs or control drift still block acceptance.
- Existing Pointer, Trae and Qoder prerequisites remain separate and do not block the control plan.

next action:
- Run fresh PM closeout gates, publish the control transition, then dispatch exactly one scheduler-core worker today.
- Collect S-01 through S-16 callback evidence, independently accept or reject, and publish final parity before ending the same-day board.

summary:
- Active same-day serial board: all original five-day DDLs are 2026-07-17, W28 closeout is in PM acceptance and one local scheduler-core worker follows after the control baseline push.
