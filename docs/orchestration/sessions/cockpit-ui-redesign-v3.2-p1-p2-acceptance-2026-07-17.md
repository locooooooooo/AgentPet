# Cockpit UI Redesign v3.2 P1/P2 Acceptance - 2026-07-17

[PM]#cockpit-ui-redesign-v3.2@v0.1

⟦tag:v2|session|cockpit-ui-redesign-v3.2-p1-p2-acceptance-2026-07-17⟧
⟦tag:v2|task|cockpit-ui-redesign-v3.2-v0.1⟧

loop state: summarized
dispatch state: summarized
status: accepted_pushed

## decision

- P1 commit `51d5501` is accepted.
- P2 commit `0dfaadf` is accepted.
- No rejection item or UI blocker remains.

## independent replay

| Check | Result | Evidence |
| --- | --- | --- |
| desktop viewports | pass | 1280x720, 1440x900 and 1920x1080 all kept `scrollWidth == clientWidth`; task name, command and CTA remained first-screen |
| DPI equivalents | pass | 1024x576 reported `1009 == 1009`; 853x480 reported `838 == 838`; all eight cards remained mounted |
| governance discovery | pass | role and Lane search/filter/clear worked; current `blocked` filter truthfully rendered empty states and clear restored full counts |
| blocker disclosure | pass | summary/full disclosure, blocker copy and truth-source copy worked; collapsed content left layout and focus order |
| keyboard route | pass | the first four region targets were global health, Agent matrix, Operator and governance; Operator activation focused its region with a visible 2px outline |
| selected-card Portal | pass | five readable actions stayed above the Dock; action execution closed the Portal and kept only Codex selected |
| Corner Assist | pass | hidden while the right rail was open; collapsed mode left about 6px above the Dock |
| visual states | pass | selected/hover geometry stayed stable with `transform:none`; disabled, empty and long-text states remained bounded |
| reduced motion/error CSS | pass with residual | scoped CSSOM rules exist; active OS reduced-motion preference and a naturally occurring error toast were not manufactured |
| console | pass | warning/error list was empty |
| boundaries | pass | P1/P2 commits stayed within cockpit component/CSS/evidence scope; no Connector, Electron, ranch or business-contract change |

## quality gates

- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run orchestration:check`
- `npm.cmd run orchestration:report`
- `npm.cmd run orchestration:preflight`
- `npm.cmd run orchestration:connector-safety`
- `git diff --check`

All passed in the independent acceptance run. External Agent CLI execution remained zero.

## cleanup

- The browser page was released and the temporary viewport reset.
- Independent Vite port 5188 and its Node process were stopped.
- Existing ports 5173/5174 were not touched.
- The acceptance Lane made no file change.

## residual evidence

- An active OS/browser profile with `prefers-reduced-motion: reduce` was not available.
- No natural business error occurred for live error-toast replay; CSSOM evidence passed and no synthetic failure was introduced.
- These are non-blocking evidence residuals and do not authorize a new visual phase.
