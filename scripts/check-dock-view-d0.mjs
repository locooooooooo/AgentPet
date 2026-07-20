import assert from 'node:assert/strict';
import {
  DEFAULT_DOCK_VIEW_LAYOUT,
  DOCK_VIEW_LAYOUT_VERSION,
  DOCK_VIEW_REGISTRY,
  getDockViewDefinition,
  isDockViewId,
  projectDockViewLayout,
  restoreDockViewLayout,
  serializeDockViewLayout
} from '../src/lib/dockViewRegistry.ts';

assert.equal(DOCK_VIEW_LAYOUT_VERSION, 1);
assert.deepEqual(
  DOCK_VIEW_REGISTRY.map((view) => view.id),
  ['session-detail', 'agent-library', 'logs', 'control-status'],
  'D0 registry order must be deterministic'
);
assert.equal(getDockViewDefinition('logs').region, 'operator');
assert.equal(isDockViewId('control-status'), true);
assert.equal(isDockViewId('drag-drop'), false);

const projected = projectDockViewLayout({
  activeView: 'logs',
  selectedAgentId: ' codex ',
  selectedSessionKey: 'connector-runtime:session-1'
});
assert.deepEqual(projected, {
  version: 1,
  activeView: 'logs',
  selectedAgentId: 'codex',
  selectedSessionKey: 'connector-runtime:session-1'
});

const noAgent = projectDockViewLayout({ activeView: 'logs', selectedSessionKey: 'host-process:fake' });
assert.equal(noAgent.selectedAgentId, null);
assert.equal(noAgent.selectedSessionKey, null, 'host/process presence cannot create a Session');

const restored = restoreDockViewLayout(serializeDockViewLayout(projected));
assert.deepEqual(restored, projected);
assert.deepEqual(restoreDockViewLayout('{"version":999,"activeView":"logs"}'), DEFAULT_DOCK_VIEW_LAYOUT);
assert.deepEqual(restoreDockViewLayout('not json'), DEFAULT_DOCK_VIEW_LAYOUT);
assert.deepEqual(projectDockViewLayout({ activeView: 'drag-drop' }), DEFAULT_DOCK_VIEW_LAYOUT);

console.log('check-dock-view-d0: ok');
