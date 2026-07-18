export type AgentTaskStatus = 'pending' | 'running' | 'success' | 'error';
export type AgentTaskRunner = 'simulated' | 'local';

export type ConnectorStatus = 'draft' | 'placeholder' | 'ready' | 'disabled';
export type ConnectorRunner = 'local-command';
export type ConnectorCwdPolicy = 'workspace-root' | 'explicit-path';
export type ConnectorConfirmation = 'none' | 'required' | 'required-for-write';
export type ConnectorApprovalStatus = 'not-requested' | 'pending' | 'accepted' | 'rejected';

export type ConnectorBlockedReason =
  | 'policy-unavailable'
  | 'connector-not-found'
  | 'status-not-ready'
  | 'approval-not-accepted'
  | 'disabled-by-default'
  | 'command-missing'
  | 'command-not-discovered'
  | 'cwd-policy-invalid'
  | 'env-not-allowlisted'
  | 'timeout-invalid'
  | 'dangerous-command'
  | 'confirmation-required'
  | 'runner-unsupported';

export type ConnectorRuntimeBlockedReason = ConnectorBlockedReason
  | 'adapter-unsupported'
  | 'authorization-cancelled'
  | 'authorization-expired'
  | 'authorization-intent-mismatch'
  | 'authorization-invalid'
  | 'authorization-policy-drift'
  | 'authorization-replayed'
  | 'dependency-cycle'
  | 'dependency-failed'
  | 'dependency-invalid'
  | 'dependency-not-found'
  | 'request-invalid'
  | 'runtime-unavailable';

export interface ConnectorRetryPolicyInput {
  maxRetries?: number;
  backoffMs?: number;
  budgetMs?: number;
}

export interface ConnectorRetryPolicy {
  maxRetries: number;
  backoffMs: number;
  budgetMs: number;
}

export interface ConnectorAuditFields {
  acceptedBy: string;
  acceptedAt: string;
  approvalEvidence: string;
}

export interface ConnectorConfig extends ConnectorAuditFields {
  id: string;
  label: string;
  status: ConnectorStatus;
  runner: ConnectorRunner;
  command: string;
  args: string[];
  cwdPolicy: ConnectorCwdPolicy;
  envAllowlist: string[];
  confirmation: ConnectorConfirmation;
  timeoutSeconds: number;
  acceptanceGate: string;
  approvalStatus: ConnectorApprovalStatus;
  enabledByDefault: boolean;
}

export interface ConnectorPolicyDefaults {
  cwdPolicy: ConnectorCwdPolicy;
  envAllowlist: string[];
  confirmation: ConnectorConfirmation;
  timeoutSeconds: number;
  dangerousCommandPatterns: string[];
}

export interface ConnectorPolicyConfig {
  version: 1;
  defaults: ConnectorPolicyDefaults;
  connectors: ConnectorConfig[];
}

export interface ConnectorDiscoveryResult {
  connectorId: string;
  command: string;
  discovered: boolean;
  resolvedPath?: string;
}

export interface ConnectorGateInput {
  connector: ConnectorConfig;
  defaults: ConnectorPolicyDefaults;
  discovered: boolean;
  discoveryChecked?: boolean;
  requestedBy: 'default-action' | 'explicit-user-action' | 'preflight' | 'test-fixture';
  confirmationAccepted?: boolean;
}

export interface ConnectorGateRequest {
  connectorId: string;
  requestedBy: 'default-action' | 'explicit-user-action' | 'preflight' | 'test-fixture';
  confirmationAccepted?: boolean;
}

export type ConnectorGateResult =
  | {
      executable: true;
      connectorId: string;
      command: string;
      args: string[];
      cwdPolicy: ConnectorCwdPolicy;
      envAllowlist: string[];
      timeoutSeconds: number;
    }
  | {
      executable: false;
      connectorId: string;
      blockedReasons: ConnectorBlockedReason[];
    };

export interface ConnectorAuthorizationIntent {
  agentId: string;
  connectorId: string;
  taskName: string;
  prompt: string;
  dependsOn?: string[];
  retry?: ConnectorRetryPolicyInput;
}

export interface ConnectorRunIntent extends ConnectorAuthorizationIntent {
  authorizationGrant?: string;
}

export interface ConnectorRunRequest extends ConnectorRunIntent {
  requestedBy: 'default-action' | 'explicit-user-action';
}

