# ranch-status-script-v0.2

[短工]#ranch-status-script@v0.2
⟦tag:v2|task|ranch-status-script-v0.2⟧

loop state: summarized
dispatch state: summarized
status: accepted_existing_implementation_code_backed

parent: `docs/orchestration/tasks/ranch-m5-requirements-v0.2.md`
source summary: `docs/orchestration/tasks/ranch-status-script-v0.1.md`

objective:
- Prepare a bounded implementation lane for FR-002/003/004/006 animal identity, status script, status band, and bubble behavior.

FR coverage:
- FR-002 eight animal identities mapped from the current agent seed truth.
- FR-003 status-to-pose/action script for all visible NiuMa states.
- FR-004 selected/active animal display without adding persistent detail panels.
- FR-006 transient status bubble and single notification band behavior.

future scope paths:
- `src/ranch/data/agentAnimals.ts` for animal metadata and identity display.
- `src/ranch/data/statusActions.ts` for state-to-pose mapping.
- `src/ranch/components/RanchCanvas.tsx`, `src/ranch/components/Animal.tsx`, and `src/ranch/components/StatusBand.tsx` for renderer presentation.
- `src/ranch/hooks/useRanchNotifications.ts` for one-at-a-time transient status messages.
- `src/ranch/styles/ranch.css` for scoped ranch-only styles.

no-touch boundaries:
- Do not edit `src/lib/agentCore.ts` seed/status structure from this readiness pass.
- A future implementation may read existing seed/status truth but must not rewrite protected `STATE_METAS` or central control-cockpit behavior without explicit scope.
- Do not add task queues, command input, connector policy cards, or detailed metrics to the ranch surface.

acceptance for a future implementation lane:
- Eight animals render without overlap and preserve the v0.3 L1/L2/L3 hierarchy.
- Every supported visible state maps to a recognizable pose/action.
- Status bubble is transient and does not become a persistent card.
- Browser and Electron evidence both show no boot/error card and no horizontal overflow.
- `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd run orchestration:check` pass.

next action:
- Day 3 is closed without product-code changes: existing implementation satisfies the bounded scope through AST coverage, Electron capture and full gates. Continue the serial plan with `ranch-personality-v0.2`; direct OS interaction remains outside this card.

summary:
- Existing implementation accepted as code-backed evidence: 8 unique identities exactly match seed truth, all 14 NiuMaStatus values have explicit action mappings, the notification band is capped at one 1500ms toast, and Electron capture renders 8 animals without boot/error state.

evidence:
- `node scripts/check-ranch-status-coverage.mjs` -> identities=8, statuses=14, maxToasts=1, toastTtlMs=1500.
- `node scripts/ranch-pointer-capture.mjs --out-json=<temp> --out-png=<temp>` -> 640x360, animalCount=8, actionButtonCount=3, desktop mode, no boot/error card, transparent field, pass=true.
- The dispatched short worker was rejected by service-side `403 DAILY_LIMIT_EXCEEDED`; PM completed evidence review without editing protected product logic.
