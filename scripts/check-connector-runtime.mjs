import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const runtimePath = path.join(root, 'src/lib/connectorRuntime.ts');
const gatePath = path.join(root, 'src/lib/connectorGate.ts');
const typesPath = path.join(root, 'src/types.ts');
const desktopClientPath = path.join(root, 'src/lib/desktopClient.ts');
const mainPath = path.join(root, 'electron/main.ts');
const processProofPath = path.join(root, 'electron/connectorProcessProof.ts');
const policyPath = path.join(root, 'docs/orchestration/connectors.json');
const runtimeSource = fs.readFileSync(runtimePath, 'utf8');
const gateSource = fs.readFileSync(gatePath, 'utf8');
const typesSource = fs.readFileSync(typesPath, 'utf8');
const desktopClientSource = fs.readFileSync(desktopClientPath, 'utf8');
const mainSource = fs.readFileSync(mainPath, 'utf8');
const processProofSource = fs.readFileSync(processProofPath, 'utf8');
const currentPolicy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));

const gateIndex = runtimeSource.indexOf('evaluateConnectorPolicyGate(');
const authorizationIndex = runtimeSource.indexOf('const authorization = this.authorizeRun(request)');
const discoveryIndex = runtimeSource.indexOf('this.dependencies.resolveExecutable(command)');
const spawnIndex = runtimeSource.indexOf('this.dependencies.spawnProcess(');
assert(authorizationIndex >= 0 && gateIndex > authorizationIndex, 'authorization must remain before policy gate');
assert(gateIndex >= 0 && discoveryIndex > gateIndex && spawnIndex > discoveryIndex, 'gate must remain before discovery and spawn');
assert(runtimeSource.includes('shell: false'), 'runtime spawn must force shell=false');
assert(!/input\.(?:command|args|env|cwd|executable)/.test(runtimeSource), 'runtime must not read raw process fields');
assert(mainSource.includes('isTrustedConnectorSender(event)'), 'main IPC must validate the sender window');
assert(mainSource.includes("requestedBy: 'explicit-user-action'"), 'main IPC must own the explicit-user-action source');
assert(!/requestedBy:\s*input(?:\?|\.)/.test(mainSource), 'main IPC must not accept renderer requestedBy');
assert(!/confirmationAccepted:\s*input(?:\?|\.)/.test(mainSource), 'main IPC must not accept renderer confirmation');
assert(mainSource.includes('createReadOnlyConnectorGateRequest(input)'), 'main gate query must normalize and override renderer proof');
assert(!/connectors:evaluate-gate[\s\S]{0,250}evaluateConnectorGateFromPolicy\(input\)/.test(mainSource), 'main gate query must not forward renderer request object');
const runtimeFactorySource = mainSource.match(/function createConnectorRuntime\(\)[\s\S]*?\n\}/)?.[0] ?? '';
assert(runtimeFactorySource.includes('authorizeRun: (request) => connectorRunAuthorizer.consume(request)'), 'production runtime must consume the main-owned grant');
assert(mainSource.includes('dialog.showMessageBox(mainWindow!'), 'main process must own the confirmation dialog');
assert(mainSource.includes('connectorRunAuthorizer.issueConfirmedGrant(intent)'), 'main process must issue a grant only for normalized intent');
assert(/app\.on\('before-quit'[\s\S]*?connectorRunAuthorizer\?\.dispose\(\)/.test(mainSource), 'app shutdown must dispose outstanding grants');
assert(mainSource.includes('loadPersistedSnapshot: loadConnectorRuntimeSnapshot'), 'main must load persisted Connector sessions');
assert(mainSource.includes('persistSnapshot: saveConnectorRuntimeSnapshot'), 'main must persist Connector sessions');
assert(mainSource.includes('captureProcessFingerprint:'), 'main must capture bounded OS process identity after spawn');
assert(mainSource.includes('reattachProcess: reattachConnectorProcess'), 'main must wire production restart recovery');
assert(mainSource.includes('createAsyncReattachedConnectorProcess(session, context'), 'main recovery must use the asynchronous verified recovered handle');
assert(!runtimeFactorySource.includes('inspectConnectorProcessEvidence'), 'production runtime factory must not run synchronous process inspection');
assert(!mainSource.includes('Get-CimInstance Win32_Process'), 'Electron main must not embed synchronous CIM proof');
assert(processProofSource.includes("spawnProcess('powershell.exe'"), 'process proof must use an asynchronous child-process boundary');
assert(!processProofSource.includes('spawnSync'), 'process proof helper must not use spawnSync');
assert(processProofSource.includes('process-proof-result-late-or-superseded'), 'late or superseded proof must fail closed');
assert(!typesSource.includes('commandLine: string;'), 'persisted/public process fingerprint must not expose raw command line');
assert(desktopClientSource.includes("availability: 'unavailable'"), 'browser fallback must report unavailable');
assert(desktopClientSource.includes("mode: 'simulated'"), 'browser fallback must report simulated');
assert(/tasks:\s*\[\],\s*instances:\s*\[\]/.test(desktopClientSource), 'browser fallback must expose zero instances');
assert((typesSource.match(/capabilities:\s*string\[\]\s*\|\s*null/g) ?? []).length >= 2, 'capability unknown must remain explicit');
assert(typesSource.includes('eventId: string'), 'event contract must include eventId');
assert(typesSource.includes('ConnectorLifecycleSubtype'), 'event contract must include lifecycle subtype');

const bundled = await build({
  entryPoints: [runtimePath],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false
});
const runtimeModule = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const {
  ConnectorRunAuthorizer,
  ConnectorRuntime,
  computeHeartbeatFreshness,
  createConnectorProcessFingerprint,
  createReattachedConnectorProcess,
  selectDirectConnectorExecutable
} = runtimeModule;

const gateBundle = await build({
  entryPoints: [gatePath],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false
});
const gateModule = await import(`data:text/javascript;base64,${Buffer.from(gateBundle.outputFiles[0].text).toString('base64')}`);
assert(gateSource.includes("requestedBy: 'preflight'"), 'read-only gate helper must force preflight source');
assert(gateSource.includes('confirmationAccepted: false'), 'read-only gate helper must force confirmation=false');

assert(selectDirectConnectorExecutable([
  'C:\\fixture\\codex',
  'C:\\fixture\\codex.cmd',
  'C:\\fixture\\codex.com',
  'C:\\fixture\\codex.exe'
], 'win32') === 'C:\\fixture\\codex.exe', 'Windows resolver must prefer .exe');
assert(selectDirectConnectorExecutable([
  'C:\\fixture\\codex',
  'C:\\fixture\\codex.cmd',
  'C:\\fixture\\codex.bat',
  'C:\\fixture\\codex.ps1'
], 'win32') === null, 'Windows resolver must reject shell shims');
assert(computeHeartbeatFreshness(undefined, new Date('2026-07-13T00:00:15Z'), 10_000) === 'unknown', 'missing process evidence must be unknown');
assert(computeHeartbeatFreshness('2026-07-13T00:00:10Z', new Date('2026-07-13T00:00:15Z'), 10_000) === 'fresh', 'recent process evidence must be fresh');
assert(computeHeartbeatFreshness('2026-07-12T23:59:59Z', new Date('2026-07-13T00:00:15Z'), 10_000) === 'stale', 'old process evidence must be stale');

class FakeProcess extends EventEmitter {
  constructor(pid, options = {}) {
    super();
    this.pid = pid;
    this.stdout = new EventEmitter();
    this.stderr = new EventEmitter();
    this.killCount = 0;
    this.killResults = [...(options.killResults ?? [])];
    this.killError = options.killError ?? null;
    this.closeOnKill = options.closeOnKill ?? false;
  }

  kill() {
    this.killCount += 1;
    if (this.killError) {
      throw this.killError;
    }
    const result = this.killResults.length > 0 ? this.killResults.shift() : true;
    if (this.closeOnKill) {
      this.close(null, 'SIGTERM');
    }
    return result;
  }

  confirmSpawn() {
    this.emit('spawn');
  }

  close(code = 0, signal = null) {
    this.emit('close', code, signal);
  }
}

function readyPolicy() {
  const codex = currentPolicy.connectors.find((connector) => connector.id === 'codex');
  return {
    ...currentPolicy,
    connectors: [{
      ...codex,
      status: 'ready',
      approvalStatus: 'accepted',
      enabledByDefault: true,
      acceptedBy: 'fixture',
      acceptedAt: '2026-07-13T00:00:00+08:00',
      confirmation: 'required'
    }]
  };
}

const forgedGateQuery = {
  connectorId: '  codex  ',
  requestedBy: 'explicit-user-action',
  confirmationAccepted: true,
  command: 'renderer-must-not-control-this'
};
const normalizedGateQuery = gateModule.createReadOnlyConnectorGateRequest(forgedGateQuery);
assert(normalizedGateQuery.connectorId === 'codex', 'read-only gate query must normalize connectorId only');
assert(normalizedGateQuery.requestedBy === 'preflight', 'renderer requestedBy must be ignored');
assert(normalizedGateQuery.confirmationAccepted === false, 'renderer confirmationAccepted must be ignored');
let forgedGateDiscoveryCount = 0;
const forgedGateEvaluation = gateModule.evaluateConnectorPolicyGate(
  readyPolicy(),
  normalizedGateQuery,
  () => {
    forgedGateDiscoveryCount += 1;
    return true;
  }
);
assert(!forgedGateEvaluation.result.executable, 'forged read-only gate query must remain blocked');
assert(forgedGateEvaluation.result.blockedReasons.includes('confirmation-required'), 'forged read-only gate query must retain confirmation-required');
assert(forgedGateDiscoveryCount === 0, 'forged read-only gate query must not trigger discovery');

function createHarness(policy, options = {}) {
  const processes = [];
  const spawnCalls = [];
  const timers = [];
  const published = [];
  const persisted = [];
  let discoveryCount = 0;
  let id = 0;
  let nowMs = Date.parse(options.now ?? '2026-07-13T00:00:00.000Z');
  const dependencies = {
    loadPolicy: () => policy,
    resolveExecutable: (command) => {
      discoveryCount += 1;
      return command === 'codex' ? 'C:\\fixture\\codex.exe' : null;
    },
    spawnProcess: (file, args, spawnOptions) => {
      const process = options.spawnProcess?.(file, args, spawnOptions, processes.length)
        ?? new FakeProcess(4200 + processes.length);
      processes.push(process);
      spawnCalls.push({ file, args, options: spawnOptions, process });
      return process;
    },
    workspaceRoot: 'E:\\fixture-workspace',
    sourceEnv: {
      PATH: 'fixture-path',
      HOME: 'fixture-home',
      USERPROFILE: 'fixture-user',
      CODEX_HOME: 'fixture-codex-home',
      SECRET_SHOULD_NOT_PASS: 'secret'
    },
    publish: (snapshot) => published.push(structuredClone(snapshot)),
    persistSnapshot: (snapshot) => persisted.push(structuredClone(snapshot)),
    captureProcessFingerprint: options.captureProcessFingerprint ?? ((child, context) => (
      createConnectorProcessFingerprint({
        pid: child.pid,
        executablePath: context.executablePath,
        startedAt: new Date(nowMs - 100).toISOString(),
        commandLine: `${context.executablePath} fixture-${child.pid}`,
        evidenceSource: 'windows-cim'
      }, context, new Date(nowMs).toISOString())
    )),
    authorizeRun: options.authorizeRun ?? (() => ({ authorized: true })),
    heartbeatStaleAfterMs: options.heartbeatStaleAfterMs ?? 10_000,
    recoveryGraceMs: options.recoveryGraceMs ?? 500,
    terminationGraceMs: options.terminationGraceMs ?? 100,
    processProofTimeoutMs: options.processProofTimeoutMs ?? options.terminationGraceMs ?? 100,
    outputFlushMs: options.outputFlushMs ?? 50,
    now: () => new Date(nowMs),
    createId: () => String(++id),
    setTimer: (callback, timeoutMs) => {
      const timer = { callback, timeoutMs, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimer: (timer) => {
      timer.cleared = true;
    },
    ...(options.classifyFailure ? { classifyFailure: options.classifyFailure } : {}),
    ...(options.reattachProcess ? { reattachProcess: options.reattachProcess } : {}),
    ...(Object.hasOwn(options, 'persistedSnapshot') ? {
      loadPersistedSnapshot: () => {
        if (options.persistedSnapshot instanceof Error) {
          throw options.persistedSnapshot;
        }
        return structuredClone(options.persistedSnapshot);
      }
    } : {})
  };
  const runtime = new ConnectorRuntime(dependencies);
  return {
    runtime,
    processes,
    spawnCalls,
    timers,
    published,
    persisted,
    advance(ms) {
      nowMs += ms;
    },
    get discoveryCount() {
      return discoveryCount;
    }
  };
}

function liveTimers(harness, timeoutMs) {
  return harness.timers.filter((timer) => !timer.cleared && (timeoutMs === undefined || timer.timeoutMs === timeoutMs));
}

function fireTimer(timer) {
  assert(timer && !timer.cleared, 'fixture timer must be live');
  timer.callback();
}

function lifecycleCount(session, subtype) {
  return session.events.filter((event) => event.lifecycle === subtype).length;
}

function assertEventProof(session, expectedStarted, expectedTerminal) {
  assert(lifecycleCount(session, 'session-started') === expectedStarted, `expected ${expectedStarted} session-started events`);
  assert(lifecycleCount(session, 'session-terminal') === expectedTerminal, `expected ${expectedTerminal} session-terminal events`);
  const eventIds = session.events.map((event) => event.eventId);
  assert(new Set(eventIds).size === eventIds.length, 'eventId must be unique within session audit');
}

function assertBlockedAudit(harness, result, expectedReason) {
  assert(result.status === 'blocked', `${expectedReason} must return blocked`);
  assert(result.blockedReasons.includes(expectedReason), `${expectedReason} must be returned to the caller`);
  const audit = harness.runtime.getSessionAudit(result.sessionId);
  assert(audit?.state === 'permission-denied', `${expectedReason} needs permission-denied audit`);
  const policyEvent = audit.events.find((event) => event.kind === 'policy' && event.payload?.blockedReasons);
  assert(policyEvent?.payload?.blockedReasons?.includes(expectedReason), `${expectedReason} must be retained in audit payload`);
  assertEventProof(audit, 0, 1);
}

function createAuthorizerHarness(policy, options = {}) {
  const timers = [];
  let currentPolicy = structuredClone(policy);
  let id = 0;
  let nowMs = Date.parse(options.now ?? '2026-07-13T00:00:00.000Z');
  const authorizer = new ConnectorRunAuthorizer({
    loadPolicy: () => currentPolicy,
    grantTtlMs: options.grantTtlMs ?? 1_000,
    now: () => new Date(nowMs),
    createId: () => `auth-${++id}`,
    setTimer: (callback, timeoutMs) => {
      const timer = { callback, timeoutMs, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimer: (timer) => {
      timer.cleared = true;
    }
  });
  return {
    authorizer,
    timers,
    advance(ms) {
      nowMs += ms;
    },
    setPolicy(nextPolicy) {
      currentPolicy = structuredClone(nextPolicy);
    }
  };
}

const request = {
  connectorId: 'codex',
  agentId: 'codex',
  taskName: 'fixture task',
  prompt: 'Return fixture JSON only.',
  requestedBy: 'explicit-user-action'
};

const emptyRealHarness = createHarness(readyPolicy());
assert(emptyRealHarness.runtime.getSnapshot().instances.length === 0, 'static policy/discovery must not create online instances');

// Renderer-forged and replayed confirmation is blocked before discovery/spawn.
const forgedHarness = createHarness(readyPolicy(), {
  authorizeRun: () => ({ authorized: false, blockedReason: 'authorization-invalid' })
});
for (let index = 0; index < 10; index += 1) {
  const blocked = forgedHarness.runtime.start({ ...request, replay: index });
  assertBlockedAudit(forgedHarness, blocked, 'authorization-invalid');
}
assert(forgedHarness.discoveryCount === 0, 'forged confirmation 10/10 must not discover');
assert(forgedHarness.spawnCalls.length === 0, 'forged confirmation 10/10 must not spawn');

const authorizationIntent = {
  connectorId: request.connectorId,
  agentId: request.agentId,
  taskName: request.taskName,
  prompt: request.prompt
};

const missingAuthorizerHarness = createAuthorizerHarness(readyPolicy());
const missingHarness = createHarness(readyPolicy(), {
  authorizeRun: (candidate) => missingAuthorizerHarness.authorizer.consume(candidate)
});
for (let index = 0; index < 10; index += 1) {
  assertBlockedAudit(missingHarness, missingHarness.runtime.start({
    ...request,
    taskName: `missing grant ${index}`
  }), 'confirmation-required');
}
assert(missingHarness.discoveryCount === 0 && missingHarness.spawnCalls.length === 0, 'missing grant 10/10 must block before discovery/spawn');

const invalidAuthorizerHarness = createAuthorizerHarness(readyPolicy());
const invalidHarness = createHarness(readyPolicy(), {
  authorizeRun: (candidate) => invalidAuthorizerHarness.authorizer.consume(candidate)
});
for (let index = 0; index < 10; index += 1) {
  assertBlockedAudit(invalidHarness, invalidHarness.runtime.start({
    ...request,
    authorizationGrant: `connector-grant-forged-${index}`
  }), 'authorization-invalid');
}
assert(invalidHarness.discoveryCount === 0 && invalidHarness.spawnCalls.length === 0, 'forged grant 10/10 must block before discovery/spawn');

const replayAuthorizerHarness = createAuthorizerHarness(readyPolicy());
const replayHarness = createHarness(readyPolicy(), {
  authorizeRun: (candidate) => replayAuthorizerHarness.authorizer.consume(candidate)
});
const replayGrant = replayAuthorizerHarness.authorizer.issueConfirmedGrant(authorizationIntent);
assert(replayGrant.status === 'granted', 'confirmed fixture must receive one opaque grant');
const firstUse = replayHarness.runtime.start({ ...request, authorizationGrant: replayGrant.grantId });
assert(firstUse.status === 'accepted', 'first matching grant use must be accepted by the ready fixture');
for (let index = 0; index < 10; index += 1) {
  assertBlockedAudit(replayHarness, replayHarness.runtime.start({
    ...request,
    authorizationGrant: replayGrant.grantId
  }), 'authorization-replayed');
}
assert(replayHarness.discoveryCount === 1 && replayHarness.spawnCalls.length === 1, 'replay 10/10 must not add discovery/spawn after first fixture use');
replayHarness.runtime.dispose();

const expiryAuthorizerHarness = createAuthorizerHarness(readyPolicy(), { grantTtlMs: 1_000 });
const expiryGrant = expiryAuthorizerHarness.authorizer.issueConfirmedGrant(authorizationIntent);
assert(expiryGrant.status === 'granted', 'expiry fixture must receive a grant');
expiryAuthorizerHarness.advance(1_000);
const expiryHarness = createHarness(readyPolicy(), {
  authorizeRun: (candidate) => expiryAuthorizerHarness.authorizer.consume(candidate)
});
assertBlockedAudit(expiryHarness, expiryHarness.runtime.start({
  ...request,
  authorizationGrant: expiryGrant.grantId
}), 'authorization-expired');
assert(expiryHarness.discoveryCount === 0 && expiryHarness.spawnCalls.length === 0, 'expired grant must block before discovery/spawn');

const mismatchAuthorizerHarness = createAuthorizerHarness(readyPolicy());
const mismatchHarness = createHarness(readyPolicy(), {
  authorizeRun: (candidate) => mismatchAuthorizerHarness.authorizer.consume(candidate)
});
for (const [field, value] of [
  ['connectorId', 'trae'],
  ['agentId', 'agent-other'],
  ['taskName', 'changed task'],
  ['prompt', 'Changed prompt.']
]) {
  const grant = mismatchAuthorizerHarness.authorizer.issueConfirmedGrant(authorizationIntent);
  assert(grant.status === 'granted', `${field} mismatch fixture must receive a grant`);
  assertBlockedAudit(mismatchHarness, mismatchHarness.runtime.start({
    ...request,
    [field]: value,
    authorizationGrant: grant.grantId
  }), 'authorization-intent-mismatch');
}
assert(mismatchHarness.discoveryCount === 0 && mismatchHarness.spawnCalls.length === 0, 'intent mismatch must block before discovery/spawn');

const driftAuthorizerHarness = createAuthorizerHarness(readyPolicy());
const driftGrant = driftAuthorizerHarness.authorizer.issueConfirmedGrant(authorizationIntent);
assert(driftGrant.status === 'granted', 'policy drift fixture must receive a grant');
driftAuthorizerHarness.setPolicy({ ...readyPolicy(), version: 1, connectors: readyPolicy().connectors.map((connector) => ({
  ...connector,
  acceptanceGate: `${connector.acceptanceGate} changed`
})) });
const driftHarness = createHarness(readyPolicy(), {
  authorizeRun: (candidate) => driftAuthorizerHarness.authorizer.consume(candidate)
});
assertBlockedAudit(driftHarness, driftHarness.runtime.start({
  ...request,
  authorizationGrant: driftGrant.grantId
}), 'authorization-policy-drift');
assert(driftHarness.discoveryCount === 0 && driftHarness.spawnCalls.length === 0, 'policy drift must block before discovery/spawn');

const cancelledAuthorizerHarness = createAuthorizerHarness(readyPolicy());
const cancelledGrant = cancelledAuthorizerHarness.authorizer.issueConfirmedGrant(authorizationIntent);
assert(cancelledGrant.status === 'granted', 'cancellation fixture must receive a grant');
assert(cancelledAuthorizerHarness.authorizer.cancel(cancelledGrant.grantId).status === 'cancelled', 'outstanding grant must cancel once');
const cancelledHarness = createHarness(readyPolicy(), {
  authorizeRun: (candidate) => cancelledAuthorizerHarness.authorizer.consume(candidate)
});
assertBlockedAudit(cancelledHarness, cancelledHarness.runtime.start({
  ...request,
  authorizationGrant: cancelledGrant.grantId
}), 'authorization-cancelled');
assert(cancelledHarness.discoveryCount === 0 && cancelledHarness.spawnCalls.length === 0, 'cancelled grant must block before discovery/spawn');

const cleanupAuthorizerHarness = createAuthorizerHarness(readyPolicy());
const cleanupGrant = cleanupAuthorizerHarness.authorizer.issueConfirmedGrant(authorizationIntent);
cleanupAuthorizerHarness.authorizer.issueConfirmedGrant({ ...authorizationIntent, taskName: 'cleanup second grant' });
assert(cleanupAuthorizerHarness.timers.filter((timer) => !timer.cleared).length === 2, 'authorizer fixture must start with two live expiry timers');
cleanupAuthorizerHarness.authorizer.dispose();
assert(cleanupAuthorizerHarness.timers.every((timer) => timer.cleared), 'authorizer dispose must clear every expiry timer');
assert(cleanupGrant.status === 'granted' && cleanupAuthorizerHarness.authorizer.consume({
  ...request,
  authorizationGrant: cleanupGrant.grantId
}).blockedReason === 'runtime-unavailable', 'disposed authorizer must invalidate outstanding grants');

const codexPolicy = currentPolicy.connectors.find((connector) => connector.id === 'codex');
assert(codexPolicy?.status === 'draft' && codexPolicy.approvalStatus === 'pending' && codexPolicy.enabledByDefault === false, 'current Codex policy must remain draft/pending/disabled');
assert(currentPolicy.connectors.filter((connector) => connector.id === 'trae' || connector.id === 'qoder').every((connector) => connector.status === 'placeholder'), 'Trae/Qoder must remain placeholders');
const productionAuthorizerHarness = createAuthorizerHarness(currentPolicy);
const productionHarness = createHarness(currentPolicy, {
  authorizeRun: (candidate) => productionAuthorizerHarness.authorizer.consume(candidate)
});
for (const connector of currentPolicy.connectors) {
  const intent = { ...authorizationIntent, connectorId: connector.id, agentId: connector.id };
  const grant = productionAuthorizerHarness.authorizer.issueConfirmedGrant(intent);
  assert(grant.status === 'granted', `${connector.id} production policy fixture must receive confirmation grant`);
  const blocked = productionHarness.runtime.start({
    ...request,
    ...intent,
    authorizationGrant: grant.grantId
  });
  assert(blocked.status === 'blocked', `${connector.id} current production policy must stay blocked after confirmation`);
  assertEventProof(productionHarness.runtime.getSessionAudit(blocked.sessionId), 0, 1);
}
assert(productionHarness.discoveryCount === 0 && productionHarness.spawnCalls.length === 0, 'current production policy must keep every Connector at spawn=0');

const policyBlockedHarness = createHarness(currentPolicy);
for (let index = 0; index < 10; index += 1) {
  const blocked = policyBlockedHarness.runtime.start(request);
  assert(blocked.status === 'blocked', `policy blocked run ${index} must be blocked`);
  assertEventProof(policyBlockedHarness.runtime.getSessionAudit(blocked.sessionId), 0, 1);
}
assert(policyBlockedHarness.discoveryCount === 0 && policyBlockedHarness.spawnCalls.length === 0, 'blocked policy 10/10 must remain gate-before-discovery/spawn');

// spawn() return is not startup evidence.
const startupHarness = createHarness(readyPolicy());
const startupAccepted = startupHarness.runtime.start(request);
assert(startupAccepted.status === 'accepted', 'runtime should report accepted, not started');
let startupSession = startupHarness.runtime.getSnapshot().tasks[0];
assert(startupSession.state === 'starting', 'session must remain starting before OS spawn event');
assert(startupSession.liveness.status === 'unknown' && !startupSession.liveness.lastSeen, 'pre-spawn liveness must remain unknown');
assert(startupHarness.runtime.getSnapshot().instances[0].status !== 'busy', 'pre-spawn instance must not be busy/online');
assertEventProof(startupSession, 0, 0);
assert(startupHarness.published.every((snapshot) => snapshot.tasks.every((session) => session.state !== 'running')), 'spawn return must never publish running');
startupHarness.processes[0].confirmSpawn();
startupHarness.processes[0].confirmSpawn();
startupSession = startupHarness.runtime.getSnapshot().tasks[0];
assert(startupSession.state === 'running', 'OS spawn event must transition to running');
assert(startupSession.liveness.status === 'fresh' && startupSession.liveness.source === 'process-event', 'spawn-confirmed process evidence must be fresh');
assert(startupSession.capabilitySource === 'adapter-declaration', 'capabilities need adapter evidence source');
assert(startupSession.capabilities?.includes('structured-json-events'), 'Codex adapter declaration must be explicit');
assertEventProof(startupSession, 1, 0);

// Error before spawn never creates running/fresh/started state and EACCES is terminal after close proof.
const preSpawnErrorHarness = createHarness(readyPolicy());
const preSpawnAccepted = preSpawnErrorHarness.runtime.start(request);
preSpawnErrorHarness.processes[0].emit('error', new Error('spawn EACCES fixture'));
let preSpawnSession = preSpawnErrorHarness.runtime.getSnapshot().tasks[0];
assert(preSpawnSession.state === 'stopping', 'pre-spawn error must enter stopping until close evidence');
assert(preSpawnSession.liveness.status === 'unknown', 'pre-spawn error must not fabricate liveness');
assertEventProof(preSpawnSession, 0, 0);
assert(preSpawnErrorHarness.published.every((snapshot) => (
  snapshot.tasks.every((session) => session.state !== 'running' && session.liveness.status !== 'fresh')
  && snapshot.instances.every((instance) => instance.status !== 'online' && instance.status !== 'busy')
)), 'pre-spawn error publish history must never claim running/fresh/online');
preSpawnErrorHarness.processes[0].close(null, null);
preSpawnSession = preSpawnErrorHarness.runtime.getSnapshot().tasks[0];
assert(preSpawnSession.state === 'permission-denied', 'EACCES must normalize to permission-denied');
assert(preSpawnSession.termination?.exitConfirmed === true, 'permission failure must retain close proof');
assertEventProof(preSpawnSession, 0, 1);
assert(preSpawnErrorHarness.runtime.getSessionAudit(preSpawnAccepted.sessionId)?.state === 'permission-denied', 'permission audit must be queryable');

const preSpawnCloseHarness = createHarness(readyPolicy());
const preSpawnCloseAccepted = preSpawnCloseHarness.runtime.start(request);
preSpawnCloseHarness.processes[0].close(0, null);
const preSpawnCloseSession = preSpawnCloseHarness.runtime.getSessionAudit(preSpawnCloseAccepted.sessionId);
assert(preSpawnCloseSession?.state === 'error', 'close before spawn confirmation must not report success');
assertEventProof(preSpawnCloseSession, 0, 1);

const permissionOverrideHarness = createHarness(readyPolicy(), {
  classifyFailure: (failure) => ({ ...failure, kind: 'process-error', retryable: true })
});
const permissionOverrideAccepted = permissionOverrideHarness.runtime.start({
  ...request,
  retry: { maxRetries: 2, backoffMs: 100, budgetMs: 1_000 }
});
permissionOverrideHarness.processes[0].emit('error', new Error('spawn EPERM fixture'));
permissionOverrideHarness.processes[0].close(null, null);
assert(permissionOverrideHarness.runtime.getSessionAudit(permissionOverrideAccepted.sessionId)?.state === 'permission-denied', 'classifier must not override normalized permission denial');
assert(permissionOverrideHarness.spawnCalls.length === 1 && liveTimers(permissionOverrideHarness).length === 0, 'normalized permission denial must never retry');

// Stop acceptance is immediate, terminal state waits for delayed close.
const stopHarness = createHarness(readyPolicy());
const stopAccepted = stopHarness.runtime.start(request);
stopHarness.processes[0].confirmSpawn();
const stopResult = stopHarness.runtime.stop({ taskId: stopAccepted.taskId });
assert(stopResult.status === 'stopping', 'stop must return stopping while exit is unconfirmed');
let stopSession = stopHarness.runtime.getSnapshot().tasks[0];
assert(stopSession.state === 'stopping' && stopSession.termination?.exitConfirmed === false, 'stop must retain unconfirmed termination state');
assert(stopHarness.processes[0].listenerCount('close') === 1, 'stop must retain close observation');
assert(stopHarness.processes[0].listenerCount('error') === 1, 'stop must retain error observation until exit');
assertEventProof(stopSession, 1, 0);
stopHarness.processes[0].close(null, 'SIGTERM');
stopHarness.processes[0].close(null, 'SIGTERM');
stopSession = stopHarness.runtime.getSnapshot().tasks[0];
assert(stopSession.state === 'stopped' && stopSession.termination?.exitConfirmed === true, 'delayed close must confirm stopped');
assertEventProof(stopSession, 1, 1);
assert(liveTimers(stopHarness).length === 0 && stopHarness.processes[0].listenerCount('close') === 0, 'confirmed stop must clean timers/listeners');

const synchronousCloseHarness = createHarness(readyPolicy(), {
  spawnProcess: () => new FakeProcess(4999, { closeOnKill: true })
});
const synchronousAccepted = synchronousCloseHarness.runtime.start(request);
synchronousCloseHarness.processes[0].confirmSpawn();
const synchronousStop = synchronousCloseHarness.runtime.stop({ taskId: synchronousAccepted.taskId });
assert(synchronousStop.status === 'stopping', 'fresh asynchronous kill reproof must return stopping before close.');
await settleAsync();
assert(synchronousCloseHarness.runtime.getSnapshot().tasks[0].state === 'stopped', 'close during proven kill must settle stopped.');
assert(liveTimers(synchronousCloseHarness).length === 0, 'synchronous close must not create orphan termination timers');
assertEventProof(synchronousCloseHarness.runtime.getSnapshot().tasks[0], 1, 1);

// kill=false/no-close escalates and settles session-lost, never fake stopped.
const escalationHarness = createHarness(readyPolicy(), {
  spawnProcess: (_file, _args, _options, index) => new FakeProcess(5000 + index, { killResults: [false, false] }),
  terminationGraceMs: 100
});
const escalationAccepted = escalationHarness.runtime.start(request);
escalationHarness.processes[0].confirmSpawn();
escalationHarness.runtime.stop({ taskId: escalationAccepted.taskId });
await settleAsync();
assert(escalationHarness.processes[0].killCount === 1, 'stop must make first bounded kill attempt');
await settleAsync();
fireTimer(liveTimers(escalationHarness, 100)[0]);
await settleAsync();
assert(escalationHarness.processes[0].killCount === 2, 'termination grace must escalate kill exactly once');
let escalationSession = escalationHarness.runtime.getSnapshot().tasks[0];
assert(escalationSession.state === 'stopping' && lifecycleCount(escalationSession, 'termination-escalated') === 1, 'escalation must remain non-terminal while awaiting close');
fireTimer(liveTimers(escalationHarness, 100)[0]);
escalationSession = escalationHarness.runtime.getSnapshot().tasks[0];
assert(escalationSession.state === 'session-lost', 'no close after escalation must become session-lost');
assert(escalationSession.termination?.exitConfirmed === false, 'session-lost must not claim exit confirmation');
assertEventProof(escalationSession, 1, 1);
assert(liveTimers(escalationHarness).length === 0, 'termination failure must clean timers');

// Retry never overlaps a process whose exit is not confirmed.
const retryHarness = createHarness(readyPolicy(), {
  classifyFailure: (failure) => ({ ...failure, retryable: failure.kind === 'process-error' }),
  spawnProcess: (_file, _args, _options, index) => new FakeProcess(1234 + index)
});
const retryAccepted = retryHarness.runtime.start({
  ...request,
  retry: { maxRetries: 1, backoffMs: 100, budgetMs: 1_000 }
});
retryHarness.processes[0].confirmSpawn();
retryHarness.processes[0].emit('error', new Error('transient fixture'));
assert(retryHarness.runtime.getSnapshot().tasks[0].state === 'stopping', 'retryable error must stop old process first');
assert(retryHarness.spawnCalls.length === 1 && liveTimers(retryHarness, 100).length === 1, 'retry must not start before close; only termination timer may exist');
retryHarness.processes[0].close(1, null);
const retryingSnapshot = retryHarness.runtime.getSnapshot();
assert(retryingSnapshot.tasks[0].state === 'retrying', 'confirmed old exit may schedule retry');
assert(retryingSnapshot.tasks[0].pid === undefined, 'retrying must clear prior attempt pid');
assert(retryingSnapshot.tasks[0].liveness.status === 'unknown' && !retryingSnapshot.tasks[0].liveness.lastSeen, 'retrying must clear prior fresh liveness evidence');
assert(!['online', 'busy'].includes(retryingSnapshot.instances[0].status), 'retrying instance must not project online/busy');
const retryTimer = liveTimers(retryHarness, 100)[0];
fireTimer(retryTimer);
assert(retryHarness.spawnCalls.length === 2, 'retry may spawn only after prior close and backoff');
assert(retryHarness.runtime.getSnapshot().tasks[0].state === 'starting', 'retry attempt waits for its own spawn handshake');
assert(retryHarness.runtime.getSnapshot().tasks[0].pid === undefined, 'new attempt must not inherit prior pid before spawn');
retryHarness.processes[1].confirmSpawn();
assert(retryHarness.runtime.getSnapshot().tasks[0].pid === 1235, 'new OS spawn must publish only the new process pid');
assert(retryHarness.runtime.getSnapshot().tasks[0].liveness.status === 'fresh', 'new OS spawn must create new fresh liveness evidence');
retryHarness.processes[1].close(0, null);
const retrySession = retryHarness.runtime.getSnapshot().tasks[0];
assert(retrySession.state === 'success' && retrySession.attempt === 2, 'second attempt must finish successfully');
assert(lifecycleCount(retrySession, 'session-started') === 1 && lifecycleCount(retrySession, 'attempt-started') === 1, 'session start proof must be idempotent across retries');
assertEventProof(retrySession, 1, 1);

const defaultRetryHarness = createHarness(readyPolicy(), {
  classifyFailure: (failure) => ({ ...failure, retryable: true })
});
defaultRetryHarness.runtime.start(request);
defaultRetryHarness.processes[0].confirmSpawn();
defaultRetryHarness.processes[0].close(75, null);
assert(defaultRetryHarness.spawnCalls.length === 1 && liveTimers(defaultRetryHarness).length === 0, 'default retry=0 must remain terminal');

const budgetRetryHarness = createHarness(readyPolicy(), {
  classifyFailure: (failure) => ({ ...failure, retryable: true })
});
budgetRetryHarness.runtime.start({
  ...request,
  retry: { maxRetries: 2, backoffMs: 200, budgetMs: 100 }
});
budgetRetryHarness.processes[0].confirmSpawn();
budgetRetryHarness.processes[0].close(75, null);
assert(budgetRetryHarness.spawnCalls.length === 1 && liveTimers(budgetRetryHarness).length === 0, 'insufficient retry budget must deny retry');

// Timeout enters stopping and waits for close; it never retries.
const timeoutHarness = createHarness(readyPolicy(), {
  classifyFailure: (failure) => ({ ...failure, retryable: true })
});
const timeoutAccepted = timeoutHarness.runtime.start({
  ...request,
  retry: { maxRetries: 2, backoffMs: 100, budgetMs: 1_000 }
});
timeoutHarness.processes[0].confirmSpawn();
fireTimer(liveTimers(timeoutHarness).find((timer) => timer.timeoutMs > 1_000));
assert(timeoutHarness.runtime.getSnapshot().tasks[0].state === 'stopping', 'timeout must wait for exit proof');
timeoutHarness.processes[0].close(null, 'SIGTERM');
const timeoutSession = timeoutHarness.runtime.getSnapshot().tasks[0];
assert(timeoutSession.state === 'timed-out' && timeoutHarness.spawnCalls.length === 1, 'confirmed timeout must be terminal and non-retryable');
assertEventProof(timeoutSession, 1, 1);

// Output is bounded, batched, and redacted before snapshot/publish/audit.
const secretPrompt = 'PROMPT-SECRET-1234';
const outputHarness = createHarness(readyPolicy());
const outputAccepted = outputHarness.runtime.start({ ...request, prompt: secretPrompt });
outputHarness.processes[0].confirmSpawn();
const publishedBeforeHugeChunk = outputHarness.published.length;
const persistedBeforeHugeChunk = outputHarness.persisted.length;
outputHarness.processes[0].stdout.emit('data', `${secretPrompt}\ntoken=super-secret\n{"apiKey":"abc"}\nAuthorization: Bearer sk-secret-123\nBearer sk-secret-123\ntoken = value with spaces?\nordinary log remains visible\n${'x'.repeat(1024 * 1024)}`);
assert(outputHarness.published.length === publishedBeforeHugeChunk, 'raw chunk must not synchronously publish/persist');
assert(outputHarness.persisted.length === persistedBeforeHugeChunk, 'raw chunk must not synchronously persist full snapshot');
assert(liveTimers(outputHarness, 50).length === 1, 'raw output must coalesce behind one flush timer');
fireTimer(liveTimers(outputHarness, 50)[0]);
let outputSession = outputHarness.runtime.getSnapshot().tasks[0];
const outputSnapshotJson = JSON.stringify(outputHarness.runtime.getSnapshot());
const outputPublishJson = JSON.stringify(outputHarness.published);
const outputAuditJson = JSON.stringify(outputHarness.runtime.getSessionAudit(outputAccepted.sessionId));
const outputPersistedJson = JSON.stringify(outputHarness.persisted);
for (const secret of [secretPrompt, 'super-secret', '"abc"', 'sk-secret-123', 'value with spaces?']) {
  assert(!outputSnapshotJson.includes(secret), `snapshot must redact ${secret}`);
  assert(!outputPublishJson.includes(secret), `publish must redact ${secret}`);
  assert(!outputAuditJson.includes(secret), `audit must redact ${secret}`);
  assert(!outputPersistedJson.includes(secret), `persistence must redact ${secret}`);
}
assert(outputSession.events.some((event) => event.message.includes('ordinary log remains visible')), 'redaction must preserve unrelated ordinary log text');
assert(outputSession.output.receivedBytes >= 1024 * 1024, 'huge output must count received bytes');
assert(outputSession.output.archivedBytes <= 256 * 1024, 'session archive bytes must be bounded');
assert(outputSession.output.droppedBytes > 0 && outputSession.output.truncatedLines > 0, 'huge no-newline output must truncate/drop');
assert(outputSession.events.some((event) => event.lifecycle === 'output-truncated'), 'output bounds need machine-verifiable audit');
assert(outputSession.events.filter((event) => event.kind === 'stdout' || event.kind === 'stderr').every((event) => Buffer.byteLength(event.message) <= 16 * 1024), 'each archived output line must obey byte limit');
const publishedBeforeBurst = outputHarness.published.length;
const persistedBeforeBurst = outputHarness.persisted.length;
for (let index = 0; index < 1_000; index += 1) {
  outputHarness.processes[0].stderr.emit('data', `burst-${index} token=burst-secret\n`);
}
assert(outputHarness.published.length === publishedBeforeBurst, 'burst chunks must not publish synchronously per chunk');
assert(outputHarness.persisted.length === persistedBeforeBurst, 'burst chunks must not persist synchronously per chunk');
assert(liveTimers(outputHarness, 50).length === 1, 'burst must retain one coalesced flush timer');
fireTimer(liveTimers(outputHarness, 50)[0]);
outputSession = outputHarness.runtime.getSnapshot().tasks[0];
assert(outputSession.output.outputEvents <= 200, 'output event count must be bounded');
assert(outputSession.events.length <= 400, 'total session event count must be bounded');
assert(outputSession.output.droppedBytes > 0, 'burst overflow must be counted as dropped');
assert(!JSON.stringify(outputHarness.runtime.getSnapshot()).includes('burst-secret'), 'burst secrets must be redacted before memory snapshot');
outputHarness.processes[0].close(0, null);
assert(outputHarness.persisted.at(-1).tasks[0].state === 'success', 'terminal session must persist');

// Active/fresh session wins over a newer terminal session; log updates do not reorder tasks.
const selectorHarness = createHarness(readyPolicy());
const activeAccepted = selectorHarness.runtime.start({ ...request, taskName: 'active session' });
selectorHarness.processes[0].confirmSpawn();
const terminalAccepted = selectorHarness.runtime.start({ ...request, taskName: 'newer terminal session' });
selectorHarness.processes[1].confirmSpawn();
selectorHarness.processes[1].close(0, null);
let selectorSnapshot = selectorHarness.runtime.getSnapshot();
assert(selectorSnapshot.instances[0].sessionId === activeAccepted.sessionId, 'active fresh session must beat newer terminal session');
const orderBeforeLog = selectorSnapshot.tasks.map((session) => session.taskId).join(',');
selectorHarness.processes[0].stdout.emit('data', 'selector log\n');
fireTimer(liveTimers(selectorHarness, 50)[0]);
selectorSnapshot = selectorHarness.runtime.getSnapshot();
assert(selectorSnapshot.tasks.map((session) => session.taskId).join(',') === orderBeforeLog, 'log events must not reorder session list');
assert(selectorSnapshot.instances[0].sessionId === activeAccepted.sessionId, 'selector must remain stable after log update');
assert(selectorHarness.runtime.getSessionAudit(terminalAccepted.sessionId)?.state === 'success', 'terminal comparison audit must remain queryable');

const tieHarness = createHarness(readyPolicy());
const tieA = tieHarness.runtime.start({ ...request, taskName: 'tie A' });
tieHarness.processes[0].confirmSpawn();
const tieB = tieHarness.runtime.start({ ...request, taskName: 'tie B' });
tieHarness.processes[1].confirmSpawn();
const expectedTieSession = [tieA.sessionId, tieB.sessionId].sort()[0];
assert(tieHarness.runtime.getSnapshot().instances[0].sessionId === expectedTieSession, 'equal active sessions need deterministic sessionId tie-break');

// Persistence redaction, recovery proof, session-lost, and corrupt fallback remain covered.
const persistedActiveSnapshot = structuredClone(selectorHarness.persisted.findLast((snapshot) => (
  snapshot.tasks.some((session) => session.taskId === activeAccepted.taskId && session.state === 'running')
)));
assert(persistedActiveSnapshot, 'fixture needs a persisted active session');
const persistedFingerprint = persistedActiveSnapshot.tasks.find((session) => session.taskId === activeAccepted.taskId)?.processFingerprint;
assert(persistedFingerprint, 'active persisted session needs a bounded process fingerprint');
assert(!Object.hasOwn(persistedFingerprint, 'commandLine'), 'fingerprint persistence must not expose raw command-line content');
const recoveryProcess = new FakeProcess(persistedFingerprint.pid);
const reattachHarness = createHarness(readyPolicy(), {
  persistedSnapshot: persistedActiveSnapshot,
  reattachProcess: () => ({ process: recoveryProcess, provenAt: '2026-07-13T00:00:00.500Z' })
});
await settleAsync();
assert(reattachHarness.runtime.getSnapshot().tasks.some((session) => session.state === 'reattached'), 'injected proof must reattach persisted session');
const reattachedSession = reattachHarness.runtime.getSnapshot().tasks.find((session) => session.state === 'reattached');
assert(reattachedSession.source === 'restart-recovery', 'reattached session source must be restart-recovery');
assert(reattachedSession.liveness.lastSeen === '2026-07-13T00:00:00.500Z', 'reattachment must expose fresh proof time');
const recoveredEvents = reattachHarness.runtime.getSnapshot().tasks.flatMap((session) => session.events);
assert(new Set(recoveredEvents.map((event) => event.eventId)).size === recoveredEvents.length, 'recovery must not collide persisted eventIds');
recoveryProcess.close(null, null);
assert(liveTimers(reattachHarness).length === 0, 'reattached close must clean all timers');
assert(
  reattachHarness.runtime.getSnapshot().tasks.find((session) => session.sessionId === activeAccepted.sessionId)?.state === 'session-lost',
  'unproven recovered close must never invent success'
);

const persistedSession = persistedActiveSnapshot.tasks.find((session) => session.taskId === activeAccepted.taskId);
const fingerprintContext = {
  taskId: persistedSession.taskId,
  sessionId: persistedSession.sessionId,
  connectorId: persistedSession.connectorId,
  agentId: persistedSession.agentId,
  executablePath: persistedFingerprint.executablePath,
  cwd: persistedFingerprint.cwd
};
const matchingEvidence = {
  pid: persistedFingerprint.pid,
  executablePath: persistedFingerprint.executablePath,
  startedAt: persistedFingerprint.startedAt,
  commandLine: `C:\\fixture\\codex.exe fixture-${persistedFingerprint.pid}`,
  evidenceSource: 'windows-cim'
};
assert(createReattachedConnectorProcess(persistedSession, fingerprintContext, {
  inspectEvidence: () => ({ ...matchingEvidence, startedAt: '2026-07-12T23:59:58.000Z' })
}) === null, 'wrong start time must reject reattachment');
assert(createReattachedConnectorProcess(persistedSession, fingerprintContext, {
  inspectEvidence: () => ({ ...matchingEvidence, executablePath: 'C:\\fixture\\other.exe' })
}) === null, 'wrong executable must reject reattachment');
assert(createReattachedConnectorProcess(persistedSession, {
  ...fingerprintContext,
  cwd: 'E:\\wrong-workspace'
}, {
  inspectEvidence: () => matchingEvidence
}) === null, 'wrong main-owned cwd envelope must reject reattachment');
assert(createReattachedConnectorProcess(persistedSession, fingerprintContext, {
  inspectEvidence: () => ({ ...matchingEvidence, commandLine: 'identity-mismatch' })
}) === null, 'wrong command identity must reject reattachment');
assert(createReattachedConnectorProcess(persistedSession, fingerprintContext, {
  inspectEvidence: () => ({ ...matchingEvidence, startedAt: '2026-07-12T23:59:59.000Z' })
}) === null, 'reused PID evidence must reject reattachment');
assert(createReattachedConnectorProcess(persistedSession, fingerprintContext, {
  inspectEvidence: () => null
}) === null, 'missing process evidence must reject reattachment');

let stopEvidence = matchingEvidence;
let recoveredKillCount = 0;
const stopRaceHandle = createReattachedConnectorProcess(persistedSession, fingerprintContext, {
  inspectEvidence: () => stopEvidence,
  killProcess: () => {
    recoveredKillCount += 1;
    return true;
  },
  pollIntervalMs: 100
});
assert(stopRaceHandle, 'matching process evidence must create a recovered handle');
let stopRaceIdentityLost = 0;
stopRaceHandle.on('identity-lost', () => { stopRaceIdentityLost += 1; });
stopEvidence = { ...matchingEvidence, startedAt: '2026-07-12T23:59:59.000Z' };
assert(stopRaceHandle.kill() === false, 'stop must fail closed when PID identity changed after the prior proof');
assert(recoveredKillCount === 0, 'PID reuse at stop must never call process.kill');
assert(stopRaceIdentityLost === 1, 'PID reuse at stop must emit exactly one identity-lost signal');

let liveProofCall = 0;
const liveReuseHarness = createHarness(readyPolicy(), {
  captureProcessFingerprint: (child, context) => {
    liveProofCall += 1;
    return createConnectorProcessFingerprint({
      pid: child.pid,
      executablePath: context.executablePath,
      startedAt: liveProofCall === 1 ? '2026-07-12T23:59:59.900Z' : '2026-07-12T23:59:58.900Z',
      commandLine: `${context.executablePath} fixture-${child.pid}`,
      evidenceSource: 'windows-cim'
    }, context, '2026-07-13T00:00:00.000Z');
  }
});
const liveReuseAccepted = liveReuseHarness.runtime.start(request);
liveReuseHarness.processes[0].confirmSpawn();
assert(liveReuseHarness.runtime.getSnapshot().tasks[0].state === 'running', 'initial live process proof must reach running.');
liveReuseHarness.runtime.stop({ taskId: liveReuseAccepted.taskId });
await settleAsync();
assert(liveReuseHarness.processes[0].killCount === 0, 'fresh live-process PID reuse reproof must keep process.kill count at zero.');
assert(
  liveReuseHarness.runtime.getSnapshot().tasks[0].events.some((event) => event.message.includes('fresh kill reproof rejected identity')),
  'fresh live-process PID reuse rejection must be auditable.'
);
for (const timer of [...liveTimers(liveReuseHarness)]) {
  fireTimer(timer);
  await settleAsync();
}
for (const timer of [...liveTimers(liveReuseHarness)]) {
  fireTimer(timer);
  await settleAsync();
}

const lostHarness = createHarness(readyPolicy(), { persistedSnapshot: persistedActiveSnapshot, recoveryGraceMs: 500 });
assert(lostHarness.runtime.getSnapshot().runtime.availability === 'recovering', 'unproven persisted session must expose recovering envelope');
const recoveryTimer = liveTimers(lostHarness, 500)[0];
assert(recoveryTimer.timeoutMs <= 10_000, 'recovery deadline must be <=10 seconds');
fireTimer(recoveryTimer);
const lostSession = lostHarness.runtime.getSnapshot().tasks.find((session) => session.state === 'session-lost');
assert(lostSession && lifecycleCount(lostSession, 'session-terminal') === 1, 'unproven recovery must terminal as session-lost once');

for (const [label, mutateSnapshot, proof] of [
  ['missing fingerprint', (session) => { delete session.processFingerprint; }, null],
  ['expired timeout', (session) => { session.timeoutAt = '2026-07-13T00:00:00.000Z'; }, null],
  ['mismatched PID', () => {}, { process: new FakeProcess(persistedFingerprint.pid + 1), provenAt: '2026-07-13T00:00:00.000Z' }],
  ['stale proof', () => {}, { process: new FakeProcess(persistedFingerprint.pid), provenAt: '2026-07-12T23:59:59.000Z' }],
  ['future proof', () => {}, { process: new FakeProcess(persistedFingerprint.pid), provenAt: '2026-07-13T00:00:02.000Z' }]
]) {
  const snapshot = structuredClone(persistedActiveSnapshot);
  mutateSnapshot(snapshot.tasks.find((session) => session.sessionId === activeAccepted.sessionId));
  const harness = createHarness(readyPolicy(), {
    persistedSnapshot: snapshot,
    recoveryGraceMs: 500,
    ...(proof ? { reattachProcess: () => proof } : {})
  });
  const timer = liveTimers(harness, 500)[0];
  assert(timer, `${label} must stay non-running only until the bounded recovery deadline`);
  fireTimer(timer);
  const session = harness.runtime.getSnapshot().tasks.find((candidate) => candidate.sessionId === activeAccepted.sessionId);
  assert(session.state === 'session-lost', `${label} must terminal as session-lost`);
  assert(lifecycleCount(session, 'session-terminal') === 1, `${label} must emit exactly one terminal event`);
}

const corruptHarness = createHarness(readyPolicy(), { persistedSnapshot: { version: 1, tasks: 'corrupt' } });
assert(corruptHarness.runtime.getSnapshot().tasks.length === 0, 'corrupt persistence must degrade empty');
const throwingHarness = createHarness(readyPolicy(), { persistedSnapshot: new Error('fixture corruption') });
assert(throwingHarness.runtime.getSnapshot().tasks.length === 0, 'persistence read failure must not crash');

// Dispose cleans active process/listeners/timers without claiming exit confirmation.
const disposeHarness = createHarness(readyPolicy());
disposeHarness.runtime.start(request);
disposeHarness.processes[0].confirmSpawn();
disposeHarness.runtime.dispose();
await settleAsync();
for (const timer of [...liveTimers(disposeHarness)]) {
  fireTimer(timer);
  await settleAsync();
}
for (const timer of [...liveTimers(disposeHarness)]) {
  fireTimer(timer);
  await settleAsync();
}
const disposedSession = disposeHarness.runtime.getSnapshot().tasks[0];
assert(disposeHarness.processes[0].killCount === 1, 'dispose must issue exactly one bounded kill');
assert(disposeHarness.processes[0].listenerCount('close') === 0, 'dispose must remove listeners');
assert(liveTimers(disposeHarness).length === 0, 'dispose must clear every timer');
assert(disposedSession.state === 'session-lost' && disposedSession.termination?.exitConfirmed === false, 'dispose without close must remain truthful');
assertEventProof(disposedSession, 1, 1);

let shutdownProofCall = 0;
const shutdownDuringProofHarness = createHarness(readyPolicy(), {
  spawnProcess: () => new FakeProcess(6200, { closeOnKill: true }),
  captureProcessFingerprint: (child, context, proofRequest) => {
    shutdownProofCall += 1;
    if (shutdownProofCall === 1) {
      return new Promise((resolve) => {
        proofRequest.signal.addEventListener('abort', () => resolve(null), { once: true });
      });
    }
    return createConnectorProcessFingerprint({
      pid: child.pid,
      executablePath: context.executablePath,
      startedAt: '2026-07-12T23:59:59.900Z',
      commandLine: `${context.executablePath} fixture-${child.pid}`,
      evidenceSource: 'windows-cim'
    }, context, '2026-07-13T00:00:00.000Z');
  }
});
shutdownDuringProofHarness.runtime.start(request);
shutdownDuringProofHarness.processes[0].confirmSpawn();
assert(shutdownDuringProofHarness.runtime.getSnapshot().tasks[0].state === 'starting', 'async fingerprint proof must keep session non-running.');
shutdownDuringProofHarness.runtime.dispose();
await settleAsync();
const shutdownDuringProofSession = shutdownDuringProofHarness.runtime.getSnapshot().tasks[0];
assert(shutdownProofCall === 2, 'shutdown must cancel the stale initial proof and issue one fresh kill reproof.');
assert(shutdownDuringProofHarness.processes[0].killCount === 1, 'shutdown during initial proof must still kill the controlled child exactly once.');
assert(shutdownDuringProofSession.state === 'session-lost' && shutdownDuringProofSession.termination?.exitConfirmed === true, 'shutdown close must remain truthful and terminal.');
assert(liveTimers(shutdownDuringProofHarness).length === 0, 'shutdown during proof must leave zero timers.');

for (const failureMode of ['crash', 'unavailable']) {
  const initialFailureHarness = createHarness(readyPolicy(), {
    spawnProcess: () => new FakeProcess(6300, { closeOnKill: true }),
    captureProcessFingerprint: (child, context, proofRequest) => {
      if (failureMode === 'crash') {
        throw new Error('fixture-initial-proof-crash');
      }
      const observedAt = '2026-07-13T00:00:00.000Z';
      return {
        generation: proofRequest.generation,
        status: 'unavailable',
        observedAt,
        expiresAt: '2026-07-13T00:00:00.100Z',
        reason: 'fixture-initial-proof-unavailable'
      };
    }
  });
  initialFailureHarness.runtime.start(request);
  initialFailureHarness.processes[0].confirmSpawn();
  await settleAsync();
  const failed = initialFailureHarness.runtime.getSnapshot().tasks[0];
  assert(initialFailureHarness.processes[0].killCount === 1, `${failureMode} initial proof must roll back the owned child exactly once.`);
  assert(failed.state === 'error' && failed.termination?.exitConfirmed === true, `${failureMode} initial proof rollback must close truthfully.`);
  assert(lifecycleCount(failed, 'session-started') === 0 && lifecycleCount(failed, 'session-terminal') === 1, `${failureMode} initial proof must never publish running.`);
  assert(liveTimers(initialFailureHarness).length === 0, `${failureMode} initial proof rollback must leave zero timers.`);
}

let immediateStopProofCalls = 0;
let resolveInitialProof;
let resolveKillProof;
let immediateStopContext;
const immediateStopHarness = createHarness(readyPolicy(), {
  spawnProcess: () => new FakeProcess(6400, { closeOnKill: true }),
  captureProcessFingerprint: (_child, context) => {
    immediateStopProofCalls += 1;
    immediateStopContext = context;
    return new Promise((resolve) => {
      if (immediateStopProofCalls === 1) {
        resolveInitialProof = resolve;
      } else {
        resolveKillProof = resolve;
      }
    });
  }
});
const immediateStopAccepted = immediateStopHarness.runtime.start(request);
immediateStopHarness.processes[0].confirmSpawn();
assert(immediateStopHarness.runtime.getSnapshot().tasks[0].state === 'starting', 'pending initial proof must stay starting.');
immediateStopHarness.runtime.stop({ taskId: immediateStopAccepted.taskId });
assert(immediateStopProofCalls === 2, 'immediate stop must supersede initial proof with one fresh kill reproof.');
const lateInitialFingerprint = createConnectorProcessFingerprint({
  pid: 6400,
  executablePath: immediateStopContext.executablePath,
  startedAt: '2026-07-12T23:59:59.900Z',
  commandLine: `${immediateStopContext.executablePath} fixture-6400`,
  evidenceSource: 'windows-cim'
}, immediateStopContext, '2026-07-13T00:00:00.000Z');
resolveInitialProof(lateInitialFingerprint);
await settleAsync();
assert(immediateStopHarness.processes[0].killCount === 0, 'late superseded initial proof must not trigger kill or running.');
assert(immediateStopHarness.runtime.getSnapshot().tasks[0].state === 'stopping', 'late superseded initial proof must not resurrect running.');
resolveKillProof(lateInitialFingerprint);
await settleAsync();
const immediateStopped = immediateStopHarness.runtime.getSnapshot().tasks[0];
assert(immediateStopHarness.processes[0].killCount === 1, 'fresh immediate-stop reproof must kill exactly once.');
assert(immediateStopped.state === 'stopped' && immediateStopped.termination?.exitConfirmed === true, 'immediate stop must terminal truthfully.');
assert(lifecycleCount(immediateStopped, 'session-started') === 0 && lifecycleCount(immediateStopped, 'session-terminal') === 1, 'late initial proof must not publish a started event.');
assert(liveTimers(immediateStopHarness).length === 0, 'immediate stop must clean every timer.');

console.log('connector runtime check passed.');
console.log('P1-1: explicit spawn handshake and pre-spawn error truth verified');
console.log('P1-2: stopping, delayed close, escalation, no-overlap retry and dispose cleanup verified');
console.log('P1-3: bounded no-newline/burst output and batched flush verified');
console.log('P1-4: snapshot/publish/audit redaction before exposure verified');
console.log('P1-5: eventId, lifecycle idempotency and blocked-path 10/10 audit verified');
console.log('P2: deterministic active/fresh selector and capability evidence verified');
console.log('A4 P1-1: retrying clears prior pid/fresh lastSeen; new spawn provides new pid/liveness');
console.log('A4 P1-2: Authorization/Bearer/spaced credential values redact without swallowing ordinary logs');
console.log('A5: evaluate-gate ignores renderer requestedBy/confirmation and remains confirmation-required');
console.log('A6: main-owned grant missing/forged/expired/replayed/mismatched/drift/cancelled paths verified');
console.log('A6 production policy: Codex/Trae/Qoder discovery=0, spawn=0 after confirmation grant');
console.log('A7: bounded fingerprint, proof freshness, restart recovery and one terminal session-lost verified');
console.log('A7 stop safety: kill-time PID identity reproof rejects reuse with process.kill count=0');
console.log('security: forged/replayed renderer confirmation 10/10 blocked before discovery/spawn');
console.log('external Agent CLI execution: not performed');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function settleAsync() {
  await Promise.resolve();
  await Promise.resolve();
}
