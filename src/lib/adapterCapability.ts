import { createHash } from 'node:crypto';

export const ADAPTER_CAPABILITY_SCHEMA = 'niuma.adapter-capability';
export const ADAPTER_CAPABILITY_SCHEMA_VERSION = '0.1.0';
export const ADAPTER_CAPABILITY_EVALUATOR_VERSION = '0.1.0';
export const ADAPTER_CAPABILITY_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const ADAPTER_CAPABILITY_MAX_FUTURE_SKEW_MS = 30_000;
export const ADAPTER_CAPABILITY_MAX_EVENTS = 64;
export const ADAPTER_CAPABILITY_MAX_EVENT_BYTES = 8 * 1024;
export const ADAPTER_CAPABILITY_MAX_TOTAL_EVENT_BYTES = 32 * 1024;

export const ADAPTER_CAPABILITY_ERROR_VOCABULARY = [
  'authentication',
  'quota',
  'invalid-request',
  'permission-denied',
  'timeout',
  'cancelled',
  'process-error',
  'protocol-error',
  'output-overflow',
  'unknown'
] as const;

export const ADAPTER_CAPABILITY_SESSION_IDENTITY_FIELDS = [
  'taskId',
  'sessionId',
  'agentId',
  'connectorId',
  'runId'
] as const;

export type AdapterCapabilityAssessment = 'verified' | 'rejected' | 'unknown';
export type AdapterCapabilitySourceKind = 'real-adapter-run' | 'controlled-run' | 'fixture';
export type AdapterCapabilityEnvironment = 'production' | 'test' | 'fixture';
export type AdapterCapabilityEventKind =
  | 'started'
  | 'output'
  | 'progress'
  | 'cancel-requested'
  | 'termination-confirmed'
  | 'terminal';
export type AdapterCapabilityTerminalOutcome = 'completed' | 'failed' | 'stopped' | 'timed-out' | 'session-lost';

export interface AdapterCapabilityEvent {
  eventId: string;
  sequence: number;
  timestamp: string;
  kind: AdapterCapabilityEventKind;
  taskId: string;
  sessionId: string;
  agentId: string;
  connectorId: string;
  runId: string;
  payload?: Record<string, unknown>;
  receipt?: {
    outcome: AdapterCapabilityTerminalOutcome;
    exitConfirmed: boolean;
    exitCode: number | null;
    errorCode: string | null;
    cancelled: boolean;
  };
}

export interface AdapterCapabilityDocument {
  schema: typeof ADAPTER_CAPABILITY_SCHEMA;
  schemaVersion: typeof ADAPTER_CAPABILITY_SCHEMA_VERSION;
  adapter: {
    id: string;
    version: string;
    agentId: string;
    connectorId: string;
    mode: 'production' | 'preview';
  };
  compatibility: {
    runtimeSchema: 'niuma.connector-runtime/v1';
    runtimeVersion: string;
    platform: 'win32';
    architecture: 'x64' | 'arm64';
    transport: 'local-process';
    headless: true;
    structuredEvents: true;
  };
  permissions: {
    declared: true;
    processLaunch: 'accepted-connector-only';
    shell: false;
    workingDirectory: 'request-bounded';
    environment: 'connector-allowlist-only';
    filesystem: 'workspace-bounded';
    network: 'connector-declared';
    credentials: 'reference-only';
  };
  errors: {
    vocabulary: string[];
    unmappedError: 'unknown';
    structured: true;
  };
  sessions: {
    identityFields: string[];
    singleStarted: true;
    singleTerminal: true;
    monotonicSequence: true;
    terminalReceipt: true;
  };
  cancellation: {
    supported: true;
    requestEvent: 'cancel-requested';
    terminalOutcome: 'stopped';
    exitConfirmationRequired: true;
    duplicateRequest: 'idempotent';
  };
  evidence: {
    evaluatorVersion: typeof ADAPTER_CAPABILITY_EVALUATOR_VERSION;
    sourceKind: AdapterCapabilitySourceKind;
    environment: AdapterCapabilityEnvironment;
    observedAt: string;
    peerId: string;
    runId: string;
    taskId: string;
    sessionId: string;
    digestAlgorithm: 'sha256';
    digestSha256: string;
    events: AdapterCapabilityEvent[];
  };
}

export interface AdapterCapabilityEvaluationContext {
  nowMs: number;
  expectedAdapterId: string;
  expectedAgentId: string;
  expectedConnectorId: string;
  expectedPeerId: string;
  expectedRunId: string;
  runtimeVersion: string;
  platform: 'win32';
  architecture: 'x64' | 'arm64';
  maxAgeMs?: number;
  maxFutureSkewMs?: number;
}

