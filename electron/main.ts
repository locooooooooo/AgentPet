import { app, BrowserWindow, Menu, Notification, Tray, ipcMain, nativeImage, screen, type MenuItemConstructorOptions } from 'electron';
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type {
  AgentSnapshot,
  AgentTask,
  ConnectorGateRequest,
  ConnectorGateResult,
  ConnectorPolicyConfig,
  CreateTaskInput,
  NiuMaAction,
  RanchContextMenuInput,
  RanchNotifyPayload,
  RanchBounds,
  RanchMode,
  RanchPrefs,
  RanchPrefsPatch
} from '../src/types';
import { evaluateConnectorPolicyGate } from '../src/lib/connectorGate';
import {
  applyNiuMaAction,
  clearCompletedTasks,
  createTask,
  createSeedSnapshot,
  cycleNiuMaState,
  normalizeSnapshot,
  progressNiuMaTick,
  progressRunningTasks,
  stopTask
} from '../src/lib/agentCore';

let mainWindow: BrowserWindow | null = null;
let ranchWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let snapshot: AgentSnapshot;
let ranchPrefs: RanchPrefs;
let isQuitting = false;
let ranchUnreadCount = 0;
const runningProcesses = new Map<string, ChildProcessWithoutNullStreams>();

const dataDir = path.join(app.getPath('userData'), 'agent-data');
const snapshotPath = path.join(dataDir, 'agents.json');
const ranchPrefsPath = path.join(app.getPath('userData'), 'ranch-prefs.json');
const connectorPolicyPath = path.join(process.cwd(), 'docs/orchestration/connectors.json');
const ranchDefaultSize = { width: 640, height: 360 };
const legacyRanchDefaultSize = { width: 720, height: 320 };
const ranchEdgeOffset = 80;
const legacyRanchBottomOffset = 24;
const ranchSizeLimits = {
  minWidth: 320,
  minHeight: 200,
  maxWidth: 1200,
  maxHeight: 500
};
const mainWindowTitle = '桌面牧场 · 控制舱';

function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadSnapshot(): AgentSnapshot {
  ensureDataDir();
  if (!fs.existsSync(snapshotPath)) {
    const seeded = createSeedSnapshot();
    saveSnapshot(seeded);
    return seeded;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(snapshotPath, 'utf8')) as unknown;
    return normalizeSnapshot(parsed);
  } catch {
    const fallback = createSeedSnapshot();
    saveSnapshot(fallback);
    return fallback;
  }
}

function saveSnapshot(nextSnapshot: AgentSnapshot) {
  ensureDataDir();
  fs.writeFileSync(snapshotPath, JSON.stringify(nextSnapshot, null, 2), 'utf8');
}

function ensureUserDataDir() {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
}

