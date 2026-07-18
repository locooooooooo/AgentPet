import { contextBridge, ipcRenderer } from 'electron';
import type {
  AgentSnapshot,
  AgentHostActionRequest,
  AgentHostActionResult,
  CodexHostSnapshot,
  ConnectorAuthorizationCancelRequest,
  ConnectorAuthorizationCancelResult,
  ConnectorAuthorizationIntent,
  ConnectorAuthorizationResult,
  ConnectorGateRequest,
  ConnectorGateResult,
  ConnectorRunIntent,
  ConnectorRunResult,
  ConnectorRuntimeSnapshot,
  ConnectorSessionAudit,
  ConnectorStopRequest,
  ConnectorStopResult,
  CreateTaskInput,
  NiuMaAction,
  RanchBounds,
  RanchContextMenuInput,
  RanchInteractiveRegion,
  RanchNotifyPayload,
  RanchPrefs,
  RanchPrefsPatch
} from '../src/types';

const api = {
  getSnapshot: (): Promise<AgentSnapshot> => ipcRenderer.invoke('agents:get-snapshot'),
  resetSeed: (): Promise<AgentSnapshot> => ipcRenderer.invoke('agents:reset-seed'),
  createTask: (input: CreateTaskInput): Promise<AgentSnapshot> => ipcRenderer.invoke('agents:create-task', input),
  evaluateConnectorGate: (input: ConnectorGateRequest): Promise<ConnectorGateResult> =>
    ipcRenderer.invoke('connectors:evaluate-gate', {
      connectorId: input.connectorId
    }),
  requestConnectorAuthorization: (input: ConnectorAuthorizationIntent): Promise<ConnectorAuthorizationResult> =>
    ipcRenderer.invoke('connectors:request-authorization', {
      connectorId: input.connectorId,
      agentId: input.agentId,
      taskName: input.taskName,
      prompt: input.prompt,
      retry: input.retry ? {
        maxRetries: input.retry.maxRetries,
        backoffMs: input.retry.backoffMs,
        budgetMs: input.retry.budgetMs
      } : undefined
    }),
  cancelConnectorAuthorization: (input: ConnectorAuthorizationCancelRequest): Promise<ConnectorAuthorizationCancelResult> =>
    ipcRenderer.invoke('connectors:cancel-authorization', { grantId: input.grantId }),
  runConnector: (input: ConnectorRunIntent): Promise<ConnectorRunResult> =>
    ipcRenderer.invoke('connectors:run', {
      connectorId: input.connectorId,
      agentId: input.agentId,
      taskName: input.taskName,
      prompt: input.prompt,
      authorizationGrant: input.authorizationGrant,
      retry: input.retry ? {
        maxRetries: input.retry.maxRetries,
        backoffMs: input.retry.backoffMs,
        budgetMs: input.retry.budgetMs
      } : undefined
    }),
  stopConnector: (input: ConnectorStopRequest): Promise<ConnectorStopResult> =>
    ipcRenderer.invoke('connectors:stop', { taskId: input.taskId }),
  getConnectorRuntimeSnapshot: (): Promise<ConnectorRuntimeSnapshot> =>
    ipcRenderer.invoke('connectors:get-runtime-snapshot'),
  getConnectorSessionAudit: (sessionId: string): Promise<ConnectorSessionAudit | null> =>
    ipcRenderer.invoke('connectors:get-session-audit', { sessionId }),
  onConnectorRuntimeSnapshotChanged: (callback: (snapshot: ConnectorRuntimeSnapshot) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: ConnectorRuntimeSnapshot) => callback(snapshot);
    ipcRenderer.on('connectors:runtime-snapshot-changed', listener);
    return () => ipcRenderer.removeListener('connectors:runtime-snapshot-changed', listener);
  },
  manageAgentHost: (input: AgentHostActionRequest): Promise<AgentHostActionResult> =>
    ipcRenderer.invoke('agents:manage-host', {
      agentId: input.agentId,
      action: input.action
    }),
  getCodexHostSnapshot: (): Promise<CodexHostSnapshot> => ipcRenderer.invoke('codex:get-host-snapshot'),
  onCodexHostSnapshotChanged: (callback: (snapshot: CodexHostSnapshot) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: CodexHostSnapshot) => callback(snapshot);
    ipcRenderer.on('codex:host-snapshot-changed', listener);
    return () => ipcRenderer.removeListener('codex:host-snapshot-changed', listener);
  },
  ranch: {
    getPrefs: (): Promise<RanchPrefs> => ipcRenderer.invoke('ranch:get-prefs'),
    setPrefs: (patch: RanchPrefsPatch): Promise<RanchPrefs> => ipcRenderer.invoke('ranch:set-prefs', patch),
    openCockpit: (): Promise<void> => ipcRenderer.invoke('ranch:open-cockpit'),
    showContextMenu: (input?: RanchContextMenuInput): Promise<void> => ipcRenderer.invoke('ranch:show-context-menu', input),
    setBounds: (bounds: RanchBounds): Promise<RanchPrefs> => ipcRenderer.invoke('ranch:set-bounds', bounds),
    resetUnread: (): Promise<void> => ipcRenderer.invoke('ranch:reset-unread'),
    setMousePassthrough: (passthrough: boolean): Promise<void> =>
      ipcRenderer.invoke('ranch:set-mouse-passthrough', passthrough),
    setInteractiveRegions: (regions: RanchInteractiveRegion[]): Promise<void> =>
      ipcRenderer.invoke('ranch:set-interactive-regions', regions),
    requestSystemNotify: (payload: RanchNotifyPayload): Promise<boolean> =>
      ipcRenderer.invoke('ranch:request-notify', payload),
    requestNotificationSound: (): Promise<boolean> => ipcRenderer.invoke('ranch:request-notify-sound'),
    onPrefsChanged: (callback: (prefs: RanchPrefs) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, prefs: RanchPrefs) => callback(prefs);
      ipcRenderer.on('ranch:prefs-changed', listener);
      return () => ipcRenderer.removeListener('ranch:prefs-changed', listener);
    }
  },
  stopTask: (agentId: string, taskId: string): Promise<AgentSnapshot> =>
    ipcRenderer.invoke('agents:stop-task', { agentId, taskId }),
  clearCompletedTasks: (agentId: string): Promise<AgentSnapshot> =>
    ipcRenderer.invoke('agents:clear-completed-tasks', { agentId }),
  applyNiuMaAction: (agentId: string, action: NiuMaAction): Promise<AgentSnapshot> =>
    ipcRenderer.invoke('agents:apply-niuma-action', { agentId, action }),
  cycleNiuMaState: (agentId: string): Promise<AgentSnapshot> =>
    ipcRenderer.invoke('agents:cycle-niuma-state', { agentId }),
  onSnapshotChanged: (callback: (snapshot: AgentSnapshot) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: AgentSnapshot) => callback(snapshot);
    ipcRenderer.on('agents:snapshot-changed', listener);
    return () => ipcRenderer.removeListener('agents:snapshot-changed', listener);
  }
};

contextBridge.exposeInMainWorld('niumaDesk', api);
