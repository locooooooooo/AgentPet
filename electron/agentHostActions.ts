import { execFile, spawn } from 'node:child_process';
import type {
  AgentHostActionRequest,
  AgentHostActionResult,
  AgentHostLifecycleFact
} from '../src/types';

const APP_LAUNCH_TARGETS: Readonly<Record<string, string>> = Object.freeze({
  trae: 'shell:AppsFolder\\ByteDance.Trae',
  workbuddy: 'shell:AppsFolder\\WorkBuddy.WorkBuddy',
  qoder: 'shell:AppsFolder\\AlibabaCloud.Qoder',
  minimax: 'shell:AppsFolder\\com.minimax.agent.cn'
});

const OPENCLAW_INSTALL_COMMAND = 'npm.cmd install --global openclaw@latest && openclaw onboard --install-daemon';
const OPENCLAW_ONBOARD_COMMAND = 'openclaw onboard --install-daemon';

export async function performAgentHostAction(
  request: AgentHostActionRequest,
  lifecycle: AgentHostLifecycleFact
): Promise<AgentHostActionResult> {
  if (request.agentId !== lifecycle.agentId || request.action !== lifecycle.primaryAction) {
    return result(request, 'blocked', '宿主状态已变化，请刷新后重试。');
  }

  try {
    if (request.agentId === 'openclaw') {
      return performOpenClawAction(request, lifecycle);
    }

    const launchTarget = APP_LAUNCH_TARGETS[request.agentId];
    if (!launchTarget || (request.action !== 'launch' && request.action !== 'focus')) {
      return result(request, 'blocked', '该 Agent 暂无可用的本机动作。');
    }
    launchWindowsApp(launchTarget);
    return result(
      request,
      'completed',
      request.action === 'focus' ? `正在聚焦 ${lifecycle.displayName}。` : `正在打开 ${lifecycle.displayName}。`
    );
  } catch (error) {
    return result(request, 'failed', safeActionError(error));
  }
}

function performOpenClawAction(
  request: AgentHostActionRequest,
  lifecycle: AgentHostLifecycleFact
): Promise<AgentHostActionResult> | AgentHostActionResult {
  if (request.action === 'install') {
    const command = lifecycle.installed ? OPENCLAW_ONBOARD_COMMAND : OPENCLAW_INSTALL_COMMAND;
    launchVisibleCommand(command);
    return result(
      request,
      'started',
      lifecycle.installed
        ? '已打开 OpenClaw 官方初始化向导，请完成风险确认与认证配置。'
        : '已开始安装 OpenClaw，安装完成后会进入官方初始化向导。'
    );
  }

  if (request.action === 'launch' && lifecycle.installed && lifecycle.serviceInstalled) {
    return runOpenClawServiceCommand(request, 'start');
  }

  return result(request, 'blocked', '当前 OpenClaw 状态不支持该动作。');
}

function launchWindowsApp(target: string) {
  const child = spawn('explorer.exe', [target], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  child.unref();
}

function launchVisibleCommand(command: string) {
  const child = spawn('cmd.exe', ['/d', '/s', '/k', command], {
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  });
  child.unref();
}

function runOpenClawServiceCommand(
  request: AgentHostActionRequest,
  command: 'start'
): Promise<AgentHostActionResult> {
  return new Promise((resolve) => {
    execFile(
      'openclaw.cmd',
      ['gateway', command, '--json'],
      { encoding: 'utf8', timeout: 30_000, windowsHide: true },
      (error) => {
        resolve(error
          ? result(request, 'failed', 'OpenClaw Gateway 启动失败，请运行初始化向导检查配置。')
          : result(request, 'completed', 'OpenClaw Gateway 启动命令已完成。'));
      }
    );
  });
}

function result(
  request: AgentHostActionRequest,
  status: AgentHostActionResult['status'],
  message: string
): AgentHostActionResult {
  return {
    status,
    agentId: request.agentId,
    action: request.action,
    message
  };
}

function safeActionError(error: unknown) {
  if (error instanceof Error && /ENOENT/i.test(error.message)) {
    return '本机启动入口不可用，请重新检测安装状态。';
  }
  return '本机 Agent 动作执行失败，请稍后重试。';
}
