import { contextBridge, ipcRenderer } from 'electron';
import type {
  AgentSnapshot,
  ConnectorGateRequest,
  ConnectorGateResult,
  CreateTaskInput,
  NiuMaAction,
  RanchBounds,
  RanchContextMenuInput,
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
      connectorId: input.connectorId,
      requestedBy: input.requestedBy,
      confirmationAccepted: input.confirmationAccepted
    }),
  ranch: {
    getPrefs: (): Promise<RanchPrefs> => ipcRenderer.invoke('ranch:get-prefs'),
    setPrefs: (patch: RanchPrefsPatch): Promise<RanchPrefs> => ipcRenderer.invoke('ranch:set-prefs', patch),
    openCockpit: (): Promise<void> => ipcRenderer.invoke('ranch:open-cockpit'),
    showContextMenu: (input?: RanchContextMenuInput): Promise<void> => ipcRenderer.invoke('ranch:show-context-menu', input),
    setBounds: (bounds: RanchBounds): Promise<RanchPrefs> => ipcRenderer.invoke('ranch:set-bounds', bounds),
    resetUnread: (): Promise<void> => ipcRenderer.invoke('ranch:reset-unread'),
    setMousePassthrough: (passthrough: boolean): Promise<void> =>
      ipcRenderer.invoke('ranch:set-mouse-passthrough', passthrough),
    requestSystemNotify: (payload: RanchNotifyPayload): Promise<boolean> =>
      ipcRenderer.invoke('ranch:request-notify', payload),
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
