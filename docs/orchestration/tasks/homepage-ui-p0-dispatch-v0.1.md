# Homepage UI P0 Long-Worker Dispatch Package

[长工]#homepage-ui-design@v0.1
⟦tag:v2|task|homepage-ui-p0-dispatch-v0.1⟧

objective:
- 设计并实施全新 HomePage 组件作为 App 启动第一屏，全屏大卡片华丽展示，8 动物概览 + 控制舱入口 + 关键指标。
- 在 v0.3 控制舱 + 桌面牧场视觉基线之上做"全新增量"，**不动任何卖点文件**（§〇·quarter 卖点保护）。
- 输出 3 套设计稿（轻量 / 中等 / 华丽），由用户在 P0 验收前拍板。

dispatch state:
- accepted; H0-1 design drafts accepted as C gorgeous, H0-2/H0-3 implemented, H0-4 protected-file audit passed.
- Long-worker thread id：`mvs_237b464ebc78403d953b9ab93b398ab8`
- 启动方式：PM 已在 root session 跑 `mavis session new general --from root --title "homepage-ui-design" --workspace "E:\多agent牛马"`，初始 prompt 限定长工先做 H0-1 三套设计稿，不写代码、不碰 forbidden scope、不跑 Git。
- 模型建议：`gpt-5.4` + `xhigh`（参考 ranch-m4 long-worker 配置）

truth sources:
- 任务卡：`docs/orchestration/tasks/homepage-ui-p0-v0.1.md`
- 进度卡：`docs/orchestration/sessions/homepage-ui-p0-progress.md`（accepted）
- 产品真源：`docs/桌面牧场需求-v0.3.md` + `docs/桌面牧场需求-v0.3-修订说明-2026-07-03.md`
- 工程真源：`docs/桌面牧场工程需求-v0.2.md`
- 开发计划：`docs/桌面牧场开发计划-v0.2.md`
- 控制舱 v3.0 P0 收口（已 accepted）：`docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md` + `docs/orchestration/sessions/cockpit-refactor-p0-progress.md`
- 真实打通 P0（R0-1/2/4/5 accepted）：`docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md` + `docs/orchestration/sessions/ranch-real-integration-p0-progress.md`
- 7-6 C0-6 卖点保护基线：`docs/orchestration/sessions/cockpit-c0-6-accepted-2026-07-04.md`
- 周计划：`docs/orchestration/sessions/weekly-requirements-2026-07-07.md`

active write scope:
- 新建 `src/homepage/HomePage.tsx`（独立组件，不复用 NiuMaWorkspace 任何结构）
- 新建 `src/homepage/HomePage.css`（独立样式，**不污染** `src/index.css`）
- 新建 `src/homepage/hooks/useHomePageData.ts`（从 snapshot / connectors / last event 拉数据 + graceful degradation）
- 新建 `src/homepage/components/Logo.tsx`（桌面牧场 logo + 文字 logo）
- 新建 `src/homepage/components/AnimalOverviewCard.tsx`（8 动物概览卡片）
- 新建 `src/homepage/components/CockpitEntryCard.tsx`（控制舱入口卡片）
- 新建 `src/homepage/components/KeyMetricsCard.tsx`（任务数 / connector 状态 / last event 关键指标）
- 新建 `src/homepage/components/FooterLinks.tsx`（L3 折叠区：设置 / 文档 / 关于）
- 新建 `src/homepage/types.ts`（HomePage 内部类型）
- 新建 `src/homepage/index.ts`（barrel export）
- 改 `src/App.tsx`（启动默认进 `<HomePage />`，加"进控制舱"跳转按钮）
- 改 `src/components/NiuMaWorkspace.tsx`（仅加"返回首页"按钮，**不**改中央 4×2 grid）
- 改 `README.md`（加首页占位说明 + 启动流程图）
- 改 `docs/桌面牧场需求-v0.3.md` §〇·quinary 段（加首页视觉规范段）
- 新建 `docs/orchestration/sessions/homepage-ui-p0-design-2026-07-XX.md`（3 套设计稿 ASCII wireframe + 配色方案 + 关键文案）
- 新建 `docs/orchestration/sessions/homepage-ui-p0-design-accepted-2026-07-XX.md`（用户拍板记录）
- 新建 `docs/orchestration/sessions/homepage-ui-p0-visual-2026-07-XX.png`（视觉验收截图，至少 3 张）
- 新建 `docs/orchestration/sessions/homepage-ui-p0-c0-6-style-2026-07-XX.md`（H0-4 卖点 0 字节确认 evidence）

