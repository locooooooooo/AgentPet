# cockpit-ui-redesign-v3.1-v0.1

[PM]#cockpit-ui-redesign-v3.1@v0.1
⟦tag:v2|task|cockpit-ui-redesign-v3.1-v0.1⟧

loop state: active
dispatch state: active
status: active_visual_refinement

date: 2026-07-09
decision: E=E1 approved by user in PM-direct route.
source diagnosis: `docs/控制舱UI诊断与改造方案-2026-07-08.md`

objective:
- Convert the 2026-07-08 control-cockpit UI diagnosis into a tracked v3.1 redesign lane.
- Implement the administrator-authorized 2026-07-12 visual refinement against the supplied current-cockpit screenshot.
- Preserve accepted `cockpit-refactor-p0-v0.1` C0-1 through C0-6 baselines.

implementation scope:
- P0 information alignment: naming, labels, codename source, zero-state explanation, and task metadata hierarchy.
- P1 visual declutter: top KPIs, bottom dock/statusbar, left role/lane density, right tab containment.
- P2 hierarchy refinement: selected central card, hover state, saturation, and text fit.
- P3 responsive containment: preserve usable three-column operations layout at 1280x720, 1440x900, and wider desktop viewports without rail/CTA overlap.

future candidate paths:
- `src/components/NiuMaWorkspace.tsx` for header, KPI, side panel, central card display, details panel, and bottom statusbar.
- `src/components/StatusStrip.tsx` for global status wording and density.
- `src/index.css` for bounded visual hierarchy and selected/hover state refinements.
- `src/ranch/data/agentAnimals.ts` and `src/lib/agentCore.ts` only if a future decision explicitly approves identity/codename source alignment.

no-touch boundaries:
- Do not reopen C0-1 through C0-6 acceptance.
- Do not alter `NiuMaAvatar.tsx`, animal data, business actions, or protected keyframes.
- Do not edit `electron/**`, `src/ranch/**`, `src/lib/agentCore.ts`, `src/types.ts`, or the pending M5 Day 1 lifecycle correction.
- Do not touch `docs/orchestration/connectors.json` machine-gate fields.
- Do not start connector execution, pointer input smoke, or M5 implementation from this card.

acceptance:
- The header, status strip, left supervision rail, center workstation stage, right operator panel, and bottom dock have clear hierarchy and no incoherent overlap.
- Long blocker/status text is scan-friendly and cannot consume the entire left rail.
- Right-side task actions remain visible without covering form fields or the bottom dock.
- All controls preserve keyboard focus, stable dimensions, and existing behavior; Lucide icons replace decorative emoji where touched.
- Browser/Electron screenshots prove 1280x720 and 1440x900 containment; `npm.cmd run orchestration:check`, `lint`, `build`, and `git diff --check` pass.

next action:
- Dispatch one bounded UI worker using only `NiuMaWorkspace.tsx`, `StatusStrip.tsx`, cockpit-specific `src/index.css` rules, and a dedicated progress/evidence card.
- Keep the M5 Day 1 correction uncommitted and do not mix it into the visual-lane commit.

summary:
- Active bounded cockpit visual-refinement lane authorized on 2026-07-12; layout hierarchy and containment only, with product behavior and protected surfaces preserved.
