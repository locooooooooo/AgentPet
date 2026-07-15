import type {
  AgentInstance,
  AgentInstanceSource,
  ConnectorCapabilitySource,
  ConnectorRuntimeAvailability,
  ConnectorRuntimeMode,
  ConnectorRuntimeSnapshot,
  ConnectorRuntimeSource,
  ConnectorRuntimeState,
  ConnectorSession
} from '../types';

export type AgentPresence =
  | 'configured'
  | 'discovered'
  | 'online'
  | 'busy'
  | 'degraded'
  | 'offline'
  | 'unknown'
  | 'simulated';

export type AgentActivity = 'idle' | 'busy' | 'terminal' | 'unknown';

export type AgentProjectionReason =
  | 'configured-only'
  | 'runtime-discovered'
  | 'fresh-session'
  | 'fresh-running-task'
  | 'heartbeat-late'
  | 'heartbeat-stale'
  | 'runtime-unavailable'
  | 'runtime-recovering'
  | 'runtime-unknown'
  | 'runtime-source-untrusted'
  | 'invalid-runtime-observed-at'
  | 'future-runtime-observed-at'
  | 'last-seen-after-runtime-observed-at'
  | 'simulation-mode'
  | 'session-lost'
  | 'policy-blocked'
  | 'permission-denied'
  | 'terminal-session'
  | 'missing-session-id'
  | 'missing-source-proof'
  | 'missing-last-seen'
  | 'invalid-last-seen'
  | 'future-last-seen'
  | 'inconsistent-liveness-proof'
  | 'task-identity-mismatch'
  | 'duplicate-session-conflict'
  | 'upstream-degraded'
  | 'upstream-unknown';

export interface AgentProjectionThresholds {
  freshMs: number;
  staleMs: number;
}

export const DEFAULT_AGENT_PROJECTION_THRESHOLDS: Readonly<AgentProjectionThresholds> = Object.freeze({
  freshMs: 5_000,
  staleMs: 15_000
});

export interface ConfiguredAgentIdentity {
  id: string;
  connectorId: string;
}

export interface AgentInstanceProjectionInput {
  configuredAgents: readonly ConfiguredAgentIdentity[];
  runtimeSnapshot: ConnectorRuntimeSnapshot;
  now?: Date | string | number;
  thresholds?: Partial<AgentProjectionThresholds>;
}

export type ProjectedTaskRelation = 'matched' | 'identity-mismatch' | 'unlinked';

export interface ProjectedRuntimeTask {
  taskId: string;
  sessionId: string;
  agentId: string;
  connectorId: string;
  source: ConnectorSession['source'];
  lastSeen?: string;
  pid?: number;
  sourceState: ConnectorRuntimeState;
  effectiveState: ConnectorRuntimeState;
  relation: ProjectedTaskRelation;
  isRunning: boolean;
  isTerminal: boolean;
}

export interface ProjectedAgentInstance {
  projectionId: string;
  instanceId: string;
  agentId: string;
  connectorId: string;
  sessionId?: string;
  configured: boolean;
  presence: AgentPresence;
  activity: AgentActivity;
  isOnline: boolean;
  reason: AgentProjectionReason;
  source: AgentInstanceSource;
  lastSeen?: string;
  capabilities: string[] | null;
  capabilitySource: ConnectorCapabilitySource;
  taskIds: string[];
  heartbeatAgeMs: number | null;
  upstreamStatus: AgentInstance['status'];
}

export interface ProjectedAgentTruth {
  agentId: string;
  connectorId: string;
  configured: boolean;
  presence: AgentPresence;
  activity: AgentActivity;
  isOnline: boolean;
  primaryInstance: ProjectedAgentInstance | null;
  instances: ProjectedAgentInstance[];
}

export interface AgentTruthSummary {
  configuredCount: number;
  discoveredInstanceCount: number;
  onlineSessionCount: number;
  busySessionCount: number;
  degradedSessionCount: number;
  offlineSessionCount: number;
  unknownInstanceCount: number;
  simulatedAgentCount: number;
}

