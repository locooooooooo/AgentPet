import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const bundled = await build({
  entryPoints: ['src/lib/installRunJournal.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false,
  logLevel: 'silent'
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`;
const {
  InstallRunInvariantError,
  buildInstallRunEffectDigest,
  createInstallRun,
  recoverInstallRun,
  verifyInstallRunSnapshot
} = await import(moduleUrl);

const digest = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const evidence = (label) => digest(`evidence:${label}`);
const clone = (value) => structuredClone(value);
const terminalEntries = (snapshot) => snapshot.journal.filter((entry) => entry.kind === 'run-terminal');
const expectCode = (fn, code) => assert.throws(fn, (error) => error instanceof InstallRunInvariantError && error.code === code);

function clock(startTick = 0) {
  let tick = startTick;
  return () => new Date(Date.UTC(2026, 6, 20, 0, 0, tick++)).toISOString();
}

function step(stepId, dependsOn = [], options = {}) {
  const compensationStepId = options.compensationStepId ?? `undo-${stepId}`;
  return {
    stepId,
    dependsOn,
    effectDigest: digest(`effect:${stepId}`),
    cancellability: options.cancellability ?? 'cooperative',
    rollback: options.noCompensation
      ? { mode: 'none-required' }
      : {
          mode: 'compensate',
          compensation: {
            stepId: compensationStepId,
            effectDigest: digest(`effect:${compensationStepId}`)
          }
        }
  };
}

function fixtureBinding(steps) {
  return {
    runId: 'install-run-001',
    planId: 'agent-install-plan',
    planVersion: '0.1.0',
    agentId: 'fixture-agent',
    consentDigest: digest('consent:0.1.0'),
    effectDigest: buildInstallRunEffectDigest(steps, digest),
    orderedSteps: steps,
    authorizedCompensationStepIds: steps.flatMap((item) =>
      item.rollback.mode === 'compensate' ? [item.rollback.compensation.stepId] : [])
  };
}

function authorization(binding) {
  return {
    runId: binding.runId,
    planId: binding.planId,
    planVersion: binding.planVersion,
    agentId: binding.agentId,
    consentDigest: binding.consentDigest,
    effectDigest: binding.effectDigest
  };
}

function harness(steps, options = {}) {
  const binding = fixtureBinding(steps);
  const effectCalls = [];
  const compensationCalls = [];
  const effectExecutor = options.executeEffect ?? ((request) => ({
    status: 'succeeded',
    evidenceDigest: evidence(request.stepId)
  }));
  const compensationExecutor = options.executeCompensation ?? ((request) => ({
    status: 'succeeded',
    evidenceDigest: evidence(request.compensationStepId)
  }));
  const dependencies = {
    hash: digest,
    now: options.now ?? clock(),
    executeEffect: async (request, signal) => {
      effectCalls.push({ request: clone(request), signal });
      return effectExecutor(request, signal);
    },
    executeCompensation: async (request, signal) => {
      compensationCalls.push({ request: clone(request), signal });
      return compensationExecutor(request, signal);
    }
  };
  return {
    binding,
    auth: authorization(binding),
    dependencies,
    effectCalls,
    compensationCalls,
    machine: createInstallRun(binding, dependencies)
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function rehashEntry(entry) {
  const { hash: _hash, ...entryWithoutHash } = entry;
  entry.hash = digest(stableStringify(entryWithoutHash));
}

// P-01: exact binding, ordered DAG and one successful terminal outcome.
{
  const steps = [step('inspect', [], { noCompensation: true }), step('install', ['inspect'])];
  const run = harness(steps);
  const created = run.machine.snapshot();
  assert.equal(created.binding.planVersion, '0.1.0');
  assert.equal(created.binding.agentId, 'fixture-agent');
  assert.equal(created.binding.consentDigest, run.binding.consentDigest);
  assert.equal(created.binding.effectDigest, run.binding.effectDigest);
  assert.deepEqual(created.binding.orderedSteps.map(({ stepId, dependsOn }) => ({ stepId, dependsOn })), [
    { stepId: 'inspect', dependsOn: [] },
    { stepId: 'install', dependsOn: ['inspect'] }
  ]);
  assert.equal(verifyInstallRunSnapshot(created, digest).valid, true);

  run.machine.start(run.auth);
  await run.machine.advance(run.auth);
  const succeeded = await run.machine.advance(run.auth);
  assert.equal(succeeded.state, 'succeeded');
  assert.deepEqual(succeeded.completedStepIds, ['inspect', 'install']);
  assert.equal(succeeded.terminalOutcome?.state, 'succeeded');
  assert.equal(terminalEntries(succeeded).length, 1);
  assert.equal(new Set(succeeded.journal.map((entry) => entry.eventId)).size, succeeded.journal.length);
  assert.equal(verifyInstallRunSnapshot(succeeded, digest).valid, true);
  expectCode(() => run.machine.start(run.auth), 'terminal-outcome-exists');
}

// P-02: a failed run compensates only applied effects and does so in strict reverse order.
{
  const steps = [step('one'), step('two', ['one']), step('three', ['two'])];
  const run = harness(steps, {
    executeEffect: (request) => request.stepId === 'three'
      ? { status: 'failed', code: 'fixture-failure', effectApplied: false }
      : { status: 'succeeded', evidenceDigest: evidence(request.stepId) }
  });
  run.machine.start(run.auth);
  await run.machine.advance(run.auth);
  await run.machine.advance(run.auth);
  const failed = await run.machine.advance(run.auth);
  assert.equal(failed.state, 'failed');
  assert.equal(failed.terminalOutcome?.rollback, 'complete');
  assert.deepEqual(run.compensationCalls.map((call) => call.request.compensationStepId), ['undo-two', 'undo-one']);
  assert.deepEqual(failed.compensatedStepIds, ['two', 'one']);
  assert.equal(terminalEntries(failed).length, 1);
  assert.equal(verifyInstallRunSnapshot(failed, digest).valid, true);
}

// P-03: non-interruptible cancellation waits for the safe point and remains idempotent.
{
  const pending = deferred();
  let effectSignal;
  const run = harness([step('atomic-install', [], { cancellability: 'non-interruptible' })], {
    executeEffect: (_request, signal) => {
      effectSignal = signal;
      return pending.promise;
    }
  });
  run.machine.start(run.auth);
  const advancing = run.machine.advance(run.auth);
  assert.equal(run.machine.snapshot().activeOperation?.stepId, 'atomic-install');
  const firstCancel = await run.machine.requestCancel();
  assert.deepEqual(firstCancel, { state: 'cancelling', idempotent: false, waitForSafePoint: true });
  assert.equal(effectSignal.aborted, false, 'non-interruptible effect must not receive abort before its safe point');
  const repeatedCancel = await run.machine.requestCancel();
  assert.equal(repeatedCancel.idempotent, true);
  pending.resolve({ status: 'succeeded', evidenceDigest: evidence('atomic-install') });
  const cancelled = await advancing;
  assert.equal(cancelled.state, 'cancelled');
  assert.deepEqual(run.compensationCalls.map((call) => call.request.compensationStepId), ['undo-atomic-install']);
  assert.equal(terminalEntries(cancelled).length, 1);
  const afterTerminalCancel = await run.machine.requestCancel();
  assert.equal(afterTerminalCancel.idempotent, true);
  assert.equal(terminalEntries(run.machine.snapshot()).length, 1);
}

// P-04: cooperative cancellation aborts the injected effect and starts no later normal step.
{
  let observedAbort = false;
  const run = harness([step('download'), step('install', ['download'])], {
    executeEffect: (_request, signal) => new Promise((resolve) => {
      signal.addEventListener('abort', () => {
        observedAbort = true;
        resolve({ status: 'cancelled', code: 'fixture-aborted', effectApplied: false });
      }, { once: true });
    })
  });
  run.machine.start(run.auth);
  const advancing = run.machine.advance(run.auth);
  const cancel = await run.machine.requestCancel();
  assert.equal(cancel.waitForSafePoint, true);
  const cancelled = await advancing;
  assert.equal(observedAbort, true);
  assert.equal(cancelled.state, 'cancelled');
  assert.deepEqual(run.effectCalls.map((call) => call.request.stepId), ['download']);
  assert.equal(run.compensationCalls.length, 0);
}

// P-05: interruption between effects recovers from the verified LKG and compensates in reverse order.
{
  const steps = [step('one'), step('two', ['one']), step('three', ['two'])];
  const source = harness(steps);
  source.machine.start(source.auth);
  await source.machine.advance(source.auth);
  await source.machine.advance(source.auth);
  const interrupted = source.machine.snapshot();
  const recovery = harness(steps, { now: clock(100) });
  const result = await recoverInstallRun(interrupted, source.auth, recovery.dependencies);
  assert.equal(result.status, 'recovered', result.reason);
  assert.equal(result.machine.state, 'recovered');
  assert.deepEqual(recovery.compensationCalls.map((call) => call.request.compensationStepId), ['undo-two', 'undo-one']);
  const recovered = result.machine.snapshot();
  assert.equal(recovered.terminalOutcome?.state, 'recovered');
  assert.equal(terminalEntries(recovered).length, 1);
  assert.equal(verifyInstallRunSnapshot(recovered, digest).valid, true);
}

// P-06: compensation failure is explicit partial rollback, never a false recovered/failed claim.
{
  const steps = [step('one'), step('two', ['one']), step('three', ['two'])];
  const run = harness(steps, {
    executeEffect: (request) => request.stepId === 'three'
      ? { status: 'failed', code: 'fixture-failure', effectApplied: false }
      : { status: 'succeeded', evidenceDigest: evidence(request.stepId) },
    executeCompensation: (request) => request.compensationStepId === 'undo-one'
      ? { status: 'failed', code: 'fixture-rollback-failure' }
      : { status: 'succeeded', evidenceDigest: evidence(request.compensationStepId) }
  });
  run.machine.start(run.auth);
  await run.machine.advance(run.auth);
  await run.machine.advance(run.auth);
  const partial = await run.machine.advance(run.auth);
  assert.equal(partial.state, 'partial-rollback');
  assert.equal(partial.terminalOutcome?.rollback, 'partial');
  assert.deepEqual(partial.compensatedStepIds, ['two']);
  assert.deepEqual(run.compensationCalls.map((call) => call.request.compensationStepId), ['undo-two', 'undo-one']);
  assert.equal(terminalEntries(partial).length, 1);
  assert.equal(verifyInstallRunSnapshot(partial, digest).valid, true);
}

// N-01: consent/effect drift blocks before any injected effect call.
{
  const run = harness([step('one')]);
  const driftedConsent = { ...run.auth, consentDigest: digest('different-consent') };
  expectCode(() => run.machine.start(driftedConsent), 'authorization-consent-drift');
  assert.equal(run.effectCalls.length, 0);

  run.machine.start(run.auth);
  const driftedEffect = { ...run.auth, effectDigest: digest('different-effect') };
  await assert.rejects(run.machine.advance(driftedEffect), (error) => error.code === 'authorization-effect-drift');
  assert.equal(run.effectCalls.length, 0);
}

// N-02: malformed DAG and unapproved compensation are rejected at creation.
{
  const reversed = [step('dependent', ['missing'])];
  const reversedBinding = fixtureBinding(reversed);
  expectCode(
    () => createInstallRun(reversedBinding, harness([step('probe')]).dependencies),
    'ordered-step-dag-invalid'
  );

  const steps = [step('write')];
  const unsafeBinding = fixtureBinding(steps);
  unsafeBinding.authorizedCompensationStepIds = [];
  expectCode(
    () => createInstallRun(unsafeBinding, harness([step('probe')]).dependencies),
    'unsafe-compensation'
  );
}

// N-03: Journal corruption and missing LKG fail closed with zero recovery effects.
{
  const source = harness([step('one'), step('two', ['one'])]);
  source.machine.start(source.auth);
  await source.machine.advance(source.auth);
  const base = source.machine.snapshot();

  const corrupted = clone(base);
  corrupted.journal[1].hash = 'f'.repeat(64);
  const recovery = harness(base.binding.orderedSteps);
  const corruptResult = await recoverInstallRun(corrupted, source.auth, recovery.dependencies);
  assert.equal(corruptResult.status, 'recovery-failed');
  assert.equal(corruptResult.reason, 'journal-hash-invalid');
  assert.equal(recovery.effectCalls.length, 0);
  assert.equal(recovery.compensationCalls.length, 0);

  const missingLkg = clone(base);
  missingLkg.lastKnownGood = null;
  const missingResult = await recoverInstallRun(missingLkg, source.auth, recovery.dependencies);
  assert.equal(missingResult.status, 'recovery-failed');
  assert.equal(missingResult.reason, 'last-known-good-missing');
  assert.equal(recovery.compensationCalls.length, 0);
}

// N-04: an interrupted in-flight effect is unknown after restart and cannot be guessed from LKG.
{
  const pending = deferred();
  const source = harness([step('one')], { executeEffect: () => pending.promise });
  source.machine.start(source.auth);
  const advancing = source.machine.advance(source.auth);
  const inFlight = source.machine.snapshot();
  assert.equal(verifyInstallRunSnapshot(inFlight, digest).valid, true);
  const recovery = harness(inFlight.binding.orderedSteps);
  const result = await recoverInstallRun(inFlight, source.auth, recovery.dependencies);
  assert.equal(result.status, 'recovery-failed');
  assert.equal(result.reason, 'unknown-active-effect');
  assert.equal(recovery.effectCalls.length, 0);
  assert.equal(recovery.compensationCalls.length, 0);
  pending.resolve({ status: 'succeeded', evidenceDigest: evidence('one') });
  await advancing;
}

// N-05: validly rehashed impossible transitions and duplicate terminal writes are detected.
{
  const created = harness([step('one')]).machine.snapshot();
  const impossible = clone(created);
  impossible.journal[0].toState = 'running';
  rehashEntry(impossible.journal[0]);
  assert.equal(verifyInstallRunSnapshot(impossible, digest).reason, 'impossible-transition');

  const cancelledRun = harness([step('one')]);
  await cancelledRun.machine.requestCancel();
  const duplicate = cancelledRun.machine.snapshot();
  const previous = duplicate.journal.at(-1);
  const extra = {
    ...clone(previous),
    sequence: previous.sequence + 1,
    eventId: `${duplicate.binding.runId}:${previous.sequence + 1}`,
    previousHash: previous.hash,
    fromState: 'cancelled',
    toState: 'cancelled'
  };
  rehashEntry(extra);
  duplicate.journal.push(extra);
  assert.equal(verifyInstallRunSnapshot(duplicate, digest).reason, 'duplicate-terminal-write');
}

// N-06: recovery authorization drift is terminal fail-closed and invokes nothing.
{
  const source = harness([step('one'), step('two', ['one'])]);
  source.machine.start(source.auth);
  await source.machine.advance(source.auth);
  const recovery = harness(source.binding.orderedSteps);
  const result = await recoverInstallRun(
    source.machine.snapshot(),
    { ...source.auth, planVersion: '0.1.1' },
    recovery.dependencies
  );
  assert.equal(result.status, 'recovery-failed');
  assert.equal(result.reason, 'authorization-plan-version-drift');
  assert.equal(recovery.effectCalls.length, 0);
  assert.equal(recovery.compensationCalls.length, 0);
}

console.log('install run Journal check passed.');
console.log('positive=P-01..P-06 negative=N-01..N-06 terminal-duplicates=0 external-effects=0');
console.log('binding, hash-chain/LKG recovery, safe-point cancellation, reverse compensation and partial rollback verified with injected pure fixtures.');
