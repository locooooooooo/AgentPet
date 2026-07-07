# weekly-requirements-2026-07-07

[PM]#weekly-requirements@2026-07-07
⟦tag:v2|session|weekly-requirements-2026-07-07⟧
⟦tag:v2|session|weekly-requirements-w27⟧

loop state: active
dispatch state: active

> **计划周期**：2026-07-07 ~ 2026-07-13（W27 · 周二起算）
> **创建人**：Mavis（root session `mvs_5bb811db0b244b80a142de9d522cc90a`）
> **关联计划**：`docs/orchestration/sessions/daily-closeout-2026-07-06.md`（7-6 PM-direct 闭环基线）
> **关联看板**：`docs/orchestration/index.md` + `docs/orchestration/status.json`（含 7-6 closeout 后的状态面）
> **关联任务卡**：
> - `docs/orchestration/tasks/ranch-real-integration-p0-v0.1.md`（R0-3 deferred，本周必须拍）
> - `docs/orchestration/tasks/ranch-window-v0.1.md` + `ranch-status-script-v0.1.md` + `ranch-personality-v0.1.md`（M5 verification only，待派 v0.2 实施）
> - `docs/orchestration/tasks/ranch-pointer-smoke-v0.2.md` + `ranch-pointer-smoke-manual-evidence-v0.2.md`（透明 pointer blocker）
> - `docs/orchestration/tasks/connector-policy-v0.1.md` + `connector-acceptance-review-v0.1.md`（外部 connector 决策）
> - `docs/orchestration/tasks/daily-decision-queue-2026-07-02.md`（PM 决策队列）

---

## 〇、本周上下文基线

7-6 闭环 5 commit（`fa9e08b` / `e095764` / `3e91d4c` / `3aa30f7` / `42e3f7f` / `9612151`），全部 push 到 `https://github.com/locooooooooo/AgentPet.git`；桌面牧场 v0.3 视觉 smoke 通过；控制舱 P0 C0-1~C0-6 accepted；R0-1/2/4/5 accepted、R0-3 connector enablement 决策 deferred；ranch-m4 v0.2 summarized；3 张 M5 verification 卡（window/status-script/personality）summarized 但**仅有 evidence summary，缺真实实施 v0.2**。

**当前 stale 段**：2026-07-07 PM sync 已将 `status.json` + `index.md` blocker wording 对齐到当日事实：Git post-push 过期项删除；connector 改为 Codex draft/pending/discovery-only、Trae/Qoder command-empty placeholders；live-subagents 改为等待 quota 复查路径；pointer smoke 改为 Windows MCP Snapshot 捕获路线已识别但完整指针输入证据未跑。

**当前可立即用的产物**：`E:\多agent牛马\release\desktop-ranch-win-unpacked\桌面牧场.exe`（235.7 MB，7-6 编译产物，v0.3 视觉验收 OK）。

---

## 一、本周 P0（必须本周拍 / 必解，**4 件**）

> **2026-07-07 11:07 增补 P0-0**：用户拍"将首页的 UI 设计提到 P0 上，单独开分工去做"（scope = 全新首页 / landing / 启动页；worker = 长工），本节追加 P0-0 段；本卡 P0 候选由 3 件升至 4 件。

### P0-0 · 全新首页 UI 设计 P0 · 6.5~9.5h（长工）· accepted

**问题**：7-6 闭环后，App 启动直接进控制舱；没有专门的"首页" / landing / 启动页。用户希望开 P0 全屏大卡片华丽展示风格首页 + 独立长工通道。

**任务卡**：`docs/orchestration/tasks/homepage-ui-p0-v0.1.md`
**长工派工包**：`docs/orchestration/tasks/homepage-ui-p0-dispatch-v0.1.md`
**进度卡**：`docs/orchestration/sessions/homepage-ui-p0-progress.md`

