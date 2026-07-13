import { build } from 'esbuild';
import path from 'node:path';

const root = process.cwd();
const projectionPath = path.join(root, 'src/lib/agentInstanceProjection.ts');
const bundled = await build({
  entryPoints: [projectionPath],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false
});
const projectionModule = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
);
const {
  DEFAULT_AGENT_PROJECTION_THRESHOLDS,
  projectAgentInstances,
  selectAgentTruthByAgentId,
  selectAgentTruthByIdentity,
  selectAgentTruthSummary,
  selectProjectedTasksBySessionId
} = projectionModule;

const NOW_MS = Date.parse('2026-07-13T00:00:20.000Z');
const NOW = new Date(NOW_MS);
const CONFIGURED_AGENTS = Array.from({ length: 8 }, (_, index) => ({
  id: index === 0 ? 'codex' : `agent-${index + 1}`,
  connectorId: index === 0 ? 'codex' : `connector-${index + 1}`
}));

assert(
  DEFAULT_AGENT_PROJECTION_THRESHOLDS.freshMs === 5_000 &&
  DEFAULT_AGENT_PROJECTION_THRESHOLDS.staleMs === 15_000,
  'projection thresholds must freeze 5s fresh and 15s stale boundaries'
);

const configuredOnly = project(snapshot());
assert(configuredOnly.summary.configuredCount === 8, '8 seeds must project as 8 configured identities');
assert(configuredOnly.summary.onlineSessionCount === 0, '8 seeds with 0 sessions must project 0 online');
assert(configuredOnly.agents.every((agent) => agent.presence === 'configured'), 'seed-only agents must remain configured');

const discovered = project(snapshot({
  instances: [instance({
    status: 'configured',
    source: 'connector-runtime',
    sessionId: undefined,
    lastSeen: undefined,
    liveness: unknownLiveness()
  })]
}));
assert(discovered.instances[0].presence === 'discovered', 'real runtime instance without a Session must be discovered only');
assert(discovered.summary.onlineSessionCount === 0, 'discovered command/runtime fact must not count online');

const boundaryCases = [
  [5_000, 'online', true],
  [5_001, 'degraded', false],
  [14_999, 'degraded', false],
  [15_000, 'offline', false]
];
for (const [ageMs, expectedPresence, expectedOnline] of boundaryCases) {
  const lastSeen = isoAgo(ageMs);
  const result = project(snapshot({
    instances: [instance({
      lastSeen,
      liveness: liveness(lastSeen, ageMs >= 15_000 ? 'stale' : 'fresh')
    })]
  }));
  assert(result.instances[0].presence === expectedPresence, `${ageMs}ms heartbeat must be ${expectedPresence}`);
  assert(result.instances[0].isOnline === expectedOnline, `${ageMs}ms heartbeat online flag must be ${expectedOnline}`);
}

const invalidTime = project(snapshot({
  instances: [instance({
    lastSeen: 'not-a-date',
    liveness: liveness('not-a-date', 'fresh')
  })]
}));
assertState(invalidTime, 'unknown', 'invalid-last-seen', 'invalid lastSeen');

const futureTime = new Date(NOW_MS + 1).toISOString();
const future = project(snapshot({
  instances: [instance({
    lastSeen: futureTime,
    liveness: liveness(futureTime, 'fresh')
  })]
}));
assertState(future, 'unknown', 'future-last-seen', 'future lastSeen');

const missingSource = project(snapshot({
  instances: [instance({ source: 'static-config' })]
}));
assertState(missingSource, 'unknown', 'missing-source-proof', 'static source with Session');

const missingSession = project(snapshot({
  instances: [instance({ sessionId: undefined })]
}));
assertState(missingSession, 'unknown', 'missing-session-id', 'missing sessionId');

const missingLastSeen = project(snapshot({
  instances: [instance({
    lastSeen: undefined,
    liveness: unknownLiveness()
  })]
}));
assertState(missingLastSeen, 'unknown', 'missing-last-seen', 'missing lastSeen');

