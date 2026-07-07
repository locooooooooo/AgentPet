import { ArrowRight, MonitorCog, Route } from 'lucide-react';

interface CockpitEntryCardProps {
  runningTaskCount: number;
  totalTaskCount: number;
  onEnter: () => void;
}

export default function CockpitEntryCard({ runningTaskCount, totalTaskCount, onEnter }: CockpitEntryCardProps) {
  return (
    <section className="homepage-cockpit-entry" aria-label="控制舱入口">
      <div>
        <span className="homepage-kicker">
          <MonitorCog size={15} />
          Control Cockpit
        </span>
        <h2>进入控制舱</h2>
        <p>左轨看编排真源，中间保留 8 工位矩阵，右轨继续派活、看队列、查日志。</p>
      </div>
      <div className="homepage-cockpit-facts" aria-label="控制舱摘要">
        <span>
          <strong>{runningTaskCount}</strong>
          running
        </span>
        <span>
          <strong>{totalTaskCount}</strong>
          tasks
        </span>
      </div>
      <button type="button" onClick={onEnter}>
        <Route size={17} />
        进控制舱
        <ArrowRight size={17} />
      </button>
    </section>
  );
}
