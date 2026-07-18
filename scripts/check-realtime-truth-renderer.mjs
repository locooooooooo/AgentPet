import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'niuma-renderer-truth-'));
const outputFile = path.join(temporaryDirectory, 'renderer-truth-fixture.cjs');

const fixtureSource = String.raw`
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import NiuMaWorkspace from './src/components/NiuMaWorkspace';
import { createSeedSnapshot } from './src/lib/agentCore';
import { projectAgentInstances, selectAgentTruthByIdentity } from './src/lib/agentInstanceProjection';
import { useHomePageData } from './src/homepage/hooks/useHomePageData';

globalThis.window = {
  addEventListener() {},
  removeEventListener() {},
  requestAnimationFrame() { return 0; },
  cancelAnimationFrame() {},
  getComputedStyle() { return {}; }
};

const now = new Date('2026-07-13T08:00:00.000Z');
const nowIso = now.toISOString();
const snapshot = createSeedSnapshot();
snapshot.updatedAt = nowIso;
const configuredAgents = snapshot.agents.map((agent) => ({ id: agent.id, connectorId: agent.id }));
const api = {};

function codexHostSnapshot({
  availability = 'unavailable',
  source = 'browser-fallback',
  clientRunning = false,
  activeSessionCount = 0
} = {}) {
  return {
    version: 1,
    availability,
    source,
    observedAt: nowIso,
    clientRunning,
    activeSessionCount,
    sessions: Array.from({ length: activeSessionCount }, (_, index) => ({
      sessionId: 'desktop-session-' + (index + 1),
      workspace: 'workspace-' + (index + 1),
      state: 'running',
      activeTurnCount: 1,
      lastEventAt: nowIso,
      activeStartedAt: nowIso
    })),
    detail: 'Lifecycle-only fixture.'
  };
}

const browserCodexHost = codexHostSnapshot();

function outputStats() {
  return {
    receivedBytes: 0,
    archivedBytes: 0,
    droppedBytes: 0,
    outputEvents: 0,
    truncatedLines: 0,
    backpressureEvents: 0
  };
}

function session(state, lastSeen, capabilities = ['structured-events']) {
  return {
    taskId: 'task-codex-1',
    sessionId: 'session-codex-1',
    connectorId: 'codex',
    agentId: 'codex',
    taskName: 'fixture task',
    requestedBy: 'test-fixture',
    source: 'runtime-spawn',
    capabilities,
    capabilitySource: capabilities === null ? 'unknown' : 'adapter-declaration',
    state,
    startedAt: '2026-07-13T07:59:00.000Z',
    ...(state === 'session-lost' ? { endedAt: nowIso } : {}),
    attempt: 1,
    maxAttempts: 1,
    retryPolicy: { maxRetries: 0, backoffMs: 250, budgetMs: 0 },
    output: outputStats(),
    liveness: {
      status: lastSeen ? 'fresh' : 'unknown',
      source: lastSeen ? 'process-event' : 'none',
      ...(lastSeen ? { lastSeen } : {}),
      staleAfterMs: 15_000
    },
    events: []
  };
}

function instance(state, lastSeen, capabilities = ['structured-events']) {
  return {
    instanceId: 'codex:codex',
    agentId: 'codex',
    connectorId: 'codex',
    status: state === 'session-lost' ? 'offline' : 'busy',
    source: state === 'session-lost' ? 'session-lost' : 'connector-runtime',
    ...(lastSeen ? { lastSeen } : {}),
    capabilities,
    capabilitySource: capabilities === null ? 'unknown' : 'adapter-declaration',
    sessionId: 'session-codex-1',
    liveness: {
      status: lastSeen ? 'fresh' : 'unknown',
      source: lastSeen ? 'process-event' : 'none',
      ...(lastSeen ? { lastSeen } : {}),
      staleAfterMs: 15_000
    }
  };
}

function runtimeSnapshot({
  availability = 'available',
  mode = 'real',
  source = 'electron-main',
  reason,
  state,
  lastSeen,
  capabilities = ['structured-events'],
  hostFacts = [],
  hostLifecycle = []
}) {
  const hasSession = Boolean(state);
  const hostInstances = hostFacts.map((fact) => ({
    instanceId: 'host-process:' + fact.agentId,
    agentId: fact.agentId,
    connectorId: fact.connectorId,
    status: 'configured',
    source: 'host-process',
    lastSeen: fact.observedAt,
    capabilities: ['host-process-presence'],
    capabilitySource: 'runtime-observed',
    liveness: {
      status: 'fresh',
      source: 'host-process-probe',
      lastSeen: fact.observedAt,
      staleAfterMs: 15_000
    }
  }));
  return {
    version: 1,
    updatedAt: nowIso,
    runtime: {
      availability,
      mode,
      source,
      observedAt: nowIso,
      ...(reason ? { reason } : {})
    },
    tasks: hasSession ? [session(state, lastSeen, capabilities)] : [],
    instances: [
      ...(hasSession ? [instance(state, lastSeen, capabilities)] : []),
      ...hostInstances
    ],
    hostDiscovery: {
      version: 1,
      availability: 'available',
      source: 'windows-process-list',
      observedAt: nowIso,
      facts: hostFacts,
      lifecycle: hostLifecycle,
      detail: 'Presence-only renderer fixture.'
    }
  };
}

function project(runtime) {
  return projectAgentInstances({ configuredAgents, runtimeSnapshot: runtime, now });
}

function plain(markup) {
  return markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderCockpit(agentTruth, codexHost = browserCodexHost) {
  return plain(renderToStaticMarkup(
    <NiuMaWorkspace
      api={api}
      snapshot={snapshot}
      agentTruth={agentTruth}
      codexHost={codexHost}
      onSnapshot={() => {}}
    />
  ));
}

function HomeTruthProbe({ agentTruth, codexHost }) {
  const data = useHomePageData(snapshot, agentTruth, codexHost);
  return (
    <div>
      {data.metrics.map((metric) => (
        <span key={metric.id}>{metric.label}:{metric.value}:{metric.detail}</span>
      ))}
    </div>
  );
}

function renderHomeTruth(agentTruth, codexHost = browserCodexHost) {
  return plain(renderToStaticMarkup(<HomeTruthProbe agentTruth={agentTruth} codexHost={codexHost} />));
}

function truthFor(projection) {
  const truth = selectAgentTruthByIdentity(projection, 'codex', 'codex');
  assert.ok(truth, 'Codex truth must exist');
  return truth;
}

const browserProjection = project(runtimeSnapshot({
  availability: 'unavailable',
  mode: 'simulated',
  source: 'browser-fallback',
  reason: 'Electron Connector runtime is unavailable in browser fallback mode.'
}));
assert.equal(browserProjection.summary.configuredCount, 8);
assert.equal(browserProjection.summary.onlineSessionCount, 0);
const browserCockpit = renderCockpit(browserProjection);
const browserHome = renderHomeTruth(browserProjection);
assert.match(browserCockpit, /在线 Session 0/);
assert.match(browserCockpit, /Agent runtime · simulated/);
assert.match(browserCockpit, /unavailable · browser-fallback/);
assert.match(browserCockpit, /本地牧场表现/);
assert.match(browserCockpit, /应用快照交互/);
assert.match(browserCockpit, /Sessions 下发任务 任务队列 流式日志/);
assert.match(browserCockpit, /未观察到 Session/);
assert.match(browserHome, /已配置工位:8/);
assert.match(browserHome, /真实在线 Session:0:unavailable · simulated · browser-fallback/);

const desktopCodexHost = codexHostSnapshot({
  availability: 'available',
  source: 'codex-desktop-session-log',
  clientRunning: true,
  activeSessionCount: 2
});
const desktopHostCockpit = renderCockpit(browserProjection, desktopCodexHost);
const desktopHostHome = renderHomeTruth(browserProjection, desktopCodexHost);
assert.match(desktopHostCockpit, /在线 Session 2/);
assert.match(desktopHostCockpit, /Connector 0 · Codex Desktop 2/);
assert.match(desktopHostCockpit, /Codex Desktop 同步中 2 活动对话/);
assert.match(desktopHostCockpit, /Codex Sessions 2 个真实观测项/);
assert.match(desktopHostCockpit, /Codex · workspace-1 Codex Desktop/);
assert.match(desktopHostCockpit, /Session ID desktop-session-1 来源 Codex Desktop 状态 working/);
assert.match(desktopHostHome, /真实在线 Session:2:Codex Desktop 已开启 · 2 个活动对话/);

const hostPresenceProjection = project(runtimeSnapshot({
  hostFacts: [
    {
      agentId: 'workbuddy',
      connectorId: 'workbuddy',
      displayName: 'WorkBuddy',
      running: true,
      processCount: 1,
      observedAt: nowIso
    },
    {
      agentId: 'kimi',
      connectorId: 'kimi',
      displayName: 'Kimi',
      running: true,
      processCount: 6,
      observedAt: nowIso
    },
    {
      agentId: 'minimax',
      connectorId: 'minimax',
      displayName: 'MiniMax Code',
      running: true,
      processCount: 1,
      observedAt: nowIso
    }
  ]
}));
const hostPresenceCockpit = renderCockpit(hostPresenceProjection);
assert.equal(hostPresenceProjection.summary.onlineSessionCount, 0);
assert.equal(hostPresenceProjection.summary.busySessionCount, 0);
assert.match(hostPresenceCockpit, /未绑定发现项 Kimi（6 进程）/);
assert.equal(
  (hostPresenceCockpit.match(/未绑定发现项 Kimi/g) ?? []).length,
  1,
  'Six Kimi processes must render as one unbound application fact'
);
assert.equal(
  (hostPresenceCockpit.match(/本机应用已运行/g) ?? []).length,
  2,
  'Bound WorkBuddy and MiniMax cards must each show one host-presence badge'
);
assert.equal(
  (hostPresenceCockpit.match(/未观察到活动 Session/g) ?? []).length,
  2,
  'Host-presence badges must not fabricate a Session'
);
assert.match(hostPresenceCockpit, /在线 Session 0/);
assert.match(hostPresenceCockpit, /0 个应用任务运行中/);

const hostLifecycleProjection = project(runtimeSnapshot({
  hostFacts: [
    {
      agentId: 'workbuddy',
      connectorId: 'workbuddy',
      displayName: 'WorkBuddy',
      running: true,
      processCount: 3,
      observedAt: nowIso
    },
    {
      agentId: 'minimax',
      connectorId: 'minimax',
      displayName: 'MiniMax Code',
      running: true,
      processCount: 4,
      observedAt: nowIso
    }
  ],
  hostLifecycle: [
    {
      agentId: 'trae',
      connectorId: 'trae',
      displayName: 'Trae',
      installed: true,
      running: false,
      processCount: 0,
      state: 'stopped',
      primaryAction: 'launch',
      observedAt: nowIso,
      detail: 'Application is installed but not running.'
    },
    {
      agentId: 'workbuddy',
      connectorId: 'workbuddy',
      displayName: 'WorkBuddy',
      installed: true,
      running: true,
      processCount: 3,
      state: 'idle',
      primaryAction: 'focus',
      observedAt: nowIso,
      detail: 'Application is running with no observed Hub task.'
    },
    {
      agentId: 'qoder',
      connectorId: 'qoder',
      displayName: 'Qoder',
      installed: true,
      running: false,
      processCount: 0,
      state: 'stopped',
      primaryAction: 'launch',
      observedAt: nowIso,
      detail: 'Application is installed but not running.'
    },
    {
      agentId: 'minimax',
      connectorId: 'minimax',
      displayName: 'MiniMax Code',
      installed: true,
      running: true,
      processCount: 4,
      state: 'idle',
      primaryAction: 'focus',
      observedAt: nowIso,
      detail: 'Application is running with no observed Hub task.'
    },
    {
      agentId: 'openclaw',
      connectorId: 'openclaw',
      displayName: 'OpenClaw Gateway',
      installed: true,
      serviceInstalled: false,
      running: false,
      processCount: 0,
      state: 'stopped',
      primaryAction: 'install',
      observedAt: nowIso,
      detail: 'OpenClaw CLI is installed; Gateway service setup is required.'
    }
  ]
}));
const hostLifecycleCockpit = renderCockpit(hostLifecycleProjection);
assert.match(hostLifecycleCockpit, /本机应用已安装 当前未启动/);
assert.match(hostLifecycleCockpit, /打开 Trae/);
assert.match(hostLifecycleCockpit, /聚焦 WorkBuddy/);
assert.match(hostLifecycleCockpit, /打开 Qoder/);
assert.match(hostLifecycleCockpit, /本机应用已打开 idle · 暂无任务/);
assert.match(hostLifecycleCockpit, /聚焦 MiniMax Code/);
assert.match(hostLifecycleCockpit, /OpenClaw CLI 已安装 Gateway 服务未配置/);
assert.match(hostLifecycleCockpit, /安装服务/);
assert.match(hostLifecycleCockpit, /\[4号位\] MiniMax 废话周会 🐎 UI 熟睡躺平/);
assert.match(hostLifecycleCockpit, /\[5号位\] WorkBuddy 打水摸鱼 🐂 OPS 熟睡躺平/);

const freshLastSeen = new Date(now.getTime() - 1_000).toISOString();
const freshProjection = project(runtimeSnapshot({ state: 'running', lastSeen: freshLastSeen }));
const freshTruth = truthFor(freshProjection);
assert.equal(freshProjection.summary.onlineSessionCount, 1);
assert.equal(freshTruth.presence, 'busy');
assert.equal(freshTruth.activity, 'busy');
const freshCockpit = renderCockpit(freshProjection);
assert.match(freshCockpit, /在线 Session 1/);
assert.match(freshCockpit, /busy \/ busy/);
assert.match(freshCockpit, /connector-runtime/);
assert.match(freshCockpit, /session-codex-1/);
assert.match(freshCockpit, /structured-events · adapter-declaration/);
assert.match(freshCockpit, /真实 Session 新鲜，且关联任务正在运行/);
assert.match(renderHomeTruth(freshProjection), /真实在线 Session:1:available · real · electron-main/);

const lateLastSeen = new Date(now.getTime() - 5_001).toISOString();
const lateProjection = project(runtimeSnapshot({ state: 'running', lastSeen: lateLastSeen }));
assert.equal(lateProjection.summary.onlineSessionCount, 0);
assert.equal(truthFor(lateProjection).presence, 'degraded');
assert.match(renderCockpit(lateProjection), /心跳超过 5 秒，Session 已降级/);

const staleLastSeen = new Date(now.getTime() - 15_000).toISOString();
const staleProjection = project(runtimeSnapshot({ state: 'running', lastSeen: staleLastSeen }));
assert.equal(staleProjection.summary.onlineSessionCount, 0);
assert.equal(truthFor(staleProjection).presence, 'offline');
assert.match(renderCockpit(staleProjection), /心跳达到 15 秒，Session 已离线/);

const lostProjection = project(runtimeSnapshot({
  state: 'session-lost',
  lastSeen: freshLastSeen
}));
const lostTruth = truthFor(lostProjection);
assert.equal(lostProjection.summary.onlineSessionCount, 0);
assert.equal(lostTruth.presence, 'offline');
assert.equal(lostTruth.activity, 'terminal');
const lostCockpit = renderCockpit(lostProjection);
assert.match(lostCockpit, /offline \/ terminal/);
assert.match(lostCockpit, /Session 已丢失，关联任务不再视为运行中/);

const unknownCapabilitiesProjection = project(runtimeSnapshot({
  state: 'running',
  lastSeen: freshLastSeen,
  capabilities: null
}));
assert.match(renderCockpit(unknownCapabilitiesProjection), /Capabilities: 未知 \(unknown\)/);

console.log('realtime truth renderer check passed.');
console.log('browser fallback DOM: configured=8, online=0, simulated/unavailable/source labels verified');
console.log('Codex Desktop lifecycle DOM: host sessions contribute without changing Connector runtime truth');
console.log('WorkBuddy/MiniMax host badges and one unbound Kimi fact render with online/busy=0: verified');
console.log('Trae/WorkBuddy/Qoder launch-focus, MiniMax idle animation and OpenClaw service install controls: verified');
console.log('selected Agent Sessions tab renders Codex sources and truthful empty state: verified');
console.log('fresh/late/stale/session-lost DOM: KPI, presence/activity, provenance and reason labels verified');
console.log('capabilities null and local ranch/application snapshot separation: verified');
`;

try {
  await build({
    stdin: {
      contents: fixtureSource,
      loader: 'tsx',
      resolveDir: process.cwd(),
      sourcefile: 'renderer-truth-fixture.tsx'
    },
    outfile: outputFile,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    logLevel: 'silent'
  });

  await import(`${pathToFileURL(outputFile).href}?t=${Date.now()}`);
} catch (error) {
  assert.fail(error instanceof Error ? error.stack ?? error.message : String(error));
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