export type ConnectorAuthorizationResult =
  | {
      status: 'granted';
      connectorId: string;
      grantId: string;
      expiresAt: string;
    }
  | {
      status: 'blocked';
      connectorId: string;
      blockedReasons: ConnectorRuntimeBlockedReason[];
    };

export interface ConnectorAuthorizationCancelRequest {
  grantId: string;
}

export type ConnectorAuthorizationCancelResult =
  | {
      status: 'cancelled';
      grantId: string;
    }
  | {
      status: 'not-found';
      grantId: string;
    };

export type ConnectorRunResult =
  | {
      status: 'blocked';
      connectorId: string;
      blockedReasons: ConnectorRuntimeBlockedReason[];
      taskId?: string;
      sessionId?: string;
    }
  | {
      status: 'accepted';
      connectorId: string;
      taskId: string;
      sessionId: string;
    };

export interface ConnectorStopRequest {
  taskId: string;
}

export type ConnectorStopResult =
  | {
      status: 'stopped';
      taskId: string;
    }
  | {
      status: 'stopping';
      taskId: string;
    }
  | {
      status: 'not-found';
      taskId: string;
    };

export type ConnectorRuntimeState =
  | 'queued'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'retrying'
  | 'recovering'
  | 'reattached'
  | 'success'
  | 'error'
  | 'stopped'
  | 'timed-out'
  | 'dependency-blocked'
  | 'policy-blocked'
  | 'permission-denied'
  | 'session-lost';

export type ConnectorRuntimeEventKind =
  | 'lifecycle'
  | 'scheduler'
  | 'stdout'
  | 'stderr'
  | 'error'
  | 'timeout'
  | 'retry'
  | 'heartbeat'
  | 'recovery'
  | 'policy';

export type ConnectorLifecycleSubtype =
  | 'session-created'
  | 'task-queued'
  | 'task-dequeued'
  | 'slot-released'
  | 'dependency-blocked'
  | 'spawn-requested'
  | 'session-started'
  | 'attempt-started'
  | 'stopping-requested'
  | 'termination-escalated'
  | 'retry-scheduled'
  | 'retry-started'
  | 'recovery-started'
  | 'recovery-reattached'
  | 'output-truncated'
  | 'session-terminal';

export type ConnectorFailureKind =
  | 'exit-code'
  | 'process-error'
  | 'timeout'
  | 'cancelled'
  | 'dependency-blocked'
  | 'policy-blocked'
  | 'permission-denied';

export type ProcessLivenessStatus = 'unknown' | 'fresh' | 'stale';
export type ProcessLivenessSource = 'none' | 'process-event' | 'recovery-proof' | 'host-process-probe';

export interface ProcessLivenessEvidence {
  status: ProcessLivenessStatus;
  source: ProcessLivenessSource;
  lastSeen?: string;
  staleAfterMs: number;
}

export type AgentInstanceStatus = 'configured' | 'online' | 'busy' | 'offline' | 'degraded' | 'unknown';
export type AgentInstanceSource =
  | 'static-config'
  | 'connector-runtime'
  | 'recovery-proof'
  | 'host-process'
  | 'session-lost'
  | 'simulated'
  | 'unknown';

export type AgentHostDiscoveryAvailability = 'available' | 'unavailable' | 'unsupported';
export type AgentHostDiscoverySource = 'windows-process-list' | 'unsupported' | 'unavailable';

export interface AgentHostProcessFact {
  agentId: string;
  connectorId: string;
  displayName: string;
  running: true;
  processCount: number;
  observedAt: string;
}

export type AgentHostLifecycleState = 'not-installed' | 'stopped' | 'idle' | 'working';
export type AgentHostPrimaryAction = 'install' | 'launch' | 'focus';

export interface AgentHostLifecycleFact {
  agentId: string;
  connectorId: string;
  displayName: string;
  installed: boolean;
  serviceInstalled?: boolean;
  running: boolean;
  processCount: number;
  state: AgentHostLifecycleState;
  primaryAction?: AgentHostPrimaryAction;
  observedAt: string;
  detail: string;
}

export interface AgentHostDiscoverySnapshot {
  version: 1;
  availability: AgentHostDiscoveryAvailability;
  source: AgentHostDiscoverySource;
  observedAt: string;
  facts: AgentHostProcessFact[];
  lifecycle: AgentHostLifecycleFact[];
  detail: string;
}

export interface AgentHostActionRequest {
  agentId: string;
  action: AgentHostPrimaryAction;
}

