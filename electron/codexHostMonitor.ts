import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { CodexHostSessionSummary, CodexHostSnapshot } from '../src/types';

const DISCOVERY_INTERVAL_MS = 10_000;
const CLIENT_PROBE_INTERVAL_MS = 5_000;
const ACTIVE_SESSION_STALE_MS = 5 * 60_000;
const RECENT_SESSION_MS = 24 * 60 * 60_000;
const INITIAL_TAIL_BYTES = 16 * 1024 * 1024;
const MAX_DISCOVERED_FILES = 64;
const MAX_VISIBLE_SESSIONS = 8;

interface TrackedCodexSession {
  filePath: string;
  sessionId: string;
  workspace: string;
  offset: number;
  carry: string;
  modifiedAtMs: number;
  activeTurns: Map<string, string>;
  lastEventAt?: string;
  lastCompletedAt?: string;
  lastCompletionKey?: string;
}

export interface CodexHostMonitorOptions {
  codexHome?: string;
  now?: () => Date;
  probeClientRunning?: () => boolean;
}

export class CodexHostMonitor {
  private readonly sessionsRoot: string;
  private readonly now: () => Date;
  private readonly probeClientRunning: () => boolean;
  private readonly sessions = new Map<string, TrackedCodexSession>();
  private lastDiscoveryAt = 0;
  private lastClientProbeAt = 0;
  private clientRunning = false;

  constructor(options: CodexHostMonitorOptions = {}) {
    const codexHome = options.codexHome
      ?? process.env.CODEX_HOME
      ?? path.join(os.homedir(), '.codex');
    this.sessionsRoot = path.join(codexHome, 'sessions');
    this.now = options.now ?? (() => new Date());
    this.probeClientRunning = options.probeClientRunning ?? probeCodexDesktopProcess;
  }

  getSnapshot(): CodexHostSnapshot {
    const now = this.now();
    const nowMs = now.getTime();
    const sessionsAvailable = fs.existsSync(this.sessionsRoot);

    if (sessionsAvailable && nowMs - this.lastDiscoveryAt >= DISCOVERY_INTERVAL_MS) {
      this.discoverSessions(now);
      this.lastDiscoveryAt = nowMs;
    }

    this.sessions.forEach((session) => this.refreshSession(session));

    if (nowMs - this.lastClientProbeAt >= CLIENT_PROBE_INTERVAL_MS) {
      this.clientRunning = this.probeClientRunning();
      this.lastClientProbeAt = nowMs;
    }

    const recentSessions = [...this.sessions.values()]
      .filter((session) => nowMs - session.modifiedAtMs <= RECENT_SESSION_MS)
      .sort((left, right) => right.modifiedAtMs - left.modifiedAtMs);
    const allSessionSummaries = recentSessions
      .map((session) => summarizeSession(session, this.clientRunning, nowMs));
    const sessionSummaries = allSessionSummaries.slice(0, MAX_VISIBLE_SESSIONS);
    const latestCompletion = recentSessions
      .filter((session) => session.lastCompletedAt && session.lastCompletionKey)
      .sort((left, right) => Date.parse(right.lastCompletedAt!) - Date.parse(left.lastCompletedAt!))[0];

    return {
      version: 1,
      availability: sessionsAvailable ? 'available' : 'unavailable',
      source: sessionsAvailable ? 'codex-desktop-session-log' : 'unavailable',
      observedAt: now.toISOString(),
      clientRunning: this.clientRunning,
      activeSessionCount: allSessionSummaries.filter((session) => session.state === 'running').length,
      sessions: sessionSummaries,
      ...(latestCompletion?.lastCompletedAt
        ? { lastCompletedAt: latestCompletion.lastCompletedAt }
        : {}),
      ...(latestCompletion?.lastCompletionKey
        ? { lastCompletionKey: latestCompletion.lastCompletionKey }
        : {}),
      detail: sessionsAvailable
        ? 'Lifecycle-only observation: session metadata and turn start/complete/abort events; conversation content is not read.'
        : 'Codex session directory is unavailable.'
    };
  }

