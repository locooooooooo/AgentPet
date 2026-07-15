import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const p95BudgetMs = 500;
const overlapSampleCount = 6;
const processTimeoutMs = 90_000;
const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'niuma-b2-production-path-'));
const userDataDirectory = path.join(temporaryDirectory, 'user-data');
const fixturePolicyPath = path.join(temporaryDirectory, 'docs', 'orchestration', 'connectors.json');
const controlledScriptPath = path.join(temporaryDirectory, 'exec');
const phaseOnePath = path.join(temporaryDirectory, 'phase-one.cjs');
const phaseTwoPath = path.join(temporaryDirectory, 'phase-two.cjs');
const repositoryPolicyPath = path.join(root, 'docs', 'orchestration', 'connectors.json');
const repositoryStatusPath = path.join(root, 'docs', 'orchestration', 'status.json');
const mainModulePath = path.join(root, 'dist-electron', 'main.cjs');
const preloadModulePath = path.join(root, 'dist-electron', 'preload.cjs');
const rendererPath = path.join(root, 'dist', 'index.html');
const electronExecutable = path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe');

const [policyBefore, statusBefore, mainSource, preloadSource, appSource] = await Promise.all([
  readFile(repositoryPolicyPath, 'utf8'),
  readFile(repositoryStatusPath, 'utf8'),
  readFile(path.join(root, 'electron', 'main.ts'), 'utf8'),
  readFile(path.join(root, 'electron', 'preload.ts'), 'utf8'),
  readFile(path.join(root, 'src', 'App.tsx'), 'utf8')
]);
const statusConnectorsBefore = JSON.stringify(JSON.parse(statusBefore).connectors ?? null);

