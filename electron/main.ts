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
  RanchInteractiveRegion,
  RanchNotifyPayload,
  RanchBounds,
  RanchMode,
  RanchPrefs,
  RanchPrefsPatch
} from '../src/types';
import { evaluateConnectorPolicyGate } from '../src/lib/connectorGate';
import {
  appendSystemMessage,
  applyNiuMaAction,
  clearCompletedTasks,
  createTask,
  createSeedSnapshot,
  cycleNiuMaState,
  normalizeSnapshot,
  progressNiuMaTick,
  progressRunningTasks,
  stopTask,
  syncAgentTaskRuntime
} from '../src/lib/agentCore';

let mainWindow: BrowserWindow | null = null;
let ranchWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let snapshot: AgentSnapshot;
let ranchPrefs: RanchPrefs;
let isQuitting = false;
let ranchUnreadCount = 0;
let ranchMousePassthrough = false;
let ranchHotzonePoll: NodeJS.Timeout | null = null;
let ranchInteractiveRegions: RanchInteractiveRegion[] = [];
const runningProcesses = new Map<string, ChildProcessWithoutNullStreams>();

const dataDir = path.join(app.getPath('userData'), 'agent-data');
const snapshotPath = path.join(dataDir, 'agents.json');
const ranchPrefsPath = path.join(app.getPath('userData'), 'ranch-prefs.json');
const connectorPolicyPath = resolveAppPath('docs/orchestration/connectors.json');
const ranchDefaultSize = { width: 640, height: 360 };
const legacyRanchDefaultSize = { width: 720, height: 320 };
const ranchEdgeOffset = 80;
const legacyRanchBottomOffset = 24;
const ranchHotzonePollMs = 80;
const ranchNotifyIconAliases: Record<string, string[]> = {
  openclaw: ['OpenClaw.jpeg'],
  openccode: ['OpenCode .jpeg']
};
const ranchSizeLimits = {
  minWidth: 320,
  minHeight: 200,
  maxWidth: 1200,
  maxHeight: 500
};
const mainWindowTitle = '桌面牧场 · 控制舱';
const runningProgressTimers = new Map<string, NodeJS.Timeout>();

function resolveAppPath(relativePath: string) {
  return path.join(app.isPackaged ? app.getAppPath() : process.cwd(), relativePath);
}

function resolveRanchNotifyIcon(agentId: string) {
  const normalized = agentId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!normalized) {
    return null;
  }

  const iconDir = resolveAppPath('icon');
  const candidates = [
    `${normalized}.png`,
    `${normalized}.jpg`,
    `${normalized}.jpeg`,
    ...(ranchNotifyIconAliases[normalized] ?? [])
  ];

  for (const fileName of candidates) {
    const iconPath = path.join(iconDir, fileName);
    if (!fs.existsSync(iconPath)) {
      continue;
    }

    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) {
      return icon;
    }
  }

  return null;
}

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

