# Homepage UI P0 · 3 套设计稿

[长工]#homepage-ui-design@v0.1
⟦tag:v2|session|homepage-ui-p0-design-2026-07-07⟧
loop state: summarized
dispatch state: summarized

> **H0-1 交付物**：3 套首页 / landing 设计稿（轻量 / 中等 / 华丽）+ 信息架构 + 配色 + 关键文案
> **配套可视化预览**：`docs/orchestration/sessions/homepage-ui-p0-design-2026-07-07.html`（浏览器打开可并排看 3 套实际渲染）
> **任务卡**：`docs/orchestration/tasks/homepage-ui-p0-v0.1.md` § H0-1
> **派工包**：`docs/orchestration/tasks/homepage-ui-p0-dispatch-v0.1.md`
> **用户拍板点**：H0-2 实施前由用户三选一（或提修订意见再启一轮 H0-1）
> **承诺约束**：本卡不动 §〇·quarter 卖点文件 / 不写代码 / 不 commit / 不动 status.json & index.md & weekly-requirements

---

## 〇、设计稿整体定位

### 0.1 共同基线（3 套都要守）

| 项 | 共同规范 | 来源 |
|---|---|---|
| **品牌名** | 桌面牧场 | `docs/桌面牧场需求-v0.3.md` §〇 |
| **3 级信息层级** | L1 品牌头 / L2 主内容 / L3 折叠入口 | `docs/桌面牧场需求-v0.3.md` §〇·quinary |
| **色板继承** | `--green #00d68f / --blue #4da3ff / --orange #ff7a1a / --red #ff4d5f` + `--panel rgba(17,17,17,.88)` + `--border rgba(255,255,255,.09)` | `src/index.css` |
| **背景** | `#080808` 深色 + 系统字（Inter / Microsoft YaHei）| `src/index.css :root` |
| **8 动物 emoji** | 🐂 🦓 🦉 🦚 🦥 🦨 🐢 🦊（逐字符同源 `agentAnimals.ts`）| §〇·quarter 卖点保护 |
| **文案主调** | 拟人化（牛马 / 拉磨 / 摸鱼 / 派活），与控制舱 + 牧场文案体系一致 | 既有产品 |
| **数据源** | `AgentSnapshot.agents/runtime/messages` + `ORCHESTRATION_STATUS` + `CONNECTOR_POLICY` | `src/types.ts` |
| **graceful degradation** | 字段缺失显示 "—" / "暂无"，不报错 | 派工包 |
| **响应式** | 必须 1920×1080 无破图 + 1366×768 关键内容在 fold above | 派工包 |
| **保护文件** | `NiuMaAvatar.tsx` / `index.css` 中央 8 卡 / `agentCore.ts` 不动 | §〇·quarter |

### 0.2 3 套设计的本质差异

| 维度 | 轻量（A） | 中等（B · 默认推荐） | 华丽（C · 用户偏好方向）|
|---|---|---|---|
| **设计气质** | 极简扁平 / 工程师桌面 | 平衡美观 + 信息密度 | 全屏大卡片华丽展示 |
| **L1 头** | 小 logo + 一行 tagline | 中 logo + 双行 tagline | 大 logo + 装饰元素 + 多行 |
| **8 动物视觉** | 56px emoji + accent ring，4×2 紧凑 | 72px emoji + accent ring + 表情行 + slot 标签，4×2 适中 | 88px emoji + accent glow + 表情 + 1 行 codename，4×2 大卡 |
| **控制舱入口** | 文本按钮（`>` 箭头）| 中等卡片，居中 | 大主卡 + 副卡（数据一览）|
| **关键指标** | 3 个 inline chip 一行 | 4 个 metric 卡 1×4 | 4 个 metric 卡 2×2 + 大数字 + 颜色编码 + 图标 |
| **L3 入口** | footer 链接文字 hover 出现 | 折叠按钮 | 浮动 FAB + 抽屉 |
| **装饰元素** | 0（仅 accent border）| 玻璃拟态（半透明 + 1px 渐变描边 + 模糊）| 全屏渐变 + accent glow + 拟物化阴影 + 粒子背景 + hover 动效 |
| **信息密度** | 低 | 中 | 高（但分层清晰）|
| **屏占比（L2）** | 约 50% | 约 65% | 约 78% |
| **过渡动效** | 0 | hover ≤ 200ms | hover + 进入 ≤ 250ms |
| **视觉冲击** | ★★ | ★★★ | ★★★★★ |
| **适用场景** | 节省屏幕 / 快速进工作 | 默认推荐 / 通用场景 | 对外门面 / 分享截图 / 完整首屏体验 |
| **实施成本** | 1× | 1.5× | 2× |

