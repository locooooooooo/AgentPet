# Homepage UI P0 · Design Accepted

[PM]#homepage-ui-p0@v0.1
⟦tag:v2|session|homepage-ui-p0-design-accepted-2026-07-07⟧
loop state: standby
dispatch state: standby

date: 2026-07-07
source decision: 用户回复 `c`
accepted design: C · 华丽
design doc: `docs/orchestration/sessions/homepage-ui-p0-design-2026-07-07.md`
visual preview: `docs/orchestration/sessions/homepage-ui-p0-design-2026-07-07.html`

decision:
- 采用 C · 华丽作为 H0-2 / H0-3 实施方向。
- 默认首页为 always first：App 启动第一屏进入 HomePage。
- 视觉方向：全屏大卡片华丽展示，保留渐变背景、accent glow、玻璃拟态、圆角和大号 8 动物概览。
- 1366×768 下必须控制信息密度，关键内容在首屏内可见；如 C 视觉过密，允许局部采用 B 的信息密度收敛。

implementation gate:
- H0-1 complete and accepted.
- H0-2 may start after this card is written.
- H0-2 / H0-3 / H0-4 must keep §〇·quarter selling-point files protected:
  - `src/components/NiuMaAvatar.tsx` no diff.
  - `src/index.css` no diff.
  - `src/lib/agentCore.ts` no diff.
  - `src/components/NiuMaWorkspace.tsx` only return-home entry, no central 4x2 grid changes.

next action:
- Implement `src/homepage/**` as the new HomePage surface.
- Update `src/App.tsx` so HomePage is the startup screen.
- Add a return-home button to `src/components/NiuMaWorkspace.tsx`.
- Run H0-4 protected-file audit and visual screenshots after implementation.

summary:
- 用户已拍板 C · 华丽，H0-1 不再阻塞。
- PM proceeds to H0-2/H0-3 implementation under the forbidden-scope guard.