export interface AdapterCapabilityFinding {
  code: string;
  path: string;
  message: string;
  disposition: 'rejected' | 'unknown';
}

export interface AdapterCapabilityEvaluation {
  assessment: AdapterCapabilityAssessment;
  executionEligible: boolean;
  evaluatorVersion: typeof ADAPTER_CAPABILITY_EVALUATOR_VERSION;
  findings: AdapterCapabilityFinding[];
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const ID_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,127}$/i;
const SENSITIVE_KEY_PATTERN = /(?:authorization|cookie|credential|password|passwd|prompt|secret|token|api.?key)/i;
const SENSITIVE_VALUE_PATTERN = /(?:bearer\s+[a-z0-9._~+/-]+=*|\bsk-[a-z0-9_-]{8,}|api[_-]?key\s*[:=])/i;
const ALLOWED_EVENT_KINDS: readonly string[] = ['started', 'output', 'progress', 'cancel-requested', 'termination-confirmed', 'terminal'];
const ALLOWED_TERMINAL_OUTCOMES: readonly string[] = ['completed', 'failed', 'stopped', 'timed-out', 'session-lost'];

export function computeAdapterCapabilityDigest(value: unknown): string {
  return createHash('sha256').update(stableStringify(value, '$', new Set<object>()), 'utf8').digest('hex');
}

export function evaluateAdapterCapability(
  value: unknown,
  context: AdapterCapabilityEvaluationContext
): AdapterCapabilityEvaluation {
  const findings: AdapterCapabilityFinding[] = [];
  validateContext(context, findings);
  validateDocument(value, context, findings);

  if (findings.some((finding) => finding.disposition === 'rejected')) {
    return result('rejected', findings);
  }

  if (isRecord(value)) {
    const evidence = isRecord(value.evidence) ? value.evidence : null;
    if (evidence && evidence.sourceKind !== 'real-adapter-run') {
      addFinding(
        findings,
        'non-production-evidence',
        '$.evidence.sourceKind',
        'Fixtures and controlled runs cannot establish real Adapter acceptance.',
        'unknown'
      );
    }
  }

  return findings.some((finding) => finding.disposition === 'unknown')
    ? result('unknown', findings)
    : result('verified', findings);
}

function validateContext(context: AdapterCapabilityEvaluationContext, findings: AdapterCapabilityFinding[]) {
  if (!isRecord(context)) {
    addRejected(findings, 'invalid-context', '$context', 'Evaluation context is required.');
    return;
  }
  if (!Number.isFinite(context.nowMs)) addRejected(findings, 'invalid-context', '$context.nowMs', 'nowMs must be finite.');
  for (const key of ['expectedAdapterId', 'expectedAgentId', 'expectedConnectorId', 'expectedPeerId', 'expectedRunId', 'runtimeVersion'] as const) {
    if (!isNonEmptyString(context[key])) addRejected(findings, 'invalid-context', `$context.${key}`, `${key} is required.`);
  }
  if (context.platform !== 'win32') addRejected(findings, 'incompatible-platform', '$context.platform', 'Only win32 is supported by v0.1.');
  if (!['x64', 'arm64'].includes(String(context.architecture))) addRejected(findings, 'incompatible-architecture', '$context.architecture', 'Architecture is unsupported.');
  if (context.maxAgeMs !== undefined && (!Number.isFinite(context.maxAgeMs) || context.maxAgeMs <= 0)) {
    addRejected(findings, 'invalid-context', '$context.maxAgeMs', 'maxAgeMs must be positive.');
  }
  if (context.maxFutureSkewMs !== undefined && (!Number.isFinite(context.maxFutureSkewMs) || context.maxFutureSkewMs < 0)) {
    addRejected(findings, 'invalid-context', '$context.maxFutureSkewMs', 'maxFutureSkewMs must be non-negative.');
  }
}

function validateDocument(value: unknown, context: AdapterCapabilityEvaluationContext, findings: AdapterCapabilityFinding[]) {
  if (!isRecord(value)) {
    addRejected(findings, 'invalid-document', '$', 'Capability evidence must be an object.');
    return;
  }
  expectKeys(value, ['schema', 'schemaVersion', 'adapter', 'compatibility', 'permissions', 'errors', 'sessions', 'cancellation', 'evidence'], '$', findings);
  expectExact(value.schema, ADAPTER_CAPABILITY_SCHEMA, '$.schema', 'unsupported-schema', findings);
  expectExact(value.schemaVersion, ADAPTER_CAPABILITY_SCHEMA_VERSION, '$.schemaVersion', 'unsupported-schema-version', findings);
  validateAdapter(value.adapter, context, findings);
  validateCompatibility(value.compatibility, context, findings);
  validatePermissions(value.permissions, findings);
  validateErrors(value.errors, findings);
  validateSessions(value.sessions, findings);
  validateCancellation(value.cancellation, findings);
  validateEvidence(value.evidence, value, context, findings);
}

