import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { build } from 'esbuild';

const root = process.cwd();
const runtimePath = path.join(root, 'src/lib/connectorRuntime.ts');
const bundled = await build({
  entryPoints: [runtimePath],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false
});
const runtimeModule = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
);
const {
  ConnectorRuntime,
  createConnectorProcessFingerprint,
  createReattachedConnectorProcess,
  inspectConnectorProcessEvidence
} = runtimeModule;

const controlledChildren = new Set();
const inspectLatenciesMs = [];
let connectorSpawnCalls = 0;
let recoveredKillCalls = 0;

function timedInspect(pid) {
  const startedAt = performance.now();
  const evidence = inspectConnectorProcessEvidence(pid);
  inspectLatenciesMs.push(performance.now() - startedAt);
  return evidence;
}

function spawnControlledChild(label) {
  const child = spawn(process.execPath, [
    '-e',
    "process.on('SIGTERM', () => process.exit(0)); setInterval(() => {}, 1000);",
    '--',
    `niuma-a7-${label}`
  ], {
    cwd: root,
    shell: false,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  controlledChildren.add(child);
  const closed = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => {
      controlledChildren.delete(child);
      resolve({ code, signal });
    });
  });
  return { child, closed };
}

async function waitForEvidence(pid, timeoutMs = 8_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const evidence = timedInspect(pid);
    if (evidence) {
      return evidence;
    }
    await delay(50);
  }
  throw new Error(`OS process evidence timeout for controlled PID ${pid}.`);
}

function contextFor(label, evidence) {
  return {
    taskId: `controlled-task-${label}`,
    sessionId: `controlled-session-${label}`,
    connectorId: 'controlled-node-fixture',
    agentId: 'controlled-node-fixture',
    executablePath: evidence.executablePath,
    cwd: root
  };
}

function snapshotFor(label, fingerprint, timeoutMs) {
  const now = new Date();
  return {
    version: 1,
    updatedAt: now.toISOString(),
    tasks: [{
      taskId: `controlled-task-${label}`,
      sessionId: `controlled-session-${label}`,
      connectorId: 'controlled-node-fixture',
      agentId: 'controlled-node-fixture',
      taskName: `A7 controlled ${label}`,
      requestedBy: 'explicit-user-action',
      source: 'runtime-spawn',
      capabilities: null,
      capabilitySource: 'unknown',
      state: 'running',
      startedAt: now.toISOString(),
      pid: fingerprint.pid,
      processFingerprint: fingerprint,
      attempt: 1,
      maxAttempts: 1,
      retryPolicy: { maxRetries: 0, backoffMs: 100, budgetMs: 0 },
      timeoutAt: new Date(now.getTime() + timeoutMs).toISOString(),
      output: {
        receivedBytes: 0,
        archivedBytes: 0,
        droppedBytes: 0,
        outputEvents: 0,
        truncatedLines: 0,
        backpressureEvents: 0
      },
      liveness: {
        status: 'fresh',
        source: 'process-event',
        lastSeen: now.toISOString(),
        staleAfterMs: 15_000
      },
      events: [{
        eventId: `controlled-start-${label}`,
        sequence: 1,
        timestamp: now.toISOString(),
        kind: 'lifecycle',
        lifecycle: 'session-started',
        message: 'Controlled non-Agent child started.'
      }]
    }],
    instances: [],
    runtime: {
      availability: 'available',
      mode: 'real',
      source: 'electron-main',
      observedAt: now.toISOString()
    }
  };
}

async function createControlledFixture(label, timeoutMs = 30_000) {
  const controlled = spawnControlledChild(label);
  await onceSpawned(controlled.child);
  const evidence = await waitForEvidence(controlled.child.pid);
  const context = contextFor(label, evidence);
  const fingerprint = createConnectorProcessFingerprint(evidence, context, new Date().toISOString());
  assert.ok(fingerprint, 'Production OS evidence must create a bounded fingerprint.');
  assert.equal(Object.hasOwn(fingerprint, 'commandLine'), false, 'Raw command line must not persist.');
  return {
    ...controlled,
    evidence,
    context,
    fingerprint,
    snapshot: snapshotFor(label, fingerprint, timeoutMs)
  };
}

