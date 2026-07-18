import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundled = await build({
  entryPoints: ['src/lib/agentSessionProjection.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false,
  logLevel: 'silent'
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`;
const { mapConnectorSessionStatus, projectAgentSessions } = await import(moduleUrl);

function runtimeTask(overrides = {}) {
  return {
    taskId: 'task-trae-1',
    sessionId: 'session-trae-1',
    agentId: 'trae',
    connectorId: 'trae',
    taskName: '跨文件依赖检查',
    source: 'runtime-spawn',
    startedAt: '2026-07-18T08:00:00.000Z',
    lastSeen: '2026-07-18T08:01:00.000Z',
    sourceState: 'running',
    effectiveState: 'running',
    relation: 'matched',
    isRunning: true,
    isTerminal: false,
    ...overrides
  };
}

const codexHost = {
  version: 1,
  availability: 'available',
  source: 'codex-desktop-session-log',
  observedAt: '2026-07-18T08:04:00.000Z',
  clientRunning: true,
  activeSessionCount: 1,
  sessions: [
    {
      sessionId: 'codex-running-session',
      workspace: 'E:\\多agent牛马',
      state: 'running',
      activeTurnCount: 1,
      lastEventAt: '2026-07-18T08:03:00.000Z',
      activeStartedAt: '2026-07-18T08:02:00.000Z'
    },
    {
      sessionId: 'codex-idle-session',
      workspace: 'E:\\PKR',
      state: 'idle',
      activeTurnCount: 0,
      lastEventAt: '2026-07-18T07:00:00.000Z',
      lastCompletedAt: '2026-07-18T07:00:00.000Z'
    }
  ],
  detail: 'Lifecycle-only fixture.'
};

const codexSessions = projectAgentSessions({
  agentId: 'codex',
  connectorId: 'codex',
  runtimeTasks: [runtimeTask({
    taskId: 'task-codex-1',
    sessionId: 'connector-codex-session',
    agentId: 'codex',
    connectorId: 'codex',
    taskName: '受控代码检查',
    effectiveState: 'success',
    sourceState: 'success',
    endedAt: '2026-07-18T08:04:00.000Z',
    isRunning: false,
    isTerminal: true
  })],
  codexHost
});

assert.deepEqual(
  codexSessions.map((session) => [session.source, session.title, session.status]),
  [
    ['connector-runtime', '受控代码检查', 'completed'],
    ['codex-desktop', 'Codex · 多agent牛马', 'working'],
    ['codex-desktop', 'Codex · PKR', 'idle']
  ],
  'Codex Desktop and Connector sessions must share one deterministic view without losing provenance'
);

const traeSessions = projectAgentSessions({
  agentId: 'trae',
  connectorId: 'trae',
  runtimeTasks: [runtimeTask()],
  codexHost
});
assert.equal(traeSessions.length, 1);
assert.equal(traeSessions[0].status, 'working');
assert.equal(traeSessions[0].source, 'connector-runtime');

const workBuddySessions = projectAgentSessions({
  agentId: 'workbuddy',
  connectorId: 'workbuddy',
  runtimeTasks: [],
  codexHost
});
assert.deepEqual(workBuddySessions, [], 'A running host process must not fabricate a Session');

for (const state of ['queued', 'starting', 'running', 'stopping', 'retrying', 'recovering', 'reattached']) {
  assert.equal(mapConnectorSessionStatus(state), 'working', `${state} must map to working`);
}
assert.equal(mapConnectorSessionStatus('success'), 'completed');
for (const state of ['error', 'stopped', 'timed-out', 'dependency-blocked', 'policy-blocked', 'permission-denied', 'session-lost']) {
  assert.equal(mapConnectorSessionStatus(state), 'failed', `${state} must map to failed`);
}

console.log('agent session projection check passed.');
console.log('Codex Desktop and Connector Runtime session sources remain distinguishable: verified');
console.log('Trae runtime task maps to working; WorkBuddy host presence alone yields no Session: verified');