function validateAdapter(value: unknown, context: AdapterCapabilityEvaluationContext, findings: AdapterCapabilityFinding[]) {
  const path = '$.adapter';
  if (!isRecord(value)) return addRejected(findings, 'invalid-adapter', path, 'Adapter declaration is required.');
  expectKeys(value, ['id', 'version', 'agentId', 'connectorId', 'mode'], path, findings);
  expectId(value.id, `${path}.id`, findings);
  expectPattern(value.version, VERSION_PATTERN, `${path}.version`, 'invalid-adapter-version', findings);
  expectId(value.agentId, `${path}.agentId`, findings);
  expectId(value.connectorId, `${path}.connectorId`, findings);
  expectEnum(value.mode, ['production', 'preview'], `${path}.mode`, 'invalid-adapter-mode', findings);
  expectMatch(value.id, context.expectedAdapterId, `${path}.id`, 'adapter-identity-mismatch', findings);
  expectMatch(value.agentId, context.expectedAgentId, `${path}.agentId`, 'agent-identity-mismatch', findings);
  expectMatch(value.connectorId, context.expectedConnectorId, `${path}.connectorId`, 'connector-identity-mismatch', findings);
}

function validateCompatibility(value: unknown, context: AdapterCapabilityEvaluationContext, findings: AdapterCapabilityFinding[]) {
  const path = '$.compatibility';
  if (!isRecord(value)) return addRejected(findings, 'invalid-compatibility', path, 'Compatibility declaration is required.');
  expectKeys(value, ['runtimeSchema', 'runtimeVersion', 'platform', 'architecture', 'transport', 'headless', 'structuredEvents'], path, findings);
  expectExact(value.runtimeSchema, 'niuma.connector-runtime/v1', `${path}.runtimeSchema`, 'incompatible-runtime-schema', findings);
  expectMatch(value.runtimeVersion, context.runtimeVersion, `${path}.runtimeVersion`, 'incompatible-runtime-version', findings);
  expectMatch(value.platform, context.platform, `${path}.platform`, 'incompatible-platform', findings);
  expectMatch(value.architecture, context.architecture, `${path}.architecture`, 'incompatible-architecture', findings);
  expectExact(value.transport, 'local-process', `${path}.transport`, 'incompatible-transport', findings);
  expectExact(value.headless, true, `${path}.headless`, 'headless-required', findings);
  expectExact(value.structuredEvents, true, `${path}.structuredEvents`, 'structured-events-required', findings);
}

function validatePermissions(value: unknown, findings: AdapterCapabilityFinding[]) {
  const path = '$.permissions';
  if (!isRecord(value)) return addRejected(findings, 'permissions-missing', path, 'Permission declaration is required.');
  expectKeys(value, ['declared', 'processLaunch', 'shell', 'workingDirectory', 'environment', 'filesystem', 'network', 'credentials'], path, findings);
  expectExact(value.declared, true, `${path}.declared`, 'permissions-undeclared', findings);
  expectExact(value.processLaunch, 'accepted-connector-only', `${path}.processLaunch`, 'unsafe-process-permission', findings);
  expectExact(value.shell, false, `${path}.shell`, 'shell-forbidden', findings);
  expectExact(value.workingDirectory, 'request-bounded', `${path}.workingDirectory`, 'unbounded-working-directory', findings);
  expectExact(value.environment, 'connector-allowlist-only', `${path}.environment`, 'unbounded-environment', findings);
  expectExact(value.filesystem, 'workspace-bounded', `${path}.filesystem`, 'unbounded-filesystem', findings);
  expectExact(value.network, 'connector-declared', `${path}.network`, 'undeclared-network', findings);
  expectExact(value.credentials, 'reference-only', `${path}.credentials`, 'inline-credentials-forbidden', findings);
}

function validateErrors(value: unknown, findings: AdapterCapabilityFinding[]) {
  const path = '$.errors';
  if (!isRecord(value)) return addRejected(findings, 'error-vocabulary-missing', path, 'Structured error vocabulary is required.');
  expectKeys(value, ['vocabulary', 'unmappedError', 'structured'], path, findings);
  if (!Array.isArray(value.vocabulary) || !sameStringSet(value.vocabulary, ADAPTER_CAPABILITY_ERROR_VOCABULARY)) {
    addRejected(findings, 'error-vocabulary-mismatch', `${path}.vocabulary`, 'Error vocabulary must match the v0.1 vocabulary exactly.');
  }
  expectExact(value.unmappedError, 'unknown', `${path}.unmappedError`, 'unmapped-error-not-closed', findings);
  expectExact(value.structured, true, `${path}.structured`, 'structured-errors-required', findings);
}

