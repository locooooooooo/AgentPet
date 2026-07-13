import type {
  AgentSnapshot,
  ConnectorGateRequest,
  ConnectorRunIntent,
  ConnectorRuntimeSnapshot,
  ConnectorSessionAudit,
  ConnectorStopRequest,
  CreateTaskInput,
  DesktopApi,
  NiuMaAction,
  RanchBounds,
  RanchContextMenuInput,
  RanchNotifyPayload,
  RanchPrefs,
  RanchPrefsPatch
} from '../types';
import {
  applyNiuMaAction,
  clearCompletedTasks,
  createSeedSnapshot,
  createTask,
  cycleNiuMaState,
  normalizeSnapshot,
  progressNiuMaTick,
  progressRunningTasks,
  stopTask
} from './agentCore';

const STORAGE_KEY = 'multi-agent-niuma.snapshot';
const RANCH_PREFS_STORAGE_KEY = 'multi-agent-niuma.ranch.prefs';
const RANCH_DEFAULT_SIZE = { width: 640, height: 360 };
const LEGACY_RANCH_DEFAULT_SIZE = { width: 720, height: 320 };
const RANCH_EDGE_OFFSET = 80;
const LEGACY_RANCH_BOTTOM_OFFSET = 24;

export function getDesktopApi(): DesktopApi {
  if (typeof window !== 'undefined' && window.niumaDesk) {
    return window.niumaDesk;
  }

  let snapshot = readBrowserSnapshot();
  let ranchPrefs = readBrowserRanchPrefs(snapshot.agents[0]?.id ?? 'codex');
  const listeners = new Set<(snapshot: AgentSnapshot) => void>();
  const ranchPrefsListeners = new Set<(prefs: RanchPrefs) => void>();

  function publish(nextSnapshot: AgentSnapshot) {
    snapshot = nextSnapshot;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    listeners.forEach((listener) => listener(snapshot));
    return snapshot;
  }

  function publishRanchPrefs(nextPrefs: RanchPrefs) {
    ranchPrefs = nextPrefs;
    localStorage.setItem(RANCH_PREFS_STORAGE_KEY, JSON.stringify(ranchPrefs));
    ranchPrefsListeners.forEach((listener) => listener(ranchPrefs));
    return ranchPrefs;
  }

  function updateRanchPrefs(patch: RanchPrefsPatch) {
    return publishRanchPrefs(normalizeBrowserRanchPrefs({
      ...ranchPrefs,
      ...patch,
      position: {
        ...ranchPrefs.position,
        ...patch.position
      },
      size: {
        ...ranchPrefs.size,
        ...patch.size
      },
      notifyPrefs: {
        ...ranchPrefs.notifyPrefs,
        ...patch.notifyPrefs
      }
    }, ranchPrefs.selectedAgentId));
  }

  window.setInterval(() => {
    let nextSnapshot = progressRunningTasks(snapshot);
    if (nextSnapshot !== snapshot) {
      publish(nextSnapshot);
    }
    nextSnapshot = progressNiuMaTick(snapshot);
    if (nextSnapshot !== snapshot) {
      publish(nextSnapshot);
    }
  }, 2500);

  return {
    getSnapshot: async () => snapshot,
    resetSeed: async () => publish(createSeedSnapshot()),
    createTask: async (input: CreateTaskInput) => publish(createTask(snapshot, { ...input, runner: 'simulated' })),
    evaluateConnectorGate: async (input: ConnectorGateRequest) => ({
      executable: false,
      connectorId: input.connectorId,
      blockedReasons: ['policy-unavailable']
    }),
    runConnector: async (input: ConnectorRunIntent) => ({
      status: 'blocked',
      connectorId: input.connectorId,
      blockedReasons: ['runtime-unavailable']
    }),
    stopConnector: async (input: ConnectorStopRequest) => ({
      status: 'not-found',
      taskId: input.taskId
    }),
    getConnectorRuntimeSnapshot: async (): Promise<ConnectorRuntimeSnapshot> => ({
      version: 1,
      updatedAt: new Date().toISOString(),
      tasks: [],
      instances: [],
      runtime: {
        availability: 'unavailable',
        mode: 'simulated',
        source: 'browser-fallback',
        observedAt: new Date().toISOString(),
        reason: 'Electron Connector runtime is unavailable in browser fallback mode.'
      }
    }),
    getConnectorSessionAudit: async (_sessionId: string): Promise<ConnectorSessionAudit | null> => null,
    onConnectorRuntimeSnapshotChanged: (_callback: (snapshot: ConnectorRuntimeSnapshot) => void) => () => {},
    ranch: {
      getPrefs: async () => ranchPrefs,
      setPrefs: async (patch: RanchPrefsPatch) => updateRanchPrefs(patch),
      openCockpit: async () => {
        console.info('[desktopClient] ranch.openCockpit fallback');
        window.focus();
      },
      showContextMenu: async (input?: RanchContextMenuInput) => {
        console.info('[desktopClient] ranch.showContextMenu fallback', input ?? null);
      },
      setBounds: async (bounds: RanchBounds) => {
        const nextBounds = normalizeBrowserRanchBounds(bounds, ranchPrefs);
        return updateRanchPrefs({
          position: {
            x: nextBounds.x,
            y: nextBounds.y
          },
          size: {
            width: nextBounds.width,
            height: nextBounds.height
          }
        });
      },
      resetUnread: async () => {},
      setMousePassthrough: async (_passthrough: boolean) => {},
      setInteractiveRegions: async (_regions) => {},
      requestSystemNotify: async (_payload: RanchNotifyPayload) => ranchPrefs.notifyPrefs.system,
      onPrefsChanged: (callback: (prefs: RanchPrefs) => void) => {
        ranchPrefsListeners.add(callback);
        return () => ranchPrefsListeners.delete(callback);
      }
    },
    stopTask: async (agentId: string, taskId: string) => publish(stopTask(snapshot, agentId, taskId)),
    clearCompletedTasks: async (agentId: string) => publish(clearCompletedTasks(snapshot, agentId)),
    applyNiuMaAction: async (agentId: string, action: NiuMaAction) => publish(applyNiuMaAction(snapshot, agentId, action)),
    cycleNiuMaState: async (agentId: string) => publish(cycleNiuMaState(snapshot, agentId)),
    onSnapshotChanged: (callback: (snapshot: AgentSnapshot) => void) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    }
  };
}

