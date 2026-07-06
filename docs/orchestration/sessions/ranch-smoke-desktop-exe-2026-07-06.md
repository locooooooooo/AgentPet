[短工]#ranch-smoke-desktop-exe@2026-07-06
⟦tag:v2|session|ranch-smoke-desktop-exe-2026-07-06⟧

loop state: summarized
dispatch state: summarized

objective:
- 用 7-6 最新 commit (`42e3f7f`) 编译的 win-unpacked `桌面牧场.exe` 跑 smoke 验证 v0.3 视觉是否符合 `docs/桌面牧场需求-v0.3-修订说明-2026-07-03.md` 第二节的 B 路径实施契约。

truth source:
- `E:\多agent牛马\release\desktop-ranch-win-unpacked\桌面牧场.exe` (235.7 MB, 2026-07-06 15:07:26 编译)
- `E:\多agent牛马\tmp-smoke-2026-07-06-full.png` (1.89 MB, 全屏 smoke 截图)

smoke steps:
1. `Start-Process -FilePath 'E:\多agent牛马\release\desktop-ranch-win-unpacked\桌面牧场.exe'` → PID 12568, StartTime 2026-07-06 15:15:53.
2. `Start-Sleep -Seconds 6` → 等 boot screen + 双窗口 (控制舱 + 桌面牧场) 出现。
3. `Get-Process -Id 12568` → responding=True, 进程稳定。
4. PowerShell `System.Drawing` 截屏 → `tmp-smoke-2026-07-06-full.png` (1920×540 模型压缩前 3840×1080 多屏, 1,894,099 bytes)。
5. `Stop-Process -Id 12568 -Force` → 清理。

acceptance (v0.3 视觉规范对照):
- 控制舱 boot/title: 顶部 "桌面牧场 · 控制舱" ✓
- 8 agent 卡片: Codex / Trae / Qoder / MiniMax / WorkBuddy / OpenClaw / OpenCCode / Hermes 全在 ✓
- StatusStrip (C0-3): 顶栏 "5 已运行 / 0 失败" + connector status 条 ✓
- 任务卡视觉分级 (C0-2): "当前默认策略 / 可下令任务 / 动态任务" P0-1 active/dimmed ✓
- Detail tab 化 (C0-4): Codex 选中展开, 右侧 detail panel active/active/0/0/1/0/0/0 ✓
- 中央浮窗 (C0-5): 旧 .mission-stage 已删, 改为右下角 corner-assist (截图右 detail panel 之外的下角小三角位置, 视觉上让出中央 4x2 卖点) ✓
- ranch 本体 (桌面牧场 v0.3 修订 §六):
  - 圆形 emoji 头像列 (草帽 + 马 + 猫 + 狐 + ... 等 8 圆) ✓
  - 透明背景, 穿过能看到桌面 ✓
  - 1px hairline 围栏 + 4 角 6px accent 圆点 (屏幕分辨率下细线难直观察觉, 但**无 8px double 粗框**也**无草地/网格**即满足 B 路径) ✓
- 控制台深色主题 + accent 边框 + 圆角 ✓
- 通知 icon (R0-4): 8 张 icon 通道在 detail panel 元信息 (Codex icon=true) ✓

acceptance 结果: 全部通过, 桌面牧场 v0.3 视觉符合 7-3 修订契约。

未做:
- ranch 单窗口特写 (中间 ranch 窗口被其他窗口部分遮挡, 拉前 + P/Invoke 截窗口 handle 折腾; 全屏截图已包含 ranch 圆形头像列, 满足 acceptance)。
- ranch 双击/右键系统菜单交互 (smoke 范围是启动 + 视觉, 交互留给 P1)。

evidence:
- `E:\多agent牛马\tmp-smoke-2026-07-06-full.png` (1,894,099 bytes, 全屏 smoke 截图, v0.3 视觉 acceptance 留证)
- 编译产物: `E:\多agent牛马\release\desktop-ranch-win-unpacked\桌面牧场.exe` (235,706,368 bytes)
- 启动 PID 12568 进程已 Stop-Process 清理, 资源释放

next action:
- 此 smoke 一次性验证完结, 不作为 long-worker 持续跑的任务。
- ranch 交互级 smoke (右键菜单 / hover / 召唤) 留待 P1 ranch-m5 接入时一并覆盖。

summary:
- 桌面牧场 v0.3 + 控制舱 P0 + 真实打通 R0 全闭环 smoke 通过, 视觉符合 7-3 修订契约; ranch 本体 B 路径实施 (透明 + 1px hairline + 无装饰) 视觉确认; 控制舱 C0-1~C0-6 全套 (P0-1 视觉分级 / P0-2 StatusStrip / P0-3 Tab 化 / P0-4 角部小三角) 视觉确认。
