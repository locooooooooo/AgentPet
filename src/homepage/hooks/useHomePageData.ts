import { useMemo } from 'react';
import type { AgentSnapshot, CodexHostSnapshot } from '../../types';
import type { AgentTruthProjection } from '../../lib/agentInstanceProjection';
import { getCombinedOnlineSessionCount } from '../../lib/codexHostStatus';
import { STATE_METAS } from '../../lib/agentCore';
import { CONNECTOR_POLICY, ORCHESTRATION_STATUS } from '../../lib/orchestrationStatus';
import type { HomePageAgent, HomePageData, HomePageMetric } from '../types';

export function useHomePageData(
  snapshot: AgentSnapshot,
  agentTruth: AgentTruthProjection,
  codexHost: CodexHostSnapshot
): HomePageData {
  return useMemo(() => {
    const agents: HomePageAgent[] = snapshot.agents.map((agent) => {
      const runtime = snapshot.runtime[agent.id];
      const meta = runtime ? STATE_METAS[runtime.status] : null;
      const runningTaskCount = agent.tasks.filter((task) => task.status === 'running').length;

      return {
        id: agent.id,
        slot: agent.slot,
        name: agent.name,
        codename: agent.codename,
        avatar: agent.avatar,
        accent: agent.accent,
        status: runtime?.status ?? 'idle',
        statusName: meta?.name ?? '待命',
        expression: meta?.expression ?? '(-_-)',
        quote: runtime?.quote ?? '暂无状态台词',
        taskCount: agent.tasks.length,
        runningTaskCount,
        energy: runtime?.energy ?? 0,
        stress: runtime?.stress ?? 0,
        temperature: runtime?.temperature ?? 0,
        lastInteractionAt: runtime?.lastInteractionAt ?? snapshot.updatedAt
      };
    });

    const totalTaskCount = snapshot.agents.reduce((total, agent) => total + agent.tasks.length, 0);
    const runningTaskCount = snapshot.agents.reduce(
      (total, agent) => total + agent.tasks.filter((task) => task.status === 'running').length,
      0
    );
    const activeLaneCount = ORCHESTRATION_STATUS.lanes.filter((lane) => lane.state === 'active').length;
    const blockedLaneCount = ORCHESTRATION_STATUS.lanes.filter((lane) => lane.state === 'blocked').length;
    const standbyLaneCount = ORCHESTRATION_STATUS.lanes.filter((lane) => lane.state === 'standby').length;
    const acceptedConnectorCount = CONNECTOR_POLICY.connectors.filter(
      (connector) => connector.approvalStatus === 'accepted' && connector.enabledByDefault
    ).length;
    const blockedConnectorCount = CONNECTOR_POLICY.connectors.length - acceptedConnectorCount;
    const latestMessage = snapshot.messages[0] ?? null;
    const onlineSessionCount = getCombinedOnlineSessionCount(agentTruth, codexHost);

    const runtimeDetail = [
      agentTruth.runtime.availability,
      agentTruth.runtime.mode,
      agentTruth.runtime.source,
      `观测 ${formatDateTime(agentTruth.runtime.observedAt)}`,
      agentTruth.runtime.reason
    ].filter(Boolean).join(' · ');
    const metrics: HomePageMetric[] = [
      {
        id: 'agents',
        label: '已配置工位',
        value: `${agentTruth.summary.configuredCount}`,
        detail: `${runningTaskCount} 个本地应用任务运行中 · 不计入在线`,
        tone: 'green',
        icon: 'activity'
      },
      {
        id: 'online-sessions',
        label: '真实在线 Session',
        value: `${onlineSessionCount}`,
        detail: codexHost.clientRunning
          ? `Codex Desktop 已开启 · ${codexHost.activeSessionCount} 个活动对话 · ${runtimeDetail}`
          : runtimeDetail,
        tone: onlineSessionCount > 0
          ? 'green'
          : agentTruth.runtime.mode === 'simulated' || agentTruth.runtime.availability !== 'available'
            ? 'orange'
            : 'blue',
        icon: 'activity'
      },
      {
        id: 'connectors',
        label: 'Connector 默认策略',
        value: `${acceptedConnectorCount}/${CONNECTOR_POLICY.connectors.length}`,
        detail: blockedConnectorCount > 0
          ? `${blockedConnectorCount} 个策略未默认放行`
          : '策略均默认放行 · 非运行探针',
        tone: blockedConnectorCount > 0 ? 'red' : 'green',
        icon: 'plug'
      },
      {
        id: 'event',
        label: '本地快照事件',
        value: latestMessage?.type ?? 'idle',
        detail: latestMessage?.title ?? '暂无事件',
        tone: latestMessage ? toneForMessage(latestMessage.type) : 'violet',
        icon: 'bell'
      }
    ];

    return {
      agents,
      metrics,
      runningTaskCount,
      totalTaskCount,
      activeLaneCount,
      blockedLaneCount,
      standbyLaneCount,
      connectorCount: CONNECTOR_POLICY.connectors.length,
      acceptedConnectorCount,
      blockedConnectorCount,
      onlineSessionCount,
      runtimeAvailability: agentTruth.runtime.availability,
      runtimeMode: agentTruth.runtime.mode,
      runtimeSource: agentTruth.runtime.source,
      runtimeObservedAt: agentTruth.runtime.observedAt,
      latestMessage
    };
  }, [agentTruth, codexHost, snapshot]);
}

function formatDateTime(value: string) {
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime())
    ? value
    : timestamp.toLocaleString('zh-CN', { hour12: false });
}

function toneForMessage(type: NonNullable<HomePageData['latestMessage']>['type']) {
  if (type === 'success') {
    return 'green';
  }

  if (type === 'warning') {
    return 'orange';
  }

  if (type === 'error') {
    return 'red';
  }

  return 'blue';
}