function createRecoveryRuntime(fixture, options = {}) {
  const published = [];
  const persisted = [];
  const runtime = new ConnectorRuntime({
    loadPolicy: () => null,
    resolveExecutable: () => null,
    spawnProcess: () => {
      connectorSpawnCalls += 1;
      throw new Error('Connector spawning is forbidden in A7 recovery evidence.');
    },
    workspaceRoot: root,
    sourceEnv: {},
    loadPersistedSnapshot: () => structuredClone(fixture.snapshot),
    persistSnapshot: (snapshot) => persisted.push(structuredClone(snapshot)),
    publish: (snapshot) => published.push(structuredClone(snapshot)),
    recoveryGraceMs: options.recoveryGraceMs ?? 1_000,
    terminationGraceMs: options.terminationGraceMs ?? 1_000,
    reattachProcess: options.reattachProcess ?? ((session) => {
      const recovered = createReattachedConnectorProcess(session, fixture.context, {
        inspectEvidence: timedInspect,
        killProcess: (pid) => {
          recoveredKillCalls += 1;
          return process.kill(pid);
        },
        pollIntervalMs: 100
      });
      return recovered ? { process: recovered, provenAt: new Date().toISOString() } : null;
    })
  });
  return { runtime, published, persisted };
}

async function verifyStopRecovery() {
  const fixture = await createControlledFixture('stop');
  const { runtime } = createRecoveryRuntime(fixture);
  const recovered = runtime.getSnapshot().tasks[0];
  assert.equal(recovered.state, 'reattached');
  assert.equal(recovered.source, 'restart-recovery');
  assert.equal(recovered.liveness.source, 'recovery-proof');
  assert.ok(Date.now() - Date.parse(recovered.liveness.lastSeen) <= 1_000, 'Recovery proof time must be fresh.');
  assert.equal(lifecycleCount(recovered, 'session-started'), 1, 'Recovery must not duplicate started events.');
  const eventCount = recovered.events.length;
  await waitFor(() => runtime.getSnapshot().tasks[0].liveness.lastSeen !== recovered.liveness.lastSeen, 3_000);
  assert.equal(runtime.getSnapshot().tasks[0].events.length, eventCount, 'Polling must refresh liveness without event growth.');
  const stopResult = runtime.stop({ taskId: recovered.taskId });
  assert.ok(stopResult.status === 'stopping' || stopResult.status === 'stopped');
  await fixture.closed;
  await waitFor(() => runtime.getSnapshot().tasks[0].state === 'stopped', 3_000);
  const stopped = runtime.getSnapshot().tasks[0];
  assert.equal(stopped.termination?.exitConfirmed, true);
  assert.equal(lifecycleCount(stopped, 'session-terminal'), 1);
  assert.equal(outputEventCount(stopped), 0, 'Recovery must not invent stdout/stderr history.');
}

async function verifyTimeoutRecovery() {
  const fixture = await createControlledFixture('timeout', 3_000);
  const { runtime } = createRecoveryRuntime(fixture);
  assert.equal(runtime.getSnapshot().tasks[0].state, 'reattached');
  await fixture.closed;
  await waitFor(() => runtime.getSnapshot().tasks[0].state === 'timed-out', 5_000);
  const timedOut = runtime.getSnapshot().tasks[0];
  assert.equal(timedOut.termination?.exitConfirmed, true);
  assert.equal(lifecycleCount(timedOut, 'session-terminal'), 1);
}

async function verifyDisposeCleanup() {
  const fixture = await createControlledFixture('dispose');
  const { runtime } = createRecoveryRuntime(fixture);
  assert.equal(runtime.getSnapshot().tasks[0].state, 'reattached');
  runtime.dispose();
  await fixture.closed;
  assert.equal(runtime.getSnapshot().tasks[0].state, 'session-lost');
  assert.equal(lifecycleCount(runtime.getSnapshot().tasks[0], 'session-terminal'), 1);
}

