# cockpit-refactor-p0-v0.1

⟦tag:v2|task|cockpit-refactor-p0-v0.1⟧

> **任务卡 ID**：`cockpit-refactor-p0`
> **版本**：v0.1
> **创建日期**：2026-07-03
> **创建人**：Mavis（root session `mvs_5bb811db0b244b80a142de9d522cc90a`）
> **优先级**：**P0**（2026-07-03 用户拍板提升）
> **状态**：accepted（C0-1~C0-6 已收口）
> **关联文档**：
> - 收口方案：`docs/主页面重构方案-v3.0-控制舱收口.md`（**v3.0 是本卡的实施规格**）
> - 截图诊断：`docs/桌面牧场需求-v0.3.md` §〇·quinary §末（4 个根因）
> - 卖点保护：`docs/桌面牧场需求-v0.3.md` §〇·quarter（**不可侵犯**）
> - 修订说明：`docs/桌面牧场需求-v0.3-修订说明-2026-07-03.md`

---

## 〇、任务概述

将"主页面（控制舱）UI 重构"从 4 份并行方案（v1.0 / 视觉降噪 / UIUX 深度重构 / 极简 v2.0）**收口为 v3.0** 并按 P0 优先级执行。

### 0.1 现状

- 4 份方案并行演进，互相冲突（重装饰 vs 重克制）
- v0.3 §〇·quinary §末"控制舱本身的'不简洁'问题"截图诊断 4 个根因未解
- 控制舱信息密度 100% 但视觉无主次

### 0.2 目标（P0 完成后）

- 4 份方案归档为 v3.0 唯一对外来源
- v0.3 控制舱截图诊断 4 个根因全部解决：
  1. ✅ 5 张 task card 视觉权重分级
  2. ✅ connectors + status 合并为 StatusStrip
  3. ✅ 右侧详情面板 Tab 化
  4. ✅ 中央浮窗删除或挪到右下角
- 中央 8 卡（卖点）**0 字节变动**

### 0.3 P0 范围

| 做 | 不做 |
|---|---|
| ✅ P0-1 orchestration 区视觉权重分级 | ❌ P2 暂缓（数据管道流光 / 霓虹投影 / 工位装饰物 / 拖拽派活 / 抛物线投喂）|
| ✅ P0-2 connectors + status 合并 StatusStrip | ❌ 中央 8 卡改动 |
| ✅ P0-3 右侧详情面板 Tab 化 | ❌ NiuMaAvatar / index.css / agentCore.ts 0 字节变动 |
| ✅ P0-4 中央浮窗删除或挪右下角 | ❌ Tailwind / vitest 引入 |
| ✅ v3.0 收口文档归档 4 份原方案 | ❌ AgentSnapshot schema 改 |

---

## 一、P0 子任务（按 v3.0 实施顺序）

### C0-1 v3.0 收口文档定稿（**30min**）

**改动**：
- `docs/主页面重构方案-v3.0-控制舱收口.md`（已创建）作为唯一对外来源
- `docs/主页面重构方案-v1.0.md` / `主页面视觉降噪与极简重构方案.md` / `主页面UIUX深度重构需求.md` / `主页面极简重构方案.md` 4 份加归档 banner：
  ```markdown
  > **⚠️ 本方案已被 `docs/主页面重构方案-v3.0-控制舱收口.md` 收口，本文档仅供历史参考。**
  ```

**验收**：
- v3.0 文档存在且完整
- 4 份原方案顶部有归档 banner

### C0-2 P0-1 orchestration 视觉权重分级（**2h**）

**改动**：
- `src/components/NiuMaWorkspace.tsx` orchestration 区
- `src/index.css` 新增 `.task-card-active` / `.task-card-dimmed` 类
- 当前选中 task card：`scale(1.05)` + accent 描边 + box-shadow 雾化
- 其他 4 张：`opacity: 0.55` + 灰显
- hover 任一 card → 该 card 临时高亮 + 其他 card `opacity: 0.4`

**验收**：
- 控制舱 5 张 task card 中 1 张高亮 4 张灰显
- hover 任一 card → 该 card 临时高亮
- 卖点文件 0 字节变动

### C0-3 P0-2 StatusStrip 单行合并（**2h**）

**改动**：
- 新增 `src/components/StatusStrip.tsx`
- `src/index.css` 新增 `.status-strip` / `.status-strip-dropdown`
- `src/components/NiuMaWorkspace.tsx` 替换原 connectors + status 区域
- 单行 36px：左 `connector · ready` · 中 `tasks: 12/30` · 右 `last event: 3s 前`
- hover → 下拉完整 connector card 列表

**验收**：
- StatusStrip 单行 36px
- hover 显示完整 connector 列表
- 不破坏既有 chip 颜色 / 状态语义

### C0-4 P0-3 右侧详情面板 Tab 化（**3h**）

**改动**：
- `src/components/PortraitWorkspacePanel.tsx`（或当前右侧面板组件）改为 Tab 容器
- 3 个 Tab：`下发任务` / `任务队列` / `流式日志`
- 默认 Tab = `下发任务`
- Tab 切换 = 横向 slide 动画 180ms
- 不动既有文案 / 状态码 / 按钮位置

**验收**：
- 默认显示"下发任务"Tab
- 3 个 Tab 可切换
- Tab 切换动画 ≤ 200ms
- 不破坏既有表单 / 列表 / 日志组件

### C0-5 P0-4 中央浮窗处置（**1h**）

**改动**（二选一，由用户拍板）：
- **A 删**：彻底删除中央浮窗
- **B 挪**：挪到右下角小三角按钮，hover 展开 200×200 浮层

