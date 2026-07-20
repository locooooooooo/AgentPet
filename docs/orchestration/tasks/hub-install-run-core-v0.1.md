# Hub InstallRun Core v0.1

[长工]#hub-install-run-core@v0.1
⟦tag:v2|task|hub-install-run-core-v0.1⟧
loop state: standby
dispatch state: standby
status: implemented_tested_awaiting_user_acceptance
priority: M1 foundation

## goal

Implement a pure InstallRunJournal, cancellation, compensation and recovery state machine without performing machine effects.

## file fence

Allowed writes:

- `src/lib/installRunJournal.ts`
- `scripts/check-install-run-journal.mjs`

All other files are read-only. The worker must not stage, commit, push or create a package/evidence session.

## required behavior

- Bind a run to Plan version, consent/effect digest, Agent identity and ordered step DAG.
- Journal monotonic state transitions and exactly one terminal outcome.
- Support idempotent cancel, non-interruptible safe points, authorized reverse-order compensation and explicit partial rollback.
- Recover deterministically after interruption using integrity-checked Journal and last-known-good evidence.
- Fail closed on consent drift, Journal corruption, missing LKG, unsafe compensation, duplicate terminal writes and impossible transitions.
- Use injected pure effects only; no process, filesystem, registry, service, network, credential or elevation side effect.

## worker exit

- `node scripts/check-install-run-journal.mjs` passes its positive and negative matrix.
- Fenced diff passes `git diff --check`.
- Callback reports implementation, tests, incomplete items, blockers and changed files.
- Final state remains unaccepted pending the user's combined review.