function normalizeRanchInteractiveRegions(regions: unknown): RanchInteractiveRegion[] {
  if (!Array.isArray(regions)) {
    return [];
  }

  return regions
    .slice(0, 32)
    .map((region) => {
      const candidate = asRecord(region);
      if (!candidate) {
        return null;
      }

      const x = numberOr(candidate.x, Number.NaN);
      const y = numberOr(candidate.y, Number.NaN);
      const width = numberOr(candidate.width, 0);
      const height = numberOr(candidate.height, 0);

      if (!Number.isFinite(x) || !Number.isFinite(y) || width <= 0 || height <= 0) {
        return null;
      }

      return {
        x,
        y,
        width: clampNumber(width, 1, ranchSizeLimits.maxWidth),
        height: clampNumber(height, 1, ranchSizeLimits.maxHeight)
      };
    })
    .filter((region): region is RanchInteractiveRegion => Boolean(region));
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

  return changed ? syncAgentTaskRuntime({ ...snapshot, agents, updatedAt: now }, agentId) : snapshot;
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

interface ResolvedLocalCommand {
  file: string;
  args: string[];
  display: string;
}

function splitCommandLine(commandLine: string) {
  const parts: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < commandLine.length; index += 1) {
    const char = commandLine[index];
    if ((char === '"' || char === "'") && (!quote || quote === char)) {
      quote = quote ? null : char;
      continue;
    }

    if (!quote && /\s/.test(char)) {
      if (current) {
        parts.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

function findCommandPath(command: string) {
  const locator = process.platform === 'win32' ? 'where.exe' : 'which';
  const result = spawnSync(locator, [command], {
    encoding: 'utf8',
    shell: false,
    windowsHide: true
  });

  if (result.status !== 0 || !result.stdout) {
    return null;
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) ?? null;
}

function findNodeExecutable() {
  const versions = process.versions as NodeJS.ProcessVersions & { electron?: string };
  if (!versions.electron) {
    return process.execPath;
  }

  return findCommandPath(process.platform === 'win32' ? 'node.exe' : 'node');
}

function findNodePackageCli(command: 'npm' | 'npx') {
  const cliFile = command === 'npm' ? 'npm-cli.js' : 'npx-cli.js';
  const candidates = new Set<string>();
  const locator = process.platform === 'win32' ? 'where.exe' : 'which';
  const result = spawnSync(locator, [command], {
    encoding: 'utf8',
    shell: false,
    windowsHide: true
  });

  if (result.status === 0 && result.stdout) {
    result.stdout.split(/\r?\n/).forEach((line) => {
      const shimPath = line.trim();
      if (!shimPath) {
        return;
      }
      const shimDir = path.dirname(shimPath);
      candidates.add(path.join(shimDir, 'node_modules', 'npm', 'bin', cliFile));
      candidates.add(path.join(path.dirname(shimDir), 'node_modules', 'npm', 'bin', cliFile));
    });
  }

  candidates.add(path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', cliFile));
  if (process.env.APPDATA) {
    candidates.add(path.join(process.env.APPDATA, 'npm', 'node_modules', 'npm', 'bin', cliFile));
  }

  return [...candidates].find((candidate) => fs.existsSync(candidate)) ?? null;
}

function resolveLocalCommand(commandLine: string): ResolvedLocalCommand | null {
  const parts = splitCommandLine(commandLine.trim());
  const command = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  if (!command) {
    return null;
  }

  if (command === 'echo') {
    const nodePath = findNodeExecutable();
    if (!nodePath) {
      return null;
    }
    return {
      file: nodePath,
      args: ['-e', `console.log(${JSON.stringify(args.join(' '))})`],
      display: commandLine
    };
  }

  if (command === 'exit' && args.length <= 1) {
    const nodePath = findNodeExecutable();
    if (!nodePath) {
      return null;
    }
    const code = Number.parseInt(args[0] ?? '0', 10);
    return {
      file: nodePath,
      args: ['-e', `process.exit(${Number.isFinite(code) ? code : 1})`],
      display: commandLine
    };
  }

  if (command === 'node' || command === 'node.exe') {
    const nodePath = findNodeExecutable();
    return nodePath ? { file: nodePath, args, display: commandLine } : null;
  }

  if (command === 'npm' || command === 'npm.cmd') {
    const nodePath = findNodeExecutable();
    const cliPath = findNodePackageCli('npm');
    return nodePath && cliPath ? { file: nodePath, args: [cliPath, ...args], display: commandLine } : null;
  }

  if (command === 'npx' || command === 'npx.cmd') {
    const nodePath = findNodeExecutable();
    const cliPath = findNodePackageCli('npx');
    return nodePath && cliPath ? { file: nodePath, args: [cliPath, ...args], display: commandLine } : null;
  }

  if (command === 'git' || command === 'git.exe') {
    const gitPath = findCommandPath('git');
    return gitPath ? { file: gitPath, args, display: commandLine } : null;
  }

  return null;
}

function completeLocalTask(agentId: string, taskId: string, exitCode: number | null) {
  runningProcesses.delete(taskId);
  const progressTimer = runningProgressTimers.get(taskId);
  if (progressTimer) {
    clearInterval(progressTimer);
    runningProgressTimers.delete(taskId);
  }
  const success = exitCode === 0;
  const currentAgent = snapshot.agents.find((agent) => agent.id === agentId);
  const currentTask = currentAgent?.tasks.find((task) => task.id === taskId);
  const shouldNotify = currentTask?.status === 'running';
  const nextSnapshot = patchTask(agentId, taskId, (task) => {
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
  });

  publishSnapshot(shouldNotify
    ? appendSystemMessage(
      nextSnapshot,
      success ? 'success' : 'error',
      success ? '任务已完成' : '任务失败',
      `${currentAgent?.name ?? agentId} 的本地任务「${currentTask?.name ?? taskId}」${success ? '已完成。' : `失败，exit code: ${exitCode ?? 'unknown'}。`}`,
      agentId
    )
    : nextSnapshot);
}

function startLocalRunner(agentId: string, task: AgentTask) {
  const resolved = resolveLocalCommand(task.command);
  if (!resolved) {
    appendTaskLog(agentId, task.id, `Blocked local command: ${task.command || '(empty)'}`);
    completeLocalTask(agentId, task.id, 1);
    return;
  }

  let child: ChildProcessWithoutNullStreams;
  try {
    child = spawn(resolved.file, resolved.args, {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
      windowsHide: true
    });
  } catch (error) {
    appendTaskLog(agentId, task.id, `Failed to start local command: ${error instanceof Error ? error.message : String(error)}`);
    completeLocalTask(agentId, task.id, 1);
    return;
  }

  let settled = false;
  runningProcesses.set(task.id, child);
  const progressTimer = setInterval(() => {
    publishSnapshot(patchTask(agentId, task.id, (currentTask) => {
      if (currentTask.status !== 'running') {
        return currentTask;
      }
      const nextProgress = Math.min(90, Math.max(currentTask.progress + 6, 12));
      if (nextProgress === currentTask.progress) {
        return currentTask;
      }
      return {
        ...currentTask,
        progress: nextProgress
      };
    }));
  }, 1000);
  runningProgressTimers.set(task.id, progressTimer);
  publishSnapshot(patchTask(agentId, task.id, (currentTask) => ({
    ...currentTask,
    pid: child.pid,
    progress: Math.max(currentTask.progress, 5),
    logs: [
      ...currentTask.logs,
      `[${formatLogTime()}] Started local process PID ${child.pid ?? 'unknown'}.`,
      `[${formatLogTime()}] Command: ${resolved.display}`,
      `[${formatLogTime()}] Workspace: ${process.cwd()}`
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
    if (settled) {
      return;
    }
    settled = true;
    appendTaskLog(agentId, task.id, `Local command error: ${error.message}`);
    appendTaskLog(agentId, task.id, `启动失败：${error.message}`);
    completeLocalTask(agentId, task.id, 1);
  });

  child.on('close', (code) => {
    if (settled) {
      return;
    }
    settled = true;
    completeLocalTask(agentId, task.id, code);
  });
}

function stopLocalRunner(taskId: string) {
  const child = runningProcesses.get(taskId);
  if (!child) {
    return false;
  }

  runningProcesses.delete(taskId);
  const progressTimer = runningProgressTimers.get(taskId);
  if (progressTimer) {
    clearInterval(progressTimer);
    runningProgressTimers.delete(taskId);
  }
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
    stopRanchHotzonePolling();
    ranchMousePassthrough = false;
    ranchWindow = null;
  });

  loadEntry(ranchWindow, 'ranch');
}

function setRanchMousePassthrough(passthrough: boolean) {
  if (!ranchWindow) {
    return;
  }

  const nextPassthrough = ranchPrefs.mode === 'desktop' && passthrough;
  if (ranchMousePassthrough === nextPassthrough) {
    return;
  }

  ranchMousePassthrough = nextPassthrough;
  ranchWindow.setFocusable(!nextPassthrough);
  if (nextPassthrough) {
    ranchWindow.setIgnoreMouseEvents(true, { forward: true });
    return;
  }

  ranchWindow.setIgnoreMouseEvents(false);
}

function isPointInsideRanchRegion(point: { x: number; y: number }, region: RanchInteractiveRegion) {
  return point.x >= region.x &&
    point.x <= region.x + region.width &&
    point.y >= region.y &&
    point.y <= region.y + region.height;
}

function updateRanchPassthroughFromCursor() {
  if (!ranchWindow || ranchPrefs.mode !== 'desktop') {
    return;
  }

  const cursor = screen.getCursorScreenPoint();
  const overInteractiveRegion = ranchInteractiveRegions.some((region) => (
    isPointInsideRanchRegion(cursor, region)
  ));
  setRanchMousePassthrough(!overInteractiveRegion);
}

function startRanchHotzonePolling() {
  if (ranchHotzonePoll) {
    updateRanchPassthroughFromCursor();
    return;
  }

  ranchHotzonePoll = setInterval(updateRanchPassthroughFromCursor, ranchHotzonePollMs);
  updateRanchPassthroughFromCursor();
}

function stopRanchHotzonePolling() {
  if (ranchHotzonePoll) {
    clearInterval(ranchHotzonePoll);
    ranchHotzonePoll = null;
  }

  ranchInteractiveRegions = [];
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

  if (isFloating) {
    stopRanchHotzonePolling();
    setRanchMousePassthrough(false);
    return;
  }

  startRanchHotzonePolling();
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

  ipcMain.handle('ranch:set-interactive-regions', (_event, regions: RanchInteractiveRegion[]) => {
    const windowBounds = ranchWindow?.getBounds();
    const nextRegions = normalizeRanchInteractiveRegions(regions);
    ranchInteractiveRegions = windowBounds
      ? nextRegions.map((region) => ({
          ...region,
          x: windowBounds.x + region.x,
          y: windowBounds.y + region.y
        }))
      : [];
    updateRanchPassthroughFromCursor();
  });

  ipcMain.handle('ranch:request-notify', (_event, payload: RanchNotifyPayload) => {
    const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
    const body = typeof payload?.body === 'string' ? payload.body.trim() : '';
    const agentId = typeof payload?.agentId === 'string' ? payload.agentId.trim() : '';

    if (!ranchPrefs.notifyPrefs.system || !title || !body) {
      return false;
    }

    if (!Notification.isSupported()) {
      return false;
    }

    const icon = agentId ? resolveRanchNotifyIcon(agentId) : null;
    const notification = new Notification(icon
      ? { title, body, icon }
      : { title, body });
    notification.show();
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
  runningProgressTimers.forEach((timer) => clearInterval(timer));
  runningProgressTimers.clear();
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