assert.match(mainSource, /createConnectorRuntime\(\)/, 'B2 requires the production Electron main runtime factory.');
assert.match(mainSource, /window\.webContents\.send\('connectors:runtime-snapshot-changed'/);
assert.match(mainSource, /requestConnectorAuthorization\(event, input\)/);
assert.match(preloadSource, /contextBridge\.exposeInMainWorld\('niumaDesk', api\)/);
assert.match(preloadSource, /onConnectorRuntimeSnapshotChanged/);
assert.match(appSource, /projectAgentInstances\(/);
assert.match(appSource, /setConnectorRuntimeSnapshot\(nextSnapshot\)/);
assert.match(appSource, /mode: isDesktopRuntime \? 'real' : 'simulated'/);
assert.match(appSource, /source: isDesktopRuntime \? 'unknown' : 'browser-fallback'/);

const fixturePolicy = {
  version: 1,
  defaults: {
    cwdPolicy: 'workspace-root',
    envAllowlist: ['PATH', 'HOME', 'USERPROFILE'],
    confirmation: 'required',
    timeoutSeconds: 6,
    dangerousCommandPatterns: ['rm -rf', 'Remove-Item', 'del /s', 'format ', 'git reset --hard', 'git clean']
  },
  connectors: [{
    id: 'codex',
    label: 'B2 controlled Node fixture (not Codex)',
    status: 'ready',
    runner: 'local-command',
    command: 'node',
    args: [],
    cwdPolicy: 'workspace-root',
    envAllowlist: ['PATH', 'HOME', 'USERPROFILE'],
    confirmation: 'required',
    timeoutSeconds: 6,
    acceptanceGate: 'B2 temporary controlled-process rehearsal only',
    approvalStatus: 'accepted',
    acceptedBy: 'temporary-b2-harness',
    acceptedAt: '2026-07-15T00:00:00.000Z',
    approvalEvidence: 'Temporary-directory fixture; never written to repository machine gates.',
    enabledByDefault: true
  }]
};

await mkdir(path.dirname(fixturePolicyPath), { recursive: true });
await mkdir(userDataDirectory, { recursive: true });
await writeFile(fixturePolicyPath, JSON.stringify(fixturePolicy, null, 2), 'utf8');
await writeFile(controlledScriptPath, [
  "'use strict';",
  "process.title = 'niuma-b2-controlled-node';",
  "process.on('SIGINT', () => process.exit(0));",
  "process.on('SIGTERM', () => process.exit(0));",
  'setInterval(() => {}, 1000);'
].join('\n'), 'utf8');

const commonConfig = {
  root,
  userDataDirectory,
  fixturePolicyPath,
  fixturePolicy,
  mainModulePath,
  preloadModulePath,
  rendererPath,
  overlapSampleCount,
  p95BudgetMs
};
const runtimeBundle = await build({
  entryPoints: [path.join(root, 'src', 'lib', 'connectorRuntime.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false
});
const runtimeTools = await import(
  `data:text/javascript;base64,${Buffer.from(runtimeBundle.outputFiles[0].text).toString('base64')}`
);
const harnessHelpers = [
  waitForMainWindow,
  waitForDocument,
  enterCockpit,
  installRendererProbe,
  startControlled,
  waitForTaskState,
  assertIdentityDom,
  readIdentityDom,
  readRuntimeChainDiagnostics,
  waitForDomState,
  waitForOverlapMarkers,
  rendererProbeStats,
  terminalEvidence,
  identityEvidence,
  duplicateLifecycleCount,
  percentile,
  waitForProcessExit,
  isAlive,
  execute,
  delay
].map((helper) => helper.toString()).join('\n\n');

await writeFile(
  phaseOnePath,
  `const assert = require('node:assert/strict');\nconst CONFIG = ${JSON.stringify(commonConfig)};\n${harnessHelpers}\n(${phaseOneHarness.toString()})().catch(fail);\nfunction fail(error) { console.error(error && (error.stack || error.message) || String(error)); process.exit(1); }\n`,
  'utf8'
);
await writeFile(
  phaseTwoPath,
  `const assert = require('node:assert/strict');\nconst CONFIG = ${JSON.stringify(commonConfig)};\n${harnessHelpers}\n(${phaseTwoHarness.toString()})().catch(fail);\nfunction fail(error) { console.error(error && (error.stack || error.message) || String(error)); process.exit(1); }\n`,
  'utf8'
);

let survivorPid = null;
try {
  const phaseOneOutput = await runElectron(phaseOnePath);
  const phaseOne = parseResult(phaseOneOutput.stdout, 'B2_PHASE_ONE_RESULT ');
  assert.equal(phaseOne.productionMain, mainModulePath);
  assert.equal(phaseOne.productionPreload, preloadModulePath);
  assert.equal(phaseOne.actualRenderer, rendererPath);
  assert.equal(phaseOne.externalAgentSpawnCount, 0);
  assert.equal(phaseOne.controlledNodeSpawnCount, 2);
  assert.equal(phaseOne.cancel.terminalState, 'stopped');
  assert.equal(phaseOne.timeout.terminalState, 'timed-out');
  assert.equal(phaseOne.cancel.duplicateStartedEvents, 0);
  assert.equal(phaseOne.cancel.duplicateTerminalEvents, 0);
  assert.equal(phaseOne.timeout.duplicateStartedEvents, 0);
  assert.equal(phaseOne.timeout.duplicateTerminalEvents, 0);
  assert.equal(phaseOne.reload.duplicateProbeDeliveries, 0);
  const restartSeed = await createExternalRestartSeed(runtimeTools);
  survivorPid = restartSeed.pid;
  assert.ok(isProcessAlive(survivorPid), 'The external controlled Node restart seed must be alive.');

  const phaseTwoOutput = await runElectron(phaseTwoPath);
  const phaseTwo = parseResult(phaseTwoOutput.stdout, 'B2_PHASE_TWO_RESULT ');
  assert.equal(phaseTwo.productionMain, mainModulePath);
  assert.equal(phaseTwo.productionPreload, preloadModulePath);
  assert.equal(phaseTwo.actualRenderer, rendererPath);
  assert.equal(phaseTwo.restart.taskId, restartSeed.taskId);
  assert.equal(phaseTwo.restart.sessionId, restartSeed.sessionId);
  assert.equal(phaseTwo.restart.pid, survivorPid);
  assert.equal(phaseTwo.restart.state, 'reattached');
  assert.equal(phaseTwo.restart.source, 'restart-recovery');
  assert.equal(phaseTwo.lost.state, 'session-lost');
  assert.ok(phaseTwo.lost.convergenceMs <= 10_000, 'Unproven identity must become session-lost within 10 seconds.');
  assert.equal(phaseTwo.duplicateStartedEvents, 0);
  assert.equal(phaseTwo.duplicateTerminalEvents, 0);
  assert.equal(phaseTwo.duplicateProbeDeliveries, 0);
  assert.equal(phaseTwo.controlledChildCount, 0);
  assert.equal(phaseTwo.externalAgentSpawnCount, 0);
  assert.equal(phaseTwo.overlap.samples, overlapSampleCount);
  assert.ok(phaseTwo.overlap.probeDurationsMs.every((value) => value > 0));
  assert.equal(isProcessAlive(survivorPid), false, 'Final controlled Node process count must be zero.');

  const result = {
    status: phaseTwo.overlap.p95Ms <= p95BudgetMs ? 'pass' : 'blocked_by_sync_cim_latency',
    path: 'production electron/main.ts -> production preload -> actual React renderer -> visible DOM',
    rehearsal: 'controlled non-Agent Node process; not real Agent E2E',
    lifecycle: {
      startRunningVisible: true,
      cancel: phaseOne.cancel,
      timeout: phaseOne.timeout,
      rendererReload: phaseOne.reload,
      appRestartReattach: phaseTwo.restart,
      restartRecoveryEnvelope: {
        productionDefaultCrashSurvival: false,
        externalControlledRestartSeed: true,
        detached: true,
        stdio: 'ignore',
        cwd: temporaryDirectory,
        timeoutAt: restartSeed.timeoutAt
      },
      identityLost: phaseTwo.lost
    },
    identityDom: phaseTwo.identityDom,
    overlap: phaseTwo.overlap,
    duplicateStartedEvents: phaseTwo.duplicateStartedEvents,
    duplicateTerminalEvents: phaseTwo.duplicateTerminalEvents,
    duplicateRendererSubscriptions: phaseOne.reload.duplicateProbeDeliveries + phaseTwo.duplicateProbeDeliveries,
    controlledChildCount: 0,
    externalAgentSpawnCount: 0,
    browserFallback: 'simulated/unavailable and never executable',
    repositoryConnectorGateChanged: false,
    fixturePolicyPath,
    fixturePolicyScope: 'temporary directory only'
  };
  console.log(`B2_PRODUCTION_PATH_RESULT ${JSON.stringify(result)}`);
  console.log(`B2 production-path status=${result.status}`);
  console.log('path=unmodified built production main -> production preload -> actual renderer projection -> DOM');
  console.log(`overlapping CIM samples=${result.overlap.samples}, p50=${result.overlap.p50Ms.toFixed(3)}ms, p95=${result.overlap.p95Ms.toFixed(3)}ms, max=${result.overlap.maxMs.toFixed(3)}ms, budget=${p95BudgetMs}ms`);
  console.log(`CIM probe duration p50=${result.overlap.probeP50Ms.toFixed(3)}ms, p95=${result.overlap.probeP95Ms.toFixed(3)}ms, max=${result.overlap.probeMaxMs.toFixed(3)}ms`);
  console.log('duplicate started=0; duplicate terminal=0; duplicate renderer probe deliveries=0');
  console.log('controlled non-Agent child cleanup=0; external Agent CLI spawn count=0');
} finally {
  if (survivorPid && isProcessAlive(survivorPid)) {
    try {
      process.kill(survivorPid);
    } catch {
      // The controlled process already exited.
    }
  }
  const [policyAfter, statusAfter] = await Promise.all([
    readFile(repositoryPolicyPath, 'utf8'),
    readFile(repositoryStatusPath, 'utf8')
  ]);
  assert.equal(policyAfter, policyBefore, 'Repository Connector policy must remain byte-for-byte unchanged.');
  assert.equal(
    JSON.stringify(JSON.parse(statusAfter).connectors ?? null),
    statusConnectorsBefore,
    'status.json connectors[] must remain unchanged.'
  );
  const temporaryDirectoryRemoved = await removeTemporaryDirectory(temporaryDirectory);
  if (!temporaryDirectoryRemoved) {
    console.warn(`B2_TEMP_CLEANUP_DEFERRED ${temporaryDirectory}`);
  }
}

async function removeTemporaryDirectory(directory) {
  let lastError;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      await rm(directory, { recursive: true, force: true });
      return true;
    } catch (error) {
      lastError = error;
      if (error?.code !== 'EBUSY' && error?.code !== 'EPERM') {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  if (lastError?.code === 'EBUSY' || lastError?.code === 'EPERM') {
    return false;
  }
  throw lastError;
}

function parseResult(stdout, prefix) {
  const line = stdout.split(/\r?\n/).find((candidate) => candidate.startsWith(prefix));
  assert.ok(line, `Missing ${prefix.trim()} in Electron output:\n${stdout}`);
  return JSON.parse(line.slice(prefix.length));
}

async function createExternalRestartSeed(tools) {
  const taskId = `connector-task-b2-restart-${Date.now()}`;
  const sessionId = `connector-session-b2-restart-${Date.now()}`;
  const child = spawn(process.execPath, [controlledScriptPath, 'B2 external controlled restart seed'], {
    cwd: temporaryDirectory,
    env: process.env,
    shell: false,
    windowsHide: true,
    detached: true,
    stdio: 'ignore'
  });
  assert.ok(Number.isInteger(child.pid) && child.pid > 0, 'External restart seed must expose a PID.');
  child.unref();
  await new Promise((resolve) => setTimeout(resolve, 100));
  const evidence = tools.inspectConnectorProcessEvidence(child.pid);
  assert.ok(evidence, 'External restart seed requires real Windows CIM evidence.');
  const capturedAt = new Date().toISOString();
  const fingerprint = tools.createConnectorProcessFingerprint(evidence, {
    taskId,
    sessionId,
    connectorId: 'codex',
    agentId: 'codex',
    executablePath: evidence.executablePath,
    cwd: temporaryDirectory
  }, capturedAt);
  assert.ok(fingerprint, 'External restart seed requires a bounded A7 fingerprint.');
  const timeoutAt = new Date(Date.now() + 120_000).toISOString();
  const event = (sequence, lifecycle, message) => ({
    eventId: `b2-restart-event-${sequence}`,
    sequence,
    timestamp: capturedAt,
    kind: 'lifecycle',
    lifecycle,
    message
  });
  const liveness = {
    status: 'fresh',
    source: 'process-event',
    lastSeen: capturedAt,
    staleAfterMs: 15_000
  };
  const session = {
    taskId,
    sessionId,
    connectorId: 'codex',
    agentId: 'codex',
    taskName: 'B2 external controlled restart seed',
    requestedBy: 'explicit-user-action',
    source: 'runtime-spawn',
    capabilities: ['structured-json-events', 'task-execution'],
    capabilitySource: 'adapter-declaration',
    state: 'running',
    startedAt: evidence.startedAt,
    pid: child.pid,
    processFingerprint: fingerprint,
    attempt: 1,
    maxAttempts: 1,
    retryPolicy: { maxRetries: 0, backoffMs: 250, budgetMs: 0 },
    timeoutAt,
    output: {
      receivedBytes: 0,
      archivedBytes: 0,
      droppedBytes: 0,
      outputEvents: 0,
      truncatedLines: 0,
      backpressureEvents: 0
    },
    liveness,
    events: [
      event(1, 'session-created', 'Controlled restart seed snapshot created.'),
      event(2, 'spawn-requested', 'External controlled Node seed was requested.'),
      event(3, 'session-started', 'OS confirmed external controlled Node seed.')
    ]
  };
  const snapshot = {
    version: 1,
    updatedAt: capturedAt,
    tasks: [session],
    instances: [{
      instanceId: 'codex:codex',
      agentId: 'codex',
      connectorId: 'codex',
      status: 'busy',
      source: 'connector-runtime',
      lastSeen: capturedAt,
      capabilities: ['structured-json-events', 'task-execution'],
      capabilitySource: 'adapter-declaration',
      sessionId,
      liveness
    }],
    runtime: {
      availability: 'available',
      mode: 'real',
      source: 'electron-main',
      observedAt: capturedAt
    }
  };
  const persistedPath = path.join(userDataDirectory, 'agent-data', 'connector-runtime.json');
  await mkdir(path.dirname(persistedPath), { recursive: true });
  await writeFile(persistedPath, JSON.stringify(snapshot, null, 2), 'utf8');
  return { taskId, sessionId, pid: child.pid, timeoutAt, evidenceSource: evidence.evidenceSource };
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function runElectron(entryPath, terminateAfterPrefix = '') {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: 'true' };
    delete env.ELECTRON_RUN_AS_NODE;
    const child = spawn(electronExecutable, [entryPath], {
      cwd: temporaryDirectory,
      env,
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let forcedCrash = false;
    let hardKillTimer = null;
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`B2 Electron phase exceeded ${processTimeoutMs}ms.\nstdout:\n${stdout}\nstderr:\n${stderr}`));
    }, processTimeoutMs);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (!forcedCrash && terminateAfterPrefix && stdout.includes(terminateAfterPrefix)) {
        forcedCrash = true;
        setTimeout(() => child.kill(), 100);
        hardKillTimer = setTimeout(() => {
          const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/F'], {
            shell: false,
            windowsHide: true,
            stdio: 'ignore'
          });
          killer.unref();
        }, 1_000);
      }
    });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('close', (code, signal) => {
      clearTimeout(timeout);
      if (hardKillTimer) clearTimeout(hardKillTimer);
      if (code !== 0 && !forcedCrash) {
        reject(new Error(`B2 Electron phase failed (code=${code}, signal=${signal ?? 'none'}).\nstdout:\n${stdout}\nstderr:\n${stderr}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function phaseOneHarness() {
  const assert = require('node:assert/strict');
  const childProcess = require('node:child_process');
  const fs = require('node:fs');
  const path = require('node:path');
  const { app, BrowserWindow, dialog } = require('electron');
  const originalSpawn = childProcess.spawn;
  let controlledNodeSpawnCount = 0;
  let externalAgentSpawnCount = 0;
  let runtimeSendCount = 0;

  app.setPath('userData', CONFIG.userDataDirectory);
  app.commandLine.appendSwitch('disable-gpu');
  BrowserWindow.prototype.show = function showHiddenB2Window() {};
  dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false });
  childProcess.spawn = function trackedSpawn(file, args, options) {
    const executable = path.basename(String(file)).toLowerCase();
    if (/^(codex|trae|qoder|openclaw|claude|minimax|opencode)(\.exe)?$/.test(executable)) {
      externalAgentSpawnCount += 1;
      throw new Error(`External Agent CLI execution is forbidden: ${executable}`);
    }
    if (executable === 'node.exe' || executable === 'node') {
      controlledNodeSpawnCount += 1;
    }
    return originalSpawn.call(this, file, args, options);
  };

  require(CONFIG.mainModulePath);
  await app.whenReady();
  const mainWindow = await waitForMainWindow(BrowserWindow);
  const originalSend = mainWindow.webContents.send.bind(mainWindow.webContents);
  mainWindow.webContents.send = (channel, ...args) => {
    if (channel === 'connectors:runtime-snapshot-changed') {
      runtimeSendCount += 1;
    }
    return originalSend(channel, ...args);
  };
  await waitForDocument(mainWindow);
  await enterCockpit(mainWindow);
  await installRendererProbe(mainWindow);

  let sendBaseline = runtimeSendCount;
  setFixtureTimeout(fs, 6);
  const cancelRun = await startControlled(mainWindow, 'B2 controlled Node cancel rehearsal');
  const cancelRunning = await waitForTaskState(mainWindow, cancelRun.taskId, 'running', 8_000);
  await assertIdentityDom(mainWindow, cancelRunning);
  const stopResult = await execute(mainWindow, `window.niumaDesk.stopConnector(${JSON.stringify({ taskId: cancelRun.taskId })})`);
  assert.ok(stopResult.status === 'stopping' || stopResult.status === 'stopped');
  const cancelTerminal = await waitForTaskState(mainWindow, cancelRun.taskId, 'stopped', 8_000);
  const cancelStats = await rendererProbeStats(mainWindow);
  const cancelSends = runtimeSendCount - sendBaseline;
  assert.equal(cancelStats.deliveries, cancelSends, 'One production send must produce one B2 renderer probe delivery before reload.');

  const reloadPromise = new Promise((resolve) => mainWindow.webContents.once('did-finish-load', resolve));
  mainWindow.reload();
  await reloadPromise;
  await waitForDocument(mainWindow);
  await enterCockpit(mainWindow);
  await installRendererProbe(mainWindow);
  sendBaseline = runtimeSendCount;

  setFixtureTimeout(fs, 6);
  const timeoutRun = await startControlled(mainWindow, 'B2 controlled Node timeout rehearsal');
  const timeoutRunning = await waitForTaskState(mainWindow, timeoutRun.taskId, 'running', 8_000);
  await assertIdentityDom(mainWindow, timeoutRunning);
  const timeoutTerminal = await waitForTaskState(mainWindow, timeoutRun.taskId, 'timed-out', 12_000);

  const reloadStats = await rendererProbeStats(mainWindow);
  const reloadSends = runtimeSendCount - sendBaseline;
  assert.equal(reloadStats.deliveries, reloadSends, 'Reloaded renderer must deliver each production send to the single B2 probe once.');
  const result = {
    productionMain: CONFIG.mainModulePath,
    productionPreload: CONFIG.preloadModulePath,
    actualRenderer: CONFIG.rendererPath,
    cancel: terminalEvidence(cancelTerminal),
    timeout: terminalEvidence(timeoutTerminal),
    reload: {
      productionSends: reloadSends,
      rendererProbeDeliveries: reloadStats.deliveries,
      duplicateProbeDeliveries: Math.max(0, reloadStats.deliveries - reloadSends),
      terminalStatePreserved: cancelTerminal.state
    },
    controlledNodeSpawnCount,
    externalAgentSpawnCount
  };
  console.log(`B2_PHASE_ONE_RESULT ${JSON.stringify(result)}`);
  app.exit(0);

  function setFixtureTimeout(fsModule, timeoutSeconds) {
    const policy = structuredClone(CONFIG.fixturePolicy);
    policy.defaults.timeoutSeconds = timeoutSeconds;
    policy.connectors[0].timeoutSeconds = timeoutSeconds;
    fsModule.writeFileSync(CONFIG.fixturePolicyPath, JSON.stringify(policy, null, 2), 'utf8');
  }
}

async function phaseTwoHarness() {
  const assert = require('node:assert/strict');
  const childProcess = require('node:child_process');
  const path = require('node:path');
  const { performance } = require('node:perf_hooks');
  const { app, BrowserWindow, dialog } = require('electron');
  const originalSpawn = childProcess.spawn;
  const originalSpawnSync = childProcess.spawnSync;
  let externalAgentSpawnCount = 0;
  let measurementArmed = false;
  let measuredProbeCount = 0;
  let mainWindow = null;
  let rawSend = null;
  let lastRuntimeSnapshot = null;
  let targetTaskId = '';
  const cimProbeDurationsMs = [];

  app.setPath('userData', CONFIG.userDataDirectory);
  app.commandLine.appendSwitch('disable-gpu');
  BrowserWindow.prototype.show = function showHiddenB2Window() {};
  dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false });
  childProcess.spawn = function guardedSpawn(file, args, options) {
    const executable = path.basename(String(file)).toLowerCase();
    if (/^(codex|trae|qoder|openclaw|claude|minimax|opencode)(\.exe)?$/.test(executable)) {
      externalAgentSpawnCount += 1;
      throw new Error(`External Agent CLI execution is forbidden: ${executable}`);
    }
    return originalSpawn.call(this, file, args, options);
  };
  childProcess.spawnSync = function measuredSpawnSync(file, args, options) {
    const isWindowsCim = String(file).toLowerCase().endsWith('powershell.exe')
      && Array.isArray(args)
      && args.some((arg) => String(arg).includes('Get-CimInstance Win32_Process'));
    if (!isWindowsCim) {
      return originalSpawnSync.call(this, file, args, options);
    }
    const t0EpochMs = Date.now();
    const startedAt = performance.now();
    const result = originalSpawnSync.call(this, file, args, options);
    const probeDurationMs = performance.now() - startedAt;
    cimProbeDurationsMs.push(probeDurationMs);
    if (measurementArmed && measuredProbeCount < CONFIG.overlapSampleCount) {
      measuredProbeCount += 1;
      const sample = measuredProbeCount;
      setImmediate(() => publishOverlapMarker({ sample, t0EpochMs, probeDurationMs }));
    }
    return result;
  };

  require(CONFIG.mainModulePath);
  await app.whenReady();
  mainWindow = await waitForMainWindow(BrowserWindow);
  rawSend = mainWindow.webContents.send.bind(mainWindow.webContents);
  let productionSendCount = 0;
  mainWindow.webContents.send = (channel, ...args) => {
    if (channel === 'connectors:runtime-snapshot-changed') {
      productionSendCount += 1;
      if (!args[0]?.__b2Overlap) {
        lastRuntimeSnapshot = structuredClone(args[0]);
      }
    }
    return rawSend(channel, ...args);
  };
  await waitForDocument(mainWindow);
  await enterCockpit(mainWindow);
  await installRendererProbe(mainWindow, true);

  const initialSnapshot = await execute(mainWindow, 'window.niumaDesk.getConnectorRuntimeSnapshot()');
  const reattached = initialSnapshot.tasks.find((task) => task.state === 'reattached');
  assert.ok(reattached, 'Production main must reattach the persisted controlled Node task.');
  targetTaskId = reattached.taskId;
  lastRuntimeSnapshot = structuredClone(initialSnapshot);
  await assertIdentityDom(mainWindow, reattached);
  const identityDom = await readIdentityDom(mainWindow);
  assert.equal(identityDom.taskId, reattached.taskId);
  assert.equal(identityDom.sessionId, reattached.sessionId);
  assert.equal(identityDom.agentId, reattached.agentId);
  assert.equal(identityDom.connectorId, reattached.connectorId);
  assert.equal(identityDom.source, 'restart-recovery');
  assert.equal(identityDom.pid, String(reattached.pid));
  measurementArmed = true;

  const markerResults = await waitForOverlapMarkers(mainWindow, CONFIG.overlapSampleCount, 45_000);
  const sortedLatencies = markerResults.map((item) => item.latencyMs).sort((a, b) => a - b);
  const measuredProbeDurations = markerResults.map((item) => item.probeDurationMs).sort((a, b) => a - b);
  const overlap = {
    samples: sortedLatencies.length,
    p50Ms: percentile(sortedLatencies, 50),
    p95Ms: percentile(sortedLatencies, 95),
    maxMs: sortedLatencies.at(-1),
    budgetMs: CONFIG.p95BudgetMs,
    probeP50Ms: percentile(measuredProbeDurations, 50),
    probeP95Ms: percentile(measuredProbeDurations, 95),
    probeMaxMs: measuredProbeDurations.at(-1),
    probeDurationsMs: measuredProbeDurations,
    samplesDetail: markerResults,
    publicationTiming: 't0 before real CIM; marker published only after synchronous probe returns',
    blocksMainThreadPropagation: percentile(sortedLatencies, 95) > CONFIG.p95BudgetMs
  };
  console.log(`B2_OVERLAP_AGGREGATE ${JSON.stringify(overlap)}`);

  const probeStatsBeforeLoss = await rendererProbeStats(mainWindow);
  const sendsBeforeLoss = productionSendCount;
  const lostStartedAt = Date.now();
  process.kill(reattached.pid);
  const lost = await waitForTaskState(mainWindow, reattached.taskId, 'session-lost', 10_000);
  const lostConvergenceMs = Date.now() - lostStartedAt;
  const terminalDom = await waitForDomState(mainWindow, reattached.taskId, 'session-lost', 2_000);
  const terminalChain = await readRuntimeChainDiagnostics(mainWindow, reattached.taskId);
  console.log(`B2_TERMINAL_CHAIN_DIAGNOSTIC ${JSON.stringify(terminalChain)}`);
  const probeStatsAfterLoss = await rendererProbeStats(mainWindow);
  const sendsAfterLoss = productionSendCount;
  const deliveryDelta = probeStatsAfterLoss.deliveries - probeStatsBeforeLoss.deliveries;
  const sendDelta = sendsAfterLoss - sendsBeforeLoss;
  assert.equal(deliveryDelta, sendDelta, 'The reloaded renderer B2 probe must receive each production loss publication once.');
  await waitForProcessExit(reattached.pid, 2_000);

  const result = {
    productionMain: CONFIG.mainModulePath,
    productionPreload: CONFIG.preloadModulePath,
    actualRenderer: CONFIG.rendererPath,
    restart: { ...identityEvidence(reattached), state: reattached.state },
    identityDom,
    overlap,
    lost: {
      state: lost.state,
      convergenceMs: lostConvergenceMs,
      source: lost.source,
      terminalDom,
      terminalChain
    },
    duplicateStartedEvents: duplicateLifecycleCount(lost, 'session-started'),
    duplicateTerminalEvents: duplicateLifecycleCount(lost, 'session-terminal'),
    duplicateProbeDeliveries: Math.max(0, deliveryDelta - sendDelta),
    controlledChildCount: isAlive(reattached.pid) ? 1 : 0,
    externalAgentSpawnCount
  };
  console.log(`B2_PHASE_TWO_RESULT ${JSON.stringify(result)}`);
  app.exit(0);

  function publishOverlapMarker(meta) {
    if (!mainWindow || mainWindow.isDestroyed() || !rawSend || !lastRuntimeSnapshot) {
      return;
    }
    const snapshot = structuredClone(lastRuntimeSnapshot);
    const task = snapshot.tasks.find((candidate) => candidate.taskId === targetTaskId);
    if (!task) {
      return;
    }
    const markerLastSeen = new Date().toISOString();
    task.liveness = { ...task.liveness, status: 'fresh', source: 'recovery-proof', lastSeen: markerLastSeen };
    const instance = snapshot.instances.find((candidate) => (
      candidate.sessionId === task.sessionId
      && candidate.agentId === task.agentId
      && candidate.connectorId === task.connectorId
    ));
    if (instance) {
      instance.lastSeen = markerLastSeen;
      instance.liveness = { ...instance.liveness, status: 'fresh', source: 'recovery-proof', lastSeen: markerLastSeen };
    }
    snapshot.updatedAt = markerLastSeen;
    snapshot.runtime = { ...snapshot.runtime, observedAt: markerLastSeen };
    snapshot.__b2Overlap = { ...meta, markerLastSeen };
    rawSend('connectors:runtime-snapshot-changed', snapshot);
  }
}

async function waitForMainWindow(BrowserWindow) {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    const window = BrowserWindow.getAllWindows().find((candidate) => (
      !candidate.isDestroyed() && candidate.getTitle().includes('控制舱')
    ));
    if (window) {
      return window;
    }
    await delay(20);
  }
  throw new Error('Production main window did not appear.');
}

async function waitForDocument(window) {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    try {
      if (await execute(window, "document.readyState === 'complete' && Boolean(window.niumaDesk)")) {
        return;
      }
    } catch {
      // Renderer navigation is still in progress.
    }
    await delay(20);
  }
  throw new Error('Actual production renderer did not become ready.');
}

async function enterCockpit(window) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const ready = await execute(window, `(() => {
      if (document.querySelector('.detail-panel')) return true;
      const button = [...document.querySelectorAll('button')].find((candidate) => candidate.textContent.includes('进控制舱'));
      if (button) button.click();
      return Boolean(document.querySelector('.detail-panel'));
    })()`);
    if (ready || await execute(window, "Boolean(document.querySelector('.detail-panel'))")) {
      await execute(window, `(() => { const details = document.querySelector('.detail-more'); if (details) details.open = true; return true; })()`);
      return;
    }
    await delay(20);
  }
  throw new Error('Actual renderer did not enter the cockpit.');
}

async function installRendererProbe(window, collectOverlap = false) {
  await execute(window, `(() => {
    if (window.__b2ProbeUnsubscribe) window.__b2ProbeUnsubscribe();
    window.__b2Probe = { deliveries: 0, markers: [], markerIds: [], lastDelivery: null };
    window.__b2ProbeUnsubscribe = window.niumaDesk.onConnectorRuntimeSnapshotChanged((snapshot) => {
      window.__b2Probe.deliveries += 1;
      const tasks = Array.isArray(snapshot?.tasks) ? snapshot.tasks : [];
      const instances = Array.isArray(snapshot?.instances) ? snapshot.instances : [];
      window.__b2Probe.lastDelivery = {
        updatedAt: snapshot?.updatedAt || '',
        runtime: snapshot?.runtime || null,
        tasks: tasks.map((task) => ({
          taskId: task.taskId,
          sessionId: task.sessionId,
          agentId: task.agentId,
          connectorId: task.connectorId,
          source: task.source,
          state: task.state,
          lastSeen: task.liveness?.lastSeen || '',
          pid: task.pid || null
        })),
        instances: instances.map((instance) => ({
          instanceId: instance.instanceId,
          sessionId: instance.sessionId || '',
          agentId: instance.agentId,
          connectorId: instance.connectorId,
          source: instance.source,
          status: instance.status,
          lastSeen: instance.lastSeen || ''
        }))
      };
      const marker = snapshot && snapshot.__b2Overlap;
      if (!marker || ${collectOverlap ? 'false' : 'true'}) return;
      if (window.__b2Probe.markerIds.includes(marker.sample)) {
        window.__b2Probe.markers.push({ ...marker, duplicate: true, latencyMs: Date.now() - marker.t0EpochMs });
        return;
      }
      window.__b2Probe.markerIds.push(marker.sample);
      let frames = 0;
      const observe = () => {
        frames += 1;
        const panel = document.querySelector('.detail-panel');
        if (panel && panel.dataset.runtimeLastSeen === marker.markerLastSeen) {
          window.__b2Probe.markers.push({ ...marker, duplicate: false, frames, latencyMs: Date.now() - marker.t0EpochMs });
          return;
        }
        if (frames < 180) requestAnimationFrame(observe);
      };
      requestAnimationFrame(observe);
    });
    return true;
  })()`);
}

async function startControlled(window, taskName) {
  const intent = {
    connectorId: 'codex',
    agentId: 'codex',
    taskName,
    prompt: `${taskName}; controlled Node fixture only; never execute an Agent CLI`,
    retry: { maxRetries: 0, backoffMs: 250, budgetMs: 0 }
  };
  const result = await execute(window, `(async () => {
    const intent = ${JSON.stringify(intent)};
    const authorization = await window.niumaDesk.requestConnectorAuthorization(intent);
    if (authorization.status !== 'granted') return { authorization };
    return window.niumaDesk.runConnector({ ...intent, authorizationGrant: authorization.grantId });
  })()`);
  assert.equal(result.status, 'accepted', `Controlled Node run was not accepted: ${JSON.stringify(result)}`);
  return result;
}

async function waitForTaskState(window, taskId, expectedState, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const snapshot = await execute(window, 'window.niumaDesk.getConnectorRuntimeSnapshot()');
    const task = snapshot.tasks.find((candidate) => candidate.taskId === taskId);
    if (task?.state === expectedState) {
      return task;
    }
    await delay(20);
  }
  const snapshot = await execute(window, 'window.niumaDesk.getConnectorRuntimeSnapshot()');
  throw new Error(`Task ${taskId} did not reach ${expectedState}: ${JSON.stringify(snapshot.tasks)}`);
}

async function assertIdentityDom(window, task) {
  const deadline = Date.now() + 3_000;
  while (Date.now() < deadline) {
    const identity = await readIdentityDom(window);
    if (
      identity.taskId === task.taskId
      && identity.sessionId === task.sessionId
      && identity.agentId === task.agentId
      && identity.connectorId === task.connectorId
      && identity.source === task.source
      && identity.lastSeen === task.liveness.lastSeen
      && identity.pid === String(task.pid)
      && identity.text.includes(task.taskId)
      && identity.text.includes(task.sessionId)
      && identity.text.includes(String(task.pid))
    ) {
      return identity;
    }
    await delay(20);
  }
  throw new Error(`Projected runtime identity did not reach visible DOM for ${task.taskId}: ${JSON.stringify(await readIdentityDom(window))}`);
}

function readIdentityDom(window) {
  return execute(window, `(() => {
    const panel = document.querySelector('.detail-panel');
    return {
      taskId: panel?.dataset.runtimeTaskId || '',
      sessionId: panel?.dataset.runtimeSessionId || '',
      agentId: panel?.dataset.runtimeAgentId || '',
      connectorId: panel?.dataset.runtimeConnectorId || '',
      source: panel?.dataset.runtimeSource || '',
      lastSeen: panel?.dataset.runtimeLastSeen || '',
      pid: panel?.dataset.runtimePid || '',
      primaryInstanceId: panel?.dataset.runtimePrimaryInstanceId || '',
      primarySessionId: panel?.dataset.runtimePrimarySessionId || '',
      primarySource: panel?.dataset.runtimePrimarySource || '',
      primaryReason: panel?.dataset.runtimePrimaryReason || '',
      primaryPresence: panel?.dataset.runtimePrimaryPresence || '',
      primaryActivity: panel?.dataset.runtimePrimaryActivity || '',
      text: panel?.innerText || ''
    };
  })()`);
}

async function readRuntimeChainDiagnostics(window, taskId) {
  return execute(window, `(async () => {
    const snapshot = await window.niumaDesk.getConnectorRuntimeSnapshot();
    const panel = document.querySelector('.detail-panel');
    const summarizeTask = (task) => task ? ({
      taskId: task.taskId,
      sessionId: task.sessionId,
      agentId: task.agentId,
      connectorId: task.connectorId,
      source: task.source,
      state: task.state,
      lastSeen: task.liveness?.lastSeen || '',
      pid: task.pid || null
    }) : null;
    const target = snapshot.tasks.find((task) => task.taskId === ${JSON.stringify(taskId)});
    return {
      productionRuntime: {
        updatedAt: snapshot.updatedAt,
        runtime: snapshot.runtime,
        targetTask: summarizeTask(target),
        matchingInstances: snapshot.instances.filter((instance) => (
          target
          && instance.sessionId === target.sessionId
          && instance.agentId === target.agentId
          && instance.connectorId === target.connectorId
        ))
      },
      preloadDelivery: window.__b2Probe?.lastDelivery || null,
      appProjectionSelection: {
        primaryInstanceId: panel?.dataset.runtimePrimaryInstanceId || '',
        primarySessionId: panel?.dataset.runtimePrimarySessionId || '',
        primarySource: panel?.dataset.runtimePrimarySource || '',
        primaryReason: panel?.dataset.runtimePrimaryReason || '',
        primaryPresence: panel?.dataset.runtimePrimaryPresence || '',
        primaryActivity: panel?.dataset.runtimePrimaryActivity || '',
        selectedTaskId: panel?.dataset.runtimeTaskId || '',
        selectedTaskState: panel?.dataset.runtimeState || ''
      },
      finalDom: {
        taskId: panel?.dataset.runtimeTaskId || '',
        sessionId: panel?.dataset.runtimeSessionId || '',
        agentId: panel?.dataset.runtimeAgentId || '',
        connectorId: panel?.dataset.runtimeConnectorId || '',
        source: panel?.dataset.runtimeSource || '',
        state: panel?.dataset.runtimeState || '',
        lastSeen: panel?.dataset.runtimeLastSeen || '',
        pid: panel?.dataset.runtimePid || '',
        text: panel?.innerText || ''
      }
    };
  })()`);
}

async function waitForDomState(window, taskId, expectedState, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await execute(window, `(() => {
      const panel = document.querySelector('.detail-panel');
      const stateRow = [...(panel?.querySelectorAll('.metric-item-row') || [])].find((row) => (
        row.querySelector('.metric-label')?.textContent?.trim() === 'Runtime task state:'
      ));
      return {
        state: panel?.dataset.runtimeState || '',
        visibleLabel: stateRow?.querySelector('.metric-label')?.textContent?.trim() || '',
        visibleValue: stateRow?.querySelector('.metric-value')?.textContent?.trim() || '',
        text: panel?.innerText || ''
      };
    })()`);
    if (
      result.state === expectedState
      && result.visibleLabel === 'Runtime task state:'
      && result.visibleValue === expectedState
    ) {
      return result;
    }
    await delay(20);
  }
  const diagnostics = await readRuntimeChainDiagnostics(window, taskId);
  console.log(`B2_TERMINAL_CHAIN_DIAGNOSTIC ${JSON.stringify(diagnostics)}`);
  throw new Error(`DOM did not show projected runtime task state ${expectedState}: ${JSON.stringify(diagnostics)}`);
}

async function waitForOverlapMarkers(window, count, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const probe = await rendererProbeStats(window);
    const unique = probe.markers.filter((item) => !item.duplicate);
    if (unique.length >= count) {
      assert.equal(probe.markers.filter((item) => item.duplicate).length, 0, 'Overlap marker must not be delivered twice.');
      return unique.slice(0, count);
    }
    await delay(50);
  }
  throw new Error(`Only ${JSON.stringify(await rendererProbeStats(window))} overlap markers reached DOM.`);
}

function rendererProbeStats(window) {
  return execute(window, `({
    deliveries: window.__b2Probe?.deliveries || 0,
    markers: window.__b2Probe?.markers || [],
    markerIds: window.__b2Probe?.markerIds || [],
    lastDelivery: window.__b2Probe?.lastDelivery || null
  })`);
}

function terminalEvidence(task) {
  return {
    taskId: task.taskId,
    sessionId: task.sessionId,
    terminalState: task.state,
    exitConfirmed: task.termination?.exitConfirmed === true,
    duplicateStartedEvents: duplicateLifecycleCount(task, 'session-started'),
    duplicateTerminalEvents: duplicateLifecycleCount(task, 'session-terminal')
  };
}

function identityEvidence(task) {
  return {
    taskId: task.taskId,
    sessionId: task.sessionId,
    agentId: task.agentId,
    connectorId: task.connectorId,
    source: task.source,
    lastSeen: task.liveness.lastSeen,
    pid: task.pid
  };
}

function duplicateLifecycleCount(task, lifecycle) {
  return Math.max(0, task.events.filter((event) => event.lifecycle === lifecycle).length - 1);
}

function percentile(sortedValues, percentileValue) {
  return sortedValues[Math.max(0, Math.ceil((percentileValue / 100) * sortedValues.length) - 1)];
}

async function waitForProcessExit(pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isAlive(pid)) return;
    await delay(20);
  }
  throw new Error(`Controlled Node PID ${pid} did not exit.`);
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function execute(window, source) {
  return window.webContents.executeJavaScript(source, true);
}

function delay(timeoutMs) {
  return new Promise((resolve) => setTimeout(resolve, timeoutMs));
}
