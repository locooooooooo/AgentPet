# Hub Runtime Foundation Integration v0.1

[长工]#hub-runtime-foundation-integration@v0.1
⟦tag:v2|task|hub-runtime-foundation-integration-v0.1⟧
loop state: active
dispatch state: active
status: implementation_in_progress_awaiting_user_acceptance
priority: M1/M2 integration

## goal

Compose the completed Adapter admission, InstallRun and dependency workflow foundations behind one pure Hub execution coordinator without invoking external Agents or machine effects.

## confirmed inputs

- `src/lib/adapterCapability.ts` and its targeted matrix are implemented/tested.
- `src/lib/installRunJournal.ts` and its targeted matrix are implemented/tested.
- `src/lib/dependencyWorkflow.ts` and its targeted matrix are implemented/tested.
- These inputs remain unaccepted pending the user's combined review.

## file fence

Allowed writes:

- `src/lib/hubExecutionCoordinator.ts`
- `scripts/check-hub-execution-coordinator.mjs`

All other files are read-only. The worker must not stage, commit, push or create a package/evidence session.

## required behavior

- Admit an Agent/Adapter/Connector pair only from `verified` and `executionEligible` Adapter Capability output.
- Keep non-production, rejected, unknown, expired or identity-mismatched evidence out of the admitted pair registry.
- Feed only admitted pairs into dependency workflow admission and preserve workflow/task/session/run/audit identities.
- Create and recover InstallRunJournal instances only through explicit binding, authorization and injected pure dependencies.
- Expose no process spawn, Connector command, filesystem, registry, service, network, credential or elevation capability.
- Fail closed on adapter revocation/evidence drift, unknown workflow pairs, InstallRun binding drift and duplicate/conflicting terminal operations.
- Keep integrated fixture success distinct from real Agent execution and product acceptance.

## worker exit

- `node scripts/check-hub-execution-coordinator.mjs` passes its integrated positive and negative matrix.
- The three foundation scripts remain green and full TypeScript check passes.
- Fenced diff passes `git diff --check`.
- Callback reports implementation, tests, incomplete items, blockers and changed files.
- Final state remains unaccepted pending the user's combined review.
