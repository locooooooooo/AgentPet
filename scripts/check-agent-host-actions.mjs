import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const modulePath = path.resolve('electron/agentHostActions.ts');
const outputPath = path.resolve('.tmp-agent-host-actions-check.mjs');

await build({
  entryPoints: [modulePath],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: outputPath,
  logLevel: 'silent'
});

try {
  const { performAgentHostAction } = await import(`${pathToFileURL(outputPath).href}?t=${Date.now()}`);
  const blocked = await performAgentHostAction(
    { agentId: 'qoder', action: 'focus' },
    {
      agentId: 'qoder',
      connectorId: 'qoder',
      displayName: 'Qoder',
      installed: true,
      running: false,
      processCount: 0,
      state: 'stopped',
      primaryAction: 'launch',
      observedAt: '2026-07-18T08:00:00.000Z',
      detail: 'fixture'
    }
  );
  assert.equal(blocked.status, 'blocked', 'A stale or mismatched action must fail closed');
} finally {
  fs.rmSync(outputPath, { force: true });
}

const source = fs.readFileSync(modulePath, 'utf8');
const preloadSource = fs.readFileSync(path.resolve('electron/preload.ts'), 'utf8');
const mainSource = fs.readFileSync(path.resolve('electron/main.ts'), 'utf8');

assert.match(source, /AlibabaCloud\.Qoder/);
assert.match(source, /com\.minimax\.agent\.cn/);
assert.match(source, /ByteDance\.Trae/);
assert.match(source, /WorkBuddy\.WorkBuddy/);
assert.match(source, /npm\.cmd install --global openclaw@latest && openclaw onboard --install-daemon/);
assert.match(source, /openclaw\.cmd'[\s\S]*\['gateway', command, '--json'\]/);
assert.doesNotMatch(source, /--accept-risk|--non-interactive/, 'Hub must not silently accept OpenClaw risk terms');
assert.doesNotMatch(source, /shell\s*:\s*true/, 'Host actions must not enable shell interpolation');
assert.match(preloadSource, /agents:manage-host/);
assert.match(mainSource, /action !== 'install' && action !== 'launch' && action !== 'focus'/);
assert.match(mainSource, /request\.action !== lifecycle\.primaryAction|performAgentHostAction/);

console.log('agent host action safety check passed.');
console.log('fixed Trae/WorkBuddy/Qoder/MiniMax launch targets and fixed OpenClaw install/start commands: verified');
console.log('stale action fail-closed and no silent OpenClaw risk acceptance: verified');
