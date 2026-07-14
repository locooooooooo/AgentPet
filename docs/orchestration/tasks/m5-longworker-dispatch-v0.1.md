# M5 long-worker dispatch package · 串行派工 · ranch-window-v0.2 优先

[PM]#m5-longworker-dispatch@v0.1
⟦tag:v2|task|m5-longworker-dispatch-v0.1⟧

loop state: standby
dispatch state: standby

> **创建日期**:2026-07-10
> **承接**:`docs/orchestration/sessions/weekly-requirements-2026-07-14.md` §一 P0-1 激活前置
> **关联任务卡**:
> - `docs/orchestration/tasks/ranch-window-v0.2.md`(M5 首张子卡)
> - `docs/orchestration/tasks/ranch-m5-requirements-v0.2.md`(M5 主卡)
> - `docs/orchestration/tasks/ranch-status-script-v0.2.md`(M5 第 2 张)
> - `docs/orchestration/tasks/ranch-personality-v0.2.md`(M5 第 3 张)
> - `docs/orchestration/tasks/ranch-fence-pointer-v0.2.md`(M5 第 4 张)
> - `docs/orchestration/tasks/ranch-system-notify-v0.2.md`(M5 第 5 张)

---

## objective:

- 2026-07-10 管理员拍板 ② 串行派 1 张 M5 long-worker,首张为 `ranch-window-v0.2`(FR-001/005/008/009/011 涵盖最广)
- 管理员已授权将 Day 1 提前到 2026-07-11;控制面 commit/push 与 fresh clean baseline 后,由 PM 将下方启动描述投递给 Codex 内部子 agent
- W28 期间串行派工,不得并行(避免抢占 protected/shared surface)
- W27 不启动任何 long-worker(等 7-11 16:00 W27 closeout 后才激活)

---

## 派工参数(ranch-window-v0.2)

| 字段 | 值 |
|---|---|
| worker type | `[长工]` |
| 目标 task | `docs/orchestration/tasks/ranch-window-v0.2.md` |
| 启动窗口 | 2026-07-11 ~ 2026-07-12 (Day 1/2,同一 worker) |
| 预计工时 | 6.5~9.5h |
| 角色 title | `[长工]#ranch-window@v0.2` |
| 收口方式 | PM-direct commit + push |

---

## 写 scope(白名单)

| 路径 | 用途 |
|---|---|
| `src/ranch/**` | 牧场 renderer / hook / 子组件 |
| `electron/main.ts` | 牧场主进程增量(window lifecycle / desktop\|floating / fence) |
| `src/components/NiuMaWorkspace.tsx` | **仅 app-header 增量**(返回牧场 / 召唤牧场入口按钮);**不动**中央 4×2 grid |
| `src/components/CockpitSettingsPanel.tsx` 或类似 | 设置联动增量(M5 settings 联动 ranch-window prefs) |
| `docs/orchestration/sessions/ranch-window-v0.2-acceptance-2026-07-XX.md` | 新建 acceptance session 卡(收口时填) |
| `docs/orchestration/sessions/ranch-window-v0.2-progress.md` | 新建 progress session 卡(实施中续写) |

---

## 禁止 scope(黑名单 · 硬边界)

- ❌ `src/components/NiuMaAvatar.tsx`(§〇·quarter 8 卡中央)
- ❌ `src/index.css` 中央 8 卡样式(`is-hot` / `coffee` / `cool` / `done` keyframes)
- ❌ `src/lib/agentCore.ts` 关键段(animal identity / state script / personality 核心逻辑)
- ❌ `src/components/NiuMaWorkspace.tsx` 中央 4×2 grid(只允许 app-header 增量)
- ❌ `icon/**`(icon 资源不动)
- ❌ `package.json`(依赖不动)
- ❌ `electron/preload.ts` 已 locked 部分(只在 `electron/main.ts` 增量)
- ❌ `docs/orchestration/connectors.json`(connector machine-gate 不动)
- ❌ `docs/orchestration/status.json` 的 `connectors[]` 段
- ❌ 其他 src/ranch 之外的 product source

---

## acceptance(ranch-window-v0.2)

| FR | 验证 | 证据形式 |
|---|---|---|
| FR-001 | 牧场窗口生命周期(create / show / hide / destroy) | 录屏 + 截图 ≥ 3 张 |
| FR-005 | 牧场 desktop / floating 模式切换 | 录屏 + 截图 ≥ 2 张 |
| FR-008 | 牧场双击召唤控制舱 + 右键入口 | 录屏 + 截图 ≥ 2 张 |
| FR-009 | 牧场拖拽吸边(fence) | 录屏 + 截图 ≥ 2 张 |
| FR-011 | 牧场 3 级 UI 收敛(L1/L2/L3 视觉) | 截图 1920×1080 + 1366×768 各 1 张 |

