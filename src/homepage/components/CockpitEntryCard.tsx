import { ArrowRight, MonitorCog, Route } from 'lucide-react';

interface CockpitEntryCardProps {
  runningTaskCount: number;
  totalTaskCount: number;
  onEnter: () => void;
}

export default function CockpitEntryCard({ runningTaskCount, totalTaskCount, onEnter }: CockpitEntryCardProps) {
  return (
    <section className="homepage-cockpit-entry" aria-label="控制舱入口">
      <div className="homepage-cockpit-entry-copy">
        <span className="homepage-kicker">
          <MonitorCog size={15} />
          Control Cockpit
        </span>
        <h2>进入控制舱</h2>
        <p>查看控制面登记、工位任务、队列与日志。</p>
      </div>
      <div className="homepage-cockpit-actions">
        <div className="homepage-cockpit-facts" aria-label="控制舱摘要">
          <span>
            <strong>{runningTaskCount}</strong>
            运行中
          </span>
          <span>
            <strong>{totalTaskCount}</strong>
            任务
          </span>
        </div>
        <button type="button" onClick={onEnter}>
          <Route size={16} />
          进控制舱
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}