export interface AgentHostActionResult {
  status: 'started' | 'completed' | 'blocked' | 'failed';
  agentId: string;
  action: AgentHostPrimaryAction;
  message: string;
}

export interface AgentInstance {
  instanceId: string;
  agentId: string;
  connectorId: string;
  status: AgentInstanceStatus;
  source: AgentInstanceSource;
  lastSeen?: string;
  capabilities: string[] | null;
  capabilitySource: ConnectorCapabilitySource;
  sessionId?: string;
  liveness: ProcessLivenessEvidence;
}

export interface ConnectorRuntimeEvent {
  eventId: string;
  sequence: number;
  timestamp: string;
  kind: ConnectorRuntimeEventKind;
  message: string;
  lifecycle?: ConnectorLifecycleSubtype;
  payload?: unknown;
}

export type ConnectorCapabilitySource = 'adapter-declaration' | 'runtime-observed' | 'unknown';

export interface ConnectorOutputStats {
  receivedBytes: number;
  archivedBytes: number;
  droppedBytes: number;
  outputEvents: number;
  truncatedLines: number;
  backpressureEvents: number;
}

export interface ConnectorTerminationEvidence {
  requestedAt: string;
  reason: 'user-cancel' | 'timeout' | 'process-error' | 'dispose';
  killAttempts: number;
  exitConfirmed: boolean;
  escalatedAt?: string;
}

export type ConnectorProcessEvidenceSource = 'windows-cim' | 'linux-procfs';
export type ConnectorProcessCwdSource = 'spawn-envelope' | 'linux-procfs';

export interface ConnectorProcessFingerprint {
  version: 1;
  pid: number;
  executablePath: string;
  startedAt: string;
  cwd: string;
  cwdSource: ConnectorProcessCwdSource;
  commandLineSha256: string;
  processIdentitySha256: string;
  runEnvelopeSha256: string;
  capturedAt: string;
  evidenceSource: ConnectorProcessEvidenceSource;
}

export interface ConnectorSession {
  taskId: string;
  sessionId: string;
  connectorId: string;
  agentId: string;
  taskName: string;
  requestedBy: ConnectorRunRequest['requestedBy'];
  source: 'runtime-spawn' | 'restart-recovery';
  capabilities: string[] | null;
  capabilitySource: ConnectorCapabilitySource;
  state: ConnectorRuntimeState;
  startedAt: string;
  queuedAt?: string;
  processStartedAt?: string;
  queueWaitMs?: number;
  dependsOn: string[];
  endedAt?: string;
  pid?: number;
  processFingerprint?: ConnectorProcessFingerprint;
  exitCode?: number;
  signal?: string;
  attempt: number;
  maxAttempts: number;
  retryPolicy: ConnectorRetryPolicy;
  timeoutAt?: string;
  failureKind?: ConnectorFailureKind;
  output: ConnectorOutputStats;
  termination?: ConnectorTerminationEvidence;
  liveness: ProcessLivenessEvidence;
  events: ConnectorRuntimeEvent[];
}

export type ConnectorRuntimeTask = ConnectorSession;

export interface ConnectorSessionAudit {
  taskId: string;
  sessionId: string;
  connectorId: string;
  agentId: string;
  state: ConnectorRuntimeState;
  source: ConnectorSession['source'];
  attempt: number;
  maxAttempts: number;
  startedAt: string;
  queuedAt?: string;
  processStartedAt?: string;
  queueWaitMs?: number;
  dependsOn: string[];
  endedAt?: string;
  failureKind?: ConnectorFailureKind;
  processFingerprint?: ConnectorProcessFingerprint;
  output: ConnectorOutputStats;
  termination?: ConnectorTerminationEvidence;
  events: ConnectorRuntimeEvent[];
}

export interface ConnectorRuntimeSnapshot {
  version: 1;
  updatedAt: string;
  tasks: ConnectorSession[];
  instances: AgentInstance[];
  runtime: ConnectorRuntimeEnvelope;
  hostDiscovery?: AgentHostDiscoverySnapshot;
}

export type CodexHostAvailability = 'available' | 'unavailable';
export type CodexHostSource = 'codex-desktop-session-log' | 'browser-fallback' | 'unavailable';

export interface CodexHostSessionSummary {
  sessionId: string;
  workspace: string;
  state: 'running' | 'idle';
  activeTurnCount: number;
  lastEventAt: string;
  activeStartedAt?: string;
  lastCompletedAt?: string;
}

