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

export interface ConnectorRunRequest {
  agentId: string;
  connectorId: string;
  taskName: string;
  requestedBy: 'default-action' | 'explicit-user-action';
  confirmationAccepted?: boolean;
}

export type ConnectorRunResult =
  | {
      status: 'blocked';
      connectorId: string;
      blockedReasons: ConnectorBlockedReason[];
    }
  | {
      status: 'started';
      connectorId: string;
      taskId: string;
    };

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
