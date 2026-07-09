// animal-emotions-v4.html 生成器
// v4: 用 emoji + motion/react 14 态 keyframes(与 NiuMaAvatar 同款模式),不画像素
// 用法: node build-animals-v4.cjs animal-emotions-v4.html

const fs = require('fs');
const path = require('path');
const outPath = process.argv[2] || path.join(__dirname, 'animal-emotions-v4.html');

// JSON.stringify 不支持 Infinity,用 replacer 把 Infinity 换成占位串再 post-process 还原
function jsStr(obj) {
  return JSON.stringify(obj, (k, v) => v === Infinity ? '##INF##' : v).replace(/"##INF##"/g, 'Infinity');
}

// ========== 动物数据(emoji 风格) ==========
// 12 动物 × 2 配色 = 24 套,配色 = 主题色环/glow 切换(emoji 不变)
// colors[].accent 决定 ring/glow 颜色,swatch 是色板小点
const ANIMALS = [
  { id: 'cow',     name: '牛 · 打工人',  emo: 'NiuMa Inc',     emoji: '🐮',
    colors: [ { id: 'classic', name: '冷蓝调',  swatch: '#38bdf8', accent: '#38bdf8' },
              { id: 'pink',    name: '暖粉调',  swatch: '#fb7185', accent: '#fb7185' } ] },
  { id: 'horse',   name: '马 · 卷王',    emo: 'Gallop Studio', emoji: '🐴',
    colors: [ { id: 'chestnut', name: '紫罗兰', swatch: '#a78bfa', accent: '#a78bfa' },
              { id: 'white',    name: '白银调', swatch: '#e2e8f0', accent: '#94a3b8' } ] },
  { id: 'sheep',   name: '羊 · 摸鱼',    emo: 'Sheep Lab',     emoji: '🐑',
    colors: [ { id: 'mint',     name: '薄荷调', swatch: '#22c55e', accent: '#22c55e' },
              { id: 'sunset',   name: '落日调', swatch: '#f97316', accent: '#f97316' } ] },
  { id: 'cat',     name: '猫 · 夜行侠',  emo: 'CatOps',        emoji: '🐱',
    colors: [ { id: 'rose',     name: '玫粉调', swatch: '#f472b6', accent: '#f472b6' },
              { id: 'cyan',     name: '青蓝调', swatch: '#22d3ee', accent: '#22d3ee' } ] },
  { id: 'dog',     name: '狗 · 忠诚',    emo: 'Dogship',       emoji: '🐶',
    colors: [ { id: 'amber',    name: '琥珀调', swatch: '#f59e0b', accent: '#f59e0b' },
              { id: 'steel',    name: '钢蓝调', swatch: '#64748b', accent: '#64748b' } ] },
  { id: 'chicken', name: '鸡 · 早起鸟',  emo: 'Rooster Co',    emoji: '🐔',
    colors: [ { id: 'crimson',  name: '绛红调', swatch: '#ef4444', accent: '#ef4444' },
              { id: 'gold',     name: '金黄调', swatch: '#eab308', accent: '#eab308' } ] },
  { id: 'panda',   name: '熊猫 · 国宝',  emo: 'Panda Corp',    emoji: '🐼',
    colors: [ { id: 'mono',     name: '冷灰调', swatch: '#94a3b8', accent: '#94a3b8' },
              { id: 'forest',   name: '森林调', swatch: '#16a34a', accent: '#16a34a' } ] },
  { id: 'fox',     name: '狐狸 · 狡猾',  emo: 'FoxTail Inc',   emoji: '🦊',
    colors: [ { id: 'flame',    name: '烈焰调', swatch: '#ea580c', accent: '#ea580c' },
              { id: 'frost',    name: '霜蓝调', swatch: '#bae6fd', accent: '#0ea5e9' } ] },
  { id: 'rabbit',  name: '兔子 · 蹦跶',  emo: 'Bunny Studio',  emoji: '🐰',
    colors: [ { id: 'pink',     name: '樱粉调', swatch: '#fb7185', accent: '#fb7185' },
              { id: 'lavender', name: '薰衣调', swatch: '#c4b5fd', accent: '#a78bfa' } ] },
  { id: 'hamster', name: '仓鼠 · 跑轮王', emo: 'HamsterDAO',   emoji: '🐹',
    colors: [ { id: 'honey',    name: '蜜糖调', swatch: '#facc15', accent: '#facc15' },
              { id: 'minty',    name: '薄荷调', swatch: '#86efac', accent: '#22c55e' } ] },
  { id: 'tiger',   name: '老虎 · 凶猛',  emo: 'Tiger Lab',     emoji: '🐯',
    colors: [ { id: 'ruby',     name: '红宝石', swatch: '#dc2626', accent: '#dc2626' },
              { id: 'arctic',   name: '冰川调', swatch: '#e0f2fe', accent: '#0284c7' } ] },
  { id: 'duck',    name: '鸭子 · 扁嘴',  emo: 'DuckDB',        emoji: '🦆',
    colors: [ { id: 'sunny',    name: '阳光调', swatch: '#eab308', accent: '#eab308' },
              { id: 'teal',     name: '蓝绿调', swatch: '#14b8a6', accent: '#14b8a6' } ] },
];

