import { BookOpenText, Info, Settings } from 'lucide-react';

interface FooterLinksProps {
  onOpenSettings: () => void;
}

export default function FooterLinks({ onOpenSettings }: FooterLinksProps) {
  return (
    <footer className="homepage-footer">
      <button type="button" onClick={onOpenSettings}>
        <Settings size={15} />
        设置
      </button>
      <a href="#homepage-docs" aria-label="查看首页设计文档">
        <BookOpenText size={15} />
        文档
      </a>
      <details>
        <summary>
          <Info size={15} />
          关于
        </summary>
        <p>Homepage UI P0 · C 华丽方案，H0-2/H0-3 实施中。</p>
      </details>
    </footer>
  );
}
