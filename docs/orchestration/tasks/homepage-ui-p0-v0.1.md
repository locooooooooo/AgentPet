# homepage-ui-p0-v0.1

[长工]#homepage-ui-design@p0
⟦tag:v2|task|homepage-ui-p0-v0.1⟧

> **任务卡 ID**：`homepage-ui-p0`
> **版本**：v0.1
> **创建日期**：2026-07-07
> **创建人**：Mavis（root session `mvs_5bb811db0b244b80a142de9d522cc90a`）
> **优先级**：**P0**（2026-07-07 用户拍板提升）
> **状态**：accepted（C · 华丽已实现并本地启动验证）
> **派工包**：`docs/orchestration/tasks/homepage-ui-p0-dispatch-v0.1.md`
> **进度卡**：`docs/orchestration/sessions/homepage-ui-p0-progress.md`
> **周计划**：`docs/orchestration/sessions/weekly-requirements-2026-07-07.md`
> **关联文档**：
> - 产品真源：`docs/桌面牧场需求-v0.3.md` + `docs/桌面牧场需求-v0.3-修订说明-2026-07-03.md`
> - 工程真源：`docs/桌面牧场工程需求-v0.2.md`
> - 开发计划：`docs/桌面牧场开发计划-v0.2.md`
> - 控制舱 v3.0 P0 收口（已 accepted）：`docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md`
> - 真实打通 P0（R0-1/2/4/5 accepted，R0-3 deferred）：`docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`
> - 7-6 C0-6 卖点保护基线：`docs/orchestration/sessions/cockpit-c0-6-accepted-2026-07-04.md`

---

## 〇、任务概述

将"App 启动第一屏"从**直接进控制舱**改造为**全新"首页" / landing 入口页**——全屏大卡片华丽展示，8 动物概览 + 控制舱入口 + 关键指标，作为多 Agent 牛马核心部门产品的对外门面与对内入口。

### 0.1 现状

- 7-6 闭环后，`src/App.tsx` 启动后直接跳到控制舱（`NiuMaWorkspace.tsx` 渲染）
- 没有专门的"首页" / landing / 启动页
- 7-6 P0 完成的是控制舱内部 v3.0 重构（C0-1~C0-6 accepted），**本 P0 是"全新增量"不是改造**
- 桌面牧场 v0.3 视觉已落档（7-3 修订 B 路径实施），但作为分散小窗存在，缺少统一门面

### 0.2 目标（P0 完成后）

- **App 启动后第一屏 = 首页 / landing-style overview**
- **视觉风格**：全屏大卡片华丽展示（参考用户已表达"全屏大卡片华丽展示"偏好）
- **核心内容**（L1 / L2 / L3 三级，沿用 v0.3 §〇·quinary 严格 3 级约束）：
  - L1 品牌头：桌面牧场 logo（emoji + 文字 logo）+ 一句话定位
  - L2 8 动物概览卡片：点开 → 进牧场对应动物
  - L2 控制舱入口卡片：点开 → 进控制舱
  - L2 关键指标卡片组：任务数 / connector 状态 / last event
  - L3 折叠区：设置 / 文档 / 关于（默认隐藏，hover / click 展开）
- **用户拍板点**（长工交付前由用户拍）：
  - 首页是"always first"（每次启动都进首页）还是"dismissable intro"（可关闭，下次启动不再展示）
  - 3 套设计稿（轻量 / 中等 / 华丽）选哪一套

### 0.3 P0 范围

| 做 | 不做 |
|---|---|
| ✅ 新建 `src/homepage/HomePage.tsx`（独立组件，不复用 NiuMaWorkspace 任何结构）| ❌ 不改控制舱 `NiuMaWorkspace` 中央 4×2 grid（**§〇·quarter 卖点保护**）|
| ✅ 新建 `src/homepage/HomePage.css`（独立样式，不污染 `src/index.css`）| ❌ 不改 `NiuMaAvatar.tsx` / `index.css` 中央 8 卡样式 / `agentCore.ts`（**§〇·quarter 卖点保护**）|
| ✅ `src/App.tsx` 启动后默认进 `<HomePage />` + "进控制舱" 跳转按钮 | ❌ 不改控制舱 v3.0 视觉（C0-1~C0-6 已 accepted）|
| ✅ 8 动物概览卡片 + 控制舱入口卡片 + 关键指标卡片 | ❌ 不改 `src/ranch/**` 桌面牧场文件（与本 P0 独立）|
| ✅ 关键指标数据全读现有 snapshot / connector 状态 | ❌ 不改 `connectors.json` machine-gate |
| ✅ 桌面牧场设置项从首页可进入 | ❌ 不接外部 agent CLI（codex / trae / qoder）|
| ✅ README 加首页占位说明 + 启动流程图 | ❌ 不改 `package.json` name / productName / description（M4 已完成）|
| ✅ 不引 Tailwind / vitest | ❌ 不引新依赖 |
| | ❌ 不动 `electron/main.ts` / `electron/preload.ts`（不在本 P0 范围）|
| | ❌ 不动 `icon/**`（不在本 P0 范围）|

