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
const metrics = {
  maxGlobalActive: 0,
  maxSameAgentActive: 0,
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
    advance(ms) {
      nowMs += ms;
    }
  };
  harness.runtime = new ConnectorRuntime({
    loadPolicy: options.loadPolicy ?? (() => options.policy ?? readyPolicy()),
    resolveExecutable: (command) => command === 'codex' ? 'C:\\fixture\\codex.exe' : null,
    spawnProcess: (file, args, spawnOptions) => {
      const process = new FakeProcess(7000 + harness.processes.length);
      harness.processes.push(process);
      harness.spawnCalls.push({ file, args, options: spawnOptions, process });
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
      observeConcurrency(cloned);
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

function observeConcurrency(snapshot) {
  const processSessions = snapshot.tasks.filter((task) => PROCESS_STATES.has(task.state));
  const reservedSessions = snapshot.tasks.filter((task) => RESERVED_STATES.has(task.state));
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

function persistedActiveSnapshot(label) {
  const now = '2026-07-17T00:00:00.000Z';
  const startedAt = '2026-07-16T23:59:59.000Z';
  return {
    version: 1,
    updatedAt: now,
    tasks: [{
      taskId: `persisted-task-${label}`,
      sessionId: `persisted-session-${label}`,
      connectorId: 'codex',
      agentId: `recovered-${label}`,
      taskName: `R03 recovered ${label}`,
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
      pid: 9100,
      processFingerprint: {
        version: 1,
        pid: 9100,
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
const residualProcesses = harnesses.flatMap((harness) => harness.processes).filter((process) => !process.closed).length;
const residualTimers = harnesses.reduce((total, harness) => total + liveTimers(harness).length, 0);
const fakeSpawnCount = harnesses.reduce((total, harness) => total + harness.spawnCalls.length, 0);

assert.equal(fixtureResults.length, 16, 'S-01 through S-16 must all report');
assert.equal(reviewResults.length, 3, 'R-01 through R-03 must all report');
assert.equal(
  metrics.maxGlobalActive,
  1,
  `maximum global active process count must be 1; witness=${JSON.stringify(metrics.maxGlobalWitness)}`
);
assert.equal(
  metrics.maxSameAgentActive,
  1,
  `maximum same-Agent active process count must be 1; witness=${JSON.stringify(metrics.maxSameAgentWitness)}`
);
assert.equal(duplicateTerminalCount, 0, 'duplicate terminal count must remain zero');
assert.equal(residualProcesses, 0, 'fixture process residue must remain zero');
assert.equal(residualTimers, 0, 'fixture timer residue must remain zero');

fixtureResults.forEach(({ id, detail }) => console.log(`${id} PASS ${detail}`));
reviewResults.forEach(({ id, detail }) => console.log(`${id} PASS ${detail}`));
console.log(`scheduler counters maxGlobalActive=${metrics.maxGlobalActive} maxSameAgentActive=${metrics.maxSameAgentActive}`);
console.log(`scheduler counters maxGlobalReserved=${metrics.maxGlobalReserved}`);
console.log(`scheduler counters fakeSpawn=${fakeSpawnCount} controlledLocalSpawn=0 externalAgentSpawn=${metrics.externalAgentSpawn}`);
console.log(`scheduler counters duplicateTerminal=${duplicateTerminalCount} residualProcess=${residualProcesses} residualTimer=${residualTimers}`);
console.log(`review counters policyDriftSpawn=${reviewCounters.policyDriftSpawn} unconfirmedNextSpawn=${reviewCounters.unconfirmedNextSpawn}`);
console.log(`review counters recoverySpawnBeforeProof=${reviewCounters.recoverySpawnBeforeProof} recoveryReleaseSpawn=${reviewCounters.recoveryReleaseSpawn}`);
console.log('connector scheduler check passed.');
