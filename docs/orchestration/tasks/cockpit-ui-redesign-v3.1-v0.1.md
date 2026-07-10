# cockpit-ui-redesign-v3.1-v0.1

[PM]#cockpit-ui-redesign-v3.1@v0.1
⟦tag:v2|task|cockpit-ui-redesign-v3.1-v0.1⟧

loop state: standby
dispatch state: standby
status: standby

date: 2026-07-09
decision: E=E1 approved by user in PM-direct route.
source diagnosis: `docs/控制舱UI诊断与改造方案-2026-07-08.md`

objective:
- Convert the 2026-07-08 control-cockpit UI diagnosis into a tracked v3.1 redesign lane.
- Keep this card as task intake only; do not implement the redesign in this pass.
- Preserve accepted `cockpit-refactor-p0-v0.1` C0-1 through C0-6 baselines.

scope:
- P0 information alignment: naming, labels, codename source, zero-state explanation, and task metadata hierarchy.
- P1 visual declutter: top KPIs, bottom dock/statusbar, left role/lane density, right tab containment.
- P2 hierarchy refinement: selected central card, hover state, saturation, and text fit.
- P3 brand naming: final eight codename decisions only after user confirmation.

future candidate paths:
- `src/components/NiuMaWorkspace.tsx` for header, KPI, side panel, central card display, details panel, and bottom statusbar.
- `src/components/StatusStrip.tsx` for global status wording and density.
- `src/index.css` for bounded visual hierarchy and selected/hover state refinements.
- `src/ranch/data/agentAnimals.ts` and `src/lib/agentCore.ts` only if a future decision explicitly approves identity/codename source alignment.

no-touch boundaries:
- Do not edit any source file from this task-intake pass.
- Do not reopen C0-1 through C0-6 acceptance.
- Do not alter `NiuMaAvatar.tsx` or protected keyframes without a future explicit file fence and user-visible risk note.
- Do not touch `docs/orchestration/connectors.json` machine-gate fields.
- Do not start connector execution, pointer input smoke, or M5 implementation from this card.

acceptance:
- This task card exists and is tracked by `docs/orchestration/index.md`.
- `docs/orchestration/sessions/daily-plan-2026-07-09.md` records E=E1 as approved.
- `docs/orchestration/sessions/weekly-requirements-2026-07-07.md` lists this lane as a W28 candidate, not as current implementation.
- `npm.cmd run orchestration:check` passes.

next action:
- Put `cockpit-ui-redesign-v3.1` into the W28 candidate pool.
- Before implementation, require a fresh scope decision on codename, slot labels, KPI count, bottom dock/statusbar, and central-card selected state.

summary:
- Standby cockpit UI redesign intake card; implementation deferred.
