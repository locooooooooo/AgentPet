# daily-plan-2026-07-10

[PM]#daily-plan@2026-07-10

⟦tag:v2|session|daily-plan-2026-07-10⟧

loop state: active
dispatch state: active

> **计划日期**:2026-07-10(周五)
> **计划人**:Mavis(root session `mvs_5bb811db0b244b80a142de9d522cc90a`)
> **计划范围**:今日(2026-07-10)补漏收口 + W27 周六 closeout 准备
> **关联任务卡**:
> - [ranch-real-integration-r0-3-dryrun](../tasks/ranch-real-integration-r0-3-dryrun-v0.1.md)
> - [ranch-m5-requirements](../tasks/ranch-m5-requirements-v0.2.md)(主卡)+ 5 子卡
> - [ranch-pointer-smoke](../tasks/ranch-pointer-smoke-v0.2.md) + [manual-evidence](../tasks/ranch-pointer-smoke-manual-evidence-v0.2.md)
> - [cockpit-ui-redesign-v3.1](../tasks/cockpit-ui-redesign-v3.1-v0.1.md)
> - [protected-cockpit-source-drift](../tasks/protected-cockpit-source-drift-v0.1.md)
> - [weekly-requirements-2026-07-07](../sessions/weekly-requirements-2026-07-07.md)
> - [daily-supervision-2026-07-02](../sessions/daily-supervision-2026-07-02.md)

---

## 〇、今日上下文基线

7-9 PM-direct 4 决策(B②/C short-worker/D 今天/E1 立项)落档完成,执行结果落在 `daily-supervision-2026-07-02.md` `2026-07-09 20:03 PM-default B/C/D/E execution closeout` 锚点。

**Workspace 当前 dirty** ⚠️:working tree 9 modified + 11 untracked + 1 scripts untracked,**未 commit/push**。HEAD 仍为 `7030ebf chore(orchestration): 7-9 PM-direct 11:50 真源面同步 + daily-plan 立档`(7-9 11:50 那次)。

**dirty 详情**:
- **modified(9)**:index.md / status.json / daily-plan-2026-07-09.md / daily-supervision-2026-07-02.md / weekly-requirements-2026-07-07.md / daily-decision-queue-2026-07-02.md / daily-role-accountability-2026-07-02.md / ranch-pointer-smoke-v0.2.md / ranch-pointer-smoke-manual-evidence-v0.2.md
- **untracked(11)**:sessions/ranch-pointer-capture-2026-07-09.{json,md,png} / tasks/cockpit-ui-redesign-v3.1-v0.1.md / 5 张 ranch-m5 v0.2 子卡(window-v0.2 / status-script-v0.2 / personality-v0.2 / fence-pointer-v0.2 / system-notify-v0.2) / scripts/ranch-pointer-capture.mjs

**7-9 4 决策落档映射(全部已在档,本卡只补 commit/push)**:
- **B②** R0-3 deferred + controlled dry-run lane standby → `ranch-real-integration-r0-3-dryrun-v0.1.md`
- **C short-worker** ranch-m5 v0.2 准入 → `ranch-m5-requirements-v0.2.md` + 5 子卡(docs-only,无实施)
- **D capturePage** pointer smoke blocker → `scripts/ranch-pointer-capture.mjs` + `ranch-pointer-capture-2026-07-09.{json,md,png}` 已归档;`ranch-pointer-smoke-v0.2` / `ranch-pointer-smoke-manual-evidence-v0.2` 加 investigation lane
- **E1 立项** cockpit-ui-redesign-v3.1 → `cockpit-ui-redesign-v3.1-v0.1.md` 新 task card,W28 候选,无 source implementation

**当前可立即用的产物**:`E:\多agent牛马\release\desktop-ranch-win-unpacked\桌面牧场.exe`(7-6 编译产物,v0.3 视觉验收 OK);dev `http://127.0.0.1:5173/` 仍可达。

**距离 7-11 周六 W27 closeout**:仅剩 1 个工作日(今日 7-10 全天 + 明日 7-11 上午,closeout 截止 16:00)。

### 2026-07-10 管理员拍板覆盖层