  private discoverSessions(now: Date) {
    const candidates = collectRecentSessionFiles(this.sessionsRoot, now)
      .slice(0, MAX_DISCOVERED_FILES);

    candidates.forEach((filePath) => {
      if (this.sessions.has(filePath)) {
        return;
      }
      const metadata = readUserSessionMetadata(filePath);
      if (!metadata) {
        return;
      }
      const stat = safeStat(filePath);
      if (!stat) {
        return;
      }
      const session: TrackedCodexSession = {
        filePath,
        sessionId: metadata.sessionId,
        workspace: metadata.workspace,
        offset: Math.max(0, stat.size - INITIAL_TAIL_BYTES),
        carry: '',
        modifiedAtMs: stat.mtimeMs,
        activeTurns: new Map()
      };
      this.sessions.set(filePath, session);
      this.refreshSession(session, true);
    });
  }

  private refreshSession(session: TrackedCodexSession, initial = false) {
    const stat = safeStat(session.filePath);
    if (!stat) {
      this.sessions.delete(session.filePath);
      return;
    }

    if (!initial && stat.size === session.offset) {
      session.modifiedAtMs = stat.mtimeMs;
      return;
    }

    if (stat.size < session.offset) {
      session.offset = Math.max(0, stat.size - INITIAL_TAIL_BYTES);
      session.carry = '';
      session.activeTurns.clear();
      session.lastEventAt = undefined;
      session.lastCompletedAt = undefined;
      session.lastCompletionKey = undefined;
      initial = true;
    }

    const start = session.offset;
    const content = readFileRange(session.filePath, start, stat.size - start);
    session.offset = stat.size;
    session.modifiedAtMs = stat.mtimeMs;
    if (!content) {
      return;
    }

    const normalized = initial && start > 0
      ? content.slice(Math.max(0, content.indexOf('\n') + 1))
      : session.carry + content;
    const lines = normalized.split(/\r?\n/);
    session.carry = lines.pop() ?? '';
    lines.forEach((line) => consumeLifecycleLine(session, line));
  }
}

export function createBrowserCodexHostSnapshot(now = new Date()): CodexHostSnapshot {
  return {
    version: 1,
    availability: 'unavailable',
    source: 'browser-fallback',
    observedAt: now.toISOString(),
    clientRunning: false,
    activeSessionCount: 0,
    sessions: [],
    detail: 'The static browser fallback cannot inspect local Codex Desktop lifecycle state.'
  };
}

function summarizeSession(
  session: TrackedCodexSession,
  clientRunning: boolean,
  nowMs: number
): CodexHostSessionSummary {
  const fresh = nowMs - session.modifiedAtMs <= ACTIVE_SESSION_STALE_MS;
  const running = clientRunning && fresh && session.activeTurns.size > 0;
  const activeStartedAt = [...session.activeTurns.values()]
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0];
  return {
    sessionId: session.sessionId,
    workspace: session.workspace,
    state: running ? 'running' : 'idle',
    activeTurnCount: running ? session.activeTurns.size : 0,
    lastEventAt: session.lastEventAt ?? new Date(session.modifiedAtMs).toISOString(),
    ...(activeStartedAt ? { activeStartedAt } : {}),
    ...(session.lastCompletedAt ? { lastCompletedAt: session.lastCompletedAt } : {})
  };
}

