import assert from 'node:assert/strict';
import fs from 'node:fs';

const hookSource = fs.readFileSync('src/ranch/hooks/useRanchNotifications.ts', 'utf8');
const mainSource = fs.readFileSync('electron/main.ts', 'utf8');
const preloadSource = fs.readFileSync('electron/preload.ts', 'utf8');

assert.match(hookSource, /const TOAST_TTL_MS = 1500/);
assert.match(hookSource, /const MAX_TOASTS = 1/);
assert.match(hookSource, /toastTimeoutIdRef = useRef<number \| null>\(null\)/);
assert.doesNotMatch(hookSource, /timeoutIdsRef/);
assert.match(hookSource, /if \(toastTimeoutIdRef\.current !== null\) \{[\s\S]*window\.clearTimeout\(toastTimeoutIdRef\.current\)/);
assert.match(hookSource, /setToasts\(\[latestMessage\]\.slice\(0, MAX_TOASTS\)\)/);
assert.match(hookSource, /toastTimeoutIdRef\.current === timeoutId[\s\S]*toastTimeoutIdRef\.current = null/);
assert.match(hookSource, /personality === 'silent' \|\| prefs\?\.notifyPrefs\.bubble === false[\s\S]*clearTimeout[\s\S]*setToasts\(\[\]\)/);
assert.match(hookSource, /notifyPrefs\.system &&[\s\S]*latestMessage\.type === 'success'[\s\S]*latestMessage\.type === 'error'/);
assert.match(hookSource, /requestSystemNotify\(\{[\s\S]*agentId: latestMessage\.agentId/);

assert.match(preloadSource, /requestSystemNotify:[\s\S]*ipcRenderer\.invoke\('ranch:request-notify', payload\)/);
assert.match(mainSource, /!ranchPrefs\.notifyPrefs\.system \|\| !title \|\| !body[\s\S]*return false/);
assert.match(mainSource, /!Notification\.isSupported\(\)[\s\S]*return false/);
assert.match(mainSource, /const icon = agentId \? resolveRanchNotifyIcon\(agentId\) : null/);
assert.match(mainSource, /new Notification\(icon[\s\S]*\? \{ title, body, icon \}[\s\S]*: \{ title, body \}\)/);
assert.match(mainSource, /notification\.show\(\)/);
assert.match(mainSource, /if \(!icon\.isEmpty\(\)\)[\s\S]*return icon[\s\S]*return null/);

const expectedIcons = {
  codex: 'codex.png',
  trae: 'trae.png',
  qoder: 'qoder.jpeg',
  minimax: 'minimax.jpeg',
  workbuddy: 'workbuddy.jpeg',
  openclaw: 'OpenClaw.jpeg',
  openccode: 'OpenCode .jpeg',
  hermes: 'hermes.jpeg'
};
for (const [agentId, fileName] of Object.entries(expectedIcons)) {
  assert.ok(fs.existsSync(`icon/${fileName}`), `${agentId} notification icon is missing: ${fileName}`);
}

console.log('ranch system notification check passed.');
console.log('agentsWithIcons=8/8, missingIconFallback=default, systemDisabled=renderer+main fail-closed');
console.log('maxToasts=1, toastTtlMs=1500, activeToastTimers=1, windowsNotificationObserved=false');