export interface AgentTruthProjection {
  runtime: {
    availability: ConnectorRuntimeAvailability;
    mode: ConnectorRuntimeMode;
    source: ConnectorRuntimeSource;
    observedAt: string;
    reason?: string;
  };
  thresholds: AgentProjectionThresholds;
  projectedAt: string;
  agents: ProjectedAgentTruth[];
  instances: ProjectedAgentInstance[];
  tasks: ProjectedRuntimeTask[];
  summary: AgentTruthSummary;
}

const REAL_RUNTIME_SOURCES = new Set<ConnectorRuntimeSource>(['electron-main', 'persisted-recovery']);
const REAL_INSTANCE_SOURCES = new Set<AgentInstanceSource>(['connector-runtime', 'recovery-proof']);
const SESSION_INSTANCE_SOURCES = new Set<AgentInstanceSource>([
  'connector-runtime',
  'recovery-proof',
  'session-lost'
]);
const TERMINAL_TASK_STATES = new Set<ConnectorRuntimeState>([
  'success',
  'error',
  'stopped',
  'timed-out',
  'policy-blocked',
  'permission-denied',
  'session-lost'
]);

export function projectAgentInstances(input: AgentInstanceProjectionInput): AgentTruthProjection {
  const now = normalizeNow(input.now);
  const thresholds = normalizeThresholds(input.thresholds);
  const configuredKeys = new Set(input.configuredAgents.map((agent) => identityKey(agent.id, agent.connectorId)));
  const tasks = projectTasks(input.runtimeSnapshot.tasks, input.runtimeSnapshot.instances);
  const instances = consolidateDuplicateSessions(input.runtimeSnapshot.instances
    .map((instance) => projectInstance({
      instance,
      runtime: input.runtimeSnapshot.runtime,
      tasks,
      configured: configuredKeys.has(identityKey(instance.agentId, instance.connectorId)),
      now,
      thresholds
    })))
    .sort(compareProjectedInstances)
    .map((instance, index) => ({
      ...instance,
      projectionId: createProjectionId(instance, index)
    }));

  const instancesByIdentity = new Map<string, ProjectedAgentInstance[]>();
  instances.forEach((instance) => {
    const key = identityKey(instance.agentId, instance.connectorId);
    const current = instancesByIdentity.get(key) ?? [];
    current.push(instance);
    instancesByIdentity.set(key, current);
  });

  const configuredIdentities = uniqueConfiguredIdentities(input.configuredAgents);
  const orphanIdentities = [...instancesByIdentity.keys()]
    .filter((key) => !configuredKeys.has(key))
    .sort(compareText);
  const identities = [
    ...configuredIdentities,
    ...orphanIdentities.map(parseIdentityKey)
  ];
  const agents: ProjectedAgentTruth[] = identities.map(({ agentId, connectorId }) => {
    const key = identityKey(agentId, connectorId);
    const agentInstances = instancesByIdentity.get(key) ?? [];
    const primaryInstance = agentInstances[0] ?? null;
    const configured = configuredKeys.has(key);
    if (primaryInstance) {
      return {
        agentId,
        connectorId,
        configured,
        presence: primaryInstance.presence,
        activity: primaryInstance.activity,
        isOnline: primaryInstance.isOnline,
        primaryInstance,
        instances: agentInstances
      };
    }

    const simulated = input.runtimeSnapshot.runtime.mode === 'simulated';
    return {
      agentId,
      connectorId,
      configured,
      presence: simulated ? 'simulated' : 'configured',
      activity: simulated ? 'unknown' : 'idle',
      isOnline: false,
      primaryInstance: null,
      instances: []
    };
  });

  const projectionBase = {
    runtime: { ...input.runtimeSnapshot.runtime },
    thresholds,
    projectedAt: now.toISOString(),
    agents,
    instances,
    tasks
  };

  return {
    ...projectionBase,
    summary: selectAgentTruthSummary(projectionBase)
  };
}