function createBrowserRanchPrefs(selectedAgentId: string): RanchPrefs {
  const width = RANCH_DEFAULT_SIZE.width;
  const height = RANCH_DEFAULT_SIZE.height;
  const x = Math.max(0, Math.round((window.screen?.availWidth ?? width) - width - RANCH_EDGE_OFFSET));
  const y = Math.max(0, Math.round((window.screen?.availHeight ?? height) - height - RANCH_EDGE_OFFSET));

  return {
    version: 1,
    mode: 'desktop',
    personality: 'chatty',
    selectedAgentId,
    position: { x, y },
    size: { width, height },
    dockedEdge: 'none',
    notifyPrefs: {
      bubble: true,
      system: true,
      cockpitBadge: true
    },
    schemaVersion: 1
  };
}

function createLegacyBrowserRanchDefaultPosition() {
  const width = LEGACY_RANCH_DEFAULT_SIZE.width;
  const height = LEGACY_RANCH_DEFAULT_SIZE.height;
  return {
    x: Math.max(0, Math.round(((window.screen?.availWidth ?? width) - width) / 2)),
    y: Math.max(0, Math.round((window.screen?.availHeight ?? height) - height - LEGACY_RANCH_BOTTOM_OFFSET))
  };
}

function readBrowserRanchPrefs(selectedAgentId: string): RanchPrefs {
  const raw = localStorage.getItem(RANCH_PREFS_STORAGE_KEY);
  if (!raw) {
    const prefs = createBrowserRanchPrefs(selectedAgentId);
    localStorage.setItem(RANCH_PREFS_STORAGE_KEY, JSON.stringify(prefs));
    return prefs;
  }

  try {
    return normalizeBrowserRanchPrefs(JSON.parse(raw), selectedAgentId);
  } catch {
    const prefs = createBrowserRanchPrefs(selectedAgentId);
    localStorage.setItem(RANCH_PREFS_STORAGE_KEY, JSON.stringify(prefs));
    return prefs;
  }
}

