import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const executable = await resolvePackagedExecutable();
const allowOpenClawInstall = process.argv.includes('--allow-openclaw-install');
const screenshotArgument = process.argv.find((argument) => argument.startsWith('--screenshot='));
const screenshotPath = screenshotArgument
  ? path.resolve(screenshotArgument.slice('--screenshot='.length))
  : null;
const libraryScreenshotArgument = process.argv.find((argument) => argument.startsWith('--library-screenshot='));
const libraryScreenshotPath = libraryScreenshotArgument
  ? path.resolve(libraryScreenshotArgument.slice('--library-screenshot='.length))
  : null;
const planScreenshotArgument = process.argv.find((argument) => argument.startsWith('--plan-screenshot='));
const planScreenshotPath = planScreenshotArgument
  ? path.resolve(planScreenshotArgument.slice('--plan-screenshot='.length))
  : null;
const planMobileScreenshotArgument = process.argv.find((argument) => argument.startsWith('--plan-mobile-screenshot='));
const planMobileScreenshotPath = planMobileScreenshotArgument
  ? path.resolve(planMobileScreenshotArgument.slice('--plan-mobile-screenshot='.length))
  : null;
const hostFocusBudgetMs = 5_000;
const hostLaunchBudgetMs = 15_000;
const processTimeoutMs = 45_000;
const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'niuma-packaged-lifecycle-'));
const userDataDirectory = path.join(temporaryDirectory, 'user-data');
const debugPort = await reservePort();

let child;
let cdp;
let stdout = '';
let stderr = '';

