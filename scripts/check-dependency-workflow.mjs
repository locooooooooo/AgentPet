import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';

const sourcePath = 'src/lib/dependencyWorkflow.ts';
const source = fs.readFileSync(sourcePath, 'utf8');
assert(!source.includes('node:child_process'), 'workflow core must not import child_process');
assert(!/\b(?:spawn|exec|fork)(?:Sync)?\s*\(/.test(source), 'workflow core must not execute a process');

const bundled = await build({
  entryPoints: [sourcePath],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false,
  logLevel: 'silent'
});
const core = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

const T0 = '2026-07-20T00:00:00.000Z';
const DIGEST_A = 'a'.repeat(64);
const DIGEST_B = 'b'.repeat(64);
const pairs = [
  { agentId: 'codex', adapterId: 'codex-headless' },
  { agentId: 'trae', adapterId: 'trae-headless' }
];

function definition() {
  return {
    schema: 'niuma.dependency-workflow',
    schemaVersion: '0.1.0',
    workflowId: 'workflow-fixture-1',
    tasks: [{
      taskId: 'task-a',
      agentId: 'codex',
      adapterId: 'codex-headless',
      sessionId: 'session-a',
      runId: 'run-a',
      dependsOn: []
    }, {
      taskId: 'task-b',
      agentId: 'trae',
      adapterId: 'trae-headless',
      sessionId: 'session-b',
      runId: 'run-b',
      dependsOn: ['task-a']
    }]
  };
}

function clone(value) {
  return structuredClone(value);
}

function issueCodes(result) {
  return result.issues.map((issue) => issue.code);
}

function receipt(task, outcome, overrides = {}) {
  return {
    receiptId: `receipt-${task.taskId}-${outcome}`,
    workflowId: 'workflow-fixture-1',
    taskId: task.taskId,
    agentId: task.agentId,
    adapterId: task.adapterId,
    sessionId: task.sessionId,
    runId: task.runId,
    outcome,
    ...(outcome === 'failed' ? { failureCode: 'execution-failed' } : {}),
    ...(outcome === 'cancelled' ? { failureCode: 'cancelled' } : {}),
    artifactDigests: outcome === 'succeeded' ? [DIGEST_A] : [],
    ...overrides
  };
}

function admit(value = definition(), available = pairs) {
  return core.admitDependencyWorkflow(value, available, T0);
}

// Positive: deterministic A -> B execution and complete identity/audit correlation.
const admitted = admit();
assert.equal(admitted.status, 'admitted');
assert.equal(admitted.executionEligible, true);
assert.deepEqual(core.getReadyDependencyTaskIds(admitted.workflow), ['task-a']);
let step = core.dispatchNextDependencyTask(admitted.workflow, '2026-07-20T00:00:01.000Z');
assert.equal(step.applied, true);
assert.deepEqual(step.dispatch, {
  workflowId: 'workflow-fixture-1',
  taskId: 'task-a',
  agentId: 'codex',
  adapterId: 'codex-headless',
  sessionId: 'session-a',
  runId: 'run-a'
});
let workflow = step.workflow;
const taskA = workflow.tasks.find((task) => task.taskId === 'task-a');
step = core.applyDependencyTaskTerminalReceipt(
  workflow,
  receipt(taskA, 'succeeded'),
  '2026-07-20T00:00:02.000Z'
);
assert.equal(step.applied, true);
workflow = step.workflow;
assert.deepEqual(core.getReadyDependencyTaskIds(workflow), ['task-b']);
step = core.dispatchNextDependencyTask(workflow, '2026-07-20T00:00:03.000Z');
assert.equal(step.dispatch.taskId, 'task-b');
workflow = step.workflow;
const taskB = workflow.tasks.find((task) => task.taskId === 'task-b');
step = core.applyDependencyTaskTerminalReceipt(
  workflow,
  receipt(taskB, 'succeeded', { artifactDigests: [DIGEST_B] }),
  '2026-07-20T00:00:04.000Z'
);
workflow = step.workflow;
assert.equal(workflow.status, 'succeeded');
assert.deepEqual(workflow.tasks.map((task) => task.status), ['succeeded', 'succeeded']);
assert.equal(workflow.audit.filter((event) => event.kind === 'workflow-terminal').length, 1);
assert.deepEqual(core.validateDependencyWorkflowAudit(workflow), []);
assert.equal(JSON.stringify(workflow).includes('prompt'), false);
assert.equal(JSON.stringify(workflow).includes('response'), false);
assert.equal(JSON.stringify(workflow).includes('E:\\'), false);

// Terminal receipts are exactly-once: identical replay is a no-op; conflicts fail closed.
const terminalAuditLength = workflow.audit.length;
const replay = core.applyDependencyTaskTerminalReceipt(
  workflow,
  receipt(workflow.tasks[1], 'succeeded', { artifactDigests: [DIGEST_B] }),
  '2026-07-20T00:00:05.000Z'
);
assert.equal(replay.applied, false);
assert.deepEqual(replay.issues, []);
assert.strictEqual(replay.workflow, workflow);
assert.equal(replay.workflow.audit.length, terminalAuditLength);
const terminalConflict = core.applyDependencyTaskTerminalReceipt(
  workflow,
  receipt(workflow.tasks[1], 'failed', { receiptId: 'receipt-conflict', artifactDigests: [] }),
  '2026-07-20T00:00:05.000Z'
);
assert(issueCodes(terminalConflict).includes('terminal-transition-conflict'));
assert.equal(terminalConflict.workflow.audit.length, terminalAuditLength);

// Upstream failure blocks B permanently and never produces a B dispatch event.
let failureWorkflow = core.dispatchNextDependencyTask(admit().workflow, T0).workflow;
const failureA = failureWorkflow.tasks.find((task) => task.taskId === 'task-a');
failureWorkflow = core.applyDependencyTaskTerminalReceipt(
  failureWorkflow,
  receipt(failureA, 'failed'),
  '2026-07-20T00:01:00.000Z'
).workflow;
assert.equal(failureWorkflow.status, 'failed');
assert.equal(failureWorkflow.tasks.find((task) => task.taskId === 'task-b').status, 'dependency-blocked');
assert.equal(failureWorkflow.audit.filter((event) => event.kind === 'task-dispatched' && event.taskId === 'task-b').length, 0);
assert(issueCodes(core.dispatchNextDependencyTask(failureWorkflow, T0)).includes('workflow-not-dispatchable'));

// Timeout is a failure and carries only the controlled vocabulary into audit.
let timeoutWorkflow = core.dispatchNextDependencyTask(admit().workflow, T0).workflow;
const timeoutA = timeoutWorkflow.tasks.find((task) => task.taskId === 'task-a');
timeoutWorkflow = core.applyDependencyTaskTerminalReceipt(
  timeoutWorkflow,
  receipt(timeoutA, 'failed', { failureCode: 'timed-out' }),
  '2026-07-20T00:01:01.000Z'
).workflow;
assert.equal(timeoutWorkflow.status, 'failed');
assert(timeoutWorkflow.audit.some((event) => event.reason === 'timed-out'));

// User cancellation stops new dispatch, propagates to blocked B, and is idempotent.
let cancellation = core.dispatchNextDependencyTask(admit().workflow, T0).workflow;
const cancelledOnce = core.cancelDependencyWorkflow(cancellation, '2026-07-20T00:02:00.000Z');
assert.equal(cancelledOnce.applied, true);
cancellation = cancelledOnce.workflow;
assert.equal(cancellation.status, 'cancelling');
assert.equal(cancellation.tasks.find((task) => task.taskId === 'task-a').status, 'cancelling');
assert.equal(cancellation.tasks.find((task) => task.taskId === 'task-b').status, 'cancelled');
assert.equal(cancellation.audit.filter((event) => event.kind === 'task-dispatched' && event.taskId === 'task-b').length, 0);
assert(issueCodes(core.dispatchNextDependencyTask(cancellation, T0)).includes('workflow-not-dispatchable'));
const cancelReplay = core.cancelDependencyWorkflow(cancellation, T0);
assert.equal(cancelReplay.applied, false);
assert.strictEqual(cancelReplay.workflow, cancellation);
const cancellingA = cancellation.tasks.find((task) => task.taskId === 'task-a');
cancellation = core.applyDependencyTaskTerminalReceipt(
  cancellation,
  receipt(cancellingA, 'cancelled'),
  '2026-07-20T00:02:01.000Z'
).workflow;
assert.equal(cancellation.status, 'cancelled');
assert.equal(cancellation.audit.filter((event) => event.kind === 'workflow-terminal').length, 1);
assert.deepEqual(core.validateDependencyWorkflowAudit(cancellation), []);

// Cancelling before any dispatch terminalizes both tasks without a dispatch intent.
const cancelledBeforeStart = core.cancelDependencyWorkflow(admit().workflow, T0).workflow;
assert.equal(cancelledBeforeStart.status, 'cancelled');
assert(cancelledBeforeStart.tasks.every((task) => task.status === 'cancelled'));
assert.equal(cancelledBeforeStart.audit.filter((event) => event.kind === 'task-dispatched').length, 0);

// Admission negative matrix. Every row rejects before a dispatch intent can exist.
const negatives = [];
function reject(name, mutate, code, available = pairs) {
  const candidate = definition();
  mutate(candidate);
  const result = admit(candidate, available);
  assert.equal(result.status, 'rejected', `${name} must reject`);
  assert.equal(result.executionEligible, false, `${name} must not be execution eligible`);
  assert.equal(result.workflow, null, `${name} must not create dispatchable state`);
  assert(issueCodes(result).includes(code), `${name} missing ${code}: ${issueCodes(result).join(', ')}`);
  negatives.push(name);
}

reject('schema', (value) => { value.schemaVersion = '0.2.0'; }, 'schema-version-unsupported');
reject('unknown root field', (value) => { value.prompt = 'secret'; }, 'unknown-field');
reject('unknown task field', (value) => { value.tasks[0].response = 'secret'; }, 'unknown-field');
reject('wrong task count', (value) => { value.tasks.pop(); }, 'workflow-task-count-invalid');
reject('duplicate task', (value) => { value.tasks[1].taskId = 'task-a'; }, 'duplicate-task');
reject('duplicate session', (value) => { value.tasks[1].sessionId = 'session-a'; }, 'duplicate-session');
reject('duplicate run', (value) => { value.tasks[1].runId = 'run-a'; }, 'duplicate-run');
reject('same Agent', (value) => { value.tasks[1].agentId = 'codex'; }, 'two-distinct-agents-required');
reject('same Adapter', (value) => { value.tasks[1].adapterId = 'codex-headless'; }, 'two-distinct-adapters-required');
reject('self dependency', (value) => { value.tasks[1].dependsOn = ['task-b']; }, 'dependency-self');
reject('duplicate dependency', (value) => { value.tasks[1].dependsOn = ['task-a', 'task-a']; }, 'dependency-duplicate');
reject('unknown dependency', (value) => { value.tasks[1].dependsOn = ['task-unknown']; }, 'dependency-unknown');
reject('cycle', (value) => { value.tasks[0].dependsOn = ['task-b']; }, 'dependency-cycle');
reject('no dependency', (value) => { value.tasks[1].dependsOn = []; }, 'dependency-required');
reject('unavailable pair', () => {}, 'agent-adapter-unavailable', [pairs[0]]);
reject('mismatched pair', () => {}, 'agent-adapter-unavailable', [pairs[0], { agentId: 'trae', adapterId: 'other' }]);

// A bounded DAG may have multiple roots, but it still uses exactly two Agent/Adapter identities.
const multiRoot = definition();
multiRoot.tasks = [{
  taskId: 'task-c',
  agentId: 'codex',
  adapterId: 'codex-headless',
  sessionId: 'session-c',
  runId: 'run-c',
  dependsOn: ['task-b']
}, {
  ...multiRoot.tasks[1],
  dependsOn: []
}, multiRoot.tasks[0]];
const multiRootAdmission = admit(multiRoot);
assert.deepEqual(core.getReadyDependencyTaskIds(multiRootAdmission.workflow), ['task-a', 'task-b']);
const firstRoot = core.dispatchNextDependencyTask(multiRootAdmission.workflow, T0);
assert.equal(firstRoot.dispatch.taskId, 'task-a', 'ready tasks must sort by taskId, not input order');
const secondRoot = core.dispatchNextDependencyTask(firstRoot.workflow, T0);
assert.equal(secondRoot.dispatch.taskId, 'task-b');

// Failure propagation reaches all downstream levels without dispatching them.
const failureChain = definition();
failureChain.tasks.push({
  taskId: 'task-c',
  agentId: 'codex',
  adapterId: 'codex-headless',
  sessionId: 'session-c',
  runId: 'run-c',
  dependsOn: ['task-b']
});
let chained = core.dispatchNextDependencyTask(admit(failureChain).workflow, T0).workflow;
chained = core.applyDependencyTaskTerminalReceipt(
  chained,
  receipt(chained.tasks.find((task) => task.taskId === 'task-a'), 'failed'),
  T0
).workflow;
assert.equal(chained.tasks.find((task) => task.taskId === 'task-b').status, 'dependency-blocked');
assert.equal(chained.tasks.find((task) => task.taskId === 'task-c').status, 'dependency-blocked');
assert.equal(chained.audit.filter((event) => event.kind === 'task-dispatched').length, 1);

const duplicatedAvailability = admit(definition(), [...pairs, clone(pairs[0])]);
assert.equal(duplicatedAvailability.status, 'rejected');
assert(issueCodes(duplicatedAvailability).includes('available-pair-duplicate'));
const availabilityUnknown = admit(definition(), [...pairs, { ...pairs[0], accepted: true }]);
assert.equal(availabilityUnknown.status, 'rejected');
assert(issueCodes(availabilityUnknown).includes('unknown-field'));

// Receipt negative matrix: bad identity, payload expansion and invalid digest never mutate state.
const running = core.dispatchNextDependencyTask(admit().workflow, T0).workflow;
const runningA = running.tasks.find((task) => task.taskId === 'task-a');
for (const [name, changes, code] of [
  ['workflow identity', { workflowId: 'workflow-other' }, 'receipt-workflow-mismatch'],
  ['Agent identity', { agentId: 'trae' }, 'receipt-agent-mismatch'],
  ['Adapter identity', { adapterId: 'trae-headless' }, 'receipt-adapter-mismatch'],
  ['Session identity', { sessionId: 'session-other' }, 'receipt-session-mismatch'],
  ['run identity', { runId: 'run-other' }, 'receipt-run-mismatch'],
  ['bad digest', { artifactDigests: ['not-a-digest'] }, 'artifact-digest-invalid'],
  ['unknown payload', { output: 'sensitive response' }, 'unknown-field']
]) {
  const result = core.applyDependencyTaskTerminalReceipt(running, receipt(runningA, 'succeeded', changes), T0);
  assert.equal(result.applied, false, `${name} must not apply`);
  assert.strictEqual(result.workflow, running, `${name} must preserve state identity`);
  assert(issueCodes(result).includes(code), `${name} missing ${code}`);
}

const auditTamper = clone(workflow);
auditTamper.audit[1].sessionId = 'session-tampered';
assert(issueCodes({ issues: core.validateDependencyWorkflowAudit(auditTamper) }).includes('audit-identity-mismatch'));
const auditGap = clone(workflow);
auditGap.audit[1].sequence = 99;
assert(issueCodes({ issues: core.validateDependencyWorkflowAudit(auditGap) }).includes('audit-sequence-invalid'));

console.log('dependency workflow core check passed.');
console.log(`positive paths: success, failure, timeout, cancellation, idempotent terminal replay`);
console.log(`negative admission rows: ${negatives.length}`);
console.log('external Agent/Connector spawn: 0; fixture-only execution is not acceptance.');
