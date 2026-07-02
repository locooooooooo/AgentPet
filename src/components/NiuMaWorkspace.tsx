import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import {
  Bell,
  Coffee,
  Eraser,
  Flame,
  PauseCircle,
  Play,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Square,
  Terminal,
  Trash2,
  Waves,
  Zap
} from 'lucide-react';
import type { AIAgent, AgentSnapshot, AgentTask, ConnectorBlockedReason, ConnectorGateResult, DesktopApi, NiuMaAction, NiuMaRuntimeState } from '../types';
import type { AgentTaskRunner } from '../types';
import { getQuickTasks, STATE_METAS } from '../lib/agentCore';
import { CONNECTOR_POLICY, ORCHESTRATION_STATUS } from '../lib/orchestrationStatus';
import NiuMaAvatar from './NiuMaAvatar';

interface NiuMaWorkspaceProps {
  api: DesktopApi;
  snapshot: AgentSnapshot;
  onSnapshot: (snapshot: AgentSnapshot) => void;
}

export default function NiuMaWorkspace({ api, snapshot, onSnapshot }: NiuMaWorkspaceProps) {
  const [selectedAgentId, setSelectedAgentId] = useState(snapshot.agents[0]?.id ?? '');
  const [connectorGateResults, setConnectorGateResults] = useState<Record<string, ConnectorGateResult>>({});
  const selectedAgent = snapshot.agents.find((agent) => agent.id === selectedAgentId) ?? snapshot.agents[0];
  const runtime = selectedAgent ? snapshot.runtime[selectedAgent.id] : undefined;
  const runningCount = snapshot.agents.reduce((total, agent) => total + agent.tasks.filter((task) => task.status === 'running').length, 0);
  const completedCount = snapshot.agents.reduce((total, agent) => total + agent.tasks.filter((task) => task.status !== 'running').length, 0);

  useEffect(() => {
    let mounted = true;

    Promise.all(
      CONNECTOR_POLICY.connectors.map(async (connector) => {
        const result = await api.evaluateConnectorGate({
          connectorId: connector.id,
          requestedBy: 'preflight',
          confirmationAccepted: false
        });
        return [connector.id, result] as const;
      })
    ).then((entries) => {
      if (mounted) {
        setConnectorGateResults(Object.fromEntries(entries));
      }
    }).catch(() => {
      if (mounted) {
        setConnectorGateResults(Object.fromEntries(
          CONNECTOR_POLICY.connectors.map((connector) => [
            connector.id,
            {
              executable: false,
              connectorId: connector.id,
              blockedReasons: ['policy-unavailable']
            } satisfies ConnectorGateResult
          ])
        ));
      }
    });

    return () => {
      mounted = false;
    };
  }, [api]);

  async function runTask(agent: AIAgent, taskName?: string, command?: string, runner: AgentTaskRunner = 'local') {
    const fallback = getQuickTasks(agent.id)[0];
    const nextSnapshot = await api.createTask({
      agentId: agent.id,
      taskName: taskName || fallback.name,
      command: command || fallback.command,
      runner
    });
    onSnapshot(nextSnapshot);
    setSelectedAgentId(agent.id);
  }

  async function applyAction(agent: AIAgent, action: NiuMaAction) {
    const nextSnapshot = await api.applyNiuMaAction(agent.id, action);
    onSnapshot(nextSnapshot);
    setSelectedAgentId(agent.id);
  }

  async function cycleState(agent: AIAgent, event: ReactMouseEvent) {
    event.stopPropagation();
    const nextSnapshot = await api.cycleNiuMaState(agent.id);
    onSnapshot(nextSnapshot);
    setSelectedAgentId(agent.id);
  }

  async function resetSeed() {
    const nextSnapshot = await api.resetSeed();
    onSnapshot(nextSnapshot);
    setSelectedAgentId(nextSnapshot.agents[0]?.id ?? '');
  }

  return (
    <div className="workspace-shell">
      <header className="app-header">
        <div>
          <div className="title-row">
            <span className="brand-mark">🐄</span>
            <h1>智能研发大厂 · 数字牛马孵化中心</h1>
            <span className="version-pill">RANCH-v2.5</span>
          </div>
          <p>把多 Agent 核心部门从导航面板拆出来，独立做成桌面控制舱。</p>
        </div>

        <div className="header-actions">
          <div className="safe-status">
            <span>loop / dispatch：</span>
            <strong>{ORCHESTRATION_STATUS.loopState} / {ORCHESTRATION_STATUS.dispatchState}</strong>
          </div>
          <button type="button" className="icon-button" onClick={resetSeed} title="重置种子数据">
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      <main className="workspace-grid">
        <section className="left-stack">
          <section className="orchestration-panel" aria-label="LPS 角色分工与监督状态">
            <div className="orchestration-head">
              <div>
                <span>{ORCHESTRATION_STATUS.identity}</span>
                <h2>角色分工与监督</h2>
              </div>
              <code>{ORCHESTRATION_STATUS.source}</code>
            </div>
            <p>{ORCHESTRATION_STATUS.target}</p>
            <div className="role-grid">
              {ORCHESTRATION_STATUS.roles.map((role) => (
                <article key={role.id} className={`role-card ${role.status}`}>
                  <div>
                    <strong>{role.title}</strong>
                    <span>{role.owner}</span>
                  </div>
                  <p>{role.responsibility}</p>
                  <code>{role.tag}</code>
                </article>
              ))}
            </div>
            <div className="lane-strip">
              {ORCHESTRATION_STATUS.lanes.map((lane) => (
                <div key={lane.id} className={`lane-chip ${lane.state}`}>
                  <span>{lane.title}</span>
                  <strong>{lane.state}</strong>
                </div>
              ))}
            </div>
            <div className="connector-policy-grid">
              {CONNECTOR_POLICY.connectors.map((connector) => (
                <article key={connector.id} className={`connector-card ${connector.status}`}>
                  <div>
                    <strong>{connector.label}</strong>
                    <span>{connector.status} · {connector.approvalStatus} · {connector.enabledByDefault ? 'enabled' : 'disabled'}</span>
                  </div>
                  <GateStatus result={connectorGateResults[connector.id]} />
                  <small>{connector.approvalEvidence || connector.acceptanceGate}</small>
                </article>
              ))}
            </div>
            <div className="supervision-note">
              <ShieldCheck size={15} />
              <span>{ORCHESTRATION_STATUS.blocker}</span>
            </div>
          </section>

          <section className="agent-board" aria-label="多 Agent 工位">
            {snapshot.agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                runtime={snapshot.runtime[agent.id]}
                selected={agent.id === selectedAgent?.id}
                onSelect={() => setSelectedAgentId(agent.id)}
                onRun={() => runTask(agent, undefined, undefined, 'simulated')}
                onAction={(action) => applyAction(agent, action)}
                onCycle={(event) => cycleState(agent, event)}
              />
            ))}
          </section>
        </section>

        {selectedAgent && runtime ? (
          <AgentDetailPanel
            api={api}
            agent={selectedAgent}
            runtime={runtime}
            snapshot={snapshot}
            onSnapshot={onSnapshot}
            onRunTask={runTask}
            onCycle={(event) => cycleState(selectedAgent, event)}
          />
        ) : null}
      </main>

      <footer className="dock">
        <div className="dock-item">
          <span>Agent</span>
          <strong>{snapshot.agents.length}</strong>
        </div>
        <div className="dock-item">
          <span>运行中</span>
          <strong>{runningCount}</strong>
        </div>
        <div className="dock-item">
          <span>已归档</span>
          <strong>{completedCount}</strong>
        </div>
        <div className="dock-item grow">
          <span>最近更新</span>
          <strong>{formatDateTime(snapshot.updatedAt)}</strong>
        </div>
      </footer>
    </div>
  );
}

