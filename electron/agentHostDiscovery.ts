import { execFile } from 'node:child_process';
import type {
  AgentHostDiscoverySnapshot,
  AgentHostLifecycleFact,
  AgentHostPrimaryAction,
  AgentHostProcessFact,
  AgentHostVersionEvidence,
  AgentHostVersionSource
} from '../src/types';

export type AgentHostProcessList = readonly string[];
export type AgentHostProcessListProvider = () => Promise<AgentHostProcessList>;

export interface AgentHostMachineProbe {
  processNames: string[];
  installedAgentIds: string[];
  serviceInstalledAgentIds: string[];
  versionRecords?: AgentHostVersionRecord[];
}

export interface AgentHostVersionRecord {
  agentId: string;
  version: string;
  identity: string;
  source: Extract<AgentHostVersionSource, 'windows-process-file-version' | 'windows-uninstall-registry'>;
}

export interface AgentHostDiscoveryOptions {
  platform?: NodeJS.Platform;
  now?: () => Date;
  listProcesses?: AgentHostProcessListProvider;
  probeMachine?: () => Promise<AgentHostMachineProbe>;
}

interface SupportedAgentHost {
  agentId: string;
  connectorId: string;
  displayName: string;
  processName: string;
  versionIdentityAliases: readonly string[];
  lifecycleManaged?: boolean;
}

const SUPPORTED_AGENT_HOSTS: readonly SupportedAgentHost[] = Object.freeze([
  Object.freeze({
    agentId: 'trae',
    connectorId: 'trae',
    displayName: 'Trae',
    processName: 'Trae.exe',
    versionIdentityAliases: ['Trae'],
    lifecycleManaged: true
  }),
  Object.freeze({
    agentId: 'workbuddy',
    connectorId: 'workbuddy',
    displayName: 'WorkBuddy',
    processName: 'WorkBuddy.exe',
    versionIdentityAliases: ['WorkBuddy'],
    lifecycleManaged: true
  }),
  Object.freeze({
    agentId: 'kimi',
    connectorId: 'kimi',
    displayName: 'Kimi',
    processName: 'Kimi.exe',
    versionIdentityAliases: ['Kimi', 'Kimi Desktop']
  }),
  Object.freeze({
    agentId: 'qoder',
    connectorId: 'qoder',
    displayName: 'Qoder',
    processName: 'Qoder.exe',
    versionIdentityAliases: ['Qoder'],
    lifecycleManaged: true
  }),
  Object.freeze({
    agentId: 'minimax',
    connectorId: 'minimax',
    displayName: 'MiniMax Code',
    processName: 'MiniMax Code.exe',
    versionIdentityAliases: ['MiniMax', 'MiniMax Agent', 'MiniMax Code'],
    lifecycleManaged: true
  }),
  Object.freeze({
    agentId: 'openclaw',
    connectorId: 'openclaw',
    displayName: 'OpenClaw Gateway',
    processName: 'OpenClaw Gateway.exe',
    versionIdentityAliases: ['OpenClaw', 'OpenClaw Gateway'],
    lifecycleManaged: true
  })
]);

export async function discoverAgentHosts(
  options: AgentHostDiscoveryOptions = {}
): Promise<AgentHostDiscoverySnapshot> {
  const observedAt = getObservedAt(options.now);
  const platform = options.platform ?? process.platform;

  if (platform !== 'win32') {
    return emptySnapshot('unsupported', 'unsupported', observedAt, 'Agent host discovery is supported on Windows only.');
  }

  try {
    const probe = await getMachineProbe(options);
    const facts = collectAgentHostFacts(probe.processNames, observedAt, probe.versionRecords);
    const lifecycle = collectAgentHostLifecycleFacts(probe, observedAt);
    return {
      version: 1,
      availability: 'available',
      source: 'windows-process-list',
      observedAt,
      facts,
      lifecycle,
      detail: `Windows host observation found ${facts.length} running Agent application${facts.length === 1 ? '' : 's'} and ${lifecycle.filter((item) => item.installed).length} managed installation${lifecycle.filter((item) => item.installed).length === 1 ? '' : 's'}.`
    };
  } catch {
    return emptySnapshot('unavailable', 'unavailable', observedAt, 'Agent host observation is unavailable.');
  }
}