export interface CodexHostSnapshot {
  version: 1;
  availability: CodexHostAvailability;
  source: CodexHostSource;
  observedAt: string;
  clientRunning: boolean;
  activeSessionCount: number;
  sessions: CodexHostSessionSummary[];
  lastCompletedAt?: string;
  lastCompletionKey?: string;
  detail: string;
}

export type ConnectorRuntimeAvailability = 'available' | 'unavailable' | 'recovering' | 'unknown';
export type ConnectorRuntimeMode = 'real' | 'simulated';
export type ConnectorRuntimeSource = 'electron-main' | 'browser-fallback' | 'persisted-recovery' | 'unknown';

export interface ConnectorRuntimeEnvelope {
  availability: ConnectorRuntimeAvailability;
  mode: ConnectorRuntimeMode;
  source: ConnectorRuntimeSource;
  observedAt: string;
  reason?: string;
}

export interface ConnectorPreflightResult {
  connectorId: string;
  label: string;
  status: ConnectorStatus;
  approvalStatus: ConnectorApprovalStatus;
  enabledByDefault: boolean;
  command: string;
  commandDiscovered: boolean;
  blockedReasons: ConnectorBlockedReason[];
}

export interface AgentTask {
  id: string;
  name: string;
  status: AgentTaskStatus;
  progress: number;
  startTime: string;
  endTime?: string;
  command: string;
  runner?: AgentTaskRunner;
  pid?: number;
  exitCode?: number;
  logs: string[];
  artifact?: string;
}

export type AgentStatus = 'idle' | 'active';

export interface AIAgent {
  id: string;
  slot: string;
  name: string;
  codename: string;
  badge: string;
  avatar: string;
  description: string;
  status: AgentStatus;
  modelName: string;
  endpoint: string;
  accent: string;
  tasks: AgentTask[];
}

export type NiuMaStatus =
  | 'idle'
  | 'coding'
  | 'debugging'
  | 'meeting'
  | 'coffee'
  | 'testing'
  | 'deploying'
  | 'done'
  | 'overtime'
  | 'drinkingWater'
  | 'panicking'
  | 'slacking'
  | 'praying'
  | 'demanding';

export interface NiuMaRuntimeState {
  status: NiuMaStatus;
  /** Transient host-truth override used by the renderer; never persisted as user intent. */
  observedStatus?: NiuMaStatus;
  energy: number;
  stress: number;
  temperature: number;
  quote: string;
  lastInteractionAt: string;
  /** 用户手动覆盖的状态(任务进度自动切态会忽略此字段;无任务时优先采用) */
  customState: NiuMaStatus | null;
  /** 头顶弹出的台词;为空表示不显示 */
  bubbleText: string | null;
  /** speech bubble 剩余 tick 数(2s/tick),0 表示已隐藏 */
  bubbleTimer: number;
  /** 是否被画饼(pie) 投喂过 → 进入 overtime 高强度态 */
  isFueledByPie: boolean;
}

export type NiuMaAction = 'pie' | 'coffee' | 'whip' | 'slack' | 'poke';

export type RanchMode = 'desktop' | 'floating';
export type RanchPersonality = 'chatty' | 'quiet' | 'silent';
export type Edge = 'left' | 'right' | 'top' | 'bottom' | 'none';

export interface RanchBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RanchInteractiveRegion extends RanchBounds {
}

export interface RanchContextMenuInput {
  x?: number;
  y?: number;
  agentId?: string | null;
}

export interface RanchPrefs {
  version: 1;
  mode: RanchMode;
  personality: RanchPersonality;
  selectedAgentId: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  dockedEdge: Edge;
  notifyPrefs: {
    bubble: boolean;
    system: boolean;
    cockpitBadge: boolean;
    sound: boolean;
  };
  schemaVersion: 1;
}

export interface RanchPrefsPatch {
  mode?: RanchMode;
  personality?: RanchPersonality;
  selectedAgentId?: string;
  position?: Partial<RanchPrefs['position']>;
  size?: Partial<RanchPrefs['size']>;
  dockedEdge?: Edge;
  notifyPrefs?: Partial<RanchPrefs['notifyPrefs']>;
}

export interface RanchNotifyPayload {
  title: string;
  body: string;
  agentId?: string;
}