function GateStatus({ result }: { result?: ConnectorGateResult }) {
  if (!result) {
    return (
      <div className="gate-status blocked">
        <span>gate pending</span>
        <small>status-only check pending</small>
      </div>
    );
  }

  if (result.executable) {
    return (
      <div className="gate-status status-only">
        <span>gate clear · status only</span>
        <small>fresh main-process gate required before any future execution intent</small>
      </div>
    );
  }

  return (
    <div className="gate-status blocked">
      <span>blocked · not executable</span>
      <ul>
        {result.blockedReasons.map((reason) => (
          <li key={reason}>{formatBlockedReason(reason)}</li>
        ))}
      </ul>
    </div>
  );
}

interface AgentCardProps {
  agent: AIAgent;
  runtime: NiuMaRuntimeState;
  selected: boolean;
  onSelect: () => void;
  onRun: () => void;
  onAction: (action: NiuMaAction) => void;
  onCycle: (event: ReactMouseEvent) => void;
}

function AgentCard({ agent, runtime, selected, onSelect, onRun, onAction, onCycle }: AgentCardProps) {
  const meta = STATE_METAS[runtime.status];
  const running = agent.tasks.filter((task) => task.status === 'running').length;

  return (
    <article
      className={`agent-card ${selected ? 'is-selected' : ''}`}
      style={{ '--agent-accent': agent.accent } as React.CSSProperties}
    >
      <button type="button" className="agent-card-hit" onClick={onSelect}>
        <div className="agent-card-top">
          <div>
            <span className="slot-label">[{agent.slot}]</span>
            <strong>{agent.name}</strong>
          </div>
          <span className="agent-codename">{agent.codename}</span>
        </div>

        <NiuMaAvatar
          agent={agent}
          runtime={runtime}
          selected={selected}
          onClick={onCycle}
        />

        <div className="expression-line">{meta.expression}</div>
      </button>

      <div className="metric-stack">
        <Meter label="体力能量值" value={runtime.energy} tone={runtime.energy < 30 ? 'danger' : 'ok'} />
        <Meter label="CPU 温度" value={Math.round(runtime.temperature)} suffix="°C" tone={runtime.temperature > 80 ? 'danger' : 'info'} max={120} />
      </div>

      <div className="card-actions">
        <button type="button" title="画饼加班" onClick={() => onAction('pie')}>
          <Flame size={15} />
        </button>
        <button type="button" title="给杯咖啡" onClick={() => onAction('coffee')}>
          <Coffee size={15} />
        </button>
        <button type="button" title="强制开工" onClick={() => onAction('whip')}>
          <Zap size={15} />
        </button>
        <button type="button" title="批准摸鱼" onClick={() => onAction('slack')}>
          <Waves size={15} />
        </button>
        <button type="button" title="启动任务" onClick={onRun}>
          {running > 0 ? <PauseCircle size={15} /> : <Play size={15} />}
        </button>
      </div>
    </article>
  );
}

