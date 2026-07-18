import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import path from 'node:path';
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
const { ConnectorRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
);

const PROCESS_STATES = new Set(['starting', 'running', 'stopping', 'reattached']);
const RESERVED_STATES = new Set([...PROCESS_STATES, 'recovering']);
const harnesses = [];
const fixtureResults = [];
const reviewResults = [];
const configurableResults = [];
const metrics = {
  maxGlobalActive: 0,
  maxSameAgentActive: 0,
  maxSameAgentReserved: 0,
  maxGlobalReserved: 0,
  externalAgentSpawn: 0,
  maxGlobalWitness: [],
  maxSameAgentWitness: []
};
const reviewCounters = {
  policyDriftSpawn: 0,
  unconfirmedNextSpawn: 0,
  recoverySpawnBeforeProof: 0,
  recoveryReleaseSpawn: 0
};
const configurableCounters = {
  legalLimits: new Map(),
  invalidCases: 0,
  invalidSideEffects: {
    load: 0,
    publish: 0,
    persist: 0,
    timer: 0,
    process: 0,
    authorization: 0,
    discovery: 0,
    clock: 0,
    id: 0
  },
  overCapTimeline: [],
  externalAgentSpawn: 0
};

class FakeProcess extends EventEmitter {
  constructor(pid) {
    super();
    this.pid = pid;
    this.stdout = new EventEmitter();
    this.stderr = new EventEmitter();
    this.killCount = 0;
    this.closed = false;
  }

  kill() {
    this.killCount += 1;
    return true;
  }

  confirmSpawn() {
    this.emit('spawn');
  }

  close(code = 0, signal = null) {
    this.closed = true;
    this.emit('close', code, signal);
  }
}

function readyPolicy(overrides = {}) {
  return {
    version: 1,
    defaults: {
      cwdPolicy: 'workspace-root',
      envAllowlist: ['PATH'],
      confirmation: 'required',
      timeoutSeconds: 30,
      dangerousCommandPatterns: ['rm -rf', 'format']
    },
    connectors: [{
      id: 'codex',
      label: 'Scheduler fixture',
      status: 'ready',
      runner: 'local-command',
      command: 'codex',
      args: [],
      cwdPolicy: 'workspace-root',
      envAllowlist: ['PATH'],
      confirmation: 'required',
      timeoutSeconds: 30,
      acceptanceGate: 'fixture-only',
      approvalStatus: 'accepted',
      enabledByDefault: true,
      acceptedBy: 'scheduler-fixture',
      acceptedAt: '2026-07-17T00:00:00+08:00',
      approvalEvidence: 'local fake process only',
      ...overrides
    }]
  };
}

function createHarness(options = {}) {
  let nowMs = Date.parse(options.now ?? '2026-07-17T00:00:00.000Z');
  let id = 0;
  const harness = {
    runtime: null,
    processes: [],
    spawnCalls: [],
    timers: [],
    published: [],
    persisted: [],
    recoveredProcesses: [],
    maxGlobalActive: 0,
    maxGlobalReserved: 0,
    maxSameAgentActive: 0,
    maxSameAgentReserved: 0,
    configuredLimit: options.maxGlobalActive ?? 1,
    advance(ms) {
      nowMs += ms;
    }
  };
  harness.runtime = new ConnectorRuntime({
    maxGlobalActive: options.maxGlobalActive,
    loadPolicy: options.loadPolicy ?? (() => options.policy ?? readyPolicy()),
    resolveExecutable: (command) => command === 'codex' ? 'C:\\fixture\\codex.exe' : null,
    spawnProcess: (file, args, spawnOptions) => {
      const process = new FakeProcess(7000 + harness.processes.length);
      harness.processes.push(process);
      harness.spawnCalls.push({ file, args, options: spawnOptions, process });
      options.onSpawn?.(harness, process);
      return process;
    },
    workspaceRoot: 'E:\\fixture-workspace',
    sourceEnv: { PATH: 'fixture-path', SECRET_SHOULD_NOT_PASS: 'secret' },
    authorizeRun: options.authorizeRun ?? (() => ({ authorized: true })),
    classifyFailure: options.classifyFailure,
    reattachProcess: options.reattachProcess,
    loadPersistedSnapshot: options.persistedSnapshot === undefined
      ? undefined
      : () => structuredClone(options.persistedSnapshot),
    publish: (snapshot) => {
      const cloned = structuredClone(snapshot);
      harness.published.push(cloned);
      observeConcurrency(cloned, harness);
      options.onPublish?.(harness, cloned);
    },
    persistSnapshot: (snapshot) => harness.persisted.push(structuredClone(snapshot)),
    now: () => new Date(nowMs),
    createId: () => String(++id),
    heartbeatStaleAfterMs: 10_000,
    recoveryGraceMs: 500,
    processProofTimeoutMs: 100,
    terminationGraceMs: 100,
    outputFlushMs: 25,
    setTimer: (callback, timeoutMs) => {
      const timer = { callback, timeoutMs, cleared: false };
      harness.timers.push(timer);
      return timer;
    },
    clearTimer: (timer) => {
      timer.cleared = true;
    }
  });
  harnesses.push(harness);
  return harness;
}

function observeConcurrency(snapshot, harness) {
  const processSessions = snapshot.tasks.filter((task) => PROCESS_STATES.has(task.state));
  const reservedSessions = snapshot.tasks.filter((task) => RESERVED_STATES.has(task.state));
  harness.maxGlobalActive = Math.max(harness.maxGlobalActive, processSessions.length);
  harness.maxGlobalReserved = Math.max(harness.maxGlobalReserved, reservedSessions.length);
  metrics.maxGlobalReserved = Math.max(metrics.maxGlobalReserved, reservedSessions.length);
  if (processSessions.length > metrics.maxGlobalActive) {
    metrics.maxGlobalActive = processSessions.length;
    metrics.maxGlobalWitness = processSessions.map(({ taskId, taskName, agentId, state }) => ({
      taskId,
      taskName,
      agentId,
      state
    }));
  }
  const byAgent = new Map();
  processSessions.forEach((task) => byAgent.set(task.agentId, (byAgent.get(task.agentId) ?? 0) + 1));
  const sameAgentActive = Math.max(0, ...byAgent.values());
  const reservedByAgent = new Map();
  reservedSessions.forEach((task) => reservedByAgent.set(task.agentId, (reservedByAgent.get(task.agentId) ?? 0) + 1));
  const sameAgentReserved = Math.max(0, ...reservedByAgent.values());
  harness.maxSameAgentActive = Math.max(harness.maxSameAgentActive, sameAgentActive);
  harness.maxSameAgentReserved = Math.max(harness.maxSameAgentReserved, sameAgentReserved);
  metrics.maxSameAgentReserved = Math.max(metrics.maxSameAgentReserved, sameAgentReserved);
  if (sameAgentActive > metrics.maxSameAgentActive) {
    metrics.maxSameAgentActive = sameAgentActive;
    metrics.maxSameAgentWitness = processSessions.map(({ taskId, taskName, agentId, state }) => ({
      taskId,
      taskName,
      agentId,
      state
    }));
  }
}

function request(overrides = {}) {
  return {
    connectorId: 'codex',
    agentId: 'codex',
    taskName: 'scheduler fixture',
    prompt: 'Return fixture JSON only.',
    requestedBy: 'explicit-user-action',
    dependsOn: [],
    ...overrides
  };
}