const inconsistentLastSeen = project(snapshot({
  instances: [instance({
    lastSeen: isoAgo(1_000),
    liveness: liveness(isoAgo(2_000), 'fresh')
  })]
}));
assertState(inconsistentLastSeen, 'unknown', 'inconsistent-liveness-proof', 'inconsistent liveness evidence');

for (const availability of ['unavailable', 'unknown', 'recovering']) {
  const unavailable = project(snapshot({
    instances: [instance()],
    runtime: { availability }
  }));
  assert(unavailable.summary.onlineSessionCount === 0, `${availability} runtime must clear cached online success`);
  assert(unavailable.instances[0].presence === 'unknown', `${availability} runtime must project cached instance unknown`);
}

const untrustedRuntimeSource = project(snapshot({
  instances: [instance()],
  runtime: { source: 'browser-fallback' }
}));
assertState(untrustedRuntimeSource, 'unknown', 'runtime-source-untrusted', 'untrusted real runtime source');

const invalidRuntimeObservedAt = project(snapshot({
  instances: [instance()],
  runtime: { observedAt: 'invalid-runtime-time' }
}));
assertState(invalidRuntimeObservedAt, 'unknown', 'invalid-runtime-observed-at', 'invalid runtime observedAt');

const futureRuntimeObservedAt = project(snapshot({
  instances: [instance()],
  runtime: { observedAt: new Date(NOW_MS + 1).toISOString() }
}));
assertState(futureRuntimeObservedAt, 'unknown', 'future-runtime-observed-at', 'future runtime observedAt');

const observedAtInversion = project(snapshot({
  instances: [instance({
    lastSeen: isoAgo(1_000),
    liveness: liveness(isoAgo(1_000), 'fresh')
  })],
  runtime: { observedAt: isoAgo(2_000) }
}));
assertState(
  observedAtInversion,
  'unknown',
  'last-seen-after-runtime-observed-at',
  'lastSeen after runtime observedAt'
);

const simulated = project(snapshot({
  instances: [instance({ source: 'simulated' })],
  runtime: {
    availability: 'unavailable',
    mode: 'simulated',
    source: 'browser-fallback',
    reason: 'Browser fallback does not expose a real Connector runtime.'
  }
}));
assert(simulated.summary.onlineSessionCount === 0, 'simulation must never count online');
assert(simulated.instances[0].presence === 'simulated', 'simulated runtime instance must remain explicit');

const simulatedWithoutInstances = project(snapshot({
  runtime: {
    availability: 'unavailable',
    mode: 'simulated',
    source: 'browser-fallback'
  }
}));
assert(simulatedWithoutInstances.summary.simulatedAgentCount === 8, 'browser fallback must mark all configured agents simulated');

const matchedTask = task();
const busy = project(snapshot({
  instances: [instance({ status: 'busy' })],
  tasks: [matchedTask]
}));
assert(busy.instances[0].presence === 'busy', 'fresh Session with tied running task must project busy');
assert(busy.instances[0].reason === 'fresh-running-task', 'busy Session must retain fresh-running-task reason');
assert(busy.instances[0].activity === 'busy' && busy.instances[0].isOnline, 'busy must remain an online activity state');
assert(busy.summary.busySessionCount === 1, 'busy selector must count tied running Session');
assert(busy.tasks[0].relation === 'matched' && busy.tasks[0].isRunning, 'all four task identity fields must produce a running match');

const terminalStates = [
  'success',
  'error',
  'stopped',
  'timed-out',
  'session-lost',
  'policy-blocked',
  'permission-denied'
];
for (const state of terminalStates) {
  const terminal = project(snapshot({
    instances: [instance({ status: 'busy' })],
    tasks: [task({ state })]
  }));
  assert(terminal.instances[0].presence === 'offline', `${state} task must force Session offline`);
  assert(terminal.instances[0].activity === 'terminal', `${state} task must force terminal activity`);
  assert(!terminal.instances[0].isOnline, `${state} task must override fresh heartbeat online evidence`);
  assert(terminal.summary.onlineSessionCount === 0, `${state} task must count 0 online Sessions`);
}