### 0.3 用户已表达偏好的处理

> 用户原话（2026-07-07 PM-direct）："全屏大卡片华丽展示"

→ 默认把 **C · 华丽** 当作主推方向，但同时提供 A · 轻量 作为备案回退（派工包 §五·风险已写明），
   以及 B · 中等 作为"既不冒险也不寒酸"的折中选项，让用户三选一时有真实对比。

---

## 一、套 A · 轻量

> **气质**：工程师的桌面入口 —— 极简、扁平、不抢戏。进来就走，不停留。
> **设计原则**：装饰元素 = 0；卡片只有 1px hairline；动画 = 0。

### 1.1 信息架构

```
┌─ L1（极简头） ───────────────────────────────────────────────────┐
│  🐄 桌面牧场 · 一句 tagline                                  ≡ │
└─────────────────────────────────────────────────────────────────┘
┌─ L2 主体（窄 4×2 动物矩阵 + 入口）───────────────────────────────┐
│  ┌────┐┌────┐┌────┐┌────┐                                       │
│  │ 🐂 ││ 🦓 ││ 🦉 ││ 🦚 │   ← 4×2 紧凑网格，56px emoji，1px     │
│  ├────┤├────┤├────┤├────┤     hairline 描边，无阴影，accent      │
│  │ 🦥 ││ 🦨 ││ 🐢 ││ 🦊 │     ring 4px（不发光）                  │
│  └────┘└────┘└────┘└────┘                                       │
│                                                                  │
│  正在拉磨 2 头 · 活跃 Lanes 1 · Gate 3 blocked    [ > 进控制舱 ]  │
└─────────────────────────────────────────────────────────────────┘
┌─ L3（footer 折叠）─────────────────────────────────────────────────┐
│  · 设置 · 文档 · 关于                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 配色

- 背景：`#080808`（与控制舱完全一致）
- 卡片背景：`transparent`（无背景色）
- 描边：`var(--border) rgba(255,255,255,0.09)`，1px
- 选中 accent：`var(--blue) #4da3ff`（对应 agent.accent 实际取自动物）
- 文字：主 `#f5f5f5` / 次 `var(--text-muted) #8f8f96`
- 没有任何渐变 / glow / 阴影

### 1.3 关键文案

- L1：`🐄 桌面牧场 · 一句 tagline`
- tagline 候选（任选）：
  - "8 头牛马，1 个控制舱，随时待命"
  - "把活的 AI Agent 关进牧场"
  - "Mavis / Claude / Codex / Trae 都圈在这儿"
- 8 动物卡片：**只有 emoji + agent.name**，不加表情行 / 不加 codename / 不加状态文字
- 状态条：`正在拉磨 N 头 · 活跃 Lanes M · Gate K blocked`
- 入口按钮：`> 进控制舱`（单行文本 + 箭头，hover 颜色变 `--blue`）
- L3：`· 设置 · 文档 · 关于`（行内文本，hover 显形）

### 1.4 适用 / 不适用

| ✅ 适合 | ❌ 不适合 |
|---|---|
| 屏幕小（笔电 1366×768）| 截图分享 / 营销场景 |
| 用户"打开就走"的工作流 | 想给客户/同事"秀一眼" |
| 不喜欢装饰元素 | 想体现产品打磨感 |

---

## 二、套 B · 中等（默认推荐）

> **气质**：平衡美观与信息密度。既不像 A 那么"素"，也不像 C 那么"压"。**所有用户都能接受的下限 + 上限**。
> **设计原则**：玻璃拟态（半透明面板 + 1px 渐变描边 + 模糊背景）+ hover 阴影提升。

### 2.1 信息架构