用户已授权按 PM 默认建议直接落档,以下结果覆盖本卡后文所有“等用户拍板”历史计划措辞:

| 决策点 | 管理员结果 | 本轮实际动作 |
| --- | --- | --- |
| P1-1 trailing whitespace | **④ route to W28 bounded lane** | 只更新 disposition 与 W28 候选;不改 protected source,不修 whitespace |
| P1-2 M5 v0.2 | **② 串行优先 `ranch-window-v0.2`** | 只确定 W28 实施顺序;本轮不派 long-worker,不启动 implementation |
| P1-3 live-subagents quota | **② 推到 W28** | 本轮不主动复查 `403 DAILY_LIMIT_EXCEEDED` |
| P1-4 R0-3 dry-run | **② 推到 W28** | 本轮不执行 Codex,不改 connector machine gate |

本轮授权包含 `docs/orchestration/**` 与 `scripts/ranch-pointer-capture.mjs` 的普通 stage / commit / push;不包含 M5 source implementation、R0-3 dry-run、Trae/Qoder、pointer input 或 protected source edit。

---

## 一、今日路线总览

| 时段 | 路线 | 工时 | 状态 |
|---|---|---|---|
| 10:30 ~ 11:00 | 写本 daily-plan-2026-07-10.md(本卡) | 30min | ✅ 进行 |
| 11:00 ~ 11:45 | **P0-1 上午补漏 thread**:跑三件套 + commit/push(7-9 PM-direct 收口)+ 7-10 早间 supervision 续写 | 45min | ⭐ 待启动 |
| 11:45 ~ 13:00 | 午休 / 监听 | - | - |
| 13:00 ~ 14:00 | **P0-2 W27 closeout 7-11 准备**:W28 `weekly-requirements-2026-07-14.md` 占位草稿 + closeout session 模板 | 1h | ⭐ 待启动 |
| 14:00 ~ 16:00 | **P1-1**:trailing whitespace ④ route to W28 bounded lane | 0.5h | ✅ 已拍板,不修 source |
| 16:00 ~ 17:30 | **P1-2**:M5 ② 串行优先 `ranch-window-v0.2` | 0.5h | ✅ 已拍板,不启动实施 |
| 17:30 ~ 18:00 | **P0-3 晚间模式 A supervision 续写**(标准节奏) | 30min | ⭐ 必跑 |
| 18:00 ~ 19:00 | 当日 closeout 等式 | - | 监空 |

> **总可用工时**:约 4~5 小时有效工作时间(去掉午饭 1h 与晚间 30min 收口)。
> **本卡不改产品代码。** 本轮产出为 orchestration docs + commit/push 补漏 + W27 closeout 准备;不重开 M5 实施、不跑 R0-3 dry-run、不动 protected cockpit。

---

## 二、今日 P0(从 W27 承接 + 7-9 收口补漏,4 件)

### P0-1 · 7-10 上午补漏 thread(commit/push + 早间 supervision) · 45min · ⭐ ⭐ ⭐

**问题**:7-9 PM-direct 4 决策落档已完成(20:03 锚点),但 commit + push 没跑 → working tree dirty 已超 14 小时。daily-supervision 也没续写 7-10 早间锚点。

**改动**:
1. 跑三件套 + lint + build 验证 7-9 落档真到位(`orchestration:check` ≥ 74 cards)
2. **一次性 commit + push**:
   ```bash
   git add docs/orchestration/ scripts/ranch-pointer-capture.mjs
   git commit -m "chore(orchestration): 7-9 PM-direct 4 决策落档 commit/push (B②/C short-worker/D capturePage/E1 立项)"
   git push origin main
   ```
3. 续写 `daily-supervision-2026-07-02.md` 新锚点 `[2026-07-10 HH:MM +08:00] 7-10 上午补漏 thread` 段

**acceptance**:
- `git log --oneline -1` = 新 commit hash,branch = origin/main
- `git status --short` 空
- `npm.cmd run orchestration:check` pass(74+ referenced cards)
- `npm.cmd run lint` / `npm.cmd run build` pass
- `npm.cmd run orchestration:preflight` / `orchestration:connector-safety` pass(Codex 仍 draft/pending/enabled=false;Trae/Qoder 仍 placeholder/not-requested/enabled=false)
- daily-supervision 新锚点用 `- [2026-07-10 HH:MM +08:00]` 格式续写,含 state snapshot / truth sources / drift 巡检 / next actions 4 类 bullet

