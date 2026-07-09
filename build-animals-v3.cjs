// animal-emotions-v3.html 生成器
// 用 motion/react 做 14 态 keyframes（与 NiuMaAvatar 模式一致）
// 用法: node build-animals-v3.cjs animal-emotions-v3.html

const fs = require('fs');
const path = require('path');
const outPath = process.argv[2] || path.join(__dirname, 'animal-emotions-v3.html');

// JSON.stringify 不支持 Infinity，用 replacer 把 Infinity 换成占位串再 post-process 还原
function jsStr(obj) {
  return JSON.stringify(obj, (k, v) => v === Infinity ? '##INF##' : v).replace(/"##INF##"/g, 'Infinity');
}

// ========== 动物数据 ==========
// 12 动物 × 2 配色 = 24 套 body
// bodies 用 R(x,y,w,h,#color) 简写
const ANIMALS = [
  {
    id: 'cow', name: '牛 · 打工人', emo: 'NiuMa Inc', emoji: '🐮',
    colors: [
      { id: 'classic', name: '黑白花', swatch: '#f8fafc' },
      { id: 'pink',    name: '粉皮皮', swatch: '#f9a8d4' },
    ],
    main: '#38bdf8', ring: 'rgba(56,189,248,0.45)',
    bodies: {
      classic: `R(3,10,2,2,#f8fafc) R(5,8,2,2,#f8fafc) R(7,8,10,8,#f8fafc) R(17,10,2,2,#f8fafc) R(3,12,4,6,#f8fafc) R(17,12,2,6,#f8fafc) R(7,16,2,2,#f8fafc) R(11,16,2,2,#f8fafc) R(15,16,2,2,#f8fafc) R(6,6,1,2,#475569) R(9,6,1,2,#475569) R(9,9,2,2,#1e293b) R(13,11,3,2,#1e293b) R(6,9,1,1,#cbd5e1) R(10,9,1,1,#cbd5e1) R(19,9,1,2,#f8fafc) R(20,8,1,1,#f8fafc)`,
      pink:    `R(3,10,2,2,#f9a8d4) R(5,8,2,2,#f9a8d4) R(7,8,10,8,#f9a8d4) R(17,10,2,2,#f9a8d4) R(3,12,4,6,#f9a8d4) R(17,12,2,6,#f9a8d4) R(7,16,2,2,#f9a8d4) R(11,16,2,2,#f9a8d4) R(15,16,2,2,#f9a8d4) R(6,6,1,2,#fb7185) R(9,6,1,2,#fb7185) R(9,9,2,2,#fdf2f8) R(13,11,3,2,#fdf2f8) R(6,9,1,1,#fdf2f8) R(10,9,1,1,#fdf2f8) R(19,9,1,2,#f9a8d4) R(20,8,1,1,#f9a8d4)`,
    },
  },
  {
    id: 'horse', name: '马 · 卷王', emo: 'Gallop Studio', emoji: '🐴',
    colors: [
      { id: 'chestnut', name: '栗色', swatch: '#a16207' },
      { id: 'white',    name: '白马', swatch: '#f8fafc' },
    ],
    main: '#a78bfa', ring: 'rgba(167,139,250,0.45)',
    bodies: {
      chestnut: `R(4,9,2,2,#a16207) R(6,7,11,9,#a16207) R(17,9,2,2,#a16207) R(6,16,2,3,#a16207) R(11,16,2,3,#a16207) R(14,16,2,3,#a16207) R(6,5,1,2,#451a03) R(8,4,1,3,#451a03) R(10,5,1,2,#451a03) R(12,4,1,3,#451a03) R(14,5,1,2,#451a03) R(16,11,1,2,#a16207) R(17,12,1,1,#1c1917) R(3,9,1,2,#451a03) R(2,8,1,2,#451a03) R(1,7,1,2,#451a03)`,
      white:    `R(4,9,2,2,#f8fafc) R(6,7,11,9,#f8fafc) R(17,9,2,2,#f8fafc) R(6,16,2,3,#f8fafc) R(11,16,2,3,#f8fafc) R(14,16,2,3,#f8fafc) R(6,5,1,2,#cbd5e1) R(8,4,1,3,#cbd5e1) R(10,5,1,2,#cbd5e1) R(12,4,1,3,#cbd5e1) R(14,5,1,2,#cbd5e1) R(16,11,1,2,#f8fafc) R(17,12,1,1,#1c1917) R(3,9,1,2,#cbd5e1) R(2,8,1,2,#cbd5e1) R(1,7,1,2,#cbd5e1)`,
    },
  },
  {
    id: 'sheep', name: '羊 · 摸鱼', emo: 'Sheep Lab', emoji: '🐑',
    colors: [
      { id: 'white', name: '白羊', swatch: '#e2e8f0' },
      { id: 'black', name: '黑羊', swatch: '#1e293b' },
    ],
    main: '#22c55e', ring: 'rgba(34,197,94,0.45)',
    bodies: {
      white: `R(5,9,2,2,#e2e8f0) R(7,7,10,2,#e2e8f0) R(17,9,2,2,#e2e8f0) R(3,11,3,2,#e2e8f0) R(5,11,14,5,#e2e8f0) R(17,11,3,2,#e2e8f0) R(19,13,1,2,#e2e8f0) R(7,16,2,2,#e2e8f0) R(11,16,2,2,#e2e8f0) R(15,16,2,2,#e2e8f0) R(6,8,1,1,#f8fafc) R(9,8,1,1,#f8fafc) R(12,8,1,1,#f8fafc) R(15,8,1,1,#f8fafc) R(3,10,3,4,#1e293b) R(2,11,1,2,#1e293b) R(3,9,1,1,#475569) R(5,9,1,1,#475569) R(6,18,1,2,#1e293b) R(11,18,1,2,#1e293b) R(16,18,1,2,#1e293b) R(19,10,1,1,#e2e8f0)`,
      black: `R(5,9,2,2,#475569) R(7,7,10,2,#475569) R(17,9,2,2,#475569) R(3,11,3,2,#475569) R(5,11,14,5,#475569) R(17,11,3,2,#475569) R(19,13,1,2,#475569) R(7,16,2,2,#475569) R(11,16,2,2,#475569) R(15,16,2,2,#475569) R(6,8,1,1,#1e293b) R(9,8,1,1,#1e293b) R(12,8,1,1,#1e293b) R(15,8,1,1,#1e293b) R(3,10,3,4,#f8fafc) R(2,11,1,2,#f8fafc) R(3,9,1,1,#cbd5e1) R(5,9,1,1,#cbd5e1) R(6,18,1,2,#f8fafc) R(11,18,1,2,#f8fafc) R(16,18,1,2,#f8fafc) R(19,10,1,1,#475569)`,
    },
  },
  {
    id: 'cat', name: '猫 · 夜行侠', emo: 'CatOps', emoji: '🐱',
    colors: [
      { id: 'gray',   name: '灰猫', swatch: '#94a3b8' },
      { id: 'orange', name: '橘猫', swatch: '#f97316' },
    ],
    main: '#f472b6', ring: 'rgba(244,114,182,0.45)',
    bodies: {
      gray:   `R(5,11,2,2,#94a3b8) R(7,9,9,6,#94a3b8) R(16,11,2,2,#94a3b8) R(7,15,2,3,#94a3b8) R(11,15,2,3,#94a3b8) R(14,15,2,3,#94a3b8) R(7,7,1,2,#64748b) R(9,6,1,2,#64748b) R(13,6,1,2,#64748b) R(15,7,1,2,#64748b) R(8,7,1,1,#fda4af) R(14,7,1,1,#fda4af) R(4,11,1,1,#cbd5e1) R(4,13,1,1,#cbd5e1) R(3,9,1,2,#94a3b8) R(2,8,1,2,#94a3b8) R(1,7,1,2,#94a3b8)`,
      orange: `R(5,11,2,2,#f97316) R(7,9,9,6,#f97316) R(16,11,2,2,#f97316) R(7,15,2,3,#f97316) R(11,15,2,3,#f97316) R(14,15,2,3,#f97316) R(7,7,1,2,#c2410c) R(9,6,1,2,#c2410c) R(13,6,1,2,#c2410c) R(15,7,1,2,#c2410c) R(8,7,1,1,#fda4af) R(14,7,1,1,#fda4af) R(4,11,1,1,#fef3c7) R(4,13,1,1,#fef3c7) R(9,11,1,2,#9a3412) R(13,11,1,2,#9a3412) R(3,9,1,2,#f97316) R(2,8,1,2,#f97316) R(1,7,1,2,#f97316) R(9,13,5,2,#fef3c7)`,
    },
  },
  {
    id: 'dog', name: '狗 · 忠诚', emo: 'Dogship', emoji: '🐶',
    colors: [
      { id: 'brown',  name: '柴犬黄', swatch: '#d97706' },
      { id: 'border', name: '边牧黑白', swatch: '#1e293b' },
    ],
    main: '#f59e0b', ring: 'rgba(245,158,11,0.45)',
    bodies: {
      brown:  `R(5,9,2,2,#d97706) R(7,7,10,8,#d97706) R(17,9,2,2,#d97706) R(7,15,2,3,#d97706) R(11,15,2,3,#d97706) R(15,15,2,3,#d97706) R(6,9,2,3,#92400e) R(16,9,2,3,#92400e) R(3,12,1,1,#1c1917) R(3,13,2,1,#fb7185) R(19,9,1,2,#d97706) R(20,8,1,2,#d97706) R(19,7,2,1,#d97706)`,
      border: `R(5,9,2,2,#1e293b) R(7,7,10,8,#1e293b) R(17,9,2,2,#1e293b) R(7,15,2,3,#1e293b) R(11,15,2,3,#1e293b) R(15,15,2,3,#1e293b) R(6,9,2,3,#0f172a) R(16,9,2,3,#0f172a) R(3,12,1,1,#1c1917) R(3,13,2,1,#fb7185) R(9,11,6,4,#f8fafc) R(9,15,2,3,#f8fafc) R(13,15,2,3,#f8fafc) R(19,9,1,2,#1e293b) R(20,8,1,2,#1e293b) R(19,7,2,1,#1e293b)`,
    },
  },
  {
    id: 'chicken', name: '鸡 · 早起鸟', emo: 'Rooster Co', emoji: '🐔',
    colors: [
      { id: 'white',   name: '白鸡',   swatch: '#fef3c7' },
      { id: 'rooster', name: '大公鸡', swatch: '#dc2626' },
    ],
    main: '#ef4444', ring: 'rgba(239,68,68,0.45)',
    bodies: {
      white:   `R(5,9,2,2,#fef3c7) R(7,8,10,6,#fef3c7) R(17,9,2,2,#fef3c7) R(7,14,2,4,#fef3c7) R(11,14,2,4,#fef3c7) R(15,14,2,4,#fef3c7) R(9,6,1,2,#ef4444) R(10,5,2,2,#ef4444) R(12,6,1,2,#ef4444) R(4,11,2,1,#f59e0b) R(3,12,1,1,#f59e0b) R(13,10,2,3,#fde68a) R(18,7,1,2,#92400e) R(19,6,2,3,#92400e) R(21,7,1,2,#92400e)`,
      rooster: `R(5,9,2,2,#dc2626) R(7,8,10,6,#dc2626) R(17,9,2,2,#dc2626) R(7,14,2,4,#dc2626) R(11,14,2,4,#dc2626) R(15,14,2,4,#dc2626) R(9,6,1,2,#fbbf24) R(10,4,2,3,#fbbf24) R(12,6,1,2,#fbbf24) R(4,11,2,1,#facc15) R(3,12,1,1,#facc15) R(13,10,2,3,#16a34a) R(18,7,1,2,#16a34a) R(19,5,2,4,#16a34a) R(21,7,1,2,#16a34a) R(22,6,1,1,#facc15)`,
    },
  },
  {
    id: 'panda', name: '熊猫 · 国宝', emo: 'Panda Corp', emoji: '🐼',
    colors: [
      { id: 'classic', name: '经典黑白', swatch: '#f8fafc' },
      { id: 'brown',   name: '秦岭棕',  swatch: '#fed7aa' },
    ],
    main: '#94a3b8', ring: 'rgba(148,163,184,0.45)',
    bodies: {
      classic: `R(5,9,14,7,#f8fafc) R(6,7,12,6,#f8fafc) R(6,5,2,2,#1e293b) R(16,5,2,2,#1e293b) R(5,11,2,3,#1e293b) R(17,11,2,3,#1e293b) R(7,16,2,3,#1e293b) R(11,16,2,3,#1e293b) R(15,16,2,3,#1e293b) R(19,10,1,2,#f8fafc) R(8,9,2,2,#1e293b) R(14,9,2,2,#1e293b) R(11,11,2,1,#1e293b)`,
      brown:   `R(5,9,14,7,#fed7aa) R(6,7,12,6,#fed7aa) R(6,5,2,2,#92400e) R(16,5,2,2,#92400e) R(5,11,2,3,#92400e) R(17,11,2,3,#92400e) R(7,16,2,3,#92400e) R(11,16,2,3,#92400e) R(15,16,2,3,#92400e) R(19,10,1,2,#fed7aa) R(8,9,2,2,#92400e) R(14,9,2,2,#92400e) R(11,11,2,1,#92400e)`,
    },
  },
  {
    id: 'fox', name: '狐狸 · 狡猾', emo: 'FoxTail Inc', emoji: '🦊',
    colors: [
      { id: 'red',  name: '红狐', swatch: '#ea580c' },
      { id: 'snow', name: '白狐', swatch: '#f8fafc' },
    ],
    main: '#ea580c', ring: 'rgba(234,88,12,0.45)',
    bodies: {
      red:  `R(4,9,2,2,#ea580c) R(6,8,11,6,#ea580c) R(17,9,2,2,#ea580c) R(6,14,2,4,#ea580c) R(10,14,2,4,#ea580c) R(14,14,2,4,#ea580c) R(6,6,1,2,#c2410c) R(9,5,1,2,#c2410c) R(14,5,1,2,#c2410c) R(17,6,1,2,#c2410c) R(4,11,2,2,#fef3c7) R(3,13,2,1,#1c1917) R(2,9,2,6,#ea580c) R(0,7,2,3,#ea580c) R(0,6,1,1,#fef3c7) R(9,11,5,3,#fef3c7)`,
      snow: `R(4,9,2,2,#f8fafc) R(6,8,11,6,#f8fafc) R(17,9,2,2,#f8fafc) R(6,14,2,4,#f8fafc) R(10,14,2,4,#f8fafc) R(14,14,2,4,#f8fafc) R(6,6,1,2,#cbd5e1) R(9,5,1,2,#cbd5e1) R(14,5,1,2,#cbd5e1) R(17,6,1,2,#cbd5e1) R(3,13,2,1,#1c1917) R(2,9,2,6,#f8fafc) R(0,7,2,3,#f8fafc) R(0,6,1,1,#cbd5e1) R(9,11,5,3,#cbd5e1)`,
    },
  },
  {
    id: 'rabbit', name: '兔子 · 蹦跶', emo: 'Bunny Studio', emoji: '🐰',
    colors: [
      { id: 'white', name: '白兔', swatch: '#f8fafc' },
      { id: 'gray',  name: '灰兔', swatch: '#cbd5e1' },
    ],
    main: '#fb7185', ring: 'rgba(251,113,133,0.45)',
    bodies: {
      white: `R(5,9,2,2,#f8fafc) R(7,8,10,8,#f8fafc) R(17,9,2,2,#f8fafc) R(7,16,2,2,#f8fafc) R(11,16,2,2,#f8fafc) R(15,16,2,2,#f8fafc) R(7,3,1,5,#f8fafc) R(8,2,1,5,#f8fafc) R(14,2,1,5,#f8fafc) R(15,3,1,5,#f8fafc) R(8,4,1,3,#fda4af) R(14,4,1,3,#fda4af) R(3,11,1,2,#1c1917) R(3,13,2,1,#fb7185) R(19,9,2,2,#f8fafc)`,
      gray:  `R(5,9,2,2,#cbd5e1) R(7,8,10,8,#cbd5e1) R(17,9,2,2,#cbd5e1) R(7,16,2,2,#cbd5e1) R(11,16,2,2,#cbd5e1) R(15,16,2,2,#cbd5e1) R(7,3,1,5,#cbd5e1) R(8,2,1,5,#cbd5e1) R(14,2,1,5,#cbd5e1) R(15,3,1,5,#cbd5e1) R(8,4,1,3,#fda4af) R(14,4,1,3,#fda4af) R(3,11,1,2,#1c1917) R(3,13,2,1,#fb7185) R(19,9,2,2,#cbd5e1)`,
    },
  },
  {
    id: 'hamster', name: '仓鼠 · 跑轮王', emo: 'HamsterDAO', emoji: '🐹',
    colors: [
      { id: 'golden', name: '金丝熊', swatch: '#facc15' },
      { id: 'white',  name: '白仓鼠', swatch: '#f1f5f9' },
    ],
    main: '#facc15', ring: 'rgba(250,204,21,0.45)',
    bodies: {
      golden: `R(4,9,2,2,#facc15) R(6,8,12,8,#facc15) R(18,9,2,2,#facc15) R(3,11,3,4,#facc15) R(18,11,3,4,#facc15) R(7,16,2,2,#facc15) R(11,16,2,2,#facc15) R(15,16,2,2,#facc15) R(8,13,8,3,#fef9c3) R(6,6,2,2,#ca8a04) R(16,6,2,2,#ca8a04) R(7,7,1,1,#fda4af) R(17,7,1,1,#fda4af) R(4,12,2,2,#eab308) R(18,12,2,2,#eab308)`,
      white:  `R(4,9,2,2,#f1f5f9) R(6,8,12,8,#f1f5f9) R(18,9,2,2,#f1f5f9) R(3,11,3,4,#f1f5f9) R(18,11,3,4,#f1f5f9) R(7,16,2,2,#f1f5f9) R(11,16,2,2,#f1f5f9) R(15,16,2,2,#f1f5f9) R(8,13,8,3,#fef9c3) R(6,6,2,2,#cbd5e1) R(16,6,2,2,#cbd5e1) R(7,7,1,1,#fda4af) R(17,7,1,1,#fda4af) R(4,12,2,2,#e2e8f0) R(18,12,2,2,#e2e8f0)`,
    },
  },
  {
    id: 'tiger', name: '老虎 · 凶猛', emo: 'Tiger Lab', emoji: '🐯',
    colors: [
      { id: 'orange', name: '经典虎', swatch: '#f97316' },
      { id: 'white',  name: '白虎',   swatch: '#f8fafc' },
    ],
    main: '#dc2626', ring: 'rgba(220,38,38,0.45)',
    bodies: {
      orange: `R(4,9,2,2,#f97316) R(6,8,11,6,#f97316) R(17,9,2,2,#f97316) R(6,14,2,4,#f97316) R(10,14,2,4,#f97316) R(14,14,2,4,#f97316) R(8,8,1,2,#1c1917) R(11,8,1,2,#1c1917) R(14,8,1,2,#1c1917) R(7,11,1,2,#1c1917) R(11,11,1,2,#1c1917) R(15,11,1,2,#1c1917) R(6,6,1,2,#f97316) R(9,5,1,2,#f97316) R(14,5,1,2,#f97316) R(17,6,1,2,#f97316) R(7,7,1,1,#1c1917) R(16,7,1,1,#1c1917) R(9,13,6,3,#fef3c7) R(19,9,2,6,#f97316) R(21,8,1,3,#1c1917)`,
      white:  `R(4,9,2,2,#f8fafc) R(6,8,11,6,#f8fafc) R(17,9,2,2,#f8fafc) R(6,14,2,4,#f8fafc) R(10,14,2,4,#f8fafc) R(14,14,2,4,#f8fafc) R(8,8,1,2,#475569) R(11,8,1,2,#475569) R(14,8,1,2,#475569) R(7,11,1,2,#475569) R(11,11,1,2,#475569) R(15,11,1,2,#475569) R(6,6,1,2,#f8fafc) R(9,5,1,2,#f8fafc) R(14,5,1,2,#f8fafc) R(17,6,1,2,#f8fafc) R(7,7,1,1,#fbbf24) R(16,7,1,1,#fbbf24) R(9,13,6,3,#fef3c7) R(19,9,2,6,#f8fafc) R(21,8,1,3,#475569)`,
    },
  },
  {
    id: 'duck', name: '鸭子 · 扁嘴', emo: 'DuckDB', emoji: '🦆',
    colors: [
      { id: 'yellow',  name: '黄鸭',    swatch: '#facc15' },
      { id: 'mallard', name: '绿头鸭',  swatch: '#16a34a' },
    ],
    main: '#eab308', ring: 'rgba(234,179,8,0.45)',
    bodies: {
      yellow:  `R(5,9,2,2,#facc15) R(7,8,10,7,#facc15) R(17,9,2,2,#facc15) R(7,15,2,3,#facc15) R(11,15,2,3,#facc15) R(15,15,2,3,#facc15) R(3,11,3,2,#f97316) R(13,10,2,3,#eab308) R(19,8,2,2,#eab308) R(18,9,1,1,#eab308) R(6,18,3,1,#f97316) R(10,18,3,1,#f97316) R(14,18,3,1,#f97316)`,
      mallard: `R(5,9,2,2,#64748b) R(7,8,10,7,#64748b) R(17,9,2,2,#64748b) R(7,15,2,3,#64748b) R(11,15,2,3,#64748b) R(15,15,2,3,#64748b) R(7,6,10,2,#16a34a) R(9,5,1,1,#16a34a) R(14,5,1,1,#16a34a) R(3,11,3,2,#facc15) R(13,10,2,3,#475569) R(19,8,2,2,#475569) R(6,18,3,1,#f97316) R(10,18,3,1,#f97316) R(14,18,3,1,#f97316)`,
    },
  },
];

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

