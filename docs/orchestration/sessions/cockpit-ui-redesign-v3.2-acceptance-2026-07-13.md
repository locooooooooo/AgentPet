# cockpit-ui-redesign-v3.2 acceptance evidence - 2026-07-13

⟦tag:v2|session|cockpit-ui-redesign-v3.2-acceptance-2026-07-13⟧

[PM]#cockpit-ui-redesign-v3.2@v0.1
loop state: standby
dispatch state: standby

task: `[长工]#cockpit-ui-redesign-v3.2@v0.1`
scope: P0 only
worker recommendation: ready_for_pm_review
PM decision: accepted_pushed

| Requirement | Worker evidence | Result |
| --- | --- | --- |
| Global state dedupe | Header keeps KPI/connector/latest; left latest tile removed; Dock contains only update time and sync feedback | ready |
| Task-first right rail | At 1280x720 task name, command, and CTA are visible; CTA bounds are `top 484 / bottom 520` | ready |
| Central matrix priority | 1280, 1440, and 1920 DOM checks report `scrollWidth == clientWidth`; eight cards remain mounted | ready |
| Card action reduction | Unselected cards expose selection plus dispatch; all triggers remain inside their card; controlled details opens a five-action portal without changing selected Agent | ready_after_correction |
| Conditional Corner Assist | Desktop right-open state computes `display:none`; collapsed state exposes the trigger and usable panel | ready |
| Keyboard path | Task Tab moved from audit baseline about `75` to `29`; closed menu exposes zero child focus targets | ready |
| Long text | 1665px command content remains contained in 334px input with no page overflow; blocker remains bounded | ready |
| Accessibility | Touched icon controls have names/tooltips; status retains text; hidden rail/menu content leaves focus order | ready |
| Quality gates | orchestration checks, connector safety, lint, build, and diff check passed | ready |

## PM correction evidence

| Check | Before correction | After correction |
| --- | --- | --- |
| 1280 selected card bounds | Card bottom `488`; summary bottom `550` | Card bottom `569`; summary bottom `553`; contained |
| Summary hit target | MiniMax card content | Summary's own `更多` span |
| Selection after summary click | Changed away from Codex | Stayed Codex/MiniMax/OpenCCode in direct replays |
| Details state | Did not open | `open=true` after pointer click |
| Board clipping | Absolute child could be clipped | Portal is outside board overflow and remains hit-testable |
| Dock overlap | Not reliable | Menu bottom `411-837` across tested viewports and remained above Dock |
| Horizontal overflow | No new proof after failed click | `scrollWidth == clientWidth` at 1280/1440/1920 |

## PM visual correction evidence

| Check | Failed portal style | Corrected portal style |
| --- | --- | --- |
| Button surface | Browser-default white rectangles | `rgb(21, 21, 21)` dark cockpit surface |
| Text and icons | Not visibly rendered in screenshot | `rgb(226, 232, 240)`, opacity 1, visible |
| Hit area | Geometry existed but presentation failed | Five controls at 32px height |
| Keyboard focus | Not visually acceptable | `:focus-visible`, 2px cyan outline, dark highlighted surface |
| Hover | Not visually acceptable | `rgb(31, 41, 55)` background and accent border |
| Visual evidence | White blank rows | 1280 cropped screenshot shows five readable dark action rows |

## PM acceptance checklist

- [x] Independently inspect the 1280x720 visual frame.
- [x] Confirm the selected-card menu does not clip against the central board in normal use.
- [x] Confirm right-rail collapse/expand and Corner Assist behavior visually.
- [x] Confirm no product behavior contract changed.
- [x] Accept or return a bounded P0 correction.

## PM independent acceptance

- PM captured a fresh 1280x720 cockpit frame with the task form and `立即派活` visible without scrolling.
- PM reproduced the first menu failure: the summary overflowed the selected card, hit a later Agent card, changed selection, and did not open. The bounded card-height/portal correction was required before acceptance.
- PM reproduced the second menu failure: portal actions rendered as white blank rows. Independent portal button styling was required before acceptance.
- Final PM replay confirmed the selected summary is inside the card, hit-tests its own `更多` content, keeps `Codex` selected, and opens `details` with a portal menu above the Dock.
- Final computed styles and screenshot show five readable dark actions at 32px height with visible Lucide icons/text, hover treatment, and focus styling.
- Right-rail collapse exposed Corner Assist; the panel opened inside the viewport. Expanding the right rail hid Corner Assist again.
- `electron/main.ts` remained outside the v3.2 diff, connector execution remained disabled, and P1/P2 were not started.

## boundaries preserved

- No P1/P2 implementation.
- No connector execution or connector metadata change.
- No `electron/**`, ranch, avatar component, agent core, desktop client, types, package, icon, or keyframe change.
- Existing uncommitted `electron/main.ts` work remains outside this lane.
- Worker did not stage, commit, push, reset, clean, or force-push.