**行为优先解释**:旧派工表中的 FR-005/FR-008 标签曾互换;验收以工程需求行为定义为准,必须分别证明双击/右键召唤控制舱与 desktop/floating 模式语义,不得只按编号判断。

## 2026-07-11 Day 1 implementation preflight

- Cross-layer contract is already present and typed: `RanchPrefs`, `desktop|floating`, bounds, context menu, passthrough, notifications, and prefs-change IPC exist across `src/types.ts`, `electron/preload.ts`, and `src/lib/desktopClient.ts`. The Day 1/2 worker does not need to edit those blacklisted files.
- `electron/main.ts` already owns default desktop prefs, JSON persistence, ranch window creation, tray summon, mode application, hot-zone polling, bounds commits, and app-quit destruction. `src/ranch/**` already owns double-click/right-click, mode toggle, drag/dock, interactive-region publication, and renderer listener/timer cleanup.
- Required allowed-scope correction 1: the current ranch `close` handler hides only in floating mode; in desktop mode it prevents close without hiding. Day 1 must define and prove coherent show/hide/destroy semantics within `electron/main.ts`.
- Required allowed-scope correction 2: persisted size is clamped, but restored x/y are not clamped to a currently available display work area. Day 1 must keep the ranch recoverable after display topology or DPI/work-area changes without widening the file fence.
- Required evidence: default desktop launch, tray summon after hide, mode/size/position relaunch restoration, corrupt/missing prefs fallback, and app-quit cleanup of ranch window/hot-zone/listeners. The repo has no targeted automated Electron test suite, so current Electron/Windows screenshots or recording plus persisted prefs evidence are mandatory.
- Day 2 interactions already have code paths, but existing code is not acceptance: double-click, right-click, desktop passthrough, floating drag, dock/fence persistence, and control-cockpit focus must be directly replayed.
- Preflight decision: **no bounded correction outside the existing whitelist is currently required**. If implementation later proves otherwise, stop and return a file-specific correction proposal instead of touching preload/types/desktop fallback or protected source.

**自动化 gate**:
- `npm.cmd run lint` 0 错
- `npm.cmd run build` 通过
- `npm.cmd run orchestration:check` pass(79+ referenced cards,加本派工包后)
- `npm.cmd run orchestration:preflight` + `orchestration:connector-safety` pass

**负向 gate**:
- `git diff --check` 不引入新的 trailing whitespace
- 上述"禁止 scope"全部 0 字节变动
- `connectors.json` machine-gate 字段 0 字节变动
- `status.json` `connectors[]` 段 0 字节变动

---

## 回滚面(rollback surface)

如果实施过程中发现越界或 quality gate 不通过:

1. **自动回滚到实际 W28 P0-1 clean baseline**(以 Day 1 派工前记录的 `HEAD == origin/main` commit 为准)
2. **回滚命令**:`git revert <long-worker-commit-hash> --no-edit` → 跑 `orchestration:check` + `lint` + `build` → commit → push
3. **重启条件**:bounded dispatch 描述(本卡)+ acceptance 重新对齐 + PM 重新授权
4. **不接受**:`git reset --hard` / `git clean -fd` / `git push --force`(任何 destructive 操作都触发上报)

---

## 内部子 agent 启动描述(PM 派工时投递)