// 经典 6 = 牛马羊猫狗鸡(ANIMALS[0..5]);新增 6 = 熊猫起(ANIMALS[6..11])
// 复用 ANIMALS.slice 即可,不需要额外字段

// ========== 14 态 keyframe（直接对齐 NiuMaAvatar 的 getMotionAnimation） ==========
// 字段：animate = keyframe 数组, transition = 单一或分属性
const STATUS_MOTION = {
  idle: {
    animate: { scaleY: [1, 0.94, 1], y: [0, 3, 0] },
    transition: { duration: 2.5, repeat: Infinity },
  },
  coding: {
    animate: {
      x: [0, -2, 2, -2, 2, 0],
      y: [0, -1, 1, -1, 0],
      rotate: [0, -1, 1, -1, 0],
    },
    transition: { duration: 0.15, repeat: Infinity },
  },
  debugging: {
    animate: { rotate: [0, -6, 6, -6, 0], y: [0, -2, 0] },
    transition: { duration: 1.2, repeat: Infinity },
  },
  panicking: {
    animate: {
      y: [0, -12, 0, -12, 0],
      x: [0, -5, 5, -5, 0],
      scale: [1, 1.05, 0.95, 1],
    },
    transition: { duration: 0.35, repeat: Infinity },
  },
  done: {
    animate: { y: [0, -14, 0], rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] },
    transition: { duration: 0.7, repeat: Infinity },
  },
  overtime: {
    animate: { scaleY: [1, 0.88, 1], opacity: [0.65, 1, 0.65] },
    transition: { duration: 3.5, repeat: Infinity },
  },
  coffee: {
    animate: { y: [0, -6, 0], scale: [1, 1.08, 1], rotate: [0, 360] },
    transition: {
      y: { duration: 1, repeat: Infinity },
      scale: { duration: 1, repeat: Infinity },
      rotate: { duration: 4, ease: 'linear' },
    },
  },
  slacking: {
    animate: { rotate: [-12, 12, -12], x: [-4, 4, -4] },
    transition: { duration: 2.2, repeat: Infinity },
  },
  drinkingWater: {
    animate: { y: [0, 4, 0], rotate: [0, -10, 0] },
    transition: { duration: 1.8, repeat: Infinity },
  },
  praying: {
    animate: { scaleY: [1, 0.8, 1], y: [0, 5, 0] },
    transition: { duration: 1, repeat: Infinity },
  },
  demanding: {
    animate: { x: [0, 8, 0], scale: [1, 1.12, 1], skewX: [0, -5, 0] },
    transition: { duration: 0.5, repeat: Infinity },
  },
  meeting: {
    animate: { y: [0, 4, 0], scaleY: [1, 0.93, 1] },
    transition: { duration: 1.3, repeat: Infinity },
  },
  testing: {
    animate: { y: [0, -8, 0], scaleX: [1, 0.95, 1.05, 1] },
    transition: { duration: 0.9, repeat: Infinity },
  },
  deploying: {
    animate: { y: [0, -8, 0], scaleX: [1, 0.95, 1.05, 1] },
    transition: { duration: 0.9, repeat: Infinity },
  },
};