function validateSessions(value: unknown, findings: AdapterCapabilityFinding[]) {
  const path = '$.sessions';
  if (!isRecord(value)) return addRejected(findings, 'session-contract-missing', path, 'Session contract is required.');
  expectKeys(value, ['identityFields', 'singleStarted', 'singleTerminal', 'monotonicSequence', 'terminalReceipt'], path, findings);
  if (!Array.isArray(value.identityFields) || !sameStringArray(value.identityFields, ADAPTER_CAPABILITY_SESSION_IDENTITY_FIELDS)) {
    addRejected(findings, 'session-identity-incomplete', `${path}.identityFields`, 'Session identity fields must match the v0.1 binding order.');
  }
  expectExact(value.singleStarted, true, `${path}.singleStarted`, 'single-start-required', findings);
  expectExact(value.singleTerminal, true, `${path}.singleTerminal`, 'single-terminal-required', findings);
  expectExact(value.monotonicSequence, true, `${path}.monotonicSequence`, 'monotonic-sequence-required', findings);
  expectExact(value.terminalReceipt, true, `${path}.terminalReceipt`, 'terminal-receipt-required', findings);
}

function validateCancellation(value: unknown, findings: AdapterCapabilityFinding[]) {
  const path = '$.cancellation';
  if (!isRecord(value)) return addRejected(findings, 'cancellation-contract-missing', path, 'Cancellation contract is required.');
  expectKeys(value, ['supported', 'requestEvent', 'terminalOutcome', 'exitConfirmationRequired', 'duplicateRequest'], path, findings);
  expectExact(value.supported, true, `${path}.supported`, 'cancellation-required', findings);
  expectExact(value.requestEvent, 'cancel-requested', `${path}.requestEvent`, 'cancellation-event-mismatch', findings);
  expectExact(value.terminalOutcome, 'stopped', `${path}.terminalOutcome`, 'cancellation-outcome-mismatch', findings);
  expectExact(value.exitConfirmationRequired, true, `${path}.exitConfirmationRequired`, 'exit-confirmation-required', findings);
  expectExact(value.duplicateRequest, 'idempotent', `${path}.duplicateRequest`, 'cancellation-idempotency-required', findings);
}

function validateEvidence(
  value: unknown,
  document: Record<string, unknown>,
  context: AdapterCapabilityEvaluationContext,
  findings: AdapterCapabilityFinding[]
) {
  const path = '$.evidence';
  if (!isRecord(value)) return addRejected(findings, 'evidence-missing', path, 'Bound evidence is required.');
  expectKeys(value, ['evaluatorVersion', 'sourceKind', 'environment', 'observedAt', 'peerId', 'runId', 'taskId', 'sessionId', 'digestAlgorithm', 'digestSha256', 'events'], path, findings);
  expectExact(value.evaluatorVersion, ADAPTER_CAPABILITY_EVALUATOR_VERSION, `${path}.evaluatorVersion`, 'evaluator-version-mismatch', findings);
  expectEnum(value.sourceKind, ['real-adapter-run', 'controlled-run', 'fixture'], `${path}.sourceKind`, 'invalid-source-kind', findings);
  expectEnum(value.environment, ['production', 'test', 'fixture'], `${path}.environment`, 'invalid-evidence-environment', findings);
  expectId(value.peerId, `${path}.peerId`, findings);
  expectId(value.runId, `${path}.runId`, findings);
  expectId(value.taskId, `${path}.taskId`, findings);
  expectId(value.sessionId, `${path}.sessionId`, findings);
  expectMatch(value.peerId, context.expectedPeerId, `${path}.peerId`, 'peer-identity-mismatch', findings);
  expectMatch(value.runId, context.expectedRunId, `${path}.runId`, 'run-identity-mismatch', findings);
  expectExact(value.digestAlgorithm, 'sha256', `${path}.digestAlgorithm`, 'digest-algorithm-mismatch', findings);
  expectPattern(value.digestSha256, SHA256_PATTERN, `${path}.digestSha256`, 'invalid-evidence-digest', findings);

  validateSourceEnvironment(value.sourceKind, value.environment, document.adapter, findings);
  validateFreshness(value.observedAt, context, findings);
  validateEvents(value.events, value, document.adapter, value.observedAt, context, findings);

  if (typeof value.digestSha256 === 'string' && SHA256_PATTERN.test(value.digestSha256)) {
    try {
      const expectedDigest = computeAdapterCapabilityDigest(document);
      if (value.digestSha256 !== expectedDigest) {
        addRejected(findings, 'evidence-digest-mismatch', `${path}.digestSha256`, 'Evidence digest does not bind the submitted document.');
      }
    } catch {
      addRejected(findings, 'evidence-digest-uncomputable', `${path}.digestSha256`, 'Evidence document cannot be canonicalized safely.');
    }
  }
}