**禁止**:
- ❌ commit anything outside `docs/orchestration/` + `scripts/ranch-pointer-capture.mjs`
- ❌ 改 `connectors.json` machine-gate / `status.json` connectors[] 段
- ❌ 跑 Codex/Trae/Qoder 或任何 connector
- ❌ 改 §〇·quarter 受保护源(NiuMaAvatar.tsx / index.css 8 卡 / agentCore.ts / NiuMaWorkspace.tsx 中央 4×2 grid)
- ❌ trailing whitespace format-only 修复(等 disposition 拍板)
- ❌ git reset --hard / clean -fd / push --force / 任何未授权操作

---

### P0-2 · W27 closeout 7-11 准备 · 1h · ⭐ ⭐

**问题**:7-11 周六 16:00 W27 closeout 倒计时 1 工作日。今天必须把 closeout 模板 + W28 占位草稿准备好,明天直接 final。

**改动**:
1. 读 `weekly-requirements-2026-07-07.md`,确认 P0/P1 已 done 与 standby 清单完整
2. 写 `docs/orchestration/sessions/weekly-requirements-2026-07-14.md`(W28 占位草稿),含:
   - 〇 W27 closeout 上下文(占位,7-11 16:00 后填)
   - 一 W28 P0 候选清单(rancher-m5 v0.2 long-worker 派工 / R0-3 dry-run 执行 / cockpit-ui-redesign-v3.1 实施派工 / M5 fence-pointer 实施 / trailing whitespace disposition / live-subagents quota 复查)
   - 二 W28 P1 候选清单
   - 三 W28 P2 候选清单
   - 四 排期建议(7-14 ~ 7-20)
3. **不动** `weekly-requirements-2026-07-07.md`(明天 closeout 时统一改)
4. `index.md` tracked business cards 段加 `weekly-requirements-2026-07-14` session 卡
5. `status.json` 加 `weekly-requirements-w28` role(可与 W27 共用 weekly-requirements role)

**acceptance**:
- `weekly-requirements-2026-07-14.md` 存在,含 4 段占位 + 候选清单
- `index.md` tracked cards 引用新 session 卡
- `npm.cmd run orchestration:check` pass(75+ referenced cards)

**禁止**:
- ❌ 改 W27 卡任何字段(等明天 closeout)
- ❌ 改 status.json `weekly-requirements-w27` 字段
- ❌ 在 W28 卡写实施细节(只占位候选,不实施)

---

### P0-3 · 7-10 17:30 晚间模式 A supervision 续写 · 30min · ⭐

**问题**:标准 PM loop 节奏,每日 09:30 + 17:30 各跑一次模式 A supervision。

**改动**:
1. 跑三件套 + lint + build
2. 比对早间 pass vs 当前 state snapshot,记录当日 P0/P1 进度
3. 续写 `daily-supervision-2026-07-02.md` `[2026-07-10 17:30 +08:00]` 段
4. 提示用户:7-11 周六 16:00 W27 closeout 倒计时 < 1 天(关键 deadline)

**acceptance**:
- daily-supervision 续写段含 state snapshot / truth sources / drift 巡检 / next actions
- next actions 至少包含 7-11 W27 closeout 准备提示

**禁止**:同 P0-1

---

### P0-4 · standby 三件最终确认(不主动动作)

W27 closeout 前,确认 3 件 standby 已落档且字段一致:
- **P0-2 R0-3** → `ranch-real-integration-r0-3-dryrun-v0.1.md` standby,`status.json` `lanes[].id == "ranch-real-integration-r0-3-dryrun"` nextAction 含"wait for user to authorize the controlled dry-run execution window"
- **P1-1 ranch-m5 v0.2** → `ranch-m5-requirements-v0.2.md` 主卡 + 5 子卡 standby,`status.json` `roles[].id == "ranch-m5-requirements"` responsibility 含"Docs-only M5 v0.2 requirements readiness lane;no implementation or long-worker dispatch is authorized"
- **P1-3 Git log ignore** → `git-staging-review-agentpet-v0.1.md` standby,`status.json` `lanes[].id == "git-staging-review-agentpet"` nextAction 含"Git log ignore 决策已落档(2026-07-07 ① 推 main 即可)"