function normalizeBrowserRanchPrefs(value: unknown, selectedAgentId: string): RanchPrefs {
  const seed = createBrowserRanchPrefs(selectedAgentId);
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return seed;
  }

  const candidate = value as Partial<RanchPrefs>;
  const position = typeof candidate.position === 'object' && candidate.position !== null
    ? candidate.position
    : seed.position;
  const size = typeof candidate.size === 'object' && candidate.size !== null
    ? candidate.size
    : seed.size;
  const notifyPrefs = typeof candidate.notifyPrefs === 'object' && candidate.notifyPrefs !== null
    ? candidate.notifyPrefs
    : seed.notifyPrefs;
  const legacyPosition = createLegacyBrowserRanchDefaultPosition();
  const shouldMigrateLegacyDefaults = (
    candidate.mode === 'floating' &&
    candidate.schemaVersion === 1 &&
    candidate.dockedEdge === 'none' &&
    isExactNumber(size.width, LEGACY_RANCH_DEFAULT_SIZE.width) &&
    isExactNumber(size.height, LEGACY_RANCH_DEFAULT_SIZE.height) &&
    isExactNumber(position.x, legacyPosition.x) &&
    isExactNumber(position.y, legacyPosition.y)
  );

  return {
    version: 1,
    mode: shouldMigrateLegacyDefaults ? seed.mode : (candidate.mode === 'floating' ? 'floating' : 'desktop'),
    personality: candidate.personality === 'quiet' || candidate.personality === 'silent' ? candidate.personality : 'chatty',
    selectedAgentId: typeof candidate.selectedAgentId === 'string' && candidate.selectedAgentId.trim() ? candidate.selectedAgentId : selectedAgentId,
    position: {
      x: shouldMigrateLegacyDefaults ? seed.position.x : numberOr(position.x, seed.position.x),
      y: shouldMigrateLegacyDefaults ? seed.position.y : numberOr(position.y, seed.position.y)
    },
    size: {
      width: shouldMigrateLegacyDefaults ? seed.size.width : clampSize(numberOr(size.width, seed.size.width), 320, 1200),
      height: shouldMigrateLegacyDefaults ? seed.size.height : clampSize(numberOr(size.height, seed.size.height), 200, 500)
    },
    dockedEdge: candidate.dockedEdge === 'left' || candidate.dockedEdge === 'right' || candidate.dockedEdge === 'top' || candidate.dockedEdge === 'bottom'
      ? candidate.dockedEdge
      : 'none',
    notifyPrefs: {
      bubble: boolOr(notifyPrefs.bubble, true),
      system: boolOr(notifyPrefs.system, true),
      cockpitBadge: boolOr(notifyPrefs.cockpitBadge, true)
    },
    schemaVersion: 1
  };
}

function numberOr(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
}

function isExactNumber(value: unknown, expected: number) {
  return typeof value === 'number' && Number.isFinite(value) && Math.round(value) === expected;
}

function boolOr(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function clampSize(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeBrowserRanchBounds(bounds: RanchBounds, prefs: RanchPrefs): RanchBounds {
  const candidate = typeof bounds === 'object' && bounds !== null
    ? bounds
    : {
        x: prefs.position.x,
        y: prefs.position.y,
        width: prefs.size.width,
        height: prefs.size.height
      };

  return {
    x: numberOr(candidate.x, prefs.position.x),
    y: numberOr(candidate.y, prefs.position.y),
    width: clampSize(numberOr(candidate.width, prefs.size.width), 320, 1200),
    height: clampSize(numberOr(candidate.height, prefs.size.height), 200, 500)
  };
}

function readBrowserSnapshot(): AgentSnapshot {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const snapshot = createSeedSnapshot();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    return snapshot;
  }

  try {
    return normalizeSnapshot(JSON.parse(raw));
  } catch {
    const snapshot = createSeedSnapshot();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    return snapshot;
  }
}
