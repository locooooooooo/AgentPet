import './HomePage.css';
import type { AgentSnapshot } from '../types';
import AnimalOverviewCard from './components/AnimalOverviewCard';
import CockpitEntryCard from './components/CockpitEntryCard';
import FooterLinks from './components/FooterLinks';
import KeyMetricsCard from './components/KeyMetricsCard';
import Logo from './components/Logo';
import { useHomePageData } from './hooks/useHomePageData';

interface HomePageProps {
  snapshot: AgentSnapshot;
  onEnterCockpit: () => void;
  onFocusAnimal: (agentId: string) => void | Promise<void>;
  onOpenSettings: () => void;
}

export default function HomePage({ snapshot, onEnterCockpit, onFocusAnimal, onOpenSettings }: HomePageProps) {
  const data = useHomePageData(snapshot);

  return (
    <div className="homepage-shell">
      <div className="homepage-surface" aria-hidden="true" />

      <header className="homepage-hero">
        <Logo activeLaneCount={data.activeLaneCount} blockedLaneCount={data.blockedLaneCount} />
        <CockpitEntryCard
          runningTaskCount={data.runningTaskCount}
          totalTaskCount={data.totalTaskCount}
          onEnter={onEnterCockpit}
        />
      </header>

      <main className="homepage-main">
        <section className="homepage-animals" aria-label="8 动物概览">
          <div className="homepage-section-head">
            <span>8 workers</span>
            <h2>牛马工位概览</h2>
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

        <section className="homepage-metrics" aria-label="关键指标">
          <div className="homepage-section-head">
            <span>live signals</span>
            <h2>关键指标</h2>
          </div>
          <div className="homepage-metric-grid">
            {data.metrics.map((metric) => (
              <KeyMetricsCard key={metric.id} metric={metric} />
            ))}
          </div>
          <div className="homepage-last-event">
            <span>last event</span>
            <strong>{data.latestMessage?.title ?? '暂无事件'}</strong>
            <p>{data.latestMessage?.content ?? '任务、connector 和 orchestration 状态会在这里 graceful degradation。'}</p>
          </div>
        </section>
      </main>

      <FooterLinks onOpenSettings={onOpenSettings} />
    </div>
  );
}