任一字段缺失 → 补档后再继续。

---

## 三、今日 P1(开 2 件 / 评 2 件,共 4 件)

### P1-1 · trailing whitespace 11 行 disposition · ④ 已拍板 · ⭐ ⭐

**问题**:`protected-cockpit-source-drift-v0.1.md` 挂着的 11 行 trailing whitespace 红点(NiuMaWorkspace.tsx 9 行 + index.css 2 行),7-9 commit 9ae95ab 已接受改动但 disposition 未拍。

**4 候选**:
| 候选 | 含义 | 后果 |
|---|---|---|
| ① accept(永久接受)| 把 11 行 whitespace 正式记录为 accepted,移除 disposition 状态 | 干净收口,但留 visible diff |
| ② format-only repair | 跑 `git diff --check` 暴露 → 手动 trim → commit format-only | 完全干净,但需用户授权格式修复 |
| ③ revert | 回退到 9ae95ab 前的无 whitespace 状态 | 失去 7-8 控制舱改动 |
| ④ route to bounded lane | 推到 W28 P1 候选,W28 由 long-worker 在 bounded 范围修 | 今日不动,W28 处理 |

**管理员结果**:④ route to bounded lane(W28 处理)。今日只确认 disposition 已登记 + W28 候选占位,不修改受保护源码。

**acceptance**:
- `protected-cockpit-source-drift-v0.1.md` 记录 ④ disposition
- `weekly-requirements-2026-07-14.md` 登记 W28 bounded lane 候选
- 本轮不修 whitespace,`git diff --check` 仅用于确认已知 red point 没有扩大
- 跑三件套验证 + commit + push

---

### P1-2 · M5 v0.2 实施顺序 · ② 已拍板 · ⭐

**问题**:`ranch-m5-requirements-v0.2.md` 主卡 + 5 子卡已落档,实施派工窗口未定(本卡只 docs-only 准入)。

**3 候选**:
| 候选 | 含义 | 后果 |
|---|---|---|
| ① 立即派 5 张 long-worker 并行实施 | 今日开 5 thread | 工时爆炸,但本周可完成 M5 |
| ② 串行派 1 张 long-worker 实施(从 ranch-window-v0.2 开始) | 今日开 1 thread | 控边界,W28 推完 |
| ③ 推到 W28 P0,W28 派工 | 今日不动 | 边界最稳 |

**管理员结果**:② 串行优先 `ranch-window-v0.2`,因为 FR-001/005/008/009/011 覆盖最广。

**本轮边界**:只记录 W28 串行路线,不创建 long-worker、不启动 source implementation。

**acceptance**:
- `ranch-m5-requirements-v0.2.md` 与 `ranch-window-v0.2.md` 记录首卡顺序
- `weekly-requirements-2026-07-14.md` 将其列为 W28 P0-1
- 本轮无 long-worker thread、无 `src/**` / `electron/**` 实施改动

---

### P1-3 · live-subagents quota 复查 · ② 已拍板推到 W28

**问题**:`status.json` blocker 段挂 `403 DAILY_LIMIT_EXCEEDED`,复查路径未定。

**管理员结果**:今日**不主动**复查,等 W28 安全复查窗口。

**acceptance**:无动作,只在 daily-supervision 续写段标注"quota 复查未到位,挂 W28"。

---

### P1-4 · R0-3 dry-run 执行窗口 · ② 已拍板推到 W28

**问题**:`ranch-real-integration-r0-3-dryrun-v0.1.md` standby,等用户授权执行窗口(单次 `codex --output-format json --quiet "<prompt>"` in isolated cwd)。

**3 候选**:
| 候选 | 含义 |
|---|---|
| ① 今日执行 | 跑 controlled dry-run,归档 evidence 到 `sessions/codex-dryrun-2026-07-10.{json,png,md}` |
| ② 推到 W28 | W28 排期 |
| ③ 永远不跑 | 维持 standby,作为 demo blocker |

