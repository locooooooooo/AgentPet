import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const themePath = path.resolve('docs/牛马Hub-HubTheme合同-v0.1.md');
const soundPath = path.resolve('docs/牛马Hub-HubSoundPack合同-v0.1.md');
const themeSource = fs.readFileSync(themePath, 'utf8');
const soundSource = fs.readFileSync(soundPath, 'utf8');

const themeValid = extractExample(themeSource, 'theme-valid');
const themeInvalidRemote = extractExample(themeSource, 'theme-invalid-remote');
const themeInvalidPrivilege = extractExample(themeSource, 'theme-invalid-privilege');
const soundValid = extractExample(soundSource, 'sound-valid');
const soundInvalidPolicy = extractExample(soundSource, 'sound-invalid-policy');
const soundInvalidPath = extractExample(soundSource, 'sound-invalid-path');

assert.deepEqual(validateTheme(themeValid), [], 'The documented HubTheme valid example must pass the frozen contract checks');
assert.ok(validateTheme(themeInvalidRemote).length >= 3, 'Remote/script/bad-digest HubTheme example must fail closed');
assert.ok(validateTheme(themeInvalidPrivilege).length >= 2, 'Traversal/Connector HubTheme example must fail closed');
assert.deepEqual(validateSoundPack(soundValid), [], 'The documented HubSoundPack valid example must pass the frozen contract checks');
assert.ok(validateSoundPack(soundInvalidPolicy).length >= 3, 'Remote/global-policy HubSoundPack example must fail closed');
assert.ok(validateSoundPack(soundInvalidPath).length >= 4, 'Traversal/missing-fallback/unsafe-audio HubSoundPack example must fail closed');

for (const [name, source, ids] of [
  ['HubTheme', themeSource, Array.from({ length: 12 }, (_, index) => `HT-${String(index + 1).padStart(2, '0')}`)],
  ['HubSoundPack', soundSource, Array.from({ length: 15 }, (_, index) => `HS-${String(index + 1).padStart(2, '0')}`)]
]) {
  assert.doesNotMatch(source, /\bTODO\b|待补|placeholder/i, `${name} contract cannot contain unfinished placeholders`);
  assert.match(source, /schema version：`1`/);
  assert.match(source, /未知.*version.*reject|未知.*schema.*reject/i);
  assert.match(source, /last-known-good|LKG/);
  assert.match(source, /Preview/i);
  ids.forEach((id) => assert.match(source, new RegExp(`\\| ${id.replace('-', '\\-')} \\|`), `${name} must include ${id}`));
}

console.log('Hub content contract check passed.');
console.log('HubTheme valid example and two fail-closed invalid examples: verified');
console.log('HubSoundPack valid example and two fail-closed invalid examples: verified');
console.log('versioning, preview, rollback and complete negative matrices: verified');

function extractExample(source, id) {
  const fence = '`'.repeat(3);
  const pattern = new RegExp(`<!-- contract-example:${escapeRegExp(id)} -->\\s*${fence}json\\s*([\\s\\S]*?)\\s*${fence}`);
  const match = source.match(pattern);
  assert.ok(match, `Missing JSON example ${id}`);
  return JSON.parse(match[1]);
}