export function collectAgentHostFacts(
  processNames: AgentHostProcessList,
  observedAt: string,
  versionRecords: readonly AgentHostVersionRecord[] = []
): AgentHostProcessFact[] {
  const counts = countProcessNames(processNames);
  return SUPPORTED_AGENT_HOSTS.flatMap((host) => {
    const processCount = counts.get(normalizeProcessName(host.processName)) ?? 0;
    return processCount === 0 ? [] : [{
      agentId: host.agentId,
      connectorId: host.connectorId,
      displayName: host.displayName,
      running: true as const,
      processCount,
      observedAt,
      version: resolveAgentHostVersion(host, versionRecords, observedAt)
    }];
  });
}

export function collectAgentHostLifecycleFacts(
  probe: AgentHostMachineProbe,
  observedAt: string
): AgentHostLifecycleFact[] {
  const counts = countProcessNames(probe.processNames);
  const installedAgentIds = new Set(probe.installedAgentIds.map(normalizeAgentId));
  const serviceInstalledAgentIds = new Set(probe.serviceInstalledAgentIds.map(normalizeAgentId));
  const versionRecords = probe.versionRecords ?? [];

  return SUPPORTED_AGENT_HOSTS
    .filter((host) => host.lifecycleManaged)
    .map((host) => {
      const processCount = counts.get(normalizeProcessName(host.processName)) ?? 0;
      const running = processCount > 0;
      const installed = running || installedAgentIds.has(host.agentId);
      const serviceInstalled = host.agentId === 'openclaw'
        ? serviceInstalledAgentIds.has(host.agentId)
        : undefined;
      const state = !installed ? 'not-installed' as const : (running ? 'idle' as const : 'stopped' as const);
      const primaryAction = selectPrimaryAction(host.agentId, installed, running, serviceInstalled);
      const version = resolveAgentHostVersion(host, versionRecords, observedAt);
      return {
        agentId: host.agentId,
        connectorId: host.connectorId,
        displayName: host.displayName,
        installed,
        ...(serviceInstalled === undefined ? {} : { serviceInstalled }),
        running,
        processCount,
        state,
        ...(primaryAction ? { primaryAction } : {}),
        observedAt,
        detail: lifecycleDetail(host.agentId, installed, running, serviceInstalled),
        version
      };
    });
}

function selectPrimaryAction(
  agentId: string,
  installed: boolean,
  running: boolean,
  serviceInstalled: boolean | undefined
): AgentHostPrimaryAction | undefined {
  if (agentId === 'openclaw') {
    if (!installed || !serviceInstalled) {
      return 'install';
    }
    return running ? undefined : 'launch';
  }
  if (!installed) {
    return undefined;
  }
  return running ? 'focus' : 'launch';
}

function lifecycleDetail(
  agentId: string,
  installed: boolean,
  running: boolean,
  serviceInstalled: boolean | undefined
) {
  if (!installed) {
    return 'Application is not installed.';
  }
  if (agentId === 'openclaw' && !serviceInstalled) {
    return 'OpenClaw CLI is installed; Gateway service setup is required.';
  }
  if (!running) {
    return 'Application is installed but not running.';
  }
  return 'Application is running with no observed Hub task.';
}

function countProcessNames(processNames: AgentHostProcessList) {
  const counts = new Map<string, number>();
  processNames.forEach((processName) => {
    if (typeof processName !== 'string') {
      return;
    }
    const normalized = normalizeProcessName(processName);
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  });
  return counts;
}

async function getMachineProbe(options: AgentHostDiscoveryOptions): Promise<AgentHostMachineProbe> {
  if (options.probeMachine) {
    return normalizeMachineProbe(await options.probeMachine());
  }
  if (options.listProcesses) {
    return {
      processNames: [...await options.listProcesses()],
      installedAgentIds: [],
      serviceInstalledAgentIds: [],
      versionRecords: []
    };
  }
  return normalizeMachineProbe(await probeWindowsAgentHosts());
}

