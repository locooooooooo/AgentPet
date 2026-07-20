# Hub Adapter Capability Implementation v0.1

[长工]#hub-adapter-capability@v0.1
⟦tag:v2|task|hub-adapter-capability-implementation-v0.1⟧
loop state: standby
dispatch state: standby
status: implemented_tested_awaiting_user_acceptance
priority: M2 foundation

## goal

Implement a pure fail-closed Adapter Capability admission evaluator without invoking an external Agent or changing Connector policy.

## file fence

Allowed writes:

- `src/lib/adapterCapability.ts`
- `scripts/check-adapter-capability.mjs`

All other files are read-only. The worker must not stage, commit, push or create a package/evidence session.

## required behavior

- Validate exact schema/version, adapter/agent/connector identity, compatibility, permission declaration, error vocabulary, session identity, terminal receipts and cancellation semantics.
- Bind evidence by digest, evaluator version, source kind, freshness, peer/run identity and event ordering.
- Return explicit `verified`, `rejected` or `unknown`; only `verified` may be execution-eligible.
- Reject unknown fields, missing requirements, stale/future/mismatched evidence, oversized events, preview/production confusion and sensitive payload fields.
- Keep fixtures and controlled events distinct from real Adapter acceptance.

## worker exit

- `node scripts/check-adapter-capability.mjs` passes its positive and negative matrix.
- Fenced diff passes `git diff --check`.
- Callback reports implementation, tests, incomplete items, blockers and changed files.
- Final state remains unaccepted pending the user's combined review.
