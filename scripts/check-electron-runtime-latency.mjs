import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const sampleCount = 200;
const warmupCount = 10;
const p95BudgetMs = 500;
const processTimeoutMs = 60_000;
const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'niuma-electron-runtime-latency-'));
const preloadOutput = path.join(temporaryDirectory, 'preload.cjs');
const harnessOutput = path.join(temporaryDirectory, 'main.cjs');
const rendererOutput = path.join(temporaryDirectory, 'renderer.html');
const userDataDirectory = path.join(temporaryDirectory, 'user-data');
const electronExecutable = path.join(
  root,
  'node_modules',
  'electron',
  'dist',
  process.platform === 'win32' ? 'electron.exe' : 'electron'
);

const rendererSource = `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8"><title>Connector runtime latency fixture</title></head>
  <body data-connector-task-id="">
    <script>
      window.__connectorLatencyReady = false;
      window.__connectorLatencyLastTaskId = '';
      const unsubscribe = window.niumaDesk.onConnectorRuntimeSnapshotChanged((snapshot) => {
        const taskId = snapshot && snapshot.tasks && snapshot.tasks[0]
          ? snapshot.tasks[0].taskId
          : '';
        window.__connectorLatencyLastTaskId = taskId;
        document.body.dataset.connectorTaskId = taskId;
      });
      window.__connectorLatencyUnsubscribe = unsubscribe;
      window.__connectorLatencyReady = true;
    </script>
  </body>
</html>`;

const harnessSource = String.raw`
import assert from 'node:assert/strict';
import { app, BrowserWindow } from 'electron';
import { ConnectorRuntime } from './src/lib/connectorRuntime';

const sampleCount = ${sampleCount};
const warmupCount = ${warmupCount};
const p95BudgetMs = ${p95BudgetMs};
const preloadPath = ${JSON.stringify(preloadOutput)};
const rendererPath = ${JSON.stringify(rendererOutput)};
const userDataPath = ${JSON.stringify(userDataDirectory)};
const runtimes = [];
let connectorSpawnCalls = 0;

app.setPath('userData', userDataPath);
app.commandLine.appendSwitch('disable-gpu');

function persistedSnapshot(sequence) {
  const timestamp = new Date().toISOString();
  return {
    version: 1,
    updatedAt: timestamp,
    tasks: [{
      taskId: 'latency-task-' + sequence,
      sessionId: 'latency-session-' + sequence,
      connectorId: 'codex',
      agentId: 'codex',
      taskName: 'Electron latency fixture ' + sequence,
      requestedBy: 'explicit-user-action',
      source: 'runtime-spawn',
      capabilities: ['fixture-event'],
      capabilitySource: 'runtime-observed',
      state: 'running',
      startedAt: timestamp,
      attempt: 1,
      maxAttempts: 1,
      retryPolicy: { maxRetries: 0, backoffMs: 250, budgetMs: 0 },
      output: {
        receivedBytes: 0,
        archivedBytes: 0,
        droppedBytes: 0,
        outputEvents: 0,
        truncatedLines: 0,
        backpressureEvents: 0
      },
      liveness: {
        status: 'fresh',
        source: 'process-event',
        lastSeen: timestamp,
        staleAfterMs: 15_000
      },
      events: [{
        eventId: 'latency-event-' + sequence,
        sequence,
        timestamp,
        kind: 'heartbeat',
        lifecycle: 'heartbeat',
        message: 'Electron latency fixture event ' + sequence
      }]
    }],
    instances: [],
    runtime: {
      availability: 'available',
      mode: 'real',
      source: 'electron-main',
      observedAt: timestamp
    }
  };
}

function delay(timeoutMs) {
  return new Promise((resolve) => setTimeout(resolve, timeoutMs));
}

async function waitForRenderer(window, expression, timeoutMs = 2_000) {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    if (await window.webContents.executeJavaScript(expression, true)) {
      return;
    }
    await delay(1);
  }
  throw new Error('Renderer visibility timeout for expression: ' + expression);
}

function percentile(sortedValues, percentileValue) {
  const index = Math.max(0, Math.ceil((percentileValue / 100) * sortedValues.length) - 1);
  return sortedValues[index];
}

async function run() {
  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  await window.loadFile(rendererPath);
  await waitForRenderer(window, 'window.__connectorLatencyReady === true');

  const latencies = [];
  for (let sequence = 0; sequence < warmupCount + sampleCount; sequence += 1) {
    const taskId = 'latency-task-' + sequence;
    let resolvePublication;
    let rejectPublication;
    const publication = new Promise((resolve, reject) => {
      resolvePublication = resolve;
      rejectPublication = reject;
    });

    const runtime = new ConnectorRuntime({
      loadPolicy: () => null,
      resolveExecutable: () => null,
      spawnProcess: () => {
        connectorSpawnCalls += 1;
        throw new Error('Connector process spawning is forbidden in the latency fixture.');
      },
      workspaceRoot: process.cwd(),
      sourceEnv: {},
      loadPersistedSnapshot: () => persistedSnapshot(sequence),
      persistSnapshot: () => {},
      setTimer: () => ({ fixtureTimer: true }),
      clearTimer: () => {},
      publish: (snapshot) => {
        const publishedTaskId = snapshot.tasks[0] && snapshot.tasks[0].taskId;
        if (publishedTaskId !== taskId) {
          rejectPublication(new Error('Unexpected Connector runtime fixture task: ' + publishedTaskId));
          return;
        }
        const sentAt = performance.now();
        window.webContents.send('connectors:runtime-snapshot-changed', snapshot);
        void waitForRenderer(
          window,
          'window.__connectorLatencyLastTaskId === ' + JSON.stringify(taskId)
            + ' && document.body.dataset.connectorTaskId === ' + JSON.stringify(taskId)
        ).then(() => resolvePublication(performance.now() - sentAt), rejectPublication);
      }
    });
    runtimes.push(runtime);
    const latency = await publication;
    if (sequence >= warmupCount) {
      latencies.push(latency);
    }
  }

  assert.equal(latencies.length, sampleCount, 'All measured samples must reach renderer-visible state.');
  assert.equal(connectorSpawnCalls, 0, 'Connector runtime must not spawn an external process.');
  const sorted = [...latencies].sort((left, right) => left - right);
  const result = {
    samples: sorted.length,
    warmups: warmupCount,
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    maxMs: sorted[sorted.length - 1],
    p95BudgetMs,
    connectorSpawnCalls,
    preloadBridge: 'electron/preload.ts',
    rendererVisibleState: 'window state + DOM dataset'
  };
  assert.ok(
    result.p95Ms <= p95BudgetMs,
    'Connector runtime propagation p95 ' + result.p95Ms.toFixed(3)
      + 'ms exceeds ' + p95BudgetMs + 'ms.'
  );
  console.log('ELECTRON_RUNTIME_LATENCY_RESULT ' + JSON.stringify(result));
  window.destroy();
}

app.whenReady().then(async () => {
  try {
    await run();
    app.exit(0);
  } catch (error) {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    app.exit(1);
  }
});
`;