function normalizeMachineProbe(value: AgentHostMachineProbe): AgentHostMachineProbe {
  const versionRecords = value?.versionRecords ?? [];
  if (
    !value
    || !Array.isArray(value.processNames)
    || !Array.isArray(value.installedAgentIds)
    || !Array.isArray(value.serviceInstalledAgentIds)
    || !Array.isArray(versionRecords)
    || !value.processNames.every((item) => typeof item === 'string')
    || !value.installedAgentIds.every((item) => typeof item === 'string')
    || !value.serviceInstalledAgentIds.every((item) => typeof item === 'string')
    || !versionRecords.every(isVersionRecord)
  ) {
    throw new Error('Windows Agent host probe returned an invalid payload.');
  }
  return {
    processNames: [...value.processNames],
    installedAgentIds: [...new Set(value.installedAgentIds.map(normalizeAgentId).filter(Boolean))],
    serviceInstalledAgentIds: [...new Set(value.serviceInstalledAgentIds.map(normalizeAgentId).filter(Boolean))],
    versionRecords: versionRecords.map((record) => ({
      agentId: normalizeAgentId(record.agentId),
      version: record.version.trim(),
      identity: record.identity.trim(),
      source: record.source
    }))
  };
}

function emptySnapshot(
  availability: AgentHostDiscoverySnapshot['availability'],
  source: AgentHostDiscoverySnapshot['source'],
  observedAt: string,
  detail: string
): AgentHostDiscoverySnapshot {
  return {
    version: 1,
    availability,
    source,
    observedAt,
    facts: [],
    lifecycle: [],
    detail
  };
}

function getObservedAt(now: AgentHostDiscoveryOptions['now']) {
  const value = (now ?? (() => new Date()))();
  return Number.isFinite(value.getTime()) ? value.toISOString() : new Date(0).toISOString();
}

function normalizeProcessName(value: string) {
  return value.trim().toLocaleLowerCase('en-US');
}

function normalizeAgentId(value: string) {
  return value.trim().toLocaleLowerCase('en-US');
}

function resolveAgentHostVersion(
  host: SupportedAgentHost,
  records: readonly AgentHostVersionRecord[],
  observedAt: string
): AgentHostVersionEvidence {
  const candidates = records.filter((record) => normalizeAgentId(record.agentId) === host.agentId);
  if (candidates.length === 0) {
    return { value: null, source: 'not-observed', status: 'unknown', observedAt };
  }
  const identities = new Set(host.versionIdentityAliases.map(normalizeIdentity));
  const identityMatches = candidates.filter((record) => identities.has(normalizeIdentity(record.identity)));
  if (identityMatches.length === 0) {
    return { value: null, source: 'identity-mismatch', status: 'unknown', observedAt };
  }
  const validCandidates = identityMatches.filter((record) => isVersionValue(record.version));
  const versions = [...new Set(validCandidates.map((record) => record.version.trim()))];
  if (versions.length !== 1) {
    return {
      value: null,
      source: versions.length > 1 ? 'conflict' : 'not-observed',
      status: versions.length > 1 ? 'conflict' : 'unknown',
      observedAt
    };
  }
  const preferred = validCandidates.find((record) => record.source === 'windows-process-file-version')
    ?? validCandidates[0];
  return {
    value: versions[0],
    source: preferred.source,
    status: 'verified',
    observedAt
  };
}

function isVersionRecord(value: unknown): value is AgentHostVersionRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.agentId === 'string'
    && typeof record.version === 'string'
    && typeof record.identity === 'string'
    && (record.source === 'windows-process-file-version' || record.source === 'windows-uninstall-registry');
}

function isVersionValue(value: string) {
  return /^\d+(?:\.\d+){1,3}(?:[-+][0-9A-Za-z.-]+)?$/.test(value.trim());
}

function normalizeIdentity(value: string) {
  return value.trim().toLocaleLowerCase('en-US');
}

