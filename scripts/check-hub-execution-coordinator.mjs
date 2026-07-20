import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { build } from 'esbuild';

const sourcePath = 'src/lib/hubExecutionCoordinator.ts';
const source = fs.readFileSync(sourcePath, 'utf8');
for (const forbidden of [
  'node:child_process',
  'node:fs',
  'node:net',
  'node:http',
  'node:https',
  'node:dgram',
  'node:cluster',
  'node:worker_threads'
]) {
  assert(!source.includes(forbidden), `coordinator must not import ${forbidden}`);
}
assert(!/\b(?:spawn|exec|fork)(?:Sync)?\s*\(/.test(source), 'coordinator must not execute processes');
assert(!/\b(?:fetch|WebSocket)\s*\(/.test(source), 'coordinator must not expose network execution');

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

const T0 = '2026-07-20T06:00:00.000Z';
const NOW = Date.parse(T0);
const digest = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const evidence = (value) => digest(`evidence:${value}`);
const clone = (value) => structuredClone(value);
const issueCodes = (result) => result.issues.map((issue) => issue.code);
const ERROR_VOCABULARY = [
  'authentication', 'quota', 'invalid-request', 'permission-denied', 'timeout',
  'cancelled', 'process-error', 'protocol-error', 'output-overflow', 'unknown'
];
const SESSION_FIELDS = ['taskId', 'sessionId', 'agentId', 'connectorId', 'runId'];

function context(identity) {
  return {
    nowMs: NOW,
    expectedAdapterId: identity.adapterId,
    expectedAgentId: identity.agentId,
    expectedConnectorId: identity.connectorId,
    expectedPeerId: 'hub-main',
    expectedRunId: identity.evidenceRunId,
    runtimeVersion: '0.1.0',
    platform: 'win32',
    architecture: 'x64'
  };
}

function capability(identity, options = {}) {
  const sourceKind = options.sourceKind ?? 'real-adapter-run';
  const production = sourceKind === 'real-adapter-run';
  const taskId = `capability-${identity.agentId}`;
  const sessionId = `capability-session-${identity.agentId}`;
  const baseTime = options.baseTime ?? '2026-07-20T05:00';
  const event = (sequence, kind, seconds, payload) => ({
    eventId: `${identity.evidenceRunId}-event-${sequence}`,
    sequence,
    timestamp: `${baseTime}:${String(seconds).padStart(2, '0')}.000Z`,
    kind,
    taskId,
    sessionId,
    agentId: identity.agentId,
    connectorId: identity.connectorId,
    runId: identity.evidenceRunId,
    ...(payload === undefined ? {} : { payload })
  });
  const document = {
    schema: 'niuma.adapter-capability',
    schemaVersion: '0.1.0',
    adapter: {
      id: identity.adapterId,
      version: options.version ?? '1.2.3',
      agentId: identity.agentId,
      connectorId: identity.connectorId,
      mode: production ? 'production' : 'preview'
    },
    compatibility: {
      runtimeSchema: 'niuma.connector-runtime/v1',
      runtimeVersion: '0.1.0',
      platform: 'win32',
      architecture: 'x64',
      transport: 'local-process',
      headless: true,
      structuredEvents: true
    },
    permissions: {
      declared: true,
      processLaunch: 'accepted-connector-only',
      shell: false,
      workingDirectory: 'request-bounded',
      environment: 'connector-allowlist-only',
      filesystem: 'workspace-bounded',
      network: 'connector-declared',
      credentials: 'reference-only'
    },
    errors: { vocabulary: [...ERROR_VOCABULARY], unmappedError: 'unknown', structured: true },
    sessions: {
      identityFields: [...SESSION_FIELDS],
      singleStarted: true,
      singleTerminal: true,
      monotonicSequence: true,
      terminalReceipt: true
    },
    cancellation: {
      supported: true,
      requestEvent: 'cancel-requested',
      terminalOutcome: 'stopped',
      exitConfirmationRequired: true,
      duplicateRequest: 'idempotent'
    },
    evidence: {
      evaluatorVersion: '0.1.0',
      sourceKind,
      environment: production ? 'production' : sourceKind === 'controlled-run' ? 'test' : 'fixture',
      observedAt: `${baseTime}:05.000Z`,
      peerId: 'hub-main',
      runId: identity.evidenceRunId,
      taskId,
      sessionId,
      digestAlgorithm: 'sha256',
      digestSha256: '',
      events: [
        event(1, 'started', 0),
        event(2, 'output', 1, { stream: 'stdout', bytes: 12, redacted: true }),
        event(3, 'cancel-requested', 2, { reason: 'user-cancel', requestCount: 2, effectiveRequestCount: 1 }),
        event(4, 'termination-confirmed', 3, { exitConfirmed: true, killAttempts: 1 }),
        {
          ...event(5, 'terminal', 4),
          receipt: {
            outcome: 'stopped',
            exitConfirmed: true,
            exitCode: 0,
            errorCode: 'cancelled',
            cancelled: true
          }
        }
      ]
    }
  };
  document.evidence.digestSha256 = adapterDigest(document);
  return document;
}

function adapterDigest(value) {
  return digest(stableStringify(value, '$', new Set()));
}

function stableStringify(value, path, seen) {
  if (path === '$.evidence.digestSha256') return JSON.stringify('');
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (seen.has(value)) throw new Error('cycle');
  seen.add(value);
  const result = Array.isArray(value)
    ? `[${value.map((item, index) => stableStringify(item, `${path}[${index}]`, seen)).join(',')}]`
    : `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key], `${path}.${key}`, seen)}`).join(',')}}`;
  seen.delete(value);
  return result;
}

const codex = {
  agentId: 'codex',
  adapterId: 'codex-headless',
  connectorId: 'codex-local',
  evidenceRunId: 'capability-run-codex-001'
};
const trae = {
  agentId: 'trae',
  adapterId: 'trae-headless',
  connectorId: 'trae-local',
  evidenceRunId: 'capability-run-trae-001'
};

function workflow(workflowId = 'workflow-integrated-001') {
  return {
    schema: 'niuma.dependency-workflow',
    schemaVersion: '0.1.0',
    workflowId,
    tasks: [{
      taskId: 'task-a',
      agentId: codex.agentId,
      adapterId: codex.adapterId,
      sessionId: 'workflow-session-a',
      runId: 'workflow-run-a',
      dependsOn: []
    }, {
      taskId: 'task-b',
      agentId: trae.agentId,
      adapterId: trae.adapterId,
      sessionId: 'workflow-session-b',
      runId: 'workflow-run-b',
      dependsOn: ['task-a']
    }]
  };
}

function receipt(dispatch, outcome = 'succeeded', overrides = {}) {
  return {
    receiptId: `receipt-${dispatch.taskId}-${outcome}`,
    workflowId: dispatch.workflowId,
    taskId: dispatch.taskId,
    agentId: dispatch.agentId,
    adapterId: dispatch.adapterId,
    sessionId: dispatch.sessionId,
    runId: dispatch.runId,
    outcome,
    ...(outcome === 'failed' ? { failureCode: 'execution-failed' } : {}),
    ...(outcome === 'cancelled' ? { failureCode: 'cancelled' } : {}),
    artifactDigests: outcome === 'succeeded' ? [evidence(dispatch.taskId)] : [],
    ...overrides
  };
}

// Integrated positive: only verified production evidence enters the registry and drives A -> B.
const coordinator = new core.HubExecutionCoordinator();
const codexAdmission = coordinator.registerAdapterCapability(capability(codex), context(codex));
const traeAdmission = coordinator.registerAdapterCapability(capability(trae), context(trae));
assert.equal(codexAdmission.status, 'admitted');
assert.equal(codexAdmission.applied, true);
assert.equal(traeAdmission.status, 'admitted');
assert.equal(coordinator.listAdmittedAdapterPairs().length, 2);
assert.equal(coordinator.registerAdapterCapability(capability(codex), context(codex)).applied, false);

const fixtureIdentity = { ...codex, connectorId: 'codex-fixture', evidenceRunId: 'capability-run-fixture-001' };
const fixtureAdmission = coordinator.registerAdapterCapability(
  capability(fixtureIdentity, { sourceKind: 'fixture' }),
  context(fixtureIdentity)
);
assert.equal(fixtureAdmission.status, 'rejected');
assert(issueCodes(fixtureAdmission).includes('non-production-evidence'));
const staleIdentity = { ...codex, connectorId: 'codex-stale', evidenceRunId: 'capability-run-stale-001' };
const staleAdmission = coordinator.registerAdapterCapability(
  capability(staleIdentity, { baseTime: '2026-07-18T05:00' }),
  context(staleIdentity)
);
assert.equal(staleAdmission.status, 'rejected');
assert(issueCodes(staleAdmission).includes('stale-evidence'));
assert.equal(coordinator.listAdmittedAdapterPairs().length, 2);

const expiredRegistry = new core.HubExecutionCoordinator();
expiredRegistry.registerAdapterCapability(capability(codex), context(codex));
expiredRegistry.registerAdapterCapability(capability(trae), context(trae));
const expiredWorkflow = expiredRegistry.admitWorkflow(
  workflow('workflow-expired'), '2026-07-21T05:00:06.000Z'
);
assert.equal(expiredWorkflow.status, 'rejected');
assert(issueCodes(expiredWorkflow).includes('workflow-pair-unknown'));
assert.equal(expiredRegistry.listAdmittedAdapterPairs().length, 0);

const admitted = coordinator.admitWorkflow(workflow(), T0);
assert.equal(admitted.status, 'admitted');
assert.equal(admitted.executionEligible, true);
assert.equal(admitted.workflow.audit[0].workflowId, 'workflow-integrated-001');
assert.equal(admitted.workflow.tasks[0].sessionId, 'workflow-session-a');
assert.equal(admitted.workflow.tasks[0].runId, 'workflow-run-a');

let mutation = coordinator.dispatchNextWorkflowTask('workflow-integrated-001', '2026-07-20T06:00:01.000Z');
assert.equal(mutation.applied, true);
assert.equal(mutation.dispatch.connectorId, codex.connectorId);
assert.equal(mutation.dispatch.capabilityEvidenceDigest, codexAdmission.pair.evidenceDigest);
const dispatchA = mutation.dispatch;
mutation = coordinator.applyWorkflowTerminalReceipt(
  'workflow-integrated-001', receipt(dispatchA), '2026-07-20T06:00:02.000Z'
);
assert.equal(mutation.applied, true);
mutation = coordinator.dispatchNextWorkflowTask('workflow-integrated-001', '2026-07-20T06:00:03.000Z');
assert.equal(mutation.dispatch.taskId, 'task-b');
assert.equal(mutation.dispatch.connectorId, trae.connectorId);
const dispatchB = mutation.dispatch;
const terminalB = receipt(dispatchB);
mutation = coordinator.applyWorkflowTerminalReceipt(
  'workflow-integrated-001', terminalB, '2026-07-20T06:00:04.000Z'
);
assert.equal(mutation.workflow.status, 'succeeded');
assert.equal(mutation.workflow.audit.filter((event) => event.kind === 'workflow-terminal').length, 1);
const terminalAuditLength = mutation.workflow.audit.length;
const terminalReplay = coordinator.applyWorkflowTerminalReceipt(
  'workflow-integrated-001', terminalB, '2026-07-20T06:00:05.000Z'
);
assert.equal(terminalReplay.applied, false);
assert.deepEqual(terminalReplay.issues, []);
assert.equal(terminalReplay.workflow.audit.length, terminalAuditLength);
const terminalConflict = coordinator.applyWorkflowTerminalReceipt(
  'workflow-integrated-001',
  receipt(dispatchB, 'failed', { receiptId: 'receipt-conflict', artifactDigests: [] }),
  '2026-07-20T06:00:05.000Z'
);
assert.equal(terminalConflict.applied, false);
assert(issueCodes(terminalConflict).includes('terminal-transition-conflict'));
assert.equal(terminalConflict.workflow.audit.length, terminalAuditLength);

// Admission, revocation and evidence-drift gates remain closed before dispatch mutation.
const unknownPair = new core.HubExecutionCoordinator();
assert.equal(unknownPair.admitWorkflow(workflow('workflow-unknown'), T0).status, 'rejected');
assert(issueCodes(unknownPair.admitWorkflow(workflow('workflow-unknown-2'), T0)).includes('workflow-pair-unknown'));
assert(issueCodes(unknownPair.dispatchNextWorkflowTask('missing', T0)).includes('workflow-unknown'));

const drift = new core.HubExecutionCoordinator();
const originalCodex = drift.registerAdapterCapability(capability(codex), context(codex));
drift.registerAdapterCapability(capability(trae), context(trae));
assert.equal(drift.admitWorkflow(workflow('workflow-drift'), T0).status, 'admitted');
const changedCodex = { ...codex, evidenceRunId: 'capability-run-codex-002' };
const replacement = drift.registerAdapterCapability(
  capability(changedCodex, { version: '1.2.4' }), context(changedCodex)
);
assert.equal(replacement.applied, true);
const driftBlocked = drift.dispatchNextWorkflowTask('workflow-drift', T0);
assert.equal(driftBlocked.applied, false);
assert(issueCodes(driftBlocked).includes('capability-evidence-drift'));
assert.equal(driftBlocked.workflow.audit.filter((event) => event.kind === 'task-dispatched').length, 0);
assert.equal(drift.revokeAdapterPair(replacement.pair, originalCodex.pair.evidenceDigest).applied, false);
assert(issueCodes(drift.revokeAdapterPair(replacement.pair, originalCodex.pair.evidenceDigest)).includes('capability-evidence-drift'));
assert.equal(drift.revokeAdapterPair(replacement.pair, replacement.pair.evidenceDigest).applied, true);
const revokedBlocked = drift.dispatchNextWorkflowTask('workflow-drift', T0);
assert(issueCodes(revokedBlocked).includes('adapter-pair-revoked'));
assert.equal(revokedBlocked.workflow.audit.filter((event) => event.kind === 'task-dispatched').length, 0);

const ambiguous = new core.HubExecutionCoordinator();
ambiguous.registerAdapterCapability(capability(codex), context(codex));
const alternateCodex = { ...codex, connectorId: 'codex-local-alternate', evidenceRunId: 'capability-run-codex-alt' };
ambiguous.registerAdapterCapability(capability(alternateCodex), context(alternateCodex));
ambiguous.registerAdapterCapability(capability(trae), context(trae));
const ambiguousAdmission = ambiguous.admitWorkflow(workflow('workflow-ambiguous'), T0);
assert.equal(ambiguousAdmission.status, 'rejected');
assert(issueCodes(ambiguousAdmission).includes('workflow-pair-ambiguous'));

// InstallRun creation, progress, recovery and cancellation stay behind exact binding/auth/dependency injection.
function clock(start = 10) {
  let tick = start;
  return () => new Date(Date.UTC(2026, 6, 20, 7, 0, tick++)).toISOString();
}

function installStep(stepId, dependsOn = []) {
  return {
    stepId,
    dependsOn,
    effectDigest: digest(`effect:${stepId}`),
    cancellability: 'cooperative',
    rollback: {
      mode: 'compensate',
      compensation: { stepId: `undo-${stepId}`, effectDigest: digest(`effect:undo-${stepId}`) }
    }
  };
}

function installFixture(runId = 'install-run-integrated-001') {
  const orderedSteps = [installStep('inspect'), installStep('install', ['inspect'])];
  const binding = {
    runId,
    planId: 'integrated-plan',
    planVersion: '0.1.0',
    agentId: 'fixture-agent',
    consentDigest: digest('consent:integrated-plan'),
    effectDigest: digest(stablePlainStringify(orderedSteps)),
    orderedSteps,
    authorizedCompensationStepIds: ['undo-inspect', 'undo-install']
  };
  const authorization = {
    runId: binding.runId,
    planId: binding.planId,
    planVersion: binding.planVersion,
    agentId: binding.agentId,
    consentDigest: binding.consentDigest,
    effectDigest: binding.effectDigest
  };
  const effectCalls = [];
  const compensationCalls = [];
  const dependencies = {
    hash: digest,
    now: clock(),
    executeEffect: async (request) => {
      effectCalls.push(clone(request));
      return { status: 'succeeded', evidenceDigest: evidence(request.stepId) };
    },
    executeCompensation: async (request) => {
      compensationCalls.push(clone(request));
      return { status: 'succeeded', evidenceDigest: evidence(request.compensationStepId) };
    }
  };
  return { binding, authorization, dependencies, effectCalls, compensationCalls };
}

function stablePlainStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stablePlainStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stablePlainStringify(value[key])}`).join(',')}}`;
}

const installCoordinator = new core.HubExecutionCoordinator();
const install = installFixture();
let installMutation = installCoordinator.createInstallRun(
  install.binding, install.authorization, install.dependencies
);
assert.equal(installMutation.applied, true);
assert.equal(installMutation.snapshot.state, 'created');
assert.equal(installCoordinator.createInstallRun(install.binding, install.authorization, install.dependencies).applied, false);
assert(issueCodes(installCoordinator.createInstallRun(install.binding, install.authorization, install.dependencies)).includes('install-run-id-conflict'));

const driftAuthorization = { ...install.authorization, planVersion: '0.2.0' };
assert.equal(installCoordinator.startInstallRun(install.binding.runId, driftAuthorization).applied, false);
assert(issueCodes(installCoordinator.startInstallRun(install.binding.runId, driftAuthorization)).includes('install-authorization-plan-version-drift'));
assert.equal(install.effectCalls.length, 0);
installMutation = installCoordinator.startInstallRun(install.binding.runId, install.authorization);
assert.equal(installMutation.snapshot.state, 'running');
await installCoordinator.advanceInstallRun(install.binding.runId, install.authorization);
installMutation = await installCoordinator.advanceInstallRun(install.binding.runId, install.authorization);
assert.equal(installMutation.snapshot.state, 'succeeded');
assert.equal(installMutation.snapshot.journal.filter((entry) => entry.kind === 'run-terminal').length, 1);
const duplicateTerminal = await installCoordinator.advanceInstallRun(install.binding.runId, install.authorization);
assert.equal(duplicateTerminal.applied, false);
assert(issueCodes(duplicateTerminal).includes('terminal-outcome-exists'));
assert.equal(duplicateTerminal.snapshot.journal.filter((entry) => entry.kind === 'run-terminal').length, 1);
const duplicateCancel = await installCoordinator.cancelInstallRun(install.binding.runId, install.authorization);
assert.equal(duplicateCancel.applied, false);
assert(issueCodes(duplicateCancel).includes('terminal-outcome-exists'));
assert.equal(duplicateCancel.snapshot.journal.filter((entry) => entry.kind === 'run-terminal').length, 1);

const recoverySource = new core.HubExecutionCoordinator();
const recoveryFixture = installFixture('install-run-recovery-001');
recoverySource.createInstallRun(
  recoveryFixture.binding, recoveryFixture.authorization, recoveryFixture.dependencies
);
recoverySource.startInstallRun(recoveryFixture.binding.runId, recoveryFixture.authorization);
await recoverySource.advanceInstallRun(recoveryFixture.binding.runId, recoveryFixture.authorization);
const interrupted = recoverySource.getInstallRun(recoveryFixture.binding.runId);
assert.equal(interrupted.state, 'running');

const rejectedRecovery = new core.HubExecutionCoordinator();
const driftedRecovery = await rejectedRecovery.recoverInstallRun(
  interrupted,
  { ...recoveryFixture.authorization, consentDigest: digest('different-consent') },
  recoveryFixture.dependencies
);
assert.equal(driftedRecovery.applied, false);
assert(issueCodes(driftedRecovery).includes('install-authorization-consent-digest-drift'));
assert.equal(recoveryFixture.compensationCalls.length, 0);

const bindingDriftSnapshot = clone(interrupted);
bindingDriftSnapshot.binding.planVersion = '0.2.0';
const bindingDrift = await rejectedRecovery.recoverInstallRun(
  bindingDriftSnapshot,
  { ...recoveryFixture.authorization, planVersion: '0.2.0' },
  recoveryFixture.dependencies
);
assert.equal(bindingDrift.applied, false);
assert(issueCodes(bindingDrift).includes('binding-digest-mismatch'));
assert.equal(recoveryFixture.compensationCalls.length, 0);

const recoveryTarget = new core.HubExecutionCoordinator();
const recovered = await recoveryTarget.recoverInstallRun(
  interrupted, recoveryFixture.authorization, recoveryFixture.dependencies
);
assert.equal(recovered.applied, true);
assert.equal(recovered.snapshot.state, 'recovered');
assert.deepEqual(recoveryFixture.compensationCalls.map((request) => request.compensationStepId), ['undo-inspect']);
assert.equal(recovered.snapshot.journal.filter((entry) => entry.kind === 'run-terminal').length, 1);
assert(issueCodes(await recoveryTarget.advanceInstallRun(recoveryFixture.binding.runId, recoveryFixture.authorization)).includes('terminal-outcome-exists'));

assert.equal(install.effectCalls.length, 2);
assert.equal(install.compensationCalls.length, 0);

console.log('Hub execution coordinator integration check passed.');
console.log('verified registry, workflow identity/audit, revocation/drift, InstallRun authorization/recovery and terminal conflicts: covered.');
console.log('external Agent/Connector/process/filesystem/registry/service/network/credential/elevation effects: 0.');
console.log('integrated fixtures are implemented/tested only and are not product acceptance.');