---

## 一、P0 子任务（按实施顺序）

### H0-1 设计稿 + 信息架构（1~2h，长工细化 + PM 拍板）

**改动**：
- 长工出 **3 套设计稿**（轻量 / 中等 / 华丽），用户在 P0 验收前拍
- 信息架构：L1 / L2 / L3 三级（沿用 v0.3 §〇·quinary 严格 3 级约束）

**验收**：
- 3 套设计稿归档 `docs/orchestration/sessions/homepage-ui-p0-design-2026-07-XX.md`（含 ASCII wireframe + 配色方案 + 关键文案）
- 用户拍板后写 `homepage-ui-p0-design-accepted-2026-07-XX.md`

### H0-2 全新 HomePage 组件 + 路由（3~4h）

**改动**：
- `src/homepage/HomePage.tsx`：独立组件，不复用 NiuMaWorkspace 任何结构
- `src/homepage/HomePage.css`：独立样式，不污染 `src/index.css`
- `src/homepage/hooks/useHomePageData.ts`：从 snapshot / connectors / last event 拉数据（graceful degradation：缺失字段显示空态）
- `src/homepage/components/` 下的子组件：Logo / AnimalOverviewCard / CockpitEntryCard / KeyMetricsCard / FooterLinks 等
- `src/App.tsx`：启动后默认进 `<HomePage />`，加"进控制舱"跳转按钮
- `src/components/NiuMaWorkspace.tsx`：仅加"返回首页"按钮（**不**改中央 4×2 grid）

**验收**：
- 启动后第一屏是 HomePage（不直接进控制舱）
- "进控制舱" / "进牧场" 跳转正常
- 8 动物概览卡片显示完整（8 张）
- 关键指标显示（任务数 / connector 状态 / last event）实时更新
- 数据缺失时显示空态，不报错

### H0-3 视觉打磨（2~3h，全屏大卡片华丽展示）

**改动**：
- 大背景：渐变 / accent glow / 拟物化阴影
- 卡片：圆角 / 玻璃拟态 / hover 动画（≤ 200ms）
- L1 logo：高清 emoji + 文字 logo（华文楷体 / 思源黑体 fallback system font）
- 关键指标卡片：数字 + 图标 + 颜色编码（红=失败 / 黄=进行中 / 绿=成功）

**验收**：
- `npm.cmd run lint && npm.cmd run build` 0 错
- 桌面分辨率 1920×1080 视觉无破图
- 笔电分辨率 1366×768 视觉无破图（关键内容在 fold above）
- 截图归档 `docs/orchestration/sessions/homepage-ui-p0-visual-2026-07-XX.png`（至少 3 张：1920×1080 桌面 / 1366×768 笔电 / hover 状态）

### H0-4 卖点文件 0 字节变动确认（0.5h）

**验收**：
- `git diff src/components/NiuMaAvatar.tsx` 应为空
- `git diff src/index.css` 应为空（中央 8 卡样式不动）
- `git diff src/lib/agentCore.ts` 应为空
- `git diff src/components/NiuMaWorkspace.tsx` 仅含"返回首页"按钮（如有）
- 视觉对比 v0.3 控制舱 = 8 张工位卡 + StatusStrip + Tab 化右侧面板 完整保留

**验收状态**：长工交付时附 evidence card `homepage-ui-p0-c0-6-style-2026-07-XX.md`

---

## 二、不在 P0 范围（明确推迟）

| 项 | 推迟到 |
|---|---|
| 接外部 agent CLI（codex / trae / qoder）| v0.4+ connector 扩展 |
| 引入 Tailwind | 永远不做 |
| 引入 vitest / 其他测试框架 | 永远不做 |
| 修改 `multi-agent-niuma` 项目代号 / `AgentSnapshot` 顶层 schema | 永远不做 |
| 改控制舱 / 牧场核心结构 | 永远不做（C0-6 卖点保护）|
| 多语言 / 国际化 | v0.5+ |
| 主题切换（dark / light / accent 切换）| v0.5+ |
| 首页内动画（页面切换 / 卡片翻转 / 3D 翻牌）| v0.5+ |
| 移动端响应式（Electron 不支持）| 永远不做 |
| 用户自定义首页布局（拖拽 / 隐藏卡片）| v0.5+ |
| 首页 A/B 测试 / 数据埋点 | v0.5+ |

---

## 三、P0 验收基线

### 3.1 自动验收

