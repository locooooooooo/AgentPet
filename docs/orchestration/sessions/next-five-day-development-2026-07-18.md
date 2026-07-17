# Next Five-Day Development Control - 2026-07-18

[PM]#next-five-day-development@2026-07-18
⟦tag:v2|session|next-five-day-development-2026-07-18⟧

loop state: standby
dispatch state: standby
status: standby_waiting_day1_time_gate

> **Control window**: 2026-07-18 through 2026-07-22
> **Authorized input**: On 2026-07-17 the administrator requested that the following five-day development plan be advanced.
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
| 1 | 2026-07-18 | PM control plane | Create a non-complete `weekly-closeout-2026-07-20.md` template; classify every unresolved item as carry-over/non-blocking | Actual 2026-07-18 date; clean baseline; no product worker | template_ready_waiting_precloseout |
| 2 | 2026-07-19 | Supervisor read-only audit | Run fresh full gates; freeze carry-over owner, prerequisite and evidence; freeze W29 candidate ordering | Day 1 template exists and is not complete | precloseout_verified_waiting_time_gate |
| 3 | 2026-07-20 | PM W28 closeout | After the real time gate, finalize W28, summarize its weekly role/session, publish control truth and prove clean parity | Actual closeout time; Day 2 evidence complete | w28_closed_w29_control_ready |
| 4 | 2026-07-21 | Future `[短工]#realtime-p1-scheduler-intake@v0.1` docs-only lane | Write the bounded scheduler contract, file fence, fixtures, failure matrix and rollback surface; do not implement or spawn | W28 closeout pushed; W29 truth active; no product worker; clean baseline | intake_ready_waiting_phase_gate |
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

## current checkpoint

completed:
- The five dates, serial order, admission rules, conditional Day 5 branch and protected boundaries are recorded.
- Registration gates passed with 113 referenced cards: orchestration check/report/preflight/Connector safety, realtime truth check, lint, build and `git diff --check`.

incomplete:
- Day 1 cannot start before the actual 2026-07-18 time gate.
- The W28 closeout card does not yet exist by design.
- P0-C is not accepted, so Day 5 product implementation is not currently admissible.

blockers:
- Time gate: 2026-07-18 for Day 1 and 2026-07-20 for W28 closeout.
- Phase gate: P0-C acceptance or a new explicit administrator waiver before scheduler-core implementation.
- Existing Pointer, Trae and Qoder prerequisites remain separate and do not block the control plan.

next action:
- Keep this card standby and wait for the actual 2026-07-18 Day 1 gate.
- On Day 1 create only the non-complete W28 closeout template; do not dispatch a product worker.

summary:
- Standby five-day serial control plan; W28 closes first, scheduler intake follows, and implementation remains conditional on the recorded phase gate.
