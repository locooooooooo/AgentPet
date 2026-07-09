import { useMemo } from 'react';
import type { AgentSnapshot } from '../../types';
import { STATE_METAS } from '../../lib/agentCore';
import { CONNECTOR_POLICY, ORCHESTRATION_STATUS } from '../../lib/orchestrationStatus';
import type { HomePageAgent, HomePageData, HomePageMetric } from '../types';

export function useHomePageData(snapshot: AgentSnapshot): HomePageData {
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

    const metrics: HomePageMetric[] = [
      {
        id: 'agents',
        label: '在线牛马',
        value: `${snapshot.agents.length}`,
        detail: `${runningTaskCount} 头正在拉磨`,
        tone: 'green',
        icon: 'activity'
      },
      {
        id: 'lanes',
        label: '活跃 Lanes',
        value: `${activeLaneCount}`,
        detail: `${blockedLaneCount} blocked / ${standbyLaneCount} standby`,
        tone: blockedLaneCount > 0 ? 'orange' : 'blue',
        icon: 'shield'
      },
      {
        id: 'connectors',
        label: 'Connector Gate',
        value: `${acceptedConnectorCount}/${CONNECTOR_POLICY.connectors.length}`,
        detail: blockedConnectorCount > 0 ? `${blockedConnectorCount} 个仍禁用` : '全部可执行',
        tone: blockedConnectorCount > 0 ? 'red' : 'green',
        icon: 'plug'
      },
      {
        id: 'event',
        label: 'Last Event',
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
      latestMessage
    };
  }, [snapshot]);
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