function persistedActiveSnapshot(label, overrides = {}) {
  const now = '2026-07-17T00:00:00.000Z';
  const startedAt = '2026-07-16T23:59:59.000Z';
  return {
    version: 1,
    updatedAt: now,
    tasks: [{
      taskId: overrides.taskId ?? `persisted-task-${label}`,
      sessionId: overrides.sessionId ?? `persisted-session-${label}`,
      connectorId: 'codex',
      agentId: overrides.agentId ?? `recovered-${label}`,
      taskName: overrides.taskName ?? `R03 recovered ${label}`,
      requestedBy: 'explicit-user-action',
      source: 'runtime-spawn',
      capabilities: null,
      capabilitySource: 'unknown',
      state: 'running',
      startedAt,
      queuedAt: startedAt,
      processStartedAt: startedAt,
      queueWaitMs: 0,
      dependsOn: [],
      pid: overrides.pid ?? 9100,
      processFingerprint: {
        version: 1,
        pid: overrides.pid ?? 9100,
        executablePath: 'c:\\fixture\\codex.exe',
        startedAt,
        cwd: 'e:\\fixture-workspace',
        cwdSource: 'spawn-envelope',
        commandLineSha256: 'a'.repeat(64),
        processIdentitySha256: 'b'.repeat(64),
        runEnvelopeSha256: 'c'.repeat(64),
        capturedAt: now,
        evidenceSource: 'windows-cim'
      },
      attempt: 1,
      maxAttempts: 1,
      retryPolicy: { maxRetries: 0, backoffMs: 100, budgetMs: 0 },
      timeoutAt: '2026-07-17T00:01:00.000Z',
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
        lastSeen: now,
        staleAfterMs: 10_000
      },
      events: [{
        eventId: `persisted-event-${label}`,
        sequence: 1,
        timestamp: startedAt,
        kind: 'lifecycle',
        lifecycle: 'session-started',
        message: 'Persisted fixture process started.'
      }]
    }],
    instances: [],
    runtime: {
      availability: 'available',
      mode: 'real',
      source: 'electron-main',
      observedAt: now
    }
  };
}

function combinePersistedSnapshots(entries) {
  const snapshots = entries.map(({ label, ...overrides }) => persistedActiveSnapshot(label, overrides));
  const combined = structuredClone(snapshots[0]);
  combined.tasks = snapshots.flatMap((snapshot) => snapshot.tasks);
  return combined;
}