export function selectAgentTruthSummary(
  projection: Pick<AgentTruthProjection, 'agents' | 'instances'>
): AgentTruthSummary {
  return {
    configuredCount: projection.agents.filter((agent) => agent.configured).length,
    discoveredInstanceCount: countPresence(projection.instances, 'discovered'),
    onlineSessionCount: countUniqueSessions(projection.instances, (instance) => instance.isOnline),
    busySessionCount: countUniqueSessions(projection.instances, (instance) => instance.presence === 'busy'),
    degradedSessionCount: countUniqueSessions(projection.instances, (instance) => instance.presence === 'degraded'),
    offlineSessionCount: countUniqueSessions(projection.instances, (instance) => instance.presence === 'offline'),
    unknownInstanceCount: countPresence(projection.instances, 'unknown'),
    simulatedAgentCount: projection.agents.filter((agent) => agent.presence === 'simulated').length
  };
}

export function selectAgentTruthByAgentId(
  projection: Pick<AgentTruthProjection, 'agents'>,
  agentId: string
): ProjectedAgentTruth | null {
  return projection.agents
    .filter((agent) => agent.agentId === agentId)
    .sort(compareProjectedAgentTruth)[0] ?? null;
}

export function selectAgentTruthByIdentity(
  projection: Pick<AgentTruthProjection, 'agents'>,
  agentId: string,
  connectorId: string
): ProjectedAgentTruth | null {
  return projection.agents.find((agent) => (
    agent.agentId === agentId && agent.connectorId === connectorId
  )) ?? null;
}

export function selectProjectedTasksBySessionId(
  projection: Pick<AgentTruthProjection, 'tasks'>,
  sessionId: string
): ProjectedRuntimeTask[] {
  return projection.tasks
    .filter((task) => task.sessionId === sessionId)
    .map((task) => ({ ...task }));
}

function projectTasks(
  tasks: readonly ConnectorSession[],
  instances: readonly AgentInstance[]
): ProjectedRuntimeTask[] {
  return tasks.map((task) => {
    const sameSession = instances.filter((instance) => instance.sessionId === task.sessionId);
    const matched = sameSession.find((instance) => (
      Boolean(task.taskId) &&
      instance.agentId === task.agentId &&
      instance.connectorId === task.connectorId
    ));
    const relation: ProjectedTaskRelation = matched
      ? 'matched'
      : (sameSession.length > 0 ? 'identity-mismatch' : 'unlinked');
    const sessionLost = matched?.source === 'session-lost' || matched?.status === 'offline' && task.state === 'session-lost';
    const effectiveState: ConnectorRuntimeState = sessionLost ? 'session-lost' : task.state;

    return {
      taskId: task.taskId,
      sessionId: task.sessionId,
      agentId: task.agentId,
      connectorId: task.connectorId,
      source: task.source,
      ...(task.liveness.lastSeen ? { lastSeen: task.liveness.lastSeen } : {}),
      ...(typeof task.pid === 'number' ? { pid: task.pid } : {}),
      sourceState: task.state,
      effectiveState,
      relation,
      isRunning: effectiveState === 'running' && relation === 'matched',
      isTerminal: TERMINAL_TASK_STATES.has(effectiveState)
    };
  }).sort(compareProjectedTasks);
}

