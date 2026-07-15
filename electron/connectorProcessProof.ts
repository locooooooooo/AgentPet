import { spawn, type ChildProcess, type SpawnOptions } from 'node:child_process';
import type {
  ConnectorObservedProcessEvidence,
  ConnectorProcessProofRequest,
  ConnectorProcessProofResult,
  ConnectorProcessProofStatus
} from '../src/lib/connectorRuntime';

const MAX_PROOF_OUTPUT_BYTES = 1_100_000;
const PROOF_FRESHNESS_MS = 5_000;

interface ActiveProofWorker {
  generation: number;
  child?: ChildProcess;
  cancel: (reason: string) => void;
}

export interface ConnectorProcessProofService {
  prove: (request: ConnectorProcessProofRequest) => Promise<ConnectorProcessProofResult>;
  dispose: () => Promise<void>;
  activeWorkerCount: () => number;
}

export interface ConnectorProcessProofServiceOptions {
  spawnProcess?: (file: string, args: string[], options: SpawnOptions) => ChildProcess;
}

export function createConnectorProcessProofService(
  options: ConnectorProcessProofServiceOptions = {}
): ConnectorProcessProofService {
  const activeByTask = new Map<string, ActiveProofWorker>();
  const workers = new Set<ChildProcess>();
  let disposed = false;
  const spawnProcess = options.spawnProcess ?? ((file, args, spawnOptions) => spawn(file, args, spawnOptions));

  const prove = (request: ConnectorProcessProofRequest): Promise<ConnectorProcessProofResult> => {
    if (disposed) {
      return Promise.resolve(createResult(request, 'unavailable', 'process-proof-service-disposed'));
    }
    if (!Number.isInteger(request.pid) || request.pid <= 0 || request.signal.aborted) {
      return Promise.resolve(createResult(request, 'cancelled', 'process-proof-request-cancelled'));
    }
    const proofKey = `${request.taskId}\u0000${request.sessionId}`;
    const prior = activeByTask.get(proofKey);
    if (prior) {
      if (prior.generation >= request.generation) {
        return Promise.resolve(createResult(request, 'cancelled', 'process-proof-generation-not-newer'));
      }
      prior.cancel('process-proof-superseded');
    }

    return new Promise((resolve) => {
      let settled = false;
      let timedOut = false;
      let stdout = '';
      let stderr = '';
      let forcedSettleTimer: NodeJS.Timeout | undefined;
      const script = "$ErrorActionPreference = 'Stop'; "
        + `$p = Get-CimInstance Win32_Process -Filter \"ProcessId = ${request.pid}\" | Select-Object -First 1; `
        + 'if ($null -eq $p) { exit 3 }; '
        + '[ordered]@{ '
        + 'pid = [int]$p.ProcessId; '
        + 'executablePath = [string]$p.ExecutablePath; '
        + "startedAt = $p.CreationDate.ToUniversalTime().ToString('o'); "
        + 'commandLine = [string]$p.CommandLine '
        + '} | ConvertTo-Json -Compress';

      const finish = (
        status: ConnectorProcessProofStatus,
        reason: string,
        evidence?: ConnectorObservedProcessEvidence
      ) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutTimer);
        if (forcedSettleTimer) {
          clearTimeout(forcedSettleTimer);
        }
        request.signal.removeEventListener('abort', onAbort);
        if (activeByTask.get(proofKey) === active) {
          activeByTask.delete(proofKey);
        }
        resolve(createResult(request, status, reason, evidence));
      };

      const stopWorker = (reason: string, status: ConnectorProcessProofStatus) => {
        if (settled) {
          return;
        }
        if (status === 'timeout') {
          timedOut = true;
        }
        const child = active.child;
        if (!child) {
          finish(status, reason);
          return;
        }
        try {
          child.kill();
        } catch {
          // The close/error handlers still settle the fail-closed result.
        }
        forcedSettleTimer = setTimeout(() => finish(status, reason), 250);
        forcedSettleTimer.unref();
      };

      const active: ActiveProofWorker = {
        generation: request.generation,
        cancel: (reason) => stopWorker(reason, 'cancelled')
      };
      activeByTask.set(proofKey, active);
      const onAbort = () => stopWorker('process-proof-request-cancelled', 'cancelled');
      request.signal.addEventListener('abort', onAbort, { once: true });
      const timeoutTimer = setTimeout(
        () => stopWorker('process-proof-worker-timeout', 'timeout'),
        Math.max(1, request.timeoutMs)
      );
      timeoutTimer.unref();

      let child: ChildProcess;
      try {
        child = spawnProcess('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
          shell: false,
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe']
        });
      } catch (error) {
        finish('unavailable', `process-proof-worker-unavailable:${formatError(error)}`);
        return;
      }
      active.child = child;
      workers.add(child);
      child.stdout?.on('data', (chunk) => {
        if (Buffer.byteLength(stdout) < MAX_PROOF_OUTPUT_BYTES) {
          stdout += String(chunk);
        }
      });
      child.stderr?.on('data', (chunk) => {
        if (Buffer.byteLength(stderr) < MAX_PROOF_OUTPUT_BYTES) {
          stderr += String(chunk);
        }
      });
      child.once('error', (error) => {
        workers.delete(child);
        finish(
          isUnavailableError(error) ? 'unavailable' : 'crashed',
          `process-proof-worker-error:${formatError(error)}`
        );
      });
      child.once('close', (code, signal) => {
        workers.delete(child);
        if (settled) {
          return;
        }
        if (timedOut) {
          finish('timeout', 'process-proof-worker-timeout');
          return;
        }
        if (request.signal.aborted || activeByTask.get(proofKey) !== active) {
          finish('cancelled', 'process-proof-result-late-or-superseded');
          return;
        }
        if (code === 3) {
          finish('missing', 'process-not-found');
          return;
        }
        if (code !== 0) {
          finish('crashed', `process-proof-worker-exit:${code ?? 'null'}:${signal ?? 'none'}:${stderr.trim()}`);
          return;
        }
        const evidence = parseWindowsProcessEvidence(stdout);
        if (!evidence) {
          finish('crashed', 'process-proof-worker-invalid-output');
          return;
        }
        finish('proven', 'process-identity-proven', evidence);
      });
    });
  };

  return {
    prove,
    dispose: async () => {
      disposed = true;
      const closingWorkers = [...workers].map((worker) => new Promise<void>((resolve) => {
        if (worker.exitCode !== null || worker.signalCode !== null) {
          resolve();
          return;
        }
        const settle = () => resolve();
        worker.once('close', settle);
        setTimeout(settle, 1_000).unref();
      }));
      [...activeByTask.values()].forEach((active) => active.cancel('process-proof-service-disposed'));
      activeByTask.clear();
      workers.forEach((worker) => {
        try {
          worker.kill();
        } catch {
          // The worker has already exited.
        }
      });
      await Promise.all(closingWorkers);
    },
    activeWorkerCount: () => workers.size
  };
}

function createResult(
  request: ConnectorProcessProofRequest,
  status: ConnectorProcessProofStatus,
  reason: string,
  evidence?: ConnectorObservedProcessEvidence
): ConnectorProcessProofResult {
  const observedAt = new Date().toISOString();
  return {
    generation: request.generation,
    status,
    observedAt,
    expiresAt: new Date(Date.parse(observedAt) + PROOF_FRESHNESS_MS).toISOString(),
    ...(evidence ? { evidence } : {}),
    reason
  };
}

function parseWindowsProcessEvidence(value: string): ConnectorObservedProcessEvidence | undefined {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return typeof parsed.pid === 'number'
      && typeof parsed.executablePath === 'string'
      && typeof parsed.startedAt === 'string'
      && typeof parsed.commandLine === 'string'
      ? {
          pid: parsed.pid,
          executablePath: parsed.executablePath,
          startedAt: parsed.startedAt,
          commandLine: parsed.commandLine,
          evidenceSource: 'windows-cim'
        }
      : undefined;
  } catch {
    return undefined;
  }
}

function isUnavailableError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
