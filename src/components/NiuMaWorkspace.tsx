import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  Activity,
  Bell,
  ChevronUp,
  Coffee,
  Copy,
  Download,
  Eraser,
  ExternalLink,
  Flame,
  Home,
  Info,
  LoaderCircle,
  MessagesSquare,
  PanelLeftOpen,
  Play,
  Power,
  RefreshCcw,
  RotateCcw,
  Search,
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
  AgentHostLifecycleFact,
  AgentHostPrimaryAction,
  AgentSnapshot,
  AgentTask,
  AgentTaskRunner,
  CodexHostSnapshot,
  ConnectorGateResult,
  DesktopApi,
  NiuMaAction,
  NiuMaRuntimeState,
  RanchPrefs,
  RanchPrefsPatch
} from '../types';
import { getQuickTasks, STATE_METAS } from '../lib/agentCore';
import {
  selectAgentTruthByIdentity,
  type AgentProjectionReason,
  type AgentTruthProjection,
  type ProjectedAgentTruth,
  type ProjectedRuntimeTask
} from '../lib/agentInstanceProjection';
import {
  projectAgentSessions,
  type AgentSession
} from '../lib/agentSessionProjection';
import { CONNECTOR_POLICY, ORCHESTRATION_STATUS } from '../lib/orchestrationStatus';
import { getCodexHostOnlineContribution, getCombinedOnlineSessionCount } from '../lib/codexHostStatus';
import NiuMaAvatar from './NiuMaAvatar';
import StatusStrip from './StatusStrip';

interface NiuMaWorkspaceProps {
  api: DesktopApi;
  snapshot: AgentSnapshot;
  agentTruth: AgentTruthProjection;
  codexHost: CodexHostSnapshot;
  onSnapshot: (snapshot: AgentSnapshot) => void;
  onReturnHome?: () => void;
}

type SummaryTone = 'neutral' | 'positive' | 'info' | 'warning' | 'danger';
type DetailTabId = 'sessions' | 'command' | 'queue' | 'logs';
type GovernanceStateFilter = 'all' | 'active' | 'blocked' | 'standby' | 'summarized';
type DockStatusId = 'snapshot' | 'sessions' | 'local-hosts' | 'codex-host' | 'governance';
type CockpitRegionId = 'cockpit-health-region' | 'cockpit-agent-region' | 'cockpit-operator-region' | 'cockpit-governance-region';
type HostActionFeedback = {
  pending: boolean;
  status?: 'started' | 'completed' | 'blocked' | 'failed';
  message?: string;
};

const ACTIVE_COCKPIT_TASK_CARD_ID = 'c0-5';

const detailTabs: Array<{ id: DetailTabId; label: string }> = [
  { id: 'sessions', label: 'Sessions' },
  { id: 'command', label: '下发任务' },
  { id: 'queue', label: '任务队列' },
  { id: 'logs', label: '流式日志' }
];

const governanceStateOptions: Array<{ value: GovernanceStateFilter; label: string }> = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: 'active' },
  { value: 'blocked', label: 'blocked' },
  { value: 'standby', label: 'standby' },
  { value: 'summarized', label: 'summarized' }
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

