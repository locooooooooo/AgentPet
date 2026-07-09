# daily-plan-2026-07-09

[PM]#daily-plan@2026-07-09

⟦tag:v2|session|daily-plan-2026-07-09⟧

loop state: active
dispatch state: active

> **计划日期**:2026-07-09(周四)
> **计划人**:Mavis(root session `mvs_5bb811db0b244b80a142de9d522cc90a`)
> **计划范围**:今日(2026-07-09)开发路线 + W27 周四收口铺垫
> **关联任务卡**:
> - [ranch-real-integration-r0-3-dryrun](../tasks/ranch-real-integration-r0-3-dryrun-v0.1.md)
> - [ranch-pointer-smoke-v0.2](../tasks/ranch-pointer-smoke-v0.2.md)
> - [ranch-pointer-smoke-manual-evidence-v0.2](../tasks/ranch-pointer-smoke-manual-evidence-v0.2.md)
> - [protected-cockpit-source-drift-v0.1](../tasks/protected-cockpit-source-drift-v0.1.md)
> - [ranch-window-v0.1](../tasks/ranch-window-v0.1.md)
> - [ranch-status-script-v0.1](../tasks/ranch-status-script-v0.1.md)
> - [ranch-personality-v0.1](../tasks/ranch-personality-v0.1.md)
> - [weekly-requirements-2026-07-07](../sessions/weekly-requirements-2026-07-07.md)

---

## 〇、今日上下文基线

7-7 PM 已收口 5 件(P0-0/1/2/3 + P1-4 connector decision);commit `0f48415`(P1-3 Git log ignore 拍板 ①)7-7 已推。

**Workspace 历史 dirty 已收**:2026-07-09 11:29 用户拍 A3(全部 commit + push),commit `9ae95ab` 一次性收口 25 文件 / 7 类来源——
- 真源 drift(7 个 PM 监督产物)
- §〇·quarter 受保护源改动 4 个(用户显式授权接受,trailing whitespace 11 行红点已登记 `protected-cockpit-source-drift-v0.1.md`)
- 首页 polish(HomePage + 3 子项)
- 2 个新 doc(`protected-cockpit-source-drift-v0.1.md` + `docs/控制舱UI检讨与改造方案-2026-07-08.md`)
- 11 个本地临时产物(animal-emotions* / build-animals* / .tmp-* / .pyserver.log)

**当前可立即用的产物**:`E:\多agent牛马\release\desktop-ranch-win-unpacked\桌面牧场.exe`(7-6 编译产物,v0.3 视觉验收 OK);dev `http://127.0.0.1:5173/` 仍可达;Electron 桌面牧场进程 32328 仍可见。

**距离 7-11 周五 closeout 还有**:约 1.5 个工作日(7-9 周四 13:00 后 + 7-10 全天 + 7-11 周五上午)。

---

## 一、今日路线总览

| 时段 | 路线 | 工时 | 状态 |
|---|---|---|---|
| 11:30 ~ 11:50 | W27 cleanup commit 9ae95ab + push | 20min | ✅ 完成 |
| 11:50 ~ 12:30 | 写本 plan + status.json todayPlan 同步 + index.md tracked cards 登记 | 40min | ✅ 进行 |
| 12:30 ~ 13:30 | 午休 / 监听 | - | - |
| 13:30 ~ 15:00 | **P1-1 派 ranch-m5 v0.2 短工**(5 张子卡需求准入) | 1.5h | 排队 |
| 15:00 ~ 16:00 | **P1-2 pointer smoke blocker 调查**(Electron `webContents.capturePage()` CDP 路线) | 1h | 排队 |
| 16:00 ~ 16:20 | P0-2 / B R0-3 决策落档(不写代码,只标 ©/②/③ + 更新 task + 更新 status.json) | 20min | 排队 |
| 16:20 ~ 17:20 | **P1-5 候选**:7-8 控制舱 UI 检讨方案 doc 立项(归档成 `cockpit-ui-redesign-v3.1-v0.1.md` task card + E 选项) | 1h | 排队 |
| 17:20 ~ 17:50 | 跑三件套 + 写 daily-supervision 续写 + 当日 commit + push | 30min | 排队 |
| 17:50 ~ 18:30 | 当日 closeout 等式 | - | 监空 |

> **总可用工时**:约 4.5~5 小时有效开发时间(去掉午饭 1h 与傍晚 30min 收口)。
> **本卡不写代码。** 1 个 commit + push 全部归口,7-10 / 7-11 留给 W27 closeout。

---

## 二、今日 P0(从 W27 承接,1 件)

