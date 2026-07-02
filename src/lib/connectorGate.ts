import type {
  ConnectorBlockedReason,
  ConnectorConfig,
  ConnectorGateInput,
  ConnectorGateRequest,
  ConnectorGateResult,
  ConnectorPolicyConfig,
  ConnectorPolicyDefaults
} from '../types';

export const MAX_CONNECTOR_TIMEOUT_SECONDS = 7200;

const SUPPORTED_CWD_POLICIES = new Set(['workspace-root', 'explicit-path']);
const SUPPORTED_CONFIRMATIONS = new Set(['none', 'required', 'required-for-write']);
const SUPPORTED_RUNNERS = new Set(['local-command']);

interface ConnectorPolicyGateEvaluation {
  result: ConnectorGateResult;
  discoveryAttempted: boolean;
}

export function evaluateConnectorPolicyGate(
  policy: ConnectorPolicyConfig,
  request: ConnectorGateRequest,
  discoverCommand: (command: string) => boolean
): ConnectorPolicyGateEvaluation {
  const connector = policy.connectors.find((item) => item.id === request.connectorId);
  if (!connector) {
    return {
      result: {
        executable: false,
        connectorId: request.connectorId,
        blockedReasons: ['connector-not-found']
      },
      discoveryAttempted: false
    };
  }

  const staticReasons = collectStaticBlockedReasons({
    connector,
    defaults: policy.defaults,
    confirmationAccepted: request.confirmationAccepted
  });
  const shouldDiscover = staticReasons.length === 0 && connector.command.trim() !== '';
  const discovered = shouldDiscover ? discoverCommand(connector.command) : false;

  return {
    result: evaluateConnectorGate({
      connector,
      defaults: policy.defaults,
      discovered,
      discoveryChecked: shouldDiscover,
      requestedBy: request.requestedBy,
      confirmationAccepted: request.confirmationAccepted
    }),
    discoveryAttempted: shouldDiscover
  };
}

export function evaluateConnectorGate(input: ConnectorGateInput): ConnectorGateResult {
  const blockedReasons = collectStaticBlockedReasons(input);
  const command = input.connector.command.trim();

  if (command && input.discoveryChecked && !input.discovered) {
    blockedReasons.push('command-not-discovered');
  }

  if (blockedReasons.length > 0) {
    return {
      executable: false,
      connectorId: input.connector.id,
      blockedReasons: uniqueReasons(blockedReasons)
    };
  }

  return {
    executable: true,
    connectorId: input.connector.id,
    command,
    args: input.connector.args,
    cwdPolicy: input.connector.cwdPolicy,
    envAllowlist: input.connector.envAllowlist,
    timeoutSeconds: input.connector.timeoutSeconds
  };
}

export function createConnectorProcessEnv(
  sourceEnv: NodeJS.ProcessEnv,
  envAllowlist: string[]
): Record<string, string> {
  return Object.fromEntries(
    envAllowlist
      .filter((key) => typeof key === 'string' && key.trim() !== '')
      .map((key) => [key, sourceEnv[key]])
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );
}

function collectStaticBlockedReasons(input: {
  connector: ConnectorConfig;
  defaults: ConnectorPolicyDefaults;
  confirmationAccepted?: boolean;
}): ConnectorBlockedReason[] {
  const { connector, defaults } = input;
  const blockedReasons: ConnectorBlockedReason[] = [];
  const command = connector.command.trim();

  if (!SUPPORTED_RUNNERS.has(connector.runner)) {
    blockedReasons.push('runner-unsupported');
  }

  if (connector.status !== 'ready') {
    blockedReasons.push('status-not-ready');
  }

  if (connector.approvalStatus !== 'accepted') {
    blockedReasons.push('approval-not-accepted');
  }

  if (!connector.enabledByDefault) {
    blockedReasons.push('disabled-by-default');
  }

  if (!command) {
    blockedReasons.push('command-missing');
  }

  if (!SUPPORTED_CWD_POLICIES.has(connector.cwdPolicy)) {
    blockedReasons.push('cwd-policy-invalid');
  }

  if (!Array.isArray(connector.envAllowlist) || connector.envAllowlist.length === 0) {
    blockedReasons.push('env-not-allowlisted');
  }

  if (!Number.isFinite(connector.timeoutSeconds) || connector.timeoutSeconds <= 0 || connector.timeoutSeconds > MAX_CONNECTOR_TIMEOUT_SECONDS) {
    blockedReasons.push('timeout-invalid');
  }

  if (command && matchesDangerousCommand(command, connector.args, defaults.dangerousCommandPatterns)) {
    blockedReasons.push('dangerous-command');
  }

  if (!SUPPORTED_CONFIRMATIONS.has(connector.confirmation)) {
    blockedReasons.push('confirmation-required');
  }

  if (connector.confirmation !== 'none' && !input.confirmationAccepted) {
    blockedReasons.push('confirmation-required');
  }

  return uniqueReasons(blockedReasons);
}

function matchesDangerousCommand(command: string, args: string[], patterns: string[]) {
  const commandLine = [command, ...args].join(' ').toLowerCase();
  return patterns.some((pattern) => pattern.trim() !== '' && commandLine.includes(pattern.toLowerCase()));
}

function uniqueReasons(reasons: ConnectorBlockedReason[]) {
  return [...new Set(reasons)];
}
