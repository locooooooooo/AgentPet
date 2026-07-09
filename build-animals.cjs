// animal-emotions.html 生成器
// 用法: node build-animals.js > animal-emotions.html
// 或者: node build-animals.js animal-emotions.html

const fs = require('fs');
const path = require('path');

const outPath = process.argv[2] || path.join(__dirname, 'animal-emotions.html');

// ========== 动物数据 ==========
// 每个 animal.colors 是配色数组，colors[0] 是 default
// 每个 color.body 是 SVG 字符串（24x24 viewBox）
// 脸部眼睛按 emotion 切换：每个 face 数组元素是给某动物的某表情
// 我们用通用 face（包含 12 个动物的眼睛位置），通过 data-emotion 切换

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

// ========== 表情数据 ==========
// 每个 emotion 包含：12 动物的眼睛位置（按 ANIMALS 顺序）+ 装饰
// 眼睛用统一的 (R x y w h color) 表达
const EMOTIONS = [
  {
    id: 'normal', name: '正常', mood: '正常上班中', tag: 'IDLE', color: '#38bdf8',
    icon: '😐',
    // 12 动物眼睛（按 ANIMALS 顺序）
    eyes: [
      `R(8,10,1,1,#0f172a) R(11,10,1,1,#0f172a)`,         // cow
      `R(8,9,1,1,#0f172a) R(11,9,1,1,#0f172a)`,          // horse
      `R(3,11,1,1,#0f172a)`,                              // sheep
      `R(8,10,1,1,#0f172a) R(12,10,1,1,#0f172a)`,         // cat
      `R(8,10,1,1,#0f172a) R(12,10,1,1,#0f172a)`,         // dog
      `R(8,10,1,1,#0f172a) R(11,10,1,1,#0f172a)`,         // chicken
      `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a)`,         // panda
      `R(9,11,1,1,#0f172a) R(13,11,1,1,#0f172a)`,         // fox
      `R(9,10,1,1,#0f172a) R(14,10,1,1,#0f172a)`,         // rabbit
      `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a)`,         // hamster
      `R(9,10,1,1,#0f172a) R(14,10,1,1,#0f172a)`,         // tiger
      `R(9,10,1,1,#0f172a) R(13,10,1,1,#0f172a)`,         // duck
    ],
  },
  {
    id: 'sleep', name: '睡觉', mood: 'ZZZ…正在摸鱼', tag: 'SLEEP', color: '#818cf8',
    icon: '😴',
    eyes: [
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
    acc: 'zzz',
  },
  {
    id: 'yawn', name: '打哈欠', mood: '咖啡还没到 · 心累', tag: 'YAWN', color: '#facc15',
    icon: '🥱',
    eyes: [
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
    acc: 'notes',
  },
  {
    id: 'angry', name: '怒火', mood: '生产事故 · 救火中', tag: 'ON_FIRE', color: '#ef4444',
    icon: '🔥',
    eyes: [
      `R(7,9,2,1,#0f172a) R(9,10,1,1,#0f172a) R(11,10,1,1,#0f172a) R(13,9,2,1,#0f172a) R(9,12,3,1,#0f172a)`,
      `R(7,8,2,1,#0f172a) R(13,8,2,1,#0f172a) R(8,10,1,1,#0f172a) R(11,10,1,1,#0f172a) R(10,12,2,1,#0f172a)`,
      `R(2,10,2,1,#0f172a) R(4,10,1,1,#0f172a) R(2,12,2,1,#0f172a)`,
      `R(7,9,2,1,#0f172a) R(11,9,2,1,#0f172a) R(8,10,1,1,#0f172a) R(12,10,1,1,#0f172a) R(10,12,2,1,#0f172a)`,
      `R(7,9,2,1,#0f172a) R(11,9,2,1,#0f172a) R(8,10,1,1,#0f172a) R(12,10,1,1,#0f172a) R(2,13,3,1,#0f172a)`,
      `R(7,8,2,1,#0f172a) R(11,8,2,1,#0f172a) R(8,10,1,1,#0f172a) R(11,10,1,1,#0f172a) R(10,12,3,1,#0f172a)`,
      `R(8,9,2,1,#0f172a) R(12,9,2,1,#0f172a) R(10,10,1,1,#0f172a) R(13,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
      `R(8,10,2,1,#0f172a) R(12,10,2,1,#0f172a) R(10,10,1,1,#0f172a) R(13,10,1,1,#0f172a) R(11,13,3,1,#0f172a)`,
      `R(8,9,2,1,#0f172a) R(13,9,2,1,#0f172a) R(10,10,1,1,#0f172a) R(14,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
      `R(8,9,2,1,#0f172a) R(12,9,2,1,#0f172a) R(10,10,1,1,#0f172a) R(13,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
      `R(8,8,2,1,#0f172a) R(13,8,2,1,#0f172a) R(10,10,1,1,#0f172a) R(14,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
      `R(8,9,2,1,#0f172a) R(13,9,2,1,#0f172a) R(10,10,1,1,#0f172a) R(14,10,1,1,#0f172a) R(11,12,3,1,#0f172a)`,
    ],
    acc: 'fire',
  },
  {
    id: 'cool', name: '装酷', mood: '装 · 其实很慌', tag: 'COOL', color: '#64748b',
    icon: '😎',
    eyes: [
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
  },
  {
    id: 'halo', name: '佛祖', mood: '佛祖保佑 · 0 bug', tag: 'BLESSED', color: '#fde047',
    icon: '😇',
    eyes: [
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
    acc: 'halo',
  },
  {
    id: 'debug', name: '排查', mood: '盯着屏幕找 bug', tag: 'DEBUG', color: '#22d3ee',
    icon: '🤓',
    eyes: [
      `R(6,9,4,3,none:#94a3b8,1) R(11,9,4,3,none:#94a3b8,1) R(10,10,1,1,#94a3b8) R(7,10,2,1,#0f172a) R(12,10,2,1,#0f172a)`,
      `R(6,8,4,3,none:#94a3b8,1) R(13,8,4,3,none:#94a3b8,1) R(10,9,1,1,#94a3b8) R(7,9,2,1,#0f172a) R(14,9,2,1,#0f172a)`,
      `R(1,10,4,2,none:#94a3b8,1) R(2,11,2,1,#0f172a)`,
      `R(7,9,4,3,none:#94a3b8,1) R(12,9,4,3,none:#94a3b8,1) R(10,10,1,1,#94a3b8) R(8,10,2,1,#0f172a) R(13,10,2,1,#0f172a)`,
      `R(7,9,4,3,none:#94a3b8,1) R(12,9,4,3,none:#94a3b8,1) R(10,10,1,1,#94a3b8) R(8,10,2,1,#0f172a) R(13,10,2,1,#0f172a)`,
      `R(7,9,4,3,none:#94a3b8,1) R(11,9,4,3,none:#94a3b8,1) R(10,10,1,1,#94a3b8) R(8,10,2,1,#0f172a) R(12,10,2,1,#0f172a)`,
      `R(8,9,4,3,none:#94a3b8,1) R(12,9,4,3,none:#94a3b8,1) R(11,10,1,1,#94a3b8) R(9,10,2,1,#0f172a) R(13,10,2,1,#0f172a)`,
      `R(8,10,4,3,none:#94a3b8,1) R(12,10,4,3,none:#94a3b8,1) R(11,11,1,1,#94a3b8) R(9,11,2,1,#0f172a) R(13,11,2,1,#0f172a)`,
      `R(8,9,4,3,none:#94a3b8,1) R(13,9,4,3,none:#94a3b8,1) R(11,10,1,1,#94a3b8) R(9,10,2,1,#0f172a) R(14,10,2,1,#0f172a)`,
      `R(8,9,4,3,none:#94a3b8,1) R(12,9,4,3,none:#94a3b8,1) R(11,10,1,1,#94a3b8) R(9,10,2,1,#0f172a) R(13,10,2,1,#0f172a)`,
      `R(8,9,4,3,none:#94a3b8,1) R(13,9,4,3,none:#94a3b8,1) R(11,10,1,1,#94a3b8) R(9,10,2,1,#0f172a) R(14,10,2,1,#0f172a)`,
      `R(8,9,4,3,none:#94a3b8,1) R(12,9,4,3,none:#94a3b8,1) R(11,10,1,1,#94a3b8) R(9,10,2,1,#0f172a) R(13,10,2,1,#0f172a)`,
    ],
  },
  {
    id: 'coffee', name: '续命', mood: '第 5 杯 · 还能肝', tag: 'CAFFEINE', color: '#a16207',
    icon: '☕',
    eyes: [
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
    acc: 'coffee',
  },
  {
    id: 'dance', name: '划水', mood: '周五下午 · 摇摆', tag: 'DANCE', color: '#f472b6',
    icon: '🕺',
    eyes: [
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
    acc: 'notes',
  },
  {
    id: 'nap', name: '趴窝', mood: '躺平 · 不想动', tag: 'NAP', color: '#a78bfa',
    icon: '🛌',
    eyes: [
      `R(6,13,1,1,#0f172a) R(8,13,1,1,#0f172a)`,
      `R(6,13,1,1,#0f172a) R(9,13,1,1,#0f172a)`,
      `R(2,13,1,1,#0f172a)`,
      `R(6,13,1,1,#0f172a) R(9,13,1,1,#0f172a)`,
      `R(6,13,1,1,#0f172a) R(9,13,1,1,#0f172a)`,
      `R(6,13,1,1,#0f172a) R(8,13,1,1,#0f172a)`,
      `R(7,13,1,1,#0f172a) R(9,13,1,1,#0f172a)`,
      `R(7,14,1,1,#0f172a) R(9,14,1,1,#0f172a)`,
      `R(7,13,1,1,#0f172a) R(10,13,1,1,#0f172a)`,
      `R(7,13,1,1,#0f172a) R(9,13,1,1,#0f172a)`,
      `R(7,13,1,1,#0f172a) R(10,13,1,1,#0f172a)`,
      `R(7,13,1,1,#0f172a) R(9,13,1,1,#0f172a)`,
    ],
  },
];

// ========== 辅助：把 R(...) 简写展开成 SVG <rect> 或 ellipse ==========
function expandRects(str) {
  // 匹配 R(x,y,w,h,color) 或 E(x,y,rx,ry,fill,stroke,sw)
  const out = [];
  const re = /R\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    const parts = m[1].split(',');
    const x = +parts[0], y = +parts[1], w = +parts[2], h = +parts[3];
    const colorRaw = parts.slice(4).join(',').trim();
    // 解析 color，可能是 "none:#94a3b8,1" 表示 stroke
    if (colorRaw.startsWith('none:')) {
      const strokeColor = colorRaw.split(':')[1].split(',')[0];
      const sw = colorRaw.split(',')[1] || 1;
      out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${strokeColor}" stroke-width="${sw}"/>`);
    } else {
      out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${colorRaw}"/>`);
    }
  }
  return out.join('');
}

// ========== 生成 SVG 身体 ==========
function genBodies() {
  const out = [];
  for (const a of ANIMALS) {
    for (const c of a.colors) {
      out.push(`<g class="body" data-animal="${a.id}" data-color="${c.id}">${expandRects(a.bodies[c.id])}</g>`);
    }
  }
  return out.join('\n');
}

// ========== 生成表情脸部 ==========
function genFaces() {
  const out = [];
  for (let i = 0; i < EMOTIONS.length; i++) {
    const e = EMOTIONS[i];
    const a = ANIMALS;
    let body = `<g class="face" data-emotion="${e.id}">`;
    for (let j = 0; j < a.length; j++) {
      body += `<g data-for-animal="${a[j].id}">${expandRects(e.eyes[j])}</g>`;
    }
    body += `</g>`;
    out.push(body);
  }
  return out.join('\n');
}

// ========== 生成装饰层（ZZZ / fire / halo / coffee / notes） ==========
function genAcc() {
  return `
<g class="acc">
  <!-- SLEEP: ZZZ -->
  <g class="zzz" data-emotion="sleep">
    <text class="zzz-item delay-1" x="20" y="6" font-family="monospace" font-size="3" font-weight="900" fill="#38bdf8">Z</text>
    <text class="zzz-item delay-2" x="22" y="4" font-family="monospace" font-size="4" font-weight="900" fill="#a78bfa">Z</text>
    <text class="zzz-item delay-3" x="0" y="9" font-family="monospace" font-size="3" font-weight="900" fill="#38bdf8">Z</text>
    <text class="zzz-item delay-1" x="0" y="9" font-family="monospace" font-size="3" font-weight="900" fill="#38bdf8">Z</text>
    <text class="zzz-item delay-2" x="0" y="6" font-family="monospace" font-size="4" font-weight="900" fill="#a78bfa">Z</text>
    <text class="zzz-item delay-1" x="20" y="6" font-family="monospace" font-size="3" font-weight="900" fill="#38bdf8">Z</text>
    <text class="zzz-item delay-2" x="22" y="4" font-family="monospace" font-size="4" font-weight="900" fill="#a78bfa">Z</text>
    <text class="zzz-item delay-1" x="20" y="6" font-family="monospace" font-size="3" font-weight="900" fill="#38bdf8">Z</text>
    <text class="zzz-item delay-2" x="22" y="4" font-family="monospace" font-size="4" font-weight="900" fill="#a78bfa">Z</text>
    <text class="zzz-item delay-1" x="20" y="6" font-family="monospace" font-size="3" font-weight="900" fill="#38bdf8">Z</text>
    <text class="zzz-item delay-2" x="22" y="4" font-family="monospace" font-size="4" font-weight="900" fill="#a78bfa">Z</text>
  </g>

  <!-- ANGRY: 火（嘴巴两侧） -->
  <g class="flame" data-emotion="angry">
    <g class="fire on">
      <rect x="20" y="11" width="2" height="2" fill="#f97316"/><rect x="19" y="12" width="1" height="1" fill="#facc15"/><rect x="22" y="12" width="1" height="1" fill="#facc15"/><rect x="21" y="13" width="1" height="1" fill="#ef4444"/>
      <rect x="1" y="11" width="2" height="2" fill="#f97316"/><rect x="3" y="12" width="1" height="1" fill="#facc15"/><rect x="0" y="12" width="1" height="1" fill="#facc15"/><rect x="1" y="13" width="1" height="1" fill="#ef4444"/>
      <rect x="2" y="11" width="2" height="2" fill="#f97316"/><rect x="1" y="12" width="1" height="1" fill="#facc15"/><rect x="4" y="12" width="1" height="1" fill="#facc15"/><rect x="2" y="13" width="1" height="1" fill="#ef4444"/>
      <rect x="1" y="11" width="2" height="2" fill="#f97316"/><rect x="0" y="12" width="1" height="1" fill="#facc15"/><rect x="3" y="12" width="1" height="1" fill="#facc15"/><rect x="1" y="13" width="1" height="1" fill="#ef4444"/>
    </g>
  </g>

  <!-- HALO: 光环（动物头顶） -->
  <g class="halo" data-emotion="halo">
    <g class="halo-elem on">
      <ellipse cx="11" cy="3" rx="5" ry="1.2" fill="none" stroke="#fde047" stroke-width="0.8"/>
      <ellipse cx="11" cy="3" rx="3.5" ry="0.8" fill="none" stroke="#facc15" stroke-width="0.5"/>
      <ellipse cx="3" cy="9" rx="3" ry="0.8" fill="none" stroke="#fde047" stroke-width="0.6"/>
      <ellipse cx="11" cy="2" rx="5" ry="1.2" fill="none" stroke="#fde047" stroke-width="0.8"/>
      <ellipse cx="3" cy="9" rx="3" ry="0.8" fill="none" stroke="#fde047" stroke-width="0.6"/>
      <ellipse cx="11" cy="2" rx="5" ry="1.2" fill="none" stroke="#fde047" stroke-width="0.8"/>
      <ellipse cx="3" cy="9" rx="3" ry="0.8" fill="none" stroke="#fde047" stroke-width="0.6"/>
    </g>
  </g>

  <!-- COFFEE: 杯子 -->
  <g class="coffee-g" data-emotion="coffee">
    <g class="coffee on">
      <rect x="20" y="9" width="2" height="4" fill="#1e293b"/><rect x="20" y="9" width="2" height="1" fill="#475569"/><rect x="22" y="10" width="1" height="2" fill="none" stroke="#1e293b" stroke-width="0.5"/>
      <rect x="0" y="9" width="2" height="4" fill="#1e293b"/><rect x="0" y="9" width="2" height="1" fill="#475569"/><rect x="-1" y="10" width="1" height="2" fill="none" stroke="#1e293b" stroke-width="0.5"/>
      <rect x="20" y="9" width="2" height="4" fill="#1e293b"/><rect x="20" y="9" width="2" height="1" fill="#475569"/><rect x="22" y="10" width="1" height="2" fill="none" stroke="#1e293b" stroke-width="0.5"/>
    </g>
  </g>

  <!-- DANCE: 音符 -->
  <g class="notes" data-emotion="dance">
    <text class="zzz-item delay-1" x="20" y="6" font-family="monospace" font-size="3" font-weight="900" fill="#a78bfa">♪</text>
    <text class="zzz-item delay-3" x="22" y="9" font-family="monospace" font-size="2.5" font-weight="900" fill="#f472b6">♫</text>
    <text class="zzz-item delay-2" x="0" y="7" font-family="monospace" font-size="3" font-weight="900" fill="#a78bfa">♪</text>
    <text class="zzz-item delay-1" x="0" y="5" font-family="monospace" font-size="2.5" font-weight="900" fill="#f472b6">♫</text>
    <text class="zzz-item delay-3" x="20" y="6" font-family="monospace" font-size="3" font-weight="900" fill="#a78bfa">♪</text>
    <text class="zzz-item delay-2" x="22" y="9" font-family="monospace" font-size="2.5" font-weight="900" fill="#f472b6">♫</text>
    <text class="zzz-item delay-1" x="20" y="6" font-family="monospace" font-size="3" font-weight="900" fill="#a78bfa">♪</text>
    <text class="zzz-item delay-3" x="22" y="9" font-family="monospace" font-size="2.5" font-weight="900" fill="#f472b6">♫</text>
    <text class="zzz-item delay-2" x="20" y="6" font-family="monospace" font-size="3" font-weight="900" fill="#a78bfa">♪</text>
    <text class="zzz-item delay-3" x="22" y="9" font-family="monospace" font-size="2.5" font-weight="900" fill="#f472b6">♫</text>
  </g>

  <!-- YAWN: 小音符 -->
  <g class="notes" data-emotion="yawn">
    <text class="zzz-item delay-2" x="20" y="7" font-family="monospace" font-size="2.5" font-weight="900" fill="#facc15">♫</text>
    <text class="zzz-item delay-1" x="0" y="8" font-family="monospace" font-size="2.5" font-weight="900" fill="#facc15">♫</text>
    <text class="zzz-item delay-3" x="2" y="9" font-family="monospace" font-size="2.5" font-weight="900" fill="#facc15">♫</text>
    <text class="zzz-item delay-2" x="20" y="7" font-family="monospace" font-size="2.5" font-weight="900" fill="#facc15">♫</text>
    <text class="zzz-item delay-1" x="0" y="8" font-family="monospace" font-size="2.5" font-weight="900" fill="#facc15">♫</text>
  </g>
</g>`;
}

// ========== 生成最终 HTML ==========
const bodies = genBodies();
const faces = genFaces();
const acc = genAcc();

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>牛马动物城 · 表情矩阵 v2</title>
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
  .app { position: relative; z-index: 1; max-width: 1480px; margin: 0 auto; padding: 32px 28px 64px; }

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

  /* 控台区 */
  .console { display: grid; grid-template-columns: 1fr 380px; gap: 20px; margin-bottom: 32px; }
  .preview { position: relative;
    background: linear-gradient(180deg, var(--bg-1) 0%, var(--bg-2) 100%);
    border: 1px solid var(--line-strong); border-radius: 16px; padding: 28px;
    min-height: 380px; display: grid; grid-template-rows: 1fr auto; overflow: hidden; }
  .preview::before { content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at 50% 60%, var(--ring-glow, rgba(56, 189, 248, 0.18)) 0%, transparent 60%);
    pointer-events: none; }
  .preview-stage { display: grid; place-items: center; position: relative; z-index: 1; }
  .stage-card { width: 220px; height: 220px; border-radius: 24px;
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
  .pixel-animal { width: 140px; height: 140px; display: block; image-rendering: pixelated; }
  .preview-info { margin-top: 18px; display: flex; justify-content: space-between;
    align-items: end; gap: 16px; position: relative; z-index: 1; }
  .preview-info .name { font-size: 22px; font-weight: 700; letter-spacing: 1px; }
  .preview-info .mood { font-size: 12px; color: var(--text-1); margin-top: 4px; letter-spacing: 1px; }
  .preview-info .mood em { color: var(--ring-color, var(--primary)); font-style: normal; font-weight: 600; }
  .preview-bars { flex: 1; max-width: 280px; }
  .bar { margin-bottom: 8px; font-size: 10px; color: var(--text-1); letter-spacing: 1px; }
  .bar .row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
  .bar .track { height: 6px; background: rgba(148, 163, 184, 0.1); border-radius: 3px; overflow: hidden; position: relative; }
  .bar .fill { position: absolute; inset: 0; width: var(--w, 80%);
    background: linear-gradient(90deg, var(--bar-color, var(--primary)) 0%, transparent 100%);
    border-radius: 3px; box-shadow: 0 0 6px var(--bar-color, var(--primary));
    transition: width 0.4s, background 0.3s; }

  /* 控制面板 */
  .panel { background: var(--bg-1); border: 1px solid var(--line-strong); border-radius: 16px; padding: 18px; }
  .panel h3 { font-size: 12px; font-weight: 700; letter-spacing: 2px; color: var(--text-1);
    margin: 0 0 12px; text-transform: uppercase; }
  .panel + .panel { margin-top: 14px; }
  .option-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .opt { background: var(--bg-2); border: 1px solid var(--line); border-radius: 8px;
    padding: 10px 6px; text-align: center; cursor: pointer; font-size: 12px;
    color: var(--text-0); transition: all 0.15s; user-select: none; }
  .opt:hover { border-color: var(--line-strong); background: var(--bg-3); }
  .opt.active { background: var(--bg-3); border-color: var(--primary); color: var(--primary); box-shadow: var(--glow); }
  .opt .ico { font-size: 20px; display: block; margin-bottom: 4px; }

  .swatch-row { display: flex; gap: 8px; }
  .swatch { flex: 1; background: var(--bg-2); border: 1px solid var(--line);
    border-radius: 8px; padding: 8px; cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; gap: 8px; }
  .swatch:hover { background: var(--bg-3); }
  .swatch.active { border-color: var(--primary); background: var(--bg-3); }
  .swatch .dot { width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.1); }
  .swatch .label { font-size: 11px; color: var(--text-0); letter-spacing: 1px; }

  .btn-row { display: flex; gap: 8px; }
  .btn { flex: 1; background: var(--bg-2); border: 1px solid var(--line-strong);
    border-radius: 8px; padding: 10px; font-family: inherit; color: var(--text-0);
    font-size: 12px; cursor: pointer; transition: all 0.15s; letter-spacing: 1px; }
  .btn:hover { background: var(--bg-3); border-color: var(--primary); color: var(--primary); }
  .btn.primary { background: linear-gradient(135deg, #38bdf8, #818cf8); color: #0a0e1a;
    border: none; font-weight: 700; }
  .btn.primary:hover { filter: brightness(1.1); color: #0a0e1a; }

  /* 矩阵 */
  .matrix-tabs { display: flex; gap: 6px; }
  .matrix-tab { padding: 4px 12px; background: var(--bg-1); border: 1px solid var(--line);
    border-radius: 6px; font-size: 11px; color: var(--text-1); cursor: pointer; letter-spacing: 1px; }
  .matrix-tab.active { border-color: var(--primary); color: var(--primary); }
  .matrix-wrap { margin-bottom: 36px; }
  .section-title { display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--line); }
  .section-title h2 { font-size: 14px; letter-spacing: 2px; margin: 0; color: var(--text-0); }
  .section-title small { font-size: 11px; color: var(--text-2); letter-spacing: 1px; }
  .matrix { display: grid; grid-template-columns: 110px repeat(10, 1fr); gap: 6px; }
  .matrix .head, .matrix .row-head { background: var(--bg-1); border: 1px solid var(--line);
    border-radius: 6px; padding: 8px 4px; text-align: center; font-size: 11px;
    color: var(--text-1); letter-spacing: 1px; display: grid; place-items: center; min-height: 40px; }
  .matrix .row-head { color: var(--text-0); font-weight: 700; font-size: 12px;
    display: flex; flex-direction: row; gap: 6px; }
  .matrix .row-head .row-color-dot { width: 10px; height: 10px; border-radius: 50%; }
  .matrix .cell { background: var(--bg-1); border: 1px solid var(--line); border-radius: 8px;
    aspect-ratio: 1; display: grid; place-items: center; position: relative; overflow: hidden;
    transition: all 0.2s; }
  .matrix .cell::before { content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at center, var(--cell-glow, transparent) 0%, transparent 70%);
    opacity: 0.5; pointer-events: none; }
  .matrix .cell:hover { border-color: var(--cell-color, var(--primary)); transform: translateY(-2px); }
  .matrix .cell .mini { width: 60%; height: 60%; }

  /* SVG 切换 */
  .pixel-animal .body, .pixel-animal .face { display: none; }
  .pixel-animal .body.show, .pixel-animal .face.show { display: inline; }
  .pixel-animal .acc > * { display: none; }
  .pixel-animal .acc > .on { display: inline; }
  .pixel-animal .face > g { display: none; }
  .pixel-animal .face.show > g[data-for-animal="__ACTIVE__"] { display: inline; }

  /* 动画 */
  @keyframes breathe { 0%, 100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(-1.5px) scaleY(1.02); } }
  @keyframes zzz { 0% { transform: translate(0,0) scale(0.6); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(8px, -12px) scale(1.2); opacity: 0; } }
  @keyframes fire { 0%, 100% { transform: scale(1) translateY(0); opacity: 0.95; } 50% { transform: scale(1.15, 1.25) translateY(-1px); opacity: 1; } }
  @keyframes halo-pulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
  @keyframes dance { 0%, 100% { transform: rotate(-3deg) translateY(0); } 50% { transform: rotate(3deg) translateY(0); } }

  .pixel-animal > .body.show { animation: breathe 2.4s ease-in-out infinite; transform-origin: 50% 100%; }
  .acc .fire { transform-origin: 50% 100%; animation: fire 0.6s ease-in-out infinite; }
  .acc .halo-elem { transform-origin: 50% 50%; animation: halo-pulse 2s ease-in-out infinite; }
  .acc .zzz-item { transform-origin: 50% 50%; animation: zzz 1.6s ease-in infinite; }
  .delay-1 { animation-delay: 0.2s !important; }
  .delay-2 { animation-delay: 0.4s !important; }
  .delay-3 { animation-delay: 0.6s !important; }
  .delay-4 { animation-delay: 0.8s !important; }
  .delay-5 { animation-delay: 1.0s !important; }

  /* 矩阵里简化（不重复呼吸/动画） */
  .matrix .mini > .body.show { animation: none; }
  .matrix .mini .fire, .matrix .mini .halo-elem, .matrix .mini .coffee, .matrix .mini .zzz-item { animation: none; opacity: 1; transform: none; }

  footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--line);
    text-align: center; color: var(--text-2); font-size: 11px; letter-spacing: 1px; }
  footer kbd { background: var(--bg-2); border: 1px solid var(--line-strong);
    border-radius: 4px; padding: 1px 6px; margin: 0 2px; color: var(--text-0); font-size: 10px; }
</style>
</head>
<body>
<div class="app">
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark">牛</div>
      <div class="brand-text">
        <h1>牛马动物城 · 表情矩阵 v2</h1>
        <small>PIXEL ANIMAL FACTORY · 12 SPECIES · 24 COLORWAYS · 10 EMOTIONS</small>
      </div>
    </div>
    <div class="topbar-stats">
      <span class="pill">动物 <span class="v" id="stat-animal">12</span></span>
      <span class="pill">配色 <span class="v" id="stat-color">24</span></span>
      <span class="pill">表情 <span class="v" id="stat-emotion">10</span></span>
      <span class="pill">组合 <span class="v" id="stat-combo">0</span></span>
    </div>
  </header>

  <section class="console">
    <div class="preview" id="preview">
      <div class="preview-stage">
        <div class="stage-card" id="stage-card">
          <span class="badge" id="stage-badge">打工人 · 上班中</span>
          <svg class="pixel-animal" viewBox="0 0 24 24" id="hero-svg" shape-rendering="crispEdges">
            ${bodies}
            ${faces}
            ${acc}
          </svg>
          <span class="tag" id="stage-tag">NORMAL</span>
        </div>
      </div>

      <div class="preview-info">
        <div>
          <div class="name" id="hero-name">牛 · 打工人</div>
          <div class="mood">当前状态 · <em id="hero-mood">正常上班中</em></div>
        </div>
        <div class="preview-bars">
          <div class="bar">
            <div class="row"><span>牛马剩余电量</span><span id="bar-pct">78%</span></div>
            <div class="track"><div class="fill" id="bar-1" style="--w: 78%; --bar-color: var(--primary);"></div></div>
          </div>
          <div class="bar">
            <div class="row"><span>脑门发热度</span><span id="bar2-pct">42%</span></div>
            <div class="track"><div class="fill" id="bar-2" style="--w: 42%; --bar-color: var(--secondary);"></div></div>
          </div>
        </div>
      </div>
    </div>

    <div>
      <div class="panel">
        <h3>选择动物</h3>
        <div class="option-grid" id="animal-picker"></div>
      </div>
      <div class="panel">
        <h3>选择配色</h3>
        <div class="swatch-row" id="color-picker"></div>
      </div>
      <div class="panel">
        <h3>选择表情</h3>
        <div class="option-grid" id="emotion-picker"></div>
      </div>
      <div class="panel">
        <h3>操作</h3>
        <div class="btn-row">
          <button class="btn" id="btn-random">随机一只</button>
          <button class="btn primary" id="btn-matrix">查看矩阵</button>
        </div>
      </div>
    </div>
  </section>

  <section class="matrix-wrap">
    <div class="section-title">
      <h2>全动物 × 表情矩阵</h2>
      <div style="display:flex;align-items:center;gap:16px">
        <small id="matrix-count">12 动物 × 10 表情</small>
        <div class="matrix-tabs">
          <span class="matrix-tab active" data-tab="all">全部 12</span>
          <span class="matrix-tab" data-tab="classic">经典 6</span>
          <span class="matrix-tab" data-tab="new">新增 6</span>
        </div>
      </div>
    </div>
    <div class="matrix" id="matrix"></div>
  </section>

  <footer>
    单文件演示 · 纯 SVG 像素 + CSS 动画 · 按 <kbd>R</kbd> 随机 · 按 <kbd>空格</kbd> 切换表情 · 按 <kbd>C</kbd> 切配色
  </footer>
</div>

<script>
  // ========== 数据 ==========
  const ANIMALS = ${JSON.stringify(ANIMALS.map(a => ({ id: a.id, name: a.name, emo: a.emo, emoji: a.emoji, colors: a.colors, main: a.main, ring: a.ring })))};
  const EMOTIONS = ${JSON.stringify(EMOTIONS.map(e => ({ id: e.id, name: e.name, mood: e.mood, tag: e.tag, color: e.color, icon: e.icon })))};
  const CLASSIC_6 = ['cow','horse','sheep','cat','dog','chicken'];
  const NEW_6 = ['panda','fox','rabbit','hamster','tiger','duck'];

  const state = { animal: 'cow', color: 'classic', emotion: 'normal', matrixTab: 'all' };

  function currentAnimal() { return ANIMALS.find(x => x.id === state.animal); }
  function currentColor() {
    const a = currentAnimal();
    return a.colors.find(c => c.id === state.color) || a.colors[0];
  }
  function currentEmotion() { return EMOTIONS.find(x => x.id === state.emotion); }

  // ========== 工具：克隆 + 切换 ==========
  function applySVG(svg, animal, color, emotion) {
    svg.querySelectorAll('.body, .face').forEach(el => el.classList.remove('show'));
    svg.querySelectorAll('.acc > *').forEach(el => { el.classList.remove('on'); });
    // 启用目标 body
    svg.querySelectorAll('.body[data-animal="' + animal + '"][data-color="' + color + '"]').forEach(el => el.classList.add('show'));
    // 启用目标 face，并把当前 animal 标记为激活
    svg.querySelectorAll('.face[data-emotion="' + emotion + '"]').forEach(face => {
      face.classList.add('show');
      // 重写 face 内：只显示匹配当前 animal 的子 g
      face.querySelectorAll('g').forEach(g => g.removeAttribute('data-active'));
      const targetG = face.querySelector('g[data-for-animal="' + animal + '"]');
      if (targetG) targetG.setAttribute('data-active', '1');
    });
    // 启用目标 acc
    svg.querySelectorAll('.acc > [data-emotion="' + emotion + '"]').forEach(el => el.classList.add('on'));
  }

  // CSS：根据 data-active 控制子 g 显隐
  (function(){
    const style = document.createElement('style');
    style.textContent = '.pixel-animal .face > g { display: none; } .pixel-animal .face.show > g[data-active="1"] { display: inline; }';
    document.head.appendChild(style);
  })();

  function buildMiniSVG(animal, color, emotion) {
    const tpl = document.getElementById('hero-svg');
    const clone = tpl.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.add('mini');
    applySVG(clone, animal, color, emotion);
    return clone;
  }

  // ========== 渲染大预览 ==========
  function renderHero() {
    const a = currentAnimal();
    const c = currentColor();
    const e = currentEmotion();
    applySVG(document.getElementById('hero-svg'), a.id, c.id, e.id);

    const card = document.getElementById('stage-card');
    card.style.setProperty('--ring-color', a.main);
    card.style.setProperty('--ring-glow', a.ring);
    const preview = document.getElementById('preview');
    preview.style.setProperty('--ring-color', a.main);
    preview.style.setProperty('--ring-glow', a.ring);

    document.getElementById('hero-name').textContent = a.name;
    document.getElementById('hero-name').style.color = a.main;
    document.getElementById('hero-mood').textContent = e.mood;
    document.getElementById('hero-mood').style.color = a.main;
    document.getElementById('stage-badge').textContent = a.emo + ' · ' + c.name + ' · ' + e.name;
    document.getElementById('stage-badge').style.borderColor = a.main;
    document.getElementById('stage-badge').style.color = a.main;
    document.getElementById('stage-tag').textContent = e.tag;
    document.getElementById('stage-tag').style.borderColor = a.main;
    document.getElementById('stage-tag').style.color = a.main;

    const stats = {
      normal: [78, 32], sleep: [44, 12], yawn: [62, 48],
      angry: [55, 95], cool: [70, 22], halo: [88, 16],
      debug: [66, 78], coffee: [82, 38], dance: [73, 28], nap: [38, 8],
    };
    const b1 = stats[state.emotion][0], b2 = stats[state.emotion][1];
    const bar1 = document.getElementById('bar-1'), bar2 = document.getElementById('bar-2');
    bar1.style.setProperty('--w', b1 + '%');
    bar1.style.setProperty('--bar-color', e.color);
    bar2.style.setProperty('--w', b2 + '%');
    bar2.style.setProperty('--bar-color', a.main);
    document.getElementById('bar-pct').textContent = b1 + '%';
    document.getElementById('bar2-pct').textContent = b2 + '%';

    syncPicker();
  }

  // ========== 渲染 picker ==========
  function renderPickers() {
    const ap = document.getElementById('animal-picker');
    ap.innerHTML = '';
    ANIMALS.forEach(a => {
      const el = document.createElement('div');
      el.className = 'opt';
      el.dataset.animal = a.id;
      el.innerHTML = '<span class="ico">' + a.emoji + '</span>' + a.name.split(' · ')[0];
      el.addEventListener('click', () => {
        state.animal = a.id;
        const ca = currentAnimal();
        state.color = ca.colors[0].id;
        renderHero();
        renderColorPicker();
      });
      ap.appendChild(el);
    });

    const ep = document.getElementById('emotion-picker');
    ep.innerHTML = '';
    EMOTIONS.forEach(e => {
      const el = document.createElement('div');
      el.className = 'opt';
      el.dataset.emotion = e.id;
      el.innerHTML = '<span class="ico">' + e.icon + '</span>' + e.name;
      el.addEventListener('click', () => {
        state.emotion = e.id;
        renderHero();
      });
      ep.appendChild(el);
    });
  }

  function renderColorPicker() {
    const cp = document.getElementById('color-picker');
    cp.innerHTML = '';
    const a = currentAnimal();
    a.colors.forEach(c => {
      const el = document.createElement('div');
      el.className = 'swatch';
      el.dataset.color = c.id;
      el.innerHTML = '<div class="dot" style="background:' + c.swatch + '"></div><div class="label">' + c.name + '</div>';
      if (c.id === state.color) el.classList.add('active');
      el.addEventListener('click', () => {
        state.color = c.id;
        renderHero();
        renderColorPicker();
      });
      cp.appendChild(el);
    });
  }

  function syncPicker() {
    document.querySelectorAll('#animal-picker .opt').forEach(el => {
      el.classList.toggle('active', el.dataset.animal === state.animal);
    });
    document.querySelectorAll('#emotion-picker .opt').forEach(el => {
      el.classList.toggle('active', el.dataset.emotion === state.emotion);
    });
    document.querySelectorAll('#color-picker .swatch').forEach(el => {
      el.classList.toggle('active', el.dataset.color === state.color);
    });
  }

  // ========== 渲染矩阵 ==========
  function visibleAnimals() {
    if (state.matrixTab === 'classic') return ANIMALS.filter(a => CLASSIC_6.includes(a.id));
    if (state.matrixTab === 'new') return ANIMALS.filter(a => NEW_6.includes(a.id));
    return ANIMALS;
  }

  function renderMatrix() {
    const m = document.getElementById('matrix');
    m.innerHTML = '';
    const list = visibleAnimals();
    m.appendChild(headerCell(''));
    EMOTIONS.forEach(e => m.appendChild(headerCell(e.name)));
    list.forEach(a => {
      m.appendChild(rowHead(a, a.colors[0]));
      EMOTIONS.forEach(e => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.setProperty('--cell-color', a.main);
        cell.style.setProperty('--cell-glow', a.ring);
        cell.title = a.name + ' · ' + a.colors[0].name + ' · ' + e.name;
        cell.appendChild(buildMiniSVG(a.id, a.colors[0].id, e.id));
        cell.addEventListener('click', () => {
          state.animal = a.id;
          state.color = a.colors[0].id;
          state.emotion = e.id;
          renderHero();
          renderColorPicker();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        m.appendChild(cell);
      });
    });
    document.getElementById('matrix-count').textContent = list.length + ' 动物 × 10 表情';
  }

  function headerCell(text) {
    const el = document.createElement('div');
    el.className = 'head';
    el.textContent = text;
    return el;
  }
  function rowHead(a, c) {
    const el = document.createElement('div');
    el.className = 'row-head';
    el.innerHTML = '<span class="row-color-dot" style="background:' + c.swatch + '"></span>' + a.emoji + ' ' + a.name.split(' · ')[0];
    return el;
  }

  // ========== 按钮 ==========
  document.getElementById('btn-random').addEventListener('click', () => {
    state.animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)].id;
    const ca = currentAnimal();
    state.color = ca.colors[Math.floor(Math.random() * ca.colors.length)].id;
    state.emotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)].id;
    renderHero();
    renderColorPicker();
  });

  document.getElementById('btn-matrix').addEventListener('click', () => {
    document.querySelector('.matrix-wrap').scrollIntoView({ behavior: 'smooth' });
  });

  // 矩阵 tab
  document.querySelectorAll('.matrix-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.matrix-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.matrixTab = tab.dataset.tab;
      renderMatrix();
    });
  });

  // 快捷键
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') {
      e.preventDefault();
      const i = EMOTIONS.findIndex(x => x.id === state.emotion);
      state.emotion = EMOTIONS[(i + 1) % EMOTIONS.length].id;
      renderHero();
    } else if (e.key === 'r' || e.key === 'R') {
      state.animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)].id;
      const ca = currentAnimal();
      state.color = ca.colors[Math.floor(Math.random() * ca.colors.length)].id;
      state.emotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)].id;
      renderHero();
      renderColorPicker();
    } else if (e.key === 'c' || e.key === 'C') {
      const ca = currentAnimal();
      const i = ca.colors.findIndex(x => x.id === state.color);
      state.color = ca.colors[(i + 1) % ca.colors.length].id;
      renderHero();
      renderColorPicker();
    }
  });

  // ========== 启动 ==========
  renderPickers();
  renderColorPicker();
  renderHero();
  renderMatrix();
  document.getElementById('stat-combo').textContent = (ANIMALS.length * ANIMALS.reduce((s, a) => s + a.colors.length, 0) * EMOTIONS.length);
</script>
</body>
</html>
`;

fs.writeFileSync(outPath, html, 'utf-8');
console.log('Generated:', outPath);
console.log('Size:', (html.length / 1024).toFixed(1) + ' KB');
console.log('Animals:', ANIMALS.length, '/ Colorways:', ANIMALS.reduce((s, a) => s + a.colors.length, 0), '/ Emotions:', EMOTIONS.length);
console.log('Combinations:', ANIMALS.length * ANIMALS.reduce((s, a) => s + a.colors.length, 0) * EMOTIONS.length);