**管理员结果**:② 推到 W28(W27 closeout 前不再开新执行窗口)。

**acceptance**:
- `ranch-real-integration-r0-3-dryrun-v0.1.md` 记录 W28 deferred
- W28 卡登记 controlled dry-run 候选
- 本轮不调用 Codex,不生成 dry-run evidence,不改 connector machine gate

---

## 四、今日 P2(备选,2 件)

### P2-1 · 7-10 closeout session 卡 · 0.2h

**改动**:
- 写 `docs/orchestration/sessions/daily-closeout-2026-07-10.md`(如有 commit/push 才写)
- 列出今日累计:补漏 thread commit hash / W28 占位 / P0-4 standby 验证

**acceptance**:closeout 卡存在,引用本 daily-plan + weekly-requirements-2026-07-14。

---

### P2-2 · protected cockpit source drift 备查 · 0.2h

**改动**:
- 跑 `git diff --check` 重核 11 行 whitespace 红点是否仍只在那 11 行
- 若新增 → 补 `protected-cockpit-source-drift-v0.1.md` 段

**acceptance**:`git diff --check` 输出与 `protected-cockpit-source-drift-v0.1.md` 登记一致。

---

## 五、横切 / 持续(永远 backlog,4 件,本周不动)

| 项 | 来源 | 备注 |
|---|---|---|
| **§〇·quarter 受保护源 + trailing whitespace 11 行红点**(已 commit 9ae95ab) | `protected-cockpit-source-drift-v0.1.md` | ④ 已拍板,推到 W28 bounded lane |
| **live-subagents 403 quota 复查** | `multi-agent-runtime-v0.1.md` §blockers | ② 已拍板,推到 W28 |
| **R0-3 dry-run 执行窗口** | `ranch-real-integration-r0-3-dryrun-v0.1.md` | ② 已拍板,推到 W28 |
| **M5 long-worker 实施** | `ranch-m5-requirements-v0.2.md` | ② 已拍板,串行首卡 `ranch-window-v0.2`,本轮不启动 |

---

## 六、排期建议(7-10 ~ 7-11 实际节奏)

```
Fri 7-10 (今天)
  10:30 ▸ 写本 daily-plan-2026-07-10.md ✅
  11:00 ▸ P0-1 上午补漏 thread:commit/push(7-9 PM-direct 收口)+ 早间 supervision 续写
  13:00 ▸ 午休 / 监听
  13:30 ▸ P0-2 W27 closeout 准备:W28 weekly-requirements-2026-07-14.md 占位草稿
  14:00 ▸ P1-1 trailing whitespace ④ route to W28 bounded lane
  16:00 ▸ P1-2 M5 ② 串行首卡 ranch-window-v0.2;仅落路线,不派工
  17:30 ▸ P0-3 晚间模式 A supervision 续写
  18:00 ▸ 提示用户:7-11 16:00 W27 closeout 倒计时 < 1 天

Sat 7-11 (明天,W27 closeout 当日)
  09:30 ▸ 模式 A 早间 supervision 续写
  10:00 ▸ 模式 B W27 weekly-closeout final + commit + push
            ▸ 写 docs/orchestration/sessions/weekly-closeout-2026-07-11.md
            ▸ 收口 weekly-requirements-2026-07-07.md
            ▸ 触发 W28 weekly-requirements 起草
  14:00 ▸ W28 weekly-requirements-2026-07-14.md 正式内容填充
  16:00 ▸ W27 closeout 截止
```

---

## 七、本日决策点(管理员已拍板)

| # | 决策点 | 管理员结果 | 本轮边界 |
|---|---|---|---|
| **P1-1** | trailing whitespace 11 行 disposition | **④ route to W28 bounded lane** | 不修 protected source |
| **P1-2** | M5 v0.2 实施顺序 | **② 串行优先 `ranch-window-v0.2`** | 不派 long-worker,不实施 |
| **P1-3** | live-subagents quota 复查 | **② 推到 W28** | 今日不复查 |
| **P1-4** | R0-3 dry-run 执行窗口 | **② 推到 W28** | 今日不调用 Codex |