function verifyKillTimePidReuse(fixture) {
  let evidence = fixture.evidence;
  let killCalls = 0;
  const handle = createReattachedConnectorProcess(fixture.snapshot.tasks[0], fixture.context, {
    inspectEvidence: () => evidence,
    killProcess: () => {
      killCalls += 1;
      return true;
    },
    pollIntervalMs: 100
  });
  assert.ok(handle);
  let identityLost = 0;
  handle.on('identity-lost', () => { identityLost += 1; });
  evidence = { ...fixture.evidence, startedAt: new Date(Date.parse(fixture.evidence.startedAt) + 1_000).toISOString() };
  assert.equal(handle.kill(), false);
  assert.equal(killCalls, 0, 'PID reuse must be rejected before process.kill.');
  assert.equal(identityLost, 1);
}

async function verifyNegativeRecovery(baseFixture) {
  const matchingProcess = fakeProcess(baseFixture.fingerprint.pid);
  const cases = [
    ['wrong start time', (session) => proofFromEvidence(session, { ...baseFixture.evidence, startedAt: new Date(Date.parse(baseFixture.evidence.startedAt) + 1_000).toISOString() })],
    ['wrong executable', (session) => proofFromEvidence(session, { ...baseFixture.evidence, executablePath: `${baseFixture.evidence.executablePath}.wrong` })],
    ['wrong cwd', (session) => proofFromEvidence(session, baseFixture.evidence, { ...baseFixture.context, cwd: path.join(root, 'wrong-cwd') })],
    ['wrong identity', (session) => proofFromEvidence(session, { ...baseFixture.evidence, commandLine: `${baseFixture.evidence.commandLine}-wrong` })],
    ['reused PID', (session) => proofFromEvidence(session, { ...baseFixture.evidence, startedAt: new Date(Date.parse(baseFixture.evidence.startedAt) + 2_000).toISOString() })],
    ['missing process', () => null],
    ['mismatched proof PID', () => ({ process: fakeProcess(baseFixture.fingerprint.pid + 1), provenAt: new Date().toISOString() })],
    ['stale proof', () => ({ process: matchingProcess, provenAt: new Date(Date.now() - 2_000).toISOString() })],
    ['future proof', () => ({ process: matchingProcess, provenAt: new Date(Date.now() + 2_000).toISOString() })]
  ];
  for (const [label, reattachProcess] of cases) {
    const fixture = { ...baseFixture, snapshot: structuredClone(baseFixture.snapshot) };
    fixture.snapshot.tasks[0].timeoutAt = new Date(Date.now() + 30_000).toISOString();
    const { runtime } = createRecoveryRuntime(fixture, { recoveryGraceMs: 100, reattachProcess });
    await waitFor(() => runtime.getSnapshot().tasks[0].state === 'session-lost', 1_000);
    const lost = runtime.getSnapshot().tasks[0];
    assert.equal(lifecycleCount(lost, 'session-terminal'), 1, `${label} must terminal exactly once.`);
  }

  for (const [label, mutate] of [
    ['missing fingerprint', (session) => { delete session.processFingerprint; }],
    ['expired timeout', (session) => { session.timeoutAt = new Date(Date.now() - 1).toISOString(); }],
    ['future fingerprint', (session) => { session.processFingerprint.capturedAt = new Date(Date.now() + 2_000).toISOString(); }]
  ]) {
    const fixture = { ...baseFixture, snapshot: structuredClone(baseFixture.snapshot) };
    mutate(fixture.snapshot.tasks[0]);
    const { runtime } = createRecoveryRuntime(fixture, { recoveryGraceMs: 100 });
    await waitFor(() => runtime.getSnapshot().tasks[0].state === 'session-lost', 1_000);
    assert.equal(lifecycleCount(runtime.getSnapshot().tasks[0], 'session-terminal'), 1, `${label} must terminal exactly once.`);
  }

  function proofFromEvidence(session, evidence, context = baseFixture.context) {
    const processHandle = createReattachedConnectorProcess(session, context, {
      inspectEvidence: () => evidence,
      killProcess: () => true,
      pollIntervalMs: 100
    });
    return processHandle ? { process: processHandle, provenAt: new Date().toISOString() } : null;
  }
}