// ========== 14 态 → 视觉映射(emoji 浮粒) ==========
// 替代 v3 的 pixel 眼睛/acc,用 emoji 浮粒(头顶/两侧)做状态装饰
// particle = { emoji, count, side } | null
//   - 'fire'    头顶 3 个火焰 emoji
//   - 'notes'   两侧飘音符
//   - 'halo'    头顶光环
//   - 'coffee'  侧边咖啡杯
//   - 'zzz'     飘 Z
//   - 'swirl'   旋转星
//   - 'sweat'   流汗
//   - 'clock'   时钟(开会/测试)
const STATUS_META = [
  { id: 'idle',          name: '摸鱼',     icon: '😐', desc: '无所事事 · 等待',     accent: '#9aa0a6', particle: 'zzz' },
  { id: 'coding',        name: '编码',     icon: '💻', desc: '正在敲键盘',         accent: '#4da3ff', particle: 'swirl' },
  { id: 'debugging',     name: '排错',     icon: '🔍', desc: '盯着屏幕找 bug',     accent: '#4da3ff', particle: null },
  { id: 'panicking',     name: '救火',     icon: '🚨', desc: '生产事故 · 喷火中',  accent: '#ff4d5f', particle: 'fire' },
  { id: 'done',          name: '完成',     icon: '✅', desc: '任务收工 · 庆祝',     accent: '#00d68f', particle: 'notes' },
  { id: 'overtime',      name: '加班',     icon: '💀', desc: '画饼续命 · 累死',     accent: '#ffb86b', particle: 'sweat' },
  { id: 'coffee',        name: '咖啡',     icon: '☕', desc: '第 5 杯 · 还在肝',    accent: '#ffb86b', particle: 'coffee' },
  { id: 'slacking',      name: '划水',     icon: '🌴', desc: '挂机 · 装忙',         accent: '#9aa0a6', particle: null },
  { id: 'drinkingWater', name: '打水',     icon: '💧', desc: '接水 · 顺便摸鱼',     accent: '#9aa0a6', particle: 'coffee' },
  { id: 'praying',       name: '祈祷',     icon: '🙏', desc: '佛祖保佑 · 0 bug',   accent: '#a78bfa', particle: 'halo' },
  { id: 'demanding',     name: '催命',     icon: '💢', desc: 'PM 在催 · 拍桌子',   accent: '#ff4d5f', particle: 'fire' },
  { id: 'meeting',       name: '开会',     icon: '📅', desc: '周会 · 假装听',       accent: '#a78bfa', particle: 'clock' },
  { id: 'testing',       name: '测试',     icon: '🧪', desc: '跑用例 · 紧张',       accent: '#4da3ff', particle: 'clock' },
  { id: 'deploying',     name: '部署',     icon: '🚀', desc: '上线 · 别炸',         accent: '#00d68f', particle: 'notes' },
];

// 浮粒 emoji 字典(每种自带 css class 决定位置/动画)
const PARTICLES = {
  fire:    [{ emoji: '🔥', cls: 'p-top' }, { emoji: '🔥', cls: 'p-left' }, { emoji: '🔥', cls: 'p-right' }],
  notes:   [{ emoji: '🎵', cls: 'p-left' }, { emoji: '🎶', cls: 'p-right' }, { emoji: '✨', cls: 'p-top' }],
  halo:    [{ emoji: '😇', cls: 'p-top' }],
  coffee:  [{ emoji: '☕', cls: 'p-right' }],
  zzz:     [{ emoji: '💤', cls: 'p-top' }],
  swirl:   [{ emoji: '⚡', cls: 'p-right' }, { emoji: '⚡', cls: 'p-left' }],
  sweat:   [{ emoji: '💧', cls: 'p-left' }, { emoji: '💧', cls: 'p-right' }],
  clock:   [{ emoji: '⏰', cls: 'p-right' }],
};

