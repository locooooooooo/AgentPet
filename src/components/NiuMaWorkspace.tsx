import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import {
  Activity,
  Bell,
  ChevronUp,
  Coffee,
  Eraser,
  Flame,
  PauseCircle,
  Play,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Square,
  Terminal,
  Trash2,
  Waves,
  Workflow,
  X,
  Zap
} from 'lucide-react';
import type {
  AIAgent,
  AgentSnapshot,
  AgentTask,
  AgentTaskRunner,
  ConnectorGateResult,
  DesktopApi,
  NiuMaAction,
  NiuMaRuntimeState,
  RanchPrefs,
  RanchPrefsPatch
} from '../types';
import { getQuickTasks, STATE_METAS } from '../lib/agentCore';
import { CONNECTOR_POLICY, ORCHESTRATION_STATUS } from '../lib/orchestrationStatus';
import NiuMaAvatar from './NiuMaAvatar';
import StatusStrip from './StatusStrip';

interface NiuMaWorkspaceProps {
  api: DesktopApi;
  snapshot: AgentSnapshot;
  onSnapshot: (snapshot: AgentSnapshot) => void;
}

type SummaryTone = 'neutral' | 'positive' | 'info' | 'warning' | 'danger';
type DetailTabId = 'command' | 'queue' | 'logs';

const ACTIVE_COCKPIT_TASK_CARD_ID = 'c0-5';

const detailTabs: Array<{ id: DetailTabId; label: string }> = [
  { id: 'command', label: '下发任务' },
  { id: 'queue', label: '任务队列' },
  { id: 'logs', label: '流式日志' }
];

const cockpitTaskCards = [
  {
    id: 'c0-1',
    step: 'C0-1',
    title: 'v3.0 收口定稿',
    status: 'done',
    detail: '收束并行方案，固定 P0 实施规格。'
  },
  {
    id: 'c0-2',
    step: 'C0-2',
    title: '视觉权重分级',
    status: 'done',
    detail: '已完成：1 张主卡高亮，4 张副卡灰显。'
  },
  {
    id: 'c0-3',
    step: 'C0-3',
    title: 'StatusStrip',
    status: 'done',
    detail: '已完成：顶部单行承载 connector、task 计数与最近事件。'
  },
  {
    id: 'c0-4',
    step: 'C0-4',
    title: '右侧 Tab 化',
    status: 'done',
    detail: '已完成：下发任务、任务队列、流式日志分层切换。'
  },
  {
    id: 'c0-5',
    step: 'C0-5',
    title: '中央浮窗处置',
    status: 'active',
    detail: '按 B 路径挪到右下角小三角。'
  }
] as const;