function createRanchSeedPrefs(): RanchPrefs {
  const display = screen.getPrimaryDisplay();
  const bounds = display.workArea;
  const width = ranchDefaultSize.width;
  const height = ranchDefaultSize.height;
  const x = Math.max(bounds.x, Math.round(bounds.x + bounds.width - width - ranchEdgeOffset));
  const y = Math.max(bounds.y, Math.round(bounds.y + bounds.height - height - ranchEdgeOffset));

  return {
    version: 1,
    mode: 'desktop',
    personality: 'chatty',
    selectedAgentId: snapshot.agents[0]?.id ?? 'codex',
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

function createLegacyRanchDefaultPosition() {
  const display = screen.getPrimaryDisplay();
  const bounds = display.workArea;
  return {
    x: Math.round(bounds.x + (bounds.width - legacyRanchDefaultSize.width) / 2),
    y: Math.round(bounds.y + bounds.height - legacyRanchDefaultSize.height - legacyRanchBottomOffset)
  };
}

function loadRanchPrefs(): RanchPrefs {
  ensureUserDataDir();
  if (!fs.existsSync(ranchPrefsPath)) {
    const seed = createRanchSeedPrefs();
    saveRanchPrefs(seed);
    return seed;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(ranchPrefsPath, 'utf8')) as unknown;
    const normalized = normalizeRanchPrefs(parsed);
    saveRanchPrefs(normalized);
    return normalized;
  } catch {
    const fallback = createRanchSeedPrefs();
    saveRanchPrefs(fallback);
    return fallback;
  }
}

function saveRanchPrefs(nextPrefs: RanchPrefs) {
  ensureUserDataDir();
  fs.writeFileSync(ranchPrefsPath, JSON.stringify(nextPrefs, null, 2), 'utf8');
}

function normalizeRanchPrefs(value: unknown): RanchPrefs {
  const seed = createRanchSeedPrefs();
  const candidate = asRecord(value);
  if (!candidate) {
    return seed;
  }

  const position = asRecord(candidate.position) ?? seed.position;
  const size = asRecord(candidate.size) ?? seed.size;
  const notifyPrefs = asRecord(candidate.notifyPrefs) ?? seed.notifyPrefs;
  const dockedEdge = candidate.dockedEdge;
  const legacyPosition = createLegacyRanchDefaultPosition();
  const shouldMigrateLegacyDefaults = (
    candidate.mode === 'floating' &&
    candidate.schemaVersion === 1 &&
    dockedEdge === 'none' &&
    isExactNumber(size.width, legacyRanchDefaultSize.width) &&
    isExactNumber(size.height, legacyRanchDefaultSize.height) &&
    isExactNumber(position.x, legacyPosition.x) &&
    isExactNumber(position.y, legacyPosition.y)
  );

  return {
    version: 1,
    mode: shouldMigrateLegacyDefaults
      ? seed.mode
      : (candidate.mode === 'floating' ? 'floating' : 'desktop'),
    personality: candidate.personality === 'quiet' || candidate.personality === 'silent' ? candidate.personality : 'chatty',
    selectedAgentId: typeof candidate.selectedAgentId === 'string' && candidate.selectedAgentId.trim()
      ? candidate.selectedAgentId
      : seed.selectedAgentId,
    position: {
      x: shouldMigrateLegacyDefaults ? seed.position.x : numberOr(position.x, seed.position.x),
      y: shouldMigrateLegacyDefaults ? seed.position.y : numberOr(position.y, seed.position.y)
    },
    size: {
      width: shouldMigrateLegacyDefaults
        ? seed.size.width
        : clampNumber(numberOr(size.width, seed.size.width), ranchSizeLimits.minWidth, ranchSizeLimits.maxWidth),
      height: shouldMigrateLegacyDefaults
        ? seed.size.height
        : clampNumber(numberOr(size.height, seed.size.height), ranchSizeLimits.minHeight, ranchSizeLimits.maxHeight)
    },
    dockedEdge: dockedEdge === 'left' || dockedEdge === 'right' || dockedEdge === 'top' || dockedEdge === 'bottom'
      ? dockedEdge
      : 'none',
    notifyPrefs: {
      bubble: boolOr(notifyPrefs.bubble, true),
      system: boolOr(notifyPrefs.system, true),
      cockpitBadge: boolOr(notifyPrefs.cockpitBadge, true)
    },
    schemaVersion: 1
  };
}

function mergeRanchPrefsPatch(patch: RanchPrefsPatch): RanchPrefs {
  return normalizeRanchPrefs({
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
  });
}

function normalizeRanchBounds(bounds: RanchBounds): RanchBounds {
  const candidate = asRecord(bounds);

  return {
    x: numberOr(candidate?.x, ranchPrefs.position.x),
    y: numberOr(candidate?.y, ranchPrefs.position.y),
    width: clampNumber(numberOr(candidate?.width, ranchPrefs.size.width), ranchSizeLimits.minWidth, ranchSizeLimits.maxWidth),
    height: clampNumber(numberOr(candidate?.height, ranchPrefs.size.height), ranchSizeLimits.minHeight, ranchSizeLimits.maxHeight)
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
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

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function updateMainWindowTitle() {
  mainWindow?.setTitle(ranchUnreadCount > 0 ? `(${ranchUnreadCount}) ${mainWindowTitle}` : mainWindowTitle);
}

function setRanchUnreadCount(nextCount: number) {
  ranchUnreadCount = Math.max(0, Math.round(nextCount));
  updateMainWindowTitle();
}

function resetRanchUnreadCount() {
  if (ranchUnreadCount === 0) {
    updateMainWindowTitle();
    return;
  }

  setRanchUnreadCount(0);
}

function broadcastRanchPrefsChanged() {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send('ranch:prefs-changed', ranchPrefs);
  });
}

function commitRanchPrefs(nextPrefs: RanchPrefs) {
  ranchPrefs = nextPrefs;
  saveRanchPrefs(ranchPrefs);
  applyRanchPrefsToWindow();
  if (!ranchPrefs.notifyPrefs.cockpitBadge) {
    resetRanchUnreadCount();
  }
  broadcastRanchPrefsChanged();
  return ranchPrefs;
}

function updateRanchPrefs(patch: RanchPrefsPatch) {
  return commitRanchPrefs(mergeRanchPrefsPatch(patch));
}

function isRanchUnreadContext() {
  return !ranchWindow || !ranchWindow.isVisible() || ranchPrefs.mode === 'desktop';
}

function isCockpitInteractive() {
  return Boolean(mainWindow?.isVisible() && mainWindow.isFocused());
}

function maybeTrackRanchUnread(previousSnapshot: AgentSnapshot, nextSnapshot: AgentSnapshot) {
  const previousMessageId = previousSnapshot.messages[0]?.id ?? null;
  const nextMessageId = nextSnapshot.messages[0]?.id ?? null;

  if (
    !nextMessageId ||
    nextMessageId === previousMessageId ||
    !ranchPrefs.notifyPrefs.cockpitBadge ||
    !isRanchUnreadContext() ||
    isCockpitInteractive()
  ) {
    return;
  }

  setRanchUnreadCount(ranchUnreadCount + 1);
}

function showAndFocusCockpit() {
  resetRanchUnreadCount();

  if (!mainWindow) {
    const createdWindow = createWindow();
    createdWindow.once('ready-to-show', () => {
      createdWindow.focus();
    });
    return;
  }

  const cockpitWindow = mainWindow;

  if (cockpitWindow.isMinimized()) {
    cockpitWindow.restore();
  }

  cockpitWindow.show();
  cockpitWindow.focus();
}

function publishSnapshot(nextSnapshot: AgentSnapshot) {
  const previousSnapshot = snapshot;
  snapshot = nextSnapshot;
  saveSnapshot(snapshot);
  maybeTrackRanchUnread(previousSnapshot, nextSnapshot);
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send('agents:snapshot-changed', snapshot);
  });
}