interface AgentDetailPanelProps {
  api: DesktopApi;
  agent: AIAgent;
  runtime: NiuMaRuntimeState;
  snapshot: AgentSnapshot;
  onSnapshot: (snapshot: AgentSnapshot) => void;
  onRunTask: (agent: AIAgent, taskName?: string, command?: string, runner?: AgentTaskRunner) => Promise<void>;
  onCycle: (event: ReactMouseEvent) => void;
}

function AgentDetailPanel({ api, agent, runtime, snapshot, onSnapshot, onRunTask, onCycle }: AgentDetailPanelProps) {
  const [taskName, setTaskName] = useState('');
  const [command, setCommand] = useState('');
  const [runner, setRunner] = useState<AgentTaskRunner>('local');
  const [openTaskId, setOpenTaskId] = useState<string | null>(agent.tasks[0]?.id ?? null);
  const meta = STATE_METAS[runtime.status];
  const quickTasks = useMemo(() => getQuickTasks(agent.id), [agent.id]);
  const openTask = agent.tasks.find((task) => task.id === openTaskId) ?? agent.tasks[0];
  const recentMessage = snapshot.messages[0];

  async function submitTask(event: React.FormEvent) {
    event.preventDefault();
    await onRunTask(agent, taskName.trim() || undefined, command.trim() || undefined, runner);
    setTaskName('');
    setCommand('');
  }

  async function stop(task: AgentTask) {
    const nextSnapshot = await api.stopTask(agent.id, task.id);
    onSnapshot(nextSnapshot);
  }

  async function clearDone() {
    const nextSnapshot = await api.clearCompletedTasks(agent.id);
    onSnapshot(nextSnapshot);
  }

  return (
    <aside className="detail-panel">
      <div className="detail-identity">
        <NiuMaAvatar
          agent={agent}
          runtime={runtime}
          selected
          compact
          showBubble
          onClick={onCycle}
        />
        <div>
          <div className="detail-name">
            <h2>{agent.name}</h2>
            <span>{meta.name}</span>
          </div>
          <p>{agent.description}</p>
        </div>
      </div>

      <div className="quote-box">
        <Bell size={16} />
        <span>{runtime.quote}</span>
      </div>

      <div className="detail-metrics">
        <Metric label="模型" value={agent.modelName} />
        <Metric label="端点" value={agent.endpoint} mono />
        <Metric label="压力" value={`${runtime.stress}%`} />
        <Metric label="任务数" value={`${agent.tasks.length}`} />
      </div>

      <section className="command-area">
        <div className="section-heading">
          <h3>下发新任务</h3>
          <div className="runner-switch" aria-label="选择 runner 模式">
            <button
              type="button"
              className={runner === 'local' ? 'is-active' : ''}
              onClick={() => setRunner('local')}
            >
              本地命令
            </button>
            <button
              type="button"
              className={runner === 'simulated' ? 'is-active' : ''}
              onClick={() => setRunner('simulated')}
            >
              模拟推进
            </button>
          </div>
        </div>
        <div className="quick-grid">
          {quickTasks.map((task) => (
            <button
              key={`${task.name}-${task.command}`}
              type="button"
              onClick={() => {
                setTaskName(task.name);
                setCommand(task.command);
              }}
            >
              <span>{task.name}</span>
              <code>{task.command}</code>
            </button>
          ))}
        </div>
        <form className="task-form" onSubmit={submitTask}>
          <input
            value={taskName}
            onChange={(event) => setTaskName(event.target.value)}
            placeholder="任务名称，例如：检查桌面 IPC 边界"
          />
          <input
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="命令模板，例如：agent run --mode simulated"
          />
          <button type="submit">
            <Play size={15} />
            立即下发
          </button>
        </form>
      </section>

      <section className="task-area">
        <div className="section-heading">
          <h3>任务队列</h3>
          <button type="button" onClick={clearDone}>
            <Trash2 size={14} />
            清理完成项
          </button>
        </div>

        <div className="task-list">
          {agent.tasks.length === 0 ? (
            <div className="empty-task">
              <Eraser size={18} />
              <span>队列为空，先给这头牛马派个活。</span>
            </div>
          ) : (
            agent.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                selected={task.id === openTask?.id}
                onOpen={() => setOpenTaskId(task.id)}
                onStop={() => stop(task)}
              />
            ))
          )}
        </div>
      </section>

      <section className="terminal-panel">
        <div className="terminal-title">
          <span>
            <Terminal size={14} />
            进程流式日志
          </span>
          {openTask ? <code>{openTask.id}</code> : null}
        </div>
        {openTask ? (
          <div className="terminal-body">
            {openTask.logs.map((line, index) => (
              <p key={`${openTask.id}-${index}`}>{line}</p>
            ))}
            {openTask.status === 'running' ? <p className="terminal-cursor">等待管道持续写出...</p> : null}
          </div>
        ) : (
          <div className="terminal-body muted">暂无任务日志。</div>
        )}
      </section>

      {recentMessage ? (
        <div className={`system-toast ${recentMessage.type}`}>
          <RefreshCcw size={14} />
          <span>{recentMessage.title}：{recentMessage.content}</span>
        </div>
      ) : null}
    </aside>
  );
}

