import type {
  AgentInstance,
  ConnectorAuthorizationCancelResult,
  ConnectorAuthorizationIntent,
  ConnectorAuthorizationResult,
  ConnectorCapabilitySource,
  ConnectorFailureKind,
  ConnectorLifecycleSubtype,
  ConnectorOutputStats,
  ConnectorPolicyConfig,
  ConnectorRetryPolicy,
  ConnectorRetryPolicyInput,
  ConnectorRunRequest,
  ConnectorRunResult,
  ConnectorRuntimeBlockedReason,
  ConnectorRuntimeEvent,
  ConnectorRuntimeEventKind,
  ConnectorRuntimeSnapshot,
  ConnectorRuntimeState,
  ConnectorSession,
  ConnectorSessionAudit,
  ConnectorStopRequest,
  ConnectorStopResult,
  ConnectorTerminationEvidence,
  ProcessLivenessEvidence,
  ProcessLivenessSource,
  ProcessLivenessStatus
} from '../types';
import { createConnectorProcessEnv, evaluateConnectorPolicyGate } from './connectorGate';

const MAX_RUNTIME_SESSIONS = 50;
const MAX_RUNTIME_EVENTS = 400;
const MAX_OUTPUT_EVENTS = 200;
const MAX_OUTPUT_LINE_BYTES = 16 * 1024;
const MAX_STREAM_BUFFER_BYTES = 32 * 1024;
const MAX_SESSION_OUTPUT_BYTES = 256 * 1024;
const MAX_BACKPRESSURE_EVENTS = 10;
const OUTPUT_FLUSH_MS = 50;
const MAX_TASK_NAME_LENGTH = 200;
const MAX_PROMPT_LENGTH = 100_000;
const MAX_RETRIES = 3;
const MIN_RETRY_BACKOFF_MS = 100;
const MAX_RETRY_BACKOFF_MS = 30_000;
const MAX_RETRY_BUDGET_MS = 120_000;
const DEFAULT_RETRY_BACKOFF_MS = 1_000;
const DEFAULT_HEARTBEAT_STALE_MS = 15_000;
const MAX_RECOVERY_GRACE_MS = 10_000;
const MAX_TERMINATION_GRACE_MS = 5_000;
const DEFAULT_TERMINATION_GRACE_MS = 1_000;
const DEFAULT_AUTHORIZATION_GRANT_TTL_MS = 30_000;
const MAX_AUTHORIZATION_GRANT_TTL_MS = 60_000;
const MAX_AUTHORIZATION_TOMBSTONES = 200;
const ACTIVE_STATES = new Set<ConnectorRuntimeState>([
  'starting',
  'running',
  'stopping',
  'retrying',
  'recovering',
  'reattached'
]);
const NON_RETRYABLE_FAILURES = new Set<ConnectorFailureKind>([
  'timeout',
  'cancelled',
  'policy-blocked',
  'permission-denied'
]);

interface ConnectorRuntimeStream {
  on(event: 'data', listener: (chunk: unknown) => void): void;
  off(event: 'data', listener: (chunk: unknown) => void): void;
}

export interface ConnectorRuntimeProcess {
  pid?: number;
  stdout: ConnectorRuntimeStream;
  stderr: ConnectorRuntimeStream;
  on(event: 'spawn', listener: () => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
  on(event: 'close', listener: (code: number | null, signal: NodeJS.Signals | null) => void): void;
  off(event: 'spawn', listener: () => void): void;
  off(event: 'error', listener: (error: Error) => void): void;
  off(event: 'close', listener: (code: number | null, signal: NodeJS.Signals | null) => void): void;
  kill(): boolean;
}

export interface ConnectorSpawnOptions {
  cwd: string;
  env: Record<string, string>;
  shell: false;
  windowsHide: true;
}

export interface ConnectorFailureDecision {
  kind: ConnectorFailureKind;
  message: string;
  retryable: boolean;
  exitCode?: number;
  signal?: NodeJS.Signals;
}

export interface ConnectorReattachProof {
  process: ConnectorRuntimeProcess;
  provenAt?: string;
}

export interface ConnectorRuntimeDependencies {
  loadPolicy: () => ConnectorPolicyConfig | null;
  resolveExecutable: (command: string) => string | null;
  spawnProcess: (file: string, args: string[], options: ConnectorSpawnOptions) => ConnectorRuntimeProcess;
  workspaceRoot: string;
  sourceEnv: NodeJS.ProcessEnv;
  publish: (snapshot: ConnectorRuntimeSnapshot) => void;
  authorizeRun?: (request: ConnectorRunRequest) => ConnectorAuthorizationDecision;
  loadPersistedSnapshot?: () => unknown;
  persistSnapshot?: (snapshot: ConnectorRuntimeSnapshot) => void;
  reattachProcess?: (session: ConnectorSession) => ConnectorReattachProof | null;
  classifyFailure?: (failure: ConnectorFailureDecision) => ConnectorFailureDecision;
  heartbeatStaleAfterMs?: number;
  recoveryGraceMs?: number;
  terminationGraceMs?: number;
  outputFlushMs?: number;
  now?: () => Date;
  createId?: () => string;
  setTimer?: (callback: () => void, timeoutMs: number) => NodeJS.Timeout;
  clearTimer?: (timer: NodeJS.Timeout) => void;
}

export type ConnectorAuthorizationBlockedReason = Extract<
  ConnectorRuntimeBlockedReason,
  | 'confirmation-required'
  | 'authorization-cancelled'
  | 'authorization-expired'
  | 'authorization-intent-mismatch'
  | 'authorization-invalid'
  | 'authorization-policy-drift'
  | 'authorization-replayed'
  | 'request-invalid'
  | 'runtime-unavailable'
>;

export type ConnectorAuthorizationDecision =
  | { authorized: true }
  | { authorized: false; blockedReason: ConnectorAuthorizationBlockedReason };

export interface ConnectorRunAuthorizerDependencies {
  loadPolicy: () => ConnectorPolicyConfig | null;
  grantTtlMs?: number;
  now?: () => Date;
  createId?: () => string;
  setTimer?: (callback: () => void, timeoutMs: number) => NodeJS.Timeout;
  clearTimer?: (timer: NodeJS.Timeout) => void;
}

interface ConnectorAuthorizationGrantRecord {
  grantId: string;
  intentKey: string;
  policyFingerprint: string;
  expiresAtMs: number;
  expiryTimer: NodeJS.Timeout;
}

export class ConnectorRunAuthorizer {
  private readonly now: () => Date;
  private readonly createId: () => string;
  private readonly setTimer: (callback: () => void, timeoutMs: number) => NodeJS.Timeout;
  private readonly clearTimer: (timer: NodeJS.Timeout) => void;
  private readonly grantTtlMs: number;
  private readonly grants = new Map<string, ConnectorAuthorizationGrantRecord>();
  private readonly tombstones = new Map<string, ConnectorAuthorizationBlockedReason>();
  private disposed = false;

  constructor(private readonly dependencies: ConnectorRunAuthorizerDependencies) {
    this.now = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? (() => crypto.randomUUID());
    this.setTimer = dependencies.setTimer ?? ((callback, timeoutMs) => setTimeout(callback, timeoutMs));
    this.clearTimer = dependencies.clearTimer ?? ((timer) => clearTimeout(timer));
    this.grantTtlMs = clampInteger(
      dependencies.grantTtlMs,
      1,
      MAX_AUTHORIZATION_GRANT_TTL_MS,
      DEFAULT_AUTHORIZATION_GRANT_TTL_MS
    );
  }

  issueConfirmedGrant(input: unknown): ConnectorAuthorizationResult {
    const intent = normalizeConnectorRunIntent(input);
    if (!intent) {
      return authorizationBlocked(readConnectorId(input), 'request-invalid');
    }
    if (this.disposed) {
      return authorizationBlocked(intent.connectorId, 'runtime-unavailable');
    }

    const grantId = `connector-grant-${this.createId()}`;
    const expiresAtMs = this.now().getTime() + this.grantTtlMs;
    const expiryTimer = this.setTimer(() => {
      const grant = this.grants.get(grantId);
      if (!grant) {
        return;
      }
      this.grants.delete(grantId);
      this.recordTombstone(grantId, 'authorization-expired');
    }, this.grantTtlMs);
    this.grants.set(grantId, {
      grantId,
      intentKey: createRunIntentKey(intent),
      policyFingerprint: this.readPolicyFingerprint(),
      expiresAtMs,
      expiryTimer
    });
    return {
      status: 'granted',
      connectorId: intent.connectorId,
      grantId,
      expiresAt: new Date(expiresAtMs).toISOString()
    };
  }