```
┌─ L1（中等头 · 含 L2 入口 + 状态条）──────────────────────────────┐
│   🐄  桌面牧场                                                  │
│       8 头牛马，1 个控制舱，随时待命                              │
│                                       [· 桌面牧场设置] [ ⟳ 重置 ]│
├─ L2 主内容 ─────────────────────────────────────────────────────┤
│ ┌─ L2.1 控制舱入口主卡（横跨全宽，居中高亮）─────────────────────┐│
│ │ 🐄 控制舱                            8 头在线 · 0 拉磨中       ││
│ │ 深色高对比 · 左轨追踪调度 · 右轨可操作任务面板        [ 进 → ] ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─ L2.2 8 动物概览（4×2 网格，每张 72px emoji）─────────────────┐│
│ │ ┌─[1]─┐ ┌─[2]─┐ ┌─[3]─┐ ┌─[4]─┐                              ││
│ │ │ 🐂  │ │ 🦓  │ │ 🦉  │ │ 🦚  │   slot 标签 + accent ring     ││
│ │ │codex│ │trae │ │qoder│ │…    │   + 表情行（来自 STATE_METAS）││
│ │ │(•_•)│ │(◕‿◕)│ │…    │ │…    │                              ││
│ │ │[+电量│ │…    │ │…    │ │…    │   电量条（hairline 4px）     ││
│ │ └─────┘ └─────┘ └─────┘ └─────┘                              ││
│ │ ┌─[5]─┐ ┌─[6]─┐ ┌─[7]─┐ ┌─[8]─┐                              ││
│ │ │ 🦥  │ │ 🦨  │ │ 🐢  │ │ 🦊  │                              ││
│ │ │…    │ │…    │ │…    │ │…    │                              ││
│ │ └─────┘ └─────┘ └─────┘ └─────┘                              ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─ L2.3 关键指标卡组（1×4 横排）─────────────────────────────────┐│
│ │ ┌─ 任务数 ─┐ ┌─ Lane 状态 ─┐ ┌─ Connector Gate ─┐ ┌─ 最近事件 ─┐││
│ │ │   12     │ │ active 3    │ │ 1 blocked       │ │ ⚡ Code…  ││
│ │ │进行 2   │ │blocked 1    │ │3 / 3 总        │ │5s 前      ││
│ │ └─────────┘ └─────────────┘ └────────────────┘ └────────────┘││
│ └──────────────────────────────────────────────────────────────┘│
├─ L3（折叠条 · 默认显示）──────────────────────────────────────────┤
│  ▼  设置 文档 关于                                  v0.3 · OPS-RANCH v2.6 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 配色

- 背景：`#080808` + `linear-gradient(180deg, rgba(255,255,255,0.04), transparent 220px)` + `radial-gradient(circle at 35% -20%, rgba(77,163,255,0.10), transparent 36%)`（与控制舱背景完全同源）
- 卡片背景：`linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))`（玻璃感）
- 卡片描边：`var(--border-strong) rgba(255,255,255,0.16)`，1px
- 卡片阴影（hover）：`0 12px 32px rgba(0,0,0,0.45), 0 0 0 1px var(--agent-accent) inset`（accent ring 由内向外）
- L2.1 控制舱入口主卡：accent glow `box-shadow: 0 0 32px rgba(77,163,255,0.18), 0 24px 56px rgba(0,0,0,0.5)`
- L2.3 metric 卡：
  - 红 `var(--red) #ff4d5f` = blocked / error
  - 黄 `var(--orange) #ff7a1a` = warning / pending
  - 绿 `var(--green) #00d68f` = success / clear
  - 蓝 `var(--blue) #4da3ff` = info / running
- 文字：主 `#f5f5f5` / 次 `var(--text-muted)` / 高亮 accent 用对应色

### 2.3 关键文案

- L1：`🐄 桌面牧场`
  - 主标题：`桌面牧场`（24px / weight 760）
  - tagline：`8 头牛马，1 个控制舱，随时待命`（13px / muted）
- L2.1 主卡：
  - 左：`🐄 控制舱`（大 emoji + 标题）
  - 中：`深色高对比 · 左轨追踪调度 · 右轨可操作任务面板`（描述 1 行）
  - 右 metric：`8 头在线 · 0 拉磨中`
  - 按钮：`进 →`（hover 时变蓝底蓝字）
- L2.2 8 动物卡（每张）：
  - 左上角：`[1]` slot 标签（小，hairline 描边）
  - 中央：emoji 72px + accent ring 6px
  - 下：agent.name `Codex`（14px bold）+ STATE_METAS.expression `(•_•) 💤`（11px muted）
  - 底：电量条 4px hairline，accent 填充