**改动**（长工实施）：
- 新建 `src/homepage/HomePage.tsx` + `HomePage.css` + `hooks/useHomePageData.ts` + 5 个子组件（Logo / AnimalOverviewCard / CockpitEntryCard / KeyMetricsCard / FooterLinks）
- 改 `src/App.tsx`（启动默认进 HomePage）
- 改 `src/components/NiuMaWorkspace.tsx`（仅增"返回首页"按钮，不动中央 4×2 grid）
- 改 `README.md`（加首页占位说明 + 启动流程图）
- 改 `docs/桌面牧场需求-v0.3.md` §〇·quinary（加首页视觉规范段）
- H0-1 出 3 套设计稿（轻量 / 中等 / 华丽）→ 用户拍板
- H0-2 / H0-3 实施 + 视觉打磨（已完成）
- H0-4 卖点文件 0 字节变动确认（已完成，证据见 `docs/orchestration/sessions/homepage-ui-p0-c0-6-style-2026-07-07.md`）

**禁止**（§〇·quarter 卖点保护）：
- ❌ 不改 `NiuMaAvatar.tsx` / `index.css` 中央 8 卡样式 / `agentCore.ts` / `NiuMaWorkspace` 中央 4×2 grid
- ❌ 不动 `src/ranch/**` / `electron/**` / `connectors.json` / `package.json` / `icon/**`
- ❌ 不引 Tailwind / vitest
- ❌ 不接外部 agent CLI
- ❌ 长工不跑 git stage / commit / push（PM 收口）

**验收**：
- `npm.cmd run lint` 0 错
- `npm.cmd run build` 通过
- `npm.cmd run orchestration:check` 通过（54+ 张卡，含本卡 + dispatch + 任务卡）
- `npm.cmd run orchestration:preflight` + `orchestration:connector-safety` 通过
- 卖点文件 `git diff` 全部 empty（NiuMaAvatar / index.css / agentCore.ts）
- `NiuMaWorkspace.tsx` 仅含"返回首页"按钮
- 视觉验收 1920×1080 + 1366×768 + hover 状态 ≥ 3 张截图
- 3 套设计稿 + 用户拍板 evidence
- PM 收口 1 commit + push

**当前状态**：任务卡 + 派工包 + 进度卡 + 控制面同步已落档；长工 thread `mvs_237b464ebc78403d953b9ab93b398ab8` 已启动并交付 H0-1 三套设计稿；用户已选择 C 华丽；H0-2/H0-3/H0-4 已完成，dev 已启动到 `http://127.0.0.1:5173/` 供用户查看。

**PM 默认执行序**：已完成启动长工 thread → H0-1 设计稿 → 用户拍板 C → H0-2/H0-3 实施 → H0-4 验收；commit/push 等待用户授权。

---

### P0-1 · 同步 stale `blocker` 字段（U2 路径）· 0.2h

**问题**：7-6 closeout 时主控只改了 `todayPlan` + `target`，漏改 `blocker`，导致 control-plane 状态面对外仍报"Git post-push 需明确确认"等过期项。

**改动**：
- `docs/orchestration/status.json` 第 27 行 `blocker` 字段：删 #5（已过期），刷 #1（外部 connector 措辞，按 R0-3 决策结果更新）、#2（live-subagents 403 改为"待 quota 复查路径"）、#4（`SetIsBorderRequired failed` 改为"transparent pointer smoke blocker，Windows MCP Snapshot 捕获路线已识别，完整指针输入验收仍待执行"），保留 #3。
- `docs/orchestration/index.md` 第 109~113 行 `blockers` 段同步对齐。
- commit + push 到 origin/main（commit message：`chore(orchestration): 同步 blocker 字段至 7-7 事实`）。

**验收**：
- `npm.cmd run orchestration:check` pass。
- `npm.cmd run orchestration:report` 输出新 blocker 段与 status.json / index.md 三处一致。
- 1 个 commit + push 成功。

**2026-07-07 PM 执行记录**：
- 已同步 `docs/orchestration/status.json` 与 `docs/orchestration/index.md` blocker wording。
- 已删除过期 Git post-push blocker。
- P0-3 清理仍等待用户完成当前游戏预览后执行，因为清理 `release-dir/win-unpacked.tmp` 需要停止 Electron。