function validateSourceEnvironment(
  sourceKind: unknown,
  environment: unknown,
  adapter: unknown,
  findings: AdapterCapabilityFinding[]
) {
  const mode = isRecord(adapter) ? adapter.mode : undefined;
  const expected = sourceKind === 'real-adapter-run'
    ? { environment: 'production', mode: 'production' }
    : sourceKind === 'controlled-run'
      ? { environment: 'test', mode: 'preview' }
      : sourceKind === 'fixture'
        ? { environment: 'fixture', mode: 'preview' }
        : null;
  if (expected && (environment !== expected.environment || mode !== expected.mode)) {
    addRejected(findings, 'preview-production-confusion', '$.evidence.environment', 'Source kind, environment and Adapter mode are inconsistent.');
  }
}

function validateFreshness(value: unknown, context: AdapterCapabilityEvaluationContext, findings: AdapterCapabilityFinding[]) {
  const timestamp = parseExactTimestamp(value);
  if (timestamp === null) {
    addRejected(findings, 'invalid-observed-at', '$.evidence.observedAt', 'observedAt must be an exact ISO timestamp.');
    return;
  }
  if (!Number.isFinite(context.nowMs)) return;
  const maxAgeMs = context.maxAgeMs ?? ADAPTER_CAPABILITY_MAX_AGE_MS;
  const maxFutureSkewMs = context.maxFutureSkewMs ?? ADAPTER_CAPABILITY_MAX_FUTURE_SKEW_MS;
  if (timestamp > context.nowMs + maxFutureSkewMs) {
    addRejected(findings, 'future-evidence', '$.evidence.observedAt', 'Evidence is from the future.');
  } else if (context.nowMs - timestamp > maxAgeMs) {
    addRejected(findings, 'stale-evidence', '$.evidence.observedAt', 'Evidence is stale.');
  }
}

