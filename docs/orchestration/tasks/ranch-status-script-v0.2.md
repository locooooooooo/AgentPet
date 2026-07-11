# ranch-status-script-v0.2

[短工]#ranch-status-script@v0.2
⟦tag:v2|task|ranch-status-script-v0.2⟧

loop state: standby
dispatch state: standby
status: standby

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
- Keep standby until `ranch-window-v0.2` is accepted, committed, pushed, and the worktree is clean; on 2026-07-16 PM may dispatch this card as the only `[短工]` product worker.

summary:
- Requirements-ready child card for M5 animal/status presentation; no implementation started.