### P0-2 · 拍 R0-3 connector enablement 决策 · 决策点（不写代码）

**问题**：`ranch-real-integration-p0-v0.1.md` 第 119~131 行 R0-3 已在 7-4 决策为 no-go/deferred，但 `status.json` 第 13~26 行 p0Cards 仍标 `in_progress`，导致 P0 卡永远挂着。3 天过去，本周必须拍。

**三个候选分支**：

| 分支 | 含义 | 后果 |
|---|---|---|
| **① 接受 Codex dry-run + enabled** | `connectors.json` Codex `approvalStatus: "accepted"` + `enabledByDefault: true`；trae/qoder 维持 placeholder | 外部 Codex 真能跑；需补 controlled dry-run 证据 + 跑 `orchestration:preflight` + `connector-safety` 双重通过 |
| ② 维持 deferred 但新开 controlled dry-run lane | Codex 仍 `pending`；新开 `ranch-real-integration-r0-3-dryrun-v0.1.md` 任务卡做 controlled dry-run 证据收集 | 干净收口 P0 卡；trae/qoder 维持 placeholder；先出证据再拍 enabled |
| ③ 全部继续 deferred | R0-3 维持 no-go；p0Card 状态保持 in_progress | P0 卡继续挂；下周再拍 |

**PM 默认建议**：**分支 ②**（最稳，不动 machine-gate 也能闭环 P0 卡；trae/qoder 缺可执行文件是 hard-blocker，强行 enabled 是给自己挖坑）。

**验收**：
- 用户拍板 ①/②/③。
- 按拍板结果更新 `ranch-real-integration-p0-v0.1.md` R0-3 段、session card（`r0-connector-decision-2026-07-04.md` 同模板续写 `r0-connector-decision-2026-07-07.md`）、status.json p0Cards 状态、connectors.json。
- 跑 `orchestration:preflight` + `orchestration:connector-safety` 通过。
- commit + push。

### P0-3 · 清 `release-dir/win-unpacked.tmp/` 嵌套文件锁 · 0.2h

**问题**：7-6 closeout §O 跳过项（`docs/orchestration/sessions/daily-closeout-2026-07-06.md` 第 73~74 行），`default_app.asar` 被占导致 `mavis-trash` / `Remove-Item -Recurse` 双双失败。

**改动**：
- 7-7 开机后先 `Stop-Process -Name electron -ErrorAction SilentlyContinue` 杀残留，再 `mavis-trash E:\多agent牛马\release-dir\win-unpacked.tmp`。
- 不再纳入任何 task card，单点动作完成即销账。

**验收**：
- `ls E:\多agent牛马\release-dir` 输出不包含 `win-unpacked.tmp/`。
- git status 工作区无新增 diff（该路径已在 `e095764` `.gitignore` 拦截范围内）。

---

## 二、本周 P1（产品价值 3~5，建议至少开 1~2 个，4 件）

### P1-1 · 派 ranch-m5 v0.2 需求准入短工 · 1.5h

**问题**：`ranch-window-v0.1.md` / `ranch-status-script-v0.1.md` / `ranch-personality-v0.1.md` 三张 v0.1 卡当前都是 **summarized（仅 verification summary）**，FR-001/005/008/009/011 真实实施 v0.2 从未派工。M5 verification 之所以能"过"是因为 v0.3 实施阶段的 L1/L2/L3 视觉收敛顺带覆盖，但**没有专门的 M5 implementation 长工交付**。

**改动**：
- 派 `[短工]#ranch-m5-requirements@v0.2`：把三张 v0.1 verification 卡升级为 v0.2 task card，明确：
  - **写 scope**：M5 真实实施边界（`src/ranch/**` + `electron/main.ts` + `src/components/NiuMaWorkspace.tsx` app-header 增量 + 控制舱 settings 联动增量）；明确**不**碰中央 4×2 grid / `NiuMaAvatar.tsx` / `index.css` / `agentCore.ts` / `icon/`。
  - **验收**：FR-001/005/008/009/011 各 1 段手工 smoke 录屏/截图 + `lint` + `build` + `orchestration:check` 三件套 0 错。
  - **P0 联动**：5 张 task card（rancher-window-v0.2 / status-script-v0.2 / personality-v0.2 / fence-pointer-v0.2 / system-notify-v0.2）开 LANE 状态。