  consume(request: ConnectorRunRequest): ConnectorAuthorizationDecision {
    if (this.disposed) {
      return { authorized: false, blockedReason: 'runtime-unavailable' };
    }
    const grantId = normalizeIdentifier(request.authorizationGrant);
    if (!grantId) {
      return { authorized: false, blockedReason: 'confirmation-required' };
    }
    const priorReason = this.tombstones.get(grantId);
    if (priorReason) {
      return { authorized: false, blockedReason: priorReason };
    }
    const grant = this.grants.get(grantId);
    if (!grant) {
      return { authorized: false, blockedReason: 'authorization-invalid' };
    }

    this.grants.delete(grantId);
    this.clearTimer(grant.expiryTimer);
    if (this.now().getTime() >= grant.expiresAtMs) {
      this.recordTombstone(grantId, 'authorization-expired');
      return { authorized: false, blockedReason: 'authorization-expired' };
    }
    const intent = normalizeConnectorRunIntent(request);
    if (!intent || createRunIntentKey(intent) !== grant.intentKey) {
      this.recordTombstone(grantId, 'authorization-intent-mismatch');
      return { authorized: false, blockedReason: 'authorization-intent-mismatch' };
    }
    if (this.readPolicyFingerprint() !== grant.policyFingerprint) {
      this.recordTombstone(grantId, 'authorization-policy-drift');
      return { authorized: false, blockedReason: 'authorization-policy-drift' };
    }
    this.recordTombstone(grantId, 'authorization-replayed');
    return { authorized: true };
  }

  cancel(grantIdInput: unknown): ConnectorAuthorizationCancelResult {
    const grantId = normalizeIdentifier(grantIdInput) ?? '';
    const grant = this.grants.get(grantId);
    if (!grant) {
      return { status: 'not-found', grantId };
    }
    this.grants.delete(grantId);
    this.clearTimer(grant.expiryTimer);
    this.recordTombstone(grantId, 'authorization-cancelled');
    return { status: 'cancelled', grantId };
  }

  dispose(): void {
    this.disposed = true;
    this.grants.forEach((grant) => this.clearTimer(grant.expiryTimer));
    this.grants.clear();
    this.tombstones.clear();
  }

  private readPolicyFingerprint() {
    try {
      return stableSerialize(this.dependencies.loadPolicy());
    } catch {
      return stableSerialize(null);
    }
  }

  private recordTombstone(grantId: string, reason: ConnectorAuthorizationBlockedReason) {
    this.tombstones.delete(grantId);
    this.tombstones.set(grantId, reason);
    while (this.tombstones.size > MAX_AUTHORIZATION_TOMBSTONES) {
      const oldest = this.tombstones.keys().next().value;
      if (typeof oldest !== 'string') {
        break;
      }
      this.tombstones.delete(oldest);
    }
  }
}

interface AdapterInvocation {
  args: string[];
  capabilities: string[] | null;
  capabilitySource: ConnectorCapabilitySource;
}

interface PreparedExecution extends AdapterInvocation {
  executable: string;
  options: ConnectorSpawnOptions;
  timeoutMs: number;
}

interface ExecutionPlan {
  taskId: string;
  sessionId: string;
  request: ConnectorRunRequest;
  retryPolicy: ConnectorRetryPolicy;
  budgetStartedAtMs: number;
  attempt: number;
}

interface PendingOutputLine {
  stream: 'stdout' | 'stderr';
  line: string;
  bytes: number;
  truncated: boolean;
}

interface PendingOutput {
  lines: PendingOutputLine[];
  receivedBytes: number;
  droppedBytes: number;
  truncatedLines: number;
}

interface TerminationIntent {
  desiredState: 'stopped' | 'timed-out' | 'error' | 'permission-denied';
  reason: ConnectorTerminationEvidence['reason'];
  failure: ConnectorFailureDecision;
  allowRetry: boolean;
}

interface ActiveExecution {
  taskId: string;
  process: ConnectorRuntimeProcess;
  timeoutTimer: NodeJS.Timeout;
  terminationTimer?: NodeJS.Timeout;
  terminationFinalTimer?: NodeJS.Timeout;
  outputFlushTimer?: NodeJS.Timeout;
  plan?: ExecutionPlan;
  spawnConfirmed: boolean;
  termination?: TerminationIntent;
  stdoutBuffer: string;
  stderrBuffer: string;
  pendingOutput: PendingOutput;
  onSpawn: () => void;
  onStdout: (chunk: unknown) => void;
  onStderr: (chunk: unknown) => void;
  onError: (error: Error) => void;
  onClose: (code: number | null, signal: NodeJS.Signals | null) => void;
}

type PrepareResult =
  | { prepared: true; execution: PreparedExecution }
  | { prepared: false; blockedReasons: ConnectorRuntimeBlockedReason[] };

export function selectDirectConnectorExecutable(
  candidates: string[],
  platform: NodeJS.Platform = process.platform
): string | null {
  const absoluteCandidates = candidates
    .map((candidate) => candidate.trim().replace(/^"|"$/g, ''))
    .filter((candidate) => platform === 'win32'
      ? /^(?:[a-zA-Z]:[\\/]|\\\\)/.test(candidate)
      : candidate.startsWith('/'));
  if (platform !== 'win32') {
    return absoluteCandidates[0] ?? null;
  }
  return absoluteCandidates.find((candidate) => /\.exe$/i.test(candidate))
    ?? absoluteCandidates.find((candidate) => /\.com$/i.test(candidate))
    ?? null;
}

export function computeHeartbeatFreshness(
  lastSeen: string | undefined,
  now: Date,
  staleAfterMs: number
): ProcessLivenessStatus {
  if (!lastSeen) {
    return 'unknown';
  }
  const timestamp = Date.parse(lastSeen);
  if (!Number.isFinite(timestamp)) {
    return 'unknown';
  }
  return now.getTime() - timestamp <= staleAfterMs ? 'fresh' : 'stale';
}

export function sanitizeRuntimeSnapshotForPersistence(
  snapshot: ConnectorRuntimeSnapshot,
  sensitiveTerms: string[] = []
): ConnectorRuntimeSnapshot {
  const terms = sensitiveTerms.filter((term) => term.length >= 4);
  return {
    version: 1,
    updatedAt: snapshot.updatedAt,
    tasks: snapshot.tasks.map((session) => ({
      ...session,
      capabilities: session.capabilities ? [...session.capabilities] : null,
      output: { ...session.output },
      termination: session.termination ? { ...session.termination } : undefined,
      liveness: { ...session.liveness },
      retryPolicy: { ...session.retryPolicy },
      events: session.events.map((event) => sanitizeEvent(event, terms))
    })),
    instances: snapshot.instances.map((instance) => ({
      ...instance,
      capabilities: instance.capabilities ? [...instance.capabilities] : null,
      liveness: { ...instance.liveness }
    })),
    runtime: { ...snapshot.runtime }
  };
}

export class ConnectorRuntime {
  private readonly now: () => Date;
  private readonly createId: () => string;
  private readonly setTimer: (callback: () => void, timeoutMs: number) => NodeJS.Timeout;
  private readonly clearTimer: (timer: NodeJS.Timeout) => void;
  private readonly heartbeatStaleAfterMs: number;
  private readonly recoveryGraceMs: number;
  private readonly terminationGraceMs: number;
  private readonly outputFlushMs: number;
  private readonly active = new Map<string, ActiveExecution>();
  private readonly plans = new Map<string, ExecutionPlan>();
  private readonly retryTimers = new Map<string, NodeJS.Timeout>();
  private readonly recoveryTimers = new Map<string, NodeJS.Timeout>();
  private readonly sensitivePrompts = new Map<string, string>();
  private snapshot: ConnectorRuntimeSnapshot;
  private eventSequence = 0;

  constructor(private readonly dependencies: ConnectorRuntimeDependencies) {
    this.now = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? (() => crypto.randomUUID());
    this.setTimer = dependencies.setTimer ?? ((callback, timeoutMs) => setTimeout(callback, timeoutMs));
    this.clearTimer = dependencies.clearTimer ?? ((timer) => clearTimeout(timer));
    this.heartbeatStaleAfterMs = clampInteger(
      dependencies.heartbeatStaleAfterMs,
      1,
      300_000,
      DEFAULT_HEARTBEAT_STALE_MS
    );
    this.recoveryGraceMs = clampInteger(
      dependencies.recoveryGraceMs,
      1,
      MAX_RECOVERY_GRACE_MS,
      MAX_RECOVERY_GRACE_MS
    );
    this.terminationGraceMs = clampInteger(
      dependencies.terminationGraceMs,
      1,
      MAX_TERMINATION_GRACE_MS,
      DEFAULT_TERMINATION_GRACE_MS
    );
    this.outputFlushMs = clampInteger(dependencies.outputFlushMs, 1, 1_000, OUTPUT_FLUSH_MS);
    this.snapshot = this.loadPersistedSnapshot();
    this.eventSequence = this.snapshot.tasks.reduce((maximum, session) => (
      Math.max(maximum, ...session.events.map((event) => event.sequence), 0)
    ), 0);
    this.recoverPersistedSessions();
  }

  getSnapshot(): ConnectorRuntimeSnapshot {
    const now = this.now();
    const tasks = this.snapshot.tasks.map((session) => cloneSessionWithFreshness(session, now));
    const recovering = tasks.some((session) => session.state === 'recovering');
    const recoveredActive = tasks.some((session) => (
      session.source === 'restart-recovery' && ACTIVE_STATES.has(session.state)
    ));
    return {
      version: 1,
      updatedAt: this.snapshot.updatedAt,
      tasks,
      instances: buildAgentInstances(tasks),
      runtime: createRuntimeEnvelope(
        recovering ? 'recovering' : 'available',
        now,
        recoveredActive ? 'persisted-recovery' : 'electron-main'
      )
    };
  }