forbidden scope:
- ❌ 不改 `src/components/NiuMaAvatar.tsx`（**§〇·quarter 卖点保护**）
- ❌ 不改 `src/index.css`（**§〇·quarter 卖点保护**）
- ❌ 不改 `src/lib/agentCore.ts`（**§〇·quarter 卖点保护**）
- ❌ 不改 `src/components/NiuMaWorkspace.tsx` 中央 4×2 grid（**§〇·quarter 卖点保护**）
- ❌ 不改 `src/ranch/**` 桌面牧场文件（与本 P0 独立，ranch-m5 是 P1 候选）
- ❌ 不改 `electron/main.ts` / `electron/preload.ts`（不在本 P0 范围）
- ❌ 不改 `docs/orchestration/connectors.json`（不在本 P0 范围）
- ❌ 不改 `package.json` name / productName / description（M4 已完成）
- ❌ 不改 `icon/**`（不在本 P0 范围）
- ❌ 不改 `vite.config.ts`（除非新 homepage 入口需要新增 HTML，否则不要动）
- ❌ 不引 Tailwind / vitest / 其他新依赖
- ❌ 不接外部 agent CLI（codex / trae / qoder）
- ❌ 不跑 `git init` / `git remote add` / `git fetch` / `git status` / `git stage` / `git commit` / `git push` / `git reset` / `git clean` / 文件删除（**PM 负责收口 commit + push**）
- ❌ 不创建重复长工 thread
- ❌ 不动 status.json / index.md 控制面（PM 负责）
- ❌ 不动其他 task cards / session cards

implementation acceptance:
- 长工 callback 列出每个 touched file + 行级目的
- `npm.cmd run lint` 0 错
- `npm.cmd run build` 通过
- `npm.cmd run orchestration:check` 通过（54+ 张卡，含本卡 + dispatch + 任务卡）
- `npm.cmd run orchestration:preflight` 通过
- `npm.cmd run orchestration:connector-safety` 通过
- Search 确认 `"enabledByDefault": true` / `"approvalStatus": "accepted"` 仍为 0
- `git diff src/components/NiuMaAvatar.tsx` = empty
- `git diff src/index.css` = empty
- `git diff src/lib/agentCore.ts` = empty
- `git diff src/components/NiuMaWorkspace.tsx` = 仅含"返回首页"按钮
- 视觉验收：
  - 启动后第一屏 = HomePage
  - 桌面 1920×1080 视觉无破图
  - 笔电 1366×768 视觉无破图
  - 8 动物卡片显示 + 点击进牧场对应动物
  - 控制舱入口卡片 + 点击进控制舱
  - 关键指标实时更新
  - 数据缺失 graceful degradation 不报错
- 负向 review 确认 forbidden scope 未触动
- 3 套设计稿归档 + 用户拍板 evidence
- 视觉截图 ≥ 3 张归档
- H0-4 卖点 0 字节 evidence 卡归档

blockers:
- H0-4 完成前，受保护卖点文件必须保持禁区验收通过
- 关键指标数据源（snapshot.lastEvent）当前可能为 undefined，需 graceful degradation 处理
- 桌面牧场 ranch-m5（M5 implementation）尚未派工，本 P0 独立推进，但首页"8 动物概览卡片"复用 ranch 数据时需确认 ranch snapshot 稳定

next action:
- **长工** `mvs_237b464ebc78403d953b9ab93b398ab8` 读本卡 + 任务卡 + 全部真源。
- **长工** H0-1 已出 3 套设计稿（轻量 / 中等 / 华丽）并归档 `homepage-ui-p0-design-2026-07-07.md`，配套预览 `homepage-ui-p0-design-2026-07-07.html`。
- **PM** 已按用户回复 `c` 写入 `homepage-ui-p0-design-accepted-2026-07-07.md`。
- H0-2 / H0-3 已实施（写代码 + 视觉打磨，按 C · 华丽）
- H0-4 卖点 0 字节确认已归档：`docs/orchestration/sessions/homepage-ui-p0-c0-6-style-2026-07-07.md`
- PM 已本地启动 `npm.cmd run dev`，用户可在 `http://127.0.0.1:5173/` 查看。
- commit/push 由用户授权后另行处理。

summary:
- Long-worker thread `mvs_237b464ebc78403d953b9ab93b398ab8` 已启动并交付 H0-1 三套设计稿；用户已拍板 C · 华丽；H0-2/H0-3/H0-4 已完成并本地启动验证。
- 写 scope 包含 src/homepage/** 全新增量 + App.tsx / NiuMaWorkspace.tsx 跳转按钮 + README + docs 视觉规范。
- forbidden scope 严格保护 §〇·quarter 卖点文件（NiuMaAvatar / index.css / agentCore.ts / 中央 4×2 grid）。
- 预计长工实施 6.5~9.5h（1.5 个工作日）+ 用户拍板设计稿 0.5h。
- 落地后桌面牧场 v0.3 + 控制舱 v0.3 视觉 + 首页 v1.0 三个独立 UI 单元协同工作。