```bash
npm.cmd run lint                                          # 0 错
npm.cmd run build                                         # 通过
npm.cmd run orchestration:check                           # 54+ 张卡一致（含本卡）
npm.cmd run orchestration:preflight                       # pass
npm.cmd run orchestration:connector-safety                # pass
git diff src/components/NiuMaAvatar.tsx                   # 应为空
git diff src/index.css                                    # 应为空（中央 8 卡样式）
git diff src/lib/agentCore.ts                            # 应为空
git diff src/components/NiuMaWorkspace.tsx                # 仅"返回首页"按钮（如有）
```

### 3.2 视觉验收

| 测试 | 期望 |
|---|---|
| 启动 App | 第一屏 = HomePage（不直接进控制舱）|
| 桌面分辨率 1920×1080 | 视觉无破图 |
| 笔电分辨率 1366×768 | 视觉无破图（关键内容在 fold above）|
| 8 动物卡片 | 8 张完整显示，点开进牧场对应动物 |
| 控制舱入口卡片 | 1 张，点开进控制舱 |
| 关键指标 | 任务数 / connector 状态 / last event 实时更新 |
| "进控制舱" 按钮 | 跳转回控制舱 |
| 桌面牧场设置项 | 从首页可进入（沿用现有 ranch-prefs bridge）|
| hover 卡片 | 视觉反馈 ≤ 200ms |
| 数据缺失（如 snapshot 无 last event）| graceful degradation 显示空态，不报错 |

### 3.3 卖点保护验收

- 中央 4×2 grid（8 卡）= 0 字节变动
- `NiuMaAvatar.tsx` = 0 字节变动
- `index.css` 中央 8 卡样式 = 0 字节变动
- `agentCore.ts` = 0 字节变动
- `NiuMaWorkspace.tsx` 仅增"返回首页"按钮
- 截图对比 v0.3 控制舱视觉 = 一致

---

## 四、P0 工时汇总

| 子任务 | 工时 | 累计 |
|---|---|---|
| H0-1 设计稿 + 信息架构 | 1~2h | 1~2h |
| H0-2 HomePage 组件 + 路由 | 3~4h | 4~6h |
| H0-3 视觉打磨 | 2~3h | 6~9h |
| H0-4 卖点 0 字节确认 | 0.5h | 6.5~9.5h |
| **P0 总计** | **6.5~9.5h ≈ 1.5 个工作日（长工）** | |

---

## 五、P0 风险与回退

| 风险 | 触发 | 回退 |
|---|---|---|
| "全屏大卡片华丽展示"被吐槽"过度装饰" | 用户反馈 | 切到 H0-1 的"轻量"设计稿（已备案）|
| 启动跳 HomePage 引入额外 200ms 延迟 | 性能 profile | 加 lazy load / 预渲染 / 骨架屏 |
| 8 动物卡片过多显得拥挤 | 视觉 review | 折叠 / 横滑 carousel / 2×4 网格 |
| 关键指标数据源缺失 | snapshot 没有 last event | graceful degradation 显示空态 |
| 卖点文件被无意改动 | 实施误碰 | §〇·quarter 卖点保护 + git diff 强制 |
| 长工交付后用户对设计稿不满意 | H0-1 拍板后 H0-2 实施发现风格偏差 | 重启一轮 H0-1 出新方案（增加 ≤ 1h）|
| 首页 / 控制舱路由切换不流畅 | 性能 / 视觉断裂感 | 加 transition 动画 ≤ 300ms |

---

## 六、orchestration 登记

- 本卡路径：`docs/orchestration/tasks/homepage-ui-p0-v0.1.md`
- 派工包路径：`docs/orchestration/tasks/homepage-ui-p0-dispatch-v0.1.md`
- 进度卡路径：`docs/orchestration/sessions/homepage-ui-p0-progress.md`
- 引用本卡的文档：
  - `docs/orchestration/index.md`（P0 任务清单 + tracked business cards）
  - `docs/orchestration/status.json`（`p0Cards[0]` + `roles[+]` + `lanes[+]`）
  - `docs/orchestration/sessions/weekly-requirements-2026-07-07.md`（P0-0 段）
- 完成验收后：`status: in_progress` → `accepted`；`index.md` 加入 accepted 任务清单；`status.json` p0Cards 状态切换

---

> **本任务卡状态**：accepted（H0-1/H0-2/H0-3/H0-4 已完成；证据见 `docs/orchestration/sessions/homepage-ui-p0-c0-6-style-2026-07-07.md`）
> **触发实施**：用户已拍 `c`，C · 华丽方案已落地；后续 commit/push 需用户另行授权
> **配套 task card**：`docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md`（已 accepted，本卡不冲突）
> **配套 task card**：`docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`（in_progress，R0-3 deferred，本卡独立）