  getSessionAudit(sessionId: unknown): ConnectorSessionAudit | null {
    const normalizedSessionId = normalizeIdentifier(sessionId);
    const session = normalizedSessionId
      ? this.getSnapshot().tasks.find((candidate) => candidate.sessionId === normalizedSessionId)
      : null;
    if (!session) {
      return null;
    }
    return {
      taskId: session.taskId,
      sessionId: session.sessionId,
      connectorId: session.connectorId,
      agentId: session.agentId,
      state: session.state,
      source: session.source,
      attempt: session.attempt,
      maxAttempts: session.maxAttempts,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      failureKind: session.failureKind,
      output: { ...session.output },
      termination: session.termination ? { ...session.termination } : undefined,
      events: session.events.map((event) => ({ ...event }))
    };
  }

  start(input: unknown): ConnectorRunResult {
    const request = normalizeRunRequest(input);
    if (!request) {
      return blockedResult(readConnectorId(input), ['request-invalid']);
    }

    const retryPolicy = normalizeRetryPolicy(request.retry);
    const taskId = `connector-task-${this.createId()}`;
    const sessionId = `connector-session-${this.createId()}`;
    this.sensitivePrompts.set(taskId, request.prompt);
    this.replaceSession({
      taskId,
      sessionId,
      connectorId: request.connectorId,
      agentId: request.agentId,
      taskName: request.taskName,
      requestedBy: request.requestedBy,
      source: 'runtime-spawn',
      capabilities: null,
      capabilitySource: 'unknown',
      state: 'starting',
      startedAt: this.now().toISOString(),
      attempt: 0,
      maxAttempts: retryPolicy.maxRetries + 1,
      retryPolicy,
      output: createOutputStats(),
      liveness: createUnknownLiveness(this.heartbeatStaleAfterMs),
      events: [this.createEvent(
        'lifecycle',
        'Connector session was created.',
        undefined,
        'session-created'
      )]
    });

    const authorization = this.authorizeRun(request);
    if (!authorization.authorized) {
      const reasons: ConnectorRuntimeBlockedReason[] = [authorization.blockedReason];
      this.blockSession(taskId, reasons);
      this.sensitivePrompts.delete(taskId);
      return blockedResult(request.connectorId, reasons, taskId, sessionId);
    }

    const prepared = this.prepareExecution(request);
    if (!prepared.prepared) {
      this.blockSession(taskId, prepared.blockedReasons);
      this.sensitivePrompts.delete(taskId);
      return blockedResult(request.connectorId, prepared.blockedReasons, taskId, sessionId);
    }

    const plan: ExecutionPlan = {
      taskId,
      sessionId,
      request,
      retryPolicy,
      budgetStartedAtMs: this.now().getTime(),
      attempt: 0
    };
    this.plans.set(taskId, plan);
    this.launchAttempt(plan, prepared.execution);
    return {
      status: 'accepted',
      connectorId: request.connectorId,
      taskId,
      sessionId
    };
  }

  stop(input: unknown): ConnectorStopResult {
    const request = normalizeStopRequest(input);
    if (!request) {
      return { status: 'not-found', taskId: readTaskId(input) };
    }
    const execution = this.active.get(request.taskId);
    if (execution) {
      this.requestTermination(execution, {
        desiredState: 'stopped',
        reason: 'user-cancel',
        failure: {
          kind: 'cancelled',
          message: 'Connector session was cancelled by the user.',
          retryable: false
        },
        allowRetry: false
      });
      return {
        status: this.active.get(request.taskId) === execution ? 'stopping' : 'stopped',
        taskId: request.taskId
      };
    }

    const retryTimer = this.retryTimers.get(request.taskId);
    const recoveryTimer = this.recoveryTimers.get(request.taskId);
    if (!retryTimer && !recoveryTimer) {
      return { status: 'not-found', taskId: request.taskId };
    }
    if (retryTimer) {
      this.clearTimer(retryTimer);
      this.retryTimers.delete(request.taskId);
    }
    if (recoveryTimer) {
      this.clearTimer(recoveryTimer);
      this.recoveryTimers.delete(request.taskId);
    }
    this.plans.delete(request.taskId);
    this.finishSession(request.taskId, 'stopped', {
      eventKind: 'lifecycle',
      message: 'Connector session was cancelled before a process was active.',
      failureKind: 'cancelled'
    });
    this.sensitivePrompts.delete(request.taskId);
    return { status: 'stopped', taskId: request.taskId };
  }

  dispose(): void {
    [...this.active.values()].forEach((execution) => {
      this.requestTermination(execution, {
        desiredState: 'error',
        reason: 'dispose',
        failure: {
          kind: 'cancelled',
          message: 'Runtime disposed before process exit could be observed.',
          retryable: false
        },
        allowRetry: false
      });
      this.abandonTermination(execution, 'Runtime disposed before process exit confirmation.');
    });
    const inactiveTaskIds = new Set([...this.retryTimers.keys(), ...this.recoveryTimers.keys()]);
    inactiveTaskIds.forEach((taskId) => this.stop({ taskId }));
  }

  private authorizeRun(request: ConnectorRunRequest): ConnectorAuthorizationDecision {
    try {
      const decision = this.dependencies.authorizeRun?.(request);
      if (decision?.authorized === true) {
        return { authorized: true };
      }
      if (decision?.authorized === false && isAuthorizationBlockedReason(decision.blockedReason)) {
        return decision;
      }
      return { authorized: false, blockedReason: 'confirmation-required' };
    } catch {
      return { authorized: false, blockedReason: 'authorization-invalid' };
    }
  }

  private prepareExecution(request: ConnectorRunRequest): PrepareResult {
    const policy = this.dependencies.loadPolicy();
    if (!policy) {
      return { prepared: false, blockedReasons: ['policy-unavailable'] };
    }
    let resolvedExecutable: string | null = null;
    const evaluation = evaluateConnectorPolicyGate(
      policy,
      {
        connectorId: request.connectorId,
        requestedBy: request.requestedBy,
        confirmationAccepted: true
      },
      (command) => {
        resolvedExecutable = this.dependencies.resolveExecutable(command);
        return resolvedExecutable !== null;
      }
    );
    if (!evaluation.result.executable) {
      return { prepared: false, blockedReasons: evaluation.result.blockedReasons };
    }
    const invocation = createConnectorInvocation(request.connectorId, evaluation.result.args, request.prompt);
    if (!invocation || !resolvedExecutable) {
      return { prepared: false, blockedReasons: ['adapter-unsupported'] };
    }
    if (evaluation.result.cwdPolicy !== 'workspace-root') {
      return { prepared: false, blockedReasons: ['cwd-policy-invalid'] };
    }
    return {
      prepared: true,
      execution: {
        executable: resolvedExecutable,
        args: invocation.args,
        capabilities: invocation.capabilities,
        capabilitySource: invocation.capabilitySource,
        options: {
          cwd: this.dependencies.workspaceRoot,
          env: createConnectorProcessEnv(this.dependencies.sourceEnv, evaluation.result.envAllowlist),
          shell: false,
          windowsHide: true
        },
        timeoutMs: evaluation.result.timeoutSeconds * 1000
      }
    };
  }

  private launchAttempt(plan: ExecutionPlan, preparedExecution?: PreparedExecution) {
    const prepared = preparedExecution
      ? { prepared: true as const, execution: preparedExecution }
      : this.prepareExecution(plan.request);
    if (!prepared.prepared) {
      this.blockSession(plan.taskId, prepared.blockedReasons);
      this.plans.delete(plan.taskId);
      this.sensitivePrompts.delete(plan.taskId);
      return;
    }

    plan.attempt += 1;
    this.updateSession(plan.taskId, (session) => ({
      ...session,
      state: 'starting',
      attempt: plan.attempt,
      pid: undefined,
      timeoutAt: new Date(this.now().getTime() + prepared.execution.timeoutMs).toISOString(),
      failureKind: undefined,
      termination: undefined,
      capabilities: prepared.execution.capabilities ? [...prepared.execution.capabilities] : null,
      capabilitySource: prepared.execution.capabilitySource,
      liveness: createUnknownLiveness(this.heartbeatStaleAfterMs),
      events: appendEvent(session.events, this.createEvent(
        'lifecycle',
        `Process attempt ${plan.attempt} was requested.`,
        { attempt: plan.attempt },
        'spawn-requested'
      ))
    }));

    let child: ConnectorRuntimeProcess;
    try {
      child = this.dependencies.spawnProcess(
        prepared.execution.executable,
        prepared.execution.args,
        prepared.execution.options
      );
    } catch (error) {
      this.handleFailure(plan, this.classifyFailure(createProcessError(error)));
      return;
    }
    const execution = this.createExecution(plan.taskId, child, prepared.execution.timeoutMs, plan, false);
    this.active.set(plan.taskId, execution);
  }