```markdown
你是 [长工]#ranch-window@v0.2。目标 task:`docs/orchestration/tasks/ranch-window-v0.2.md`。

**承接**:
- 派工包:`docs/orchestration/tasks/m5-longworker-dispatch-v0.1.md`
- W28 卡:`docs/orchestration/sessions/weekly-requirements-2026-07-14.md` §一 P0-1

**写 scope(白名单)**:
- `src/ranch/**`(牧场 renderer / hook / 子组件)
- `electron/main.ts`(牧场主进程增量)
- `src/components/NiuMaWorkspace.tsx` **仅 app-header 增量**(返回牧场 / 召唤牧场入口按钮);**不动**中央 4×2 grid

**禁止 scope(黑名单 · 硬边界)**:
- ❌ `src/components/NiuMaAvatar.tsx`
- ❌ `src/index.css` 中央 8 卡样式 / `is-hot` / `coffee` / `cool` / `done` keyframes
- ❌ `src/lib/agentCore.ts` 关键段
- ❌ `src/components/NiuMaWorkspace.tsx` 中央 4×2 grid
- ❌ `icon/**` / `package.json` / `electron/preload.ts` 已 locked 部分
- ❌ `docs/orchestration/connectors.json` machine-gate
- ❌ `docs/orchestration/status.json` `connectors[]` 段
- ❌ 其他 src/ranch 之外的 product source

**acceptance(ranch-window-v0.2)**:
| FR | 验证 |
|---|---|
| FR-001 | 牧场窗口生命周期(create / show / hide / destroy) · 录屏 + 截图 ≥ 3 张 |
| FR-005 | 牧场 desktop / floating 模式切换 · 录屏 + 截图 ≥ 2 张 |
| FR-008 | 牧场双击召唤控制舱 + 右键入口 · 录屏 + 截图 ≥ 2 张 |
| FR-009 | 牧场拖拽吸边(fence)· 录屏 + 截图 ≥ 2 张 |
| FR-011 | 牧场 3 级 UI 收敛(L1/L2/L3 视觉)· 截图 1920×1080 + 1366×768 各 1 张 |

**自动化 gate**:
- `npm.cmd run lint` 0 错
- `npm.cmd run build` 通过
- `npm.cmd run orchestration:check` pass(79+ referenced cards)
- `npm.cmd run orchestration:preflight` + `orchestration:connector-safety` pass

**负向 gate**:
- `git diff --check` 不引入新的 trailing whitespace
- 上述"禁止 scope"全部 0 字节变动
- `connectors.json` machine-gate 字段 0 字节变动
- `status.json` `connectors[]` 段 0 字节变动

**回滚面**:
- 回滚到本派工包落档后的 commit(无 long-worker 改动状态)
- 不接受 `git reset --hard` / `clean -fd` / `push --force`

**收口**:
- 写 `docs/orchestration/sessions/ranch-window-v0.2-acceptance-2026-07-XX.md`
- 写 `docs/orchestration/sessions/ranch-window-v0.2-progress.md` 续写进度
- 跑全部 gate 0 错
- PM-direct commit + push(长工不跑 git stage / commit / push)

**禁止**:
- ❌ W27 closeout、W28 activation、2026-07-11 管理员 Day 1 授权、fresh clean baseline 四道 gate 未同时满足前不得启动本 worker
- ❌ 不跑 Codex / Trae / Qoder / 任何 connector
- ❌ 不跑 R0-3 dry-run
- ❌ 不跑 pointer input 实际执行
- ❌ 不改 protected cockpit 任何源码
- ❌ 不改 weekly-requirements-2026-07-07.md
```

---

## 五日串行派工序列

| 序 | 子卡 | 启动窗口 | 预计工时 | 备注 |
|---|---|---|---|---|
| 1 | `ranch-window-v0.2` | 7-11 ~ 7-12 | 6.5~9.5h | Day 1/2 使用同一 `[长工]`;完成并验收后 PM commit/push |
| 2 | `ranch-status-script-v0.2` | 7-13 | 4~6h | 前卡 accepted/pushed 后派 `[短工]` |
| 3 | `ranch-personality-v0.2` | 7-14 | 3~4h | status-script accepted/pushed 后派 `[短工]` |
| 4 | `ranch-fence-pointer-v0.2` | 7-15 | 3~5h | 必须直接观察 pointer input;capturePage 不算输入证据 |
| 5 | `ranch-system-notify-v0.2` | 7-15,仅在前卡收口后 | 2~3h | 必须证明真实 Windows notification;browser fallback 不算 |

**禁止并行**:5 张子卡都涉及 `src/ranch/**` + `electron/main.ts`,并行会冲突。串行派工,每张收口后再开下一张。

---

## acceptance(本派工包):

- 本卡存在且可被 `docs/orchestration/index.md` 引用
- 派工参数 / 写 scope / 禁止 scope / acceptance / 回滚面 5 段完整
- 内部子 agent 启动描述(上方代码块)可由 PM 直接投递
- 串行派工序列 5 张子卡列清晰
- W28 weekly-requirements-2026-07-14.md §一 P0-1 激活前置已标注"派工包 docs-only 落档"
- `npm.cmd run orchestration:check` pass(79+ referenced cards,加本派工包后)
- W27 closeout 不依赖本派工包落档(仅 W28 激活时依赖)

---

## next action:

- Day 1/2 ranch-window work is closed locally under the administrator waiver with tray/pointer residual risk retained. Commit the one-line Day 2 focusability correction, then dispatch `[短工]#ranch-status-script@v0.2`.
- Do not start Day 4 or later cards before the ranch-status-script callback and bounded PM closeout.
- 长工交付后,PM-direct 跑三件套 + commit/push
- ranch-window-v0.2 收口后再按串行序列开 ranch-status-script-v0.2

---

## summary:

- 2026-07-10 管理员拍板 ② 串行首卡 `ranch-window-v0.2`;2026-07-11 管理员授权将五日 Goal 重排为 2026-07-11 ~ 2026-07-15;W27 已收口、W28 已激活，实际 worker 在本次控制面 rebaseline 后由 PM 使用 Codex 内部子 agent 串行派发。