export default function NiuMaWorkspace({ api, snapshot, agentTruth, codexHost, onSnapshot, onReturnHome }: NiuMaWorkspaceProps) {
  const isDesktopRuntime = Boolean(window.niumaDesk);
  const runtimeModeLabel = `Agent runtime · ${agentTruth.runtime.mode}`;
  const runtimeModeDetail = `${agentTruth.runtime.availability} · ${agentTruth.runtime.source}`;
  const [selectedAgentId, setSelectedAgentId] = useState(snapshot.agents[0]?.id ?? '');
  const [connectorGateResults, setConnectorGateResults] = useState<Record<string, ConnectorGateResult>>({});
  const [ranchPrefs, setRanchPrefs] = useState<RanchPrefs | null>(null);
  const [ranchSettingsOpen, setRanchSettingsOpen] = useState(false);
  const [cornerPanelOpen, setCornerPanelOpen] = useState(false);
  const [governancePanelOpen, setGovernancePanelOpen] = useState(false);
  const [activeDockStatus, setActiveDockStatus] = useState<DockStatusId | null>(null);
  const [completionToast, setCompletionToast] = useState<string | null>(null);
  const [hostActionFeedback, setHostActionFeedback] = useState<Record<string, HostActionFeedback>>({});
  const completionHydratedRef = useRef(false);
  const lastCompletionKeyRef = useRef<string | null>(null);
  const completionToastTimerRef = useRef<number | null>(null);

  const selectedAgent = snapshot.agents.find((agent) => agent.id === selectedAgentId) ?? snapshot.agents[0];
  const selectedAgentTruth = selectedAgent
    ? selectAgentTruthByIdentity(agentTruth, selectedAgent.id, selectedAgent.id)
    : null;
  const selectedRuntimeTask = selectedAgentTruth?.primaryInstance
    ? agentTruth.tasks.find((task) => (
        task.sessionId === selectedAgentTruth.primaryInstance?.sessionId
        && task.agentId === selectedAgentTruth.agentId
        && task.connectorId === selectedAgentTruth.connectorId
      )) ?? null
    : null;
  const selectedAgentSessions = selectedAgent
    ? projectAgentSessions({
        agentId: selectedAgent.id,
        connectorId: selectedAgentTruth?.connectorId ?? selectedAgent.id,
        runtimeTasks: agentTruth.tasks,
        codexHost
      })
    : [];
  const hostLifecycleByAgent = new Map(
    agentTruth.hostDiscovery.lifecycle.map((item) => [item.agentId, item])
  );
  const runtime = selectedAgent
    ? getHostAwareRuntime(
        snapshot.runtime[selectedAgent.id],
        hostLifecycleByAgent.get(selectedAgent.id) ?? null,
        selectedAgent.id === 'codex' ? codexHost : null
      )
    : undefined;
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
  const codexHostOnlineContribution = getCodexHostOnlineContribution(agentTruth, codexHost);
  const combinedOnlineSessionCount = getCombinedOnlineSessionCount(agentTruth, codexHost);
  const configuredAgentIds = new Set(snapshot.agents.map((agent) => agent.id));
  const hostProcessFacts = agentTruth.hostDiscovery.facts;
  const unboundHostFacts = hostProcessFacts.filter((fact) => !configuredAgentIds.has(fact.agentId));
  const hostDiscoveryRows: Array<[string, string]> = hostProcessFacts.length > 0
    ? hostProcessFacts.map((fact) => [
        fact.displayName,
        `${fact.processCount} 个进程 · ${configuredAgentIds.has(fact.agentId) ? '已绑定工位' : '未绑定发现项'} · 不计在线 Session`
      ])
    : [[
        '结果',
        agentTruth.hostDiscovery.availability === 'available'
          ? '未检测到已登记的本机 Agent 应用'
          : agentTruth.hostDiscovery.detail
      ]];

  // 左侧折叠状态
  const [rolesExpanded, setRolesExpanded] = useState(false);
  const [lanesExpanded, setLanesExpanded] = useState(false);
  const [governanceQuery, setGovernanceQuery] = useState('');
  const [governanceStateFilter, setGovernanceStateFilter] = useState<GovernanceStateFilter>('all');
  const [governanceCopyFeedback, setGovernanceCopyFeedback] = useState('');

  // 侧边栏整体收起/展开状态
  const [leftRailOpen, setLeftRailOpen] = useState(true);
  const [rightRailOpen, setRightRailOpen] = useState(true);

  const normalizedGovernanceQuery = governanceQuery.trim().toLocaleLowerCase();
  const filteredRoles = useMemo(() => ORCHESTRATION_STATUS.roles.filter((role) => {
    const matchesState = governanceStateFilter === 'all' || role.status === governanceStateFilter;
    const matchesQuery = matchesGovernanceQuery(normalizedGovernanceQuery, [
      role.id,
      role.title,
      role.owner,
      role.responsibility,
      role.tag,
      role.evidence
    ]);
    return matchesState && matchesQuery;
  }), [governanceStateFilter, normalizedGovernanceQuery]);
  const filteredLanes = useMemo(() => ORCHESTRATION_STATUS.lanes.filter((lane) => {
    const matchesState = governanceStateFilter === 'all' || lane.state === governanceStateFilter;
    const matchesQuery = matchesGovernanceQuery(normalizedGovernanceQuery, [
      lane.id,
      lane.title,
      lane.role,
      lane.nextAction
    ]);
    return matchesState && matchesQuery;
  }), [governanceStateFilter, normalizedGovernanceQuery]);
  const governanceFilterActive = normalizedGovernanceQuery.length > 0 || governanceStateFilter !== 'all';

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
    const completionKey = codexHost.lastCompletionKey ?? null;
    if (!completionHydratedRef.current) {
      completionHydratedRef.current = true;
      lastCompletionKeyRef.current = completionKey;
      return;
    }
    if (!completionKey || completionKey === lastCompletionKeyRef.current) {
      return;
    }
    lastCompletionKeyRef.current = completionKey;
    setCompletionToast('Codex 已完成本轮对话，等待验收。');
    if (!isDesktopRuntime) {
      void api.ranch.requestNotificationSound();
    }
    if (completionToastTimerRef.current !== null) {
      window.clearTimeout(completionToastTimerRef.current);
    }
    completionToastTimerRef.current = window.setTimeout(() => {
      setCompletionToast(null);
      completionToastTimerRef.current = null;
    }, 4_500);
  }, [api, codexHost.lastCompletionKey, isDesktopRuntime]);

  useEffect(() => () => {
    if (completionToastTimerRef.current !== null) {
      window.clearTimeout(completionToastTimerRef.current);
    }
  }, []);

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

  async function manageHost(agent: AIAgent, action: AgentHostPrimaryAction) {
    setSelectedAgentId(agent.id);
    setHostActionFeedback((current) => ({
      ...current,
      [agent.id]: { pending: true }
    }));
    try {
      const result = await api.manageAgentHost({ agentId: agent.id, action });
      setHostActionFeedback((current) => ({
        ...current,
        [agent.id]: {
          pending: false,
          status: result.status,
          message: result.message
        }
      }));
    } catch {
      setHostActionFeedback((current) => ({
        ...current,
        [agent.id]: {
          pending: false,
          status: 'failed',
          message: '本机 Agent 动作执行失败，请稍后重试。'
        }
      }));
    }
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

  function focusCockpitRegion(regionId: CockpitRegionId) {
    if (regionId === 'cockpit-governance-region') {
      setLeftRailOpen(true);
      setGovernancePanelOpen(true);
    }
    if (regionId === 'cockpit-operator-region') {
      setRightRailOpen(true);
      setCornerPanelOpen(false);
    }

    window.requestAnimationFrame(() => {
      const target = document.getElementById(regionId);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }

  function updateGovernanceQuery(query: string) {
    setGovernanceQuery(query);
    if (query.trim()) {
      setRolesExpanded(true);
      setLanesExpanded(true);
    }
  }

  function updateGovernanceStateFilter(filter: GovernanceStateFilter) {
    setGovernanceStateFilter(filter);
    if (filter !== 'all') {
      setRolesExpanded(true);
      setLanesExpanded(true);
    }
  }

  function clearGovernanceFilters() {
    setGovernanceQuery('');
    setGovernanceStateFilter('all');
  }

  async function copyGovernanceText(value: string, label: string) {
    try {
      await writeClipboardText(value);
      setGovernanceCopyFeedback(`${label}已复制`);
    } catch {
      setGovernanceCopyFeedback(`${label}复制失败，请手动选择文本`);
    }
  }

  const gateHeadline =
    gatePendingCount > 0
      ? `${gatePendingCount} pending`
      : gateBlockedCount > 0
        ? `${gateBlockedCount} blocked`
        : 'clear';
  const dockStatuses = [
    {
      id: 'snapshot' as const,
      label: '本地快照',
      value: formatDateTime(snapshot.updatedAt),
      tone: latestMessage?.type ?? 'info',
      rows: [
        ['来源', '本应用 AgentSnapshot'],
        ['最近事件', latestMessage ? `${latestMessage.title} · ${latestMessage.type}` : '暂无事件'],
        ['含义', '本地工位、任务与牧场状态；不代表外部 Agent 心跳。']
      ]
    },
    {
      id: 'sessions' as const,
      label: '在线 Session',
      value: `${combinedOnlineSessionCount} 在线`,
      tone: combinedOnlineSessionCount > 0 ? 'success' : 'warning',
      rows: [
        ['Connector 受控 Session', `${agentTruth.summary.onlineSessionCount}`],
        ['Codex Desktop 活动对话', `${codexHostOnlineContribution}`],
        ['Runtime', `${runtimeModeDetail} · ${formatDateTime(agentTruth.runtime.observedAt)}`],
        ['判定', '带受控 Session 证据或 Codex Desktop 生命周期 task_started，终态后退出在线计数。']
      ]
    },
    {
      id: 'local-hosts' as const,
      label: '本机 Agent',
      value: agentTruth.hostDiscovery.availability === 'available'
        ? `${hostProcessFacts.length} 已运行`
        : '探针不可用',
      tone: hostProcessFacts.length > 0 ? 'success' : 'neutral',
      rows: [
        ['观测来源', `${agentTruth.hostDiscovery.source} · ${formatDateTime(agentTruth.hostDiscovery.observedAt)}`],
        ...hostDiscoveryRows,
        ['状态边界', '应用运行只表示 discovered；没有可信 Session 时 online/busy 均为 0。']
      ]
    },
    {
      id: 'codex-host' as const,
      label: 'Codex Desktop',
      value: codexHost.clientRunning
        ? `已开启 · ${codexHost.activeSessionCount} 活动对话`
        : '未检测到客户端',
      tone: codexHost.clientRunning ? 'success' : 'neutral',
      rows: [
        ['客户端进程', codexHost.clientRunning ? '已开启' : '未检测到'],
        ['活动对话', `${codexHost.activeSessionCount}`],
        ['生命周期来源', codexHost.source],
        ['最近完成', codexHost.lastCompletedAt ? formatDateTime(codexHost.lastCompletedAt) : '尚无完成事件'],
        ['隐私边界', '只读取会话元数据与开始/完成/中止事件，不读取对话正文。']
      ]
    },
    {
      id: 'governance' as const,
      label: '治理登记',
      value: `${activeLaneCount} active · ${blockedLaneCount} blocked`,
      tone: blockedLaneCount > 0 ? 'warning' : 'success',
      rows: [
        ['监督 / 派工', `${ORCHESTRATION_STATUS.loopState} / ${ORCHESTRATION_STATUS.dispatchState}`],
        ['角色 / Lanes', `${ORCHESTRATION_STATUS.roles.length} / ${ORCHESTRATION_STATUS.lanes.length}`],
        ['真源', ORCHESTRATION_STATUS.source],
        ['当前阻塞', ORCHESTRATION_STATUS.blocker]
      ]
    }
  ];
  const activeDockDetail = dockStatuses.find((status) => status.id === activeDockStatus) ?? null;

  return (
    <div className="workspace-shell">
      <nav className="cockpit-region-jumps" aria-label="控制舱区域跳转">
        <button type="button" onClick={() => focusCockpitRegion('cockpit-health-region')}>全局健康</button>
        <button type="button" onClick={() => focusCockpitRegion('cockpit-agent-region')}>Agent 矩阵</button>
        <button
          type="button"
          onClick={() => focusCockpitRegion('cockpit-operator-region')}
          disabled={!selectedAgent || !runtime}
        >
          Operator
        </button>
        <button type="button" onClick={() => focusCockpitRegion('cockpit-governance-region')}>治理详情</button>
      </nav>

      <header
        id="cockpit-health-region"
        className="app-header cockpit-header cockpit-region-target"
        tabIndex={-1}
      >
        <div className="header-brand">
          <div className="title-row">
            <span className="brand-mark" aria-hidden="true">
              <Workflow size={16} />
            </span>
            <h1>桌面牧场 · 控制舱</h1>
            <span className="version-pill">OPS-RANCH v2.6</span>
            <span
              className={`runtime-mode-badge ${isDesktopRuntime ? 'desktop' : 'preview'}`}
              role="status"
              aria-label={`运行模式：${runtimeModeLabel}，${runtimeModeDetail}，观测时间 ${agentTruth.runtime.observedAt}`}
            >
              <span>{runtimeModeLabel}</span>
              <small>{runtimeModeDetail}</small>
            </span>
          </div>
          <p>本地工位配置、本应用任务、Connector 策略与控制面登记分区呈现。</p>

          <div className="header-kpis">
            <SummaryTile
              label="已配置工位"
              value={`${snapshot.agents.length}`}
              detail="本地配置数 · 非在线探针"
              tone="info"
            />
            <SummaryTile
              label="在线 Session"
              value={`${combinedOnlineSessionCount}`}
              detail={`Connector ${agentTruth.summary.onlineSessionCount} · Codex Desktop ${codexHostOnlineContribution}`}
              tone={combinedOnlineSessionCount > 0 ? 'positive' : 'neutral'}
            />
            <SummaryTile
              label="Connector 策略阻塞"
              value={`${gateBlockedCount}`}
              detail="策略门禁 · 非 Agent 离线"
              tone={gateBlockedCount > 0 ? 'danger' : 'positive'}
            />
          </div>
        </div>

        <div className="header-actions">
          {onReturnHome ? (
            <button type="button" className="safe-status" onClick={onReturnHome}>
              <Home size={14} />
              <span>返回首页</span>
            </button>
          ) : null}

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
                        <RanchSettingsChip
                          label="音效"
                          active={ranchPrefs.notifyPrefs.sound}
                          onClick={() => void patchRanchPrefs({
                            notifyPrefs: { sound: !ranchPrefs.notifyPrefs.sound }
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

      <main className={`workspace-grid cockpit-grid ${!leftRailOpen ? 'left-collapsed' : ''} ${!rightRailOpen ? 'right-collapsed' : ''}`}>
        <aside className={`left-rail ${leftRailOpen ? 'is-open' : 'is-collapsed'}`}>
          <button 
            type="button" 
            className="rail-toggle-btn left-toggle"
            onClick={() => setLeftRailOpen(!leftRailOpen)}
            title={leftRailOpen ? "收起左面板" : "展开左面板"}
            aria-label={leftRailOpen ? '收起左面板' : '展开左面板'}
          >
            {leftRailOpen ? '◀' : '▶'}
          </button>
          
          <div className="rail-content">
            <section className="cockpit-panel rail-summary-panel governance-summary" aria-label="控制面治理概览">
              <div className="governance-summary-head">
                <div>
                  <span>Control-plane</span>
                  <strong>治理概览</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setGovernancePanelOpen((open) => !open)}
                  aria-expanded={governancePanelOpen}
                  aria-controls="cockpit-governance-region"
                >
                  <PanelLeftOpen size={14} aria-hidden="true" />
                  <span>{governancePanelOpen ? '收起' : '详情'}</span>
                </button>
              </div>

              <div className="governance-status-line" aria-label="治理状态摘要">
                <span><small>监督</small><strong className={getToneForState(ORCHESTRATION_STATUS.loopState)}>{ORCHESTRATION_STATUS.loopState}</strong></span>
                <span><small>派工</small><strong className={getToneForState(ORCHESTRATION_STATUS.dispatchState)}>{ORCHESTRATION_STATUS.dispatchState}</strong></span>
                <span><small>阻塞</small><strong className={blockedLaneCount > 0 ? 'danger' : 'neutral'}>{blockedLaneCount}</strong></span>
              </div>

              <details className="blocker-disclosure">
                <summary aria-label="切换阻塞全文与真源">
                  <ShieldAlert size={14} aria-hidden="true" />
                  <span className="supervision-note-copy">{ORCHESTRATION_STATUS.blocker}</span>
                  <span className="blocker-disclosure-label blocker-label-closed">全文</span>
                  <span className="blocker-disclosure-label blocker-label-open">收起</span>
                </summary>
                <div className="blocker-disclosure-content">
                  <p>{ORCHESTRATION_STATUS.blocker}</p>
                  <div className="blocker-truth-source">
                    <span>治理真源</span>
                    <code title={ORCHESTRATION_STATUS.source}>{ORCHESTRATION_STATUS.source}</code>
                  </div>
                  <div className="blocker-copy-actions">
                    <button
                      type="button"
                      onClick={() => void copyGovernanceText(ORCHESTRATION_STATUS.blocker, '阻塞全文')}
                    >
                      <Copy size={13} aria-hidden="true" />
                      <span>复制 blocker</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyGovernanceText(ORCHESTRATION_STATUS.source, '真源路径')}
                    >
                      <Copy size={13} aria-hidden="true" />
                      <span>复制真源</span>
                    </button>
                  </div>
                  <span className="blocker-copy-feedback" role="status" aria-live="polite">
                    {governanceCopyFeedback}
                  </span>
                </div>
              </details>
            </section>

            {governancePanelOpen ? <section
              id="cockpit-governance-region"
              className="cockpit-panel orchestration-panel cockpit-region-target"
              aria-label="LPS 控制面角色与 Lane 登记"
              tabIndex={-1}
            >
              <PanelHeading
                kicker={ORCHESTRATION_STATUS.source}
                title="控制面角色分工与监督"
                meta={`控制面登记 ${ORCHESTRATION_STATUS.roles.length} 角色 / ${ORCHESTRATION_STATUS.lanes.length} Lanes`}
              />
              <button
                type="button"
                className="governance-detail-close"
                onClick={() => setGovernancePanelOpen(false)}
                aria-label="关闭治理详情"
                title="关闭治理详情"
              >
                <X size={14} />
              </button>
              <p>控制面登记（非实时运行探针） · {ORCHESTRATION_STATUS.target}</p>

              <div className="governance-tools" role="search" aria-label="搜索与过滤治理登记">
                <label className="governance-search-field">
                  <span className="sr-only">搜索角色与 Lane</span>
                  <Search size={13} aria-hidden="true" />
                  <input
                    type="search"
                    value={governanceQuery}
                    placeholder="搜索角色、Owner、Lane 或下一步"
                    onChange={(event) => updateGovernanceQuery(event.target.value)}
                  />
                </label>
                <label className="governance-state-field">
                  <span>状态</span>
                  <select
                    value={governanceStateFilter}
                    onChange={(event) => updateGovernanceStateFilter(event.target.value as GovernanceStateFilter)}
                  >
                    {governanceStateOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="governance-clear-button"
                  onClick={clearGovernanceFilters}
                  disabled={!governanceFilterActive}
                  aria-label="清空治理搜索与状态过滤"
                  title="清空治理搜索与状态过滤"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>

              <div className="governance-result-count" role="status" aria-live="polite">
                <span>角色 {filteredRoles.length}/{ORCHESTRATION_STATUS.roles.length}</span>
                <span>Lanes {filteredLanes.length}/{ORCHESTRATION_STATUS.lanes.length}</span>
              </div>

              <div className="orchestration-columns">
                <div className="rail-group">
                  <button 
                    type="button" 
                    className="rail-group-head-btn"
                    onClick={() => setRolesExpanded(!rolesExpanded)}
                    aria-expanded={rolesExpanded}
                    aria-controls="governance-role-list"
                  >
                    <div className="rail-group-head">
                      <Workflow size={14} />
                      <span>登记角色工位 ({ORCHESTRATION_STATUS.roles.length})</span>
                    </div>
                    <ChevronUp size={14} className={`accordion-chevron ${rolesExpanded ? 'is-open' : ''}`} aria-hidden="true" />
                  </button>
                  <div id="governance-role-list" className="role-grid" hidden={!rolesExpanded}>
                    {filteredRoles.length > 0 ? (
                      filteredRoles.map((role) => (
                        <article key={role.id} className={`role-card ${role.status}`}>
                          <div>
                            <strong>{role.title}</strong>
                            <span>{role.owner}</span>
                          </div>
                          <p>{role.responsibility}</p>
                          <code>{role.tag}</code>
                        </article>
                      ))
                    ) : (
                      <p className="governance-empty-state">没有匹配的角色登记。请调整关键词或状态。</p>
                    )}
                  </div>
                </div>

                <div className="rail-group">
                  <button 
                    type="button" 
                    className="rail-group-head-btn"
                    onClick={() => setLanesExpanded(!lanesExpanded)}
                    aria-expanded={lanesExpanded}
                    aria-controls="governance-lane-list"
                  >
                    <div className="rail-group-head">
                      <Activity size={14} />
                      <span>登记推进 Lanes ({ORCHESTRATION_STATUS.lanes.length})</span>
                    </div>
                    <ChevronUp size={14} className={`accordion-chevron ${lanesExpanded ? 'is-open' : ''}`} aria-hidden="true" />
                  </button>
                  <div id="governance-lane-list" className="lane-strip lane-stack" hidden={!lanesExpanded}>
                    {filteredLanes.length > 0 ? (
                      filteredLanes.map((lane) => (
                        <div key={lane.id} className={`lane-chip ${lane.state}`}>
                          <div className="lane-copy">
                            <span>{lane.title}</span>
                            <small>{lane.nextAction}</small>
                          </div>
                          <strong>{lane.state}</strong>
                        </div>
                      ))
                    ) : (
                      <p className="governance-empty-state">没有匹配的 Lane。请调整关键词或状态。</p>
                    )}
                  </div>
                </div>
              </div>
            </section> : null}
          </div>
        </aside>

        <section className="center-stage">
          <section
            id="cockpit-agent-region"
            className="cockpit-panel board-panel cockpit-region-target"
            aria-label="多 Agent 工位矩阵"
            tabIndex={-1}
          >
            <div className="board-panel-head">
              <PanelHeading
                kicker="Workstations"
                title="牛马工位矩阵"
                meta={selectedAgent ? `${selectedAgent.name} 聚焦中` : '未选中牛马'}
              />
              <div className="board-meta">
                <span>{combinedOnlineSessionCount} 个在线 Session · {runningCount} 个应用任务运行中</span>
                <span>
                  {hostProcessFacts.length} 个本机 Agent 应用已发现
                  {unboundHostFacts.length > 0
                    ? ` · 未绑定发现项 ${unboundHostFacts.map((fact) => `${fact.displayName}（${fact.processCount} 进程）`).join('、')}`
                    : ''}
                </span>
              </div>
            </div>

            <section className="agent-board" aria-label="多 Agent 工位">
              {snapshot.agents.map((agent) => {
                const agentRuntime = snapshot.runtime[agent.id];
                if (!agentRuntime) {
                  return null;
                }
                return <AgentCard
                  key={agent.id}
                  agent={agent}
                  runtime={getHostAwareRuntime(
                    agentRuntime,
                    hostLifecycleByAgent.get(agent.id) ?? null,
                    agent.id === 'codex' ? codexHost : null
                  )}
                  truth={selectAgentTruthByIdentity(agentTruth, agent.id, agent.id)}
                  lifecycle={hostLifecycleByAgent.get(agent.id) ?? null}
                  hostStatus={agent.id === 'codex' ? codexHost : null}
                  hostActionFeedback={hostActionFeedback[agent.id]}
                  selected={agent.id === selectedAgent?.id}
                  onSelect={() => setSelectedAgentId(agent.id)}
                  onRun={() => runTask(agent, undefined, undefined, 'simulated')}
                  onAction={(action) => applyAction(agent, action)}
                  onCycle={(event) => cycleState(agent, event)}
                  onHostAction={(action) => void manageHost(agent, action)}
                />;
              })}
            </section>
          </section>
        </section>

        {selectedAgent && runtime ? (
          <aside
            id="cockpit-operator-region"
            className={`right-rail cockpit-region-target ${rightRailOpen ? 'is-open' : 'is-collapsed'}`}
            tabIndex={-1}
            aria-label="Operator 任务与结果"
          >
            <button 
              type="button" 
              className="rail-toggle-btn right-toggle"
              onClick={() => {
                setRightRailOpen(!rightRailOpen);
                if (!rightRailOpen) {
                  setCornerPanelOpen(false);
                }
              }}
              title={rightRailOpen ? "收起右面板" : "展开右面板"}
              aria-label={rightRailOpen ? '收起右面板' : '展开右面板'}
            >
              {rightRailOpen ? '▶' : '◀'}
            </button>
            <div className="rail-content">
              <AgentDetailPanel
                key={selectedAgent.id}
                api={api}
                agent={selectedAgent}
                runtime={runtime}
                truth={selectedAgentTruth}
                runtimeTask={selectedRuntimeTask}
                sessions={selectedAgentSessions}
                runtimeTruth={agentTruth.runtime}
                codexHost={selectedAgent.id === 'codex' ? codexHost : null}
                lifecycle={hostLifecycleByAgent.get(selectedAgent.id) ?? null}
                hostActionFeedback={hostActionFeedback[selectedAgent.id]}
                localRunnerAvailable={isDesktopRuntime}
                onSnapshot={onSnapshot}
                onRunTask={runTask}
                onCycle={(event) => cycleState(selectedAgent, event)}
                onHostAction={(action) => void manageHost(selectedAgent, action)}
              />
            </div>
          </aside>
        ) : null}
      </main>

      {selectedAgent && runtime && selectedMeta ? (
        <section
          className={`corner-assist ${rightRailOpen ? 'is-right-rail-open' : 'is-available'} ${cornerPanelOpen ? 'is-open' : ''}`}
          style={{ '--agent-accent': selectedAgent.accent } as CSSProperties}
          aria-label="右下角牛马速览"
        >
          <button
            type="button"
            className="corner-assist-trigger"
            aria-expanded={cornerPanelOpen}
            aria-controls="corner-assist-panel"
            aria-label={cornerPanelOpen ? '收起牛马速览' : '展开牛马速览'}
            title={cornerPanelOpen ? '收起牛马速览' : '展开牛马速览'}
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
                <span className={`corner-status ${runtime.status}`}>本地牧场表现 · {selectedMeta.name}</span>
                <strong>{selectedMeta.expression}</strong>
                <p>{runtime.quote}</p>
              </div>
            </div>

            <div className="corner-assist-task">
              <span>{selectedTask?.name ?? '工位空闲'}</span>
              <small>{selectedTask?.command ?? '等待派活'}</small>
            </div>

          </div>
        </section>
      ) : null}

      {completionToast ? (
        <aside className="codex-completion-toast" role="status" aria-live="assertive">
          <Bell size={16} aria-hidden="true" />
          <div>
            <strong>Codex 对话完成</strong>
            <span>{completionToast}</span>
          </div>
          <button type="button" onClick={() => setCompletionToast(null)} aria-label="关闭完成提示">
            <X size={13} />
          </button>
        </aside>
      ) : null}

      <footer className="dock cockpit-dock">
        {activeDockDetail ? (
          <section id="cockpit-dock-detail" className="dock-status-detail" aria-label={`${activeDockDetail.label}详细信息`}>
            <div className="dock-status-detail-head">
              <div>
                <span>{activeDockDetail.label}</span>
                <strong>{activeDockDetail.value}</strong>
              </div>
              <button type="button" onClick={() => setActiveDockStatus(null)} aria-label="关闭状态详情">
                <X size={14} />
              </button>
            </div>
            <dl>
              {activeDockDetail.rows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
        {dockStatuses.map((status) => (
          <button
            key={status.id}
            type="button"
            className={`dock-item grow dock-status-button ${status.tone} ${activeDockStatus === status.id ? 'is-active' : ''}`}
            onClick={() => setActiveDockStatus((current) => current === status.id ? null : status.id)}
            aria-expanded={activeDockStatus === status.id}
            aria-controls="cockpit-dock-detail"
          >
            <span>{status.label}</span>
            <strong>{status.value}</strong>
            <Info size={13} aria-hidden="true" />
          </button>
        ))}
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
  detail?: string;
  tone?: SummaryTone;
}) {
  return (
    <article className={`summary-tile ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
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
  truth: ProjectedAgentTruth | null;
  lifecycle: AgentHostLifecycleFact | null;
  hostStatus: CodexHostSnapshot | null;
  hostActionFeedback?: HostActionFeedback;
  selected: boolean;
  onSelect: () => void;
  onRun: () => void;
  onAction: (action: NiuMaAction) => void;
  onCycle: (event: ReactMouseEvent) => void;
  onHostAction: (action: AgentHostPrimaryAction) => void;
}

function AgentCard({
  agent,
  runtime,
  truth,
  lifecycle,
  hostStatus,
  hostActionFeedback,
  selected,
  onSelect,
  onRun,
  onAction,
  onCycle,
  onHostAction
}: AgentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const meta = STATE_METAS[runtime.status];
  const running = agent.tasks.filter((task) => task.status === 'running').length;
  const hostProcessDiscovered = truth?.instances.some((instance) => instance.source === 'host-process') ?? false;
  const hostPresentation = getHostPresentation(lifecycle, hostStatus);

  useEffect(() => {
    if (!selected) {
      setMenuOpen(false);
      setMenuStyle(null);
    }
  }, [selected]);

  useLayoutEffect(() => {
    if (!menuOpen || !selected || !summaryRef.current) {
      return;
    }

    const summaryRect = summaryRef.current.getBoundingClientRect();
    const dockTop = document.querySelector('.cockpit-dock')?.getBoundingClientRect().top ?? window.innerHeight;
    const menuWidth = Math.min(180, window.innerWidth - 16);
    const menuHeight = 190;
    const safeBottom = Math.min(window.innerHeight - 8, dockTop - 8);
    const top = Math.max(8, Math.min(summaryRect.top - menuHeight - 6, safeBottom - menuHeight));
    const left = Math.max(8, Math.min(summaryRect.right - menuWidth, window.innerWidth - menuWidth - 8));

    setMenuStyle({ left, top, width: menuWidth });
  }, [menuOpen, selected]);

  useEffect(() => {
    if (menuOpen && menuStyle) {
      menuRef.current?.querySelector('button')?.focus();
    }
  }, [menuOpen, menuStyle]);

  function runSecondaryAction(action: NiuMaAction) {
    onAction(action);
    setMenuOpen(false);
  }

  function cycleFromMenu(event: ReactMouseEvent) {
    onCycle(event);
    setMenuOpen(false);
  }

  return (
    <article
      className={`agent-card ${selected ? 'is-selected' : 'is-dimmed'}`}
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

        <div className="agent-card-avatar" aria-hidden="true" inert>
          <NiuMaAvatar
            agent={agent}
            runtime={runtime}
            selected={selected}
          />
        </div>

        <div className="expression-line">本地牧场表现 · {meta.expression}</div>
        {hostPresentation ? (
          <div
            className={`agent-host-status is-${hostPresentation.tone}`}
            data-host-lifecycle={hostPresentation.state}
          >
            <span>{hostPresentation.label}</span>
            <strong>{hostPresentation.detail}</strong>
          </div>
        ) : null}
        {hostProcessDiscovered && !hostPresentation ? (
          <div className="agent-host-status is-idle" data-host-presence="discovered">
            <span>本机应用已运行</span>
            <strong>未观察到活动 Session</strong>
          </div>
        ) : null}
      </button>

      <div className={`card-actions ${selected ? 'is-selected' : 'is-compact'} ${lifecycle?.primaryAction ? 'has-host-action' : ''}`}>
        {lifecycle?.primaryAction ? (
          <button
            type="button"
            className="host-primary-action"
            title={getHostActionLabel(lifecycle)}
            aria-label={`${agent.name}：${getHostActionLabel(lifecycle)}`}
            disabled={hostActionFeedback?.pending}
            onClick={() => onHostAction(lifecycle.primaryAction!)}
          >
            <HostActionIcon action={lifecycle.primaryAction} pending={hostActionFeedback?.pending ?? false} />
            <span>{getHostActionLabel(lifecycle)}</span>
          </button>
        ) : null}
        <button
          type="button"
          className="card-primary-action"
          title={running > 0 ? '继续模拟派活' : '模拟派活'}
          aria-label={`${agent.name}：${running > 0 ? '继续模拟派活' : '模拟派活'}`}
          onClick={onRun}
        >
          <Play size={15} />
          <span>{running > 0 ? '继续模拟派活' : '模拟派活'}</span>
        </button>
        {selected ? (
          <details
            className="card-more-actions"
            open={menuOpen}
            onToggle={(event) => setMenuOpen(event.currentTarget.open)}
          >
            <summary
              ref={summaryRef}
              title="更多牛马动作"
              aria-label={`${agent.name}：更多牛马动作`}
              aria-controls={`agent-more-menu-${agent.id}`}
            >
              <SlidersHorizontal size={15} />
              <span>更多</span>
            </summary>
          </details>
        ) : null}
      </div>
      {hostActionFeedback?.message ? (
        <div className={`host-action-feedback is-${hostActionFeedback.status ?? 'completed'}`} role="status">
          {hostActionFeedback.message}
        </div>
      ) : null}
      {selected && menuOpen && menuStyle ? createPortal(
        <div
          ref={menuRef}
          id={`agent-more-menu-${agent.id}`}
          className="card-more-menu card-more-menu-portal"
          style={menuStyle}
          role="group"
          aria-label={`${agent.name} 更多牛马动作`}
        >
          <button type="button" title="画饼加班" onClick={() => runSecondaryAction('pie')}>
            <Flame size={15} aria-hidden="true" />
            <span>画饼加班</span>
          </button>
          <button type="button" title="给杯咖啡" onClick={() => runSecondaryAction('coffee')}>
            <Coffee size={15} aria-hidden="true" />
            <span>给杯咖啡</span>
          </button>
          <button type="button" title="强制开工" onClick={() => runSecondaryAction('whip')}>
            <Zap size={15} aria-hidden="true" />
            <span>强制开工</span>
          </button>
          <button type="button" title="批准摸鱼" onClick={() => runSecondaryAction('slack')}>
            <Waves size={15} aria-hidden="true" />
            <span>批准摸鱼</span>
          </button>
          <button type="button" title="切换牛马状态" onClick={cycleFromMenu}>
            <RefreshCcw size={15} aria-hidden="true" />
            <span>切换状态</span>
          </button>
        </div>,
        document.body
      ) : null}
    </article>
  );
}

interface AgentDetailPanelProps {
  api: DesktopApi;
  agent: AIAgent;
  runtime: NiuMaRuntimeState;
  truth: ProjectedAgentTruth | null;
  runtimeTask: ProjectedRuntimeTask | null;
  sessions: readonly AgentSession[];
  runtimeTruth: AgentTruthProjection['runtime'];
  codexHost: CodexHostSnapshot | null;
  lifecycle: AgentHostLifecycleFact | null;
  hostActionFeedback?: HostActionFeedback;
  localRunnerAvailable: boolean;
  onSnapshot: (snapshot: AgentSnapshot) => void;
  onRunTask: (agent: AIAgent, taskName?: string, command?: string, runner?: AgentTaskRunner) => Promise<void>;
  onCycle: (event: ReactMouseEvent) => void;
  onHostAction: (action: AgentHostPrimaryAction) => void;
}

function AgentDetailPanel({
  api,
  agent,
  runtime,
  truth,
  runtimeTask,
  sessions,
  runtimeTruth,
  codexHost,
  lifecycle,
  hostActionFeedback,
  localRunnerAvailable,
  onSnapshot,
  onRunTask,
  onCycle,
  onHostAction
}: AgentDetailPanelProps) {
  const [taskName, setTaskName] = useState('');
  const [command, setCommand] = useState('');
  const [runner, setRunner] = useState<AgentTaskRunner>(localRunnerAvailable ? 'local' : 'simulated');
  const [openTaskId, setOpenTaskId] = useState<string | null>(agent.tasks[0]?.id ?? null);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTabId>('sessions');
  const [openSessionKey, setOpenSessionKey] = useState<string | null>(
    sessions[0] ? getAgentSessionKey(sessions[0]) : null
  );
  const meta = STATE_METAS[runtime.status];
  const quickTasks = useMemo(() => getQuickTasks(agent.id), [agent.id]);
  const openTask = agent.tasks.find((task) => task.id === openTaskId) ?? agent.tasks[0];
  const effectiveRunner: AgentTaskRunner = localRunnerAvailable ? runner : 'simulated';
  const primaryInstance = truth?.primaryInstance ?? null;
  const openSession = sessions.find((session) => getAgentSessionKey(session) === openSessionKey) ?? sessions[0];

  async function submitTask(event: React.FormEvent) {
    event.preventDefault();
    await onRunTask(agent, taskName.trim() || undefined, command.trim() || undefined, effectiveRunner);
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
      data-runtime-task-id={runtimeTask?.taskId ?? ''}
      data-runtime-session-id={runtimeTask?.sessionId ?? ''}
      data-runtime-agent-id={runtimeTask?.agentId ?? ''}
      data-runtime-connector-id={runtimeTask?.connectorId ?? ''}
      data-runtime-source={runtimeTask?.source ?? ''}
      data-runtime-state={runtimeTask?.effectiveState ?? ''}
      data-runtime-last-seen={runtimeTask?.lastSeen ?? ''}
      data-runtime-pid={runtimeTask?.pid ?? ''}
      data-runtime-primary-instance-id={primaryInstance?.instanceId ?? ''}
      data-runtime-primary-session-id={primaryInstance?.sessionId ?? ''}
      data-runtime-primary-source={primaryInstance?.source ?? ''}
      data-runtime-primary-reason={primaryInstance?.reason ?? ''}
      data-runtime-primary-presence={primaryInstance?.presence ?? ''}
      data-runtime-primary-activity={primaryInstance?.activity ?? ''}
      data-codex-host-source={codexHost?.source ?? ''}
      data-codex-host-active-sessions={codexHost?.activeSessionCount ?? 0}
      data-agent-session-count={sessions.length}
    >
      <div className="detail-identity detail-identity-compact">
        <NiuMaAvatar
          agent={agent}
          runtime={runtime}
          selected
          compact
          onClick={onCycle}
        />
        <div className="detail-identity-info">
          <div className="detail-name">
            <h2>{agent.name}</h2>
            <span>{agent.codename}</span>
          </div>
          <div className="detail-compact-status">
            <span className={`stage-status ${runtime.status}`}>
              {codexHost?.clientRunning
                ? `Codex Desktop · ${codexHost.activeSessionCount > 0 ? `${codexHost.activeSessionCount} running` : 'idle'}`
                : `Session ${truth?.presence ?? 'unknown'} · ${truth?.activity ?? 'unknown'}`}
            </span>
            <p className="detail-desc">本地牧场表现：{meta.name} · {agent.description}</p>
          </div>
        </div>
      </div>

      <details className="detail-more">
        <summary title="展开 Agent 状态与连接详情">
          <span>Session 真值与本地表现详情</span>
          <small>{codexHost?.clientRunning
            ? `desktop / ${codexHost.activeSessionCount > 0 ? 'running' : 'idle'}`
            : `${truth?.presence ?? 'unknown'} / ${truth?.activity ?? 'unknown'}`}</small>
        </summary>
        <div className="detail-more-content">
          <div className="quote-box">
            <Bell size={14} aria-hidden="true" />
            <span>本地牧场台词 · {runtime.quote}</span>
          </div>

          <div className="detail-metrics-compact">
            {codexHost ? (
              <>
                <div className="metric-item-row">
                  <span className="metric-label">Codex Desktop:</span>
                  <span className="metric-value">{codexHost.clientRunning ? '已开启' : '未检测到'} / {codexHost.activeSessionCount} 活动对话</span>
                </div>
                <div className="metric-item-row">
                  <span className="metric-label">Host 来源:</span>
                  <span className="metric-value">{codexHost.source} · {formatDateTime(codexHost.observedAt)}</span>
                </div>
              </>
            ) : null}
            <div className="metric-item-row">
              <span className="metric-label">Runtime:</span>
              <span className="metric-value">{runtimeTruth.availability} / {runtimeTruth.mode} / {runtimeTruth.source}</span>
            </div>
            <div className="metric-item-row">
              <span className="metric-label">观测时间:</span>
              <span className="metric-value">{formatDateTime(runtimeTruth.observedAt)}</span>
            </div>
            <div className="metric-item-row">
              <span className="metric-label">Presence:</span>
              <span className="metric-value">{truth?.presence ?? 'unknown'} / {truth?.activity ?? 'unknown'}</span>
            </div>
            <div className="metric-item-row">
              <span className="metric-label">Task ID:</span>
              <span className="metric-value mono" title={runtimeTask?.taskId ?? 'unknown'}>{runtimeTask?.taskId ?? 'unknown'}</span>
            </div>
            <div className="metric-item-row">
              <span className="metric-label">Session ID:</span>
              <span className="metric-value mono" title={runtimeTask?.sessionId ?? primaryInstance?.sessionId ?? 'unknown'}>{runtimeTask?.sessionId ?? primaryInstance?.sessionId ?? 'unknown'}</span>
            </div>
            <div className="metric-item-row">
              <span className="metric-label">Agent ID:</span>
              <span className="metric-value mono">{runtimeTask?.agentId ?? primaryInstance?.agentId ?? 'unknown'}</span>
            </div>
            <div className="metric-item-row">
              <span className="metric-label">Connector ID:</span>
              <span className="metric-value mono">{runtimeTask?.connectorId ?? primaryInstance?.connectorId ?? 'unknown'}</span>
            </div>
            <div className="metric-item-row">
              <span className="metric-label">Session 来源:</span>
              <span className="metric-value">{runtimeTask?.source ?? primaryInstance?.source ?? 'unknown'}</span>
            </div>
            <div className="metric-item-row">
              <span className="metric-label">Instance 来源:</span>
              <span className="metric-value">{primaryInstance?.source ?? 'unknown'}</span>
            </div>
            <div className="metric-item-row">
              <span className="metric-label">Runtime task state:</span>
              <span className="metric-value">{runtimeTask?.effectiveState ?? 'unknown'}</span>
            </div>
            <div className="metric-item-row">
              <span className="metric-label">Last seen:</span>
              <span className="metric-value">{runtimeTask?.lastSeen ? formatDateTime(runtimeTask.lastSeen) : 'unknown'}</span>
            </div>
            <div className="metric-item-row">
              <span className="metric-label">PID:</span>
              <span className="metric-value mono">{runtimeTask?.pid ?? 'unknown'}</span>
            </div>
            <div className="metric-item-row">
              <span className="metric-label">Capabilities:</span>
              <span className="metric-value" title={formatCapabilities(primaryInstance)}>{formatCapabilities(primaryInstance)}</span>
            </div>
            <div className="metric-item-row">
              <span className="metric-label">真值说明:</span>
              <span className="metric-value">{formatTruthReason(primaryInstance?.reason, runtimeTruth)}</span>
            </div>
            <div className="metric-item-row">
              <span className="metric-label">工位模型配置:</span>
              <span className="metric-value">{agent.modelName}</span>
            </div>
            <div className="metric-item-row">
              <span className="metric-label">工位端点配置:</span>
              <span className="metric-value mono" title={agent.endpoint}>{agent.endpoint}</span>
            </div>
            <div className="metric-item-row">
              <span className="metric-label">应用快照交互:</span>
              <span className="metric-value">{formatDateTime(runtime.lastInteractionAt)}</span>
            </div>
          </div>
        </div>
      </details>

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
        {activeDetailTab === 'sessions' ? (
          <section
            key="sessions"
            id="detail-tab-panel-sessions"
            className="detail-tab-panel session-area"
            role="tabpanel"
            aria-labelledby="detail-tab-sessions"
          >
            <div className="section-heading session-heading">
              <div>
                <h3>{agent.name} Sessions</h3>
                <small>{sessions.length} 个真实观测项</small>
              </div>
              {lifecycle?.primaryAction ? (
                <button
                  type="button"
                  className="session-host-action"
                  disabled={hostActionFeedback?.pending}
                  title={getHostActionLabel(lifecycle)}
                  onClick={() => onHostAction(lifecycle.primaryAction!)}
                >
                  <HostActionIcon action={lifecycle.primaryAction} pending={hostActionFeedback?.pending ?? false} />
                  <span>{getHostActionLabel(lifecycle)}</span>
                </button>
              ) : null}
            </div>

            {sessions.length === 0 ? (
              <div className="session-empty" data-session-empty="true">
                <MessagesSquare size={20} aria-hidden="true" />
                <strong>未观察到 Session</strong>
                <span>当前只有应用或工位状态，没有结构化 Session 证据。</span>
              </div>
            ) : (
              <div className="session-list" aria-label={`${agent.name} Session 列表`}>
                {sessions.map((session) => (
                  <button
                    key={`${session.source}:${session.sessionId}`}
                    type="button"
                    className={`session-row ${getAgentSessionKey(session) === (openSession ? getAgentSessionKey(openSession) : null) ? 'is-selected' : ''}`}
                    data-session-source={session.source}
                    data-session-status={session.status}
                    aria-pressed={getAgentSessionKey(session) === (openSession ? getAgentSessionKey(openSession) : null)}
                    onClick={() => setOpenSessionKey(getAgentSessionKey(session))}
                  >
                    <span className={`session-state is-${session.status}`}>{getSessionStatusLabel(session.status)}</span>
                    <strong title={session.title}>{session.title}</strong>
                    <small>{getSessionSourceLabel(session.source)} · {formatDateTime(session.updatedAt)}</small>
                  </button>
                ))}
              </div>
            )}

            {openSession ? (
              <dl className="session-detail" aria-label="Session 详情">
                <div>
                  <dt>Session ID</dt>
                  <dd className="mono" title={openSession.sessionId}>{openSession.sessionId}</dd>
                </div>
                <div>
                  <dt>来源</dt>
                  <dd>{getSessionSourceLabel(openSession.source)}</dd>
                </div>
                <div>
                  <dt>状态</dt>
                  <dd>{getSessionStatusLabel(openSession.status)}</dd>
                </div>
                <div>
                  <dt>更新时间</dt>
                  <dd>{formatDateTime(openSession.updatedAt)}</dd>
                </div>
                {openSession.taskId ? (
                  <div>
                    <dt>Task ID</dt>
                    <dd className="mono" title={openSession.taskId}>{openSession.taskId}</dd>
                  </div>
                ) : null}
                {openSession.workspace ? (
                  <div>
                    <dt>工作区</dt>
                    <dd className="mono" title={openSession.workspace}>{openSession.workspace}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}

            {hostActionFeedback?.message ? (
              <div className={`host-action-feedback is-${hostActionFeedback.status ?? 'completed'}`} role="status">
                {hostActionFeedback.message}
              </div>
            ) : null}
          </section>
        ) : null}

        {activeDetailTab === 'command' ? (
          <section
            key="command"
            id="detail-tab-panel-command"
            className="detail-tab-panel command-area"
            role="tabpanel"
            aria-labelledby="detail-tab-command"
          >
            <div className="section-heading">
              <h3>{localRunnerAvailable ? '下发新任务 (本地/模拟)' : '下发模拟任务'}</h3>
              <div className="runner-switch" aria-label="选择 runner 模式">
                <button
                  type="button"
                  className={effectiveRunner === 'local' ? 'is-active' : ''}
                  disabled={!localRunnerAvailable}
                  title={localRunnerAvailable ? '使用 Electron 本地命令 runner' : '本地命令仅 Electron 本地运行时可用'}
                  aria-label={localRunnerAvailable ? '本地命令' : '本地命令不可用：仅 Electron 本地运行时可用'}
                  onClick={() => setRunner('local')}
                >
                  {localRunnerAvailable ? '本地命令' : '本地命令（仅 Electron）'}
                </button>
                <button
                  type="button"
                  className={effectiveRunner === 'simulated' ? 'is-active' : ''}
                  onClick={() => setRunner('simulated')}
                >
                  模拟推进
                </button>
              </div>
            </div>

            <form className="task-form" onSubmit={submitTask}>
              <input
                value={taskName}
                onChange={(event) => setTaskName(event.target.value)}
                placeholder="任务名称，例如：检查桌面 IPC 边界"
                aria-label="任务名称"
              />
              <input
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="命令模板，例如：agent run --mode simulated"
                aria-label="任务命令"
                title={command || '输入任务命令'}
              />
              <button type="submit">
                <Play size={15} />
                {effectiveRunner === 'simulated' ? '立即模拟派活' : '立即派活'}
              </button>
            </form>

            <div className="quick-task-section">
              <span className="quick-task-label">快捷填充</span>
              <div className="quick-grid">
                {quickTasks.map((task) => (
                  <button
                    key={`${task.name}-${task.command}`}
                    type="button"
                    title={`${task.name}：${task.command}`}
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
            </div>

            <div className="tab-extra-metrics">
              <div className="extra-metric-item">
                <span>当前任务负载</span>
                <strong>{agent.tasks.length} 个任务</strong>
              </div>
              <div className="extra-metric-item">
                <span>拉磨状态</span>
                <strong>{agent.tasks.filter((task) => task.status === 'running').length} 个应用任务运行中 · {agent.tasks.filter((task) => task.runner === 'local').length} 本地 · {agent.tasks.filter((task) => task.runner === 'simulated').length} 模拟</strong>
              </div>
              {openTask ? (
                <div className="extra-metric-item">
                  <span>已打开任务</span>
                  <strong>{openTask.name} ({openTask.status})</strong>
                </div>
              ) : null}
            </div>
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

function getHostAwareRuntime(
  runtime: NiuMaRuntimeState,
  lifecycle: AgentHostLifecycleFact | null,
  codexHost: CodexHostSnapshot | null
): NiuMaRuntimeState;
function getHostAwareRuntime(
  runtime: NiuMaRuntimeState | undefined,
  lifecycle: AgentHostLifecycleFact | null,
  codexHost: CodexHostSnapshot | null
): NiuMaRuntimeState | undefined;
function getHostAwareRuntime(
  runtime: NiuMaRuntimeState | undefined,
  lifecycle: AgentHostLifecycleFact | null,
  codexHost: CodexHostSnapshot | null
): NiuMaRuntimeState | undefined {
  if (!runtime) {
    return undefined;
  }
  if (codexHost) {
    const working = codexHost.clientRunning && codexHost.activeSessionCount > 0;
    return {
      ...runtime,
      status: working ? 'coding' as const : 'idle' as const,
      observedStatus: working ? 'coding' as const : 'idle' as const,
      quote: working
        ? `Codex 正在同步 ${codexHost.activeSessionCount} 个活动对话。`
        : (codexHost.clientRunning ? 'Codex Desktop 已开启，当前空闲。' : 'Codex Desktop 尚未启动。'),
      customState: null
    };
  }
  if (!lifecycle) {
    return runtime;
  }
  return {
    ...runtime,
    status: lifecycle.state === 'working' ? 'coding' as const : 'idle' as const,
    observedStatus: lifecycle.state === 'working' ? 'coding' as const : 'idle' as const,
    quote: lifecycle.state === 'working'
      ? `${lifecycle.displayName} 正在执行 Hub 任务。`
      : lifecycle.state === 'idle'
        ? `${lifecycle.displayName} 已打开，当前空闲。`
        : lifecycle.state === 'stopped'
          ? `${lifecycle.displayName} 已安装，等待启动。`
          : `${lifecycle.displayName} 尚未安装。`,
    customState: null
  };
}

function getHostPresentation(
  lifecycle: AgentHostLifecycleFact | null,
  codexHost: CodexHostSnapshot | null
) {
  if (codexHost) {
    if (codexHost.clientRunning && codexHost.activeSessionCount > 0) {
      return {
        state: 'working',
        tone: 'running',
        label: 'Codex Desktop 同步中',
        detail: `${codexHost.activeSessionCount} 活动对话`
      } as const;
    }
    if (codexHost.clientRunning) {
      return {
        state: 'idle',
        tone: 'idle',
        label: 'Codex Desktop 已开启',
        detail: 'idle · 暂无活动对话'
      } as const;
    }
    return {
      state: 'stopped',
      tone: 'stopped',
      label: 'Codex Desktop 未开启',
      detail: '等待启动'
    } as const;
  }
  if (!lifecycle) {
    return null;
  }
  if (lifecycle.state === 'not-installed') {
    return {
      state: lifecycle.state,
      tone: 'missing',
      label: '本机未安装',
      detail: lifecycle.agentId === 'openclaw' ? '可一键安装' : '暂无自动安装源'
    } as const;
  }
  if (lifecycle.state === 'stopped') {
    const serviceMissing = lifecycle.agentId === 'openclaw' && !lifecycle.serviceInstalled;
    return {
      state: lifecycle.state,
      tone: 'stopped',
      label: serviceMissing ? 'OpenClaw CLI 已安装' : '本机应用已安装',
      detail: serviceMissing ? 'Gateway 服务未配置' : '当前未启动'
    } as const;
  }
  if (lifecycle.state === 'working') {
    return {
      state: lifecycle.state,
      tone: 'running',
      label: '本机应用执行中',
      detail: 'working · Hub 任务活跃'
    } as const;
  }
  return {
    state: lifecycle.state,
    tone: 'idle',
    label: '本机应用已打开',
    detail: 'idle · 暂无任务'
  } as const;
}

function getHostActionLabel(lifecycle: AgentHostLifecycleFact) {
  if (lifecycle.primaryAction === 'install') {
    return lifecycle.installed ? '安装服务' : '安装 OpenClaw';
  }
  if (lifecycle.primaryAction === 'launch') {
    return lifecycle.agentId === 'openclaw' ? '启动服务' : `打开 ${lifecycle.displayName}`;
  }
  return `聚焦 ${lifecycle.displayName}`;
}

function HostActionIcon({ action, pending }: { action: AgentHostPrimaryAction; pending: boolean }) {
  if (pending) {
    return <LoaderCircle className="host-action-spinner" size={14} />;
  }
  if (action === 'install') {
    return <Download size={14} />;
  }
  if (action === 'launch') {
    return <Power size={14} />;
  }
  return <ExternalLink size={14} />;
}

function getSessionStatusLabel(status: AgentSession['status']) {
  const labels: Record<AgentSession['status'], string> = {
    idle: 'idle',
    working: 'working',
    completed: 'completed',
    failed: 'failed',
    unknown: 'unknown'
  };
  return labels[status];
}

function getSessionSourceLabel(source: AgentSession['source']) {
  return source === 'codex-desktop' ? 'Codex Desktop' : 'Connector Runtime';
}

function getAgentSessionKey(session: AgentSession) {
  return `${session.source}:${session.sessionId}`;
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

function matchesGovernanceQuery(query: string, values: string[]) {
  if (!query) {
    return true;
  }
  return values.some((value) => value.toLocaleLowerCase().includes(query));
}

async function writeClipboardText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();

  const copied = document.execCommand('copy');
  textArea.remove();
  if (!copied) {
    throw new Error('Clipboard copy failed');
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('zh-CN', { hour12: false });
}

function formatCapabilities(instance: ProjectedAgentTruth['primaryInstance']) {
  if (!instance || instance.capabilities === null) {
    return '未知 (unknown)';
  }
  const capabilities = instance.capabilities.length > 0
    ? instance.capabilities.join(', ')
    : '无已声明能力';
  return `${capabilities} · ${instance.capabilitySource}`;
}

function formatTruthReason(
  reason: AgentProjectionReason | undefined,
  runtime: AgentTruthProjection['runtime']
) {
  if (runtime.mode === 'simulated') {
    return `模拟模式，不代表真实 Agent 在线${runtime.reason ? ` · ${runtime.reason}` : ''}`;
  }
  if (runtime.availability === 'unavailable') {
    return `Runtime unavailable，在线数按 0 处理${runtime.reason ? ` · ${runtime.reason}` : ''}`;
  }
  if (runtime.availability === 'recovering') {
    return 'Runtime recovering，恢复完成前不判定在线';
  }
  if (runtime.availability === 'unknown') {
    return 'Runtime 状态 unknown，未补成功默认值';
  }

  const labels: Partial<Record<AgentProjectionReason, string>> = {
    'configured-only': '仅有本地工位配置，未发现真实 Session',
    'runtime-discovered': '仅发现运行入口，尚无真实 Session',
    'fresh-session': '真实 Session 心跳在 5 秒新鲜窗口内',
    'fresh-running-task': '真实 Session 新鲜，且关联任务正在运行',
    'heartbeat-late': '心跳超过 5 秒，Session 已降级',
    'heartbeat-stale': '心跳达到 15 秒，Session 已离线',
    'session-lost': 'Session 已丢失，关联任务不再视为运行中',
    'policy-blocked': 'Connector policy blocked，Session 不在线',
    'permission-denied': 'Connector permission denied，Session 不在线',
    'terminal-session': 'Session 已进入终态，不再在线',
    'missing-session-id': '缺少 Session ID，无法证明在线',
    'missing-source-proof': '缺少真实运行来源，无法证明在线',
    'missing-last-seen': '缺少 lastSeen，无法证明在线',
    'invalid-last-seen': 'lastSeen 无效，无法证明在线',
    'future-last-seen': 'lastSeen 位于未来，证据无效',
    'last-seen-after-runtime-observed-at': 'lastSeen 晚于 Runtime 观测时间，证据因果关系无效',
    'duplicate-session-conflict': '同一 Session 存在冲突事实，已按 unknown 降级',
    'task-identity-mismatch': '任务与 Session 身份不一致，未判定 busy',
    'upstream-degraded': '上游已标记 degraded，不判定在线'
  };
  return reason ? labels[reason] ?? reason : '未发现真实 Session，状态 unknown';
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