- L2.3 关键指标 4 卡：
  - `任务数`  `12`  `进行 2`
  - `Lane 状态`  `active 3`  `blocked 1`
  - `Connector Gate`  `1 blocked`  `3 / 3 总`
  - `最近事件`  `⚡ Codex 启动`  `5s 前`
- L3 footer：`▼ 设置 文档 关于`（折叠展开，hover 时描边变 `--blue`）+ 右侧 `v0.3 · OPS-RANCH v2.6`
- 整页右下角固定一个浮动"召唤控制舱"按钮（小，hover 时放大变蓝）

### 2.4 视觉规范

| 元素 | 规范 |
|---|---|
| 圆角 | 卡片 12px / 按钮 8px / chip 6px |
| 间距 | 卡片间距 14px / 内 padding 16px / 段间距 24px |
| 字号 | H1 24px / H2 18px / H3 14px / 正文 13px / 小字 11px |
| 字体 | `Inter, system-ui, "Microsoft YaHei", sans-serif` |
| emoji 字体 | 系统 emoji + `drop-shadow 0 2px 8px var(--agent-accent)` |
| hover 反馈 | 卡片 `transform: translateY(-2px)` + 阴影增强，≤ 200ms ease-out |
| 进入动效 | 首屏 stagger 40ms × 12 项 fade-in，总 ≤ 600ms |

### 2.5 适用 / 不适用

| ✅ 适合 | ❌ 不适合 |
|---|---|
| 默认推荐场景 | 极端"华丽展示"需求 |
| 平衡第一屏视觉 + 工作效率 | 想"压"用户视线到品牌区 |
| 任何屏幕尺寸 | 想精确控制每像素 |

---

## 三、套 C · 华丽（用户偏好方向）

> **气质**：全屏大卡片华丽展示 —— 跟用户说的"全屏大卡片华丽展示"字面对齐。视觉冲击强、品牌区显眼、每个动物都像被"框"起来展示。
> **设计原则**：渐变背景 + accent glow + 拟物化阴影 + 粒子装饰 + hover 动效全开。

### 3.1 信息架构

