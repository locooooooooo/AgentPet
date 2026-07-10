import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

const root = process.cwd();
const scriptPath = fileURLToPath(import.meta.url);
const isElectronChild = process.argv.includes('--electron-child');

function readArg(name, fallback = null) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

async function isReachable(url) {
  return new Promise((resolve) => {
    const request = http.get(url, { timeout: 1200 }, (response) => {
      response.resume();
      resolve(Boolean(response.statusCode && response.statusCode >= 200 && response.statusCode < 500));
    });
    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });
    request.on('error', () => resolve(false));
  });
}

async function pickTarget() {
  const explicitUrl = readArg('url');
  if (explicitUrl) {
    return { type: 'url', target: explicitUrl };
  }

  const devUrl = process.env.RANCH_CAPTURE_URL ?? 'http://127.0.0.1:5173/ranch.html';
  if (await isReachable(devUrl)) {
    return { type: 'url', target: devUrl };
  }

  const distPath = path.join(root, 'dist', 'ranch.html');
  if (fs.existsSync(distPath)) {
    return { type: 'file', target: distPath };
  }

  throw new Error(`No ranch target is reachable. Tried ${devUrl} and ${distPath}`);
}

async function runParent() {
  const electronModule = await import('electron');
  const electronBinary = typeof electronModule.default === 'string'
    ? electronModule.default
    : electronModule.default?.toString?.();

  if (!electronBinary || !fs.existsSync(electronBinary)) {
    throw new Error('Cannot resolve Electron binary from the local electron package.');
  }

  const target = await pickTarget();
  const date = readArg('date', '2026-07-09');
  const defaultBase = path.join(root, 'docs', 'orchestration', 'sessions', `ranch-pointer-capture-${date}`);
  const outJson = path.resolve(readArg('out-json', `${defaultBase}.json`));
  const outPng = path.resolve(readArg('out-png', `${defaultBase}.png`));
  ensureParentDir(outJson);
  ensureParentDir(outPng);

  const childArgs = [
    scriptPath,
    '--electron-child',
    `--target-type=${target.type}`,
    `--target=${target.target}`,
    `--out-json=${outJson}`,
    `--out-png=${outPng}`
  ];

  if (process.argv.includes('--show')) {
    childArgs.push('--show');
  }

  await new Promise((resolve, reject) => {
    const child = spawn(electronBinary, childArgs, {
      cwd: root,
      env: process.env,
      stdio: 'inherit',
      windowsHide: true
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Electron capture child exited with code ${code ?? 'unknown'}`));
    });
  });

  console.log(`capture json: ${outJson}`);
  console.log(`capture png: ${outPng}`);
}

function waitForWebContents(webContents, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out after ${timeoutMs}ms waiting for ranch renderer load.`));
    }, timeoutMs);
    const cleanup = () => {
      clearTimeout(timer);
      webContents.off('did-finish-load', onDone);
      webContents.off('did-fail-load', onFail);
    };
    const onDone = () => {
      cleanup();
      resolve();
    };
    const onFail = (_event, errorCode, errorDescription, validatedURL) => {
      cleanup();
      reject(new Error(`Renderer load failed ${errorCode}: ${errorDescription} (${validatedURL})`));
    };
    webContents.once('did-finish-load', onDone);
    webContents.once('did-fail-load', onFail);
  });
}

async function runElectronChild() {
  const { app, BrowserWindow } = await import('electron');

  const targetType = readArg('target-type');
  const target = readArg('target');
  const outJson = readArg('out-json');
  const outPng = readArg('out-png');
  const show = process.argv.includes('--show');
  if (!targetType || !target || !outJson || !outPng) {
    throw new Error('Missing target-type, target, out-json, or out-png.');
  }

  await app.whenReady();

  const win = new BrowserWindow({
    width: 640,
    height: 360,
    show,
    transparent: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false
    }
  });

  const loadPromise = waitForWebContents(win.webContents, 15000);
  if (targetType === 'url') {
    await win.loadURL(target);
  } else {
    await win.loadFile(target);
  }
  await loadPromise.catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, 1600));

  const evidence = await win.webContents.executeJavaScript(`(() => {
    const shell = document.querySelector('.ranch-shell');
    const field = document.querySelector('.ranch-field');
    const animals = Array.from(document.querySelectorAll('.animal'));
    const actions = Array.from(document.querySelectorAll('.ranch-action-button'));
    const rect = shell ? shell.getBoundingClientRect() : document.body.getBoundingClientRect();
    const fieldStyle = field ? getComputedStyle(field) : null;
    return {
      href: location.href,
      title: document.title,
      readyState: document.readyState,
      bodyTextSample: document.body.innerText.slice(0, 240),
      animalCount: animals.length,
      actionButtonCount: actions.length,
      hasBootCard: Boolean(document.querySelector('.ranch-boot-card')),
      hasErrorCard: Boolean(document.querySelector('.ranch-error')),
      shellClassName: shell ? shell.className : null,
      shellRect: {
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      fieldBackground: fieldStyle ? fieldStyle.backgroundColor : null,
      devicePixelRatio: window.devicePixelRatio
    };
  })()`);

  const image = await win.webContents.capturePage();
  const png = image.toPNG();
  const size = image.getSize();
  fs.writeFileSync(outPng, png);

  const result = {
    generatedAt: new Date().toISOString(),
    route: 'electron-webContents-capturePage',
    targetType,
    target,
    outPng,
    pngBytes: png.length,
    imageSize: size,
    avoidedSetIsBorderRequired: true,
    pointerInputExecuted: false,
    evidence,
    pass: png.length > 1000 && evidence.animalCount >= 1 && !evidence.hasErrorCard
  };

  fs.writeFileSync(outJson, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(result, null, 2));
  app.quit();

  if (!result.pass) {
    process.exitCode = 2;
  }
}

if (isElectronChild) {
  runElectronChild().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  runParent().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