### P0-0 · W27 cleanup commit 9ae95ab · 20min · done

**问题**:7-8 至 7-9 中午 workspace 持续 dirty 25 文件,1 天多未推。

**改动**:commit `9ae95ab chore(orchestration): 7-9 PM-direct W27 cleanup + 7-8 cockpit 改动整收` 一次性收口,26 文件 / +5169 −307。

**关键负向保证**:
- 未动 `docs/orchestration/connectors.json` machine-gate
- 未动 connectors.json / status.json connectors[] 段
- 未触碰 §〇·quarter 8 卡 keyframes / NiuMaAvatar.tsx
- 未跑 git reset --hard / clean / push --force

**验收**:
- `git push origin main` `0f48415..9ae95ab main -> main` 已推
- workspace clean(`git status --short` 空)
- commit 前三件套 pass(check 65 卡 / lint / build)
- 已落 commit message 详细 7 类来源清单

---

## 三、今日 P1(开 2 件 / 评 2 件 / 备选 1 件,共 5 件)

### P1-1 · 派 ranch-m5 v0.2 需求准入短工 · 1.5h · ⭐ ⭐ ⭐

**问题**:`ranch-window-v0.1.md` / `ranch-status-script-v0.1.md` / `ranch-personality-v0.1.md` 三张 v0.1 卡当前都是 summarized(仅 verification summary),FR-001/005/008/009/011 真实实施 v0.2 从未派工。M5 verification 之所以"过"是因为 v0.3 L1/L2/L3 视觉收敛顺带覆盖,但**没有专门的 M5 implementation 长工交付**。

**改动**:派 `[短工]#ranch-m5-requirements@v0.2`:
- 写 `docs/orchestration/tasks/ranch-m5-requirements-v0.2.md`(主卡)
- 写 5 张子卡(子 template 套短工派工包):
  - `ranch-window-v0.2`(FR-001/005/008/009/011 windows)
  - `ranch-status-script-v0.2`(FR-002/003/004/006 status script)
  - `ranch-personality-v0.2`(FR-007 personality)
  - `ranch-fence-pointer-v0.2`(fence / pointer smoke 集成)
  - `ranch-system-notify-v0.2`(system notification + agent accent icon)
- 短工产出后由 PM 拍是否派 long-worker 实施

**禁止**:
- ❌ 短工直接实施 M5(应先写准入,再派 long-worker)
- ❌ 触动 §〇·quarter 保护(NiuMaAvatar / index.css 8 卡 / agentCore 关键段 / 中央 4×2 grid)

**acceptance**:
- 6 份 markdown 落档(主卡 + 5 子卡)
- 5 子卡各自 objective 1 行 + scope 文件路径清单 + FR 编号
- 跨子卡共享禁止清单在主卡统一写明,子卡引用主卡

**PM 拟好 prompt**(待用户授权"开 P1-1"即派):详见 transcript 7-9 11:14 段 prompt。

---

### P1-2 · pointer smoke blocker 调查(1h 调查路线 + 留余 1~2h 实施可选) · ⭐ ⭐

**问题**:`ranch-pointer-smoke-v0.2.md` 第 53~54 行 `SetIsBorderRequired failed: 不支持此接口 (0x80004002)` 阻塞了 FR-001/008/011 desktop mode 的 pointer smoke 自动化;Windows MCP Snapshot 7-7 已绕过,完整 pointer input 仍未跑。

**调查路线**(1h):
1. **首选**:Electron `webContents.capturePage()`(走 CDP,不走 OS 截屏 API)→ 写 `scripts/ranch-pointer-capture.mjs` 验证
2. 备选:`Win32 PrintWindow`(`user32.dll!PrintWindow` + `PW_RENDERFULLCONTENT`)
3. 备选:临时改牧场窗口为 non-transparent(先跑通再回头)

**实施路线**(1~2h,留 7-10 上午):
- 任一路线跑通后,改写 `ranch-pointer-smoke-v0.2.md` verification route(保留 manual + alternate 双路径),新增电子证据归档规则
- 至少把 `ranch-pointer-smoke-manual-evidence-v0.2.md` evidence table 1 行从 pending → pass

**acceptance**:
- 新捕获路线脚本可重复执行
- `SetIsBorderRequired failed` 不再出现
- 至少 1 个 evidence row pending → pass

**本日目标**:跑完调查路线 1,出 `scripts/ranch-pointer-capture.mjs` 原型 + 留 7-10 实施收口。

---

### P1-3 · Git log ignore 决策 · 0.5h · ✅ done(commit 0f48415)