const WINDOWS_HOST_PROBE_SCRIPT = [
  '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
  '$processes = @(Get-Process -ErrorAction Stop)',
  "$processNames = @($processes | ForEach-Object { $_.ProcessName + '.exe' })",
  '$versionRecords = @()',
  "$processVersionTargets = @{ 'Trae' = @('trae', 'Trae'); 'WorkBuddy' = @('workbuddy', 'WorkBuddy'); 'Kimi' = @('kimi', 'Kimi'); 'Qoder' = @('qoder', 'Qoder'); 'MiniMax Code' = @('minimax', 'MiniMax Code') }",
  "$processVersionTargets.GetEnumerator() | ForEach-Object { $target = $_; $processes | Where-Object { $_.ProcessName -eq $target.Key } | ForEach-Object { try { $info = $_.MainModule.FileVersionInfo; if ($info.FileVersion -and $info.ProductName) { $versionRecords += [pscustomobject]@{ agentId = $target.Value[0]; version = $info.FileVersion; identity = $info.ProductName; source = 'windows-process-file-version' } } } catch {} } }",
  "$registryVersionTargets = @{ 'Trae' = 'trae'; 'WorkBuddy' = 'workbuddy'; 'Kimi' = 'kimi'; 'Qoder' = 'qoder'; 'MiniMax Code' = 'minimax'; 'OpenClaw' = 'openclaw' }",
  "$uninstallRoots = @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*', 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*', 'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*')",
  "$uninstallRoots | ForEach-Object { Get-ItemProperty -Path $_ -ErrorAction SilentlyContinue | Where-Object { $_.DisplayVersion -and $registryVersionTargets.ContainsKey([string]$_.DisplayName) } | ForEach-Object { $versionRecords += [pscustomobject]@{ agentId = $registryVersionTargets[[string]$_.DisplayName]; version = [string]$_.DisplayVersion; identity = [string]$_.DisplayName; source = 'windows-uninstall-registry' } } }",
  "$gatewayProcesses = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { ($_.Name -eq 'node.exe' -or $_.Name -eq 'openclaw.exe') -and $_.CommandLine -match '(?i)(openclaw\\.mjs|openclaw\\.cmd).*gateway(?:\\s+run)?' })",
  "$gatewayProcesses | ForEach-Object { $processNames += 'OpenClaw Gateway.exe' }",
  '$installed = @()',
  "$startApps = @(Get-StartApps -ErrorAction SilentlyContinue)",
  "if ($startApps | Where-Object { $_.AppID -eq 'ByteDance.Trae' -or $_.Name -eq 'Trae' }) { $installed += 'trae' }",
  "if ($startApps | Where-Object { $_.AppID -eq 'WorkBuddy.WorkBuddy' -or $_.Name -eq 'WorkBuddy' }) { $installed += 'workbuddy' }",
  "if ($startApps | Where-Object { $_.AppID -eq 'AlibabaCloud.Qoder' -or $_.Name -eq 'Qoder' }) { $installed += 'qoder' }",
  "if ($startApps | Where-Object { $_.AppID -eq 'com.minimax.agent.cn' -or $_.Name -like 'MiniMax*' }) { $installed += 'minimax' }",
  "if (Get-Command openclaw.cmd -ErrorAction SilentlyContinue) { $installed += 'openclaw' }",
  "$serviceInstalled = @()",
  "if (Get-ScheduledTask -TaskName 'OpenClaw Gateway' -ErrorAction SilentlyContinue) { $serviceInstalled += 'openclaw' }",
  "$startupGateway = Join-Path $env:APPDATA 'Microsoft\\Windows\\Start Menu\\Programs\\Startup\\OpenClaw Gateway.cmd'",
  "if (Test-Path -LiteralPath $startupGateway) { $serviceInstalled += 'openclaw' }",
  "[pscustomobject]@{ processNames = $processNames; installedAgentIds = @($installed | Select-Object -Unique); serviceInstalledAgentIds = @($serviceInstalled | Select-Object -Unique); versionRecords = @($versionRecords) } | ConvertTo-Json -Compress -Depth 4"
].join('; ');

function probeWindowsAgentHosts(): Promise<AgentHostMachineProbe> {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', WINDOWS_HOST_PROBE_SCRIPT],
      {
        encoding: 'utf8',
        maxBuffer: 4 * 1024 * 1024,
        timeout: 4_000,
        windowsHide: true
      },
      (error, stdout) => {
        if (error) {
          reject(new Error('Windows Agent host probe failed.'));
          return;
        }
        try {
          resolve(JSON.parse(stdout.trim()));
        } catch {
          reject(new Error('Windows Agent host probe returned invalid JSON.'));
        }
      }
    );
  });
}
