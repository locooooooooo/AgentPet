import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundled = await build({
  entryPoints: ['src/lib/adapterCapability.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false,
  logLevel: 'silent'
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`;
const {
  ADAPTER_CAPABILITY_ERROR_VOCABULARY,
  ADAPTER_CAPABILITY_SESSION_IDENTITY_FIELDS,
  computeAdapterCapabilityDigest,
  evaluateAdapterCapability
} = await import(moduleUrl);

const NOW = Date.parse('2026-07-20T06:00:00.000Z');
const context = {
  nowMs: NOW,
  expectedAdapterId: 'codex-headless',
  expectedAgentId: 'codex',
  expectedConnectorId: 'codex-local',
  expectedPeerId: 'hub-main',
  expectedRunId: 'run-capability-001',
  runtimeVersion: '0.1.0',
  platform: 'win32',
  architecture: 'x64'
};

function fixture(sourceKind = 'real-adapter-run') {
  const production = sourceKind === 'real-adapter-run';
  const document = {
    schema: 'niuma.adapter-capability',
    schemaVersion: '0.1.0',
    adapter: {
      id: 'codex-headless',
      version: '1.2.3',
      agentId: 'codex',
      connectorId: 'codex-local',
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
    errors: {
      vocabulary: [...ADAPTER_CAPABILITY_ERROR_VOCABULARY],
      unmappedError: 'unknown',
      structured: true
    },
    sessions: {
      identityFields: [...ADAPTER_CAPABILITY_SESSION_IDENTITY_FIELDS],
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
      observedAt: '2026-07-20T05:00:05.000Z',
      peerId: 'hub-main',
      runId: 'run-capability-001',
      taskId: 'task-capability-001',
      sessionId: 'session-capability-001',
      digestAlgorithm: 'sha256',
      digestSha256: '',
      events: [
        event(1, 'started', '2026-07-20T05:00:00.000Z'),
        event(2, 'output', '2026-07-20T05:00:01.000Z', { stream: 'stdout', bytes: 17, redacted: true }),
        event(3, 'cancel-requested', '2026-07-20T05:00:02.000Z', { reason: 'user-cancel', requestCount: 2, effectiveRequestCount: 1 }),
        event(4, 'termination-confirmed', '2026-07-20T05:00:03.000Z', { exitConfirmed: true, killAttempts: 1 }),
        {
          ...event(5, 'terminal', '2026-07-20T05:00:04.000Z'),
          receipt: { outcome: 'stopped', exitConfirmed: true, exitCode: 0, errorCode: 'cancelled', cancelled: true }
        }
      ]
    }
  };
  seal(document);
  return document;
}

function event(sequence, kind, timestamp, payload) {
  return {
    eventId: `event-${sequence}`,
    sequence,
    timestamp,
    kind,
    taskId: 'task-capability-001',
    sessionId: 'session-capability-001',
    agentId: 'codex',
    connectorId: 'codex-local',
    runId: 'run-capability-001',
    ...(payload === undefined ? {} : { payload })
  };
}

function seal(document) {
  document.evidence.digestSha256 = computeAdapterCapabilityDigest(document);
  return document;
}

function mutate(mutator, { reseal = true, sourceKind = 'real-adapter-run', evaluationContext = context } = {}) {
  const document = fixture(sourceKind);
  mutator(document);
  if (reseal) seal(document);
  return evaluateAdapterCapability(document, evaluationContext);
}

function codes(result) {
  return result.findings.map((finding) => finding.code);
}

function rejects(code, mutator, options) {
  const evaluation = mutate(mutator, options);
  assert.equal(evaluation.assessment, 'rejected', `${code} case must reject`);
  assert.equal(evaluation.executionEligible, false, `${code} case must not execute`);
  assert(codes(evaluation).includes(code), `${code} finding must be explicit; got ${codes(evaluation).join(', ')}`);
}

const verified = evaluateAdapterCapability(fixture(), context);
assert.equal(verified.assessment, 'verified');
assert.equal(verified.executionEligible, true);
assert.deepEqual(verified.findings, []);

for (const sourceKind of ['controlled-run', 'fixture']) {
  const evaluation = evaluateAdapterCapability(fixture(sourceKind), context);
  assert.equal(evaluation.assessment, 'unknown');
  assert.equal(evaluation.executionEligible, false);
  assert(codes(evaluation).includes('non-production-evidence'));
}

rejects('unknown-field', (document) => { document.adapter.experimental = true; });
rejects('missing-field', (document) => { delete document.permissions.credentials; });
rejects('unsupported-schema', (document) => { document.schema = 'niuma.adapter-capability-preview'; });
rejects('unsupported-schema-version', (document) => { document.schemaVersion = '0.2.0'; });
rejects('evaluator-version-mismatch', (document) => { document.evidence.evaluatorVersion = '0.2.0'; });
rejects('adapter-identity-mismatch', (document) => { document.adapter.id = 'trae-headless'; });
rejects('agent-identity-mismatch', (document) => { document.adapter.agentId = 'trae'; });
rejects('connector-identity-mismatch', (document) => { document.adapter.connectorId = 'trae-local'; });
rejects('incompatible-runtime-version', (document) => { document.compatibility.runtimeVersion = '0.2.0'; });
rejects('incompatible-platform', (document) => { document.compatibility.platform = 'linux'; });
rejects('headless-required', (document) => { document.compatibility.headless = false; });
rejects('structured-events-required', (document) => { document.compatibility.structuredEvents = false; });
rejects('shell-forbidden', (document) => { document.permissions.shell = true; });
rejects('unbounded-filesystem', (document) => { document.permissions.filesystem = 'all-files'; });
rejects('inline-credentials-forbidden', (document) => { document.permissions.credentials = 'inline'; });
rejects('error-vocabulary-mismatch', (document) => { document.errors.vocabulary.pop(); });
rejects('session-identity-incomplete', (document) => { document.sessions.identityFields.pop(); });
rejects('cancellation-idempotency-required', (document) => { document.cancellation.duplicateRequest = 'repeat-kill'; });
rejects('duplicate-cancellation-proof-missing', (document) => { document.evidence.events[2].payload.requestCount = 1; });
rejects('cancellation-not-idempotent', (document) => { document.evidence.events[2].payload.effectiveRequestCount = 2; });
rejects('peer-identity-mismatch', (document) => { document.evidence.peerId = 'other-peer'; });
rejects('run-identity-mismatch', (document) => { document.evidence.runId = 'other-run'; });
rejects('preview-production-confusion', (document) => { document.evidence.environment = 'test'; });
rejects('preview-production-confusion', (document) => { document.evidence.environment = 'production'; }, { sourceKind: 'fixture' });
rejects('stale-evidence', (document) => { document.evidence.observedAt = '2026-07-18T05:00:05.000Z'; });
rejects('future-evidence', (document) => { document.evidence.observedAt = '2026-07-20T07:00:05.000Z'; });
rejects('stale-event', (document) => { document.evidence.events[0].timestamp = '2026-07-18T05:00:00.000Z'; });
rejects('evidence-digest-mismatch', (document) => { document.adapter.version = '9.9.9'; }, { reseal: false });
rejects('event-identity-mismatch', (document) => { document.evidence.events[1].sessionId = 'other-session'; });
rejects('duplicate-event-id', (document) => { document.evidence.events[1].eventId = 'event-1'; });
rejects('non-monotonic-event-sequence', (document) => { document.evidence.events[1].sequence = 7; });
rejects('non-monotonic-event-time', (document) => { document.evidence.events[2].timestamp = '2026-07-20T04:00:00.000Z'; });
rejects('started-event-invalid', (document) => { document.evidence.events[1].kind = 'started'; });
rejects('terminal-event-invalid', (document) => { document.evidence.events.push(event(6, 'progress', '2026-07-20T05:00:04.500Z')); });
rejects('cancellation-evidence-invalid', (document) => { document.evidence.events[2].kind = 'progress'; });
rejects('termination-confirmation-invalid', (document) => { document.evidence.events[3].kind = 'progress'; });
rejects('terminal-exit-unconfirmed', (document) => { document.evidence.events[4].receipt.exitConfirmed = false; });
rejects('cancellation-terminal-mismatch', (document) => { document.evidence.events[4].receipt.outcome = 'completed'; });
rejects('terminal-error-mismatch', (document) => { document.evidence.events[4].receipt.errorCode = 'unknown'; });
rejects('sensitive-payload-field', (document) => { document.evidence.events[1].payload.apiToken = 'redacted'; });
rejects('sensitive-payload-value', (document) => { document.evidence.events[1].payload.message = 'Bearer abcdefghijklmnop'; });
rejects('event-oversized', (document) => { document.evidence.events[1].payload.message = 'x'.repeat(9 * 1024); });
rejects('event-count-oversized', (document) => {
  const terminal = document.evidence.events.pop();
  while (document.evidence.events.length < 64) {
    const sequence = document.evidence.events.length + 1;
    document.evidence.events.push(event(sequence, 'progress', '2026-07-20T05:00:03.500Z', { progress: sequence }));
  }
  terminal.sequence = 65;
  terminal.eventId = 'event-65';
  document.evidence.events.push(terminal);
});

const invalidContext = evaluateAdapterCapability(fixture(), { ...context, expectedPeerId: '' });
assert.equal(invalidContext.assessment, 'rejected');
assert(codes(invalidContext).includes('invalid-context'));

console.log('adapter capability admission check passed.');
console.log('positive: real production evidence -> verified/executionEligible=true.');
console.log('non-production: controlled-run and fixture -> unknown/executionEligible=false.');
console.log('negative matrix: schema, identity, compatibility, permissions, errors, sessions, cancellation, digest, freshness, source, ordering, receipts, size and sensitive payload -> rejected.');
console.log('external Agent/Connector spawn: 0.');