7-7 commit `0f48415` 拍板 ① 推 main 即可 已落档。`git-staging-review-agentpet-v0.1.md` 维持 standby。

---

### P1-4 · PM-direct 工作流 v2 改造 · 2h · ✅ done(7-7 connector-decision-2026-07-07.md)

7-7 已收口。

---

### P1-5 · 7-8 控制舱 UI 检讨方案立项 · 1h · ⭐ ⭐

**问题**:`docs/控制舱UI检讨与改造方案-2026-07-08.md` 已 commit 进 history(commit 9ae95ab),但未立项成 task card,等于"业务面只有方案没有 lane"。

**改动**:
- 写 `docs/orchestration/tasks/cockpit-ui-redesign-v3.1-v0.1.md`(新 task card)
- 登记到 `index.md` tracked business cards + `status.json` 角色与 lane
- 在 weekly-requirements-2026-07-07.md §二 P1 列表追加 P1-5(改 cockpit UI 视觉规范)
- commit + push(本日 17:20 ~ 17:50 收口 commit 一并推)

**scope 选项**(留 W28 P0 候选,本卡仅立项):
- §〇·quarter 保护下的视觉降噪增量
- 拟物化推进(状态条 / 卡片材质 / 阴影)
- 8 卡样式小修订(仅限于不破坏动效 + 不破坏 hover 状态)

**PM 默认建议**:本日 16:20 段立项 task card(60min 卡完成时间),具体 scope 推到 W28 拍板。

---

## 四、今日 P2(备选,1 件)

### P2-1 · W27 closeout 预热 · 0.2h

**改动**:
- 写 `docs/orchestration/sessions/weekly-closeout-2026-07-XX.md` 草稿(本日 17:50 前作为 EOF 收口)
- 列出本周累计:
  - `0f48415` P1-3 落档
  - `65da9a9` P0-2 R0-3 standby
  - `57d0567` / `18451ba` W27 cleanup + homepage-ui long-worker closeout
  - `f4fa3a4` 新增 P0 homepage-ui-p0
  - `9612151` PM-direct 闭环
  - `42e3f7f` 控制面 v0.3 + 控制舱方案 v3.0 收口
  - `3aa30f7` cockpit P0 C0-1~C0-6 + R0-1/2/4/5
  - `3e91d4c` 桌面牧场 v0.3 B 路径
  - `e095764` .gitignore dev runtime 拦截
  - `fa9e08b` Import AgentPet workspace
  - `9ae95ab` 7-9 W27 cleanup
- tokensUsed 估算、长工 thread 数、本周决策点数
- 7-11 周五 closeout 时最后签收

**本日目标**:草稿写完,7-11 直接 final。

---

## 五、横切 / 持续(永远 backlog,3 件,本周不动)

| 项 | 来源 | 备注 |
|---|---|---|
| **§〇·quarter 受保护源 + trailing whitespace 11 行红点**(已 commit) | `protected-cockpit-source-drift-v0.1.md` | 7-9 commit 9ae95ab 已接受改动;后续 W28 P1-5 立项后做 format-only repair |
| **live-subagents 403 quota 复查** | `multi-agent-runtime-v0.1.md` §blockers | 等 recheck 路径 |
| **长工 thread 幂等** | `daily-decision-queue-2026-07-02.md` non-goals | 现状 OK |

---

## 六、排期建议(7-9 ~ 7-11 实际节奏)

```
Thu 7-9 (今天)
  11:30 ▸ W27 cleanup commit 9ae95ab + push ✅
  11:50 ▸ 写本 daily-plan-2026-07-09.md + status.json todayPlan 同步
  13:30 ▸ P1-1 派 ranch-m5 v0.2 短工(1.5h)
  15:00 ▸ P1-2 pointer smoke blocker 调查路线 1(1h)
  16:00 ▸ P0-2 R0-3 决策落档(20min,不写代码)
  16:20 ▸ P1-5 控制舱 UI 检讨方案立项(1h)
  17:20 ▸ 跑三件套 + daily-supervision 续写 + commit + push
  17:50 ▸ 写 weekly-closeout 草稿(0.2h)

Fri 7-10
  10:00 ▸ P1-1 短工交付后验收;OK 则派 long-worker(半天)
  14:00 ▸ P1-2 pointer smoke blocker 实施(1~2h,如果路线 1 通了)
  16:00 ▸ 7-10 PM closeout + commit

Sat 7-11 (周六,周 closeout)
  10:00 ▸ W27 weekly-closeout final + commit + push (5 commit)
  12:00 ▸ 触发 W28 weekly-requirements 起草
```