function validateEvents(
  value: unknown,
  evidence: Record<string, unknown>,
  adapter: unknown,
  observedAtValue: unknown,
  context: AdapterCapabilityEvaluationContext,
  findings: AdapterCapabilityFinding[]
) {
  const path = '$.evidence.events';
  if (!Array.isArray(value) || value.length === 0) {
    addRejected(findings, 'events-missing', path, 'At least one evidence event is required.');
    return;
  }
  if (value.length > ADAPTER_CAPABILITY_MAX_EVENTS) {
    addRejected(findings, 'event-count-oversized', path, `At most ${ADAPTER_CAPABILITY_MAX_EVENTS} events are allowed.`);
  }
  const observedAt = parseExactTimestamp(observedAtValue);
  const eventIds = new Set<string>();
  let totalBytes = 0;
  let previousSequence = 0;
  let previousTimestamp = -Infinity;
  let startedCount = 0;
  let terminalCount = 0;
  let cancelCount = 0;
  let terminationConfirmedCount = 0;

  value.forEach((item, index) => {
    const eventPath = `${path}[${index}]`;
    if (!isRecord(item)) {
      addRejected(findings, 'invalid-event', eventPath, 'Event must be an object.');
      return;
    }
    expectKeys(item, ['eventId', 'sequence', 'timestamp', 'kind', 'taskId', 'sessionId', 'agentId', 'connectorId', 'runId', 'payload', 'receipt'], eventPath, findings);
    expectId(item.eventId, `${eventPath}.eventId`, findings);
    if (typeof item.eventId === 'string') {
      if (eventIds.has(item.eventId)) addRejected(findings, 'duplicate-event-id', `${eventPath}.eventId`, 'Event IDs must be unique.');
      eventIds.add(item.eventId);
    }
    if (typeof item.sequence !== 'number' || !Number.isSafeInteger(item.sequence) || item.sequence <= 0) {
      addRejected(findings, 'invalid-event-sequence', `${eventPath}.sequence`, 'Event sequence must be a positive safe integer.');
    } else {
      if (item.sequence !== previousSequence + 1) addRejected(findings, 'non-monotonic-event-sequence', `${eventPath}.sequence`, 'Event sequences must be contiguous and monotonic.');
      previousSequence = item.sequence;
    }
    expectEnum(item.kind, ALLOWED_EVENT_KINDS, `${eventPath}.kind`, 'invalid-event-kind', findings);
    const timestamp = parseExactTimestamp(item.timestamp);
    if (timestamp === null) {
      addRejected(findings, 'invalid-event-timestamp', `${eventPath}.timestamp`, 'Event timestamp must be exact ISO.');
    } else {
      if (timestamp < previousTimestamp) addRejected(findings, 'non-monotonic-event-time', `${eventPath}.timestamp`, 'Event timestamps must be monotonic.');
      if (observedAt !== null && timestamp > observedAt) addRejected(findings, 'event-after-observation', `${eventPath}.timestamp`, 'Event cannot occur after observedAt.');
      if (Number.isFinite(context.nowMs) && timestamp > context.nowMs + (context.maxFutureSkewMs ?? ADAPTER_CAPABILITY_MAX_FUTURE_SKEW_MS)) {
        addRejected(findings, 'future-event', `${eventPath}.timestamp`, 'Event is from the future.');
      } else if (Number.isFinite(context.nowMs) && context.nowMs - timestamp > (context.maxAgeMs ?? ADAPTER_CAPABILITY_MAX_AGE_MS)) {
        addRejected(findings, 'stale-event', `${eventPath}.timestamp`, 'Event is stale.');
      }
      previousTimestamp = timestamp;
    }
    validateEventIdentity(item, evidence, adapter, eventPath, findings);
    validatePayload(item.kind, item.payload, `${eventPath}.payload`, findings);
    if (item.kind === 'started') startedCount += 1;
    if (item.kind === 'terminal') terminalCount += 1;
    if (item.kind === 'cancel-requested') cancelCount += 1;
    if (item.kind === 'termination-confirmed') terminationConfirmedCount += 1;
    validateReceipt(item, eventPath, findings);
    const bytes = utf8Bytes(item);
    totalBytes += bytes;
    if (bytes > ADAPTER_CAPABILITY_MAX_EVENT_BYTES) {
      addRejected(findings, 'event-oversized', eventPath, `Event exceeds ${ADAPTER_CAPABILITY_MAX_EVENT_BYTES} UTF-8 bytes.`);
    }
  });

  if (totalBytes > ADAPTER_CAPABILITY_MAX_TOTAL_EVENT_BYTES) {
    addRejected(findings, 'event-stream-oversized', path, `Event stream exceeds ${ADAPTER_CAPABILITY_MAX_TOTAL_EVENT_BYTES} UTF-8 bytes.`);
  }
  if (startedCount !== 1 || !isRecord(value[0]) || value[0].kind !== 'started') {
    addRejected(findings, 'started-event-invalid', path, 'Exactly one started event must be first.');
  }
  if (terminalCount !== 1 || !isRecord(value[value.length - 1]) || value[value.length - 1].kind !== 'terminal') {
    addRejected(findings, 'terminal-event-invalid', path, 'Exactly one terminal event must be last.');
  }
  if (cancelCount !== 1) addRejected(findings, 'cancellation-evidence-invalid', path, 'Exactly one cancellation request is required.');
  if (terminationConfirmedCount !== 1) addRejected(findings, 'termination-confirmation-invalid', path, 'Exactly one termination confirmation is required.');
  const cancelIndex = value.findIndex((event) => isRecord(event) && event.kind === 'cancel-requested');
  const confirmationIndex = value.findIndex((event) => isRecord(event) && event.kind === 'termination-confirmed');
  const terminalIndex = value.findIndex((event) => isRecord(event) && event.kind === 'terminal');
  if (!(cancelIndex > 0 && confirmationIndex > cancelIndex && terminalIndex > confirmationIndex)) {
    addRejected(findings, 'cancellation-order-invalid', path, 'Cancellation, exit confirmation and terminal receipt must be ordered.');
  }
}

function validateEventIdentity(
  event: Record<string, unknown>,
  evidence: Record<string, unknown>,
  adapter: unknown,
  path: string,
  findings: AdapterCapabilityFinding[]
) {
  const declaration = isRecord(adapter) ? adapter : {};
  const bindings: Array<[string, unknown]> = [
    ['taskId', evidence.taskId],
    ['sessionId', evidence.sessionId],
    ['agentId', declaration.agentId],
    ['connectorId', declaration.connectorId],
    ['runId', evidence.runId]
  ];
  for (const [key, expected] of bindings) {
    expectId(event[key], `${path}.${key}`, findings);
    expectMatch(event[key], expected, `${path}.${key}`, 'event-identity-mismatch', findings);
  }
}

