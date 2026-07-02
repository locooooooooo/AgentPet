import { spawn } from 'node:child_process';
import { once } from 'node:events';

const vite = spawn('npx', ['vite', '--host', '127.0.0.1'], {
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    BROWSER: 'none'
  }
});

let resolvedUrl = '';

vite.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);
  const match = text.match(/http:\/\/127\.0\.0\.1:\d+\//);
  if (match && !resolvedUrl) {
    resolvedUrl = match[0];
    startElectron(resolvedUrl);
  }
});

vite.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
});

vite.on('exit', (code) => {
  process.exit(code ?? 0);
});

async function startElectron(url) {
  const buildMain = spawn('npx', [
    'esbuild',
    'electron/main.ts',
    '--bundle',
    '--platform=node',
    '--format=cjs',
    '--packages=external',
    '--outfile=dist-electron/main.cjs'
  ], { shell: true, stdio: 'inherit' });
  await once(buildMain, 'exit');

  const buildPreload = spawn('npx', [
    'esbuild',
    'electron/preload.ts',
    '--bundle',
    '--platform=node',
    '--format=cjs',
    '--packages=external',
    '--outfile=dist-electron/preload.cjs'
  ], { shell: true, stdio: 'inherit' });
  await once(buildPreload, 'exit');

  const electron = spawn('npx', ['electron', '.'], {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: url
    }
  });

  electron.on('exit', (code) => {
    vite.kill();
    process.exit(code ?? 0);
  });
}