async function verifyRecoveryDeadlineIncludesProbe(baseFixture) {
  const fixture = { ...baseFixture, snapshot: structuredClone(baseFixture.snapshot) };
  fixture.snapshot.tasks[0].timeoutAt = new Date(Date.now() + 30_000).toISOString();
  const startedAt = performance.now();
  const { runtime } = createRecoveryRuntime(fixture, {
    recoveryGraceMs: 100,
    reattachProcess: () => {
      const probeDeadline = performance.now() + 75;
      while (performance.now() < probeDeadline) {
        // Model a synchronous OS probe consuming the same recovery budget.
      }
      return null;
    }
  });
  await waitFor(() => runtime.getSnapshot().tasks[0].state === 'session-lost', 300);
  assert.ok(performance.now() - startedAt < 160, 'OS probe time must be deducted from the recovery deadline.');
}

function fakeProcess(pid) {
  const emitter = new EventEmitter();
  return {
    pid,
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    on: (event, listener) => { emitter.on(event, listener); },
    off: (event, listener) => { emitter.off(event, listener); },
    kill: () => false
  };
}

function lifecycleCount(session, lifecycle) {
  return session.events.filter((event) => event.lifecycle === lifecycle).length;
}

function outputEventCount(session) {
  return session.events.filter((event) => event.kind === 'stdout' || event.kind === 'stderr').length;
}

function onceSpawned(child) {
  return new Promise((resolve, reject) => {
    if (child.pid) {
      resolve();
      return;
    }
    child.once('spawn', resolve);
    child.once('error', reject);
  });
}

async function waitFor(predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) {
      return;
    }
    await delay(20);
  }
  throw new Error(`Timed out after ${timeoutMs}ms.`);
}

function delay(timeoutMs) {
  return new Promise((resolve) => setTimeout(resolve, timeoutMs));
}

let negativeFixture;
try {
  await verifyStopRecovery();
  await verifyTimeoutRecovery();
  await verifyDisposeCleanup();
  negativeFixture = await createControlledFixture('negative-base');
  verifyKillTimePidReuse(negativeFixture);
  await verifyNegativeRecovery(negativeFixture);
  await verifyRecoveryDeadlineIncludesProbe(negativeFixture);
  process.kill(negativeFixture.child.pid);
  await negativeFixture.closed;
  assert.equal(controlledChildren.size, 0, 'All controlled non-Agent children must be cleaned up.');
  assert.equal(connectorSpawnCalls, 0, 'Recovery verification must not spawn a Connector or Agent CLI.');

  const sortedLatencies = [...inspectLatenciesMs].sort((left, right) => left - right);
  const p95 = sortedLatencies[Math.max(0, Math.ceil(sortedLatencies.length * 0.95) - 1)];
  console.log('A7 process reattach check passed.');
  console.log(`OS evidence source=${negativeFixture.evidence.evidenceSource}; samples=${sortedLatencies.length}; p95=${p95.toFixed(3)}ms; max=${sortedLatencies.at(-1).toFixed(3)}ms`);
  console.log('positive=restart-recovery + fresh proof + liveness polling + bounded stop/timeout/dispose');
  console.log('negative=missing/wrong/expired/future/reused PID/executable/start/cwd/identity -> one session-lost');
  console.log(`controlled non-Agent child cleanup=0; recovered kill calls=${recoveredKillCalls}`);
  console.log('external Agent CLI spawn count=0');
} finally {
  for (const child of controlledChildren) {
    try {
      process.kill(child.pid);
    } catch {
      // Already gone.
    }
  }
}