// ========== HTML 模板 ==========
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>牛马动物城 · 14 态矩阵 v3</title>
<style>
  :root {
    --bg-0: #0a0e1a; --bg-1: #111827; --bg-2: #1a2236; --bg-3: #232d44;
    --line: rgba(148, 163, 184, 0.12); --line-strong: rgba(148, 163, 184, 0.22);
    --text-0: #e5e7eb; --text-1: #94a3b8; --text-2: #64748b;
    --primary: #38bdf8; --secondary: #a78bfa; --accent: #f97316;
    --success: #22c55e; --warning: #eab308; --danger: #ef4444;
    --glow: 0 0 12px rgba(56, 189, 248, 0.45);
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg-0); color: var(--text-0);
    font-family: 'SF Mono', 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace;
    min-height: 100vh; overflow-x: hidden; }
  body::before { content: ''; position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px);
    background-size: 32px 32px; pointer-events: none; z-index: 0; }
  .app { position: relative; z-index: 1; max-width: 1600px; margin: 0 auto; padding: 32px 28px 64px; }

  /* 顶部 */
  .topbar { display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 28px; padding-bottom: 16px; border-bottom: 1px solid var(--line); }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand-mark { width: 36px; height: 36px; border-radius: 8px;
    background: linear-gradient(135deg, #38bdf8, #a78bfa);
    display: grid; place-items: center; font-size: 18px; font-weight: 800; color: #0a0e1a;
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.35); }
  .brand-text h1 { font-size: 18px; font-weight: 700; margin: 0; letter-spacing: 1px; }
  .brand-text small { font-size: 11px; color: var(--text-1); letter-spacing: 1.5px; }
  .topbar-stats { display: flex; gap: 12px; font-size: 11px; color: var(--text-1); }
  .topbar-stats .pill { padding: 4px 10px; border: 1px solid var(--line-strong);
    border-radius: 999px; background: var(--bg-1); }
  .topbar-stats .pill .v { color: var(--text-0); font-weight: 600; margin-left: 4px; }

  /* 控台 */
  .console { display: grid; grid-template-columns: 1fr 380px; gap: 20px; margin-bottom: 32px; }
  .preview { position: relative;
    background: linear-gradient(180deg, var(--bg-1) 0%, var(--bg-2) 100%);
    border: 1px solid var(--line-strong); border-radius: 16px; padding: 28px;
    min-height: 400px; display: grid; grid-template-rows: 1fr auto; overflow: hidden; }
  .preview::before { content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at 50% 60%, var(--ring-glow, rgba(56, 189, 248, 0.18)) 0%, transparent 60%);
    pointer-events: none; }
  .preview-stage { display: grid; place-items: center; position: relative; z-index: 1; }
  .stage-card { width: 240px; height: 240px; border-radius: 24px;
    border: 2px solid var(--ring-color, var(--primary)); background: rgba(10, 14, 26, 0.6);
    display: grid; place-items: center;
    box-shadow: 0 0 24px var(--ring-glow, rgba(56, 189, 248, 0.3)), inset 0 0 16px rgba(0, 0, 0, 0.4);
    position: relative; transition: border-color 0.3s, box-shadow 0.3s; }
  .stage-card .badge { position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
    padding: 3px 10px; background: var(--bg-0); border: 1px solid var(--line-strong);
    border-radius: 999px; font-size: 11px; letter-spacing: 1px; color: var(--text-0); white-space: nowrap; }
  .stage-card .tag { position: absolute; bottom: -10px; right: 14px;
    padding: 3px 8px; background: var(--bg-0); border: 1px solid var(--ring-color, var(--primary));
    border-radius: 6px; font-size: 10px; color: var(--ring-color, var(--primary));
    font-weight: 700; letter-spacing: 1px; }
  .preview-info { margin-top: 18px; display: flex; justify-content: space-between;
    align-items: end; gap: 16px; position: relative; z-index: 1; }
  .preview-info .name { font-size: 22px; font-weight: 700; letter-spacing: 1px; }
  .preview-info .mood { font-size: 12px; color: var(--text-1); margin-top: 4px; letter-spacing: 1px; }
  .preview-info .mood em { color: var(--ring-color, var(--primary)); font-style: normal; font-weight: 600; }

  /* 面板 */
  .panel { background: var(--bg-1); border: 1px solid var(--line-strong); border-radius: 16px; padding: 16px; }
  .panel h3 { font-size: 12px; font-weight: 700; letter-spacing: 2px; color: var(--text-1);
    margin: 0 0 10px; text-transform: uppercase; }
  .panel + .panel { margin-top: 12px; }
  .option-grid { display: grid; gap: 6px; }
  .option-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
  .option-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
  .opt { background: var(--bg-2); border: 1px solid var(--line); border-radius: 8px;
    padding: 8px 4px; text-align: center; cursor: pointer; font-size: 11px;
    color: var(--text-0); transition: all 0.15s; user-select: none; }
  .opt:hover { border-color: var(--line-strong); background: var(--bg-3); }
  .opt.active { background: var(--bg-3); border-color: var(--primary); color: var(--primary); box-shadow: var(--glow); }
  .opt .ico { font-size: 18px; display: block; margin-bottom: 2px; }

  .swatch-row { display: flex; gap: 6px; }
  .swatch { flex: 1; background: var(--bg-2); border: 1px solid var(--line);
    border-radius: 8px; padding: 6px; cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; gap: 6px; }
  .swatch:hover { background: var(--bg-3); }
  .swatch.active { border-color: var(--primary); background: var(--bg-3); }
  .swatch .dot { width: 14px; height: 14px; border-radius: 4px; flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.1); }
  .swatch .label { font-size: 10px; color: var(--text-0); letter-spacing: 1px; }

  .btn-row { display: flex; gap: 6px; }
  .btn { flex: 1; background: var(--bg-2); border: 1px solid var(--line-strong);
    border-radius: 8px; padding: 8px; font-family: inherit; color: var(--text-0);
    font-size: 11px; cursor: pointer; transition: all 0.15s; letter-spacing: 1px; }
  .btn:hover { background: var(--bg-3); border-color: var(--primary); color: var(--primary); }
  .btn.primary { background: linear-gradient(135deg, #38bdf8, #818cf8); color: #0a0e1a;
    border: none; font-weight: 700; }
  .btn.primary:hover { filter: brightness(1.1); color: #0a0e1a; }

  /* 矩阵 */
  .section-title { display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--line); gap: 16px; flex-wrap: wrap; }
  .section-title h2 { font-size: 14px; letter-spacing: 2px; margin: 0; color: var(--text-0); }
  .section-title small { font-size: 11px; color: var(--text-2); letter-spacing: 1px; }
  .matrix-tabs { display: flex; gap: 6px; }
  .matrix-tab { padding: 5px 14px; background: var(--bg-1); border: 1px solid var(--line);
    border-radius: 999px; font-size: 11px; letter-spacing: 1px; color: var(--text-1);
    cursor: pointer; transition: all 0.15s; user-select: none; }
  .matrix-tab:hover { border-color: var(--line-strong); background: var(--bg-2); color: var(--text-0); }
  .matrix-tab.active { border-color: var(--primary); color: var(--primary); background: var(--bg-2);
    box-shadow: 0 0 12px rgba(56, 189, 248, 0.18); }
  .matrix-wrap { margin-bottom: 36px; }
  .matrix-scroll { overflow-x: auto; padding-bottom: 8px; }
  .matrix { display: grid; grid-template-columns: 110px repeat(14, 56px); gap: 5px; min-width: 920px; }
  .matrix .head, .matrix .row-head { background: var(--bg-1); border: 1px solid var(--line);
    border-radius: 6px; padding: 6px 4px; text-align: center; font-size: 10px;
    color: var(--text-1); letter-spacing: 1px; display: grid; place-items: center; min-height: 36px; }
  .matrix .row-head { color: var(--text-0); font-weight: 700; font-size: 11px;
    display: flex; flex-direction: row; gap: 6px; }
  .matrix .row-head .row-color-dot { width: 8px; height: 8px; border-radius: 50%; }
  .matrix .cell { background: var(--bg-1); border: 1px solid var(--line); border-radius: 6px;
    aspect-ratio: 1; display: grid; place-items: center; position: relative; overflow: hidden;
    transition: all 0.2s; min-height: 50px; }
  .matrix .cell::before { content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at center, var(--cell-glow, transparent) 0%, transparent 70%);
    opacity: 0.4; pointer-events: none; }
  .matrix .cell:hover { border-color: var(--cell-color, var(--primary)); transform: translateY(-2px); }

  /* Emoji 动物 */
  .animal-emoji-stage { user-select: none; }
  .animal-emoji { display: inline-block; }
  /* 状态 emoji 浮粒(围绕在 stage ring 周围) */
  .animal-particle { position: absolute; font-size: 20px; pointer-events: none;
    animation: particleFloat 1.8s ease-in-out infinite; will-change: transform, opacity; }
  .animal-particle.p-top  { top: -4px;  left: 50%; transform: translateX(-50%); }
  .animal-particle.p-left { left: -8px; top: 50%;  transform: translateY(-50%); }
  .animal-particle.p-right{ right: -8px; top: 50%; transform: translateY(-50%); }
  @keyframes particleFloat {
    0%   { transform: translate(var(--bx, -50%), 0)    scale(0.9); opacity: 0.5; }
    50%  { transform: translate(var(--bx, -50%), -6px) scale(1.1); opacity: 1; }
    100% { transform: translate(var(--bx, -50%), 0)    scale(0.9); opacity: 0.5; }
  }
  .animal-particle.p-top  { --bx: -50%; }
  .animal-particle.p-left { --bx: 0; }
  .animal-particle.p-right{ --bx: 0; }

  /* 矩阵里关闭粒子浮粒(避免 168 个同时动) */
  .matrix .cell .animal-particle { display: none; }

  footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--line);
    text-align: center; color: var(--text-2); font-size: 11px; letter-spacing: 1px; }
  footer kbd { background: var(--bg-2); border: 1px solid var(--line-strong);
    border-radius: 4px; padding: 1px 6px; margin: 0 2px; color: var(--text-0); font-size: 10px; }
  footer code { color: var(--primary); background: var(--bg-2); padding: 1px 5px; border-radius: 3px; }