const mismatchCases = [
  task({ agentId: 'wrong-agent' }),
  task({ connectorId: 'wrong-connector' }),
  task({ taskId: '' })
];
for (const mismatchedTask of mismatchCases) {
  const mismatch = project(snapshot({
    instances: [instance({ status: 'busy' })],
    tasks: [mismatchedTask]
  }));
  assert(mismatch.instances[0].presence === 'online', 'identity mismatch must not fabricate busy');
  assert(mismatch.instances[0].activity === 'unknown', 'identity mismatch activity must remain unknown');
  assert(mismatch.summary.busySessionCount === 0, 'identity mismatch must count 0 busy');
  assert(mismatch.tasks[0].relation === 'identity-mismatch', 'same Session with mismatched IDs must be marked identity-mismatch');
}

const lost = project(snapshot({
  instances: [instance({ status: 'offline', source: 'session-lost' })],
  tasks: [task({ state: 'running' })]
}));
assertState(lost, 'offline', 'session-lost', 'lost Session');
assert(lost.tasks[0].sourceState === 'running', 'fixture must retain source running task evidence');
assert(lost.tasks[0].effectiveState === 'session-lost', 'Session loss must override a stale running task projection');
assert(!lost.tasks[0].isRunning && lost.tasks[0].isTerminal, 'lost task must be terminal and not running');

const policyBlocked = project(snapshot({
  instances: [instance({ status: 'offline' })],
  tasks: [task({ state: 'policy-blocked' })]
}));
assertState(policyBlocked, 'offline', 'policy-blocked', 'policy blocked Session');

const exactDuplicate = project(snapshot({
  instances: [instance(), instance()]
}));
assert(exactDuplicate.instances.length === 1, 'identical duplicate Session facts must merge deterministically');
assert(exactDuplicate.summary.onlineSessionCount === 1, 'identical duplicate Session must count online once');

const duplicateBusy = project(snapshot({
  instances: [instance({ status: 'busy' }), instance({ status: 'busy' })],
  tasks: [task()]
}));
assert(duplicateBusy.instances.length === 1, 'identical duplicate busy facts must merge');
assert(duplicateBusy.summary.onlineSessionCount === 1, 'duplicate busy Session must count online once');
assert(duplicateBusy.summary.busySessionCount === 1, 'duplicate busy Session must count busy once');

const conflictingDuplicate = project(snapshot({
  instances: [instance({ status: 'online' }), instance({ status: 'offline' })]
}));
assert(conflictingDuplicate.instances.length === 1, 'conflicting duplicate facts for one identity must merge');
assertState(
  conflictingDuplicate,
  'unknown',
  'duplicate-session-conflict',
  'conflicting duplicate Session'
);
assert(conflictingDuplicate.summary.onlineSessionCount === 0, 'conflicting duplicate Session must fail closed');

const connectorMismatch = project(snapshot({
  instances: [instance({ connectorId: 'other-connector' })]
}));
const configuredCodex = selectAgentTruthByIdentity(connectorMismatch, 'codex', 'codex');
const orphanConnector = selectAgentTruthByIdentity(connectorMismatch, 'codex', 'other-connector');
assert(configuredCodex?.configured && configuredCodex.instances.length === 0, 'configured identity must retain exact connector pair');
assert(orphanConnector && !orphanConnector.configured, 'same agentId with connector mismatch must not inherit configured truth');

const staticOfflineWithoutSession = project(snapshot({
  instances: [instance({
    status: 'offline',
    source: 'static-config',
    sessionId: undefined,
    lastSeen: undefined,
    liveness: unknownLiveness()
  })]
}));
assert(staticOfflineWithoutSession.instances[0].presence === 'unknown', 'session-less static offline fact must fail closed');
assert(staticOfflineWithoutSession.summary.offlineSessionCount === 0, 'session-less static fact must not count offline Session KPI');