function consolidateDuplicateSessions(
  instances: readonly ProjectedAgentInstance[]
): ProjectedAgentInstance[] {
  const withoutSession = instances.filter((instance) => !instance.sessionId);
  const bySession = new Map<string, ProjectedAgentInstance[]>();
  instances.forEach((instance) => {
    if (!instance.sessionId) {
      return;
    }
    const current = bySession.get(instance.sessionId) ?? [];
    current.push(instance);
    bySession.set(instance.sessionId, current);
  });

  const consolidated = [...bySession.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .flatMap(([, sessionInstances]) => {
      const ordered = [...sessionInstances].sort(compareProjectedInstances);
      if (ordered.length === 1) {
        return ordered;
      }

      const signatures = new Set(ordered.map(projectedInstanceSignature));
      if (signatures.size === 1) {
        return [ordered[0]];
      }

      const byIdentity = new Map<string, ProjectedAgentInstance[]>();
      ordered.forEach((instance) => {
        const key = identityKey(instance.agentId, instance.connectorId);
        const current = byIdentity.get(key) ?? [];
        current.push(instance);
        byIdentity.set(key, current);
      });

      return [...byIdentity.entries()]
        .sort(([left], [right]) => compareText(left, right))
        .map(([, conflicting]) => {
          const first = conflicting[0];
          return {
            ...first,
            projectionId: '',
            configured: conflicting.some((instance) => instance.configured),
            presence: 'unknown' as const,
            activity: 'unknown' as const,
            isOnline: false,
            reason: 'duplicate-session-conflict' as const,
            source: 'unknown' as const,
            lastSeen: undefined,
            capabilities: null,
            capabilitySource: 'unknown' as const,
            taskIds: uniqueStrings(conflicting.flatMap((instance) => instance.taskIds)).sort(compareText),
            heartbeatAgeMs: null,
            upstreamStatus: 'unknown' as const
          };
        });
    });

  return [...withoutSession, ...consolidated];
}

function projectedInstanceSignature(instance: ProjectedAgentInstance) {
  return JSON.stringify({
    instanceId: instance.instanceId,
    agentId: instance.agentId,
    connectorId: instance.connectorId,
    sessionId: instance.sessionId,
    configured: instance.configured,
    presence: instance.presence,
    activity: instance.activity,
    isOnline: instance.isOnline,
    reason: instance.reason,
    source: instance.source,
    lastSeen: instance.lastSeen,
    capabilities: instance.capabilities,
    capabilitySource: instance.capabilitySource,
    taskIds: instance.taskIds,
    heartbeatAgeMs: instance.heartbeatAgeMs,
    upstreamStatus: instance.upstreamStatus
  });
}

function projectInstance(input: {
  instance: AgentInstance;
  runtime: ConnectorRuntimeSnapshot['runtime'];
  tasks: readonly ProjectedRuntimeTask[];
  configured: boolean;
  now: Date;
  thresholds: AgentProjectionThresholds;
}): ProjectedAgentInstance {
  const { instance, runtime, tasks, configured, now, thresholds } = input;
  const relatedTasks = instance.sessionId
    ? tasks.filter((task) => task.sessionId === instance.sessionId)
    : [];
  const matchedTasks = relatedTasks.filter((task) => (
    task.relation === 'matched' &&
    task.agentId === instance.agentId &&
    task.connectorId === instance.connectorId
  ));
  const base = {
    projectionId: '',
    instanceId: instance.instanceId,
    agentId: instance.agentId,
    connectorId: instance.connectorId,
    ...(instance.sessionId ? { sessionId: instance.sessionId } : {}),
    configured,
    source: instance.source,
    ...(instance.lastSeen ? { lastSeen: instance.lastSeen } : {}),
    capabilities: instance.capabilities ? [...instance.capabilities].sort(compareText) : null,
    capabilitySource: instance.capabilitySource,
    taskIds: matchedTasks.map((task) => task.taskId).sort(compareText),
    heartbeatAgeMs: null,
    upstreamStatus: instance.status
  };

  if (runtime.mode === 'simulated' || instance.source === 'simulated') {
    return withState(base, 'simulated', 'unknown', false, 'simulation-mode');
  }

  if (runtime.availability !== 'available') {
    const reason: AgentProjectionReason = runtime.availability === 'unavailable'
      ? 'runtime-unavailable'
      : runtime.availability === 'recovering'
        ? 'runtime-recovering'
        : 'runtime-unknown';
    return withState(base, 'unknown', 'unknown', false, reason);
  }

  if (!REAL_RUNTIME_SOURCES.has(runtime.source)) {
    return withState(base, 'unknown', 'unknown', false, 'runtime-source-untrusted');
  }

  const runtimeObservedAtMs = Date.parse(runtime.observedAt);
  if (!Number.isFinite(runtimeObservedAtMs)) {
    return withState(base, 'unknown', 'unknown', false, 'invalid-runtime-observed-at');
  }
  if (runtimeObservedAtMs > now.getTime()) {
    return withState(base, 'unknown', 'unknown', false, 'future-runtime-observed-at');
  }

  if (instance.status === 'configured' && !instance.sessionId) {
    if (REAL_INSTANCE_SOURCES.has(instance.source)) {
      return withState(base, 'discovered', 'idle', false, 'runtime-discovered');
    }
    if (instance.source === 'static-config') {
      return withState(base, 'configured', 'idle', false, 'configured-only');
    }
    return withState(base, 'unknown', 'unknown', false, 'missing-source-proof');
  }

  if (!SESSION_INSTANCE_SOURCES.has(instance.source)) {
    return withState(base, 'unknown', 'unknown', false, 'missing-source-proof');
  }

  if (!instance.sessionId) {
    return withState(base, 'unknown', 'unknown', false, 'missing-session-id');
  }

  const terminalTask = matchedTasks.find((task) => task.isTerminal);
  if (instance.source === 'session-lost' || terminalTask?.effectiveState === 'session-lost') {
    return withState(base, 'offline', 'terminal', false, 'session-lost');
  }
  if (terminalTask?.effectiveState === 'policy-blocked') {
    return withState(base, 'offline', 'terminal', false, 'policy-blocked');
  }
  if (terminalTask?.effectiveState === 'permission-denied') {
    return withState(base, 'offline', 'terminal', false, 'permission-denied');
  }
  if (terminalTask) {
    return withState(base, 'offline', 'terminal', false, 'terminal-session');
  }

  if (instance.status === 'offline') {
    return withState(base, 'offline', 'terminal', false, 'terminal-session');
  }

  if (instance.status === 'unknown' || instance.source === 'unknown' || instance.status === 'configured') {
    return withState(base, 'unknown', 'unknown', false, 'upstream-unknown');
  }

  if (!instance.lastSeen || !instance.liveness.lastSeen) {
    return withState(base, 'unknown', 'unknown', false, 'missing-last-seen');
  }

  if (instance.liveness.source === 'none') {
    return withState(base, 'unknown', 'unknown', false, 'missing-source-proof');
  }

  if (instance.lastSeen !== instance.liveness.lastSeen || instance.liveness.status === 'unknown') {
    return withState(base, 'unknown', 'unknown', false, 'inconsistent-liveness-proof');
  }

  const lastSeenMs = Date.parse(instance.lastSeen);
  if (!Number.isFinite(lastSeenMs)) {
    return withState(base, 'unknown', 'unknown', false, 'invalid-last-seen');
  }
  const heartbeatAgeMs = now.getTime() - lastSeenMs;
  if (heartbeatAgeMs < 0) {
    return withState({ ...base, heartbeatAgeMs }, 'unknown', 'unknown', false, 'future-last-seen');
  }
  if (lastSeenMs > runtimeObservedAtMs) {
    return withState(
      { ...base, heartbeatAgeMs },
      'unknown',
      'unknown',
      false,
      'last-seen-after-runtime-observed-at'
    );
  }

  if (heartbeatAgeMs >= thresholds.staleMs) {
    return withState({ ...base, heartbeatAgeMs }, 'offline', 'unknown', false, 'heartbeat-stale');
  }

  if (heartbeatAgeMs > thresholds.freshMs || instance.status === 'degraded' || instance.liveness.status === 'stale') {
    const reason = instance.status === 'degraded' || instance.liveness.status === 'stale'
      ? 'upstream-degraded'
      : 'heartbeat-late';
    return withState({ ...base, heartbeatAgeMs }, 'degraded', 'unknown', false, reason);
  }

  const sameSessionMismatch = relatedTasks.some((task) => task.relation === 'identity-mismatch');
  const runningTask = matchedTasks.find((task) => task.isRunning);
  if (runningTask) {
    return withState({ ...base, heartbeatAgeMs }, 'busy', 'busy', true, 'fresh-running-task');
  }

  if (sameSessionMismatch) {
    return withState({ ...base, heartbeatAgeMs }, 'online', 'unknown', true, 'task-identity-mismatch');
  }

  return withState({ ...base, heartbeatAgeMs }, 'online', 'idle', true, 'fresh-session');
}

function withState(
  base: Omit<ProjectedAgentInstance, 'presence' | 'activity' | 'isOnline' | 'reason'>,
  presence: AgentPresence,
  activity: AgentActivity,
  isOnline: boolean,
  reason: AgentProjectionReason
): ProjectedAgentInstance {
  return { ...base, presence, activity, isOnline, reason };
}

function normalizeNow(value: AgentInstanceProjectionInput['now']): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value ?? Date.now());
  if (Number.isNaN(date.getTime())) {
    throw new Error('AgentInstance projection requires a valid `now` value.');
  }
  return date;
}