```
┌─ L1（大品牌头 · 全宽 hero）─────────────────────────────────────────┐
│   ░░░░░░ 渐变粒子背景（蓝→绿 radial gradient + 微星点）░░░░░░░    │
│                                                                  │
│   ███  🐄                                                        │
│   ███  桌面牧场                                                  │
│   ███  ─────────────────────────                                  │
│   ███  多 Agent 牛马核心部门 · 桌面端门户                          │
│   ███  把活的 AI Agent 关进牧场 · 随时召唤                        │
│                                                                  │
│   ███  [ ● OPS-RANCH v2.6 ]  [ ● 8 头在线 ]  [ ● 0 拉磨中 ]       │
│                                                                  │
│   ███                       [ ➜ 召唤控制舱 ·  Enter ]           │
└──────────────────────────────────────────────────────────────────┘
┌─ L2 主体（8 动物独立大卡 + 控制舱 + 指标）─────────────────────────┐
│ ┌─ L2.1 8 动物大卡（4×2 网格，每张 ~280×220px）────────────────────┐
│ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│ │ │   ╭───╮      │ │   ╭───╮      │ │   ╭───╮      │ │   ╭───╮      ││
│ │ │   │ 🐂│      │ │   │ 🦓│      │ │   │ 🦉│      │ │   │ 🦚│      ││
│ │ │   ╰─┬─╯      │ │   ╰─┬─╯      │ │   ╰─┬─╯      │ │   ╰─┬─╯      ││
│ │ │   accent      │ │   accent      │ │   accent      │ │   accent      ││
│ │ │   ring 发光   │ │   ring 发光   │ │   ring 发光   │ │   ring 发光   ││
│ │ │ [1号] Codex   │ │ [2号] Trae    │ │ [3号] Qoder   │ │ [4号] MiniMax ││
│ │ │ 批发排障       │ │ 带薪拉屎       │ │ 佛祖保佑       │ │ 废话周会       ││
│ │ │ (•_•) 💤      │ │ (◕‿◕) ☕      │ │ (ᵔᴥᵔ) 🪷      │ │ (¬‿¬) 🦚      ││
│ │ │ ▓▓▓▓░░ 72%    │ │ ▓▓▓▓▓▓ 100%   │ │ ▓▓▓░░░ 45%    │ │ ▓▓▓▓▓░ 88%    ││
│ │ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘│
│ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│ │ │   🦥         │ │   🦨         │ │   🐢         │ │   🦊         ││
│ │ │ [5号] WorkBuddy│ │[6号] OpenClaw│ │[7号] OpenCCode│ │[8号] Hermes  ││
│ │ │ 打水摸鱼       │ │ 生产救火       │ │ 佛系发版       │ │ 热舞躺平       ││
│ │ │ ▓▓▓▓▓▓ 100%   │ │ ▓░░░░░ 18%    │ │ ▓▓▓▓▓▓ 92%    │ │ ▓▓▓▓░░ 76%    ││
│ │ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘│
│ └──────────────────────────────────────────────────────────────────┘
│                                                                  │
│ ┌─ L2.2 控制舱主卡 + 副卡（2 列：主卡 60% + 副卡 40%）─────────────┐
│ │ ┌─ 主卡 ──────────────────────────────────────────┐ ┌─ 副卡 ─────┐│
│ │ │ 🐄  控制舱                                      │ │ 最近 24h   ││
│ │ │  深色高对比 · 左轨调度 · 右轨任务               │ │ • 完成 12   ││
│ │ │  8 头在线 · 0 拉磨 · 3 阻塞 · 2 队列            │ │ • 拉磨 4   ││
│ │ │              [ ➜ 召唤控制舱 · Enter ]            │ │ • 阻塞 3   ││
│ │ └────────────────────────────────────────────────┘ └────────────┘│
│ └──────────────────────────────────────────────────────────────────┘
│                                                                  │
│ ┌─ L2.3 关键指标卡组（2×2，每张 ~280×140px 大数字）────────────────┐
│ │ ┌─ 任务数 ──────────┐ ┌─ Lane 状态 ─────────┐                    │
│ │ │      12          │ │      ● 3 active     │                    │
│ │ │   ⚡ 进行 2     │ │   ▲ 1 blocked       │                    │
│ │ └───────────────────┘ └──────────────────────┘                    │
│ │ ┌─ Connector Gate ─┐ ┌─ 最近事件 ──────────┐                    │
│ │ │    1 blocked     │ │  ⚡ Codex 启动      │                    │
│ │ │  3 / 3 总        │ │  5s 前 · success    │                    │
│ │ └──────────────────┘ └──────────────────────┘                    │
│ └──────────────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────────┘
┌─ L3（浮动 FAB + 抽屉）─────────────────────────────────────────────┐
│                          ⊕  桌面牧场设置    ⊕  文档    ⊕  关于    │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 配色

- 背景：
  - 主：`#080808` + `radial-gradient(circle at 15% 0%, rgba(77,163,255,0.18), transparent 40%)` + `radial-gradient(circle at 85% 0%, rgba(0,214,143,0.14), transparent 38%)` + `radial-gradient(circle at 50% 100%, rgba(255,122,26,0.10), transparent 36%)`
  - 装饰：`background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)` 40px × 40px 微星点纹理（仅 L1 + L2.1 区域）
- 卡片背景：`linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))` + `backdrop-filter: blur(12px)`
- 卡片描边：`linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.04))` 1px（渐变描边）
- 卡片阴影：`0 24px 56px rgba(0,0,0,0.5)` + accent 内发光 `0 0 0 1px var(--agent-accent) inset, 0 0 32px var(--agent-accent)`（hover 时）
- L2.2 主卡 accent glow：`box-shadow: 0 0 64px rgba(77,163,255,0.24), 0 32px 80px rgba(0,0,0,0.55)`
- L2.3 指标数字：
  - 大数字 48px / weight 720
  - 配色按 tone：红 `var(--red)` / 黄 `var(--orange)` / 绿 `var(--green)` / 蓝 `var(--blue)`
- L3 FAB：`rgba(15,23,42,0.85)` + `backdrop-filter: blur(8px)` + 1px hairline

### 3.3 关键文案

- L1：
  - 大 logo：`🐄`（96px + accent glow `0 0 24px rgba(77,163,255,0.5)`）
  - H1：`桌面牧场`（48px / weight 800 / letter-spacing 4px）
  - 副线：`多 Agent 牛马核心部门 · 桌面端门户`（14px / muted / tracking-wide）
  - tagline：`把活的 AI Agent 关进牧场 · 随时召唤`（16px / 白色 / tracking-wide）
  - 徽章：`● OPS-RANCH v2.6` / `● 8 头在线` / `● 0 拉磨中`（inline chip，accent dot）
  - CTA：`➜ 召唤控制舱 · Enter`（28px 高，圆角 14px，渐变蓝底 + accent glow，hover 时外圈光环扫过）