const runtimeOfflineWithoutSession = project(snapshot({
  instances: [instance({
    status: 'offline',
    source: 'connector-runtime',
    sessionId: undefined
  })]
}));
assert(runtimeOfflineWithoutSession.instances[0].reason === 'missing-session-id', 'runtime offline fact must prove sessionId first');
assert(runtimeOfflineWithoutSession.summary.offlineSessionCount === 0, 'runtime offline fact without sessionId must not count offline');

const nullCapabilities = project(snapshot({
  instances: [instance({ capabilities: null, capabilitySource: 'unknown' })]
}));
assert(nullCapabilities.instances[0].capabilities === null, 'unknown capabilities must remain null');
assert(nullCapabilities.instances[0].capabilitySource === 'unknown', 'capability source must remain traceable');

const sameTime = isoAgo(1_000);
const deterministicInstances = [
  instance({ instanceId: 'codex-b', sessionId: 'session-b', lastSeen: sameTime, liveness: liveness(sameTime, 'fresh') }),
  instance({ instanceId: 'codex-a', sessionId: 'session-a', lastSeen: sameTime, liveness: liveness(sameTime, 'fresh') }),
  instance({
    instanceId: 'codex-z',
    sessionId: 'session-z',
    status: 'busy',
    lastSeen: isoAgo(4_000),
    liveness: liveness(isoAgo(4_000), 'fresh')
  })
];
const deterministicTasks = [task({ taskId: 'task-z', sessionId: 'session-z' })];
const deterministic = project(snapshot({
  instances: deterministicInstances,
  tasks: deterministicTasks
}));
const codexTruth = selectAgentTruthByAgentId(deterministic, 'codex');
assert(codexTruth?.instances.length === 3, 'multiple Sessions for one agent must be preserved');
assert(codexTruth.primaryInstance?.sessionId === 'session-z', 'fresh active real Session must outrank newer idle Sessions');
assert(
  codexTruth.instances.filter((item) => item.presence === 'online').map((item) => item.sessionId).join(',') === 'session-a,session-b',
  'equal fresh Sessions must use deterministic sessionId tie-break'
);

const reordered = project(snapshot({
  instances: [...deterministicInstances].reverse(),
  tasks: [...deterministicTasks].reverse()
}));
assert(
  JSON.stringify(deterministic) === JSON.stringify(reordered),
  'projection output must not depend on runtime instances/tasks input order'
);

const immutableSnapshot = snapshot({
  instances: [instance({ capabilities: ['structured-events'] })],
  tasks: [task()]
});
const immutableBefore = JSON.stringify(immutableSnapshot);
const immutableProjection = project(immutableSnapshot);
immutableProjection.instances[0].capabilities.push('projection-only');
assert(JSON.stringify(immutableSnapshot) === immutableBefore, 'projection and selector work must not mutate input snapshots');

const selectedSummary = selectAgentTruthSummary(deterministic);
assert(selectedSummary.onlineSessionCount === 3, 'summary selector must count busy and online fresh Sessions');
const selectedTasks = selectProjectedTasksBySessionId(deterministic, 'session-z');
assert(selectedTasks.length === 1 && selectedTasks[0].taskId === 'task-z', 'task selector must retain Session traceability');
selectedTasks[0].taskId = 'selector-copy';
assert(deterministic.tasks[0].taskId === 'task-z', 'task selector must return defensive copies');

assertThrows(
  () => projectAgentInstances({
    configuredAgents: CONFIGURED_AGENTS,
    runtimeSnapshot: snapshot(),
    now: NOW,
    thresholds: { freshMs: 15_000, staleMs: 5_000 }
  }),
  'invalid threshold ordering must fail closed'
);
assertThrows(
  () => projectAgentInstances({
    configuredAgents: CONFIGURED_AGENTS,
    runtimeSnapshot: snapshot(),
    now: 'invalid-now'
  }),
  'invalid now must fail closed'
);