  private createExecution(
    taskId: string,
    child: ConnectorRuntimeProcess,
    timeoutMs: number,
    plan: ExecutionPlan | undefined,
    spawnConfirmed: boolean
  ): ActiveExecution {
    const execution = {} as ActiveExecution;
    execution.taskId = taskId;
    execution.process = child;
    execution.plan = plan;
    execution.spawnConfirmed = spawnConfirmed;
    execution.stdoutBuffer = '';
    execution.stderrBuffer = '';
    execution.pendingOutput = createPendingOutput();
    execution.onSpawn = () => this.confirmSpawn(execution);
    execution.onStdout = (chunk) => this.queueOutput(execution, 'stdout', chunk);
    execution.onStderr = (chunk) => this.queueOutput(execution, 'stderr', chunk);
    execution.onError = (error) => {
      if (this.active.get(taskId) !== execution || execution.termination) {
        return;
      }
      const failure = this.classifyFailure(createProcessError(error));
      this.requestTermination(execution, {
        desiredState: failure.kind === 'permission-denied' ? 'permission-denied' : 'error',
        reason: 'process-error',
        failure,
        allowRetry: true
      });
    };
    execution.onClose = (code, signal) => this.observeClose(execution, code, signal);
    execution.timeoutTimer = this.setTimer(() => {
      if (this.active.get(taskId) !== execution || execution.termination) {
        return;
      }
      this.clearTimer(execution.timeoutTimer);
      this.requestTermination(execution, {
        desiredState: 'timed-out',
        reason: 'timeout',
        failure: {
          kind: 'timeout',
          message: `Connector process exceeded its ${timeoutMs}ms timeout.`,
          retryable: false
        },
        allowRetry: false
      });
    }, timeoutMs);

    child.stdout.on('data', execution.onStdout);
    child.stderr.on('data', execution.onStderr);
    child.on('spawn', execution.onSpawn);
    child.on('error', execution.onError);
    child.on('close', execution.onClose);
    return execution;
  }

  private confirmSpawn(execution: ActiveExecution) {
    if (this.active.get(execution.taskId) !== execution || execution.spawnConfirmed) {
      return;
    }
    execution.spawnConfirmed = true;
    if (execution.termination) {
      return;
    }
    const seenAt = this.now().toISOString();
    this.updateSession(execution.taskId, (session) => {
      const alreadyStarted = hasLifecycle(session, 'session-started');
      return {
        ...session,
        state: 'running',
        pid: execution.process.pid,
        liveness: createFreshLiveness('process-event', seenAt, this.heartbeatStaleAfterMs),
        events: appendEvent(session.events, this.createEvent(
          'lifecycle',
          `OS confirmed process attempt ${session.attempt}.`,
          { attempt: session.attempt, evidence: 'child-process-spawn-event' },
          alreadyStarted ? 'attempt-started' : 'session-started'
        ))
      };
    });
  }

  private observeClose(
    execution: ActiveExecution,
    code: number | null,
    signal: NodeJS.Signals | null
  ) {
    if (this.active.get(execution.taskId) !== execution) {
      return;
    }
    this.flushBufferedOutput(execution);
    this.cleanupExecution(execution);
    this.active.delete(execution.taskId);

    if (execution.termination) {
      this.finalizeTermination(execution, code, signal);
      return;
    }
    if (!execution.spawnConfirmed) {
      const failure = this.classifyFailure({
        kind: 'process-error',
        message: 'Process closed before an OS spawn confirmation event was observed.',
        retryable: false,
        exitCode: code ?? undefined,
        signal: signal ?? undefined
      });
      if (execution.plan) {
        this.handleFailure(execution.plan, failure);
      } else {
        this.finishSession(execution.taskId, 'error', {
          eventKind: 'error',
          message: failure.message,
          failureKind: failure.kind,
          exitCode: failure.exitCode,
          signal: failure.signal
        });
      }
      return;
    }
    if (code === 0) {
      this.plans.delete(execution.taskId);
      this.finishSession(execution.taskId, 'success', {
        eventKind: 'lifecycle',
        message: 'Process exit was confirmed with code 0.',
        exitCode: 0,
        signal
      });
      this.sensitivePrompts.delete(execution.taskId);
      return;
    }
    const failure = this.classifyFailure({
      kind: 'exit-code',
      message: `Process exit was confirmed with code ${code ?? 'unknown'}.`,
      retryable: false,
      exitCode: code ?? undefined,
      signal: signal ?? undefined
    });
    if (execution.plan) {
      this.handleFailure(execution.plan, failure);
    } else {
      this.finishSession(execution.taskId, 'error', {
        eventKind: 'error',
        message: failure.message,
        failureKind: failure.kind,
        exitCode: failure.exitCode,
        signal: failure.signal
      });
    }
  }

  private requestTermination(execution: ActiveExecution, intent: TerminationIntent) {
    if (this.active.get(execution.taskId) !== execution || execution.termination) {
      return;
    }
    execution.termination = intent;
    this.clearTimer(execution.timeoutTimer);
    const requestedAt = this.now().toISOString();
    this.updateSession(execution.taskId, (session) => ({
      ...session,
      state: 'stopping',
      failureKind: intent.failure.kind,
      termination: {
        requestedAt,
        reason: intent.reason,
        killAttempts: 0,
        exitConfirmed: false
      },
      events: appendEvent(session.events, this.createEvent(
        intent.reason === 'timeout' ? 'timeout' : 'lifecycle',
        intent.failure.message,
        { reason: intent.reason },
        'stopping-requested'
      ))
    }));
    this.attemptTerminationKill(execution);
    if (this.active.get(execution.taskId) !== execution || !execution.termination) {
      return;
    }
    execution.terminationTimer = this.setTimer(() => {
      if (this.active.get(execution.taskId) !== execution || !execution.termination) {
        return;
      }
      if (execution.terminationTimer) {
        this.clearTimer(execution.terminationTimer);
        execution.terminationTimer = undefined;
      }
      const escalatedAt = this.now().toISOString();
      this.updateSession(execution.taskId, (session) => ({
        ...session,
        termination: session.termination ? { ...session.termination, escalatedAt } : session.termination,
        events: appendEvent(session.events, this.createEvent(
          'lifecycle',
          'Termination grace elapsed; kill was escalated.',
          { graceMs: this.terminationGraceMs },
          'termination-escalated'
        ))
      }));
      this.attemptTerminationKill(execution);
      if (this.active.get(execution.taskId) !== execution || !execution.termination) {
        return;
      }
      execution.terminationFinalTimer = this.setTimer(() => {
        if (this.active.get(execution.taskId) !== execution || !execution.termination) {
          return;
        }
        if (execution.terminationFinalTimer) {
          this.clearTimer(execution.terminationFinalTimer);
          execution.terminationFinalTimer = undefined;
        }
        this.abandonTermination(execution, 'Process exit was not confirmed after termination escalation.');
      }, this.terminationGraceMs);
    }, this.terminationGraceMs);
  }

  private attemptTerminationKill(execution: ActiveExecution) {
    this.updateSession(execution.taskId, (session) => ({
      ...session,
      termination: session.termination ? {
        ...session.termination,
        killAttempts: session.termination.killAttempts + 1
      } : session.termination
    }));
    const result = safeKill(execution.process);
    if (result.error && this.active.get(execution.taskId) === execution) {
      this.updateSession(execution.taskId, (session) => ({
        ...session,
        events: appendEvent(session.events, this.createEvent(
        'error',
        `Process kill attempt failed: ${result.error}`,
        { killReturned: result.killed }
        ))
      }));
    }
  }

  private finalizeTermination(
    execution: ActiveExecution,
    code: number | null,
    signal: NodeJS.Signals | null
  ) {
    const intent = execution.termination;
    if (!intent) {
      return;
    }
    this.updateSession(execution.taskId, (session) => ({
      ...session,
      termination: session.termination ? { ...session.termination, exitConfirmed: true } : session.termination
    }));
    const confirmedFailure = {
      ...intent.failure,
      exitCode: code ?? intent.failure.exitCode,
      signal: signal ?? intent.failure.signal
    };
    if (intent.allowRetry && execution.plan) {
      this.handleFailure(execution.plan, confirmedFailure);
      return;
    }
    this.plans.delete(execution.taskId);
    this.finishSession(execution.taskId, intent.desiredState, {
      eventKind: intent.reason === 'timeout' ? 'timeout' : 'lifecycle',
      message: `${intent.failure.message} Process exit was confirmed.`,
      failureKind: intent.failure.kind,
      exitCode: code,
      signal
    });
    this.sensitivePrompts.delete(execution.taskId);
  }

  private abandonTermination(execution: ActiveExecution, message: string) {
    if (this.active.get(execution.taskId) !== execution) {
      return;
    }
    this.flushBufferedOutput(execution);
    this.cleanupExecution(execution);
    this.active.delete(execution.taskId);
    this.plans.delete(execution.taskId);
    this.finishSession(execution.taskId, 'session-lost', {
      eventKind: 'error',
      message,
      failureKind: execution.termination?.failure.kind
    });
    this.sensitivePrompts.delete(execution.taskId);
  }

