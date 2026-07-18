import { execFile } from 'node:child_process';
import type {
  AgentHostDiscoverySnapshot,
  AgentHostProcessFact
} from '../src/types';

export type AgentHostProcessList = readonly string[];
export type AgentHostProcessListProvider = () => Promise<AgentHostProcessList>;

export interface AgentHostDiscoveryOptions {
  platform?: NodeJS.Platform;
  now?: () => Date;
  listProcesses?: AgentHostProcessListProvider;
}

interface SupportedAgentHost {
  agentId: string;
  connectorId: string;
  displayName: string;
  processName: string;
}

const SUPPORTED_AGENT_HOSTS: readonly SupportedAgentHost[] = Object.freeze([
  Object.freeze({
    agentId: 'workbuddy',
    connectorId: 'workbuddy',
    displayName: 'WorkBuddy',
    processName: 'WorkBuddy.exe'
  }),
  Object.freeze({
    agentId: 'kimi',
    connectorId: 'kimi',
    displayName: 'Kimi',
    processName: 'Kimi.exe'
  }),
  Object.freeze({
    agentId: 'minimax',
    connectorId: 'minimax',
    displayName: 'MiniMax Code',
    processName: 'MiniMax Code.exe'
  })
]);

export async function discoverAgentHosts(
  options: AgentHostDiscoveryOptions = {}
): Promise<AgentHostDiscoverySnapshot> {
  const observedAt = getObservedAt(options.now);
  const platform = options.platform ?? process.platform;

  if (platform !== 'win32') {
    return {
      version: 1,
      availability: 'unsupported',
      source: 'unsupported',
      observedAt,
      facts: [],
      detail: 'Agent host discovery is supported on Windows only.'
    };
  }

  try {
    const processNames = await (options.listProcesses ?? listWindowsProcessNames)();
    if (!Array.isArray(processNames)) {
      throw new Error('Process list provider returned a non-array value.');
    }

    const facts = collectAgentHostFacts(processNames, observedAt);
    return {
      version: 1,
      availability: 'available',
      source: 'windows-process-list',
      observedAt,
      facts,
      detail: `Presence-only Windows process observation found ${facts.length} recognized Agent host${facts.length === 1 ? '' : 's'}.`
    };
  } catch {
    return {
      version: 1,
      availability: 'unavailable',
      source: 'unavailable',
      observedAt,
      facts: [],
      detail: 'Agent host process observation is unavailable.'
    };
  }
}

export function collectAgentHostFacts(
  processNames: AgentHostProcessList,
  observedAt: string
): AgentHostProcessFact[] {
  const counts = new Map<string, number>();
  processNames.forEach((processName) => {
    if (typeof processName !== 'string') {
      return;
    }
    const normalized = normalizeProcessName(processName);
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  });

  return SUPPORTED_AGENT_HOSTS.flatMap((host) => {
    const processCount = counts.get(normalizeProcessName(host.processName)) ?? 0;
    if (processCount === 0) {
      return [];
    }

    return [{
      agentId: host.agentId,
      connectorId: host.connectorId,
      displayName: host.displayName,
      running: true,
      processCount,
      observedAt
    }];
  });
}

function getObservedAt(now: AgentHostDiscoveryOptions['now']) {
  const value = (now ?? (() => new Date()))();
  if (!Number.isFinite(value.getTime())) {
    return new Date(0).toISOString();
  }
  return value.toISOString();
}

function normalizeProcessName(value: string) {
  return value.trim().toLocaleLowerCase('en-US');
}

const WINDOWS_PROCESS_LIST_SCRIPT = [
  '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
  "$names = @(Get-Process -ErrorAction Stop | ForEach-Object { $_.ProcessName + '.exe' })",
  'ConvertTo-Json -Compress -InputObject $names'
].join('; ');

function listWindowsProcessNames(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', WINDOWS_PROCESS_LIST_SCRIPT],
      {
        encoding: 'utf8',
        maxBuffer: 4 * 1024 * 1024,
        windowsHide: true
      },
      (error, stdout) => {
        if (error) {
          reject(new Error('Windows process list probe failed.'));
          return;
        }
        try {
          const parsed: unknown = JSON.parse(stdout.trim() || '[]');
          if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === 'string')) {
            reject(new Error('Windows process list probe returned an invalid payload.'));
            return;
          }
          resolve(parsed);
        } catch {
          reject(new Error('Windows process list probe returned invalid JSON.'));
        }
      }
    );
  });
}
