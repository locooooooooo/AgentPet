import './HomePage.css';
import type { AgentSnapshot } from '../types';
import type { AgentTruthProjection } from '../lib/agentInstanceProjection';
import AnimalOverviewCard from './components/AnimalOverviewCard';
import CockpitEntryCard from './components/CockpitEntryCard';
import FooterLinks from './components/FooterLinks';
import KeyMetricsCard from './components/KeyMetricsCard';
import Logo from './components/Logo';
import { useHomePageData } from './hooks/useHomePageData';

interface HomePageProps {
  snapshot: AgentSnapshot;
  agentTruth: AgentTruthProjection;
  onEnterCockpit: () => void;
  onFocusAnimal: (agentId: string) => void | Promise<void>;
  onOpenSettings: () => void;
}

export default function HomePage({ snapshot, agentTruth, onEnterCockpit, onFocusAnimal, onOpenSettings }: HomePageProps) {
  const data = useHomePageData(snapshot, agentTruth);
  const isDesktopRuntime = Boolean(window.niumaDesk);

  return (
    <div className="homepage-shell">
      <div className="homepage-surface" aria-hidden="true" />

      <header className="homepage-hero">
        <Logo
          activeLaneCount={data.activeLaneCount}
          blockedLaneCount={data.blockedLaneCount}
          isDesktopRuntime={isDesktopRuntime}
        />
        <CockpitEntryCard
          runningTaskCount={data.runningTaskCount}
          totalTaskCount={data.totalTaskCount}
          onEnter={onEnterCockpit}
        />
      </header>

      <main className="homepage-main">
        <section className="homepage-animals" aria-label={`${data.agents.length} 个已配置工位概览`}>
          <div className="homepage-section-head">
            <span>{data.agents.length} 个已配置工位</span>
            <h2>本地工位概览</h2>
          </div>
          <div className="homepage-animal-grid">
            {data.agents.map((agent, index) => (
              <AnimalOverviewCard
                key={agent.id}
                agent={agent}
                index={index}
                onFocus={onFocusAnimal}
              />
            ))}
          </div>
        </section>

        <section className="homepage-metrics" aria-label="Agent Session 真值、本地快照与数据来源">
          <div className="homepage-section-head">
            <span>Agent Session 真值 / 本地快照</span>
            <h2>运行数据口径</h2>
          </div>
          <div className="homepage-metric-grid">
            {data.metrics.map((metric) => (
              <KeyMetricsCard key={metric.id} metric={metric} />
            ))}
          </div>
          <div className="homepage-last-event">
            <span>本地快照事件</span>
            <strong>{data.latestMessage?.title ?? '暂无事件'}</strong>
            <p>{data.latestMessage?.content ?? '本应用任务、Connector 策略与控制面登记会在这里降级呈现。'}</p>
          </div>
        </section>
      </main>

      <FooterLinks onOpenSettings={onOpenSettings} />
    </div>
  );
}