---

## 七、本日决策点(等你拍,3 件)

| # | 决策点 | 候选 | PM 默认建议 |
|---|---|---|---|
| **A** | 9ae95ab 后 working tree 处理方式 | ✅ done(已 commit) | - |
| **B** | P0-2 R0-3 connector 决策 | ① 接受 / ② 维持 deferred + 新开 dry-run lane / ③ 全 deferred | **②**(trae/qoder 缺可执行文件 hard-block;不应 enabled) |
| **C** | P1-1 ranch-m5 派工粒度 | short-worker 写 v0.2 准入 / 直接 long-worker 实施 / 暂不派 | **short-worker**(先看清要求再派 long-worker) |
| **D** | P1-2 pointer smoke blocker | 今天就开 1h 调查 / 排下周二 / 不解 | **今天就开**(低垂果实,半天能闭环) |
| **新增 E** | 7-8 控制舱 UI 检讨方案 doc | E1 归档成 task card + commit / E2 不归档作为下次排期输入 / E3 跳过 | **E1**(本日 16:20 段 1h 立项) |

> **等你拍**:B / C / D / E 四项;A 已决。
> **PM 默认执行序**:B=②, C=short-worker, D=今天就开, E=E1。
> 一次回我 **"B② C short D 今天 E1"** 即按此跑完,预计 4h。

---

## 八、orchestration 登记

- 本卡路径:`docs/orchestration/sessions/daily-plan-2026-07-09.md`
- 引用本卡的文档(待用户拍板 + 17:20 段 commit 同步):
  - `docs/orchestration/index.md`(`tracked business cards` 段加本 session)
  - `docs/orchestration/status.json`(`todayPlan.date` 改 2026-07-09 + `todayPlan.session` 指向本卡)
  - `docs/orchestration/sessions/weekly-requirements-2026-07-07.md`(§二 P1 列表追加 P1-5)
  - `docs/orchestration/sessions/daily-supervision-2026-07-02.md`([2026-07-09 11:30] 续写段)

---

## 九、不在范围(明确推迟到 W28+)

| 项 | 推迟到 |
|---|---|
| 控制舱 v3.1 实施(P1-5 仅立项不实施)| W28 |
| ranch v0.3.1 polish(scratch minor fix,没排到)| 本周不强推 |
| 桌面牧场 v0.4 实施 | 待 R0-3 拍板后 |
| Live2D / Spine / 真骨骼 | v0.5+ |
| 引 Tailwind / vitest | 永远不做 |

---

## 十、acceptance

- 本文档存在且可被 `docs/orchestration/index.md` 引用
- workspace clean(`git status --short` 空)
- 最近 commit `9ae95ab` 已推 origin/main
- 4 个决策点(B/C/D/E)有用户拍板结果记录
- 17:20 段 commit 收口当日 4 件进度 + 立项 task card
- `npm.cmd run orchestration:check` pass(66+ 张卡一致)
- `npm.cmd run lint` + `npm.cmd run build` pass
- `npm.cmd run orchestration:preflight` + `orchestration:connector-safety` pass

## 十一、next action

- 等用户拍 B/C/D/E 决策点
- 13:30 起按 PM 默认执行序开干 P1-1(短工 ranch-m5 v0.2 准入)
- 17:20 段三件套 + commit 收口 + push
- 17:50 段写 weekly-closeout 草稿(7-11 final 基础)
- 续写 `daily-supervision-2026-07-02.md` [2026-07-09 11:30+] 各时间锚点
- 7-10 周五继续 P1-1 短工验收 + P1-2 实施 + 7-10 PM closeout
- 7-11 周六 W27 closeout + 5 commit 推 main

## 十二、summary

- 7-9 当日 6 件 PM 收口:`9ae95ab` W27 cleanup commit(20min)+ 本 daily-plan + `index.md`/`status.json` 同步 + 11:30 段 weekly-requirements §十二 增补 + 13:30 起 P1-1 短工 + P1-2 调查 + P0-2 决策落档 + P1-5 立项 + 17:20 commit 收口。
- 4 个决策点等用户拍;PM 默认执行序:B=②, C=short-worker, D=今天就开, E=E1。
- 距离 7-11 周五 closeout 还有 1.5 个工作日,留余充分。
- daily-supervision 末段 18:56;7-9 当日新 supervision pass 全程 + 17:20 commit 收口段会续写进 `daily-supervision-2026-07-02.md` 第 [2026-07-09 11:xx] 锚点。