async function runSmoke() {
try {
  child = spawn(executable, [
    `--remote-debugging-port=${debugPort}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${userDataDirectory}`
  ], {
    cwd: path.dirname(executable),
    env: {
      ...process.env,
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true'
    },
    shell: false,
    windowsHide: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });

  const target = await waitForTarget(debugPort, processTimeoutMs);
  cdp = await CdpClient.connect(target.webSocketDebuggerUrl);
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');

  await waitForExpression(cdp, `document.readyState === 'complete'`, 10_000);
  await clickElement(cdp, `Array.from(document.querySelectorAll('button')).find((button) => button.textContent.includes('进控制舱'))`);
  await waitForExpression(cdp, `Boolean(document.querySelector('.workspace-shell'))`, 5_000);

  const initial = await readLifecycle(cdp);
  await clickElement(cdp, `Array.from(document.querySelectorAll('button')).find((button) => button.textContent.includes('Agent Library'))`);
  await waitForExpression(cdp, `Boolean(document.querySelector('[data-agent-library="true"]'))`, 2_000);
  const library = await readAgentLibrary(cdp);
  assert.equal(library.registeredRows, 6, 'Agent Library must expose the six registered lifecycle candidates');
  assert.ok(library.rowIds.includes('codex') && library.rowIds.includes('trae') && library.rowIds.includes('openclaw'));
  assert.ok(library.levels.length === library.registeredRows, 'Agent Library rows must expose support levels');
  assert.ok(library.evidenceSources.every((source) => source.length > 0), 'Agent Library rows must expose evidence sources');
  assert.ok(library.tableOverflow <= 1, `Agent Library table has horizontal overflow: ${JSON.stringify(library)}`);
  const libraryScreenshot = libraryScreenshotPath ? await captureScreenshot(cdp, libraryScreenshotPath) : null;
  await clickElement(cdp, `document.querySelector('[data-agent-library="true"] button[aria-label="审阅 Kimi InstallPlan"]')`);
  await waitForExpression(cdp, `Boolean(document.querySelector('[data-install-plan-drawer="true"]'))`, 2_000);
  const installPlan = await readInstallPlan(cdp);
  assert.equal(installPlan.agentId, 'kimi');
  assert.equal(installPlan.status, 'draft');
  assert.equal(installPlan.executionEnabled, false);
  assert.equal(installPlan.permissionCount, 9, 'InstallPlan review must expose every PermissionManifest category');
  assert.equal(installPlan.stepCount, 3, 'Kimi existing-install draft must expose all structured steps');
  assert.ok(installPlan.source.includes('local-observation:kimi:windows:2026-07-18'));
  assert.equal(installPlan.publisher, 'unknown');
  assert.equal(installPlan.artifactDigest, 'unresolved');
  assert.equal(installPlan.executionControls, 1, 'Review-only drawer must expose only the disabled execution control');
  assert.ok(installPlan.drawerOverflow <= 1, `InstallPlan drawer has horizontal overflow: ${JSON.stringify(installPlan)}`);
  const planScreenshot = planScreenshotPath ? await captureScreenshot(cdp, planScreenshotPath) : null;
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 720,
    height: 760,
    deviceScaleFactor: 1,
    mobile: false
  });
  await delay(150);
  const installPlanMobile = await readInstallPlan(cdp);
  assert.ok(installPlanMobile.drawerOverflow <= 1, `Mobile InstallPlan drawer has horizontal overflow: ${JSON.stringify(installPlanMobile)}`);
  const planMobileScreenshot = planMobileScreenshotPath ? await captureScreenshot(cdp, planMobileScreenshotPath) : null;
  await cdp.send('Emulation.clearDeviceMetricsOverride');
  await clickElement(cdp, `document.querySelector('[data-install-plan-drawer="true"] button[aria-label="关闭 InstallPlan"]')`);
  await waitForExpression(cdp, `!document.querySelector('[data-install-plan-drawer="true"]')`, 2_000);
  await clickElement(cdp, `document.querySelector('[data-agent-library="true"] button[aria-label="关闭 Agent Library"]')`);
  await waitForExpression(cdp, `!document.querySelector('[data-agent-library="true"]')`, 2_000);
  const traeBefore = getAgent(initial, 'Trae');
  const workBuddyBefore = getAgent(initial, 'WorkBuddy');
  const qoder = getAgent(initial, 'Qoder');
  const minimax = getAgent(initial, 'MiniMax');
  const openclaw = getAgent(initial, 'OpenClaw');
  const codex = getAgent(initial, 'Codex');

  assert.ok(
    traeBefore.state === 'stopped' || traeBefore.state === 'idle',
    `Trae lifecycle is unavailable in the selected package: ${JSON.stringify(traeBefore)}`
  );
  assert.match(traeBefore.action, /打开 Trae|聚焦 Trae/);
  assert.ok(
    workBuddyBefore.state === 'stopped' || workBuddyBefore.state === 'idle',
    `WorkBuddy lifecycle is unavailable in the selected package: ${JSON.stringify(workBuddyBefore)}`
  );
  assert.match(workBuddyBefore.action, /打开 WorkBuddy|聚焦 WorkBuddy/);
  assert.ok(qoder.state === 'stopped' || qoder.state === 'idle');
  assert.equal(minimax.state, 'idle');
  assert.match(minimax.action, /聚焦 MiniMax/);
  assert.match(minimax.avatarTitle, /熟睡躺平/);
  assert.equal(openclaw.state, 'stopped');
  assert.equal(openclaw.action, '安装服务');
  assert.ok(codex.state === 'working' || codex.state === 'idle');

  const traeAction = await clickAgentHostAction(cdp, 'Trae', traeBefore);
  await selectAgent(cdp, 'Trae');
  const traeSessions = await readSelectedSessions(cdp);
  assert.equal(traeSessions.agentName, 'Trae');
  assert.equal(traeSessions.count, 0, 'Trae host presence must not fabricate a Session');
  assert.equal(traeSessions.empty, true);

  const workBuddyAction = await clickAgentHostAction(cdp, 'WorkBuddy', workBuddyBefore);
  await selectAgent(cdp, 'WorkBuddy');
  const workBuddySessions = await readSelectedSessions(cdp);
  assert.equal(workBuddySessions.agentName, 'WorkBuddy');
  assert.equal(workBuddySessions.count, 0, 'WorkBuddy host presence must not fabricate a Session');
  assert.equal(workBuddySessions.empty, true);

  const qoderAction = await clickAgentHostAction(cdp, 'Qoder', qoder);

  await selectAgent(cdp, 'Codex');
  const codexSessions = await readSelectedSessions(cdp);
  assert.equal(codexSessions.agentName, 'Codex');
  assert.ok(codexSessions.count > 0, 'Packaged Codex Session view must expose observed desktop sessions');
  assert.ok(codexSessions.sources.includes('codex-desktop'));
  const layout = await readSelectedLayout(cdp);
  assert.ok(layout.pageOverflow <= 1, `Packaged page has horizontal overflow: ${JSON.stringify(layout)}`);
  assert.ok(layout.detailOverflow <= 1, `Agent detail panel has horizontal overflow: ${JSON.stringify(layout)}`);
  assert.ok(layout.tabOverflow <= 1, `Session tab has horizontal overflow: ${JSON.stringify(layout)}`);
  const screenshot = screenshotPath ? await captureScreenshot(cdp, screenshotPath) : null;

  let openClawResult = 'not-requested';
  if (allowOpenClawInstall) {
    await clickElement(
      cdp,
      `document.querySelector('button.host-primary-action[aria-label="OpenClaw：安装服务"]')`
    );
    await waitForExpression(
      cdp,
      `Array.from(document.querySelectorAll('.host-action-feedback')).some((item) => item.textContent.includes('已打开 OpenClaw 官方初始化向导'))`,
      3_000
    );
    openClawResult = 'official-wizard-started';
  }

  const result = {
    executable,
    target: {
      title: target.title,
      url: target.url
    },
    initial: {
      trae: traeBefore,
      workbuddy: workBuddyBefore,
      qoder,
      minimax,
      openclaw,
      codex
    },
    hostActions: {
      trae: traeAction,
      workbuddy: workBuddyAction,
      qoder: qoderAction,
      focusBudgetMs: hostFocusBudgetMs,
      launchBudgetMs: hostLaunchBudgetMs
    },
    sessions: { trae: traeSessions, workbuddy: workBuddySessions, codex: codexSessions },
    library,
    libraryScreenshot,
    installPlan,
    planScreenshot,
    installPlanMobile,
    planMobileScreenshot,
    layout,
    screenshot,
    openclaw: openClawResult,
    pass: traeAction.transitionMs <= traeAction.budgetMs
      && workBuddyAction.transitionMs <= workBuddyAction.budgetMs
      && qoderAction.transitionMs <= qoderAction.budgetMs
  };

  assert.equal(result.pass, true);
  console.log(`PACKAGED_AGENT_LIFECYCLE_SMOKE ${JSON.stringify(result)}`);
} catch (error) {
  const detail = error instanceof Error ? error.stack || error.message : String(error);
  throw new Error(`${detail}\nstdout:\n${stdout}\nstderr:\n${stderr}`);
} finally {
  cdp?.close();
  if (child?.pid) {
    await stopProcessTree(child.pid);
  }
  await delay(500);
  try {
    await rm(temporaryDirectory, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(`Temporary Electron profile cleanup deferred: ${detail}`);
  }
}
}