- L2.1 8 动物大卡（每张）：
  - 大 emoji 88px + accent ring 8px（hover 时 ring 发光 + emoji 微浮 2px）
  - `[1号] Codex`（slot 标签 + agent.name，14px bold）
  - codename：`批发排障`（12px muted）
  - 状态表达式：`(•_•) 💤`（14px accent 色）
  - 电量条：`▓▓▓▓░░ 72%`（6px 高，accent 渐变填充，剩余 muted）
- L2.2 主卡：
  - 大 emoji + `控制舱`（22px bold）
  - 描述：`深色高对比 · 左轨调度 · 右轨任务`（13px muted）
  - 数据行：`8 头在线 · 0 拉磨 · 3 阻塞 · 2 队列`（11px mono / muted）
  - CTA：`➜ 召唤控制舱 · Enter`（蓝渐变按钮 + glow）
  - 副卡：`最近 24h`（标题 14px）+ 三行 `• 完成 12` / `• 拉磨 4` / `• 阻塞 3`（11px muted）
- L2.3 指标卡：见 2.1.3 中等版数据 + 数字放大 4× + 加图标（Activity / ShieldAlert / PlugZap / Bell）
- L3 FAB：
  - `⊕ 桌面牧场设置`（点击展开 ranch settings panel，与控制舱同源）
  - `⊕ 文档`（打开 README）
  - `⊕ 关于`（打开 About 弹窗）
  - 默认 3 个 FAB 圆圈 36px，靠右下角 12px 间距横排，hover 时背景变蓝

### 3.4 视觉规范

| 元素 | 规范 |
|---|---|
| 圆角 | 卡片 16px / 按钮 14px / chip 8px / FAB 圆 |
| 间距 | 卡片间距 18px / 内 padding 20px / 段间距 32px |
| 字号 | L1 H1 48px / H2 22px / 卡片 H3 16px / metric 大数字 48px / 正文 13px / 小字 11px |
| 字体 | 同 B 套（Inter / system-ui / "Microsoft YaHei"）|
| 装饰 | accent glow / radial gradient / 渐变描边 / 拟物化阴影 / 微星点纹理 / backdrop-filter blur |
| emoji 字体 | 系统 emoji + `drop-shadow 0 0 12px var(--agent-accent), 0 4px 16px rgba(0,0,0,0.6)` |
| hover 反馈 | 卡片 `transform: translateY(-4px) scale(1.02)` + accent glow 加强，≤ 250ms cubic-bezier |
| 进入动效 | 首屏 stagger 50ms × 14 项 fade-in + slide-up 12px，总 ≤ 700ms |
| 持续动效 | L1 accent dot 呼吸 `breathe 2.4s ease-in-out infinite`（复用控制舱节奏）|

### 3.5 适用 / 不适用

| ✅ 适合 | ❌ 不适合 |
|---|---|
| 用户偏好"全屏大卡片华丽展示" | 屏小（笔电 1366×768 关键内容仍能塞下，但视觉压迫感强）|
| 截图分享 / 营销 / 给客户秀一眼 | 用户"打开就走"的极简工作流 |
| 启动"门面页" + 给牧场做视觉升级 | 想要"省 CPU / 省 GPU" |

---

## 四、3 套并排视觉对照

> 完整可视化预览见 `docs/orchestration/sessions/homepage-ui-p0-design-2026-07-07.html`（浏览器打开可同时看 3 套实际渲染，对照效果）

下面用 ASCII mini-wireframe 做概览对照（实际视觉以 HTML 预览为准）：