function validateTheme(value) {
  const errors = validateCommon(value, {
    schema: 'niuma.hub-theme',
    idField: 'themeId',
    forbiddenKeys: ['script', 'command', 'args', 'env', 'url', 'remote', 'connector', 'permission', 'enabledByDefault', 'task', 'session', 'online']
  });
  if (!Array.isArray(value.modes) || value.modes.length < 1 || value.modes.length > 4) {
    errors.push('modes');
  } else {
    const modeIds = new Set();
    value.modes.forEach((mode) => {
      if (!isRecord(mode) || !/^[a-z0-9][a-z0-9.-]{0,31}$/.test(mode.modeId ?? '') || modeIds.has(mode.modeId)) {
        errors.push('mode-id');
      }
      modeIds.add(mode.modeId);
      if (!['dark', 'light', 'high-contrast'].includes(mode.colorScheme)) errors.push('color-scheme');
      if (!['compact', 'comfortable'].includes(mode.density)) errors.push('density');
      if (!['system', 'reduced', 'standard'].includes(mode.motion)) errors.push('motion');
      validateThemeTokens(mode.tokens, errors);
      if (mode.background !== null && mode.background !== undefined && !isSafeRelativePath(mode.background?.asset)) {
        errors.push('background-path');
      }
    });
  }
  validateAssets(value, errors, {
    mime: new Set(['image/png', 'image/webp', 'image/avif']),
    role: new Set(['background', 'texture', 'ranch-environment', 'agent-decoration']),
    maxBytes: 8 * 1024 * 1024
  });
  return unique(errors);
}

function validateSoundPack(value) {
  const errors = validateCommon(value, {
    schema: 'niuma.hub-sound-pack',
    idField: 'packId',
    forbiddenKeys: ['globalMute', 'quietHours', 'priority', 'rateLimit', 'aggregation', 'eventId', 'dedupe', 'volumeOverride', 'script', 'command', 'args', 'env', 'url', 'connector', 'task', 'session', 'enabledByDefault']
  });
  const requiredEvents = ['accepted', 'success', 'attention', 'failure', 'stopped', 'recovered'];
  if (!isRecord(value.eventSounds) || Object.keys(value.eventSounds).sort().join('|') !== [...requiredEvents].sort().join('|')) {
    errors.push('event-sounds');
  }
  requiredEvents.forEach((event) => {
    if (!isSafeRelativePath(value.eventSounds?.[event])) errors.push('event-path');
  });
  if (!isRecord(value.identityTails) || !isSafeRelativePath(value.identityTails.default)) {
    errors.push('identity-fallback');
  }
  validateAssets(value, errors, {
    mime: new Set(['audio/wav', 'audio/ogg', 'audio/mpeg']),
    role: new Set(['event-head', 'identity-tail']),
    maxBytes: 2 * 1024 * 1024,
    sound: true
  });
  const assetsByPath = new Map((Array.isArray(value.assets) ? value.assets : []).map((asset) => [asset.path, asset]));
  requiredEvents.forEach((event) => {
    if (assetsByPath.get(value.eventSounds?.[event])?.role !== 'event-head') errors.push('event-role');
  });
  Object.values(isRecord(value.identityTails) ? value.identityTails : {}).forEach((assetPath) => {
    if (assetsByPath.get(assetPath)?.role !== 'identity-tail') errors.push('tail-role');
  });
  return unique(errors);
}