  private handleFailure(plan: ExecutionPlan, failure: ConnectorFailureDecision) {
    const delayMs = Math.min(
      MAX_RETRY_BACKOFF_MS,
      plan.retryPolicy.backoffMs * (2 ** Math.max(0, plan.attempt - 1))
    );
    const elapsedMs = Math.max(0, this.now().getTime() - plan.budgetStartedAtMs);
    const mayRetry = failure.retryable
      && !NON_RETRYABLE_FAILURES.has(failure.kind)
      && plan.attempt <= plan.retryPolicy.maxRetries
      && plan.retryPolicy.budgetMs > 0
      && elapsedMs + delayMs <= plan.retryPolicy.budgetMs;
    if (!mayRetry) {
      this.plans.delete(plan.taskId);
      this.finishSession(plan.taskId, failure.kind === 'permission-denied' ? 'permission-denied' : 'error', {
        eventKind: 'error',
        message: failure.message,
        failureKind: failure.kind,
        exitCode: failure.exitCode,
        signal: failure.signal
      });
      this.sensitivePrompts.delete(plan.taskId);
      return;
    }

    this.updateSession(plan.taskId, (session) => ({
      ...session,
      state: 'retrying',
      pid: undefined,
      failureKind: failure.kind,
      timeoutAt: undefined,
      liveness: createUnknownLiveness(this.heartbeatStaleAfterMs),
      events: appendEvent(session.events, this.createEvent(
        'retry',
        `Retry ${plan.attempt} scheduled after ${delayMs}ms.`,
        {
          failureKind: failure.kind,
          completedAttempt: plan.attempt,
          nextAttempt: plan.attempt + 1,
          delayMs,
          budgetRemainingMs: plan.retryPolicy.budgetMs - elapsedMs
        },
        'retry-scheduled'
      ))
    }));
    const timer = this.setTimer(() => {
      if (this.retryTimers.get(plan.taskId) !== timer) {
        return;
      }
      this.clearTimer(timer);
      this.retryTimers.delete(plan.taskId);
      this.updateSession(plan.taskId, (session) => ({
        ...session,
        events: appendEvent(session.events, this.createEvent(
          'retry',
          'Retry backoff elapsed.',
          undefined,
          'retry-started'
        ))
      }));
      this.launchAttempt(plan);
    }, delayMs);
    this.retryTimers.set(plan.taskId, timer);
  }

  private classifyFailure(failure: ConnectorFailureDecision): ConnectorFailureDecision {
    const permissionDenied = isPermissionError(failure.message);
    const normalized = permissionDenied
      ? { ...failure, kind: 'permission-denied' as const, retryable: false }
      : failure;
    let classified = normalized;
    try {
      classified = this.dependencies.classifyFailure?.({ ...normalized }) ?? normalized;
    } catch {
      classified = normalized;
    }
    return {
      ...classified,
      kind: permissionDenied ? 'permission-denied' : classified.kind,
      retryable: permissionDenied || NON_RETRYABLE_FAILURES.has(classified.kind)
        ? false
        : classified.retryable === true
    };
  }

  private blockSession(taskId: string, blockedReasons: ConnectorRuntimeBlockedReason[]) {
    const permissionDenied = blockedReasons.includes('approval-not-accepted')
      || blockedReasons.includes('confirmation-required')
      || blockedReasons.some((reason) => reason.startsWith('authorization-'));
    this.finishSession(taskId, permissionDenied ? 'permission-denied' : 'policy-blocked', {
      eventKind: 'policy',
      message: 'Connector execution was blocked before discovery or spawn.',
      failureKind: permissionDenied ? 'permission-denied' : 'policy-blocked',
      payload: { blockedReasons }
    });
  }

  private queueOutput(execution: ActiveExecution, stream: 'stdout' | 'stderr', chunk: unknown) {
    if (this.active.get(execution.taskId) !== execution) {
      return;
    }
    const raw = String(chunk);
    const receivedBytes = Buffer.byteLength(raw);
    execution.pendingOutput.receivedBytes += receivedBytes;
    if (!execution.spawnConfirmed) {
      execution.pendingOutput.droppedBytes += receivedBytes;
      execution.pendingOutput.truncatedLines += 1;
      this.scheduleOutputFlush(execution);
      return;
    }

    const boundedChunk = truncateUtf8(raw, MAX_STREAM_BUFFER_BYTES);
    execution.pendingOutput.droppedBytes += boundedChunk.droppedBytes;
    const previous = stream === 'stdout' ? execution.stdoutBuffer : execution.stderrBuffer;
    const combined = truncateUtf8(`${previous}${boundedChunk.text}`, MAX_STREAM_BUFFER_BYTES);
    execution.pendingOutput.droppedBytes += combined.droppedBytes;
    const parts = combined.text.split(/\r?\n/);
    let remainder = parts.pop() ?? '';
    parts.forEach((line) => this.queueOutputLine(execution, stream, line, false));
    if (Buffer.byteLength(remainder) >= MAX_OUTPUT_LINE_BYTES) {
      this.queueOutputLine(execution, stream, remainder, true);
      remainder = '';
    }
    if (stream === 'stdout') {
      execution.stdoutBuffer = remainder;
    } else {
      execution.stderrBuffer = remainder;
    }
    this.scheduleOutputFlush(execution);
  }

  private queueOutputLine(
    execution: ActiveExecution,
    stream: 'stdout' | 'stderr',
    line: string,
    forcedTruncation: boolean
  ) {
    if (!line) {
      return;
    }
    const bounded = truncateUtf8(line, MAX_OUTPUT_LINE_BYTES);
    const bytes = Buffer.byteLength(bounded.text);
    const truncated = forcedTruncation || bounded.droppedBytes > 0;
    execution.pendingOutput.droppedBytes += bounded.droppedBytes;
    if (truncated) {
      execution.pendingOutput.truncatedLines += 1;
    }
    if (execution.pendingOutput.lines.length >= MAX_OUTPUT_EVENTS) {
      execution.pendingOutput.droppedBytes += bytes;
      return;
    }
    execution.pendingOutput.lines.push({ stream, line: bounded.text, bytes, truncated });
  }

  private scheduleOutputFlush(execution: ActiveExecution) {
    if (execution.outputFlushTimer) {
      return;
    }
    execution.outputFlushTimer = this.setTimer(() => {
      if (execution.outputFlushTimer) {
        this.clearTimer(execution.outputFlushTimer);
        execution.outputFlushTimer = undefined;
      }
      if (this.active.get(execution.taskId) === execution) {
        this.flushPendingOutput(execution);
      }
    }, this.outputFlushMs);
  }

  private flushBufferedOutput(execution: ActiveExecution) {
    if (execution.stdoutBuffer) {
      this.queueOutputLine(execution, 'stdout', execution.stdoutBuffer, false);
      execution.stdoutBuffer = '';
    }
    if (execution.stderrBuffer) {
      this.queueOutputLine(execution, 'stderr', execution.stderrBuffer, false);
      execution.stderrBuffer = '';
    }
    this.flushPendingOutput(execution);
  }

  private flushPendingOutput(execution: ActiveExecution) {
    if (execution.outputFlushTimer) {
      this.clearTimer(execution.outputFlushTimer);
      execution.outputFlushTimer = undefined;
    }
    const pending = execution.pendingOutput;
    if (pending.receivedBytes === 0 && pending.lines.length === 0 && pending.droppedBytes === 0) {
      return;
    }
    execution.pendingOutput = createPendingOutput();
    const seenAt = this.now().toISOString();
    this.updateSession(execution.taskId, (session) => {
      const output = { ...session.output };
      let events = session.events;
      let droppedBytes = pending.droppedBytes;
      let truncatedLines = pending.truncatedLines;
      for (const entry of pending.lines) {
        const redacted = this.redactText(entry.line);
        const archivedBytes = Buffer.byteLength(redacted);
        if (
          output.outputEvents >= MAX_OUTPUT_EVENTS
          || output.archivedBytes + archivedBytes > MAX_SESSION_OUTPUT_BYTES
        ) {
          droppedBytes += entry.bytes;
          if (!entry.truncated) {
            truncatedLines += 1;
          }
          continue;
        }
        output.outputEvents += 1;
        output.archivedBytes += archivedBytes;
        events = appendEvent(events, this.createEvent(
          entry.stream,
          redacted,
          parseJsonLine(redacted)
        ));
      }
      output.receivedBytes += pending.receivedBytes;
      output.droppedBytes += droppedBytes;
      output.truncatedLines += truncatedLines;
      if ((droppedBytes > 0 || truncatedLines > 0) && output.backpressureEvents < MAX_BACKPRESSURE_EVENTS) {
        output.backpressureEvents += 1;
        events = appendEvent(events, this.createEvent(
          'lifecycle',
          'Output was truncated or dropped by runtime bounds.',
          {
            droppedBytes,
            truncatedLines,
            maxLineBytes: MAX_OUTPUT_LINE_BYTES,
            maxSessionBytes: MAX_SESSION_OUTPUT_BYTES,
            maxOutputEvents: MAX_OUTPUT_EVENTS
          },
          'output-truncated'
        ));
      }
      return {
        ...session,
        output,
        liveness: execution.spawnConfirmed
          ? createFreshLiveness('process-event', seenAt, this.heartbeatStaleAfterMs)
          : session.liveness,
        events
      };
    });
  }