</style>
</head>
<body>
<div class="app">
  <div id="root"></div>
</div>

<script type="module">
  import React, { useState, useMemo, useEffect } from 'https://esm.sh/react@19';
  import { createRoot } from 'https://esm.sh/react-dom@19/client';
  import { motion } from 'https://esm.sh/motion@12/react';
  import htm from 'https://esm.sh/htm@3';

  const html = htm.bind(React.createElement);

  // ========== 数据（由 build 注入） ==========
  const ANIMALS = ${jsStr(ANIMALS.map(a => ({ id: a.id, name: a.name, emo: a.emo, emoji: a.emoji, colors: a.colors })))};
  const STATUS_META = ${jsStr(STATUS_META)};
  const STATUS_MOTION = ${jsStr(STATUS_MOTION)};
  const PARTICLES = ${jsStr(PARTICLES)};

  const ANIMAL_BY_ID = Object.fromEntries(ANIMALS.map(a => [a.id, a]));
  const STATUS_BY_ID = Object.fromEntries(STATUS_META.map(s => [s.id, s]));

  // ========== 组件 ==========
  // AnimalEmoji:大号 emoji + 主题色环 + 状态 emoji 浮粒;外层 motion.div 跑 14 态 keyframe
  function AnimalEmoji({ animal, color, status, size = 150, noMotion = false }) {
    const a = ANIMAL_BY_ID[animal];
    const meta = STATUS_BY_ID[status];
    const motionCfg = STATUS_MOTION[status];
    const colorCfg = a.colors.find(x => x.id === color) || a.colors[0];
    const accent = colorCfg.accent;
    const particles = meta.particle ? (PARTICLES[meta.particle] || []) : [];

    const emojiStyle = { fontSize: size, lineHeight: 1, filter: 'drop-shadow(0 0 16px ' + accent + 'aa)' };
    const ringStyle = {
      width: size * 1.25, height: size * 1.25, borderRadius: '50%',
      border: '2px solid ' + accent + 'aa',
      boxShadow: '0 0 32px ' + accent + '55, inset 0 0 24px ' + accent + '22',
      display: 'grid', placeItems: 'center', position: 'relative'
    };

    const inner = html\`
      <div class="animal-emoji-stage" style=\${ringStyle}>
        \${particles.map((p, i) => html\`<span class="animal-particle \${p.cls}" key=\${i} style=\${ { animationDelay: (i * 0.3) + 's' } }>\${p.emoji}</span>\`)}
        <span class="animal-emoji" style=\${emojiStyle}>\${a.emoji}</span>
      </div>
    \`;

    if (noMotion) {
      return html\`<div style=\${ { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' } }>\${inner}</div>\`;
    }
    return html\`
      <\${motion.div}
        style=\${ { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' } }
        animate=\${motionCfg.animate}
        transition=\${motionCfg.transition}
        whileHover=\${{ scale: 1.06 }}
        whileTap=\${{ scale: 0.96 }}
      >\${inner}</\${motion.div}>
    \`;
  }

  function App() {
    const [animal, setAnimal] = useState('cow');
    const [color, setColor] = useState('classic');
    const [status, setStatus] = useState('idle');
    const [matrixTab, setMatrixTab] = useState('all');

    const a = ANIMAL_BY_ID[animal];
    const c = a.colors.find(x => x.id === color) || a.colors[0];
    const s = STATUS_BY_ID[status];

    // 矩阵范围 tab · 经典 6 = ANIMALS[0..5](牛马羊猫狗鸡) / 新增 6 = ANIMALS[6..11](熊猫起)
    const MATRIX_TABS = [
      { id: 'all',     label: '全部 12' },
      { id: 'classic', label: '经典 6' },
      { id: 'new',     label: '新增 6' },
    ];
    const visibleAnimals = matrixTab === 'classic' ? ANIMALS.slice(0, 6)
      : matrixTab === 'new' ? ANIMALS.slice(6, 12)
      : ANIMALS;

    return html\`
      <\${React.Fragment}>
        <header class="topbar">
          <div class="brand">
            <div class="brand-mark">牛</div>
            <div class="brand-text">
              <h1>牛马动物城 · 14 态矩阵 v3</h1>
              <small>MOTION/REACT POWERED · 12 SPECIES · 24 COLORWAYS · 14 STATUSES</small>
            </div>
          </div>
          <div class="topbar-stats">
            <span class="pill">动物 <span class="v">\${ANIMALS.length}</span></span>
            <span class="pill">配色 <span class="v">\${ANIMALS.reduce((s, a) => s + a.colors.length, 0)}</span></span>
            <span class="pill">状态 <span class="v">\${STATUS_META.length}</span></span>
            <span class="pill">组合 <span class="v">\${ANIMALS.length * ANIMALS.reduce((s, a) => s + a.colors.length, 0) * STATUS_META.length}</span></span>
          </div>
        </header>

        <section class="console">
          <div class="preview" style=\${{ '--ring-color': c.accent, '--ring-glow': c.accent + '55' }}>
            <div class="preview-stage">
              <div class="stage-card" style=\${{ '--ring-color': c.accent, '--ring-glow': c.accent + '55' }}>
                <span class="badge" style=\${{ borderColor: c.accent, color: c.accent }}>\${a.emo} · \${c.name} · \${s.name}</span>
                <\${AnimalEmoji} animal=\${animal} color=\${color} status=\${status} size=\${150} />
                <span class="tag" style=\${{ borderColor: c.accent, color: c.accent }}>\${status.toUpperCase()}</span>
              </div>
            </div>
            <div class="preview-info">
              <div>
                <div class="name" style=\${{ color: c.accent }}>\${a.name}</div>
                <div class="mood">当前状态 · <em style=\${{ color: c.accent }}>\${s.desc}</em></div>
              </div>
            </div>
          </div>

          <div>
            <div class="panel">
              <h3>选择动物</h3>
              <div class="option-grid cols-3">
                \${ANIMALS.map(a => html\`
                  <div key=\${a.id} className=\${'opt ' + (animal === a.id ? 'active' : '')} onClick=\${() => { setAnimal(a.id); setColor(a.colors[0].id); }}>
                    <span class="ico">\${a.emoji}</span>\${a.name.split(' · ')[0]}
                  </div>
                \`)}
              </div>
            </div>
            <div class="panel">
              <h3>选择配色</h3>
              <div class="swatch-row">
                \${a.colors.map(co => html\`
                  <div key=\${co.id} className=\${'swatch ' + (color === co.id ? 'active' : '')} onClick=\${() => setColor(co.id)}>
                    <div class="dot" style=\${{ background: co.swatch }}></div>
                    <div class="label">\${co.name}</div>
                  </div>
                \`)}
              </div>
            </div>
            <div class="panel">
              <h3>选择状态（14 态 · motion keyframe）</h3>
              <div class="option-grid cols-2">
                \${STATUS_META.map(st => html\`
                  <div key=\${st.id} className=\${'opt ' + (status === st.id ? 'active' : '')} onClick=\${() => setStatus(st.id)} style=\${{ borderColor: status === st.id ? st.accent : undefined, color: status === st.id ? st.accent : undefined }}>
                    <span class="ico">\${st.icon}</span>\${st.name}
                  </div>
                \`)}
              </div>
            </div>
          </div>
        </section>

        <section class="matrix-wrap">
          <div class="section-title">
            <div>
              <h2>全动物 × 14 态矩阵</h2>
              <small>\${visibleAnimals.length} 动物 × ${STATUS_META.length} 状态 = \${visibleAnimals.length * STATUS_META.length} 组合</small>
            </div>
            <div class="matrix-tabs">
              \${MATRIX_TABS.map(t => html\`
                <span key=\${t.id} class=\${'matrix-tab ' + (matrixTab === t.id ? 'active' : '')} onClick=\${() => setMatrixTab(t.id)}>\${t.label}</span>
              \`)}
            </div>
          </div>
          <div class="matrix-scroll">
            <div class="matrix">
              <div class="head"></div>
              \${STATUS_META.map(st => html\`<div key=\${st.id} class="head" style=\${{ color: st.accent }}>\${st.name}</div>\`)}
              \${visibleAnimals.map(an => html\`
                <\${React.Fragment} key=\${an.id}>
                  <div class="row-head"><span class="row-color-dot" style=\${{ background: an.colors[0].swatch }}></span>\${an.emoji} \${an.name.split(' · ')[0]}</div>
                  \${STATUS_META.map(st => html\`
                    <div key=\${st.id} class="cell" style=\${{ '--cell-color': an.colors[0].accent, '--cell-glow': an.colors[0].accent + '33' }}
                         onClick=\${() => { setAnimal(an.id); setColor(an.colors[0].id); setStatus(st.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                         title=\${an.name + ' · ' + st.name}>
                      <\${AnimalEmoji} animal=\${an.id} color=\${an.colors[0].id} status=\${st.id} size=\${32} noMotion=\${true} />
                    </div>
                  \`)}
                </\${React.Fragment}>
              \`)}
            </div>
          </div>
        </section>

        <footer>
          单文件 · React 19 + Motion 12 via esm.sh · <code>getMotionAnimation(status)</code> 模式 · 14 态 keyframe 与 NiuMaAvatar 对齐 ·
          <kbd>R</kbd> 全随机(动物+状态+配色) · <kbd>C</kbd> 切配色 ·
          <kbd>1-9</kbd>/<kbd>0</kbd>/<kbd>-</kbd>/<kbd>=</kbd>/<kbd>[</kbd>/<kbd>]</kbd> 切 14 态
        </footer>
      </\${React.Fragment}>
    \`;
  }

  // ========== 启动 ==========
  createRoot(document.getElementById('root')).render(html\`<\${App} />\`);

  // ========== 快捷键 ==========
  // 14 态 → 14 个键:1-9 / 0 / - / = / [ / ]
  //   1 idle · 2 coding · 3 debugging · 4 panicking · 5 done · 6 overtime
  //   7 coffee · 8 slacking · 9 drinkingWater · 0 praying · - demanding
  //   = meeting · [ testing · ] deploying
  const STATUS_KEYS = ['1','2','3','4','5','6','7','8','9','0','-','=','[',']'];
  const STATUS_OPT_COUNT = ${STATUS_META.length};

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const key = e.key;

    // 1) 状态快捷键
    const idx = STATUS_KEYS.indexOf(key);
    if (idx >= 0 && idx < STATUS_OPT_COUNT) {
      const statusOpt = document.querySelectorAll('.option-grid.cols-2 .opt');
      const target = statusOpt[idx];
      if (target) target.click();
      return;
    }

    // 2) C 切当前动物的下一种配色
    if (key === 'c' || key === 'C') {
      const swatches = document.querySelectorAll('.swatch-row .swatch');
      if (!swatches.length) return;
      const list = Array.from(swatches);
      const active = document.querySelector('.swatch-row .swatch.active');
      const cur = active ? list.indexOf(active) : -1;
      list[(cur + 1) % list.length].click();
      return;
    }

    // 3) R 全随机:动物 + 状态 + 配色
    if (key === 'r' || key === 'R') {
      const animalOpt = document.querySelectorAll('.option-grid.cols-3 .opt');
      const statusOpt = document.querySelectorAll('.option-grid.cols-2 .opt');
      const swatches  = document.querySelectorAll('.swatch-row .swatch');
      const ra = animalOpt[Math.floor(Math.random() * animalOpt.length)];
      const rs = statusOpt[Math.floor(Math.random() * statusOpt.length)];
      const rc = swatches [Math.floor(Math.random() * swatches.length)];
      if (ra) ra.click();
      if (rs) rs.click();
      if (rc) rc.click();
      return;
    }
  });
</script>
</body>
</html>
`;

fs.writeFileSync(outPath, html, 'utf-8');
console.log('Generated:', outPath);
console.log('Size:', (html.length / 1024).toFixed(1) + ' KB');
console.log('Animals:', ANIMALS.length, '/ Colorways:', ANIMALS.reduce((s, a) => s + a.colors.length, 0));
console.log('Statuses:', STATUS_META.length, ' (modes: idle, coding, debugging, panicking, done, overtime, coffee, slacking, drinkingWater, praying, demanding, meeting, testing, deploying)');
console.log('Combinations:', ANIMALS.length * ANIMALS.reduce((s, a) => s + a.colors.length, 0) * STATUS_META.length);