function validateReceipt(event: Record<string, unknown>, path: string, findings: AdapterCapabilityFinding[]) {
  if (event.kind !== 'terminal') {
    if (event.receipt !== undefined) addRejected(findings, 'receipt-on-non-terminal', `${path}.receipt`, 'Only terminal events may carry receipts.');
    return;
  }
  const receiptPath = `${path}.receipt`;
  if (!isRecord(event.receipt)) return addRejected(findings, 'terminal-receipt-missing', receiptPath, 'Terminal receipt is required.');
  expectKeys(event.receipt, ['outcome', 'exitConfirmed', 'exitCode', 'errorCode', 'cancelled'], receiptPath, findings);
  expectEnum(event.receipt.outcome, ALLOWED_TERMINAL_OUTCOMES, `${receiptPath}.outcome`, 'invalid-terminal-outcome', findings);
  expectExact(event.receipt.outcome, 'stopped', `${receiptPath}.outcome`, 'cancellation-terminal-mismatch', findings);
  expectExact(event.receipt.exitConfirmed, true, `${receiptPath}.exitConfirmed`, 'terminal-exit-unconfirmed', findings);
  if (event.receipt.exitCode !== null && !Number.isInteger(event.receipt.exitCode)) {
    addRejected(findings, 'invalid-exit-code', `${receiptPath}.exitCode`, 'exitCode must be an integer or null.');
  }
  expectExact(event.receipt.errorCode, 'cancelled', `${receiptPath}.errorCode`, 'terminal-error-mismatch', findings);
  expectExact(event.receipt.cancelled, true, `${receiptPath}.cancelled`, 'terminal-cancellation-mismatch', findings);
}

function validatePayload(kind: unknown, value: unknown, path: string, findings: AdapterCapabilityFinding[]) {
  if (kind === 'started' || kind === 'terminal') {
    if (value !== undefined) addRejected(findings, 'unexpected-event-payload', path, `${String(kind)} must not carry a payload.`);
    return;
  }
  if (!isRecord(value)) return addRejected(findings, 'invalid-event-payload', path, `${String(kind)} requires an object payload.`);
  inspectPayload(value, path, findings, new Set<object>(), 0);
  if (kind === 'output') {
    expectKeys(value, ['stream', 'bytes', 'redacted'], path, findings);
    expectEnum(value.stream, ['stdout', 'stderr'], `${path}.stream`, 'invalid-output-stream', findings);
    if (!Number.isSafeInteger(value.bytes) || Number(value.bytes) < 0) addRejected(findings, 'invalid-output-size', `${path}.bytes`, 'Output bytes must be a non-negative safe integer.');
    expectExact(value.redacted, true, `${path}.redacted`, 'unredacted-output-evidence', findings);
  } else if (kind === 'progress') {
    expectKeys(value, ['percent'], path, findings);
    if (!Number.isInteger(value.percent) || Number(value.percent) < 0 || Number(value.percent) > 100) {
      addRejected(findings, 'invalid-progress', `${path}.percent`, 'Progress must be an integer from 0 through 100.');
    }
  } else if (kind === 'cancel-requested') {
    expectKeys(value, ['reason', 'requestCount', 'effectiveRequestCount'], path, findings);
    expectExact(value.reason, 'user-cancel', `${path}.reason`, 'invalid-cancellation-reason', findings);
    if (!Number.isSafeInteger(value.requestCount) || Number(value.requestCount) < 2) {
      addRejected(findings, 'duplicate-cancellation-proof-missing', `${path}.requestCount`, 'At least two requests are required to prove cancellation idempotency.');
    }
    expectExact(value.effectiveRequestCount, 1, `${path}.effectiveRequestCount`, 'cancellation-not-idempotent', findings);
  } else if (kind === 'termination-confirmed') {
    expectKeys(value, ['exitConfirmed', 'killAttempts'], path, findings);
    expectExact(value.exitConfirmed, true, `${path}.exitConfirmed`, 'termination-unconfirmed', findings);
    if (!Number.isSafeInteger(value.killAttempts) || Number(value.killAttempts) < 1) {
      addRejected(findings, 'invalid-kill-attempts', `${path}.killAttempts`, 'At least one bounded kill attempt must be recorded.');
    }
  }
}