  private recoverPersistedSessions() {
    const recoverable = this.snapshot.tasks.filter((session) => ACTIVE_STATES.has(session.state));
    if (recoverable.length === 0) {
      return;
    }
    recoverable.forEach((session) => {
      this.updateSessionInternal(session.taskId, (current) => ({
        ...current,
        source: 'restart-recovery',
        state: 'recovering',
        pid: undefined,
        termination: undefined,
        liveness: createUnknownLiveness(this.heartbeatStaleAfterMs),
        events: appendEvent(current.events, this.createEvent(
          'recovery',
          'Persisted active session entered recovery; prior running state was not trusted.',
          undefined,
          'recovery-started'
        ))
      }));
      const recovering = this.snapshot.tasks.find((candidate) => candidate.taskId === session.taskId);
      let proof: ConnectorReattachProof | null = null;
      try {
        proof = recovering && this.dependencies.reattachProcess
          ? this.dependencies.reattachProcess(cloneSession(recovering))
          : null;
      } catch {
        proof = null;
      }
      if (proof && recovering) {
        const provenAt = normalizeIsoDate(proof.provenAt) ?? this.now().toISOString();
        this.updateSessionInternal(session.taskId, (current) => ({
          ...current,
          state: 'reattached',
          pid: proof?.process.pid,
          liveness: createFreshLiveness('recovery-proof', provenAt, this.heartbeatStaleAfterMs),
          events: appendEvent(current.events, this.createEvent(
            'recovery',
            'Injected process proof reattached the persisted session.',
            undefined,
            'recovery-reattached'
          ))
        }));
        const remainingTimeout = Math.max(
          1,
          (Date.parse(recovering.timeoutAt ?? '') || this.now().getTime() + this.recoveryGraceMs) - this.now().getTime()
        );
        const execution = this.createExecution(session.taskId, proof.process, remainingTimeout, undefined, true);
        this.active.set(session.taskId, execution);
        return;
      }
      const timer = this.setTimer(() => {
        if (this.recoveryTimers.get(session.taskId) !== timer) {
          return;
        }
        this.clearTimer(timer);
        this.recoveryTimers.delete(session.taskId);
        this.finishSession(session.taskId, 'session-lost', {
          eventKind: 'recovery',
          message: 'No process reattachment proof arrived before the recovery deadline.'
        });
      }, this.recoveryGraceMs);
      this.recoveryTimers.set(session.taskId, timer);
    });
    this.publishCurrent();
  }

  private finishSession(
    taskId: string,
    state: Exclude<ConnectorRuntimeState, 'starting' | 'running' | 'stopping' | 'retrying' | 'recovering' | 'reattached'>,
    details: {
      exitCode?: number | null;
      signal?: string | null;
      eventKind: ConnectorRuntimeEventKind;
      message: string;
      failureKind?: ConnectorFailureKind;
      payload?: unknown;
    }
  ) {
    const current = this.snapshot.tasks.find((session) => session.taskId === taskId);
    if (!current || hasLifecycle(current, 'session-terminal')) {
      return;
    }
    this.updateSession(taskId, (session) => ({
      ...session,
      state,
      endedAt: this.now().toISOString(),
      exitCode: details.exitCode ?? undefined,
      signal: details.signal ?? undefined,
      failureKind: details.failureKind,
      events: appendEvent(session.events, this.createEvent(
        details.eventKind,
        details.message,
        {
          ...(isRecord(details.payload) ? details.payload : {}),
          terminalState: state,
          failureKind: details.failureKind
        },
        'session-terminal'
      ))
    }));
  }

  private createEvent(
    kind: ConnectorRuntimeEventKind,
    message: string,
    payload?: unknown,
    lifecycle?: ConnectorLifecycleSubtype
  ): ConnectorRuntimeEvent {
    this.eventSequence += 1;
    const terms = [...this.sensitivePrompts.values()];
    return {
      eventId: `connector-event-${this.eventSequence}-${this.createId()}`,
      sequence: this.eventSequence,
      timestamp: this.now().toISOString(),
      kind,
      message: redactText(message, terms),
      ...(lifecycle ? { lifecycle } : {}),
      ...(payload === undefined ? {} : { payload: redactValue(payload, terms) })
    };
  }

  private redactText(value: string) {
    return redactText(value, [...this.sensitivePrompts.values()]);
  }

  private cleanupExecution(execution: ActiveExecution) {
    this.clearTimer(execution.timeoutTimer);
    if (execution.terminationTimer) {
      this.clearTimer(execution.terminationTimer);
      execution.terminationTimer = undefined;
    }
    if (execution.terminationFinalTimer) {
      this.clearTimer(execution.terminationFinalTimer);
      execution.terminationFinalTimer = undefined;
    }
    if (execution.outputFlushTimer) {
      this.clearTimer(execution.outputFlushTimer);
      execution.outputFlushTimer = undefined;
    }
    execution.process.stdout.off('data', execution.onStdout);
    execution.process.stderr.off('data', execution.onStderr);
    execution.process.off('spawn', execution.onSpawn);
    execution.process.off('error', execution.onError);
    execution.process.off('close', execution.onClose);
  }

  private loadPersistedSnapshot(): ConnectorRuntimeSnapshot {
    if (!this.dependencies.loadPersistedSnapshot) {
      return emptySnapshot(this.now());
    }
    try {
      return normalizePersistedSnapshot(
        this.dependencies.loadPersistedSnapshot(),
        this.now(),
        this.heartbeatStaleAfterMs
      );
    } catch {
      return emptySnapshot(this.now());
    }
  }

  private replaceSession(session: ConnectorSession) {
    this.snapshot = {
      version: 1,
      updatedAt: this.now().toISOString(),
      tasks: [session, ...this.snapshot.tasks.filter((current) => current.taskId !== session.taskId)]
        .slice(0, MAX_RUNTIME_SESSIONS),
      instances: [],
      runtime: createRuntimeEnvelope('available', this.now())
    };
    this.publishCurrent();
  }

  private updateSession(taskId: string, updater: (session: ConnectorSession) => ConnectorSession) {
    if (this.updateSessionInternal(taskId, updater)) {
      this.publishCurrent();
    }
  }

  private updateSessionInternal(taskId: string, updater: (session: ConnectorSession) => ConnectorSession) {
    let changed = false;
    const tasks = this.snapshot.tasks.map((session) => {
      if (session.taskId !== taskId) {
        return session;
      }
      const next = updater(session);
      changed = next !== session;
      return next;
    });
    if (!changed) {
      return false;
    }
    this.snapshot = {
      version: 1,
      updatedAt: this.now().toISOString(),
      tasks,
      instances: [],
      runtime: createRuntimeEnvelope(
        tasks.some((session) => session.state === 'recovering') ? 'recovering' : 'available',
        this.now()
      )
    };
    return true;
  }