function deferred() {
  let resolve;
  const promise = new Promise((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

async function settleAsync() {
  await Promise.resolve();
  await Promise.resolve();
}

function session(harness, result) {
  return harness.runtime.getSnapshot().tasks.find((task) => task.sessionId === result.sessionId);
}

function liveTimers(harness, timeoutMs) {
  return harness.timers.filter((timer) => !timer.cleared && (timeoutMs === undefined || timer.timeoutMs === timeoutMs));
}

function fireTimer(timer) {
  assert(timer && !timer.cleared, 'fixture timer must be live before firing');
  timer.callback();
}

function terminalCount(task) {
  return task.events.filter((event) => event.lifecycle === 'session-terminal').length;
}

function assertOrderedEvents(task) {
  const sequences = task.events.map((event) => event.sequence);
  assert(sequences.every((sequence, index) => index === 0 || sequence > sequences[index - 1]), 'event sequence must increase strictly');
  assert.equal(new Set(task.events.map((event) => event.eventId)).size, task.events.length, 'eventId must remain unique');
}

function pass(id, detail) {
  fixtureResults.push({ id, detail });
}

function reviewPass(id, detail) {
  reviewResults.push({ id, detail });
}

function configurablePass(id, detail) {
  configurableResults.push({ id, detail });
}

// S-01: one global slot across independent agents.
{
  const h = createHarness();
  const first = h.runtime.start(request({ agentId: 'alpha', taskName: 'S01 first' }));
  const second = h.runtime.start(request({ agentId: 'beta', taskName: 'S01 second' }));
  assert.equal(h.processes.length, 1);
  assert.equal(session(h, second)?.state, 'queued');
  h.processes[0].confirmSpawn();
  h.processes[0].close(0);
  assert.equal(h.processes.length, 2);
  h.processes[1].confirmSpawn();
  h.processes[1].close(0);
  assert.equal(session(h, first)?.state, 'success');
  assert.equal(session(h, second)?.state, 'success');
  pass('S-01', 'global concurrency fixed at 1');
}

// S-02: one active task per AgentInstance.
{
  const h = createHarness();
  const first = h.runtime.start(request({ taskName: 'S02 first' }));
  const second = h.runtime.start(request({ taskName: 'S02 second' }));
  h.processes[0].confirmSpawn();
  assert.equal(session(h, second)?.state, 'queued');
  assert.equal(h.processes.length, 1);
  h.processes[0].close(0);
  h.processes[1].confirmSpawn();
  h.processes[1].close(0);
  assert.equal(session(h, first)?.state, 'success');
  assert.equal(session(h, second)?.state, 'success');
  pass('S-02', 'same Agent active maximum fixed at 1');
}

// S-03: stable FIFO with a taskId tie-break for equal queuedAt values.
{
  const winners = [];
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const h = createHarness();
    const blocker = h.runtime.start(request({ agentId: 'blocker', taskName: `S03 blocker ${iteration}` }));
    h.processes[0].confirmSpawn();
    const left = h.runtime.start(request({ taskName: `S03 left ${iteration}` }));
    const right = h.runtime.start(request({ taskName: `S03 right ${iteration}` }));
    const expected = [left.taskId, right.taskId].sort((a, b) => a.localeCompare(b))[0];
    h.processes[0].close(0);
    assert.equal(session(h, blocker)?.state, 'success');
    assert.equal(h.runtime.getSnapshot().tasks.find((task) => task.taskId === expected)?.state, 'starting');
    winners.push(expected);
    h.processes[1].confirmSpawn();
    h.processes[1].close(0);
    h.processes[2].confirmSpawn();
    h.processes[2].close(0);
  }
  assert.equal(new Set(winners).size, 1, 'equal queuedAt tie-break must remain stable across repeated harness runs');
  pass('S-03', `equal queuedAt tie-break=${winners[0]} across ${winners.length} runs`);
}

// S-04: one successful dependency unlocks exactly one spawn.
{
  const h = createHarness();
  const prerequisite = h.runtime.start(request({ taskName: 'S04 prerequisite' }));
  h.processes[0].confirmSpawn();
  const dependent = h.runtime.start(request({ taskName: 'S04 dependent', dependsOn: [prerequisite.taskId] }));
  assert.equal(h.processes.length, 1);
  h.processes[0].close(0);
  assert.equal(h.processes.length, 2);
  h.processes[1].confirmSpawn();
  h.processes[1].close(0);
  assert.equal(session(h, dependent)?.state, 'success');
  pass('S-04', 'single dependency success unlocks once');
}

// S-05: every dependency must succeed before admission.
{
  const h = createHarness();
  const first = h.runtime.start(request({ agentId: 'dep-a', taskName: 'S05 first' }));
  h.processes[0].confirmSpawn();
  const second = h.runtime.start(request({ agentId: 'dep-b', taskName: 'S05 second' }));
  const dependent = h.runtime.start(request({ agentId: 'target', taskName: 'S05 dependent', dependsOn: [first.taskId, second.taskId] }));
  h.processes[0].close(0);
  assert.equal(h.processes.length, 2);
  assert.equal(session(h, dependent)?.state, 'queued');
  h.processes[1].confirmSpawn();
  h.processes[1].close(0);
  assert.equal(h.processes.length, 3);
  h.processes[2].confirmSpawn();
  h.processes[2].close(0);
  assert.equal(session(h, dependent)?.state, 'success');
  pass('S-05', 'multiple dependencies require all-success');
}

// S-06: error, cancellation and timeout block downstream without spawn.
{
  for (const terminal of ['error', 'cancel', 'timeout']) {
    const h = createHarness();
    const prerequisite = h.runtime.start(request({ taskName: `S06 ${terminal} prerequisite` }));
    h.processes[0].confirmSpawn();
    const dependent = h.runtime.start(request({
      taskName: `S06 ${terminal} dependent`,
      dependsOn: [prerequisite.taskId],
      retry: { maxRetries: 2, backoffMs: 100, budgetMs: 1_000 }
    }));
    if (terminal === 'error') {
      h.processes[0].close(9);
    } else if (terminal === 'cancel') {
      h.runtime.stop({ taskId: prerequisite.taskId });
      h.processes[0].close(null, 'SIGTERM');
    } else {
      fireTimer(liveTimers(h, 30_000)[0]);
      h.processes[0].close(null, 'SIGTERM');
    }
    assert.equal(h.processes.length, 1);
    assert.equal(session(h, dependent)?.state, 'dependency-blocked');
    assert.equal(session(h, dependent)?.attempt, 0);
    assert.equal(session(h, dependent)?.events.some((event) => event.lifecycle === 'retry-scheduled'), false);
    assert.equal(terminalCount(session(h, dependent)), 1);
  }
  pass('S-06', 'error/cancel/timeout propagate dependency-blocked');
}

// S-07: malformed DAG edges fail closed.
{
  const unknown = createHarness();
  const unknownRun = unknown.runtime.start(request({ dependsOn: ['missing-task'] }));
  assert.equal(unknownRun.status, 'blocked');
  assert.equal(unknownRun.blockedReasons[0], 'dependency-not-found');
  assert.equal(unknown.processes.length, 0);

  const duplicate = createHarness();
  const prerequisite = duplicate.runtime.start(request({ taskName: 'S07 prerequisite' }));
  duplicate.processes[0].confirmSpawn();
  duplicate.processes[0].close(0);
  const duplicateRun = duplicate.runtime.start(request({ dependsOn: [prerequisite.taskId, prerequisite.taskId] }));
  assert.equal(duplicateRun.status, 'blocked');
  assert.equal(duplicateRun.blockedReasons[0], 'dependency-invalid');
  assert.equal(duplicate.processes.length, 1);

  const selfCycle = createHarness();
  const selfRun = selfCycle.runtime.start(request({ dependsOn: ['connector-task-1'] }));
  assert.equal(selfRun.status, 'blocked');
  assert.equal(selfRun.blockedReasons[0], 'dependency-cycle');
  assert.equal(selfCycle.processes.length, 0);
  pass('S-07', 'unknown/duplicate/self-cycle fail closed; forward edges cannot create a cycle');
}

// S-08: queued cancellation has no process or kill surface.
{
  const h = createHarness();
  const blocker = h.runtime.start(request({ agentId: 'blocker', taskName: 'S08 blocker' }));
  h.processes[0].confirmSpawn();
  const queued = h.runtime.start(request({
    taskName: 'S08 queued',
    retry: { maxRetries: 2, backoffMs: 100, budgetMs: 1_000 }
  }));
  const result = h.runtime.stop({ taskId: queued.taskId });
  assert.equal(result.status, 'stopped');
  assert.equal(h.processes.length, 1);
  assert.equal(h.processes[0].killCount, 0);
  assert.equal(session(h, queued)?.state, 'stopped');
  assert.equal(session(h, queued)?.attempt, 0);
  assert.equal(session(h, queued)?.events.some((event) => event.lifecycle === 'retry-scheduled'), false);
  assert.equal(terminalCount(session(h, queued)), 1);
  h.processes[0].close(0);
  assert.equal(session(h, blocker)?.state, 'success');
  pass('S-08', 'queued cancel spawn=0 kill=0 terminal=1');
}

// S-09: active cancellation releases the slot only after close evidence.
{
  const h = createHarness();
  const active = h.runtime.start(request({
    taskName: 'S09 active',
    retry: { maxRetries: 2, backoffMs: 100, budgetMs: 1_000 }
  }));
  h.processes[0].confirmSpawn();
  const queued = h.runtime.start(request({ taskName: 'S09 queued' }));
  assert.equal(h.runtime.stop({ taskId: active.taskId }).status, 'stopping');
  assert.equal(h.processes.length, 1);
  h.processes[0].close(null, 'SIGTERM');
  assert.equal(h.processes.length, 2);
  h.processes[1].confirmSpawn();
  h.processes[1].close(0);
  assert.equal(session(h, active)?.state, 'stopped');
  assert.equal(session(h, active)?.attempt, 1);
  assert.equal(session(h, active)?.events.some((event) => event.lifecycle === 'retry-scheduled'), false);
  assert.equal(session(h, queued)?.state, 'success');
  pass('S-09', 'active cancel waits for close then releases slot');
}

// S-10: queue wait is separate and timeout begins at spawn confirmation.
{
  const h = createHarness();
  const blocker = h.runtime.start(request({ agentId: 'blocker', taskName: 'S10 blocker' }));
  h.processes[0].confirmSpawn();
  const timed = h.runtime.start(request({ taskName: 'S10 timed' }));
  h.advance(5_000);
  assert.equal(session(h, timed)?.timeoutAt, undefined);
  h.processes[0].close(0);
  assert.equal(h.processes.length, 2);
  assert.equal(session(h, blocker)?.state, 'success');
  assert.equal(session(h, timed)?.timeoutAt, undefined);
  assert.equal(liveTimers(h, 30_000).length, 0);
  h.advance(2_000);
  h.processes[1].confirmSpawn();
  assert.equal(session(h, timed)?.queueWaitMs, 7_000);
  assert.equal(Date.parse(session(h, timed).timeoutAt) - Date.parse(session(h, timed).processStartedAt), 30_000);
  fireTimer(liveTimers(h, 30_000)[0]);
  h.processes[1].close(null, 'SIGTERM');
  assert.equal(session(h, timed)?.state, 'timed-out');
  pass('S-10', 'queueWait=7000ms; timeout origin=processStartedAt');
}

// S-11: retry never overlaps the old process and retains one task/session identity.
{
  const h = createHarness({
    classifyFailure: (failure) => ({ ...failure, retryable: failure.kind === 'process-error' })
  });
  const run = h.runtime.start(request({
    taskName: 'S11 retry',
    retry: { maxRetries: 1, backoffMs: 100, budgetMs: 1_000 }
  }));
  h.processes[0].confirmSpawn();
  h.processes[0].emit('error', new Error('transient fixture'));
  assert.equal(h.processes.length, 1);
  h.processes[0].close(1);
  assert.equal(session(h, run)?.state, 'retrying');
  const retryScheduled = session(h, run)?.events.find((event) => event.lifecycle === 'retry-scheduled');
  assert.equal(retryScheduled?.payload?.delayMs, 100);
  assert.equal(retryScheduled?.payload?.nextAttempt, 2);
  assert.equal(retryScheduled?.payload?.budgetRemainingMs, 1_000);
  fireTimer(liveTimers(h, 100)[0]);
  assert.equal(session(h, run)?.events.some((event) => event.lifecycle === 'retry-started'), true);
  assert.equal(h.processes.length, 2);
  h.processes[1].confirmSpawn();
  h.processes[1].close(0);
  assert.equal(session(h, run)?.state, 'success');
  assert.equal(session(h, run)?.attempt, 2);
  pass('S-11', 'retry reuses identity and never overlaps attempts');
}

// S-12: non-retryable categories keep retry count at zero.
{
  const permission = createHarness({
    classifyFailure: (failure) => ({ ...failure, retryable: true })
  });
  const permissionRun = permission.runtime.start(request({
    taskName: 'S12 permission',
    retry: { maxRetries: 2, backoffMs: 100, budgetMs: 1_000 }
  }));
  permission.processes[0].emit('error', new Error('spawn EPERM fixture'));
  permission.processes[0].close(null);
  assert.equal(session(permission, permissionRun)?.state, 'permission-denied');
  assert.equal(permission.processes.length, 1);
  assert.equal(liveTimers(permission).length, 0);

  const policy = createHarness({ policy: readyPolicy({ status: 'draft', approvalStatus: 'pending', enabledByDefault: false }) });
  assert.equal(policy.runtime.start(request({ retry: { maxRetries: 2, backoffMs: 100, budgetMs: 1_000 } })).status, 'blocked');
  assert.equal(policy.processes.length, 0);
  pass('S-12', 'permission/policy plus S06 dependency and S08 cancel never retry');
}

// S-13: retry backoff releases the slot for independent work.
{
  const h = createHarness({
    classifyFailure: (failure) => ({ ...failure, retryable: failure.kind === 'process-error' })
  });
  const retry = h.runtime.start(request({
    agentId: 'retry-agent',
    taskName: 'S13 retry',
    retry: { maxRetries: 1, backoffMs: 100, budgetMs: 1_000 }
  }));
  h.processes[0].confirmSpawn();
  const independent = h.runtime.start(request({ agentId: 'independent', taskName: 'S13 independent' }));
  h.processes[0].emit('error', new Error('transient fixture'));
  h.processes[0].close(1);
  assert.equal(h.processes.length, 2);
  assert.equal(session(h, retry)?.state, 'retrying');
  h.processes[1].confirmSpawn();
  fireTimer(liveTimers(h, 100)[0]);
  assert.equal(h.processes.length, 2);
  assert.equal(session(h, retry)?.state, 'queued');
  h.processes[1].close(0);
  assert.equal(session(h, independent)?.state, 'success');
  assert.equal(h.processes.length, 3);
  h.processes[2].confirmSpawn();
  h.processes[2].close(0);
  assert.equal(session(h, retry)?.state, 'success');
  pass('S-13', 'independent task runs during retry backoff');
}

// S-14: dispose and persisted queued recovery fail closed without residue.
{
  const h = createHarness();
  const active = h.runtime.start(request({ agentId: 'active', taskName: 'S14 active' }));
  h.processes[0].confirmSpawn();
  const queued = h.runtime.start(request({ agentId: 'queued', taskName: 'S14 queued' }));
  const persistedQueued = structuredClone(h.runtime.getSnapshot());
  persistedQueued.tasks = persistedQueued.tasks.filter((task) => task.taskId === queued.taskId);
  h.runtime.dispose();
  h.processes[0].close(null, 'SIGTERM');
  assert.equal(session(h, queued)?.state, 'stopped');
  assert.equal(session(h, active)?.state, 'session-lost');
  assert.equal(liveTimers(h).length, 0);

  const recovered = createHarness({ persistedSnapshot: persistedQueued });
  assert.equal(recovered.runtime.getSnapshot().tasks[0].state, 'session-lost');
  assert.equal(recovered.processes.length, 0);
  assert.equal(liveTimers(recovered).length, 0);
  pass('S-14', 'dispose and persisted queued recovery leave no process/timer residue');
}

// S-15: audit stays redacted, ordered and terminal-idempotent.
{
  const secret = 'SCHEDULER-SECRET-1234';
  const h = createHarness();
  const run = h.runtime.start(request({ taskName: 'S15 audit', prompt: secret }));
  h.processes[0].confirmSpawn();
  h.processes[0].stdout.emit('data', `${secret}\ntoken=scheduler-token\nordinary line\n`);
  fireTimer(liveTimers(h, 25)[0]);
  h.processes[0].close(0);
  h.processes[0].close(0);
  const audited = session(h, run);
  assert(!JSON.stringify(audited).includes(secret));
  assert(!JSON.stringify(audited).includes('scheduler-token'));
  assert(!JSON.stringify(h.persisted).includes(secret));
  assert(!JSON.stringify(h.persisted).includes('scheduler-token'));
  assert.equal(terminalCount(audited), 1);
  assertOrderedEvents(audited);
  pass('S-15', 'redacted ordered audit with one terminal event');
}

// R-01: policy is re-read at dequeue and retry admission; cached gate results are forbidden.
{
  let dequeuePolicy = readyPolicy();
  const dequeue = createHarness({ loadPolicy: () => dequeuePolicy });
  const blocker = dequeue.runtime.start(request({ agentId: 'r01-blocker', taskName: 'R01 blocker' }));
  dequeue.processes[0].confirmSpawn();
  const queued = dequeue.runtime.start(request({ agentId: 'r01-queued', taskName: 'R01 queued drift' }));
  dequeuePolicy = readyPolicy({ status: 'draft' });
  dequeue.processes[0].close(0);
  assert.equal(session(dequeue, blocker)?.state, 'success');
  assert.equal(session(dequeue, queued)?.state, 'policy-blocked');
  reviewCounters.policyDriftSpawn += Math.max(0, dequeue.processes.length - 1);

  let retryPolicy = readyPolicy();
  const retry = createHarness({
    loadPolicy: () => retryPolicy,
    classifyFailure: (failure) => ({ ...failure, retryable: failure.kind === 'process-error' })
  });
  const retryRun = retry.runtime.start(request({
    taskName: 'R01 retry drift',
    retry: { maxRetries: 1, backoffMs: 100, budgetMs: 1_000 }
  }));
  retry.processes[0].confirmSpawn();
  retry.processes[0].emit('error', new Error('R01 retryable fixture'));
  retry.processes[0].close(1);
  assert.equal(session(retry, retryRun)?.state, 'retrying');
  retryPolicy = readyPolicy({ status: 'draft' });
  fireTimer(liveTimers(retry, 100)[0]);
  assert.equal(session(retry, retryRun)?.state, 'policy-blocked');
  reviewCounters.policyDriftSpawn += Math.max(0, retry.processes.length - 1);
  assert.equal(reviewCounters.policyDriftSpawn, 0);
  reviewPass('R-01', 'dequeue and retry policy drift fail closed with spawn=0');
}

// R-02: session-lost is not process-exit proof and cannot release the global slot.
{
  const h = createHarness();
  const active = h.runtime.start(request({ agentId: 'r02-active', taskName: 'R02 unconfirmed active' }));
  h.processes[0].confirmSpawn();
  const queued = h.runtime.start(request({ agentId: 'r02-queued', taskName: 'R02 next' }));
  h.runtime.stop({ taskId: active.taskId });
  fireTimer(liveTimers(h, 100)[0]);
  fireTimer(liveTimers(h, 100)[0]);
  assert.equal(session(h, active)?.state, 'session-lost');
  assert.equal(session(h, active)?.termination?.exitConfirmed, false);
  reviewCounters.unconfirmedNextSpawn += Math.max(0, h.processes.length - 1);
  assert.equal(reviewCounters.unconfirmedNextSpawn, 0);
  assert.equal(session(h, queued)?.state, 'queued');
  assert.equal(h.processes[0].listenerCount('close'), 1);
  h.processes[0].close(null, 'SIGTERM');
  assert.equal(h.processes.length, 2);
  h.processes[1].confirmSpawn();
  h.processes[1].close(0);

  const disposing = createHarness();
  const disposeRun = disposing.runtime.start(request({ taskName: 'R02 dispose residue' }));
  disposing.processes[0].confirmSpawn();
  const pendingDispose = disposing.runtime.disposeAndWait(1);
  fireTimer(liveTimers(disposing, 100)[0]);
  assert.equal(session(disposing, disposeRun)?.state, 'session-lost');
  assert.equal(await pendingDispose, false, 'dispose must report incomplete while process close is unconfirmed');
  disposing.processes[0].close(null, 'SIGTERM');
  assert.equal(await disposing.runtime.disposeAndWait(50), true);
  reviewPass('R-02', 'unconfirmed close retains slot; dispose reports residue until close');
}

// R-03: persisted recovery proof reserves the global slot until success-close or fail-closed release.
{
  const successGate = deferred();
  const recoveredProcess = new FakeProcess(9100);
  const success = createHarness({
    persistedSnapshot: persistedActiveSnapshot('success'),
    reattachProcess: () => successGate.promise
  });
  const successQueued = success.runtime.start(request({ agentId: 'r03-success', taskName: 'R03 success queued' }));
  reviewCounters.recoverySpawnBeforeProof += success.processes.length;
  assert.equal(success.processes.length, 0);
  successGate.resolve({ process: recoveredProcess, provenAt: '2026-07-17T00:00:00.000Z' });
  await settleAsync();
  assert.equal(success.runtime.getSnapshot().tasks.find((task) => task.taskId === 'persisted-task-success')?.state, 'reattached');
  assert.equal(success.processes.length, 0);
  recoveredProcess.close(0);
  assert.equal(success.processes.length, 1);
  reviewCounters.recoveryReleaseSpawn += 1;
  success.processes[0].confirmSpawn();
  success.processes[0].close(0);
  assert.equal(session(success, successQueued)?.state, 'success');

  const failureGate = deferred();
  const failure = createHarness({
    persistedSnapshot: persistedActiveSnapshot('failure'),
    reattachProcess: () => failureGate.promise
  });
  const failureQueued = failure.runtime.start(request({ agentId: 'r03-failure', taskName: 'R03 failure queued' }));
  reviewCounters.recoverySpawnBeforeProof += failure.processes.length;
  failureGate.resolve(null);
  await settleAsync();
  assert.equal(failure.processes.length, 0);
  fireTimer(liveTimers(failure, 500)[0]);
  assert.equal(failure.processes.length, 1);
  reviewCounters.recoveryReleaseSpawn += 1;
  failure.processes[0].confirmSpawn();
  failure.processes[0].close(0);
  assert.equal(session(failure, failureQueued)?.state, 'success');

  const timeoutGate = deferred();
  const timeout = createHarness({
    persistedSnapshot: persistedActiveSnapshot('timeout'),
    reattachProcess: () => timeoutGate.promise
  });
  const timeoutQueued = timeout.runtime.start(request({ agentId: 'r03-timeout', taskName: 'R03 timeout queued' }));
  reviewCounters.recoverySpawnBeforeProof += timeout.processes.length;
  fireTimer(liveTimers(timeout, 500)[0]);
  assert.equal(timeout.processes.length, 1);
  reviewCounters.recoveryReleaseSpawn += 1;
  timeoutGate.resolve({ process: new FakeProcess(9100), provenAt: '2026-07-17T00:00:00.000Z' });
  await settleAsync();
  assert.equal(timeout.processes.length, 1, 'late recovery proof must not create another active process');
  timeout.processes[0].confirmSpawn();
  timeout.processes[0].close(0);
  assert.equal(session(timeout, timeoutQueued)?.state, 'success');

  assert.equal(reviewCounters.recoverySpawnBeforeProof, 0);
  assert.equal(reviewCounters.recoveryReleaseSpawn, 3);
  reviewPass('R-03', 'recovery reserves slot; success close and fail/timeout release deterministically');
}

// C-01: absence preserves the accepted single-slot behavior.
{
  const h = createHarness();
  const first = h.runtime.start(request({ agentId: 'c01-a', taskName: 'C01 first' }));
  const second = h.runtime.start(request({ agentId: 'c01-b', taskName: 'C01 second' }));
  assert.equal(h.processes.length, 1);
  assert.equal(session(h, second)?.state, 'queued');
  h.processes[0].confirmSpawn();
  h.processes[0].close(0);
  h.processes[1].confirmSpawn();
  h.processes[1].close(0);
  assert.equal(session(h, first)?.state, 'success');
  configurableCounters.legalLimits.set(1, {
    maxActive: h.maxGlobalActive,
    maxReserved: h.maxGlobalReserved,
    maxSameAgent: h.maxSameAgentReserved
  });
  configurablePass('C-01', 'setting absent preserves global limit 1');
}

// C-02: every legal configured value fills exactly its own capacity.
{
  for (const limit of [2, 3, 4]) {
    const h = createHarness({ maxGlobalActive: limit });
    const runs = Array.from({ length: limit }, (_, index) => h.runtime.start(request({
      agentId: `c02-${limit}-${index}`,
      taskName: `C02 limit ${limit} task ${index}`
    })));
    assert(runs.every((run) => run.status === 'accepted'));
    assert.equal(h.processes.length, limit);
    h.processes.forEach((process) => process.confirmSpawn());
    assert.equal(h.runtime.getSnapshot().tasks.filter((task) => PROCESS_STATES.has(task.state)).length, limit);
    configurableCounters.legalLimits.set(limit, {
      maxActive: h.maxGlobalActive,
      maxReserved: h.maxGlobalReserved,
      maxSameAgent: h.maxSameAgentReserved
    });
    h.processes.forEach((process) => process.close(0));
  }
  configurablePass('C-02', 'legal limits 2/3/4 each fill exact capacity');
}

// C-03: global spare capacity never weakens same-Agent concurrency 1.
{
  const h = createHarness({ maxGlobalActive: 2 });
  const first = h.runtime.start(request({ agentId: 'c03-shared', taskName: 'C03 shared first' }));
  const second = h.runtime.start(request({ agentId: 'c03-shared', taskName: 'C03 shared second' }));
  const independent = h.runtime.start(request({ agentId: 'c03-independent', taskName: 'C03 independent' }));
  assert.equal(h.processes.length, 2);
  h.processes[0].confirmSpawn();
  h.processes[1].confirmSpawn();
  assert.equal(session(h, second)?.state, 'queued');
  h.processes[1].close(0);
  assert.equal(h.processes.length, 2, 'free capacity must not bypass the active same-Agent reservation');
  h.processes[0].close(0);
  assert.equal(h.processes.length, 3);
  h.processes[2].confirmSpawn();
  h.processes[2].close(0);
  assert.equal(session(h, first)?.state, 'success');
  assert.equal(session(h, independent)?.state, 'success');
  assert.equal(h.maxSameAgentReserved, 1);
  configurablePass('C-03', 'same-Agent reservation remains 1 with global limit 2');
}

// C-04: one confirmed close refills exactly one configured slot.
{
  for (const limit of [2, 3, 4]) {
    const h = createHarness({ maxGlobalActive: limit });
    const runs = Array.from({ length: limit + 1 }, (_, index) => h.runtime.start(request({
      agentId: `c04-${limit}-${index}`,
      taskName: `C04 limit ${limit} task ${index}`
    })));
    assert.equal(h.processes.length, limit);
    assert.equal(session(h, runs.at(-1))?.state, 'queued');
    h.processes.slice(0, limit).forEach((process) => process.confirmSpawn());
    h.processes[0].close(0);
    assert.equal(h.processes.length, limit + 1);
    assert.equal(h.runtime.getSnapshot().tasks.filter((task) => PROCESS_STATES.has(task.state)).length, limit);
    h.processes[limit].confirmSpawn();
    h.processes.slice(1, limit).forEach((process) => process.close(0));
    h.processes[limit].close(0);
    assert(h.maxGlobalReserved <= limit);
  }
  configurablePass('C-04', 'limits 2/3/4 queue one excess and refill once per close');
}

// C-05: equal queuedAt tasks fill multiple free slots by taskId order.
{
  const h = createHarness({ maxGlobalActive: 2 });
  h.runtime.start(request({ agentId: 'c05-block-a', taskName: 'C05 blocker A' }));
  h.runtime.start(request({ agentId: 'c05-block-b', taskName: 'C05 blocker B' }));
  h.processes.forEach((process) => process.confirmSpawn());
  const queued = [0, 1, 2].map((index) => h.runtime.start(request({
    agentId: `c05-ready-${index}`,
    taskName: `C05 ready ${index}`
  })));
  const orderedIds = queued.map((run) => run.taskId).sort((left, right) => left.localeCompare(right));
  h.processes[0].close(0);
  h.processes[1].close(0);
  const startingIds = h.runtime.getSnapshot().tasks
    .filter((task) => task.state === 'starting')
    .map((task) => task.taskId)
    .sort((left, right) => left.localeCompare(right));
  assert.deepEqual(startingIds, orderedIds.slice(0, 2));
  h.processes[2].confirmSpawn();
  h.processes[3].confirmSpawn();
  h.processes[2].close(0);
  assert.equal(h.runtime.getSnapshot().tasks.find((task) => task.taskId === orderedIds[2])?.state, 'starting');
  h.processes[4].confirmSpawn();
  h.processes[3].close(0);
  h.processes[4].close(0);
  configurablePass('C-05', `two-slot tie-break=${orderedIds.slice(0, 2).join(',')}`);
}

// C-06: spare capacity cannot bypass waiting or failed dependencies.
{
  const success = createHarness({ maxGlobalActive: 2 });
  const prerequisite = success.runtime.start(request({ agentId: 'c06-pre', taskName: 'C06 prerequisite' }));
  success.processes[0].confirmSpawn();
  const dependent = success.runtime.start(request({
    agentId: 'c06-dependent',
    taskName: 'C06 dependent',
    dependsOn: [prerequisite.taskId]
  }));
  assert.equal(success.processes.length, 1);
  assert.equal(session(success, dependent)?.state, 'queued');
  success.processes[0].close(0);
  success.processes[1].confirmSpawn();
  success.processes[1].close(0);

  const failed = createHarness({ maxGlobalActive: 2 });
  const failedPrerequisite = failed.runtime.start(request({ agentId: 'c06-fail-pre', taskName: 'C06 failed prerequisite' }));
  failed.processes[0].confirmSpawn();
  const blocked = failed.runtime.start(request({
    agentId: 'c06-blocked',
    taskName: 'C06 blocked dependent',
    dependsOn: [failedPrerequisite.taskId]
  }));
  failed.processes[0].close(9);
  assert.equal(failed.processes.length, 1);
  assert.equal(session(failed, blocked)?.state, 'dependency-blocked');
  configurablePass('C-06', 'dependency waiting/failure wins over spare capacity');
}

// C-07: unconfirmed close retains one slot while genuinely free capacity refills.
{
  const h = createHarness({ maxGlobalActive: 2 });
  const first = h.runtime.start(request({ agentId: 'c07-a', taskName: 'C07 unconfirmed' }));
  h.runtime.start(request({ agentId: 'c07-b', taskName: 'C07 confirmed' }));
  h.processes.forEach((process) => process.confirmSpawn());
  const third = h.runtime.start(request({ agentId: 'c07-c', taskName: 'C07 third' }));
  const fourth = h.runtime.start(request({ agentId: 'c07-d', taskName: 'C07 fourth' }));
  h.runtime.stop({ taskId: first.taskId });
  fireTimer(liveTimers(h, 100)[0]);
  fireTimer(liveTimers(h, 100)[0]);
  assert.equal(session(h, first)?.state, 'session-lost');
  assert.equal(h.processes.length, 2);
  h.processes[1].close(0);
  assert.equal(h.processes.length, 3);
  h.processes[2].confirmSpawn();
  assert.equal(session(h, fourth)?.state, 'queued');
  h.processes[0].close(null, 'SIGTERM');
  assert.equal(h.processes.length, 4);
  h.processes[3].confirmSpawn();
  h.processes[2].close(0);
  h.processes[3].close(0);
  assert.equal(session(h, third)?.state, 'success');
  configurablePass('C-07', 'unconfirmed close reserves one slot until real close');
}

// C-08: recovering/reattached Agent identity stays reserved while another Agent uses spare capacity.
{
  const proof = deferred();
  const recoveredProcess = new FakeProcess(9301);
  const snapshot = persistedActiveSnapshot('c08-shared', {
    agentId: 'c08-shared-agent',
    pid: 9301
  });
  const h = createHarness({
    maxGlobalActive: 2,
    persistedSnapshot: snapshot,
    reattachProcess: () => proof.promise
  });
  h.recoveredProcesses.push(recoveredProcess);
  const sameAgent = h.runtime.start(request({ agentId: 'c08-shared-agent', taskName: 'C08 same Agent' }));
  h.runtime.start(request({ agentId: 'c08-different', taskName: 'C08 different Agent' }));
  assert.equal(h.processes.length, 1);
  h.processes[0].confirmSpawn();
  assert.equal(session(h, sameAgent)?.state, 'queued');
  proof.resolve({ process: recoveredProcess, provenAt: '2026-07-17T00:00:00.000Z' });
  await settleAsync();
  assert.equal(h.runtime.getSnapshot().tasks.find((task) => task.taskId === 'persisted-task-c08-shared')?.state, 'reattached');
  h.processes[0].close(0);
  assert.equal(h.processes.length, 1, 'reattached Agent identity must still block its queued task');
  h.runtime.start(request({ agentId: 'c08-second-different', taskName: 'C08 second different Agent' }));
  assert.equal(h.processes.length, 2);
  h.processes[1].confirmSpawn();
  h.processes[1].close(0);
  recoveredProcess.close(0);
  assert.equal(h.processes.length, 3);
  h.processes[2].confirmSpawn();
  h.processes[2].close(0);

  const firstGate = deferred();
  const secondGate = deferred();
  const twoRecoveries = createHarness({
    maxGlobalActive: 2,
    persistedSnapshot: combinePersistedSnapshots([
      { label: 'c08-a', agentId: 'c08-recovery-a', pid: 9311 },
      { label: 'c08-b', agentId: 'c08-recovery-b', pid: 9312 }
    ]),
    reattachProcess: (sessionValue) => sessionValue.taskId.endsWith('c08-a') ? firstGate.promise : secondGate.promise
  });
  const waiting = twoRecoveries.runtime.start(request({ agentId: 'c08-ready', taskName: 'C08 waiting behind two recovery slots' }));
  assert.equal(twoRecoveries.processes.length, 0);
  fireTimer(liveTimers(twoRecoveries, 500)[0]);
  assert.equal(twoRecoveries.processes.length, 1);
  twoRecoveries.processes[0].confirmSpawn();
  assert.equal(session(twoRecoveries, waiting)?.state, 'running');
  fireTimer(liveTimers(twoRecoveries, 500)[0]);
  firstGate.resolve(null);
  secondGate.resolve(null);
  await settleAsync();
  twoRecoveries.processes[0].close(0);
  configurablePass('C-08', 'recovering/reattached identity blocks same Agent while spare capacity admits others');
}

// C-09: three restored taskIds remain observed and release one reservation at a time under limit 2.
{
  const gates = new Map(['a', 'b', 'c'].map((label) => [label, deferred()]));
  const recoveredA = new FakeProcess(9401);
  const h = createHarness({
    maxGlobalActive: 2,
    persistedSnapshot: combinePersistedSnapshots([
      { label: 'c09-a', agentId: 'c09-agent-a', pid: 9401 },
      { label: 'c09-b', agentId: 'c09-agent-b', pid: 9402 },
      { label: 'c09-c', agentId: 'c09-agent-c', pid: 9403 }
    ]),
    reattachProcess: (sessionValue) => gates.get(sessionValue.taskId.at(-1)).promise
  });
  h.recoveredProcesses.push(recoveredA);
  const queuedA = h.runtime.start(request({ agentId: 'c09-new-a', taskName: 'C09 queued A' }));
  const queuedB = h.runtime.start(request({ agentId: 'c09-new-b', taskName: 'C09 queued B' }));
  const recordTimeline = (step) => {
    const snapshotValue = h.runtime.getSnapshot();
    const restored = snapshotValue.tasks
      .filter((task) => task.taskId.startsWith('persisted-task-c09'))
      .map((task) => `${task.taskId}:${task.state}`)
      .sort();
    const reserved = snapshotValue.tasks.filter((task) => RESERVED_STATES.has(task.state)).length;
    configurableCounters.overCapTimeline.push({ step, reserved, spawn: h.processes.length, restored });
  };
  recordTimeline('initial');
  assert.equal(h.processes.length, 0);
  assert.equal(configurableCounters.overCapTimeline.at(-1).reserved, 3);

  gates.get('a').resolve({ process: recoveredA, provenAt: '2026-07-17T00:00:00.000Z' });
  await settleAsync();
  recordTimeline('a-reattached');
  assert.equal(configurableCounters.overCapTimeline.at(-1).reserved, 3);

  gates.get('b').resolve(null);
  await settleAsync();
  recordTimeline('b-proof-failed-held');
  assert.equal(configurableCounters.overCapTimeline.at(-1).reserved, 3);
  fireTimer(liveTimers(h, 500)[0]);
  recordTimeline('b-timeout-release');
  assert.equal(configurableCounters.overCapTimeline.at(-1).reserved, 2);
  assert.equal(h.processes.length, 0);

  fireTimer(liveTimers(h, 500)[0]);
  recordTimeline('c-timeout-refill');
  assert.equal(h.processes.length, 1);
  h.processes[0].confirmSpawn();
  gates.get('c').resolve(null);
  await settleAsync();
  recoveredA.close(0);
  recordTimeline('a-confirmed-close-refill');
  assert.equal(h.processes.length, 2);
  h.processes[1].confirmSpawn();
  h.processes[0].close(0);
  h.processes[1].close(0);
  assert.equal(session(h, queuedA)?.state, 'success');
  assert.equal(session(h, queuedB)?.state, 'success');
  const restoredFinal = h.runtime.getSnapshot().tasks.filter((task) => task.taskId.startsWith('persisted-task-c09'));
  assert.equal(restoredFinal.length, 3);
  assert(restoredFinal.every((task) => terminalCount(task) === 1));
  configurablePass('C-09', 'over-cap restored taskIds release through proof/timeout/confirmed-close timeline');
}

// C-10: retry admission respects spare capacity and same-Agent ownership.
{
  const h = createHarness({
    maxGlobalActive: 2,
    classifyFailure: (failure) => ({ ...failure, retryable: failure.kind === 'process-error' })
  });
  const retry = h.runtime.start(request({
    agentId: 'c10-shared',
    taskName: 'C10 retry',
    retry: { maxRetries: 1, backoffMs: 100, budgetMs: 1_000 }
  }));
  h.processes[0].confirmSpawn();
  const sameAgent = h.runtime.start(request({ agentId: 'c10-shared', taskName: 'C10 same Agent work' }));
  h.runtime.start(request({ agentId: 'c10-independent', taskName: 'C10 independent' }));
  h.processes[1].confirmSpawn();
  h.processes[0].emit('error', new Error('C10 retryable fixture'));
  h.processes[0].close(1);
  assert.equal(h.processes.length, 3);
  h.processes[2].confirmSpawn();
  fireTimer(liveTimers(h, 100)[0]);
  assert.equal(session(h, retry)?.state, 'queued');
  h.processes[1].close(0);
  assert.equal(h.processes.length, 3, 'global spare must not overlap retry with same-Agent active work');
  h.processes[2].close(0);
  assert.equal(h.processes.length, 4);
  h.processes[3].confirmSpawn();
  h.processes[3].close(0);
  assert.equal(session(h, sameAgent)?.state, 'success');
  assert.equal(session(h, retry)?.attempt, 2);
  configurablePass('C-10', 'retry uses spare capacity fairly without same-Agent overlap');
}

// C-11: invalid constructor values fail before every injected dependency side effect.
{
  const invalidValues = [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 5];
  for (const value of invalidValues) {
    const sideEffects = Object.fromEntries(Object.keys(configurableCounters.invalidSideEffects).map((key) => [key, 0]));
    assert.throws(() => new ConnectorRuntime({
      maxGlobalActive: value,
      loadPolicy: () => { sideEffects.load += 1; return readyPolicy(); },
      resolveExecutable: () => { sideEffects.discovery += 1; return 'C:\\fixture\\codex.exe'; },
      spawnProcess: () => { sideEffects.process += 1; return new FakeProcess(9500); },
      workspaceRoot: 'E:\\fixture-workspace',
      sourceEnv: { PATH: 'fixture-path' },
      publish: () => { sideEffects.publish += 1; },
      authorizeRun: () => { sideEffects.authorization += 1; return { authorized: true }; },
      loadPersistedSnapshot: () => { sideEffects.load += 1; return null; },
      persistSnapshot: () => { sideEffects.persist += 1; },
      now: () => { sideEffects.clock += 1; return new Date('2026-07-17T00:00:00.000Z'); },
      createId: () => { sideEffects.id += 1; return 'invalid'; },
      setTimer: () => { sideEffects.timer += 1; return {}; },
      clearTimer: () => {}
    }), RangeError);
    assert(Object.values(sideEffects).every((count) => count === 0), `invalid ${String(value)} must have zero side effects`);
    configurableCounters.invalidCases += 1;
    Object.keys(sideEffects).forEach((key) => {
      configurableCounters.invalidSideEffects[key] += sideEffects[key];
    });
  }
  configurablePass('C-11', 'six invalid classes reject before all injected side effects');
}

// C-12: duplicate/same-tick close and synchronous callbacks cannot oversubscribe limit 2.
{
  let spawnInjected = false;
  let publishInjected = false;
  const h = createHarness({
    maxGlobalActive: 2,
    onSpawn: (current) => {
      if (!spawnInjected) {
        spawnInjected = true;
        current.runtime.start(request({ agentId: 'c12-spawn-callback', taskName: 'C12 spawn callback' }));
      }
    },
    onPublish: (current, snapshotValue) => {
      if (!publishInjected && snapshotValue.tasks.some((task) => task.taskName === 'C12 primary' && task.state === 'starting')) {
        publishInjected = true;
        current.runtime.start(request({ agentId: 'c12-publish-callback', taskName: 'C12 publish callback' }));
      }
    }
  });
  h.runtime.start(request({ agentId: 'c12-primary', taskName: 'C12 primary' }));
  h.runtime.start(request({ agentId: 'c12-explicit', taskName: 'C12 explicit queued' }));
  assert.equal(h.processes.length, 2);
  h.processes[0].confirmSpawn();
  h.processes[1].confirmSpawn();
  h.processes[0].close(0);
  h.processes[0].close(0);
  h.processes[1].close(0);
  h.processes[1].close(0);
  assert.equal(h.processes.length, 4);
  h.processes[2].confirmSpawn();
  h.processes[3].confirmSpawn();
  h.processes[2].close(0);
  h.processes[2].close(0);
  h.processes[3].close(0);
  h.processes[3].close(0);
  assert(h.maxGlobalActive <= 2 && h.maxGlobalReserved <= 2);
  assert(h.runtime.getSnapshot().tasks.every((task) => terminalCount(task) === 1));

  const disposing = createHarness({ maxGlobalActive: 2 });
  disposing.runtime.start(request({ agentId: 'c12-dispose-a', taskName: 'C12 dispose A' }));
  disposing.runtime.start(request({ agentId: 'c12-dispose-b', taskName: 'C12 dispose B' }));
  disposing.runtime.start(request({ agentId: 'c12-dispose-c', taskName: 'C12 dispose queued' }));
  disposing.processes.forEach((process) => process.confirmSpawn());
  disposing.runtime.dispose();
  disposing.runtime.dispose();
  assert.equal(disposing.processes.length, 2);
  disposing.processes.forEach((process) => process.close(null, 'SIGTERM'));
  assert.equal(await disposing.runtime.disposeAndWait(50), true);
  assert.equal(liveTimers(disposing).length, 0);
  assert(disposing.runtime.getSnapshot().tasks.every((task) => terminalCount(task) === 1));
  configurablePass('C-12', 'reentrant callbacks, duplicate closes and repeated dispose remain bounded');
}

// S-16: every spawn is an in-memory fixture invocation, never an external Agent CLI.
{
  const spawnCalls = harnesses.flatMap((harness) => harness.spawnCalls);
  assert(spawnCalls.length > 0);
  assert(spawnCalls.every((call) => call.file === 'C:\\fixture\\codex.exe'));
  assert(spawnCalls.every((call) => call.options.shell === false));
  assert.equal(metrics.externalAgentSpawn, 0);
  pass('S-16', 'fake process only; external Agent CLI spawn=0');
}

const finalTasks = harnesses.flatMap((harness) => harness.runtime.getSnapshot().tasks);
const duplicateTerminalCount = finalTasks.reduce((total, task) => total + Math.max(0, terminalCount(task) - 1), 0);
const residualProcesses = harnesses
  .flatMap((harness) => [...harness.processes, ...harness.recoveredProcesses])
  .filter((process) => !process.closed).length;
const residualTimers = harnesses.reduce((total, harness) => total + liveTimers(harness).length, 0);
const fakeSpawnCount = harnesses.reduce((total, harness) => total + harness.spawnCalls.length, 0);

assert.equal(fixtureResults.length, 16, 'S-01 through S-16 must all report');
assert.equal(reviewResults.length, 3, 'R-01 through R-03 must all report');
assert.equal(configurableResults.length, 12, 'C-01 through C-12 must all report');
assert.equal(
  metrics.maxGlobalActive,
  4,
  `maximum configured global active process count must be 4; witness=${JSON.stringify(metrics.maxGlobalWitness)}`
);
assert.equal(
  metrics.maxSameAgentActive,
  1,
  `maximum same-Agent active process count must be 1; witness=${JSON.stringify(metrics.maxSameAgentWitness)}`
);
assert.equal(metrics.maxSameAgentReserved, 1, 'maximum same-Agent reserved process count must remain 1');
for (const limit of [1, 2, 3, 4]) {
  const counter = configurableCounters.legalLimits.get(limit);
  assert.deepEqual(counter, { maxActive: limit, maxReserved: limit, maxSameAgent: 1 });
}
assert.equal(configurableCounters.invalidCases, 6);
assert(Object.values(configurableCounters.invalidSideEffects).every((count) => count === 0));
assert.equal(duplicateTerminalCount, 0, 'duplicate terminal count must remain zero');
assert.equal(residualProcesses, 0, 'fixture process residue must remain zero');
assert.equal(residualTimers, 0, 'fixture timer residue must remain zero');

fixtureResults.forEach(({ id, detail }) => console.log(`${id} PASS ${detail}`));
reviewResults.forEach(({ id, detail }) => console.log(`${id} PASS ${detail}`));
configurableResults.forEach(({ id, detail }) => console.log(`${id} PASS ${detail}`));
console.log(`scheduler counters maxGlobalActive=${metrics.maxGlobalActive} maxSameAgentActive=${metrics.maxSameAgentActive}`);
console.log(`scheduler counters maxGlobalReserved=${metrics.maxGlobalReserved} maxSameAgentReserved=${metrics.maxSameAgentReserved}`);
console.log(`configurable limit counters ${JSON.stringify(Object.fromEntries(configurableCounters.legalLimits))}`);
console.log(`invalid constructor counters cases=${configurableCounters.invalidCases} sideEffects=${JSON.stringify(configurableCounters.invalidSideEffects)}`);
console.log(`over-cap timeline ${JSON.stringify(configurableCounters.overCapTimeline)}`);
console.log(`scheduler counters fakeSpawn=${fakeSpawnCount} controlledLocalSpawn=0 externalAgentSpawn=${metrics.externalAgentSpawn}`);
console.log(`scheduler counters duplicateTerminal=${duplicateTerminalCount} residualProcess=${residualProcesses} residualTimer=${residualTimers}`);
console.log(`review counters policyDriftSpawn=${reviewCounters.policyDriftSpawn} unconfirmedNextSpawn=${reviewCounters.unconfirmedNextSpawn}`);
console.log(`review counters recoverySpawnBeforeProof=${reviewCounters.recoverySpawnBeforeProof} recoveryReleaseSpawn=${reviewCounters.recoveryReleaseSpawn}`);
console.log('connector scheduler check passed.');