function getAgent(agents, name) {
  const agent = agents.find((item) => item.name === name);
  assert.ok(agent, `${name} lifecycle card is missing.`);
  return agent;
}

async function readLifecycle(client) {
  return evaluate(client, `(() => Array.from(document.querySelectorAll('.agent-card')).map((card) => ({
    name: card.querySelector('.agent-card-top strong')?.textContent?.trim() || '',
    state: card.querySelector('[data-host-lifecycle]')?.getAttribute('data-host-lifecycle') || '',
    status: card.querySelector('.agent-host-status')?.textContent?.replace(/\\s+/g, ' ').trim() || '',
    action: card.querySelector('.host-primary-action')?.textContent?.replace(/\\s+/g, ' ').trim() || '',
    avatarTitle: card.querySelector('.niuma-avatar')?.getAttribute('title') || '',
    feedback: card.querySelector('.host-action-feedback')?.textContent?.replace(/\\s+/g, ' ').trim() || ''
  })))()`);
}

async function waitForAgent(client, name, predicate, timeoutMs) {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    const agent = getAgent(await readLifecycle(client), name);
    if (predicate(agent)) {
      return agent;
    }
    await delay(100);
  }
  const agent = getAgent(await readLifecycle(client), name);
  throw new Error(`${name} lifecycle did not reach the expected state within ${timeoutMs}ms: ${JSON.stringify(agent)}`);
}

async function clickAgentHostAction(client, name, before) {
  const startedAt = performance.now();
  const timeoutMs = before.state === 'stopped' ? hostLaunchBudgetMs : hostFocusBudgetMs;
  await clickElement(
    client,
    `Array.from(document.querySelectorAll('.agent-card')).find((card) => card.querySelector('.agent-card-top strong')?.textContent?.trim() === ${JSON.stringify(name)})?.querySelector('button.host-primary-action')`
  );

  const after = before.state === 'stopped'
    ? await waitForAgent(
        client,
        name,
        (agent) => agent.state === 'idle' && new RegExp('聚焦 ' + name).test(agent.action),
        timeoutMs
      )
    : await waitForAgent(client, name, (agent) => Boolean(agent.feedback), timeoutMs);

  return {
    action: before.state === 'stopped' ? 'launch' : 'focus',
    transitionMs: Number((performance.now() - startedAt).toFixed(1)),
    budgetMs: timeoutMs,
    after
  };
}