function validateCommon(value, options) {
  const errors = [];
  if (!isRecord(value) || value.schema !== options.schema || value.schemaVersion !== 1) errors.push('schema');
  if (!/^[a-z0-9][a-z0-9.-]{2,63}$/.test(value?.[options.idField] ?? '')) errors.push('id');
  if (typeof value?.displayName !== 'string' || value.displayName.length < 1 || value.displayName.length > 64) errors.push('display-name');
  if (!isSemver(value?.version)) errors.push('version');
  if (!isRecord(value?.author) || typeof value.author.name !== 'string') errors.push('author');
  if (value?.author?.homepage !== null && value?.author?.homepage !== undefined && !/^https:\/\//.test(value.author.homepage)) errors.push('homepage');
  if (!isRecord(value?.compatibility) || !isSemver(value.compatibility.minHubVersion) || !Array.isArray(value.compatibility.schemaVersions) || value.compatibility.schemaVersions.length !== 1 || value.compatibility.schemaVersions[0] !== 1) errors.push('compatibility');
  if (!isRecord(value?.license) || typeof value.license.spdx !== 'string' || typeof value.license.notice !== 'string' || !isRecord(value.license.assetSources)) errors.push('license');
  if (!isRecord(value?.integrity) || value.integrity.algorithm !== 'sha256' || !isSha256(value.integrity.manifestSha256) || !isRecord(value.integrity.files)) errors.push('integrity');
  collectForbiddenKeys(value, new Set(options.forbiddenKeys), errors);
  return errors;
}

function validateAssets(value, errors, options) {
  if (!Array.isArray(value.assets)) {
    errors.push('assets');
    return;
  }
  const paths = new Set();
  value.assets.forEach((asset) => {
    if (!isRecord(asset) || !isSafeRelativePath(asset.path) || paths.has(asset.path)) errors.push('asset-path');
    paths.add(asset.path);
    if (!options.mime.has(asset.mime)) errors.push('asset-mime');
    if (!options.role.has(asset.role)) errors.push('asset-role');
    if (!Number.isInteger(asset.bytes) || asset.bytes <= 0 || asset.bytes > options.maxBytes) errors.push('asset-bytes');
    if (!isSha256(asset.sha256)) errors.push('asset-sha');
    if (value.integrity?.files?.[asset.path] !== asset.sha256) errors.push('file-integrity');
    if (!value.license?.assetSources?.[asset.path]) errors.push('asset-license');
    if (options.sound) {
      const maxDuration = asset.role === 'identity-tail' ? 160 : 850;
      if (!Number.isInteger(asset.durationMs) || asset.durationMs <= 0 || asset.durationMs > maxDuration) errors.push('duration');
      if (![22050, 44100, 48000].includes(asset.sampleRate)) errors.push('sample-rate');
      if (![1, 2].includes(asset.channels)) errors.push('channels');
      if (typeof asset.integratedLufs !== 'number' || asset.integratedLufs < -30 || asset.integratedLufs > -12) errors.push('loudness');
      if (typeof asset.truePeakDb !== 'number' || asset.truePeakDb > -1) errors.push('peak');
    }
  });
  const integrityPaths = Object.keys(isRecord(value.integrity?.files) ? value.integrity.files : {});
  if (integrityPaths.length !== paths.size || integrityPaths.some((assetPath) => !paths.has(assetPath))) errors.push('file-set');
}

function validateThemeTokens(tokens, errors) {
  if (!isRecord(tokens)) {
    errors.push('tokens');
    return;
  }
  const colorKeys = new Set(['canvas', 'surface', 'surfaceElevated', 'text', 'textMuted', 'border', 'accent', 'success', 'warning', 'danger', 'info']);
  const numberRules = { panelRadius: [0, 8], controlRadius: [0, 8], borderWidth: [1, 2], spaceScale: [0.8, 1.2] };
  Object.entries(tokens).forEach(([key, token]) => {
    if (colorKeys.has(key)) {
      if (typeof token !== 'string' || !/^#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?$/.test(token)) errors.push('color-token');
      return;
    }
    if (key in numberRules) {
      const [min, max] = numberRules[key];
      if (typeof token !== 'number' || token < min || token > max) errors.push('number-token');
      return;
    }
    errors.push('unknown-token');
  });
  if (!('canvas' in tokens) || !('text' in tokens)) errors.push('required-token');
}

function collectForbiddenKeys(value, forbidden, errors) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectForbiddenKeys(item, forbidden, errors));
    return;
  }
  if (!isRecord(value)) return;
  Object.entries(value).forEach(([key, child]) => {
    if (forbidden.has(key)) errors.push(`forbidden:${key}`);
    collectForbiddenKeys(child, forbidden, errors);
  });
}

function isSafeRelativePath(value) {
  return typeof value === 'string'
    && value.length > 0
    && !value.includes('\\')
    && !value.includes('\0')
    && !value.includes('://')
    && !value.startsWith('/')
    && !/^[A-Za-z]:/.test(value)
    && value.split('/').every((part) => part && part !== '.' && part !== '..');
}

function isSemver(value) {
  return typeof value === 'string' && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.test(value);
}

function isSha256(value) {
  return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function unique(values) {
  return [...new Set(values)];
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
