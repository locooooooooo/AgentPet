import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const modulePath = path.join(root, 'electron', 'agentHostDiscovery.ts');
const bundled = await build({
  entryPoints: [modulePath],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`;
const { collectAgentHostFacts, collectAgentHostLifecycleFacts, discoverAgentHosts } = await import(moduleUrl);

const OBSERVED_AT = '2026-07-18T05:00:00.000Z';
const now = () => new Date(OBSERVED_AT);
let injectedProcessListCalls = 0;

const kimi = await discoverAgentHosts({
  platform: 'win32',
  now,
  listProcesses: async () => {
    injectedProcessListCalls += 1;
    return [
      'Kimi.exe',
      'kimi.EXE',
      'Kimi.exe',
      'Kimi Helper.exe',
      'kimi-webbridge.exe',
      'node.exe'
    ];
  }
});
assert.equal(kimi.availability, 'available');
assert.equal(kimi.source, 'windows-process-list');
assert.equal(kimi.facts.length, 1, 'Kimi helper processes must aggregate into one Agent host fact');
assert.deepEqual(kimi.facts[0], {
  agentId: 'kimi',
  connectorId: 'kimi',
  displayName: 'Kimi',
  running: true,
  processCount: 3,
  observedAt: OBSERVED_AT
});

const allProducts = collectAgentHostFacts([
  'Trae.exe',
  'MiniMax Code.exe',
  'Kimi.exe',
  'WorkBuddy.exe',
  'MiniMax Code.exe'
], OBSERVED_AT);
assert.deepEqual(
  allProducts.map((fact) => [fact.agentId, fact.processCount]),
  [['trae', 1], ['workbuddy', 1], ['kimi', 1], ['minimax', 2]],
  'All exact product process names must produce deterministic facts'
);

const managedLifecycle = collectAgentHostLifecycleFacts({
  processNames: ['WorkBuddy.exe', 'MiniMax Code.exe'],
  installedAgentIds: ['trae', 'workbuddy', 'qoder', 'minimax', 'openclaw'],
  serviceInstalledAgentIds: []
}, OBSERVED_AT);
assert.deepEqual(
  managedLifecycle.map((fact) => [
    fact.agentId,
    fact.installed,
    fact.state,
    fact.primaryAction ?? null,
    fact.serviceInstalled ?? null
  ]),
  [
    ['trae', true, 'stopped', 'launch', null],
    ['workbuddy', true, 'idle', 'focus', null],
    ['qoder', true, 'stopped', 'launch', null],
    ['minimax', true, 'idle', 'focus', null],
    ['openclaw', true, 'stopped', 'install', false]
  ],
  'Managed lifecycle must distinguish installed/stopped, running/idle and OpenClaw service setup'
);

const nearMatches = collectAgentHostFacts([
  'Trae',
  'Trae Helper.exe',
  'Trae.exe.bak',
  'C:\\Trae\\Trae.exe',
  'WorkBuddy',
  'WorkBuddy Helper.exe',
  'WorkBuddy.exe.bak',
  'E:\\WorkBuddy\\WorkBuddy.exe',
  'Kimi',
  'Kimi Helper.exe',
  'Kimi.exe.old',
  'MiniMaxCode.exe',
  'MiniMax Code Helper.exe',
  'MiniMax Code.exe.bak',
  'H:\\MiniMax\\MiniMax Code\\MiniMax Code.exe'
], OBSERVED_AT);
assert.deepEqual(nearMatches, [], 'Paths, helpers and approximate names must not match');

const unavailable = await discoverAgentHosts({
  platform: 'win32',
  now,
  listProcesses: async () => {
    injectedProcessListCalls += 1;
    throw new Error('fixture contains C:\\private\\path and --secret');
  }
});
assert.equal(unavailable.availability, 'unavailable');
assert.equal(unavailable.source, 'unavailable');
assert.deepEqual(unavailable.facts, []);
assert.deepEqual(unavailable.lifecycle, []);
assert.doesNotMatch(unavailable.detail, /private|secret|fixture/i, 'Probe errors must not leak raw details');

let unsupportedProbeCalls = 0;
const unsupported = await discoverAgentHosts({
  platform: 'linux',
  now,
  listProcesses: async () => {
    unsupportedProbeCalls += 1;
    return ['Kimi.exe'];
  }
});
assert.equal(unsupported.availability, 'unsupported');
assert.equal(unsupported.source, 'unsupported');
assert.deepEqual(unsupported.facts, []);
assert.deepEqual(unsupported.lifecycle, []);
assert.equal(unsupportedProbeCalls, 0, 'Unsupported platforms must not run a Windows process probe');

for (const snapshot of [kimi, unavailable, unsupported]) {
  const serialized = JSON.stringify(snapshot);
  assert.doesNotMatch(serialized, /sessionId|activeTask|commandLine|executablePath|windowTitle/i);
  snapshot.facts.forEach((fact) => {
    assert.deepEqual(
      Object.keys(fact).sort(),
      ['agentId', 'connectorId', 'displayName', 'observedAt', 'processCount', 'running'].sort(),
      'Host facts must remain presence-only'
    );
    assert.equal('online' in fact, false);
    assert.equal('busy' in fact, false);
  });
}

const source = fs.readFileSync(modulePath, 'utf8');
assert.match(source, /execFile\(\s*'powershell\.exe'/s, 'Default Windows probe may execute fixed PowerShell only');
assert.match(source, /Get-Process -ErrorAction Stop/);
assert.match(source, /Get-CimInstance Win32_Process/, 'Gateway detection may inspect a fixed process command-line pattern');
assert.match(source, /Get-StartApps/, 'Installation detection must use Windows app registration');
assert.match(source, /ByteDance\.Trae/, 'Trae installation detection must use the fixed Windows AppID');
assert.match(source, /WorkBuddy\.WorkBuddy/, 'WorkBuddy installation detection must use the fixed Windows AppID');
assert.match(source, /Get-ScheduledTask -TaskName 'OpenClaw Gateway'/, 'OpenClaw service detection must use the fixed service name');
assert.doesNotMatch(source, /MainWindowTitle|ExecutablePath/);
assert.doesNotMatch(
  source,
  /execFile\(\s*['"](?:Trae|WorkBuddy|Kimi|MiniMax Code)(?:\.exe)?['"]/s,
  'Discovery must never launch an Agent executable'
);
assert.equal(injectedProcessListCalls, 2, 'Fixtures must use the injected read-only process list');

console.log('agent host discovery check passed.');
console.log('Kimi multi-process aggregation and Trae/WorkBuddy/Kimi/MiniMax exact matching: verified');
console.log('Trae/Qoder stopped, WorkBuddy/MiniMax idle and OpenClaw service-missing lifecycle states: verified');
console.log('paths/helpers/approximate names ignored; unavailable/unsupported fail closed: verified');
console.log('renderer facts expose no session/online/busy/path/command/title fields: verified');
console.log('external Agent spawn calls=0; injected process-list calls=2');