async function selectAgent(client, name) {
  await clickElement(
    client,
    `Array.from(document.querySelectorAll('.agent-card')).find((card) => card.querySelector('.agent-card-top strong')?.textContent?.trim() === ${JSON.stringify(name)})?.querySelector('button.agent-card-hit')`
  );
  await waitForExpression(
    client,
    `document.querySelector('.detail-panel .detail-name h2')?.textContent?.trim() === ${JSON.stringify(name)}`,
    2_000
  );
  await delay(250);
}

async function readSelectedSessions(client) {
  return evaluate(client, `(() => {
    const panel = document.querySelector('.detail-panel');
    return {
      agentName: panel?.querySelector('.detail-name h2')?.textContent?.trim() || '',
      count: Number(panel?.getAttribute('data-agent-session-count') || 0),
      empty: Boolean(panel?.querySelector('[data-session-empty="true"]')),
      sources: Array.from(panel?.querySelectorAll('[data-session-source]') || []).map((item) => item.getAttribute('data-session-source')),
      statuses: Array.from(panel?.querySelectorAll('[data-session-status]') || []).map((item) => item.getAttribute('data-session-status'))
    };
  })()`);
}

async function readAgentLibrary(client) {
  return evaluate(client, `(() => {
    const dialog = document.querySelector('[data-agent-library="true"]');
    const table = dialog?.querySelector('.agent-library-table');
    return {
      registeredRows: dialog?.querySelectorAll('tbody tr[data-catalogued="true"]').length || 0,
      rowIds: Array.from(dialog?.querySelectorAll('tbody tr[data-catalogued="true"]') || []).map((row) => row.getAttribute('data-agent-library-row')),
      levels: Array.from(dialog?.querySelectorAll('tbody tr[data-catalogued="true"]') || []).map((row) => row.getAttribute('data-support-level')),
      evidenceSources: Array.from(dialog?.querySelectorAll('tbody tr[data-catalogued="true"] td:nth-child(8) code') || []).map((code) => code.textContent?.trim() || ''),
      tableOverflow: table ? table.scrollWidth - table.clientWidth : 0
    };
  })()`);
}

async function readInstallPlan(client) {
  return evaluate(client, `(() => {
    const drawer = document.querySelector('[data-install-plan-drawer="true"]');
    const scroll = drawer?.querySelector('.install-plan-scroll');
    return {
      agentId: drawer?.getAttribute('data-plan-agent') || '',
      status: drawer?.getAttribute('data-plan-status') || '',
      executionEnabled: drawer?.getAttribute('data-plan-execution-enabled') === 'true',
      permissionCount: drawer?.querySelectorAll('[data-plan-permission]').length || 0,
      stepCount: drawer?.querySelectorAll('[data-plan-step]').length || 0,
      source: drawer?.querySelector('[data-plan-source] dd')?.textContent?.trim() || '',
      publisher: drawer?.querySelector('[data-plan-publisher] dd')?.textContent?.trim() || '',
      artifactDigest: drawer?.querySelector('[data-plan-artifact-digest] dd')?.textContent?.trim() || '',
      executionControls: drawer?.querySelectorAll('[data-install-plan-execute="disabled"]').length || 0,
      drawerOverflow: scroll ? scroll.scrollWidth - scroll.clientWidth : 0
    };
  })()`);
}

async function captureScreenshot(client, outputPath) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const response = await client.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false
  });
  const buffer = Buffer.from(response.data, 'base64');
  assert.ok(buffer.length > 10_000, `Electron screenshot is unexpectedly small: ${buffer.length} bytes`);
  await writeFile(outputPath, buffer);
  return {
    path: outputPath,
    bytes: buffer.length,
    route: 'electron-cdp-page-capture'
  };
}

async function readSelectedLayout(client) {
  return evaluate(client, `(() => {
    const detail = document.querySelector('.detail-panel');
    const tab = detail?.querySelector('.detail-tab-content');
    return {
      viewport: document.documentElement.clientWidth,
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      detailWidth: detail?.clientWidth || 0,
      detailOverflow: detail ? detail.scrollWidth - detail.clientWidth : 0,
      tabWidth: tab?.clientWidth || 0,
      tabOverflow: tab ? tab.scrollWidth - tab.clientWidth : 0,
      tabChildren: tab ? Array.from(tab.children).map((child) => ({
        className: child.className,
        clientWidth: child.clientWidth,
        scrollWidth: child.scrollWidth,
        rectWidth: Math.round(child.getBoundingClientRect().width)
      })) : []
    };
  })()`);
}