function patchTask(agentId: string, taskId: string, patcher: (task: AgentTask) => AgentTask): AgentSnapshot {
  const now = new Date().toISOString();
  let changed = false;
  const agents = snapshot.agents.map((agent) => {
    if (agent.id !== agentId) {
      return agent;
    }

    const tasks = agent.tasks.map((task) => {
      if (task.id !== taskId) {
        return task;
      }
      const nextTask = patcher(task);
      if (nextTask !== task) {
        changed = true;
      }
      return nextTask;
    });

    return {
      ...agent,
      status: tasks.some((task) => task.status === 'running') ? 'active' as const : 'idle' as const,
      tasks
    };
  });

  return changed ? { ...snapshot, agents, updatedAt: now } : snapshot;
}

function appendTaskLog(agentId: string, taskId: string, line: string) {
  publishSnapshot(patchTask(agentId, taskId, (task) => {
    if (task.status !== 'running') {
      return task;
    }

    return {
      ...task,
      logs: [...task.logs, `[${formatLogTime()}] ${line}`].slice(-80)
    };
  }));
}

function completeLocalTask(agentId: string, taskId: string, exitCode: number | null) {
  runningProcesses.delete(taskId);
  const success = exitCode === 0;
  publishSnapshot(patchTask(agentId, taskId, (task) => {
    if (task.status !== 'running') {
      return task;
    }

    return {
      ...task,
      status: success ? 'success' : 'error',
      progress: success ? 100 : Math.max(task.progress, 8),
      endTime: new Date().toISOString(),
      exitCode: exitCode ?? undefined,
      logs: [
        ...task.logs,
        `[${formatLogTime()}] 本地命令已退出，exit code: ${exitCode ?? 'unknown'}。`
      ].slice(-80),
      artifact: success ? `本地命令完成：${task.command}` : `本地命令失败：${task.command}`
    };
  }));
}

