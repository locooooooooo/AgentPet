# Next Five-Day Development Control - 2026-07-18

[PM]#next-five-day-development@2026-07-18
⟦tag:v2|session|next-five-day-development-2026-07-18⟧

loop state: standby
dispatch state: standby
status: standby_requirements_prepared_under_time_waiver

> **Control window**: 2026-07-18 through 2026-07-22
> **Authorized input**: On 2026-07-17 the administrator requested that the following five-day development plan be advanced.
> **Date-gate waiver**: On 2026-07-17 the administrator explicitly authorized early preparation of later requirements. Day 1 template and Day 4 intake artifacts may therefore exist early.
> **Interpretation boundary**: This authorizes the manager to establish and supervise the serial plan. It does not authorize P0-C, R0-3, external Agent CLI execution, Connector machine-gate changes, pointer input, or a product worker before its recorded gate.

## single goal

- Close W28 truthfully, then establish the smallest local-only admission path for the next realtime scheduling slice without reopening completed M5/v3.2 work or skipping the P0-C phase gate.

## confirmed baseline

- `HEAD == origin/main == 0e66ba9` and the worktree was clean when this plan was created.
- M5, cockpit v3.2 P1/P2, A7.1/B2, protected-source closeout, live Session notification and homepage density are completed/pushed.
- Active control remains PM, Supervisor, W28 weekly planning and the 2026-07-17 daily plan; active Lanes remain daily supervision and weekly requirements only.
- Product implementation worker count is zero.
- P0-C and R0-3 still need separate explicit execution authorization; Pointer, Trae and Qoder retain their recorded external prerequisites.

## five-day serial board

| Day | Date | Only allowed lane | Intended outcome | Start gate | Planned exit state |
| --- | --- | --- | --- | --- | --- |
| 1 | 2026-07-18 | PM control plane | Create a non-complete `weekly-closeout-2026-07-20.md` template; classify every unresolved item as carry-over/non-blocking | Date gate waived on 7-17 for requirements preparation only; no product worker | template_ready_waiting_precloseout_under_time_waiver |
| 2 | 2026-07-19 | Supervisor read-only audit | Run fresh full gates; freeze carry-over owner, prerequisite and evidence; freeze W29 candidate ordering | Day 1 template exists and is not complete | precloseout_verified_waiting_time_gate |
| 3 | 2026-07-20 | PM W28 closeout | After the real time gate, finalize W28, summarize its weekly role/session, publish control truth and prove clean parity | Actual closeout time; Day 2 evidence complete | w28_closed_w29_control_ready |
| 4 | 2026-07-21 | `[短工]#realtime-p1-scheduler-intake@v0.1` docs-only lane | Write the bounded scheduler contract, file fence, fixtures, failure matrix and rollback surface; do not implement or spawn | Date gate waived on 7-17 for requirements preparation only; no product worker | ready_waiting_phase_gate_under_time_waiver |
| 5 | 2026-07-22 | Future `[短工]#realtime-p1-scheduler-core@v0.1` single worker | Implement only the accepted local scheduler core and deterministic fixtures, with external spawn count fixed at zero | Day 4 intake accepted/pushed; P0-C accepted or administrator explicitly waives the phase gate; one-worker slot free | accepted/pushed or truthful waiting_phase_gate |

## Day 4 intake contract

The intake must define these behaviors before any code worker exists:

- Default global concurrency remains `1`; each `AgentInstance` has at most one running task.
- `dependsOn` failure blocks downstream work rather than silently running it.
- Timeout starts from actual process start; queue wait is measured separately.
- Cancellation propagates to the current task and produces an explicit downstream decision.
- Retry uses normalized retryable error codes only; user cancel, policy block and permission rejection never auto-retry.
- Every transition produces an immutable, redacted audit event; the UI never invents a terminal state.
- Candidate write scope must be exact. Expected candidates are `src/types.ts`, `src/lib/connectorRuntime.ts`, one scheduler-specific verification script and orchestration evidence; the accepted intake may narrow this list but may not silently widen it.

## Day 5 implementation gate

- Day 5 is conditional, not promised completion.
- P0-C must be accepted first unless the administrator explicitly waives that phase dependency in a new message.
- A phase waiver does not authorize an external CLI. The scheduler-core lane remains fixture/local-process only with external Agent spawn count `0`.
- The worker may not stage, commit, push, reset, clean or edit Connector machine gates.
- PM accepts only after callback, deterministic success/failure/cancel/dependency/retry evidence, full gates, independent diff review, commit, push and clean parity.
- If any start gate is absent on 2026-07-22, the correct result is `waiting_phase_gate`; do not substitute unrelated polish work.

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

- Days 1-3 preserve real dates and produce a truthful W28 closeout before any next-phase product admission.
- Day 4 produces an acceptance-grade scheduler intake with exact ownership, failure behavior and no-touch boundaries.
- Day 5 either produces one bounded accepted/pushed scheduler-core slice or records the exact missing gate as `waiting_phase_gate`.
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

incomplete:
- Day 1 requirements preparation is complete under the date-gate waiver; the pre-closeout evidence and final closeout remain incomplete.
- Day 4 requirements preparation is complete under the date-gate waiver; scheduler-core implementation has not started.
- P0-C is not accepted, so Day 5 product implementation is not currently admissible.

blockers:
- Final time gate: 2026-07-20 for W28 closeout; the requirement-preparation date gates are waived, not the final evidence gate.
- Phase gate: P0-C acceptance or a new explicit administrator waiver before scheduler-core implementation.
- Existing Pointer, Trae and Qoder prerequisites remain separate and do not block the control plan.

next action:
- Keep this card standby with both requirements artifacts prepared and no product worker active.
- Next run fresh pre-closeout evidence without pre-filling final W28 completion fields.
- Reuse the collected template and scheduler-intake packages; do not rerun the audits unless their baseline or prerequisites change.

summary:
- Standby five-day serial control plan with Day 1/Day 4 requirements prepared early; W28 final closeout and scheduler implementation remain conditional on their recorded gates.