```
┌─ 轻量 A ──────────┐  ┌─ 中等 B ──────────┐  ┌─ 华丽 C ──────────┐
│ 🐄 桌面牧场       │  │ 🐄 桌面牧场        │  │ ░░渐变粒子背景░░   │
│ 一行 tagline      │  │ 双行 tagline      │  │ 🐄 大 logo         │
│                   │  │                   │  │ 桌面牧场 48px     │
│ 4×2 紧凑 56px     │  │ L2.1 主卡       │  │ 多行 tagline      │
│ emoji + hairline  │  │ 4×2 72px 卡片    │  │ 徽章 × 3          │
│                   │  │ 1×4 metric 卡    │  │                   │
│ 3 chip inline     │  │                   │  │ 4×2 大卡 88px    │
│ `> 进控制舱` 按钮  │  │ L2.2 控制舱主卡  │  │ emoji + glow      │
│                   │  │ 1×4 metric 中卡  │  │ L2.2 主+副卡      │
│ · 设置 · 文档 · 关于│ │ ▼ 折叠 footer    │  │ L2.3 2×2 大指标  │
│                   │  │                   │  │ ⊕ ⊕ ⊕ FAB        │
│ 装饰: 0           │  │ 装饰: 玻璃拟态    │  │ 装饰: 全开        │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

---

## 五、关键设计决策（与用户拍板相关）

> 这些都是用户没明确说过的、由设计稿"代为提案"、但用户必须拍板的点。

| # | 决策点 | A 轻量 | B 中等 | C 华丽 | 派工包默认 |
|---|---|---|---|---|---|
| D1 | **首页 always-first vs dismissable intro？** | dismissable（用户首选项设后跳过）| always-first | always-first | 待用户拍 |
| D2 | **8 动物网格：4×2 vs 2×4 vs 横滑 carousel？** | 4×2 | 4×2 | 4×2 | 4×2 |
| D3 | **8 动物卡点击行为？** | 进牧场对应动物 | 进牧场对应动物 | 进牧场对应动物 + 高亮该动物 1.5s | 进牧场对应动物 |
| D4 | **8 动物卡是否显示电量？** | 否 | 是（hairline 4px） | 是（6px 大条 + 数字） | 否（§〇·quinary L1 极简约束）|
| D5 | **8 动物卡是否显示 codename？** | 否 | 否 | 是（中等套也可加）| 否（§〇·quinary）|
| D6 | **L2.2 控制舱入口位置？** | 底部一行 | 顶部主卡（首屏 fold above）| 顶部主卡 + 副卡 | 顶部主卡 |
| D7 | **关键指标卡数量：3 / 4 / 6？** | 3 chip | 4 卡 | 4 卡（2×2 大数字）| 4 卡（任务数 / Lane / Gate / 最近事件）|
| D8 | **数据缺失 graceful degradation？** | 显示 `—` | 显示 `暂无` + muted | 显示 `暂无` + 占位骨架 | 显示 `—` |
| D9 | **L3 折叠区实现？** | 行内文字 hover | 折叠按钮 + drawer | 浮动 FAB + drawer | 折叠按钮 |
| D10 | **是否复用控制舱中央 8 卡？** | ❌（卖点保护） | ❌ | ❌ | ❌（§〇·quarter）|

> **派工包默认 = 中间路**：4×2 / 顶部主卡 / 4 卡 / graceful 显示 `—` / 折叠按钮。
> 用户没明确说就按派工包默认走；如果用户在 H0-2 实施前有偏好，按用户偏好走。

---

## 六、H0-1 验收基线（派工包 § 3.1 / 3.2 对齐）

| 验收项 | 状态 |
|---|---|
| 3 套设计稿归档（本卡）| ✅ |
| ASCII wireframe（含 L1/L2/L3）| ✅ |
| 配色方案（含 hex / rgba）| ✅ |
| 关键文案（含每张卡的拟人化文案）| ✅ |
| 字体 / 字号 / 圆角规范 | ✅ |
| 响应式策略（1920×1080 + 1366×768）| ✅（各套已写）|
| 卖点保护承诺（不动 §〇·quarter 文件）| ✅（本卡零代码）|
| 用户拍板点（D1~D10）| ✅（§五 已列）|
| 视觉预览（HTML 并排）| ✅（独立文件，零代码）|
| **等用户拍板** | 🟡（待 H0-2 启动） |

---

## 七、H0-1 → H0-2 流转

**用户拍板后**：

1. 长工把用户拍的套号 + 修订意见写进 `docs/orchestration/sessions/homepage-ui-p0-design-accepted-2026-07-07.md`
2. 更新本进度卡 `homepage-ui-p0-progress.md` 标记 H0-1 accepted
3. 进入 H0-2 实施：建 `src/homepage/HomePage.tsx` + `HomePage.css` + 子组件 + App.tsx 路由跳转 + NiuMaWorkspace.tsx 加"返回首页"按钮
4. H0-2 实施期间不重开设计稿（避免范围漂移）
5. H0-3 视觉打磨（基于 H0-2 出的实际效果微调）
6. H0-4 卖点 0 字节确认（git diff 强制）

**若用户对 3 套都不满意**：

- 启一轮 H0-1（≤ 1h 增量工时，按派工包 §五 风险预案）

---

## 八、附录

### 8.1 8 动物 + accent ring 配色（与 `AGENT_ANIMALS` 同源）

| slot | agentId | displayName | codename | emoji | accent（沿用 `src/index.css` `--green / --blue / --orange / --red` 之一）|
|---|---|---|---|---|---|
| 1 | codex | Codex | 批发排障 | 🐂 | `--blue` `#4da3ff` |
| 2 | trae | Trae | 带薪拉屎 | 🦓 | `--green` `#00d68f` |
| 3 | qoder | Qoder | 佛祖保佑 | 🦉 | `--orange` `#ff7a1a` |
| 4 | minimax | MiniMax | 废话周会 | 🦚 | `--red` `#ff4d5f` |
| 5 | workbuddy | WorkBuddy | 打水摸鱼 | 🦥 | `--blue` `#4da3ff` |
| 6 | openclaw | OpenClaw | 生产救火 | 🦨 | `--green` `#00d68f` |
| 7 | openccode | OpenCCode | 佛系发版 | 🐢 | `--orange` `#ff7a1a` |
| 8 | hermes | Hermes | 热舞躺平 | 🦊 | `--red` `#ff4d5f` |