function normalizeThresholds(value: Partial<AgentProjectionThresholds> | undefined): AgentProjectionThresholds {
  const freshMs = normalizePositiveInteger(value?.freshMs, DEFAULT_AGENT_PROJECTION_THRESHOLDS.freshMs);
  const staleMs = normalizePositiveInteger(value?.staleMs, DEFAULT_AGENT_PROJECTION_THRESHOLDS.staleMs);
  if (freshMs >= staleMs) {
    throw new Error('AgentInstance projection requires freshMs < staleMs.');
  }
  return { freshMs, staleMs };
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : fallback;
}

function compareProjectedInstances(left: ProjectedAgentInstance, right: ProjectedAgentInstance) {
  return compareText(left.agentId, right.agentId)
    || presenceRank(left.presence) - presenceRank(right.presence)
    || compareOptionalDatesDescending(left.lastSeen, right.lastSeen)
    || compareText(left.sessionId ?? '', right.sessionId ?? '')
    || compareText(left.connectorId, right.connectorId)
    || compareText(left.instanceId, right.instanceId);
}

function compareProjectedTasks(left: ProjectedRuntimeTask, right: ProjectedRuntimeTask) {
  return compareText(left.sessionId, right.sessionId)
    || compareText(left.taskId, right.taskId)
    || compareText(left.agentId, right.agentId)
    || compareText(left.connectorId, right.connectorId);
}