interface TaskRowProps {
  task: AgentTask;
  selected: boolean;
  onOpen: () => void;
  onStop: () => void;
}

function TaskRow({ task, selected, onOpen, onStop }: TaskRowProps) {
  return (
    <div className={`task-row ${selected ? 'is-selected' : ''}`}>
      <button type="button" onClick={onOpen}>
        <span>{task.name}</span>
        <code>{task.command}</code>
        <small>{task.runner === 'local' ? 'local runner' : 'simulated runner'}</small>
        <div className="task-progress">
          <i style={{ width: `${task.progress}%` }} />
        </div>
      </button>
      <div className="task-row-side">
        <span className={`task-status ${task.status}`}>{task.status}</span>
        {task.status === 'running' ? (
          <button type="button" onClick={onStop} title="停止任务">
            <Square size={13} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

interface MeterProps {
  label: string;
  value: number;
  suffix?: string;
  max?: number;
  tone: 'ok' | 'danger' | 'info';
}

function Meter({ label, value, suffix = '%', max = 100, tone }: MeterProps) {
  return (
    <div className="meter">
      <div>
        <span>{label}</span>
        <strong className={tone}>{value}{suffix}</strong>
      </div>
      <i>
        <b className={tone} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </i>
    </div>
  );
}

function Metric({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={mono ? 'mono' : ''}>{value}</strong>
    </div>
  );
}

function formatBlockedReason(reason: ConnectorBlockedReason) {
  const labels: Record<ConnectorBlockedReason, string> = {
    'policy-unavailable': 'policy unavailable',
    'connector-not-found': 'connector not found',
    'status-not-ready': 'status not ready',
    'approval-not-accepted': 'approval not accepted',
    'disabled-by-default': 'disabled by default',
    'command-missing': 'command missing',
    'command-not-discovered': 'command not discovered',
    'cwd-policy-invalid': 'cwd policy invalid',
    'env-not-allowlisted': 'env not allowlisted',
    'timeout-invalid': 'timeout invalid',
    'dangerous-command': 'dangerous command',
    'confirmation-required': 'confirmation required',
    'runner-unsupported': 'runner unsupported'
  };
  return labels[reason];
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('zh-CN', { hour12: false });
}