console.log('agent instance projection check passed.');
console.log('configured/discovered/online/busy/degraded/offline/unknown/simulated: verified');
console.log('heartbeat boundaries 5000/5001/14999/15000 and invalid/future evidence: verified');
console.log('terminal precedence, observedAt causality and four-ID task association: verified');
console.log('unique Session KPI, duplicate conflict fail-closed and configured identity pairs: verified');
console.log('runtime unavailable, simulation, multi-Session ordering and input immutability: verified');

function project(runtimeSnapshot) {
  return projectAgentInstances({
    configuredAgents: CONFIGURED_AGENTS,
    runtimeSnapshot,
    now: NOW
  });
}

function snapshot(overrides = {}) {
  return {
    version: 1,
    updatedAt: NOW.toISOString(),
    tasks: overrides.tasks ?? [],
    instances: overrides.instances ?? [],
    runtime: {
      availability: 'available',
      mode: 'real',
      source: 'electron-main',
      observedAt: NOW.toISOString(),
      ...(overrides.runtime ?? {})
    }
  };
}

function instance(overrides = {}) {
  const lastSeen = Object.hasOwn(overrides, 'lastSeen') ? overrides.lastSeen : isoAgo(1_000);
  const hasSessionId = !Object.hasOwn(overrides, 'sessionId') || overrides.sessionId !== undefined;
  return {
    instanceId: 'codex-instance',
    agentId: 'codex',
    connectorId: 'codex',
    status: 'online',
    source: 'connector-runtime',
    ...(hasSessionId ? { sessionId: overrides.sessionId ?? 'session-1' } : {}),
    ...(lastSeen === undefined ? {} : { lastSeen }),
    capabilities: ['structured-events', 'task-execution'],
    capabilitySource: 'adapter-declaration',
    liveness: lastSeen === undefined ? unknownLiveness() : liveness(lastSeen, 'fresh'),
    ...without(overrides, ['sessionId', 'lastSeen'])
  };
}

function task(overrides = {}) {
  const lastSeen = isoAgo(1_000);
  return {
    taskId: 'task-1',
    sessionId: 'session-1',
    connectorId: 'codex',
    agentId: 'codex',
    taskName: 'fixture task',
    requestedBy: 'explicit-user-action',
    source: 'runtime-spawn',
    capabilities: ['structured-events', 'task-execution'],
    capabilitySource: 'adapter-declaration',
    state: 'running',
    startedAt: isoAgo(2_000),
    attempt: 1,
    maxAttempts: 1,
    retryPolicy: { maxRetries: 0, backoffMs: 1_000, budgetMs: 0 },
    output: {
      receivedBytes: 0,
      archivedBytes: 0,
      droppedBytes: 0,
      outputEvents: 0,
      truncatedLines: 0,
      backpressureEvents: 0
    },
    liveness: liveness(lastSeen, 'fresh'),
    events: [],
    ...overrides
  };
}

function liveness(lastSeen, status) {
  return {
    status,
    source: 'process-event',
    lastSeen,
    staleAfterMs: 15_000
  };
}

function unknownLiveness() {
  return {
    status: 'unknown',
    source: 'none',
    staleAfterMs: 15_000
  };
}

function isoAgo(ageMs) {
  return new Date(NOW_MS - ageMs).toISOString();
}

function without(value, keys) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
}

function assertState(result, presence, reason, label) {
  assert(result.instances[0].presence === presence, `${label} must project ${presence}`);
  assert(result.instances[0].reason === reason, `${label} must retain reason ${reason}`);
  assert(!result.instances[0].isOnline, `${label} must not project online`);
}

function assertThrows(callback, message) {
  let threw = false;
  try {
    callback();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