- 短工交付后再由 PM 拍是否派 long-worker 实施。

**禁止**：
- ❌ 短工直接实施 M5（应该先写 v0.2 准入，再派 long-worker）。
- ❌ 触动 7-6 C0-6 卖点保护（中央 4×2 + NiuMaAvatar + is-hot keyframes 0 字节变动）。

**验收**：
- 新增 `docs/orchestration/tasks/ranch-m5-requirements-v0.2.md`。
- 5 张子 task card（v0.2）在 `status.json` `tasks` 数组注册。
- 1 个 commit + push。

### P1-2 · 透明 ranch pointer smoke blocker 复查 · 1h 调查 + 1~2h 实施

**问题**：`ranch-pointer-smoke-v0.2.md` 第 53~54 行记录的 `SetIsBorderRequired failed: 不支持此接口 (0x80004002)` 阻塞了 FR-001/008/011 桌面 mode 的 pointer smoke 自动化验证；PowerShell `CopyFromScreen` 7-6 已绕过，但 P0-1 同步后会留待"实施替代捕获路线"。

**调查路线（1h）**：
1. 优先尝试 Electron `webContents.capturePage()`（走 CDP，不走 OS 截屏 API）→ 写一个 `scripts/ranch-pointer-capture.mjs` 验证。
2. 备选：`Win32 PrintWindow`（`user32.dll!PrintWindow` + `PW_RENDERFULLCONTENT`）。
3. 备选：临时改牧场窗口为 non-transparent（先跑通再回头）。

**实施（1~2h）**：
- 任一路线跑通后，把 `ranch-pointer-smoke-v0.2.md` 第 32~41 行 verification route 改写（保留 manual + alternate 双路径），新增电子证据归档规则。
- 跑 `ranch-pointer-smoke-manual-evidence-v0.2.md` 第 26~37 行 evidence table（用新捕获路线填 `pass`）。

**验收**：
- 新捕获路线脚本可重复执行；`SetIsBorderRequired failed` 不再出现。
- 至少 1 个 evidence row 从 `pending` → `pass`。
- 1 个 commit + push。

**2026-07-07 调查记录**：
- 未新增脚本，先用现有 Windows MCP 桌面能力调查捕获路线。
- Windows MCP `Snapshot` 已观察到透明 `桌面牧场` 窗口和 `桌面牧场 · 控制舱`，没有触发 `SetIsBorderRequired failed`。
- 新证据卡：`docs/orchestration/sessions/ranch-pointer-smoke-investigation-2026-07-07.md`。
- 完整 click-through / double-click / right-click / floating drag / edge dock 指针验收未跑；当前用户正在看游戏，不中断预览。

### P1-3 · Git post-push log ignore 决策 · 0.5h

**问题**：`git-manager-agentpet-2026-07-02.md` + `git-staging-review-agentpet-v0.1.md` 挂着；7-6 e095764 `.gitignore` 已拦截 dev runtime 日志 + release-dir + 验收截图，**剩下 log / staging 决策**需要你拍：
- ① 推 main 即可（现状）。
- ② 加 pre-commit / pre-push hook 自动清（防 `tmp-*.png` / `npm-debug.log` 漏拦截）。
- ③ 现状保留，每周 manual 巡检。

**PM 默认建议**：**① 推 main 即可**——e095764 `.gitignore` 已收掉大头，hook 维护成本高于收益。

**验收**：
- 用户拍板 ①/②/③。
- 按拍板结果更新 `git-staging-review-agentpet-v0.1.md` §next action。
- 若选 ②，新增 `scripts/pre-push-clean.sh` / `.husky/pre-push`。
- 1 个 commit + push（如有代码变更）。

### P1-4 · PM-direct 工作流 v2 改造（连根拔 connector 阻塞）· 2h