// ========== 14 态 → 视觉映射（眼睛 + 装饰） ==========
// 复用 v2 的 10 种 face（normal / angry / debug / cool / sleep / halo / yawn / dance / coffee / nap）
// 加 4 个新 face（coding 眯眼 / done 笑 / overtime 闭眼喘 / meeting 闭眼）
const STATUS_META = [
  { id: 'idle',           name: '摸鱼',     icon: '😐', desc: '无所事事 · 等待',  accent: '#9aa0a6', eyes: 'normal', acc: null },
  { id: 'coding',         name: '编码',     icon: '💻', desc: '正在敲键盘',         accent: '#4da3ff', eyes: 'coding',  acc: null },
  { id: 'debugging',      name: '排错',     icon: '🔍', desc: '盯着屏幕找 bug',     accent: '#4da3ff', eyes: 'debug',   acc: null },
  { id: 'panicking',      name: '救火',     icon: '🚨', desc: '生产事故 · 喷火中',  accent: '#ff4d5f', eyes: 'angry',   acc: 'fire' },
  { id: 'done',           name: '完成',     icon: '✅', desc: '任务收工 · 庆祝',     accent: '#00d68f', eyes: 'dance',   acc: 'notes' },
  { id: 'overtime',       name: '加班',     icon: '💀', desc: '画饼续命 · 累死',     accent: '#ffb86b', eyes: 'overtime', acc: null },
  { id: 'coffee',         name: '咖啡',     icon: '☕', desc: '第 5 杯 · 还在肝',    accent: '#ffb86b', eyes: 'coffee',  acc: 'coffee' },
  { id: 'slacking',       name: '划水',     icon: '🌴', desc: '挂机 · 装忙',         accent: '#9aa0a6', eyes: 'cool',    acc: null },
  { id: 'drinkingWater',  name: '打水',     icon: '💧', desc: '接水 · 顺便摸鱼',     accent: '#9aa0a6', eyes: 'yawn',    acc: 'notes' },
  { id: 'praying',        name: '祈祷',     icon: '🙏', desc: '佛祖保佑 · 0 bug',   accent: '#a78bfa', eyes: 'halo',    acc: 'halo' },
  { id: 'demanding',      name: '催命',     icon: '💢', desc: 'PM 在催 · 拍桌子',   accent: '#ff4d5f', eyes: 'angry',   acc: 'fire' },
  { id: 'meeting',        name: '开会',     icon: '📅', desc: '周会 · 假装听',       accent: '#a78bfa', eyes: 'meeting', acc: null },
  { id: 'testing',        name: '测试',     icon: '🧪', desc: '跑用例 · 紧张',       accent: '#4da3ff', eyes: 'debug',   acc: null },
  { id: 'deploying',      name: '部署',     icon: '🚀', desc: '上线 · 别炸',         accent: '#00d68f', eyes: 'dance',   acc: 'notes' },
];

