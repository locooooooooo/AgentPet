# Homepage layout density evidence - 2026-07-16

## Goal

- Compress the homepage hero so the configured workstation matrix is visible sooner.
- Replace the right-side control entry and metric squares with a quieter, denser desktop-tool layout.
- Keep runtime, Agent, task, orchestration, and Connector data contracts unchanged.

## Scope

Changed:

- `src/homepage/HomePage.css`
- `src/homepage/components/CockpitEntryCard.tsx`

Not changed:

- `src/homepage/hooks/useHomePageData.ts`
- Agent, task, runtime, ranch, orchestration, and Connector source data
- `src/components/NiuMaWorkspace.tsx` and `src/index.css`, which were already owned by the concurrent cockpit P1 lane

## Layout decisions

- Hero height at the screenshot-sized renderer was reduced from about `267px` to `144px`.
- The brand mark is `68px` at desktop widths and the homepage title is `30px`; the header is now a product toolbar, not a marketing hero.
- The cockpit description is one line. Running/total counts and the cockpit command share one compact action row.
- Section titles lead on the left; supporting data-source/count copy sits on the right.
- Four runtime metrics now share one bordered `2 x 2` data surface. Each cell is `72px` high at the target desktop breakpoint instead of a standalone large square card.
- The latest event is a `54px` inline detail row below the metric surface.
- The footer gap is `12px`, allowing the bottom tools to remain visible without compressing workstation content.

## Browser measurements

| Renderer viewport | Hero | Workstation grid bottom | All 8 workstations visible | Metric surface | Latest event | Footer bottom | Horizontal overflow |
| --- | ---: | ---: | --- | ---: | ---: | ---: | --- |
| `1204 x 798` (provided screenshot content size) | `144px` | `744px` | yes | `154px` | `54px` | `796px` | no |
| `1280 x 842` (approx. `1280 x 900` Electron outer window) | `144px` | `744px` | yes | `154px` | `54px` | `796px` | no |
| `1440 x 900` | `154px` | `846px` | yes | `154px` | `54px` | `898px` | no |

The deliberate single-line ellipsis is limited to long runtime-source detail and narrow metric labels. Titles, values, commands, all eight workstation cards, and footer tools remain visible without overlap.

## Verification

- `npm.cmd run lint`: pass
- `npm.cmd run build`: pass
- `git diff --check`: pass
- Browser DOM and screenshot review at all three viewports: pass
- Browser console warnings/errors: none

No files were staged, committed, pushed, reset, cleaned, or reverted by this lane.