export type AnimalPose =
  | 'rest_sleep'
  | 'work_type'
  | 'work_pace'
  | 'meeting_circle'
  | 'coffee_sip'
  | 'test_drip'
  | 'deploy_pray'
  | 'done_cheer'
  | 'overnight_dream'
  | 'water_drink'
  | 'panic_smoke'
  | 'slack_phone'
  | 'praying'
  | 'demand_angry'
  | 'idle_browse'
  | 'walk_slow'
  | 'walk_fast';

export interface RanchPoint {
  x: number;
  y: number;
}

export interface AnimalMotion {
  kind: 'idle' | 'walk' | 'turn' | 'shake' | 'cheer' | 'lay';
  to?: RanchPoint;
  duration?: number;
  repeat?: boolean;
}

export interface AnimalAction {
  pose: AnimalPose;
  motion?: AnimalMotion;
  bubble?: string;
  particle?: 'spark' | 'smoke' | 'flower' | 'none';
}

export interface AgentDef {
  agentId: string;
  displayName: string;
  codename: string;
  visual: {
    kind: 'emoji' | 'pixel' | 'svg';
    glyph: string;
    sprites?: Partial<Record<NiuMaStatus, string>>;
  };
  defaultPosition: RanchPoint;
  idleAnimation: 'breathe' | 'sway' | 'glance' | 'none';
}

export interface AgentSnapshot {
  version: 1;
  updatedAt: string;
  agents: AIAgent[];
  runtime: Record<string, NiuMaRuntimeState>;
  messages: AgentSystemMessage[];
}

export interface AgentSystemMessage {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  content: string;
  agentId?: string;
}

export interface CreateTaskInput {
  agentId: string;
  taskName: string;
  command: string;
  runner?: AgentTaskRunner;
}

export interface DesktopApi {
  getSnapshot: () => Promise<AgentSnapshot>;
  resetSeed: () => Promise<AgentSnapshot>;
  createTask: (input: CreateTaskInput) => Promise<AgentSnapshot>;
  evaluateConnectorGate: (input: ConnectorGateRequest) => Promise<ConnectorGateResult>;
  requestConnectorAuthorization: (input: ConnectorAuthorizationIntent) => Promise<ConnectorAuthorizationResult>;
  cancelConnectorAuthorization: (input: ConnectorAuthorizationCancelRequest) => Promise<ConnectorAuthorizationCancelResult>;
  runConnector: (input: ConnectorRunIntent) => Promise<ConnectorRunResult>;
  stopConnector: (input: ConnectorStopRequest) => Promise<ConnectorStopResult>;
  getConnectorRuntimeSnapshot: () => Promise<ConnectorRuntimeSnapshot>;
  getConnectorSessionAudit: (sessionId: string) => Promise<ConnectorSessionAudit | null>;
  onConnectorRuntimeSnapshotChanged: (callback: (snapshot: ConnectorRuntimeSnapshot) => void) => () => void;
  manageAgentHost: (input: AgentHostActionRequest) => Promise<AgentHostActionResult>;
  getCodexHostSnapshot: () => Promise<CodexHostSnapshot>;
  onCodexHostSnapshotChanged: (callback: (snapshot: CodexHostSnapshot) => void) => () => void;
  ranch: {
    getPrefs: () => Promise<RanchPrefs>;
    setPrefs: (patch: RanchPrefsPatch) => Promise<RanchPrefs>;
    openCockpit: () => Promise<void>;
    showContextMenu: (input?: RanchContextMenuInput) => Promise<void>;
    setBounds: (bounds: RanchBounds) => Promise<RanchPrefs>;
    resetUnread: () => Promise<void>;
    setMousePassthrough: (passthrough: boolean) => Promise<void>;
    setInteractiveRegions: (regions: RanchInteractiveRegion[]) => Promise<void>;
    requestSystemNotify: (payload: RanchNotifyPayload) => Promise<boolean>;
    requestNotificationSound: () => Promise<boolean>;
    onPrefsChanged: (callback: (prefs: RanchPrefs) => void) => () => void;
  };
  stopTask: (agentId: string, taskId: string) => Promise<AgentSnapshot>;
  clearCompletedTasks: (agentId: string) => Promise<AgentSnapshot>;
  applyNiuMaAction: (agentId: string, action: NiuMaAction) => Promise<AgentSnapshot>;
  cycleNiuMaState: (agentId: string) => Promise<AgentSnapshot>;
  onSnapshotChanged: (callback: (snapshot: AgentSnapshot) => void) => () => void;
}

declare global {
  interface Window {
    niumaDesk: DesktopApi;
  }
}