function startLocalRunner(agentId: string, task: AgentTask) {
  if (!task.command.trim()) {
    completeLocalTask(agentId, task.id, 1);
    return;
  }

  const child = spawn(task.command, {
    cwd: process.cwd(),
    env: process.env,
    shell: true,
    windowsHide: true
  });

  runningProcesses.set(task.id, child);
  publishSnapshot(patchTask(agentId, task.id, (currentTask) => ({
    ...currentTask,
    pid: child.pid,
    logs: [
      ...currentTask.logs,
      `[${formatLogTime()}] 已启动本地进程 PID ${child.pid ?? 'unknown'}。`,
      `[${formatLogTime()}] 工作目录：${process.cwd()}`
    ].slice(-80)
  })));

  child.stdout.on('data', (chunk) => {
    String(chunk).split(/\r?\n/).filter(Boolean).forEach((line) => {
      appendTaskLog(agentId, task.id, `stdout: ${line}`);
    });
  });

  child.stderr.on('data', (chunk) => {
    String(chunk).split(/\r?\n/).filter(Boolean).forEach((line) => {
      appendTaskLog(agentId, task.id, `stderr: ${line}`);
    });
  });

  child.on('error', (error) => {
    appendTaskLog(agentId, task.id, `启动失败：${error.message}`);
    completeLocalTask(agentId, task.id, 1);
  });

  child.on('exit', (code) => {
    completeLocalTask(agentId, task.id, code);
  });
}

function stopLocalRunner(taskId: string) {
  const child = runningProcesses.get(taskId);
  if (!child) {
    return false;
  }

  runningProcesses.delete(taskId);
  child.kill();
  return true;
}

function findTask(agentId: string, taskId: string) {
  return snapshot.agents.find((agent) => agent.id === agentId)?.tasks.find((task) => task.id === taskId);
}

function loadConnectorPolicy(): ConnectorPolicyConfig | null {
  try {
    return JSON.parse(fs.readFileSync(connectorPolicyPath, 'utf8')) as ConnectorPolicyConfig;
  } catch {
    return null;
  }
}

function resolveConnectorCommand(command: string) {
  if (!command.trim()) {
    return false;
  }

  const result = spawnSync('where.exe', [command], {
    cwd: process.cwd(),
    encoding: 'utf8',
    windowsHide: true
  });
  return result.status === 0;
}

function evaluateConnectorGateFromPolicy(input: ConnectorGateRequest): ConnectorGateResult {
  const policy = loadConnectorPolicy();
  if (!policy) {
    return {
      executable: false,
      connectorId: input.connectorId,
      blockedReasons: ['policy-unavailable']
    };
  }

  return evaluateConnectorPolicyGate(policy, input, resolveConnectorCommand).result;
}

function loadEntry(window: BrowserWindow, entry: 'index' | 'ranch') {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void window.loadURL(entry === 'index' ? devServerUrl : `${devServerUrl}ranch.html`);
    return;
  }
  void window.loadFile(path.join(__dirname, `../dist/${entry}.html`));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1220,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    title: mainWindowTitle,
    backgroundColor: '#080808',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('show', () => {
    resetRanchUnreadCount();
  });

  mainWindow.on('focus', () => {
    resetRanchUnreadCount();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  updateMainWindowTitle();
  loadEntry(mainWindow, 'index');
  return mainWindow;
}

function createRanchWindow() {
  ranchWindow = new BrowserWindow({
    width: ranchPrefs.size.width,
    height: ranchPrefs.size.height,
    x: ranchPrefs.position.x,
    y: ranchPrefs.position.y,
    minWidth: ranchSizeLimits.minWidth,
    minHeight: ranchSizeLimits.minHeight,
    maxWidth: ranchSizeLimits.maxWidth,
    maxHeight: ranchSizeLimits.maxHeight,
    title: '桌面牧场',
    backgroundColor: '#00000000',
    transparent: true,
    frame: false,
    resizable: true,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: ranchPrefs.mode === 'floating',
    show: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false
    }
  });

  applyRanchMode(ranchPrefs.mode);
  ranchWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  ranchWindow.once('ready-to-show', () => {
    if (!ranchWindow) {
      return;
    }

    if (ranchPrefs.mode === 'desktop') {
      ranchWindow.showInactive();
    } else {
      ranchWindow.show();
    }
  });

  ranchWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      if (ranchPrefs.mode === 'floating') {
        ranchWindow?.hide();
      }
    }
  });

  ranchWindow.on('closed', () => {
    ranchWindow = null;
  });

  loadEntry(ranchWindow, 'ranch');
}