export default function NiuMaWorkspace({ api, snapshot, onSnapshot }: NiuMaWorkspaceProps) {
  const [selectedAgentId, setSelectedAgentId] = useState(snapshot.agents[0]?.id ?? '');
  const [connectorGateResults, setConnectorGateResults] = useState<Record<string, ConnectorGateResult>>({});
  const [ranchPrefs, setRanchPrefs] = useState<RanchPrefs | null>(null);
  const [ranchSettingsOpen, setRanchSettingsOpen] = useState(false);
  const [cornerPanelOpen, setCornerPanelOpen] = useState(false);

  const selectedAgent = snapshot.agents.find((agent) => agent.id === selectedAgentId) ?? snapshot.agents[0];
  const runtime = selectedAgent ? snapshot.runtime[selectedAgent.id] : undefined;
  const selectedTask = selectedAgent?.tasks.find((task) => task.status === 'running') ?? selectedAgent?.tasks[0];
  const selectedMeta = runtime ? STATE_METAS[runtime.status] : null;

  const runningCount = snapshot.agents.reduce(
    (total, agent) => total + agent.tasks.filter((task) => task.status === 'running').length,
    0
  );
  const completedCount = snapshot.agents.reduce(
    (total, agent) => total + agent.tasks.filter((task) => task.status !== 'running').length,
    0
  );
  const activeLaneCount = ORCHESTRATION_STATUS.lanes.filter((lane) => lane.state === 'active').length;
  const blockedLaneCount = ORCHESTRATION_STATUS.lanes.filter((lane) => lane.state === 'blocked').length;
  const standbyLaneCount = ORCHESTRATION_STATUS.lanes.filter((lane) => lane.state === 'standby').length;
  const acceptedConnectorCount = CONNECTOR_POLICY.connectors.filter((connector) => connector.approvalStatus === 'accepted').length;
  const gatePendingCount = CONNECTOR_POLICY.connectors.filter((connector) => connectorGateResults[connector.id] === undefined).length;
  const gateBlockedCount = CONNECTOR_POLICY.connectors.filter((connector) => {
    const result = connectorGateResults[connector.id];
    return result ? !result.executable : false;
  }).length;
  const latestMessage = snapshot.messages[0];

  useEffect(() => {
    // Connector gate display is status-only, not executable; do not add run/start actions here.
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

  useEffect(() => {
    let mounted = true;

    api.ranch.getPrefs()
      .then((nextPrefs) => {
        if (mounted) {
          setRanchPrefs(nextPrefs);
        }
      })
      .catch(() => {
        if (mounted) {
          setRanchPrefs(null);
        }
      });

    const unsubscribe = api.ranch.onPrefsChanged((nextPrefs) => {
      setRanchPrefs(nextPrefs);
    });

    return () => {
      mounted = false;
      unsubscribe();
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

  async function patchRanchPrefs(patch: RanchPrefsPatch) {
    const nextPrefs = await api.ranch.setPrefs(patch);
    setRanchPrefs(nextPrefs);
  }

  const gateHeadline =
    gatePendingCount > 0
      ? `${gatePendingCount} pending`
      : gateBlockedCount > 0
        ? `${gateBlockedCount} blocked`
        : 'clear';

  return (
    <div className="workspace-shell">
      <header className="app-header cockpit-header">
        <div className="header-brand">
          <div className="title-row">
            <span className="brand-mark">🐄</span>
            <h1>桌面牧场 · 控制舱</h1>
            <span className="version-pill">OPS-RANCH v2.6</span>
          </div>
          <p>深色高对比控制台，左轨追踪调度真源，中央调度主工作区，右轨保留真实可操作的任务面板。</p>

          <div className="header-kpis">
            <SummaryTile
              label="正在拉磨"
              value={`${runningCount}`}
              detail={`${snapshot.agents.length} 头牛马在线`}
              tone="positive"
            />
            <SummaryTile
              label="活跃 Lanes"
              value={`${activeLaneCount}`}
              detail={`${blockedLaneCount} 阻塞 / ${standbyLaneCount} 待命`}
              tone={blockedLaneCount > 0 ? 'warning' : 'info'}
            />
            <SummaryTile
              label="状态管道 Gate"
              value={gateHeadline}
              detail={`${acceptedConnectorCount} 已打通 / ${CONNECTOR_POLICY.connectors.length} 总数`}
              tone={gateBlockedCount > 0 ? 'danger' : gatePendingCount > 0 ? 'warning' : 'positive'}
            />
          </div>
        </div>

        <div className="header-actions">
          <StatusStrip
            connectors={CONNECTOR_POLICY.connectors}
            gateResults={connectorGateResults}
            runningTaskCount={runningCount}
            totalTaskCount={runningCount + completedCount}
            lastEvent={latestMessage}
          />

          <div style={ranchSettingsAnchorStyle}>
            <button
              type="button"
              className="safe-status"
              style={getRanchSettingsTriggerStyle(ranchSettingsOpen)}
              onClick={() => setRanchSettingsOpen((open) => !open)}
              aria-expanded={ranchSettingsOpen}
              aria-haspopup="dialog"
            >
              <SlidersHorizontal size={14} />
              <span>桌面牧场设置</span>
            </button>
            {ranchSettingsOpen ? (
              <div style={ranchSettingsPanelStyle} role="dialog" aria-label="桌面牧场设置">
                {ranchPrefs ? (
                  <>
                    <RanchSettingsGroup label="模式">
                      <div className="runner-switch" style={ranchSettingsChipsStyle}>
                        <RanchSettingsChip
                          label="desktop"
                          active={ranchPrefs.mode === 'desktop'}
                          onClick={() => void patchRanchPrefs({ mode: 'desktop' })}
                        />
                        <RanchSettingsChip
                          label="floating"
                          active={ranchPrefs.mode === 'floating'}
                          onClick={() => void patchRanchPrefs({ mode: 'floating' })}
                        />
                      </div>
                    </RanchSettingsGroup>

                    <RanchSettingsGroup label="性格档">
                      <div className="runner-switch" style={ranchSettingsChipsStyle}>
                        {(['chatty', 'quiet', 'silent'] as const).map((personality) => (
                          <RanchSettingsChip
                            key={personality}
                            label={personality}
                            active={ranchPrefs.personality === personality}
                            onClick={() => void patchRanchPrefs({ personality })}
                          />
                        ))}
                      </div>
                    </RanchSettingsGroup>

                    <RanchSettingsGroup label="通知偏好">
                      <div className="runner-switch" style={ranchSettingsChipsStyle}>
                        <RanchSettingsChip
                          label="气泡"
                          active={ranchPrefs.notifyPrefs.bubble}
                          onClick={() => void patchRanchPrefs({
                            notifyPrefs: { bubble: !ranchPrefs.notifyPrefs.bubble }
                          })}
                        />
                        <RanchSettingsChip
                          label="系统"
                          active={ranchPrefs.notifyPrefs.system}
                          onClick={() => void patchRanchPrefs({
                            notifyPrefs: { system: !ranchPrefs.notifyPrefs.system }
                          })}
                        />
                        <RanchSettingsChip
                          label="红点"
                          active={ranchPrefs.notifyPrefs.cockpitBadge}
                          onClick={() => void patchRanchPrefs({
                            notifyPrefs: { cockpitBadge: !ranchPrefs.notifyPrefs.cockpitBadge }
                          })}
                        />
                      </div>
                    </RanchSettingsGroup>
                  </>
                ) : (
                  <p style={ranchSettingsHintStyle}>正在读取桌面牧场偏好...</p>
                )}
              </div>
            ) : null}
          </div>

          <button type="button" className="icon-button" onClick={resetSeed} title="重置种子数据">
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      <main className="workspace-grid cockpit-grid">
        <aside className="left-rail">
          <section className="cockpit-panel rail-summary-panel" aria-label="调度总览">
            <PanelHeading
              kicker="Dispatch State"
              title="调度总览"
              meta={ORCHESTRATION_STATUS.identity}
            />

            <div className="dispatch-grid">
              <SummaryTile
                label="监督身份"
                value={ORCHESTRATION_STATUS.loopState}
                detail={ORCHESTRATION_STATUS.identity}
                tone={getToneForState(ORCHESTRATION_STATUS.loopState)}
              />
              <SummaryTile
                label="派工状态"
                value={ORCHESTRATION_STATUS.dispatchState}
                detail={ORCHESTRATION_STATUS.source}
                tone={getToneForState(ORCHESTRATION_STATUS.dispatchState)}
              />
              <SummaryTile
                label="今日阻塞"
                value={`${blockedLaneCount}`}
                detail="需要 PM/用户 决策"
                tone={blockedLaneCount > 0 ? 'danger' : 'neutral'}
              />
              <SummaryTile
                label="最新消息"
                value={latestMessage ? latestMessage.type : 'idle'}
                detail={latestMessage ? latestMessage.title : '暂无系统消息'}
                tone={latestMessage ? getToneForMessage(latestMessage.type) : 'neutral'}
              />
            </div>

            <div className="supervision-note emphasis">
              <ShieldAlert size={15} />
              <span>{ORCHESTRATION_STATUS.blocker}</span>
            </div>
          </section>

          <section className="cockpit-panel orchestration-panel" aria-label="LPS 角色与 lanes">
            <PanelHeading
              kicker={ORCHESTRATION_STATUS.source}
              title="角色分工与监督"
              meta={`${ORCHESTRATION_STATUS.roles.length} 角色 / ${ORCHESTRATION_STATUS.lanes.length} Lanes`}
            />
            <p>{ORCHESTRATION_STATUS.target}</p>

            <div className="orchestration-task-cards" aria-label="P0 task cards">
              {cockpitTaskCards.map((card) => {
                const active = card.id === ACTIVE_COCKPIT_TASK_CARD_ID;

                return (
                  <article
                    key={card.id}
                    className={`orchestration-task-card ${active ? 'task-card-active' : 'task-card-dimmed'}`}
                    aria-current={active ? 'step' : undefined}
                  >
                    <div className="orchestration-task-card-top">
                      <span>{card.step}</span>
                      <strong>{card.status}</strong>
                    </div>
                    <h3>{card.title}</h3>
                    <p>{card.detail}</p>
                  </article>
                );
              })}
            </div>

            <div className="orchestration-columns">
              <div className="rail-group">
                <div className="rail-group-head">
                  <Workflow size={14} />
                  <span>角色工位</span>
                </div>
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
              </div>

              <div className="rail-group">
                <div className="rail-group-head">
                  <Activity size={14} />
                  <span>推进 Lanes</span>
                </div>
                <div className="lane-strip lane-stack">
                  {ORCHESTRATION_STATUS.lanes.map((lane) => (
                    <div key={lane.id} className={`lane-chip ${lane.state}`}>
                      <div className="lane-copy">
                        <span>{lane.title}</span>
                        <small>{lane.nextAction}</small>
                      </div>
                      <strong>{lane.state}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

        </aside>

        <section className="center-stage">
          <section className="cockpit-panel board-panel" aria-label="多 Agent 工位矩阵">
            <div className="board-panel-head">
              <PanelHeading
                kicker="Workstations"
                title="牛马工位矩阵"
                meta={selectedAgent ? `${selectedAgent.name} 聚焦中` : '未选中牛马'}
              />
              <div className="board-meta">
                <span>{runningCount} 头正在拉磨</span>
                <span>{completedCount} 个历史功绩</span>
              </div>
            </div>

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
        </section>

        {selectedAgent && runtime ? (
          <AgentDetailPanel
            key={selectedAgent.id}
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

      {selectedAgent && runtime && selectedMeta ? (
        <section
          className={`corner-assist ${cornerPanelOpen ? 'is-open' : ''}`}
          style={{ '--agent-accent': selectedAgent.accent } as CSSProperties}
          aria-label="右下角牛马速览"
        >
          <button
            type="button"
            className="corner-assist-trigger"
            aria-expanded={cornerPanelOpen}
            aria-controls="corner-assist-panel"
            title="展开牛马速览"
            onClick={() => setCornerPanelOpen((open) => !open)}
          >
            <span className="corner-assist-triangle" aria-hidden="true" />
            <ChevronUp size={15} aria-hidden="true" />
          </button>

          <div id="corner-assist-panel" className="corner-assist-panel" role="region" aria-label="牛马速览浮层">
            <div className="corner-assist-head">
              <div>
                <span>{selectedAgent.slot}</span>
                <h2>{selectedAgent.name}</h2>
              </div>
              <button
                type="button"
                className="corner-assist-close"
                aria-label="收起牛马速览"
                onClick={() => setCornerPanelOpen(false)}
              >
                <X size={13} />
              </button>
            </div>

            <div className="corner-assist-body">
              <NiuMaAvatar
                agent={selectedAgent}
                runtime={runtime}
                selected
                compact
                onClick={(event) => cycleState(selectedAgent, event)}
              />

              <div className="corner-assist-copy">
                <span className={`corner-status ${runtime.status}`}>{selectedMeta.name}</span>
                <strong>{selectedMeta.expression}</strong>
                <p>{runtime.quote}</p>
              </div>
            </div>

            <div className="corner-assist-task">
              <span>{selectedTask?.name ?? '工位空闲'}</span>
              <small>{selectedTask?.command ?? '等待派活'}</small>
            </div>

            <div className="corner-assist-metrics">
              <span>{runtime.stress}% stress</span>
              <span>{runtime.energy}% energy</span>
              <span>{Math.round(runtime.temperature)}°C</span>
            </div>
          </div>
        </section>
      ) : null}

      <footer className="dock cockpit-dock">
        <div className="dock-item">
          <span>在线牛马</span>
          <strong>{snapshot.agents.length} 头</strong>
        </div>
        <div className="dock-item">
          <span>正在拉磨</span>
          <strong>{runningCount} 头</strong>
        </div>
        <div className="dock-item">
          <span>历史功绩</span>
          <strong>{completedCount} 个</strong>
        </div>
        <div className="dock-item">
          <span>活跃 Lanes</span>
          <strong>{activeLaneCount} 个</strong>
        </div>
        <div className="dock-item">
          <span>管道阻塞</span>
          <strong>{gateBlockedCount} 个</strong>
        </div>
        <div className="dock-item grow">
          <span>最近更新</span>
          <strong>{formatDateTime(snapshot.updatedAt)}</strong>
        </div>
      </footer>
    </div>
  );
}

function PanelHeading({
  kicker,
  title,
  meta,
  compact = false
}: {
  kicker: string;
  title: string;
  meta?: string;
  compact?: boolean;
}) {
  return (
    <div className={`panel-heading ${compact ? 'compact' : ''}`}>
      <span className="panel-kicker">{kicker}</span>
      <div className="panel-title-row">
        <h2>{title}</h2>
        {meta ? <code>{meta}</code> : null}
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  detail,
  tone = 'neutral'
}: {
  label: string;
  value: string;
  detail: string;
  tone?: SummaryTone;
}) {
  return (
    <article className={`summary-tile ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function RanchSettingsGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={ranchSettingsGroupStyle}>
      <span style={ranchSettingsLabelStyle}>{label}</span>
      {children}
    </div>
  );
}

function RanchSettingsChip({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={active ? 'is-active' : ''} onClick={onClick}>
      {label}
    </button>
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
      style={{ '--agent-accent': agent.accent } as CSSProperties}
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
        <Meter label="牛马剩余电量" value={runtime.energy} tone={runtime.energy < 30 ? 'danger' : 'ok'} />
        <Meter label="脑门发热度" value={Math.round(runtime.temperature)} suffix="°C" tone={runtime.temperature > 80 ? 'danger' : 'info'} max={120} />
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
        <button type="button" title="派活/拉磨" onClick={onRun}>
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
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTabId>('command');
  const meta = STATE_METAS[runtime.status];
  const quickTasks = useMemo(() => getQuickTasks(agent.id), [agent.id]);
  const openTask = agent.tasks.find((task) => task.id === openTaskId) ?? agent.tasks[0];
  const recentMessage = snapshot.messages[0];
  const runningTasks = agent.tasks.filter((task) => task.status === 'running').length;
  const localTasks = agent.tasks.filter((task) => task.runner === 'local').length;
  const simulatedTasks = agent.tasks.filter((task) => task.runner === 'simulated').length;

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
    <aside
      className="detail-panel"
      style={{ '--agent-accent': agent.accent } as CSSProperties}
    >
      <div className="detail-panel-head">
        <PanelHeading
          kicker="Operator Console"
          title={agent.name}
          meta={agent.codename}
          compact
        />
        <span className={`stage-status ${runtime.status}`}>{meta.name}</span>
      </div>

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
        <Metric
          label="脑门发热度 / 剩余电量"
          value={`${runtime.stress}% / ${runtime.energy}%`}
          detail={`温度 ${Math.round(runtime.temperature)}°C`}
        />
        <Metric
          label="任务负载"
          value={`${agent.tasks.length} 个任务`}
          detail={`${runningTasks} 正在拉磨 · ${localTasks} 本地 · ${simulatedTasks} 模拟`}
        />
        <Metric label="最近交互" value={formatDateTime(runtime.lastInteractionAt)} />
        <Metric label="已打开任务" value={openTask?.name ?? '未打开任务'} detail={openTask?.status ?? 'idle'} />
      </div>

      <div className="detail-tabs" role="tablist" aria-label="右侧详情面板">
        {detailTabs.map((tab) => {
          const active = tab.id === activeDetailTab;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`detail-tab-${tab.id}`}
              className={`detail-tab-button ${active ? 'is-active' : ''}`}
              aria-selected={active}
              aria-controls={`detail-tab-panel-${tab.id}`}
              onClick={() => setActiveDetailTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="detail-tab-content">
        {activeDetailTab === 'command' ? (
          <section
            key="command"
            id="detail-tab-panel-command"
            className="detail-tab-panel command-area"
            role="tabpanel"
            aria-labelledby="detail-tab-command"
          >
            <div className="section-heading">
              <h3>下发新任务 (画饼/派活)</h3>
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
                立即派活
              </button>
            </form>
          </section>
        ) : null}

        {activeDetailTab === 'queue' ? (
          <section
            key="queue"
            id="detail-tab-panel-queue"
            className="detail-tab-panel task-area"
            role="tabpanel"
            aria-labelledby="detail-tab-queue"
          >
            <div className="section-heading">
              <h3>任务队列 (拉磨记录)</h3>
              <button type="button" onClick={clearDone}>
                <Trash2 size={14} />
                清理历史功绩
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
        ) : null}

        {activeDetailTab === 'logs' ? (
          <section
            key="logs"
            id="detail-tab-panel-logs"
            className="detail-tab-panel terminal-panel"
            role="tabpanel"
            aria-labelledby="detail-tab-logs"
          >
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
        ) : null}
      </div>

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

function Metric({
  label,
  value,
  detail,
  mono = false
}: {
  label: string;
  value: string;
  detail?: string;
  mono?: boolean;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={mono ? 'mono' : ''}>{value}</strong>
      {detail ? <small className={mono ? 'mono' : ''}>{detail}</small> : null}
    </div>
  );
}

function getToneForState(state: string): SummaryTone {
  if (state === 'active') {
    return 'positive';
  }

  if (state === 'blocked') {
    return 'danger';
  }

  if (state === 'summarized') {
    return 'info';
  }

  if (state === 'standby') {
    return 'warning';
  }

  return 'neutral';
}

function getToneForMessage(type: AgentSnapshot['messages'][number]['type']): SummaryTone {
  if (type === 'success') {
    return 'positive';
  }

  if (type === 'warning') {
    return 'warning';
  }

  if (type === 'error') {
    return 'danger';
  }

  return 'info';
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('zh-CN', { hour12: false });
}

const ranchSettingsAnchorStyle: CSSProperties = {
  position: 'relative'
};

const ranchSettingsPanelStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  right: 0,
  zIndex: 12,
  width: 'min(320px, calc(100vw - 48px))',
  display: 'grid',
  gap: 10,
  padding: 12,
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'rgba(15, 23, 42, 0.98)',
  boxShadow: '0 18px 48px rgba(2, 6, 23, 0.55)'
};

const ranchSettingsGroupStyle: CSSProperties = {
  display: 'grid',
  gap: 6
};

const ranchSettingsLabelStyle: CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 11,
  letterSpacing: 0,
  textTransform: 'uppercase'
};

const ranchSettingsChipsStyle: CSSProperties = {
  flexWrap: 'wrap'
};

const ranchSettingsHintStyle: CSSProperties = {
  margin: 0,
  color: 'var(--text-muted)',
  fontSize: 12
};

function getRanchSettingsTriggerStyle(open: boolean): CSSProperties {
  return {
    appearance: 'none',
    cursor: 'pointer',
    font: 'inherit',
    color: open ? '#dcfce7' : 'var(--text-muted)',
    background: open ? 'rgba(34, 197, 94, 0.12)' : 'rgba(15, 23, 42, 0.78)',
    borderColor: open ? 'rgba(34, 197, 94, 0.32)' : 'var(--border)'
  };
}