// ========== Face 视觉（眼睛 + 装饰，10 种） ==========
// 加 2 个新 face：coding（眯眼+皱眉）和 overtime（闭眼+喘）
const FACE_VISUALS = {
  normal: { eyes: 'normal' },
  coding: { eyes: 'coding' },
  debug:  { eyes: 'debug' },
  angry:  { eyes: 'angry' },
  dance:  { eyes: 'dance' },
  overtime: { eyes: 'overtime' },
  coffee: { eyes: 'coffee' },
  cool:   { eyes: 'cool' },
  yawn:   { eyes: 'yawn' },
  halo:   { eyes: 'halo' },
  meeting: { eyes: 'meeting' },
};

// ========== 眼睛数据（12 动物 × N 种 face） ==========
// R(x,y,w,h,color) 简写
const FACE_EYES = {
  // normal: 12 动物各 2 圆眼
  normal: [
    `R(8,10,1,1,#0f172a) R(11,10,1,1,#0f172a)`,
    `R(8,9,1,1,#0f172a) R(11,9,1,1,#0f172a)`,
    `R(3,11,1,1,#0f172a)`,
    `R(8,10,1,1,#0f172a) R(12,10,1,1,#0f172a)`,
    `R(8,10,1,1,#0f172a) R(12,10,1,1,#0f172a)`,
    `R(8,10,1,1,#0f172a) R(11,10,1,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a)`,
    `R(9,11,1,1,#0f172a) R(13,11,1,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(14,10,1,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(14,10,1,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a)`,
  ],
  // coding: 眯眼 V 形（专注）
  coding: [
    `R(8,10,2,1,#0f172a) R(11,10,2,1,#0f172a)`,
    `R(8,9,2,1,#0f172a) R(11,9,2,1,#0f172a)`,
    `R(2,11,2,1,#0f172a)`,
    `R(8,10,2,1,#0f172a) R(12,10,2,1,#0f172a)`,
    `R(8,10,2,1,#0f172a) R(12,10,2,1,#0f172a)`,
    `R(8,10,2,1,#0f172a) R(11,10,2,1,#0f172a)`,
    `R(9,10,2,1,#0f172a) R(13,10,2,1,#0f172a)`,
    `R(9,11,2,1,#0f172a) R(13,11,2,1,#0f172a)`,
    `R(9,10,2,1,#0f172a) R(14,10,2,1,#0f172a)`,
    `R(9,10,2,1,#0f172a) R(13,10,2,1,#0f172a)`,
    `R(9,10,2,1,#0f172a) R(14,10,2,1,#0f172a)`,
    `R(9,10,2,1,#0f172a) R(13,10,2,1,#0f172a)`,
  ],
  // debug: 戴圆框眼镜
  debug: [
    `R(6,9,4,3,STROKE:#94a3b8,1) R(11,9,4,3,STROKE:#94a3b8,1) R(10,10,1,1,#94a3b8) R(7,10,2,1,#0f172a) R(12,10,2,1,#0f172a)`,
    `R(6,8,4,3,STROKE:#94a3b8,1) R(13,8,4,3,STROKE:#94a3b8,1) R(10,9,1,1,#94a3b8) R(7,9,2,1,#0f172a) R(14,9,2,1,#0f172a)`,
    `R(1,10,4,2,STROKE:#94a3b8,1) R(2,11,2,1,#0f172a)`,
    `R(7,9,4,3,STROKE:#94a3b8,1) R(12,9,4,3,STROKE:#94a3b8,1) R(10,10,1,1,#94a3b8) R(8,10,2,1,#0f172a) R(13,10,2,1,#0f172a)`,
    `R(7,9,4,3,STROKE:#94a3b8,1) R(12,9,4,3,STROKE:#94a3b8,1) R(10,10,1,1,#94a3b8) R(8,10,2,1,#0f172a) R(13,10,2,1,#0f172a)`,
    `R(7,9,4,3,STROKE:#94a3b8,1) R(11,9,4,3,STROKE:#94a3b8,1) R(10,10,1,1,#94a3b8) R(8,10,2,1,#0f172a) R(12,10,2,1,#0f172a)`,
    `R(8,9,4,3,STROKE:#94a3b8,1) R(12,9,4,3,STROKE:#94a3b8,1) R(11,10,1,1,#94a3b8) R(9,10,2,1,#0f172a) R(13,10,2,1,#0f172a)`,
    `R(8,10,4,3,STROKE:#94a3b8,1) R(12,10,4,3,STROKE:#94a3b8,1) R(11,11,1,1,#94a3b8) R(9,11,2,1,#0f172a) R(13,11,2,1,#0f172a)`,
    `R(8,9,4,3,STROKE:#94a3b8,1) R(13,9,4,3,STROKE:#94a3b8,1) R(11,10,1,1,#94a3b8) R(9,10,2,1,#0f172a) R(14,10,2,1,#0f172a)`,
    `R(8,9,4,3,STROKE:#94a3b8,1) R(12,9,4,3,STROKE:#94a3b8,1) R(11,10,1,1,#94a3b8) R(9,10,2,1,#0f172a) R(13,10,2,1,#0f172a)`,
    `R(8,9,4,3,STROKE:#94a3b8,1) R(13,9,4,3,STROKE:#94a3b8,1) R(11,10,1,1,#94a3b8) R(9,10,2,1,#0f172a) R(14,10,2,1,#0f172a)`,
    `R(8,9,4,3,STROKE:#94a3b8,1) R(12,9,4,3,STROKE:#94a3b8,1) R(11,10,1,1,#94a3b8) R(9,10,2,1,#0f172a) R(13,10,2,1,#0f172a)`,
  ],
  // angry: 皱眉
  angry: [
    `R(7,9,2,1,#0f172a) R(13,9,2,1,#0f172a) R(9,12,3,1,#0f172a)`,
    `R(7,8,2,1,#0f172a) R(13,8,2,1,#0f172a) R(10,12,2,1,#0f172a)`,
    `R(2,10,2,1,#0f172a) R(4,10,1,1,#0f172a) R(2,12,2,1,#0f172a)`,
    `R(7,9,2,1,#0f172a) R(11,9,2,1,#0f172a) R(10,12,3,1,#0f172a)`,
    `R(7,9,2,1,#0f172a) R(11,9,2,1,#0f172a) R(2,13,3,1,#0f172a)`,
    `R(7,8,2,1,#0f172a) R(11,8,2,1,#0f172a) R(10,12,3,1,#0f172a)`,
    `R(8,9,2,1,#0f172a) R(12,9,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(8,10,2,1,#0f172a) R(12,10,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(8,9,2,1,#0f172a) R(13,9,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(8,9,2,1,#0f172a) R(12,9,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(8,8,2,1,#0f172a) R(13,8,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(8,9,2,1,#0f172a) R(13,9,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
  ],
  // dance: 笑眼
  dance: [
    `R(8,10,1,1,#0f172a) R(11,10,1,1,#0f172a) R(9,12,3,2,#0f172a) R(10,12,1,1,#fb7185)`,
    `R(8,9,1,1,#0f172a) R(11,9,1,1,#0f172a) R(10,12,3,2,#0f172a) R(11,12,1,1,#fb7185)`,
    `R(3,11,1,1,#0f172a) R(2,12,2,2,#0f172a) R(2,12,1,1,#fb7185)`,
    `R(8,10,1,1,#0f172a) R(12,10,1,1,#0f172a) R(10,12,3,2,#0f172a) R(11,12,1,1,#fb7185)`,
    `R(8,10,1,1,#0f172a) R(12,10,1,1,#0f172a) R(2,13,3,2,#0f172a) R(2,13,1,1,#fb7185)`,
    `R(8,10,1,1,#0f172a) R(11,10,1,1,#0f172a) R(10,12,3,2,#0f172a) R(11,12,1,1,#fb7185)`,
    `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a) R(11,12,3,2,#0f172a) R(12,12,1,1,#fb7185)`,
    `R(9,11,1,1,#0f172a) R(13,11,1,1,#0f172a) R(11,12,3,2,#0f172a) R(12,12,1,1,#fb7185)`,
    `R(9,10,1,1,#0f172a) R(14,10,1,1,#0f172a) R(11,12,3,2,#0f172a) R(12,12,1,1,#fb7185)`,
    `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a) R(11,12,3,2,#0f172a) R(12,12,1,1,#fb7185)`,
    `R(9,10,1,1,#0f172a) R(14,10,1,1,#0f172a) R(11,12,3,2,#0f172a) R(12,12,1,1,#fb7185)`,
    `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a) R(11,12,3,2,#0f172a) R(12,12,1,1,#fb7185)`,
  ],
  // overtime: 闭眼 + 嘴
  overtime: [
    `R(8,10,2,1,#0f172a) R(11,10,2,1,#0f172a) R(9,12,3,1,#0f172a)`,
    `R(8,9,2,1,#0f172a) R(11,9,2,1,#0f172a) R(10,12,2,1,#0f172a)`,
    `R(2,11,2,1,#0f172a) R(2,12,2,1,#0f172a)`,
    `R(8,10,2,1,#0f172a) R(12,10,2,1,#0f172a) R(10,12,3,1,#0f172a)`,
    `R(8,10,2,1,#0f172a) R(12,10,2,1,#0f172a) R(2,13,3,1,#0f172a)`,
    `R(8,10,2,1,#0f172a) R(11,10,2,1,#0f172a) R(10,12,3,1,#0f172a)`,
    `R(9,10,2,1,#0f172a) R(13,10,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,11,2,1,#0f172a) R(13,11,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,2,1,#0f172a) R(14,10,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,2,1,#0f172a) R(13,10,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,2,1,#0f172a) R(14,10,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,2,1,#0f172a) R(13,10,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
  ],
  // coffee: 睁眼 + 抿嘴
  coffee: [
    `R(8,10,1,1,#0f172a) R(11,10,1,1,#0f172a) R(9,12,3,1,#0f172a)`,
    `R(8,9,1,1,#0f172a) R(11,9,1,1,#0f172a) R(10,12,2,1,#0f172a)`,
    `R(3,11,1,1,#0f172a) R(2,12,2,1,#0f172a)`,
    `R(8,10,1,1,#0f172a) R(12,10,1,1,#0f172a) R(10,12,3,1,#0f172a)`,
    `R(8,10,1,1,#0f172a) R(12,10,1,1,#0f172a) R(2,13,3,1,#0f172a)`,
    `R(8,10,1,1,#0f172a) R(11,10,1,1,#0f172a) R(10,12,3,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,11,1,1,#0f172a) R(13,11,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(14,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(14,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
  ],
  // cool: 戴墨镜
  cool: [
    `R(6,9,3,2,#0f172a) R(11,9,3,2,#0f172a) R(9,10,2,1,#0f172a) R(6,9,1,1,#38bdf8) R(11,9,1,1,#38bdf8)`,
    `R(6,8,3,2,#0f172a) R(13,8,3,2,#0f172a) R(6,8,1,1,#38bdf8) R(13,8,1,1,#38bdf8)`,
    `R(1,10,4,2,#0f172a) R(2,10,1,1,#38bdf8)`,
    `R(7,9,3,2,#0f172a) R(12,9,3,2,#0f172a) R(7,9,1,1,#38bdf8) R(12,9,1,1,#38bdf8)`,
    `R(7,9,3,2,#0f172a) R(12,9,3,2,#0f172a) R(7,9,1,1,#38bdf8) R(12,9,1,1,#38bdf8)`,
    `R(7,9,3,2,#0f172a) R(11,9,3,2,#0f172a) R(7,9,1,1,#38bdf8) R(11,9,1,1,#38bdf8)`,
    `R(8,9,3,2,#0f172a) R(12,9,3,2,#0f172a) R(8,9,1,1,#38bdf8) R(12,9,1,1,#38bdf8)`,
    `R(8,10,3,2,#0f172a) R(12,10,3,2,#0f172a) R(8,10,1,1,#38bdf8) R(12,10,1,1,#38bdf8)`,
    `R(8,9,3,2,#0f172a) R(13,9,3,2,#0f172a) R(8,9,1,1,#38bdf8) R(13,9,1,1,#38bdf8)`,
    `R(8,9,3,2,#0f172a) R(12,9,3,2,#0f172a) R(8,9,1,1,#38bdf8) R(12,9,1,1,#38bdf8)`,
    `R(8,9,3,2,#0f172a) R(13,9,3,2,#0f172a) R(8,9,1,1,#38bdf8) R(13,9,1,1,#38bdf8)`,
    `R(8,9,3,2,#0f172a) R(12,9,3,2,#0f172a) R(8,9,1,1,#38bdf8) R(12,9,1,1,#38bdf8)`,
  ],
  // yawn: 哈欠嘴
  yawn: [
    `R(8,10,1,1,#0f172a) R(11,10,1,1,#0f172a) R(9,12,3,2,#0f172a) R(10,13,1,1,#fb7185)`,
    `R(8,9,1,1,#0f172a) R(11,9,1,1,#0f172a) R(10,11,4,2,#0f172a) R(11,12,2,1,#fb7185)`,
    `R(3,11,1,1,#0f172a) R(2,12,2,2,#0f172a) R(2,13,1,1,#fb7185)`,
    `R(8,10,1,1,#0f172a) R(12,10,1,1,#0f172a) R(10,12,3,2,#0f172a) R(11,13,1,1,#fb7185)`,
    `R(8,10,1,1,#0f172a) R(12,10,1,1,#0f172a) R(2,13,3,1,#0f172a) R(2,14,2,1,#fb7185)`,
    `R(8,10,1,1,#0f172a) R(11,10,1,1,#0f172a) R(10,12,3,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a) R(11,12,3,1,#0f172a) R(12,12,1,1,#fb7185)`,
    `R(9,11,1,1,#0f172a) R(13,11,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(14,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(14,10,1,1,#0f172a) R(11,12,3,1,#0f172a) R(12,12,1,1,#fb7185)`,
    `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
  ],
  // halo: 睁眼微笑
  halo: [
    `R(8,10,1,1,#0f172a) R(11,10,1,1,#0f172a) R(9,12,3,1,#0f172a)`,
    `R(8,9,1,1,#0f172a) R(11,9,1,1,#0f172a) R(10,12,2,1,#0f172a)`,
    `R(3,11,1,1,#0f172a) R(2,12,2,1,#0f172a)`,
    `R(8,10,1,1,#0f172a) R(12,10,1,1,#0f172a) R(10,12,3,1,#0f172a)`,
    `R(8,10,1,1,#0f172a) R(12,10,1,1,#0f172a) R(2,13,3,1,#0f172a)`,
    `R(8,10,1,1,#0f172a) R(11,10,1,1,#0f172a) R(10,12,3,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,11,1,1,#0f172a) R(13,11,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(14,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(14,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
  ],
  // meeting: 闭眼听
  meeting: [
    `R(8,10,2,1,#0f172a) R(11,10,2,1,#0f172a) R(9,12,3,1,#0f172a)`,
    `R(8,9,2,1,#0f172a) R(11,9,2,1,#0f172a) R(10,12,2,1,#0f172a)`,
    `R(2,11,2,1,#0f172a) R(2,12,2,1,#0f172a)`,
    `R(8,10,2,1,#0f172a) R(12,10,2,1,#0f172a) R(10,12,3,1,#0f172a)`,
    `R(8,10,2,1,#0f172a) R(12,10,2,1,#0f172a) R(2,13,3,1,#0f172a)`,
    `R(8,10,2,1,#0f172a) R(11,10,2,1,#0f172a) R(10,12,3,1,#0f172a)`,
    `R(9,10,2,1,#0f172a) R(13,10,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,11,2,1,#0f172a) R(13,11,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,2,1,#0f172a) R(14,10,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,2,1,#0f172a) R(13,10,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,2,1,#0f172a) R(14,10,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
    `R(9,10,2,1,#0f172a) R(13,10,2,1,#0f172a) R(11,12,3,1,#0f172a)`,
  ],
};

// ========== 装饰层（与 v2 类似但简化） ==========
// 包含：zzz / fire / halo / coffee / notes
const ACC_LAYERS = {
  zzz: `<text class="acc-item" x="20" y="6" font-size="3" fill="#38bdf8">Z</text>
        <text class="acc-item" x="22" y="4" font-size="4" fill="#a78bfa">Z</text>
        <text class="acc-item" x="0" y="9" font-size="3" fill="#38bdf8">Z</text>
        <text class="acc-item" x="0" y="6" font-size="4" fill="#a78bfa">Z</text>`,
  fire: `<rect x="20" y="11" width="2" height="2" fill="#f97316"/><rect x="19" y="12" width="1" height="1" fill="#facc15"/><rect x="22" y="12" width="1" height="1" fill="#facc15"/><rect x="21" y="13" width="1" height="1" fill="#ef4444"/>
        <rect x="1" y="11" width="2" height="2" fill="#f97316"/><rect x="3" y="12" width="1" height="1" fill="#facc15"/><rect x="0" y="12" width="1" height="1" fill="#facc15"/><rect x="1" y="13" width="1" height="1" fill="#ef4444"/>
        <rect x="2" y="11" width="2" height="2" fill="#f97316"/><rect x="1" y="12" width="1" height="1" fill="#facc15"/><rect x="4" y="12" width="1" height="1" fill="#facc15"/><rect x="2" y="13" width="1" height="1" fill="#ef4444"/>`,
  halo: `<ellipse cx="11" cy="3" rx="5" ry="1.2" fill="none" stroke="#fde047" stroke-width="0.8"/>
         <ellipse cx="11" cy="3" rx="3.5" ry="0.8" fill="none" stroke="#facc15" stroke-width="0.5"/>`,
  coffee: `<rect x="20" y="9" width="2" height="4" fill="#1e293b"/><rect x="20" y="9" width="2" height="1" fill="#475569"/><rect x="22" y="10" width="1" height="2" fill="none" stroke="#1e293b" stroke-width="0.5"/>
           <rect x="0" y="9" width="2" height="4" fill="#1e293b"/><rect x="0" y="9" width="2" height="1" fill="#475569"/><rect x="-1" y="10" width="1" height="2" fill="none" stroke="#1e293b" stroke-width="0.5"/>`,
  notes: `<text class="acc-item" x="20" y="6" font-size="3" fill="#a78bfa">♪</text>
          <text class="acc-item" x="22" y="9" font-size="2.5" fill="#f472b6">♫</text>
          <text class="acc-item" x="0" y="7" font-size="3" fill="#a78bfa">♪</text>
          <text class="acc-item" x="0" y="5" font-size="2.5" fill="#f472b6">♫</text>`,
};

// ========== 解析 R() 简写为 SVG ==========
function expandRects(str) {
  const out = [];
  const re = /R\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    const parts = m[1].split(',');
    const x = +parts[0], y = +parts[1], w = +parts[2], h = +parts[3];
    const rest = parts.slice(4).join(',').trim();
    // STROKE:color,sw
    if (rest.startsWith('STROKE:')) {
      const [_, color, sw] = rest.match(/STROKE:(#[0-9a-fA-F]+),(\d+)/) || [];
      out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${color}" stroke-width="${sw}"/>`);
    } else {
      out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${rest}"/>`);
    }
  }
  return out.join('');
}

// ========== 生成 bodies / faces 字典 ==========
const BODIES = {}; // BODIES[animal][color] = svg string
for (const a of ANIMALS) {
  BODIES[a.id] = {};
  for (const c of a.colors) {
    BODIES[a.id][c.id] = expandRects(a.bodies[c.id]);
  }
}

const FACES = {}; // FACES[faceId][animalIndex] = svg string
for (const [faceId, animalArr] of Object.entries(FACE_EYES)) {
  FACES[faceId] = animalArr.map(s => expandRects(s));
}

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

  /* SVG */
  .pixel-svg { image-rendering: pixelated; display: block; }
  .pixel-svg .animal-body { display: inline; }
  .pixel-svg .animal-face { display: inline; }
  .pixel-svg .acc-item { animation: accFloat 1.6s ease-in infinite; }
  .pixel-svg .acc-item:nth-child(2n) { animation-delay: 0.3s; }
  .pixel-svg .acc-item:nth-child(3n) { animation-delay: 0.6s; }
  .pixel-svg .acc-item:nth-child(4n) { animation-delay: 0.9s; }
  @keyframes accFloat {
    0% { transform: translateY(0); opacity: 0.8; }
    50% { transform: translateY(-2px); opacity: 1; }
    100% { transform: translateY(0); opacity: 0.8; }
  }

  /* 矩阵里简化动画（避免 168 个同时抖） */
  .matrix .cell .pixel-svg > div { animation: none !important; }
  .matrix .cell .pixel-svg .acc-item { animation: none; }

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
  const ANIMALS = ${jsStr(ANIMALS.map(a => ({ id: a.id, name: a.name, emo: a.emo, emoji: a.emoji, colors: a.colors, main: a.main, ring: a.ring })))};
  const STATUS_META = ${jsStr(STATUS_META)};
  const STATUS_MOTION = ${jsStr(STATUS_MOTION)};
  const BODIES = ${jsStr(BODIES)};
  const FACES = ${jsStr(FACES)};
  const ACC_LAYERS = ${jsStr(ACC_LAYERS)};

  const ANIMAL_BY_ID = Object.fromEntries(ANIMALS.map(a => [a.id, a]));
  const STATUS_BY_ID = Object.fromEntries(STATUS_META.map(s => [s.id, s]));

  // ========== 组件 ==========
  function PixelAnimal({ animal, color, status, size = 140, noMotion = false }) {
    const meta = STATUS_BY_ID[status];
    const eyesKey = meta.eyes;
    const accKey = meta.acc;
    const animalIdx = ANIMALS.findIndex(a => a.id === animal);
    const bodySvg = BODIES[animal]?.[color] || '';
    const faceSvg = FACES[eyesKey]?.[animalIdx] || '';
    const accSvg = accKey ? ACC_LAYERS[accKey] : '';
    const motionCfg = STATUS_MOTION[status];

    const svg = html\`
      <svg class="pixel-svg" viewBox="0 0 24 24" width=\${size} height=\${size} shape-rendering="crispEdges">
        <g class="animal-body">\${React.createElement('g', { dangerouslySetInnerHTML: { __html: bodySvg } })}</g>
        <g class="animal-face">\${React.createElement('g', { dangerouslySetInnerHTML: { __html: faceSvg } })}</g>
        \${accSvg ? React.createElement('g', { className: 'animal-acc', dangerouslySetInnerHTML: { __html: accSvg } }) : null}
      </svg>
    \`;

    if (noMotion) {
      return html\`<div style=\${ { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' } }>\${svg}</div>\`;
    }
    return html\`
      <\${motion.div}
        style=\${ { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' } }
        animate=\${motionCfg.animate}
        transition=\${motionCfg.transition}
        whileHover=\${{ scale: 1.06 }}
        whileTap=\${{ scale: 0.96 }}
      >\${svg}</\${motion.div}>
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
          <div class="preview" style=\${{ '--ring-color': a.main, '--ring-glow': a.ring }}>
            <div class="preview-stage">
              <div class="stage-card" style=\${{ '--ring-color': a.main, '--ring-glow': a.ring }}>
                <span class="badge" style=\${{ borderColor: a.main, color: a.main }}>\${a.emo} · \${c.name} · \${s.name}</span>
                <\${PixelAnimal} animal=\${animal} color=\${color} status=\${status} size=\${150} />
                <span class="tag" style=\${{ borderColor: a.main, color: a.main }}>\${status.toUpperCase()}</span>
              </div>
            </div>
            <div class="preview-info">
              <div>
                <div class="name" style=\${{ color: a.main }}>\${a.name}</div>
                <div class="mood">当前状态 · <em style=\${{ color: a.main }}>\${s.desc}</em></div>
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
                    <div key=\${st.id} class="cell" style=\${{ '--cell-color': an.main, '--cell-glow': an.ring }}
                         onClick=\${() => { setAnimal(an.id); setColor(an.colors[0].id); setStatus(st.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                         title=\${an.name + ' · ' + st.name}>
                      <\${PixelAnimal} animal=\${an.id} color=\${an.colors[0].id} status=\${st.id} size=\${36} noMotion=\${true} />
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