function setRanchMousePassthrough(passthrough: boolean) {
  if (!ranchWindow) {
    return;
  }

  if (ranchPrefs.mode === 'desktop' && passthrough) {
    ranchWindow.setIgnoreMouseEvents(true, { forward: true });
    return;
  }

  ranchWindow.setIgnoreMouseEvents(false);
}

function applyRanchMode(mode: RanchMode) {
  if (!ranchWindow) {
    return;
  }

  const isFloating = mode === 'floating';

  ranchWindow.setAlwaysOnTop(true, isFloating ? 'floating' : 'screen-saver');
  ranchWindow.setFocusable(isFloating);

  if (!isFloating && !ranchWindow.isVisible()) {
    ranchWindow.showInactive();
  }

  setRanchMousePassthrough(!isFloating);
}

function applyRanchPrefsToWindow() {
  if (!ranchWindow) {
    return;
  }

  const bounds: RanchBounds = {
    x: ranchPrefs.position.x,
    y: ranchPrefs.position.y,
    width: ranchPrefs.size.width,
    height: ranchPrefs.size.height
  };
  ranchWindow.setBounds(bounds);
  applyRanchMode(ranchPrefs.mode);
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('桌面牧场');
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: '显示控制舱',
      click: () => showAndFocusCockpit()
    },
    {
      label: '召唤桌面牧场',
      click: () => {
        if (!ranchWindow) {
          createRanchWindow();
        } else {
          if (ranchPrefs.mode === 'desktop') {
            ranchWindow.showInactive();
          } else {
            ranchWindow.show();
            ranchWindow.focus();
          }
        }
      }
    },
    {
      label: '重置种子数据',
      click: () => publishSnapshot(createSeedSnapshot())
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]));
}

function resetRanchWindowState() {
  return commitRanchPrefs(createRanchSeedPrefs());
}