function consumeLifecycleLine(session: TrackedCodexSession, line: string) {
  if (!line.trim()) {
    return;
  }
  let row: unknown;
  try {
    row = JSON.parse(line);
  } catch {
    return;
  }
  if (!isRecord(row) || row.type !== 'event_msg' || !isRecord(row.payload)) {
    return;
  }
  const payload = row.payload;
  const type = typeof payload.type === 'string' ? payload.type : '';
  const turnId = typeof payload.turn_id === 'string' ? payload.turn_id : '';
  const eventAt = readEventTimestamp(payload, row);

  if (type === 'task_started' && turnId) {
    session.activeTurns.set(turnId, eventAt);
    session.lastEventAt = eventAt;
    return;
  }
  if ((type === 'task_complete' || type === 'turn_aborted') && turnId) {
    session.activeTurns.delete(turnId);
    session.lastEventAt = eventAt;
    if (type === 'task_complete') {
      session.lastCompletedAt = eventAt;
      session.lastCompletionKey = `${session.sessionId}:${turnId}:${eventAt}`;
    }
  }
}

function readEventTimestamp(payload: Record<string, unknown>, row: Record<string, unknown>) {
  const candidate = payload.completed_at ?? payload.started_at ?? row.timestamp;
  return typeof candidate === 'string' && Number.isFinite(Date.parse(candidate))
    ? candidate
    : new Date().toISOString();
}

function collectRecentSessionFiles(root: string, now: Date) {
  const dates = [now, new Date(now.getTime() - 24 * 60 * 60_000)];
  const files: Array<{ path: string; modifiedAtMs: number }> = [];
  dates.forEach((date) => {
    const directory = path.join(
      root,
      String(date.getFullYear()),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    );
    if (!fs.existsSync(directory)) {
      return;
    }
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      if (!entry.isFile() || !entry.name.endsWith('.jsonl')) {
        return;
      }
      const filePath = path.join(directory, entry.name);
      const stat = safeStat(filePath);
      if (stat) {
        files.push({ path: filePath, modifiedAtMs: stat.mtimeMs });
      }
    });
  });
  return files
    .sort((left, right) => right.modifiedAtMs - left.modifiedAtMs)
    .map((entry) => entry.path);
}

function readUserSessionMetadata(filePath: string) {
  const firstLine = readFirstLine(filePath);
  if (!firstLine) {
    return null;
  }
  let row: unknown;
  try {
    row = JSON.parse(firstLine);
  } catch {
    return null;
  }
  if (!isRecord(row) || row.type !== 'session_meta' || !isRecord(row.payload)) {
    return null;
  }
  const payload = row.payload;
  if (payload.originator !== 'Codex Desktop' || payload.thread_source !== 'user') {
    return null;
  }
  const sessionId = typeof payload.id === 'string'
    ? payload.id
    : (typeof payload.session_id === 'string' ? payload.session_id : path.basename(filePath, '.jsonl'));
  const cwd = typeof payload.cwd === 'string' ? payload.cwd : '';
  return {
    sessionId,
    workspace: cwd ? path.basename(cwd) : 'unknown workspace'
  };
}

function readFirstLine(filePath: string) {
  const stat = safeStat(filePath);
  if (!stat) {
    return '';
  }
  const content = readFileRange(filePath, 0, Math.min(stat.size, 128 * 1024));
  const newline = content.indexOf('\n');
  return newline >= 0 ? content.slice(0, newline) : content;
}

function readFileRange(filePath: string, start: number, length: number) {
  if (length <= 0) {
    return '';
  }
  const descriptor = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const bytesRead = fs.readSync(descriptor, buffer, 0, length, start);
    return buffer.subarray(0, bytesRead).toString('utf8');
  } finally {
    fs.closeSync(descriptor);
  }
}

function safeStat(filePath: string) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

function probeCodexDesktopProcess() {
  if (process.platform !== 'win32') {
    return false;
  }
  try {
    const result = spawnSync('tasklist.exe', [
      '/FI',
      'IMAGENAME eq codex-code-mode-host.exe',
      '/FO',
      'CSV',
      '/NH'
    ], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 2_000
    });
    return result.status === 0
      && result.stdout.toLowerCase().includes('codex-code-mode-host.exe');
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