> 注：accent 与控制舱 + 牧场保持**逐字符同源**，不引入新色（§〇·quarter 卖点保护）。

### 8.2 数据源映射（H0-2 `useHomePageData` 用）

| 首页展示 | 数据来源 |
|---|---|
| L1 tagline | 硬编码字符串 |
| 8 动物名字 / codename / emoji / accent | `AGENT_ANIMALS` + `AgentSnapshot.agents` |
| 动物状态表达式 | `STATE_METAS[runtime.status].expression` |
| 动物电量 | `runtime.energy` |
| 任务数（running / total）| `snapshot.agents[].tasks[].status === 'running'` 计数 |
| Lane 状态 | `ORCHESTRATION_STATUS.lanes` |
| Connector Gate | `CONNECTOR_POLICY.connectors` + `connectorGateResults` |
| 最近事件 | `snapshot.messages[0]` |
| 8 头在线 | `snapshot.agents.length` |
| 最近更新 | `snapshot.updatedAt` |

### 8.3 8 个 emoji 的渲染一致性

| 套别 | emoji 尺寸 | 是否描 accent ring | 是否发光 |
|---|---|---|---|
| A 轻量 | 56px | 是（4px）| 否 |
| B 中等 | 72px | 是（6px）| hover 时 |
| C 华丽 | 88px | 是（8px）| 是（持续）|

> 所有 emoji 字符 = `AGENT_ANIMALS[i].visual.glyph`，**不改字符**（§〇·quarter 卖点保护）。

### 8.4 引用约束

- 不动 `NiuMaAvatar.tsx` / `index.css` 中央 8 卡样式 / `agentCore.ts`
- 不动 `src/ranch/**`
- 不动 `electron/main.ts` / `electron/preload.ts`
- 不动 `connectors.json`
- 不动 `package.json` name / productName / description
- 不动 `icon/**`
- 不引新依赖（Tailwind / vitest 都不要）
- 不接外部 agent CLI

### 8.5 与既有视觉资产的对齐

- 配色 100% 复用 `src/index.css` 的 `--green/--blue/--orange/--red/--panel/--border`
- 字体 100% 复用 `src/index.css` 的 Inter / Microsoft YaHei fallback chain
- 圆角风格 100% 复用 6/8/12px hairline + 玻璃面板
- emoji drop-shadow 风格复用控制舱中央 8 卡的 `drop-shadow` 写法
- 动效曲线复用 `ease-in-out` + `infinite` 节奏（与 `breathe / blink` keyframe 同源）

---

> **本卡状态**：H0-1 交付完成，等用户拍板。
> **下一步**：用户回复 "用 B" / "用 C" / "A 再改 X" / "重新出一轮" 任意一条，长工启动 H0-2 实施。