function buildRanchContextMenu() {
  const template: MenuItemConstructorOptions[] = [
    {
      label: '召唤控制舱',
      click: () => showAndFocusCockpit()
    },
    { type: 'separator' },
    {
      label: '性格档',
      submenu: [
        {
          label: 'chatty',
          type: 'radio',
          checked: ranchPrefs.personality === 'chatty',
          click: () => {
            updateRanchPrefs({ personality: 'chatty' });
          }
        },
        {
          label: 'quiet',
          type: 'radio',
          checked: ranchPrefs.personality === 'quiet',
          click: () => {
            updateRanchPrefs({ personality: 'quiet' });
          }
        },
        {
          label: 'silent',
          type: 'radio',
          checked: ranchPrefs.personality === 'silent',
          click: () => {
            updateRanchPrefs({ personality: 'silent' });
          }
        }
      ]
    },
    {
      label: '模式',
      submenu: [
        {
          label: 'desktop',
          type: 'radio',
          checked: ranchPrefs.mode === 'desktop',
          click: () => {
            updateRanchPrefs({ mode: 'desktop' });
          }
        },
        {
          label: 'floating',
          type: 'radio',
          checked: ranchPrefs.mode === 'floating',
          click: () => {
            updateRanchPrefs({ mode: 'floating' });
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: '重置牧场',
      click: () => {
        resetRanchWindowState();
      }
    },
    {
      label: '设置',
      click: () => showAndFocusCockpit()
    }
  ];

  return Menu.buildFromTemplate(template);
}

function showRanchContextMenu(input?: RanchContextMenuInput) {
  if (!ranchWindow) {
    return;
  }

  const candidate = asRecord(input);
  const x = typeof candidate?.x === 'number' && Number.isFinite(candidate.x)
    ? Math.round(candidate.x)
    : undefined;
  const y = typeof candidate?.y === 'number' && Number.isFinite(candidate.y)
    ? Math.round(candidate.y)
    : undefined;

  const menu = buildRanchContextMenu();
  menu.popup({
    window: ranchWindow,
    x,
    y
  });
}

function registerRanchIpc() {
  ipcMain.handle('ranch:get-prefs', () => ranchPrefs);

  ipcMain.handle('ranch:set-prefs', (_event, patch: RanchPrefsPatch) => {
    return updateRanchPrefs(patch);
  });

  ipcMain.handle('ranch:open-cockpit', () => {
    showAndFocusCockpit();
  });

  ipcMain.handle('ranch:show-context-menu', (_event, input?: RanchContextMenuInput) => {
    showRanchContextMenu(input);
  });

  ipcMain.handle('ranch:set-bounds', (_event, bounds: RanchBounds) => {
    const nextBounds = normalizeRanchBounds(bounds);
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
  });

  ipcMain.handle('ranch:reset-unread', () => {
    resetRanchUnreadCount();
  });

  ipcMain.handle('ranch:set-mouse-passthrough', (_event, passthrough: boolean) => {
    setRanchMousePassthrough(Boolean(passthrough));
  });

  ipcMain.handle('ranch:request-notify', (_event, payload: RanchNotifyPayload) => {
    const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
    const body = typeof payload?.body === 'string' ? payload.body.trim() : '';

    if (!ranchPrefs.notifyPrefs.system || !title || !body) {
      return false;
    }

    if (!Notification.isSupported()) {
      return false;
    }

    new Notification({
      title,
      body
    }).show();
    return true;
  });
}

function registerIpc() {
  ipcMain.handle('agents:get-snapshot', () => snapshot);

  ipcMain.handle('connectors:evaluate-gate', (_event, input: ConnectorGateRequest) => (
    evaluateConnectorGateFromPolicy(input)
  ));

  ipcMain.handle('agents:reset-seed', () => {
    const nextSnapshot = createSeedSnapshot();
    publishSnapshot(nextSnapshot);
    return nextSnapshot;
  });

  ipcMain.handle('agents:create-task', (_event, input: CreateTaskInput) => {
    const nextSnapshot = createTask(snapshot, input);
    publishSnapshot(nextSnapshot);
    const createdTask = snapshot.agents.find((agent) => agent.id === input.agentId)?.tasks[0];
    if (createdTask?.status === 'running' && createdTask.runner === 'local') {
      startLocalRunner(input.agentId, createdTask);
    }
    return snapshot;
  });

  ipcMain.handle('agents:stop-task', (_event, input: { agentId: string; taskId: string }) => {
    const task = findTask(input.agentId, input.taskId);
    if (task?.runner === 'local') {
      stopLocalRunner(input.taskId);
    }
    const nextSnapshot = stopTask(snapshot, input.agentId, input.taskId);
    publishSnapshot(nextSnapshot);
    return nextSnapshot;
  });

  ipcMain.handle('agents:clear-completed-tasks', (_event, input: { agentId: string }) => {
    const nextSnapshot = clearCompletedTasks(snapshot, input.agentId);
    publishSnapshot(nextSnapshot);
    return nextSnapshot;
  });

  ipcMain.handle('agents:apply-niuma-action', (_event, input: { agentId: string; action: NiuMaAction }) => {
    const nextSnapshot = applyNiuMaAction(snapshot, input.agentId, input.action);
    publishSnapshot(nextSnapshot);
    return nextSnapshot;
  });

  ipcMain.handle('agents:cycle-niuma-state', (_event, input: { agentId: string }) => {
    const nextSnapshot = cycleNiuMaState(snapshot, input.agentId);
    publishSnapshot(nextSnapshot);
    return nextSnapshot;
  });
}

app.whenReady().then(() => {
  snapshot = loadSnapshot();
  ranchPrefs = loadRanchPrefs();
  registerIpc();
  registerRanchIpc();
  createWindow();
  createRanchWindow();
  createTray();

  setInterval(() => {
    let nextSnapshot = progressRunningTasks(snapshot);
    if (nextSnapshot !== snapshot) {
      publishSnapshot(nextSnapshot);
      snapshot = nextSnapshot;
    }
    nextSnapshot = progressNiuMaTick(snapshot);
    if (nextSnapshot !== snapshot) {
      publishSnapshot(nextSnapshot);
      snapshot = nextSnapshot;
    }
  }, 2500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      createRanchWindow();
    } else {
      mainWindow?.show();
      if (!ranchWindow) {
        createRanchWindow();
      }
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  runningProcesses.forEach((child) => child.kill());
  runningProcesses.clear();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function formatLogTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}