> **执行边界**:本轮不执行 R0-3 dry-run、不改 connector machine-gate、不派 M5 long-worker、不做 control-cockpit source implementation、不做 git reset/clean/push --force、不动 §〇·quarter 受保护源、不修复 trailing whitespace。

---

## 八、orchestration 登记

- 本卡路径:`docs/orchestration/sessions/daily-plan-2026-07-10.md`
- 引用本卡的文档(本轮 thread 跑时同步):
  - `docs/orchestration/index.md`(`tracked business cards` 段加本 session)
  - `docs/orchestration/status.json`(`todayPlan.date` 改 2026-07-10 + `todayPlan.session` 指向本卡)
  - `docs/orchestration/sessions/weekly-requirements-2026-07-07.md`(W27 closeout 倒计时提示)
  - `docs/orchestration/sessions/daily-supervision-2026-07-02.md`([2026-07-10 11:xx] 补漏 thread 续写 + [2026-07-10 17:30] 晚间 supervision 续写)
  - `docs/orchestration/sessions/weekly-requirements-2026-07-14.md`(W28 占位草稿,新文件)

---

## 九、不在范围(明确推迟到 W28+)

| 项 | 推迟到 |
|---|---|
| 控制舱 v3.1 实施(P1-5 仅立项不实施,本卡仅占位) | W28 |
| ranch v0.3.1 polish(scratch minor fix,没排到) | 本周不强推 |
| 桌面牧场 v0.4 实施 | 待 R0-3 拍板后 |
| Live2D / Spine / 真骨骼 | v0.5+ |
| 引 Tailwind / vitest | 永远不做 |

---

## 十、acceptance

- 本文档存在且可被 `docs/orchestration/index.md` 引用
- `npm.cmd run orchestration:check` pass(74+ 张卡,补漏 thread commit 后 75+)
- `npm.cmd run lint` + `npm.cmd run build` pass
- `npm.cmd run orchestration:preflight` + `orchestration:connector-safety` pass
- 7-9 PM-direct 4 决策 commit + push 完成,`git log --oneline -1` 为新 commit hash
- `git status --short` 干净
- 7-10 早间 supervision 锚点续写
- W28 `weekly-requirements-2026-07-14.md` 占位草稿存在
- 4 决策点(P1-1/2/3/4)管理员结果记录
- standby 三件(P0-2 R0-3 / P1-1 ranch-m5 v0.2 / P1-3 Git log ignore)字段已验证一致
- 7-11 W27 closeout deadline 提示已写入 daily-supervision 晚间锚点

## 十一、next action

- P0-1 上午补漏 thread(commit/push + 早间 supervision)→ 立即可启动
- P0-2 W27 closeout 准备(W28 占位)→ 13:30 启动
- P1-1/2/3/4 4 决策点 → 已按管理员默认结果落档;本轮不启动实施或 dry-run
- P0-3 17:30 晚间 supervision → 标准节奏
- 7-11 09:30 模式 A 早间 supervision 续写 + 模式 B W27 closeout final → 明天跑
- 7-11 16:00 W27 closeout 截止 → 触发 W28 weekly-requirements 起草

## 十二、summary

- 7-10 当日 PM 收口计划:`P0-1 补漏 thread`(commit/push 7-9 PM-direct 落档 + 实际时间 supervision 续写)+ `P0-2 W27 closeout 准备`(W28 占位草稿)+ `P0-3 实际晚间 supervision`。
- 4 决策点已拍板:protected whitespace ④ route to W28 bounded lane;M5 ② 串行首卡 `ranch-window-v0.2` 但本轮不实施;quota ② 推 W28;R0-3 ② 推 W28。
- 距离 7-11 周六 16:00 W27 closeout 仅剩 1 工作日,留余充分。
- standby 三件(P0-2 R0-3 / P1-1 ranch-m5 v0.2 / P1-3 Git log ignore)字段已验证一致,可干净 closeout。
- 本轮不跑 R0-3 dry-run、不派 M5 long-worker、不动 §〇·quarter 受保护源、不修复 trailing whitespace。