**问题**：3 个 connector（codex / trae / qoder）当前都卡在 machine-gate 拍板，trae/qoder 永久 placeholder 是 hard-blocker，codex 缺 controlled dry-run 证据。`status.json` blockers #1 措辞模糊，每次 closeout 都要复述。

**改动**：
- 写 `docs/orchestration/sessions/connector-decision-2026-07-07.md`：把 codex / trae / qoder 三个 connector 的当前状态、缺失证据、决策建议、未来实施 lane 一次性写清。
- 改 `status.json` connectors 段：在现有字段内写清 trae/qoder 是当前范围内 intentionally command-empty placeholders；`connectors.schema.json` 禁止 `additionalProperties`，所以本轮不加 `"permanently_placeholder": true` 字段，codex 维持 `draft/pending/enabled=false` 直至 P0-2 拍板。
- 改 `connector-policy-v0.1.md` §blockers + `connector-acceptance-review-v0.1.md` §blockers 措辞：trae/qoder 从 "missing executable path" 升格为 "executable intentionally absent in current scope"。

**验收**：
- 1 份新 session 卡（`connector-decision-2026-07-07.md`）。
- `status.json` connectors 段措辞对齐。
- `npm.cmd run orchestration:check` + `orchestration:preflight` + `orchestration:connector-safety` 三件套 pass。
- 1 个 commit + push。

**2026-07-07 PM 执行记录**：
- 已新增 `docs/orchestration/sessions/connector-decision-2026-07-07.md`。
- 已确认 schema 不允许临时新增 `permanently_placeholder` 字段；本轮仅更新 `status.json`、任务卡 wording 和 `docs/orchestration/connectors.json` 的 `approvalEvidence` 文案，不改 connector status/command/approval/enabled 机器闸门字段。
- Codex 保持 `draft/pending/enabled=false`；Trae/Qoder 保持 `placeholder/not-requested/enabled=false/command=""`。

---

## 三、本周 P2（备选 / 看你时间，4 件）

| # | 需求 | 出处 | 工时 | 价值 |
|---|---|---|---|---|
| **P2-1** | 桌面牧场 v0.4 实施（接外部 agent CLI / 多进程管理 / 进程树可视化）| `ranch-real-integration-p0-v0.1.md` §二 / `桌面牧场开发计划-v0.2.md` | 8~16h | 高（v0.4 路线）|
| **P2-2** | 真实生产环境状态打通方案 v1.1（优化表情联动） | `docs/真实生产环境状态打通与牛马表情联动方案.md` | 2h | 中 |
| **P2-3** | 控制舱 v3.0 → v3.1 增量（拖拽派活 / 抛物线投喂）| `docs/主页面重构方案-v3.0-控制舱收口.md` §二 | 6h | 中 |
| **P2-4** | `npm run orchestration:report` 输出接入每日 cron（开盘自动打印 PM board） | `multi-agent-runtime-v0.1.md` §acceptance | 0.5h | 低（自检福利）|

---

## 四、横切 / 持续（永远 backlog，3 件）

| 项 | 来源 | 备注 |
|---|---|---|
| **中央 4×2 grid + 卖点文件保护** | `index.md` #109~113 / status.json blockers #3 / C0-6 accepted | **契约**——C0-6 审计已 accepted，未来不主动改；如要改必须先有「卖点保护说明 + 用户明示同意」。本卡保留在 P0 blocker 段。 |
| **live-subagents 403 quota 复查** | `multi-agent-runtime-v0.1.md` §blockers / status.json blockers #2 | 等一个安全 recheck 路径；本周不强求；如果出现 P0-2 分支 ① 走通，可顺带复查。 |
| **长工 thread 幂等（不创建重复 thread）** | `daily-decision-queue-2026-07-02.md` non-goals | 现状 OK，保持。 |

---

## 五、排期建议（5 个工作日）