function compareProjectedAgentTruth(left: ProjectedAgentTruth, right: ProjectedAgentTruth) {
  if (left.primaryInstance && right.primaryInstance) {
    return compareProjectedInstances(left.primaryInstance, right.primaryInstance)
      || compareText(left.connectorId, right.connectorId);
  }
  if (left.primaryInstance) {
    return -1;
  }
  if (right.primaryInstance) {
    return 1;
  }
  return compareText(left.connectorId, right.connectorId);
}

function presenceRank(presence: AgentPresence) {
  const ranks: Record<AgentPresence, number> = {
    busy: 0,
    online: 1,
    degraded: 2,
    offline: 3,
    discovered: 4,
    configured: 5,
    simulated: 6,
    unknown: 7
  };
  return ranks[presence];
}

function compareOptionalDatesDescending(left: string | undefined, right: string | undefined) {
  const leftTime = left ? Date.parse(left) : Number.NEGATIVE_INFINITY;
  const rightTime = right ? Date.parse(right) : Number.NEGATIVE_INFINITY;
  const safeLeft = Number.isFinite(leftTime) ? leftTime : Number.NEGATIVE_INFINITY;
  const safeRight = Number.isFinite(rightTime) ? rightTime : Number.NEGATIVE_INFINITY;
  return safeRight - safeLeft;
}

function compareText(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function createProjectionId(instance: ProjectedAgentInstance, index: number) {
  return [
    instance.instanceId,
    instance.sessionId ?? 'no-session',
    instance.agentId,
    instance.connectorId,
    String(index)
  ].join(':');
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values)];
}

function uniqueConfiguredIdentities(identities: readonly ConfiguredAgentIdentity[]) {
  const seen = new Set<string>();
  return identities.flatMap((identity) => {
    const key = identityKey(identity.id, identity.connectorId);
    if (seen.has(key)) {
      return [];
    }
    seen.add(key);
    return [{ agentId: identity.id, connectorId: identity.connectorId }];
  });
}

function identityKey(agentId: string, connectorId: string) {
  return JSON.stringify([agentId, connectorId]);
}

function parseIdentityKey(key: string): { agentId: string; connectorId: string } {
  const [agentId, connectorId] = JSON.parse(key) as [string, string];
  return { agentId, connectorId };
}

function countPresence(instances: readonly ProjectedAgentInstance[], presence: AgentPresence) {
  return instances.filter((instance) => instance.presence === presence).length;
}

function countUniqueSessions(
  instances: readonly ProjectedAgentInstance[],
  predicate: (instance: ProjectedAgentInstance) => boolean
) {
  return new Set(
    instances
      .filter((instance) => Boolean(instance.sessionId) && predicate(instance))
      .map((instance) => instance.sessionId)
  ).size;
}
