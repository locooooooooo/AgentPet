import { Activity, Bell, PlugZap, ShieldAlert } from 'lucide-react';
import type { HomePageMetric } from '../types';

interface KeyMetricsCardProps {
  metric: HomePageMetric;
}

export default function KeyMetricsCard({ metric }: KeyMetricsCardProps) {
  const Icon = metric.icon === 'activity'
    ? Activity
    : metric.icon === 'shield'
      ? ShieldAlert
      : metric.icon === 'plug'
        ? PlugZap
        : Bell;

  return (
    <article className={`homepage-metric-card tone-${metric.tone}`}>
      <div>
        <Icon size={19} />
        <span>{metric.label}</span>
      </div>
      <strong>{metric.value}</strong>
      <p>{metric.detail}</p>
    </article>
  );
}