```
Mon 7-7 (今天)  ▸ P0-0 启动 homepage-ui long-worker thread（已分配 `mvs_237b464ebc78403d953b9ab93b398ab8`）
                ▸ P0-1 同步 blocker（0.2h）
                ▸ P0-3 顺手清 release-dir 嵌套（0.2h）
                ▸ P0-2 拍 R0-3 决策（不写代码）
                ▸ 派 P1-1 short-worker：ranch-m5 v0.2 需求准入（1.5h）
                ▸ 起 P1-2 调查 pointer smoke blocker（1h）

Tue 7-8         ▸ P0-0 长工 H0-1 出 3 套设计稿（1~2h）
                ▸ P1-2 pointer smoke blocker 实施（1~2h）
                ▸ P1-1 ranch-m5 v0.2 需求准入验收 → 派 long-worker 实施（如有）
                ▸ P1-4 connector decision 文档化（2h）
                ▸ P1-3 Git log ignore 决策
                ▸ 用户拍板首页设计稿 → H0-2 / H0-3 / H0-4 已提前完成

Wed 7-9         ▸ P0-0 已 accepted；保留给用户视觉确认 / commit 授权
                ▸ ranch-m5 long-worker 实施 day 1（4h）

Thu 7-10        ▸ P0-0 无需继续实施；如用户反馈再开 bounded polish lane
                ▸ ranch-m5 long-worker 实施 day 2（4h）

Fri 7-11        ▸ P0-0 commit/push only after explicit user authorization
                ▸ 本周 closeout + 5 commit 推 main
                ▸ 桌面牧场 v0.3.1 smoke + 截图归档
                ▸ PM board 同步到 7-11

Tue 7-8         ▸ P1-2 pointer smoke blocker 实施（1~2h）
                ▸ P1-1 ranch-m5 v0.2 需求准入验收 → 派 long-worker 实施（如有）
                ▸ P1-4 connector decision 文档化（2h）
                ▸ P1-3 Git log ignore 决策

Wed 7-9         ▸ ranch-m5 long-worker 实施 day 1（4h）
                ▸ 同日新 P1 候选开盘（看你新冒出的需求）

Thu 7-10        ▸ ranch-m5 long-worker 实施 day 2（4h）
                ▸ 收口 acceptance + closeout 文档

Fri 7-11        ▸ 本周 closeout + 5 commit 推 main
                ▸ 桌面牧场 v0.3.1 smoke + 截图归档
                ▸ PM board 同步到 7-11
```

**关键判断**：
- **P0 三件套都应该在今天做掉**——尤其 P0-1（blocker 同步）是 7-6 closeout 留下的瑕疵，拖到明天就又多一段 stale 段。
- **P1-1 派 short-worker 写 ranch-m5 需求准入 v0.2 任务卡**（**不是直接开 long-worker 实施**）。长工投入大，先看清要求再拍。
- **P1-2 pointer smoke blocker 是低垂果实**——1h 调查很可能就发现 Electron `webContents.capturePage()` 走 CDP 就能绕开，半天能闭环。

---

## 六、本周决策待办（**等用户拍板，4 项**）

| # | 决策点 | 候选 | PM 默认建议 |
|---|---|---|---|
| **A** | P0-1 blocker 同步方案 | U1（只改 status.json）/ **U2（status.json + index.md 一起）** / U3（标记 stale） | **U2**（两处 blockers 段历史上一直镜像，一起补齐才不留下"半同步"的 control plane）|
| **B** | R0-3 connector 决策 | **① 接受 Codex dry-run + enabled** / ② 维持 deferred 但新开 controlled dry-run lane / ③ 全部继续 deferred | **②**（最稳，不动 machine-gate 也能闭环 P0 卡；trae/qoder 缺可执行文件是 hard-blocker，强行 enabled 是给自己挖坑）|
| **C** | ranch-m5 派工粒度 | **short-worker 写 v0.2 需求准入** / 直接 long-worker 实施 / 暂不派 | **short-worker 写 v0.2 需求准入**（先看清要求再拍 long-worker，长工投入大别盲上）|
| **D** | pointer smoke blocker 处理 | **今天就开 1h 调查** / 排到下周二 / 不解，承认接受现状 | **今天就开 1h 调查**（低垂果实，大概率半天能闭环）|

