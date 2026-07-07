import { Sparkles } from 'lucide-react';

interface LogoProps {
  activeLaneCount: number;
  blockedLaneCount: number;
}

export default function Logo({ activeLaneCount, blockedLaneCount }: LogoProps) {
  return (
    <div className="homepage-logo">
      <div className="homepage-logo-mark" aria-hidden="true">🐄</div>
      <div className="homepage-logo-copy">
        <span className="homepage-kicker">
          <Sparkles size={15} />
          Multi-Agent Ranch
        </span>
        <h1>桌面牧场</h1>
        <p>把活的 AI Agent 关进牧场，调度、监督、验收都从这里开始。</p>
      </div>
      <div className="homepage-logo-state" aria-label="当前编排状态">
        <strong>{activeLaneCount}</strong>
        <span>active lanes</span>
        <small>{blockedLaneCount} blocked</small>
      </div>
    </div>
  );
}
