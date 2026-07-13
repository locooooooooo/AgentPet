import { Sparkles } from 'lucide-react';

interface LogoProps {
  activeLaneCount: number;
  blockedLaneCount: number;
  isDesktopRuntime: boolean;
}

export default function Logo({ activeLaneCount, blockedLaneCount, isDesktopRuntime }: LogoProps) {
  const runtimeModeLabel = isDesktopRuntime ? 'Electron 本地运行时' : '浏览器模拟预览';
  const runtimeModeDetail = isDesktopRuntime ? '未启用 Agent 心跳' : '无真实 Agent 连接';

  return (
    <div className="homepage-logo">
      <div className="homepage-logo-mark" aria-hidden="true">🐄</div>
      <div className="homepage-logo-copy">
        <span className="homepage-kicker">
          <Sparkles size={15} />
          Multi-Agent Ranch
        </span>
        <h1>桌面牧场</h1>
        <span
          className={`homepage-runtime-mode ${isDesktopRuntime ? 'desktop' : 'preview'}`}
          role="status"
          aria-label={`运行模式：${runtimeModeLabel}，${runtimeModeDetail}`}
        >
          <strong>{runtimeModeLabel}</strong>
          <small>{runtimeModeDetail}</small>
        </span>
        <p>本地工位配置、应用任务与控制面登记从这里汇总。</p>
      </div>
      <div className="homepage-logo-state" aria-label="控制面登记状态">
        <strong>{activeLaneCount}</strong>
        <span>登记 active lanes</span>
        <small>{blockedLaneCount} 登记 blocked</small>
      </div>
    </div>
  );
}
