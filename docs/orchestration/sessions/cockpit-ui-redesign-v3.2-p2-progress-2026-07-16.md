# cockpit-ui-redesign-v3.2 P2 progress - 2026-07-16

⟦tag:v2|session|cockpit-ui-redesign-v3.2-p2-progress-2026-07-16⟧

[长工]#cockpit-visual-intake@v3.2-p2
loop state: summarized
dispatch state: summarized

status: ready_for_pm_review
scope: P2 only
baseline: `7cdb1fe`

## completed

- Added cockpit-scoped visual tokens for title, body, control, and metadata type levels; neutral surfaces; borders; focus color; and panel/selection shadows.
- Normalized panel, repeated-item, card, control, empty, warning, and error surfaces without changing component state or data contracts.
- Removed selected and hovered Agent-card transforms. Hover changes only border and shadow; selection keeps one border/shadow emphasis.
- Added stable cockpit hover, keyboard focus, and disabled states. Focus uses a 2px cyan outline plus a low-opacity outer ring; disabled controls retain explicit opacity, saturation, cursor, and no transform.
- Added scoped long-text containment for roles, Lanes, tasks, terminals, blocker truth, and Corner Assist.
- Added a cockpit-only `body:has(.workspace-shell)` min-width override so DPI-equivalent narrow control-cockpit viewports are not forced to the legacy 960px page width. Homepage and ranch remain outside this condition.
- Added a scoped `prefers-reduced-motion: reduce` block without editing any existing keyframe.
- Raised the collapsed Corner Assist safe distance to `80px` after direct replay found a 4.4px Dock overlap.

## desktop viewport evidence

| Viewport | Page width | CTA bottom | Operator bottom | Dock top | Cards | Result |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 1280x720 | `1280 == 1280` | 586.4 | 633.6 | 645.6 | 8 | pass |
| 1440x900 | `1440 == 1440` | 572.4 | 813.6 | 825.6 | 8 | pass |
| 1920x1080 | `1920 == 1920` | 536.4 | 993.6 | 1005.6 | 8 | pass |

- All three desktop viewports kept task name, command, and CTA visible with no page horizontal overflow.
- Right rail open kept Corner Assist at `display:none` in all three desktop viewports.
- Computed typography was title `14px`, body `12px`, control/code `11px`, metadata `10px`.
- Panel border computed to `rgba(212, 212, 216, 0.14)` with one `0 8px 24px` shadow.
- Selected Agent transform computed to `none` at all three sizes.

## DPI-equivalent and long-text evidence

- 125% equivalent `1024x576`: document width `1009 == 1009`; eight cards remained mounted.
- 150% equivalent `853x480`: the legacy body min-width initially produced `960 > 838`; the cockpit-only fix produced `838 == 838` with eight cards mounted.
- The live long blocker remained bounded at every viewport; task fields used clipped single-line overflow and did not widen the page.
- Lane next action is limited to two wrapping lines; other governed long-text surfaces use `overflow-wrap:anywhere` and `word-break:break-word`.

## interaction and state evidence

- Portal at 1280x720: five actions, bounds `top 252.875 / bottom 442.875`, Dock top `645.609`, page width `1280 == 1280`.
- Portal opened and `给杯咖啡` executed while selected Agent stayed `Codex`; closing removed the portal and selected transform remained `none`.
- Selected-card hover preserved exact geometry `left 288 / top 176.5625 / width 199 / height 318` before and after hover.
- Keyboard Tab exposed `全局健康` with `:focus-visible=true`, a 2px cyan outline, and a 3px low-opacity focus ring.
- Empty queue rendered its explicit next action with neutral dashed border, neutral surface, and readable muted text.
- Disabled governance clear rendered `cursor:not-allowed`, opacity `0.4`, saturation `0.45`, no shadow, and no transform.
- Error toast rule is present and scoped with red border, dark red surface, and light error text; no synthetic business error was triggered.
- Collapsed Corner Assist after correction ended at `640`; Dock began at `645.609`, leaving a `5.609px` gap.

## reduced motion

- CSSOM exposed the scoped `(prefers-reduced-motion: reduce)` rule.
- The rule sets cockpit animation duration to `0.01ms`, one iteration, transition duration to `0.01ms`, zero delay, and removes transforms from Agent card, Avatar, status dot, Corner panel, and StatusStrip dropdown.
- Existing keyframes were not edited.
- The verification browser reported `matchMedia('(prefers-reduced-motion: reduce)').matches == false`; an OS/browser profile with the preference enabled remains a PM residual replay.

## validation

- Worker lint, build, and scoped diff-check passed before runtime replay.
- The worker's final parallel rerun was interrupted before results were returned.
- The root PM independently confirmed lint, build, orchestration check, preflight, connector-safety, and diff-check passing against the concurrent Connector lane.

## incomplete

- Active reduced-motion preference was not available in the verification browser; CSSOM and scoped declarations passed, but a profile with `matchMedia('(prefers-reduced-motion: reduce)').matches == true` was not replayed.
- A naturally occurring error toast was not available. The scoped error rule was verified without manufacturing a business failure.

## blockers

- No P2 implementation blocker remains.
- The two incomplete rows are evidence residuals and do not authorize changes outside the P2 file fence.

## next action

- PM independently review the three desktop viewport rows, the 125%/150% equivalent-width rows, Portal selection stability, Corner/Dock gap, and focus evidence.
- If accepted, stage only `src/index.css` and this P2 progress document for the P2 commit.
- Keep reduced-motion active-profile and natural error-toast replay as explicit residual evidence; do not open P3 or change business logic to satisfy them.

## evidence

- Desktop widths: `1280 == 1280`, `1440 == 1440`, `1920 == 1920`.
- DPI-equivalent widths after the bounded body fix: `1009 == 1009` at 125% and `838 == 838` at 150%.
- Portal: five actions, bottom `442.875` above Dock top `645.609`, selected Agent stayed `Codex`.
- Hover: selected-card bounds stayed `288 / 176.5625 / 199 / 318`, transform `none`.
- Focus: first keyboard target had `:focus-visible=true`, 2px cyan outline, and 3px focus ring.
- States: empty queue and disabled control computed styles were verified; the scoped error rule is present.
- Corner/Dock: Corner bottom `640`, Dock top `645.609`, gap `5.609px`.
- Motion: scoped reduce rule exists in CSSOM; existing keyframes were unchanged.

## residual validation

- Re-run one visual screenshot with an OS/browser profile that actively reports reduced motion.
- Re-run a naturally occurring error toast if an error fixture becomes available; do not manufacture a business failure solely for styling evidence.

## boundaries

- Only `src/index.css` and this progress document changed in the P2 lane.
- No `NiuMaWorkspace.tsx`, StatusStrip component, Connector, Homepage, Electron, ranch, Avatar, agent core, type, package, icon, or existing keyframe change.
- No external Agent execution.
- No stage, commit, push, reset, or clean.
