# cockpit-ui-redesign-v3.2 P1 progress - 2026-07-16

⟦tag:v2|session|cockpit-ui-redesign-v3.2-p1-progress-2026-07-16⟧

[长工]#cockpit-visual-intake@v3.2-p1
loop state: summarized
dispatch state: summarized

status: ready_for_pm_review
scope: P1 only
baseline: `a6bae41`

## completed

- Added one shared governance query across role and Lane identity, owner, responsibility, evidence, role, and next-action fields.
- Added `all / active / blocked / standby / summarized` state filtering, live result counts, one-action clear, and explicit empty results.
- Search and non-default state filters expand both result groups; role and Lane controls now expose `aria-expanded` and `aria-controls`.
- Replaced the permanently truncated blocker with a closed summary and on-demand full text, visible truth-source path, blocker copy, source-path copy, and live success/failure feedback.
- Added a first-focus region jump path in the order global health, Agent matrix, Operator, and governance details.
- Region targets receive stable programmatic focus and a visible outline. Operator jump expands a collapsed right rail and closes Corner Assist; governance jump expands a collapsed left rail.
- Closed blocker details expose no child copy controls in layout or focus order.

## runtime evidence

### governance discovery

- Query `local-runner` returned `1/44` roles and `1/30` Lanes, expanded both groups, and kept page width `1280 == 1280`.
- A clean `blocked` state filter returned `0/44` roles and `1/30` Lanes; the Lane state was `blocked` and the role group showed its empty result.
- Clear restored empty query, state `all`, counts `44/44` and `30/30`, and disabled itself.

### blocker disclosure and copy

- Closed state renders the disclosure content at `display:none`; both copy controls have zero-size boxes and do not enter focus order.
- Open state showed the full blocker, two copy controls, and truth source `docs/orchestration/index.md` without horizontal page overflow.
- Blocker copy produced `阻塞全文已复制` and a 302-character clipboard value beginning with the expected blocker.
- Source copy produced `真源路径已复制` and clipboard value `docs/orchestration/index.md`.

### keyboard and 1280x720

- The first four focus targets are global health, Agent matrix, Operator, and governance details.
- From the region jump group, Operator is the third focus target. Keyboard activation on a collapsed Operator restored `is-open`, hid Corner Assist, focused `#cockpit-operator-region`, and produced a visible solid outline.
- Default sequential focus positions were task tab `36`, task-name input `40`, CTA `42`; the direct Operator route avoids crossing Agent-card actions.
- At `1280x720`, page width was `1280 == 1280`; task name, command, and CTA were visible. CTA bottom was `600.9`, Operator bottom `636`, and Dock top `648`.
- Right rail open kept Corner Assist at `display:none`; right rail collapsed exposed Corner Assist at `display:grid`.

## validation

- `npm.cmd run lint` passed before the final closed-details correction.
- `npm.cmd run build` passed before the final closed-details correction.
- `git diff --check` passed before the final closed-details correction.
- Final orchestration, lint, build, and diff-check results are recorded in the worker callback.

## residual validation

- PM should independently replay 1440x900 and wide-screen no-overflow screenshots.
- PM should independently replay the selected-card P0 portal menu after the P1 commit; P1 did not modify its component or CSS rules.
- Electron clipboard permission behavior remains an acceptance replay item; browser copy and clipboard contents passed.

## boundaries preserved

- No P2 visual-system work.
- No `StatusStrip.tsx`, connector, Electron, ranch, avatar, agent core, type, package, icon, or keyframe change.
- No external Agent execution.
- No stage, commit, push, reset, or clean.
