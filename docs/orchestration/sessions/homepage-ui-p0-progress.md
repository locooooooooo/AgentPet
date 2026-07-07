# homepage-ui-p0@v0.1 progress

[PM]#homepage-ui-p0@v0.1
⟦tag:v2|session|homepage-ui-p0-progress⟧

loop state: standby
dispatch state: standby

date: 2026-07-07
source request: 用户拍"将首页的ui设计 提到p0上，单独开分工去做" → PM-direct 派工包 + 长工 thread 待启动
task card: `docs/orchestration/tasks/homepage-ui-p0-v0.1.md`
dispatch package: `docs/orchestration/tasks/homepage-ui-p0-dispatch-v0.1.md`
long-worker thread: `TBD - PM 启动 mavis session 后分配`

completed:
- 2026-07-07 PM-direct 收到用户拍板"全新首页 / landing / 启动页 + 长工派工"
- P0 任务卡落档 `docs/orchestration/tasks/homepage-ui-p0-v0.1.md`（v0.1 准入 + H0-1~H0-4 子任务）
- 长工派工包落档 `docs/orchestration/tasks/homepage-ui-p0-dispatch-v0.1.md`（write scope + forbidden + acceptance）
- 进度卡初始化（本文件）
- `status.json` p0Cards / roles / lanes 同步新增 homepage-ui-p0
- `index.md` tracked business cards 同步新增 2 张卡（v0.1 + dispatch）
- `weekly-requirements-2026-07-07.md` 同步新增 P0-0 段
- 1 commit + push 到 origin/main（待执行）
- 长工 thread 尚未启动

incomplete:
- 长工 thread 待 PM 启动 mavis session 后分配 thread id
- 3 套设计稿待出（H0-1）
- 用户对"全屏大卡片华丽展示"具体风格尚未拍板
- H0-2 / H0-3 / H0-4 实施未开始
- 关键指标数据源（snapshot.lastEvent）需在 H0-2 实施时确认 graceful degradation 路径

blockers:
- 长工 thread 未启动（**唯一硬 blocker**）
- 用户对首页视觉风格未拍板（H0-1 后解锁）
- 桌面牧场 ranch-m5（M5 implementation）尚未派工，与本 P0 独立但数据复用需协调

next action:
- **PM** 启动长工 mavis session：`mavis session new general --title "homepage-ui-design"`
- **PM** 把 thread id 写回 dispatch 包的 `## next action` 段、status.json roles/lanes 字段、本卡 `## long-worker thread` 字段
- **PM** 提交 follow-up commit 标记 thread 启动
- **长工** 读任务卡 + 派工包 + 全部真源
- **长工** H0-1 出 3 套设计稿（轻量 / 中等 / 华丽）归档 `homepage-ui-p0-design-2026-07-XX.md`
- **用户** 拍板设计稿
- **长工** H0-2 HomePage 组件 + 路由
- **长工** H0-3 视觉打磨
- **长工** H0-4 卖点 0 字节确认
- **PM** 收口 + 1 commit + push
- `status.json` p0Card 状态 `in_progress` → `accepted`
- `index.md` 加入 accepted 任务清单
- `weekly-requirements-2026-07-07.md` 标记本 P0 闭环

evidence:
- 任务卡：`docs/orchestration/tasks/homepage-ui-p0-v0.1.md`（v0.1 P0 任务卡）
- 派工包：`docs/orchestration/tasks/homepage-ui-p0-dispatch-v0.1.md`（长工派工包）
- 控制面同步：`docs/orchestration/status.json`（p0Cards[0] / roles[+] / lanes[+] / target 更新）
- 索引同步：`docs/orchestration/index.md`（tracked business cards[+2] / current target 更新 / current role split[+]）
- 周计划同步：`docs/orchestration/sessions/weekly-requirements-2026-07-07.md`（P0-0 段新增）
- 1 commit + push origin/main（待执行）

summary:
- P0 准入完成（任务卡 + 派工包 + 进度卡 + 控制面同步 + 周计划同步）。
- 长工 thread 待 PM 启动 mavis session 后分配。
- 预计 7-8 ~ 7-9 长工实施 + 用户拍板设计稿 + 视觉打磨 + 卖点 0 字节验收。
- 落地后产品三个独立 UI 单元协同：桌面牧场 v0.3 + 控制舱 v0.3 + 首页 v1.0。
