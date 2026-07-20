import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const bundled = await build({
  entryPoints: ['src/lib/installPlanExecutor.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false,
  logLevel: 'silent'
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`;
const executor = await import(moduleUrl);

const planModule = await import(`data:text/javascript;base64,${Buffer.from((await build({
  entryPoints: ['src/lib/agentInstallPlan.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false,
  logLevel: 'silent'
})).outputFiles[0].text).toString('base64')}`);
const { KIMI_EXISTING_INSTALL_PLAN, buildInstallConsentPreview, reviewAgentInstallPlan } = planModule;

const digest = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const evidence = (label) => digest(`evidence:${label}`);
const clone = (value) => structuredClone(value);
const terminalEntries = (snapshot) => snapshot.journal.filter((entry) => entry.kind === 'run-terminal');

function clock(startTick = 0) {
  let tick = startTick;
  return () => new Date(Date.UTC(2026, 6, 20, 0, 0, tick++)).toISOString();
}

function trustedPlan() {
  const plan = clone(KIMI_EXISTING_INSTALL_PLAN);
  plan.lifecycle = 'accepted';
  plan.sourceArtifacts = [{
    artifactId: 'kimi-identity-lock',
    sourceRef: 'kimi.official.identity',
    uri: 'https://download.example.invalid/kimi-identity.json',
    publisherId: 'kimi',
    version: '1.0.0',
    sizeBytes: 1024,
    sha256: 'b'.repeat(64),
    signature: { publisherId: 'kimi', artifactSha256: 'b'.repeat(64), status: 'verified' },
    license: { identifier: 'proprietary', url: 'https://example.invalid/license' }
  }];
  plan.steps.splice(1, 0, {
    stepId: 'verify-publisher',
    kind: 'verify-publisher-signature',
    dependsOn: ['select-primary'],
    inputRefs: ['kimi-identity-lock'],
    effects: [{ kind: 'verify-artifact', scopeRef: 'kimi-identity-lock' }],
    confirmation: 'none',
    cancellability: 'cooperative',
    timeoutSeconds: 15,
    idempotency: 'safe-repeat',
    compensationStepIds: ['select-primary'],
    successEvidence: [{ subject: 'artifact.publisher', assessment: 'verified' }],
    auditEventKinds: ['step-started', 'step-succeeded', 'step-failed']
  });
  plan.steps[0].compensationStepIds = ['verify-publisher'];
  plan.steps[2].dependsOn = ['verify-publisher'];
  plan.steps[2].compensationStepIds = ['select-primary'];
  plan.steps[3].compensationStepIds = ['select-primary'];
  plan.integrity.documentSha256 = 'a'.repeat(64);
  plan.integrity.signature = {
    publisherId: 'niuma-hub-r0-contract',
    artifactSha256: 'a'.repeat(64),
    status: 'verified'
  };
  return plan;
}

function request(plan, operation, runId, options = {}) {
  const review = reviewAgentInstallPlan(plan, 'Kimi');
  assert.equal(review.status, 'valid-review-only', `fixture review must be valid: ${review.issues.map((issue) => issue.code).join(',')}`);
  const consent = buildInstallConsentPreview(plan);
  const effectDigest = executor.buildInstallPlanExecutionEffectDigest(plan, operation, digest);
  const dependencies = {
    hash: digest,
    now: options.now ?? clock(),
    executeEffect: options.executeEffect ?? ((effectRequest) => ({ status: 'succeeded', evidenceDigest: evidence(effectRequest.stepId) })),
    executeCompensation: options.executeCompensation ?? ((compensationRequest) => ({ status: 'succeeded', evidenceDigest: evidence(compensationRequest.compensationStepId) }))
  };
  return {
    review,
    runId,
    operation,
    hash: digest,
    dependencies,
    authorization: {
      execute: true,
      planId: plan.planId,
      planVersion: plan.planVersion,
      agentId: plan.agentId,
      consentBinding: consent.binding,
      consentDigest: digest(consent.binding),
      effectDigest
    }
  };
}

// P-01: review-only is blocked; explicit execution authorization seals a ready run.
{
  const plan = trustedPlan();
  const review = reviewAgentInstallPlan(plan, 'Kimi');
  const blocked = executor.evaluateInstallPlanExecution({
    review,
    runId: 'blocked-review-only',
    operation: 'install',
    hash: digest,
    authorization: { execute: false }
  });
  assert.equal(blocked.outcome, 'blocked');
  assert(blocked.issues.some((issue) => issue.code === 'explicit-execution-consent-required'));

  const ready = executor.createInstallPlanExecutor(request(plan, 'install', 'run-ready'));
  assert.equal(ready.admission.outcome, 'execution-ready');
  assert.equal(ready.admission.executionEligible, true);
  assert.equal(ready.snapshot()?.state, 'created');
}

// P-02: install failure compensates applied steps in strict reverse order.
{
  const plan = trustedPlan();
  const calls = [];
  const run = request(plan, 'install', 'run-install-failure', {
    executeEffect: (effectRequest) => {
      calls.push(effectRequest.stepId);
      return effectRequest.stepId === 'record-installation'
        ? { status: 'failed', code: 'fixture-install-failure', effectApplied: false }
        : { status: 'succeeded', evidenceDigest: evidence(effectRequest.stepId) };
    }
  });
  const instance = executor.createInstallPlanExecutor(run);
  instance.start();
  await instance.advance();
  await instance.advance();
  await instance.advance();
  const failed = await instance.advance();
  assert.equal(failed.outcome, 'failed');
  assert.equal(failed.snapshot.terminalOutcome.rollback, 'complete');
  assert.deepEqual(calls, ['select-primary', 'verify-publisher', 'verify-primary', 'record-installation']);
  assert.deepEqual(run.dependencies.executeCompensation ? failed.snapshot.compensatedStepIds : [], ['verify-primary', 'verify-publisher', 'select-primary']);
  assert.equal(terminalEntries(failed.snapshot).length, 1);
}

// P-03: update cancellation waits for a non-interruptible safe point and runs compensation.
{
  let resolveEffect;
  const pending = new Promise((resolve) => { resolveEffect = resolve; });
  const plan = trustedPlan();
  plan.steps[0].cancellability = 'non-interruptible';
  const run = request(plan, 'update', 'run-update-cancel', {
    executeEffect: (_effectRequest) => pending
  });
  const instance = executor.createInstallPlanExecutor(run);
  instance.start();
  const advancing = instance.advance();
  const cancel = await instance.cancel();
  assert.equal(cancel.snapshot.state, 'cancelling');
  assert.equal(cancel.outcome, 'execution-ready');
  resolveEffect({ status: 'succeeded', evidenceDigest: evidence('select-primary') });
  const cancelled = await advancing;
  assert.equal(cancelled.outcome, 'cancelled');
  assert.equal(cancelled.snapshot.terminalOutcome.rollback, 'complete');
}

// P-04: repair compensation failure is explicit partial rollback.
{
  const plan = trustedPlan();
  const run = request(plan, 'repair', 'run-repair-partial', {
    executeEffect: (effectRequest) => effectRequest.stepId === 'record-installation'
      ? { status: 'failed', code: 'fixture-repair-failure', effectApplied: false }
      : { status: 'succeeded', evidenceDigest: evidence(effectRequest.stepId) },
    executeCompensation: (compensationRequest) => compensationRequest.compensationStepId.endsWith(':select-primary')
      && compensationRequest.stepId === 'verify-publisher'
      ? { status: 'failed', code: 'fixture-rollback-failure' }
      : { status: 'succeeded', evidenceDigest: evidence(compensationRequest.compensationStepId) }
  });
  const instance = executor.createInstallPlanExecutor(run);
  instance.start();
  await instance.advance();
  await instance.advance();
  await instance.advance();
  const partial = await instance.advance();
  assert.equal(partial.outcome, 'partial-rollback');
  assert.equal(partial.snapshot.terminalOutcome.rollback, 'partial');
  assert.deepEqual(partial.snapshot.compensatedStepIds, ['verify-primary']);
}

// P-05: uninstall has the same deterministic injected path and no machine effect.
{
  const result = await executor.executeInstallPlan(request(trustedPlan(), 'uninstall', 'run-uninstall'));
  assert.equal(result.outcome, 'succeeded');
  assert.equal(result.snapshot.terminalOutcome.state, 'succeeded');
}

// P-06: an interruption between effects recovers from LKG in reverse order.
{
  const plan = trustedPlan();
  const source = request(plan, 'install', 'run-recovery-lkg');
  const instance = executor.createInstallPlanExecutor(source);
  instance.start();
  await instance.advance();
  await instance.advance();
  await instance.advance();
  const snapshot = instance.snapshot();
  const compensationCalls = [];
  const recoveryRequest = request(plan, 'install', snapshot.binding.runId, {
    now: clock(100),
    executeCompensation: (compensationRequest) => {
      compensationCalls.push(compensationRequest.stepId);
      return { status: 'succeeded', evidenceDigest: evidence(compensationRequest.compensationStepId) };
    }
  });
  const recovery = await executor.recoverInstallPlanExecution({ ...recoveryRequest, snapshot });
  assert.equal(recovery.outcome, 'recovered');
  assert.deepEqual(compensationCalls, ['verify-primary', 'verify-publisher', 'select-primary']);
  assert.equal(recovery.snapshot.terminalOutcome.rollback, 'complete');
}

// N-01: consent/effect/version drift blocks before any effect callback.
{
  const plan = trustedPlan();
  const run = request(plan, 'install', 'run-drift');
  const effects = [];
  run.dependencies.executeEffect = (effectRequest) => {
    effects.push(effectRequest.stepId);
    return { status: 'succeeded', evidenceDigest: evidence(effectRequest.stepId) };
  };
  run.authorization.planVersion = '9.9.9';
  const instance = executor.createInstallPlanExecutor(run);
  assert.equal(instance.admission.outcome, 'blocked');
  assert.equal(effects.length, 0);
}

// N-02: a corrupt hash-chain snapshot fails recovery closed without compensation calls.
{
  const plan = trustedPlan();
  const source = request(plan, 'install', 'run-recovery-corrupt');
  const instance = executor.createInstallPlanExecutor(source);
  instance.start();
  await instance.advance();
  const snapshot = instance.snapshot();
  snapshot.journal[1].hash = 'f'.repeat(64);
  const recoveryCalls = [];
  const recoveryRequest = request(plan, 'install', snapshot.binding.runId, {
    executeCompensation: (compensationRequest) => {
      recoveryCalls.push(compensationRequest.compensationStepId);
      return { status: 'succeeded', evidenceDigest: evidence(compensationRequest.compensationStepId) };
    }
  });
  const recovery = await executor.recoverInstallPlanExecution({ ...recoveryRequest, snapshot });
  assert.equal(recovery.outcome, 'recovery-failed');
  assert.equal(recoveryCalls.length, 0);
}

console.log('install plan executor check passed.');
console.log('positive=P-01..P-06 negative=N-01..N-02 external-effects=0');
console.log('review-only gate, explicit authorization, four operations, safe-point cancellation, reverse rollback, partial rollback and recovery-failed verified with injected fixtures.');
