import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';

const bundle = await build({
  entryPoints: ['src/ranch/components/PersonalityGate.tsx'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  logLevel: 'silent'
});
const moduleShim = { exports: {} };
new Function('module', 'exports', bundle.outputFiles[0].text)(moduleShim, moduleShim.exports);
const { allowsRanchToast } = moduleShim.exports;
assert.equal(typeof allowsRanchToast, 'function');

const messageTypes = ['info', 'success', 'warning', 'error'];
const message = (type) => ({
  id: `fixture-${type}`,
  timestamp: '2026-07-14T00:00:00.000Z',
  type,
  title: type,
  content: type
});

assert.deepEqual(messageTypes.map((type) => allowsRanchToast('chatty', message(type))), [true, true, true, true]);
assert.deepEqual(messageTypes.map((type) => allowsRanchToast('quiet', message(type))), [false, true, true, true]);
assert.deepEqual(messageTypes.map((type) => allowsRanchToast('silent', message(type))), [false, false, false, false]);

const hookSource = fs.readFileSync('src/ranch/hooks/useRanchNotifications.ts', 'utf8');
const mainSource = fs.readFileSync('electron/main.ts', 'utf8');
const workspaceSource = fs.readFileSync('src/components/NiuMaWorkspace.tsx', 'utf8');

assert.match(hookSource, /currentPrefs\.notifyPrefs\.bubble\s*&&\s*allowsRanchToast/);
assert.match(hookSource, /currentPrefs\.notifyPrefs\.system\s*&&[\s\S]*latestMessage\.type === 'success'[\s\S]*latestMessage\.type === 'error'/);
assert.match(hookSource, /prefs\?\.personality === 'silent' \|\| prefs\?\.notifyPrefs\.bubble === false[\s\S]*setToasts\(\[\]\)/);
assert.match(mainSource, /!ranchPrefs\.notifyPrefs\.system \|\| !title \|\| !body[\s\S]*return false/);
assert.match(mainSource, /fs\.writeFileSync\(ranchPrefsPath, JSON\.stringify\(nextPrefs/);
assert.match(workspaceSource, /\(\['chatty', 'quiet', 'silent'\] as const\)/);
for (const preference of ['bubble', 'system', 'cockpitBadge']) {
  assert.match(workspaceSource, new RegExp(`notifyPrefs: \\{ ${preference}: !ranchPrefs\\.notifyPrefs\\.${preference} \\}`));
}

console.log('ranch personality check passed.');
console.log('chatty=4/4, quiet=3/4 critical, silent=0/4, systemDisabled=renderer+main fail-closed');
console.log('prefs=bubble,system,cockpitBadge; source=shared persisted RanchPrefs');
