import assert from 'node:assert/strict';
import fs from 'node:fs';

const ranchAppSource = fs.readFileSync('src/ranch/RanchApp.tsx', 'utf8');
const dockSource = fs.readFileSync('src/ranch/hooks/useDockAndDrag.ts', 'utf8');
const mainSource = fs.readFileSync('electron/main.ts', 'utf8');
const cssSource = fs.readFileSync('src/ranch/styles/ranch.css', 'utf8');

assert.match(
  ranchAppSource,
  /const DESKTOP_INTERACTIVE_SELECTOR = '\.animal, \.ranch-actions, \.ranch-action-button'/
);
assert.doesNotMatch(ranchAppSource, /DESKTOP_INTERACTIVE_SELECTOR[^\n]*ranch-fence/);
assert.match(ranchAppSource, /setInteractiveRegions\(readDesktopInteractiveRegions\(\)\)/);
assert.match(ranchAppSource, /setDesktopPassthrough\(true\)/);
assert.match(ranchAppSource, /if \(!isDesktop\)[\s\S]*setInteractiveRegions\(\[\]\)[\s\S]*setMousePassthrough\(false\)/);
assert.match(ranchAppSource, /handleDoubleClick[\s\S]*\.animal\[data-agent-id\][\s\S]*openCockpit\(agentId\)/);
assert.match(ranchAppSource, /showContextMenu[\s\S]*api\.ranch\.showContextMenu/);

assert.match(mainSource, /ranchPrefs\.mode === 'desktop' && passthrough/);
assert.match(mainSource, /setFocusable\(ranchPrefs\.mode === 'floating'\)/);
assert.match(mainSource, /setIgnoreMouseEvents\(true, \{ forward: true \}\)/);
assert.match(mainSource, /setIgnoreMouseEvents\(false\)/);
assert.match(mainSource, /screen\.getCursorScreenPoint\(\)[\s\S]*ranchInteractiveRegions\.some/);
assert.match(mainSource, /x: windowBounds\.x \+ region\.x[\s\S]*y: windowBounds\.y \+ region\.y/);
assert.match(mainSource, /setInterval\(updateRanchPassthroughFromCursor, ranchHotzonePollMs\)/);

assert.match(dockSource, /const SNAP_THRESHOLD = 32/);
assert.match(dockSource, /const SNAP_HOLD_MS = 1000/);
assert.match(dockSource, /if \(!isFloating \|\| event\.button !== 0\)/);
assert.match(dockSource, /target\.closest\('\[data-ranch-no-drag="true"\]'\)/);
assert.match(dockSource, /getNearestEdge\(rawBounds, workArea\)/);
assert.match(dockSource, /snapBounds\(rawBounds, nextEdge, workArea\)/);
assert.match(dockSource, /dockedEdge: edge/);
assert.match(dockSource, /api\.ranch\.setBounds\(bounds\)[\s\S]*api\.ranch\.setPrefs/);

assert.match(cssSource, /#ranch-root \.ranch-fence \{[\s\S]*?pointer-events: none;/);

console.log('ranch pointer contract check passed.');
console.log('desktop=bounded hot zones + forwarded passthrough; floating=drag + 32px snap + persisted dock edge');
console.log('pointerInputExecuted=false; direct OS pointer behavior remains residual risk');