function inspectPayload(
  value: unknown,
  path: string,
  findings: AdapterCapabilityFinding[],
  seen: Set<object>,
  depth: number
) {
  if (depth > 8) return addRejected(findings, 'payload-too-deep', path, 'Payload nesting exceeds eight levels.');
  if (typeof value === 'string') {
    if (SENSITIVE_VALUE_PATTERN.test(value)) addRejected(findings, 'sensitive-payload-value', path, 'Payload contains a sensitive value pattern.');
    return;
  }
  if (value === null || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return;
  if (typeof value !== 'object') return addRejected(findings, 'invalid-payload-value', path, 'Payload must contain JSON-safe values only.');
  if (seen.has(value)) return addRejected(findings, 'cyclic-payload', path, 'Payload cannot be cyclic.');
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectPayload(item, `${path}[${index}]`, findings, seen, depth + 1));
  } else {
    for (const [key, item] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) addRejected(findings, 'sensitive-payload-field', `${path}.${key}`, 'Sensitive payload fields are forbidden.');
      inspectPayload(item, `${path}.${key}`, findings, seen, depth + 1);
    }
  }
  seen.delete(value);
}

function stableStringify(value: unknown, path: string, seen: Set<object>): string {
  if (path === '$.evidence.digestSha256') return JSON.stringify('');
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') return Number.isFinite(value) ? JSON.stringify(value) : 'null';
  if (typeof value === 'object' && value !== null) {
    if (seen.has(value)) throw new TypeError('Cannot canonicalize cyclic evidence.');
    seen.add(value);
    const serialized = Array.isArray(value)
      ? `[${value.map((item, index) => stableStringify(item, `${path}[${index}]`, seen)).join(',')}]`
      : `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key], `${path}.${key}`, seen)}`).join(',')}}`;
    seen.delete(value);
    return serialized;
  }
  return JSON.stringify(String(value));
}

function utf8Bytes(value: unknown): number {
  try {
    return Buffer.byteLength(stableStringify(value, '$event', new Set<object>()), 'utf8');
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function parseExactTimestamp(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value ? timestamp : null;
}

function sameStringArray(value: unknown[], expected: readonly string[]) {
  return value.length === expected.length && value.every((item, index) => item === expected[index]);
}

function sameStringSet(value: unknown[], expected: readonly string[]) {
  return value.length === expected.length
    && value.every((item) => typeof item === 'string')
    && new Set(value).size === value.length
    && expected.every((item) => value.includes(item));
}

function expectKeys(value: Record<string, unknown>, allowed: readonly string[], path: string, findings: AdapterCapabilityFinding[]) {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) addRejected(findings, 'unknown-field', `${path}.${key}`, 'Unknown fields are rejected.');
  }
  for (const key of allowed) {
    if (!(key in value) && !['payload', 'receipt'].includes(key)) addRejected(findings, 'missing-field', `${path}.${key}`, 'Required field is missing.');
  }
}

function expectExact(value: unknown, expected: unknown, path: string, code: string, findings: AdapterCapabilityFinding[]) {
  if (value !== expected) addRejected(findings, code, path, `Expected ${JSON.stringify(expected)}.`);
}

function expectMatch(value: unknown, expected: unknown, path: string, code: string, findings: AdapterCapabilityFinding[]) {
  if (value !== expected) addRejected(findings, code, path, 'Value does not match the bound identity or runtime context.');
}

function expectEnum(value: unknown, allowed: readonly string[], path: string, code: string, findings: AdapterCapabilityFinding[]) {
  if (typeof value !== 'string' || !allowed.includes(value)) addRejected(findings, code, path, `Expected one of: ${allowed.join(', ')}.`);
}

function expectPattern(value: unknown, pattern: RegExp, path: string, code: string, findings: AdapterCapabilityFinding[]) {
  if (typeof value !== 'string' || !pattern.test(value)) addRejected(findings, code, path, 'Value has an invalid format.');
}

function expectId(value: unknown, path: string, findings: AdapterCapabilityFinding[]) {
  expectPattern(value, ID_PATTERN, path, 'invalid-identity', findings);
}

function result(assessment: AdapterCapabilityAssessment, findings: AdapterCapabilityFinding[]): AdapterCapabilityEvaluation {
  return {
    assessment,
    executionEligible: assessment === 'verified',
    evaluatorVersion: ADAPTER_CAPABILITY_EVALUATOR_VERSION,
    findings
  };
}

function addRejected(findings: AdapterCapabilityFinding[], code: string, path: string, message: string) {
  addFinding(findings, code, path, message, 'rejected');
}

function addFinding(
  findings: AdapterCapabilityFinding[],
  code: string,
  path: string,
  message: string,
  disposition: AdapterCapabilityFinding['disposition']
) {
  if (!findings.some((finding) => finding.code === code && finding.path === path && finding.disposition === disposition)) {
    findings.push({ code, path, message, disposition });
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