  private publishCurrent() {
    const runtimeSnapshot = this.getSnapshot();
    if (this.dependencies.persistSnapshot) {
      try {
        this.dependencies.persistSnapshot(sanitizeRuntimeSnapshotForPersistence(
          runtimeSnapshot,
          [...this.sensitivePrompts.values()]
        ));
      } catch {
        // Persistence failure must not break runtime cleanup.
      }
    }
    this.dependencies.publish(runtimeSnapshot);
  }
}

function createConnectorInvocation(
  connectorId: string,
  policyArgs: string[],
  prompt: string
): AdapterInvocation | null {
  if (connectorId !== 'codex') {
    return null;
  }
  return {
    args: ['exec', '--json', '--skip-git-repo-check', ...policyArgs, prompt],
    capabilities: ['structured-json-events', 'task-execution'],
    capabilitySource: 'adapter-declaration'
  };
}

function normalizeRunRequest(input: unknown): ConnectorRunRequest | null {
  if (!isRecord(input)) {
    return null;
  }
  const connectorId = normalizeIdentifier(input.connectorId);
  const agentId = normalizeIdentifier(input.agentId);
  const taskName = normalizeText(input.taskName, MAX_TASK_NAME_LENGTH);
  const prompt = normalizeText(input.prompt, MAX_PROMPT_LENGTH);
  const requestedBy = input.requestedBy === 'default-action' || input.requestedBy === 'explicit-user-action'
    ? input.requestedBy
    : null;
  if (!connectorId || !agentId || !taskName || !prompt || !requestedBy) {
    return null;
  }
  return {
    connectorId,
    agentId,
    taskName,
    prompt,
    requestedBy,
    authorizationGrant: normalizeIdentifier(input.authorizationGrant) ?? undefined,
    retry: isRecord(input.retry) ? {
      maxRetries: numberOrUndefined(input.retry.maxRetries),
      backoffMs: numberOrUndefined(input.retry.backoffMs),
      budgetMs: numberOrUndefined(input.retry.budgetMs)
    } : undefined
  };
}

export function normalizeConnectorRunIntent(input: unknown): ConnectorAuthorizationIntent | null {
  if (!isRecord(input)) {
    return null;
  }
  const connectorId = normalizeIdentifier(input.connectorId);
  const agentId = normalizeIdentifier(input.agentId);
  const taskName = normalizeText(input.taskName, MAX_TASK_NAME_LENGTH);
  const prompt = normalizeText(input.prompt, MAX_PROMPT_LENGTH);
  if (!connectorId || !agentId || !taskName || !prompt) {
    return null;
  }
  const retry = normalizeRetryPolicy(isRecord(input.retry) ? {
    maxRetries: numberOrUndefined(input.retry.maxRetries),
    backoffMs: numberOrUndefined(input.retry.backoffMs),
    budgetMs: numberOrUndefined(input.retry.budgetMs)
  } : undefined);
  return {
    connectorId,
    agentId,
    taskName,
    prompt,
    retry
  };
}

function normalizeRetryPolicy(input: ConnectorRetryPolicyInput | undefined): ConnectorRetryPolicy {
  const maxRetries = Number.isInteger(input?.maxRetries)
    && Number(input?.maxRetries) >= 0
    && Number(input?.maxRetries) <= MAX_RETRIES
    ? Number(input?.maxRetries)
    : 0;
  return {
    maxRetries,
    backoffMs: clampInteger(
      input?.backoffMs,
      MIN_RETRY_BACKOFF_MS,
      MAX_RETRY_BACKOFF_MS,
      DEFAULT_RETRY_BACKOFF_MS
    ),
    budgetMs: maxRetries === 0
      ? 0
      : clampInteger(input?.budgetMs, MIN_RETRY_BACKOFF_MS, MAX_RETRY_BUDGET_MS, 0)
  };
}

function normalizeStopRequest(input: unknown): ConnectorStopRequest | null {
  if (!isRecord(input)) {
    return null;
  }
  const taskId = normalizeIdentifier(input.taskId);
  return taskId ? { taskId } : null;
}

function blockedResult(
  connectorId: string,
  blockedReasons: ConnectorRuntimeBlockedReason[],
  taskId?: string,
  sessionId?: string
): ConnectorRunResult {
  return {
    status: 'blocked',
    connectorId,
    blockedReasons,
    ...(taskId ? { taskId } : {}),
    ...(sessionId ? { sessionId } : {})
  };
}

function authorizationBlocked(
  connectorId: string,
  blockedReason: ConnectorAuthorizationBlockedReason
): ConnectorAuthorizationResult {
  return {
    status: 'blocked',
    connectorId,
    blockedReasons: [blockedReason]
  };
}

function isAuthorizationBlockedReason(value: unknown): value is ConnectorAuthorizationBlockedReason {
  return typeof value === 'string' && [
    'confirmation-required',
    'authorization-cancelled',
    'authorization-expired',
    'authorization-intent-mismatch',
    'authorization-invalid',
    'authorization-policy-drift',
    'authorization-replayed',
    'request-invalid',
    'runtime-unavailable'
  ].includes(value);
}

function createRunIntentKey(intent: ConnectorAuthorizationIntent) {
  return stableSerialize({
    connectorId: intent.connectorId,
    agentId: intent.agentId,
    taskName: intent.taskName,
    prompt: intent.prompt,
    retry: normalizeRetryPolicy(intent.retry)
  });
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${stableSerialize(value[key])}`
    )).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function buildAgentInstances(sessions: ConnectorSession[]): AgentInstance[] {
  const byAgent = new Map<string, ConnectorSession[]>();
  sessions.forEach((session) => {
    byAgent.set(session.agentId, [...(byAgent.get(session.agentId) ?? []), session]);
  });
  return [...byAgent.values()].map((candidates) => {
    const session = [...candidates].sort(compareSessionsForInstance)[0];
    const active = ACTIVE_STATES.has(session.state);
    const status = active
      ? (session.liveness.status === 'fresh' ? 'busy' : 'degraded')
      : 'offline';
    return {
      instanceId: `${session.connectorId}:${session.agentId}`,
      agentId: session.agentId,
      connectorId: session.connectorId,
      status,
      source: session.state === 'session-lost'
        ? 'session-lost'
        : (session.liveness.source === 'recovery-proof' ? 'recovery-proof' : 'connector-runtime'),
      lastSeen: session.liveness.lastSeen,
      capabilities: session.capabilities ? [...session.capabilities] : null,
      capabilitySource: session.capabilitySource,
      sessionId: session.sessionId,
      liveness: { ...session.liveness }
    };
  });
}

function compareSessionsForInstance(left: ConnectorSession, right: ConnectorSession) {
  const scoreDifference = sessionInstanceScore(right) - sessionInstanceScore(left);
  if (scoreDifference !== 0) {
    return scoreDifference;
  }
  const timeDifference = Date.parse(right.startedAt) - Date.parse(left.startedAt);
  return timeDifference !== 0 ? timeDifference : left.sessionId.localeCompare(right.sessionId);
}

function sessionInstanceScore(session: ConnectorSession) {
  if (ACTIVE_STATES.has(session.state) && session.liveness.status === 'fresh') {
    return 3;
  }
  if (ACTIVE_STATES.has(session.state)) {
    return 2;
  }
  return 1;
}

function createOutputStats(): ConnectorOutputStats {
  return {
    receivedBytes: 0,
    archivedBytes: 0,
    droppedBytes: 0,
    outputEvents: 0,
    truncatedLines: 0,
    backpressureEvents: 0
  };
}

function createPendingOutput(): PendingOutput {
  return { lines: [], receivedBytes: 0, droppedBytes: 0, truncatedLines: 0 };
}

function createUnknownLiveness(staleAfterMs: number): ProcessLivenessEvidence {
  return { status: 'unknown', source: 'none', staleAfterMs };
}

function createFreshLiveness(
  source: Exclude<ProcessLivenessSource, 'none'>,
  lastSeen: string,
  staleAfterMs: number
): ProcessLivenessEvidence {
  return { status: 'fresh', source, lastSeen, staleAfterMs };
}

function refreshLiveness(liveness: ProcessLivenessEvidence, now: Date): ProcessLivenessEvidence {
  return {
    ...liveness,
    status: computeHeartbeatFreshness(liveness.lastSeen, now, liveness.staleAfterMs)
  };
}

function hasLifecycle(session: ConnectorSession, lifecycle: ConnectorLifecycleSubtype) {
  return session.events.some((event) => event.lifecycle === lifecycle);
}

function appendEvent(events: ConnectorRuntimeEvent[], event: ConnectorRuntimeEvent) {
  return [...events, event].slice(-MAX_RUNTIME_EVENTS);
}

function parseJsonLine(line: string): unknown {
  try {
    return JSON.parse(line) as unknown;
  } catch {
    return undefined;
  }
}

function createProcessError(error: unknown): ConnectorFailureDecision {
  return {
    kind: 'process-error',
    message: formatError(error),
    retryable: false
  };
}

function isPermissionError(message: string) {
  return /\b(?:EACCES|EPERM)\b|permission denied|access denied/i.test(message);
}

function safeKill(process: ConnectorRuntimeProcess) {
  try {
    const killed = process.kill();
    return { killed, error: killed ? null : 'kill returned false' };
  } catch (error) {
    return { killed: false, error: formatError(error) };
  }
}

function truncateUtf8(value: string, maxBytes: number) {
  const buffer = Buffer.from(value);
  if (buffer.byteLength <= maxBytes) {
    return { text: value, droppedBytes: 0 };
  }
  return {
    text: buffer.subarray(0, maxBytes).toString('utf8'),
    droppedBytes: buffer.byteLength - maxBytes
  };
}

function cloneSessionWithFreshness(session: ConnectorSession, now: Date): ConnectorSession {
  return {
    ...session,
    capabilities: session.capabilities ? [...session.capabilities] : null,
    retryPolicy: { ...session.retryPolicy },
    output: { ...session.output },
    termination: session.termination ? { ...session.termination } : undefined,
    liveness: refreshLiveness(session.liveness, now),
    events: session.events.map((event) => ({ ...event }))
  };
}

function cloneSession(session: ConnectorSession): ConnectorSession {
  return cloneSessionWithFreshness(session, new Date(session.liveness.lastSeen ?? session.startedAt));
}

function emptySnapshot(now: Date): ConnectorRuntimeSnapshot {
  return {
    version: 1,
    updatedAt: now.toISOString(),
    tasks: [],
    instances: [],
    runtime: createRuntimeEnvelope('available', now)
  };
}

function normalizePersistedSnapshot(
  value: unknown,
  now: Date,
  heartbeatStaleAfterMs: number
): ConnectorRuntimeSnapshot {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.tasks)) {
    return emptySnapshot(now);
  }
  const tasks = value.tasks
    .map((candidate) => normalizePersistedSession(candidate, heartbeatStaleAfterMs, now))
    .filter((session): session is ConnectorSession => session !== null)
    .slice(0, MAX_RUNTIME_SESSIONS);
  return {
    version: 1,
    updatedAt: normalizeIsoDate(value.updatedAt) ?? now.toISOString(),
    tasks,
    instances: [],
    runtime: createRuntimeEnvelope(
      tasks.some((session) => ACTIVE_STATES.has(session.state)) ? 'recovering' : 'available',
      now
    )
  };
}

function normalizePersistedSession(
  value: unknown,
  heartbeatStaleAfterMs: number,
  now: Date
): ConnectorSession | null {
  if (!isRecord(value)) {
    return null;
  }
  const taskId = normalizeIdentifier(value.taskId);
  const sessionId = normalizeIdentifier(value.sessionId);
  const connectorId = normalizeIdentifier(value.connectorId);
  const agentId = normalizeIdentifier(value.agentId);
  const taskName = normalizeText(value.taskName, MAX_TASK_NAME_LENGTH);
  const startedAt = normalizeIsoDate(value.startedAt);
  const state = isRuntimeState(value.state) ? value.state : null;
  if (!taskId || !sessionId || !connectorId || !agentId || !taskName || !startedAt || !state) {
    return null;
  }
  const retryPolicy = normalizeRetryPolicy(isRecord(value.retryPolicy) ? value.retryPolicy : undefined);
  const livenessValue = isRecord(value.liveness) ? value.liveness : {};
  const lastSeen = normalizeIsoDate(livenessValue.lastSeen);
  return {
    taskId,
    sessionId,
    connectorId,
    agentId,
    taskName,
    requestedBy: value.requestedBy === 'default-action' ? 'default-action' : 'explicit-user-action',
    source: value.source === 'restart-recovery' ? 'restart-recovery' : 'runtime-spawn',
    capabilities: value.capabilities === null
      ? null
      : (Array.isArray(value.capabilities)
        ? value.capabilities.filter((item): item is string => typeof item === 'string').slice(0, 20)
        : null),
    capabilitySource: isCapabilitySource(value.capabilitySource) ? value.capabilitySource : 'unknown',
    state,
    startedAt,
    endedAt: normalizeIsoDate(value.endedAt) ?? undefined,
    pid: numberOrUndefined(value.pid),
    exitCode: numberOrUndefined(value.exitCode),
    signal: typeof value.signal === 'string' ? value.signal : undefined,
    attempt: clampInteger(value.attempt, 0, MAX_RETRIES + 1, 0),
    maxAttempts: clampInteger(value.maxAttempts, 1, MAX_RETRIES + 1, retryPolicy.maxRetries + 1),
    retryPolicy,
    timeoutAt: normalizeIsoDate(value.timeoutAt) ?? undefined,
    failureKind: isFailureKind(value.failureKind) ? value.failureKind : undefined,
    output: normalizeOutputStats(value.output),
    termination: normalizeTermination(value.termination),
    liveness: {
      status: computeHeartbeatFreshness(lastSeen ?? undefined, now, heartbeatStaleAfterMs),
      source: isLivenessSource(livenessValue.source) ? livenessValue.source : 'none',
      lastSeen: lastSeen ?? undefined,
      staleAfterMs: heartbeatStaleAfterMs
    },
    events: Array.isArray(value.events)
      ? value.events.map(normalizePersistedEvent).filter((event): event is ConnectorRuntimeEvent => event !== null)
      : []
  };
}

function normalizePersistedEvent(value: unknown): ConnectorRuntimeEvent | null {
  if (!isRecord(value) || !Number.isInteger(value.sequence) || !isEventKind(value.kind)) {
    return null;
  }
  const timestamp = normalizeIsoDate(value.timestamp);
  if (!timestamp || typeof value.message !== 'string') {
    return null;
  }
  return {
    eventId: normalizeIdentifier(value.eventId) ?? `legacy-event-${value.sequence}`,
    sequence: value.sequence as number,
    timestamp,
    kind: value.kind,
    message: value.message.slice(0, 20_000),
    lifecycle: isLifecycleSubtype(value.lifecycle) ? value.lifecycle : undefined,
    ...(value.payload === undefined ? {} : { payload: value.payload })
  };
}

function normalizeOutputStats(value: unknown): ConnectorOutputStats {
  const candidate = isRecord(value) ? value : {};
  return {
    receivedBytes: clampInteger(candidate.receivedBytes, 0, Number.MAX_SAFE_INTEGER, 0),
    archivedBytes: clampInteger(candidate.archivedBytes, 0, MAX_SESSION_OUTPUT_BYTES, 0),
    droppedBytes: clampInteger(candidate.droppedBytes, 0, Number.MAX_SAFE_INTEGER, 0),
    outputEvents: clampInteger(candidate.outputEvents, 0, MAX_OUTPUT_EVENTS, 0),
    truncatedLines: clampInteger(candidate.truncatedLines, 0, Number.MAX_SAFE_INTEGER, 0),
    backpressureEvents: clampInteger(candidate.backpressureEvents, 0, MAX_BACKPRESSURE_EVENTS, 0)
  };
}

function normalizeTermination(value: unknown): ConnectorTerminationEvidence | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const requestedAt = normalizeIsoDate(value.requestedAt);
  if (!requestedAt || !isTerminationReason(value.reason)) {
    return undefined;
  }
  return {
    requestedAt,
    reason: value.reason,
    killAttempts: clampInteger(value.killAttempts, 0, 100, 0),
    exitConfirmed: value.exitConfirmed === true,
    escalatedAt: normalizeIsoDate(value.escalatedAt) ?? undefined
  };
}

function sanitizeEvent(event: ConnectorRuntimeEvent, terms: string[]): ConnectorRuntimeEvent {
  return {
    ...event,
    message: redactText(event.message, terms),
    ...(event.payload === undefined ? {} : { payload: redactValue(event.payload, terms) })
  };
}

function redactText(value: string, sensitiveTerms: string[]) {
  let redacted = value
    .replace(/\bBearer\s+[A-Za-z0-9][A-Za-z0-9._~+/=-]*/gi, 'Bearer [REDACTED]')
    .replace(
      /(["']?(?:api[_-]?key|token|secret|password|authorization)["']?\s*[:=]\s*)("[^"]*"|'[^']*'|[^,;|\r\n}\]]+)/gi,
      (_match, prefix: string, credential: string) => {
        const trailingWhitespace = credential.match(/\s+$/)?.[0] ?? '';
        return `${prefix}"[REDACTED]"${trailingWhitespace}`;
      }
    );
  sensitiveTerms.filter((term) => term.length >= 4).forEach((term) => {
    redacted = redacted.split(term).join('[REDACTED]');
  });
  return redacted;
}

function redactValue(value: unknown, sensitiveTerms: string[]): unknown {
  if (typeof value === 'string') {
    return redactText(value, sensitiveTerms);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, sensitiveTerms));
  }
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      /api[_-]?key|token|secret|password|authorization/i.test(key)
        ? '[REDACTED]'
        : redactValue(item, sensitiveTerms)
    ]));
  }
  return value;
}

function createRuntimeEnvelope(
  availability: 'available' | 'recovering',
  observedAt: Date,
  source: 'electron-main' | 'persisted-recovery' = availability === 'recovering'
    ? 'persisted-recovery'
    : 'electron-main'
) {
  return {
    availability,
    mode: 'real' as const,
    source,
    observedAt: observedAt.toISOString(),
    ...(availability === 'recovering'
      ? { reason: 'Persisted active sessions require process reattachment proof.' }
      : {})
  };
}

function normalizeIdentifier(value: unknown) {
  return typeof value === 'string' && /^[a-zA-Z0-9._:-]{1,200}$/.test(value.trim())
    ? value.trim()
    : null;
}

function normalizeText(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.trim() && value.length <= maxLength
    ? value.trim()
    : null;
}

function numberOrUndefined(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function clampInteger(value: unknown, minimum: number, maximum: number, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(minimum, Math.min(maximum, Math.round(value)))
    : fallback;
}

function normalizeIsoDate(value: unknown) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
    ? new Date(value).toISOString()
    : null;
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readConnectorId(input: unknown) {
  return isRecord(input) && typeof input.connectorId === 'string' ? input.connectorId : '';
}

function readTaskId(input: unknown) {
  return isRecord(input) && typeof input.taskId === 'string' ? input.taskId : '';
}

function isRuntimeState(value: unknown): value is ConnectorRuntimeState {
  return typeof value === 'string' && [
    'starting', 'running', 'stopping', 'retrying', 'recovering', 'reattached', 'success', 'error',
    'stopped', 'timed-out', 'policy-blocked', 'permission-denied', 'session-lost'
  ].includes(value);
}

function isEventKind(value: unknown): value is ConnectorRuntimeEventKind {
  return typeof value === 'string' && [
    'lifecycle', 'stdout', 'stderr', 'error', 'timeout', 'retry', 'heartbeat', 'recovery', 'policy'
  ].includes(value);
}

function isLifecycleSubtype(value: unknown): value is ConnectorLifecycleSubtype {
  return typeof value === 'string' && [
    'session-created', 'spawn-requested', 'session-started', 'attempt-started', 'stopping-requested',
    'termination-escalated', 'retry-scheduled', 'retry-started', 'recovery-started',
    'recovery-reattached', 'output-truncated', 'session-terminal'
  ].includes(value);
}

function isFailureKind(value: unknown): value is ConnectorFailureKind {
  return typeof value === 'string' && [
    'exit-code', 'process-error', 'timeout', 'cancelled', 'policy-blocked', 'permission-denied'
  ].includes(value);
}

function isLivenessSource(value: unknown): value is ProcessLivenessSource {
  return value === 'none' || value === 'process-event' || value === 'recovery-proof';
}

function isCapabilitySource(value: unknown): value is ConnectorCapabilitySource {
  return value === 'adapter-declaration' || value === 'runtime-observed' || value === 'unknown';
}

function isTerminationReason(value: unknown): value is ConnectorTerminationEvidence['reason'] {
  return value === 'user-cancel' || value === 'timeout' || value === 'process-error' || value === 'dispose';
}
