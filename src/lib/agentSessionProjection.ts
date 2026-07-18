import type { CodexHostSnapshot, ConnectorRuntimeState } from '../types';
import type { ProjectedRuntimeTask } from './agentInstanceProjection';

export type AgentSessionStatus = 'idle' | 'working' | 'completed' | 'failed' | 'unknown';
export type AgentSessionSource = 'codex-desktop' | 'connector-runtime';

export interface AgentSession {
  sessionId: string;
  agentId: string;
  connectorId: string;
  title: string;
  status: AgentSessionStatus;
  source: AgentSessionSource;
  updatedAt: string;
  taskId?: string;
  workspace?: string;
}

export interface AgentSessionProjectionInput {
  agentId: string;
  connectorId: string;
  runtimeTasks: readonly ProjectedRuntimeTask[];
  codexHost: CodexHostSnapshot | null;
}

const WORKING_STATES = new Set<ConnectorRuntimeState>([
  'queued',
  'starting',
  'running',
  'stopping',
  'retrying',
  'recovering',
  'reattached'
]);

const FAILED_STATES = new Set<ConnectorRuntimeState>([
  'error',
  'stopped',
  'timed-out',
  'dependency-blocked',
  'policy-blocked',
  'permission-denied',
  'session-lost'
]);

export function projectAgentSessions(input: AgentSessionProjectionInput): AgentSession[] {
  const runtimeSessions = input.runtimeTasks
    .filter((task) => task.agentId === input.agentId && task.connectorId === input.connectorId)
    .map((task): AgentSession => ({
      sessionId: task.sessionId,
      agentId: task.agentId,
      connectorId: task.connectorId,
      title: task.taskName || `Connector Session ${shortSessionId(task.sessionId)}`,
      status: mapConnectorSessionStatus(task.effectiveState),
      source: 'connector-runtime',
      updatedAt: task.endedAt ?? task.lastSeen ?? task.startedAt,
      taskId: task.taskId
    }));

  const codexSessions = input.agentId === 'codex' && input.connectorId === 'codex' && input.codexHost
    ? input.codexHost.sessions.map((session): AgentSession => ({
        sessionId: session.sessionId,
        agentId: 'codex',
        connectorId: 'codex',
        title: formatCodexSessionTitle(session.workspace, session.sessionId),
        status: session.state === 'running' ? 'working' : 'idle',
        source: 'codex-desktop',
        updatedAt: session.lastEventAt,
        workspace: session.workspace
      }))
    : [];

  return [...codexSessions, ...runtimeSessions].sort(compareSessions);
}

export function mapConnectorSessionStatus(state: ConnectorRuntimeState): AgentSessionStatus {
  if (WORKING_STATES.has(state)) {
    return 'working';
  }
  if (state === 'success') {
    return 'completed';
  }
  if (FAILED_STATES.has(state)) {
    return 'failed';
  }
  return 'unknown';
}

function formatCodexSessionTitle(workspace: string, sessionId: string) {
  const normalized = workspace.trim().replace(/[\\/]+$/, '');
  const segments = normalized.split(/[\\/]/).filter(Boolean);
  const workspaceName = segments.at(-1);
  return workspaceName ? `Codex · ${workspaceName}` : `Codex Session ${shortSessionId(sessionId)}`;
}

function shortSessionId(sessionId: string) {
  return sessionId.length > 12 ? sessionId.slice(0, 8) : sessionId;
}

function compareSessions(left: AgentSession, right: AgentSession) {
  const leftTime = Date.parse(left.updatedAt);
  const rightTime = Date.parse(right.updatedAt);
  const safeLeft = Number.isFinite(leftTime) ? leftTime : 0;
  const safeRight = Number.isFinite(rightTime) ? rightTime : 0;
  return safeRight - safeLeft || left.sessionId.localeCompare(right.sessionId, 'en-US');
}
