# Hub Content Contract Review - 2026-07-19

[PM]#hub-content-contract-review@v0.1
⟦tag:v2|session|hub-content-contract-review-2026-07-19⟧
loop state: standby
dispatch state: standby
status: exact_file_review_accepted_contract_boundary
date: 2026-07-19
priority: P0/R0

## scope

This is an independent exact-file review of the two Wave A content contracts delivered in `b145036`. It reviews only the contract documents and their negative-test checker. It does not accept R3 theme or sound implementation, product inputs, UI truth, DockView, an installer, an Adapter runtime or any external execution.

Reviewed files:

- `docs/牛马Hub-HubTheme合同-v0.1.md`
- `docs/牛马Hub-HubSoundPack合同-v0.1.md`
- `scripts/check-hub-content-contracts.mjs`

## review result

Both contracts pass the exact-file review for the R0 contract boundary.

### HubTheme

- The schema, compatibility and fail-closed migration rules are explicit.
- Package contents are declarative and reject scripts, commands, URLs, path traversal, unsafe MIME types and Connector/Task/Session/online fields.
- Integrity, byte counts, asset licensing and provenance are required and cross-checked.
- Contrast, density and reduced-motion constraints are explicit.
- Preview is isolated, bounded and reversible; apply uses pending -> atomic active -> last-known-good rollback.
- HT-01 through HT-12 are complete and the valid plus two invalid examples exercise the protected boundaries.

### HubSoundPack

- The six receipt meanings and the required default identity tail are explicit.
- Packs cannot override global mute, quiet hours, priority, aggregation, rate limits or eventId deduplication.
- Assets require bounded duration, format, loudness, peak, integrity and license metadata.
- Preview is isolated from Runtime truth and business receipts; playback failure cannot alter Task/Session state.
- HS-01 through HS-15 are complete and the valid plus two invalid examples exercise policy, path, fallback and media limits.

## verification

- `npm.cmd run hub:contracts-check`: pass; valid examples and all HT-01..12 / HS-01..15 negative cases pass.
- The reviewed files contain no TODO or placeholder acceptance row.
- No Connector machine gate, runtime truth source, Session projection or external Agent execution changed during this review.
- Packaged lifecycle smoke remains pass from the current candidate: Trae launch, WorkBuddy/Qoder focus, Session separation, layout overflow and process cleanup all pass; OpenClaw remains not requested.

## boundary and blockers

- Theme/SoundPack are accepted as exact-file R0 contracts only.
- The broader R0 batch remains open until unaccepted README/product inputs and full UI truth are reconciled.
- R3 theme/sound assets, playback and runtime switching are not implemented or accepted.
- OpenClaw risk confirmation/authentication, P0-C Codex authorization, Trae Models readiness and an accepted Headless Adapter for Qoder remain external decisions or blockers.
- No external Connector is enabled and no external Agent CLI was executed.

next action:
- Preserve this contract-boundary acceptance and open only a separately fenced reconciliation or M1 lifecycle card after the remaining M0 decisions are explicitly closed or deferred.

evidence:
- `b145036 feat(hub): add agent lifecycle sessions and R0 contracts`
- `npm.cmd run hub:contracts-check`
- `npm.cmd run realtime:packaged-smoke`

changed files:
- `docs/orchestration/sessions/hub-content-contract-review-2026-07-19.md`
