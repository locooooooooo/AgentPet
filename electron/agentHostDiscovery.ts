import { execFile } from 'node:child_process';
import type {
  AgentHostDiscoverySnapshot,
  AgentHostLifecycleFact,
  AgentHostPrimaryAction,
  AgentHostProcessFact
} from '../src/types';

export type AgentHostProcessList = readonly string[];
export type AgentHostProcessListProvider = () => Promise<AgentHostProcessList>;

export interface AgentHostMachineProbe {
  processNames: string[];
  installedAgentIds: string[];
  serviceInstalledAgentIds: string[];
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
  lifecycleManaged?: boolean;
}

const SUPPORTED_AGENT_HOSTS: readonly SupportedAgentHost[] = Object.freeze([
  Object.freeze({
    agentId: 'trae',
    connectorId: 'trae',
    displayName: 'Trae',
    processName: 'Trae.exe',
    lifecycleManaged: true
  }),
  Object.freeze({
    agentId: 'workbuddy',
    connectorId: 'workbuddy',
    displayName: 'WorkBuddy',
    processName: 'WorkBuddy.exe',
    lifecycleManaged: true
  }),
  Object.freeze({
    agentId: 'kimi',
    connectorId: 'kimi',
    displayName: 'Kimi',
    processName: 'Kimi.exe'
  }),
  Object.freeze({
    agentId: 'qoder',
    connectorId: 'qoder',
    displayName: 'Qoder',
    processName: 'Qoder.exe',
    lifecycleManaged: true
  }),
  Object.freeze({
    agentId: 'minimax',
    connectorId: 'minimax',
    displayName: 'MiniMax Code',
    processName: 'MiniMax Code.exe',
    lifecycleManaged: true
  }),
  Object.freeze({
    agentId: 'openclaw',
    connectorId: 'openclaw',
    displayName: 'OpenClaw Gateway',
    processName: 'OpenClaw Gateway.exe',
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
    const facts = collectAgentHostFacts(probe.processNames, observedAt);
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
  observedAt: string
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
      observedAt
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
        detail: lifecycleDetail(host.agentId, installed, running, serviceInstalled)
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
      serviceInstalledAgentIds: []
    };
  }
  return normalizeMachineProbe(await probeWindowsAgentHosts());
}

function normalizeMachineProbe(value: AgentHostMachineProbe): AgentHostMachineProbe {
  if (
    !value
    || !Array.isArray(value.processNames)
    || !Array.isArray(value.installedAgentIds)
    || !Array.isArray(value.serviceInstalledAgentIds)
    || !value.processNames.every((item) => typeof item === 'string')
    || !value.installedAgentIds.every((item) => typeof item === 'string')
    || !value.serviceInstalledAgentIds.every((item) => typeof item === 'string')
  ) {
    throw new Error('Windows Agent host probe returned an invalid payload.');
  }
  return {
    processNames: [...value.processNames],
    installedAgentIds: [...new Set(value.installedAgentIds.map(normalizeAgentId).filter(Boolean))],
    serviceInstalledAgentIds: [...new Set(value.serviceInstalledAgentIds.map(normalizeAgentId).filter(Boolean))]
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

const WINDOWS_HOST_PROBE_SCRIPT = [
  '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
  "$processNames = @(Get-Process -ErrorAction Stop | ForEach-Object { $_.ProcessName + '.exe' })",
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
  "[pscustomobject]@{ processNames = $processNames; installedAgentIds = @($installed | Select-Object -Unique); serviceInstalledAgentIds = @($serviceInstalled | Select-Object -Unique) } | ConvertTo-Json -Compress -Depth 3"
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
