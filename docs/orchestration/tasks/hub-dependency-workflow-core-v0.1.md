# Hub Dependency Workflow Core v0.1

[长工]#hub-dependency-workflow-core@v0.1
⟦tag:v2|task|hub-dependency-workflow-core-v0.1⟧
loop state: active
dispatch state: active
status: implementation_in_progress_awaiting_user_acceptance
priority: M2 foundation

## goal

Implement a pure two-Agent dependency workflow core with cancellation propagation and audit correlation, without spawning an external Agent.

## file fence

Allowed writes:

- `src/lib/dependencyWorkflow.ts`
- `scripts/check-dependency-workflow.mjs`

All other files are read-only. The worker must not stage, commit, push or create a package/evidence session.

## required behavior

- Admit only tasks whose Agent/Adapter pair is explicitly available to the caller.
- Reject unknown, self, duplicate and cyclic dependencies before any dispatch side effect.
- Preserve deterministic ready ordering, dependency blocking and exactly-once terminal transitions.
- Propagate upstream failure and user cancellation without starting blocked dependents.
- Correlate workflow, task, Agent, Adapter, Session/run and terminal audit identities without exposing prompts, responses, paths or secrets.
- Keep local fixture execution distinct from a real two-Agent workflow acceptance claim.

## worker exit

- `node scripts/check-dependency-workflow.mjs` passes its positive and negative matrix.
- Fenced diff passes `git diff --check`.
- Callback reports implementation, tests, incomplete items, blockers and changed files.
- Final state remains unaccepted pending the user's combined review.