> **等你拍 A/B/C/D**，本日内回我即开干。
> **PM 默认执行序**：A=U2, B=②, C=short-worker, D=今天就开。
> 一次回我"**A=U2, B=②, C=short-worker, D=今天就开**"即按此跑完 5 件事（3 件 P0 + P1-1 派工 + P1-2 调查），预计 3~4h。

---

## 七、orchestration 登记

- 本卡路径：`docs/orchestration/sessions/weekly-requirements-2026-07-07.md`
- 引用本卡的文档（待用户拍板后同步）：
  - `docs/orchestration/index.md`（tracked business cards 段加本 session）
  - `docs/orchestration/status.json`（`loopState` + `target` 同步反映本周 W27 路线）
  - `docs/orchestration/sessions/daily-closeout-2026-07-06.md`（next action 段补 P0-1 blocker 同步动作）
  - `scripts/check-orchestration.mjs`（如新增 weekly-requirements 跟踪规则需更新）

---

## 八、本周不在范围（明确推迟）

| 项 | 推迟到 |
|---|---|
| 控制舱 v3.1 增量（拖拽派活 / 抛物线投喂）| 7-14 之后（W28 P2 候选）|
| 桌面牧场 v0.4 实施（接外部 agent CLI）| 待 R0-3 拍板后开新 lane（不在本周 P2 强推）|
| Live2D / Spine / 真骨骼引入 | v0.5+ |
| 二次元养成 / 伴侣云同步 / 付费版本 / 语音 / 自定义形象编辑器 | 永远不做（开发计划 v0.2 附录 D 强约束）|
| 引 Tailwind / vitest | 永远不做（同上）|
| 修改 `multi-agent-niuma` 项目代号 / `AgentSnapshot` 顶层 schema | 永远不做（同上）|
| 修改 `NiuMaAvatar.tsx` / 中央 4×2 grid / `is-hot/coffee/cool/done` keyframes | 永远不做（§6.6 卖点保护战略约束）|

---

## 九、acceptance

- 本文档存在且可被 `docs/orchestration/index.md` 引用。
- 4 个决策点（A/B/C/D）有用户拍板结果记录。
- P0-1 / P0-2 / P0-3 / P1-1 / P1-2 五件事每件都对应 1 个 commit + push 到 origin/main。
- `npm.cmd run orchestration:check` pass（54+ 张卡一致）。
- 工作区 clean。

## 十、next action

- 等待用户拍 A/B/C/D 四个决策点。
- 拍板后按 PM 默认执行序开干，预计 3~4h 跑完 P0 三件套 + P1-1 派工 + P1-2 调查。
- 每日傍晚写 `daily-supervision-2026-07-XX.md` 跟踪本周推进。
- 7-11 周五做 weekly-closeout，把本周 W27 闭环。

## 十一、summary

- 本周 P0 **四件套**（P0-0 全新首页 UI 设计 + P0-1 blocker 同步 / P0-2 R0-3 决策 / P0-3 release-dir 清理）继续按序推进；P0-0 已提前 accepted，剩余动作仅为用户视觉确认与显式授权后的 commit/push。
- 本周 P1 候选 4 件，建议至少开 P1-1（ranch-m5 v0.2 需求准入 short-worker）+ P1-2（pointer smoke blocker 调查），P1-3/P1-4 看用户时间。
- 本周 P2 4 件不强推，作为下次开盘候选池。
- 横切 3 件（卖点保护 / live-subagent quota / 长工幂等）作为契约持续 backlog。
- 4 个决策点等用户拍板；PM 默认执行序：A=U2, B=②, C=short-worker, D=今天就开。
- **2026-07-07 11:07 增补**：用户新增 P0-0（首页 UI 设计 + 长工）拍板；本周 P0 由 3 件升至 4 件；长工 thread `mvs_237b464ebc78403d953b9ab93b398ab8` 已启动并交付 H0-1 设计稿，用户已选择 C 华丽，H0-2/H0-3/H0-4 已完成并本地启动验证。
