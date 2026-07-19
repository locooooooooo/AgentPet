import assert from 'node:assert/strict';
import { build } from 'esbuild';
import path from 'node:path';

const modulePath = path.join(process.cwd(), 'src/lib/agentLibrary.ts');
const bundled = await build({
  entryPoints: [modulePath],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false
});
const library = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
);

const { AGENT_LIBRARY_MANIFESTS, projectAgentLibrary } = library;
const now = '2026-07-19T12:00:00.000Z';

const host = ({ availability = 'available', facts = [], lifecycle = [] } = {}) => ({
  version: 1,
  availability,
  source: availability === 'unsupported' ? 'unsupported' : availability === 'unavailable' ? 'unavailable' : 'windows-process-list',
  observedAt: now,
  facts,
  lifecycle,
  detail: 'Agent Library fixture.'
});

const truth = ({ agents = [], projectedAt = now } = {}) => ({
  runtime: {
    availability: 'available',
    mode: 'real',
    source: 'electron-main',
    observedAt: projectedAt
  },
  hostDiscovery: host(),
  thresholds: { freshMs: 5_000, staleMs: 15_000 },
  projectedAt,
  agents,
  instances: [],
  tasks: [],
  summary: {
    configuredCount: agents.filter((agent) => agent.configured).length,
    discoveredInstanceCount: 0,
    onlineSessionCount: 0,
    busySessionCount: 0,
    degradedSessionCount: 0,
    offlineSessionCount: 0,
    unknownInstanceCount: 0,
    simulatedAgentCount: 0
  }
});

const codexHost = ({ availability = 'unavailable', clientRunning = false } = {}) => ({
  version: 1,
  availability,
  source: availability === 'available' ? 'codex-desktop-session-log' : 'unavailable',
  observedAt: now,
  clientRunning,
  activeSessionCount: clientRunning ? 1 : 0,
  sessions: [],
  detail: 'Codex fixture.'
});

const connectors = [
  { id: 'codex', status: 'draft', approvalStatus: 'pending', enabledByDefault: false },
  { id: 'trae', status: 'draft', approvalStatus: 'pending', enabledByDefault: false },
  { id: 'qoder', status: 'disabled', approvalStatus: 'rejected', enabledByDefault: false }
];

const lifecycle = (agentId, overrides = {}) => ({
  agentId,
  connectorId: agentId,
  displayName: agentId,
  installed: true,
  running: false,
  processCount: 0,
  state: 'stopped',
  primaryAction: 'launch',
  observedAt: now,
  detail: 'fixture',
  ...overrides
});

function project(overrides = {}) {
  return projectAgentLibrary({
    hostDiscovery: host(),
    agentTruth: truth(),
    codexHost: codexHost(),
    connectors,
    gateResults: {
      codex: { executable: false, connectorId: 'codex', blockedReasons: ['status-not-ready'] },
      trae: { executable: false, connectorId: 'trae', blockedReasons: ['status-not-ready'] },
      qoder: { executable: false, connectorId: 'qoder', blockedReasons: ['status-not-ready'] }
    },
    now,
    ...overrides
  });
}

const catalogued = project();
assert.equal(catalogued.filter((entry) => entry.catalogued).length, AGENT_LIBRARY_MANIFESTS.length);
assert(catalogued.every((entry) => entry.supportLevel === 'catalogued'));
assert(catalogued.every((entry) => entry.version.value === null && entry.version.source === 'version-not-observed'));
assert(catalogued.every((entry) => entry.installed.value === 'unknown'));
assert(catalogued.every((entry) => entry.connector.value !== 'ready' && entry.connector.value !== 'online'));

const installed = project({
  hostDiscovery: host({ lifecycle: [lifecycle('trae')] }),
  agentTruth: truth({ agents: [{ agentId: 'trae', connectorId: 'trae', configured: true }] })
});
const trae = installed.find((entry) => entry.agentId === 'trae');
assert.equal(trae?.supportLevel, 'launchable');
assert.equal(trae?.installed.value, 'yes');
assert.equal(trae?.running.value, 'no');
assert.equal(trae?.connector.value, 'blocked');

const orphan = project({
  hostDiscovery: host({ facts: [{
    agentId: 'kimi',
    connectorId: 'kimi',
    displayName: 'Kimi',
    running: true,
    processCount: 9,
    observedAt: now
  }] })
});
const kimi = orphan.find((entry) => entry.agentId === 'kimi');
assert(kimi && !kimi.catalogued, 'unbound Kimi must be visible as a discovery entry');
assert.equal(kimi.supportLevel, 'detected');
assert.equal(kimi.installed.value, 'unknown', 'process presence must not self-grant installed');
assert.equal(kimi.running.value, 'yes');
assert.equal(kimi.lifecycleState.value, 'detected', 'process presence must not self-grant working activity');
assert.equal(kimi.connector.value, 'unregistered');

const accepted = project({
  hostDiscovery: host({ lifecycle: [lifecycle('trae', { running: true, processCount: 1, state: 'working', primaryAction: 'focus' })] }),
  agentTruth: truth({
    agents: [{
      agentId: 'trae',
      connectorId: 'trae',
      configured: true,
      isOnline: true,
      primaryInstance: {
        capabilities: ['structured-json-events'],
        capabilitySource: 'runtime-observed'
      }
    }]
  }),
  connectors: [{ id: 'trae', status: 'ready', approvalStatus: 'accepted', enabledByDefault: true }],
  gateResults: {
    trae: { executable: true, connectorId: 'trae', command: 'trae-cli', args: [], cwdPolicy: 'workspace-root', envAllowlist: ['PATH'], timeoutSeconds: 60 }
  }
});
const acceptedTrae = accepted.find((entry) => entry.agentId === 'trae');
assert.equal(acceptedTrae?.connector.value, 'online');
assert.equal(acceptedTrae?.supportLevel, 'coordinatable');

const unavailable = project({
  hostDiscovery: host({ availability: 'unavailable' }),
  codexHost: codexHost({ availability: 'unavailable' })
});
assert(unavailable.every((entry) => entry.supportLevel === 'catalogued'));
assert(unavailable.every((entry) => entry.running.value === 'unknown'));

const qoder = catalogued.find((entry) => entry.agentId === 'qoder');
assert.equal(qoder?.connector.value, 'blocked');

console.log('agent library check passed.');
console.log('catalogue, host-only discovery, installed/launchable, connector blocking, coordinatable and unavailable fail-closed paths verified.');