async function clickElement(client, expression) {
  const rect = await evaluate(client, `(() => {
    const element = ${expression};
    if (!(element instanceof HTMLElement)) return null;
    element.scrollIntoView({ block: 'center', inline: 'center' });
    const bounds = element.getBoundingClientRect();
    return {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
      width: bounds.width,
      height: bounds.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      disabled: 'disabled' in element && element.disabled
    };
  })()`);
  assert.ok(rect, `Clickable element was not found: ${expression}`);
  assert.ok(rect.width > 0 && rect.height > 0, `Clickable element is not visible: ${expression}`);
  assert.ok(
    rect.x >= 0 && rect.x <= rect.viewportWidth && rect.y >= 0 && rect.y <= rect.viewportHeight,
    `Clickable element is outside the viewport: ${expression} ${JSON.stringify(rect)}`
  );
  assert.equal(rect.disabled, false, `Clickable element is disabled: ${expression}`);
  await client.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: rect.x,
    y: rect.y,
    button: 'left',
    clickCount: 1
  });
  await client.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: rect.x,
    y: rect.y,
    button: 'left',
    clickCount: 1
  });
}

async function waitForExpression(client, expression, timeoutMs) {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    if (await evaluate(client, expression)) {
      return;
    }
    await delay(100);
  }
  throw new Error(`Renderer expression timed out after ${timeoutMs}ms: ${expression}`);
}

async function evaluate(client, expression) {
  const response = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text || 'Renderer evaluation failed.');
  }
  return response.result?.value;
}

async function waitForTarget(port, timeoutMs) {
  const deadline = performance.now() + timeoutMs;
  let observedTargets = [];
  while (performance.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (response.ok) {
        observedTargets = await response.json();
        const target = observedTargets.find((item) => (
          item.type === 'page' && /\/dist\/index\.html(?:$|[?#])/.test(item.url || '')
        ));
        if (target?.webSocketDebuggerUrl) {
          return target;
        }
      }
    } catch {
      // Electron may still be starting.
    }
    await delay(150);
  }
  throw new Error(
    `Packaged Electron control-cockpit target was not available on port ${port}: `
      + JSON.stringify(observedTargets.map((item) => ({ type: item.type, title: item.title, url: item.url })))
  );
}

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function resolvePackagedExecutable() {
  const explicitArgument = process.argv.find((argument) => argument.startsWith('--executable='));
  if (explicitArgument) {
    const explicitPath = path.resolve(explicitArgument.slice('--executable='.length));
    await stat(explicitPath);
    return explicitPath;
  }

  const releaseRoot = path.join(root, 'release');
  const entries = await readdir(releaseRoot, { withFileTypes: true });
  const candidates = await Promise.all(entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('desktop-ranch-win-unpacked'))
    .map(async (entry) => {
      const candidate = path.join(releaseRoot, entry.name, '桌面牧场.exe');
      try {
        await stat(candidate);
        const packageStat = await stat(path.dirname(candidate));
        return { candidate, modifiedAt: packageStat.mtimeMs };
      } catch {
        return null;
      }
    }));
  const latest = candidates
    .filter(Boolean)
    .sort((left, right) => right.modifiedAt - left.modifiedAt)[0];
  assert.ok(latest, 'No packaged Windows executable was found under release/.');
  return latest.candidate;
}

function stopProcessTree(pid) {
  if (process.platform !== 'win32') {
    child?.kill();
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    execFile('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { windowsHide: true }, () => resolve());
  });
}

function delay(timeoutMs) {
  return new Promise((resolve) => setTimeout(resolve, timeoutMs));
}

class CdpClient {
  static connect(url) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      const client = new CdpClient(socket);
      socket.addEventListener('open', () => resolve(client), { once: true });
      socket.addEventListener('error', () => reject(new Error('Could not connect to Electron DevTools.')), { once: true });
    });
  }

  constructor(socket) {
    this.socket = socket;
    this.sequence = 0;
    this.pending = new Map();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) {
        return;
      }
      const pending = this.pending.get(message.id);
      if (!pending) {
        return;
      }
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(message.error.message));
      } else {
        pending.resolve(message.result);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, 10_000);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

await runSmoke();