try {
  const [mainSource, preloadSource] = await Promise.all([
    readFile(path.join(root, 'electron', 'main.ts'), 'utf8'),
    readFile(path.join(root, 'electron', 'preload.ts'), 'utf8')
  ]);
  assert.match(mainSource, /createReadOnlyConnectorGateRequest\(input\)/);
  assert.match(mainSource, /authorizeRun:\s*\(request\)\s*=>\s*connectorRunAuthorizer\.consume\(request\)/);
  assert.match(mainSource, /requestedBy:\s*'explicit-user-action'/);
  assert.doesNotMatch(mainSource, /requestedBy:\s*input(?:\?|\.)/);
  assert.doesNotMatch(mainSource, /confirmationAccepted:\s*input(?:\?|\.)/);
  const preloadRunBody = preloadSource.match(/runConnector:[\s\S]*?stopConnector:/)?.[0] ?? '';
  assert.match(preloadRunBody, /authorizationGrant:\s*input\.authorizationGrant/);
  assert.doesNotMatch(preloadRunBody, /requestedBy:\s*input\./);
  assert.doesNotMatch(preloadRunBody, /confirmationAccepted:\s*input\./);

  await writeFile(rendererOutput, rendererSource, 'utf8');
  await Promise.all([
    build({
      entryPoints: [path.join(root, 'electron', 'preload.ts')],
      outfile: preloadOutput,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      external: ['electron'],
      logLevel: 'silent'
    }),
    build({
      stdin: {
        contents: harnessSource,
        loader: 'ts',
        resolveDir: root,
        sourcefile: 'electron-runtime-latency-fixture.ts'
      },
      outfile: harnessOutput,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      external: ['electron'],
      logLevel: 'silent'
    })
  ]);

  const output = await runElectronHarness();
  const resultLine = output.stdout
    .split(/\r?\n/)
    .find((line) => line.startsWith('ELECTRON_RUNTIME_LATENCY_RESULT '));
  assert.ok(resultLine, `Electron latency result missing.\nstdout:\n${output.stdout}\nstderr:\n${output.stderr}`);
  const result = JSON.parse(resultLine.slice('ELECTRON_RUNTIME_LATENCY_RESULT '.length));
  assert.equal(result.connectorSpawnCalls, 0);
  assert.equal(result.samples, sampleCount);
  assert.ok(result.p95Ms <= p95BudgetMs);

  console.log('Electron Connector runtime propagation latency check passed.');
  console.log(`samples=${result.samples}, warmups=${result.warmups}`);
  console.log(
    `p50=${result.p50Ms.toFixed(3)}ms, p95=${result.p95Ms.toFixed(3)}ms, `
      + `max=${result.maxMs.toFixed(3)}ms, budget=${result.p95BudgetMs}ms`
  );
  console.log('path=ConnectorRuntime.publish -> webContents.send -> production preload -> renderer callback -> DOM');
  console.log('external Agent/Connector spawn calls=0; allowed project Electron launch=1');
  console.log('gate=renderer authorization self-assertion absent; production authorizeRun consumes main-owned grant');
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

function runElectronHarness() {
  return new Promise((resolve, reject) => {
    const child = spawn(electronExecutable, [harnessOutput], {
      cwd: root,
      env: {
        ...process.env,
        ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
        ELECTRON_RUN_AS_NODE: undefined
      },
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`Electron latency fixture exceeded ${processTimeoutMs}ms.`));
    }, processTimeoutMs);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('close', (code, signal) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(
          `Electron latency fixture failed (code=${code}, signal=${signal ?? 'none'}).`
            + `\nstdout:\n${stdout}\nstderr:\n${stderr}`
        ));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}