**修改**：
- `src/components/NiuMaWorkspace.tsx` 中央浮窗位置/形态

**验收**：
- 中央 4 卡视觉无干扰
- 浮窗功能不丢失（仅位置/形态变化）

**验收状态（2026-07-04）**：
- accepted option B: `docs/orchestration/sessions/cockpit-corner-assist-2026-07-04.md`
- Electron/CDP 复测确认 `.mission-stage` count `0`，右下角小三角展开 200px 浮层，8 张工位卡仍在。

### C0-6 卖点文件 0 字节变动确认（**30min**）

**验收**：
- `git diff src/components/NiuMaAvatar.tsx` 应为空
- `git diff src/lib/agentCore.ts` 应为空
- `git diff src/index.css` 仅含新增类（.task-card-* / .status-strip*），无现有类删除/修改

**验收状态（2026-07-04）**：
- accepted: `docs/orchestration/sessions/cockpit-c0-6-accepted-2026-07-04.md`
- `src/components/NiuMaAvatar.tsx` diff is empty.
- `src/lib/agentCore.ts` contains only accepted R0-2 runtime-mapping work outside cockpit selling-point UI.
- Electron/CDP proof confirms 8 workstation cards and 8 avatar stages still render.

---

## 二、不在 P0 范围（明确推迟到 v0.4+）

| 项 | 来源方案 |
|---|---|
| 数据管道 SVG 连线 + 流光 | v1.0 §二 / UIUX 深度重构 §一.2 |
| 10px × 10px 赛博网格 + 霓虹投影 | UIUX 深度重构 §一.1 |
| 工位装饰物（排障扳手 / 木鱼 / 躺椅）| UIUX 深度重构 §一.1 |
| 拖拽派活（任务卡片 → 工位）| v1.0 §四.2 / UIUX 深度重构 §二.1 |
| 抛物线投喂（☕🥧 飞入工位）| v1.0 §四.1 / UIUX 深度重构 §二.2 |
| 终端日志全屏切换 | UIUX 深度重构 §三.2 |

---

## 三、P0 验收基线

### 3.1 自动验收

```bash
npm run lint && npm run build              # 0 错
npm run orchestration:check                # 23+ 张卡一致（含本卡 + ranch-real-integration-p0）
git diff src/components/NiuMaAvatar.tsx    # 应为空
git diff src/lib/agentCore.ts              # 应为空
git diff src/index.css                     # 仅新增类
```

### 3.2 视觉对比（vs v0.3 §〇·quinary §末 4 根因）

| 根因 | P0 完成后 |
|---|---|
| ① task card 信息量等价 | ✅ 视觉权重分级（1 高亮 + 4 灰显）|
| ② connectors / status 两排并列 | ✅ StatusStrip 单行 36px |
| ③ 右侧详情面板堆叠 | ✅ Tab 切换（3 Tab）|
| ④ 中央区 4 卡 + 1 浮窗 | ✅ 浮窗删除或挪右下角 |

### 3.3 页面安静度（自评）

| 维度 | v0.3 现状 | P0 后目标 |
|---|---|---|
| 任务卡片视觉权重 | 5 等价 | 1 主 + 4 副 |
| 顶部状态区高度 | ~80px | 36px |
| 右侧面板信息密度 | 8 块堆叠 | Tab 分层（每次 1 屏）|
| 中央干扰元素 | 浮窗 | 删除或挪右下角 |

---

## 四、P0 工时汇总

| 子任务 | 工时 | 累计 |
|---|---|---|
| C0-1 v3.0 收口定稿 | 0.5h | 0.5h |
| C0-2 P0-1 视觉分级 | 2h | 2.5h |
| C0-3 P0-2 StatusStrip | 2h | 4.5h |
| C0-4 P0-3 Tab 化 | 3h | 7.5h |
| C0-5 P0-4 浮窗处置 | 1h | 8.5h |
| C0-6 卖点 0 字节确认 | 0.5h | 9h |
| **P0 总计** | **9h ≈ 1.5 个工作日** | |

---

## 五、P0 风险与回退

| 风险 | 触发 | 回退 |
|---|---|---|
| Tab 切换破坏既有右侧表单 | 用户反馈 | 保留原右侧面板布局，仅在顶部加 Tab 切换（不动表单组件）|
| StatusStrip 单行信息太少 | 用户反馈"看不到 connector card" | hover dropdown 展开完整列表 |
| P0-4 删浮窗丢失功能 | 用户找不到"批发排障"入口 | 默认 A 删 + 快捷键 Ctrl+Shift+B 唤回 |
| 中央 8 卡意外被改 | 实施误碰 | §〇·quarter 战略强制 + git diff 卖点文件 0 字节验证 |

---

## 六、orchestration 登记

- 本卡路径：`docs/orchestration/tasks/cockpit-refactor-p0-v0.1.md`
- 引用本卡的文档：
  - `docs/orchestration/index.md`（P0 任务清单）
  - `docs/orchestration/status.json`（status: pending → in_progress）
  - `docs/orchestration/sessions/daily-plan-2026-07-03.md`（今日 P0 路线）
  - `docs/orchestration/sessions/cockpit-refactor-p0-progress.md`（进度日志，初始创建）
- 完成验收后：`status: in_progress` → `accepted`；`index.md` 加入 accepted 任务清单

---

> **本任务卡状态**：accepted
> **触发实施**：用户说"开 P0-C0-2"或"开 P0-1"或类似指令
> **配套 task card**：`docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`（同步 P0 推进）
