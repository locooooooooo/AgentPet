/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AIAgent, AgentTask } from '../types.js';
import DynamicIcon from './DynamicIcon.js';
import { motion, AnimatePresence } from 'motion/react';

interface AIAgentsControlProps {
  agents: AIAgent[];
  onRefreshConfig: () => void;
  addSystemLog: (title: string, content: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

// 14 different interactive states for NiuMa (cattle and horses) workforce simulation
type NiuMaStatus =
  | 'idle'
  | 'coding'
  | 'debugging'
  | 'meeting'
  | 'coffee'
  | 'testing'
  | 'deploying'
  | 'done'
  | 'overtime'
  | 'drinkingWater'
  | 'panicking'
  | 'slacking'
  | 'praying'
  | 'demanding';

interface StateMeta {
  name: string;
  expression: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
  quotes: string[];
}

const STATE_METAS: Record<NiuMaStatus, StateMeta> = {
  idle: {
    name: '熟睡躺平',
    expression: '(•_•) 💤',
    emoji: '😴',
    color: 'text-zinc-400',
    bg: 'bg-zinc-950/40',
    border: 'border-zinc-800',
    quotes: [
      '呼噜呼噜... 只要老板看不见，我就是离线状态...',
      '别点我... 已经躺平，进入低功耗待机模式...',
      '系统空闲中，灵魂已下班，肉体在打盹。',
      '摸鱼不算偷，这叫技术沉淀与能耗控制。'
    ]
  },
  coding: {
    name: '疯狂码砖',
    expression: '(╬☉д⊙) ⌨️🔥',
    emoji: '💻',
    color: 'text-blue-400',
    bg: 'bg-blue-950/20',
    border: 'border-blue-500/20',
    quotes: [
      '键盘冒烟了！正在手写一万行完美（包含大量 Bug）的代码！',
      '看我的无敌指法：Ctrl+C, Ctrl+V, 完美编译！',
      '别打断我，正在用高深的业务逻辑重塑人类数字文明！',
      '一行代码两个坑，留给后人去修坑，妙哉。'
    ]
  },
  debugging: {
    name: '揪发排障',
    expression: '(⊙_◎) 🔍',
    emoji: '🐛',
    color: 'text-yellow-400',
    bg: 'bg-yellow-950/20',
    border: 'border-yellow-500/20',
    quotes: [
      '这 Bug 真诡异，昨晚下班前明明跑得好好的啊！',
      '一行代码，十个报错，我真的要头秃成地中海了...',
      '究竟是哪位前贤写的这段逻辑？哦，原来是我自己两个月前写的。',
      '只要我不去查报错，报错就是不存在的，量子物理真好。'
    ]
  },
  meeting: {
    name: '废话周会',
    expression: '(￣﹃￣) 💬',
    emoji: '🗣️',
    color: 'text-indigo-400',
    bg: 'bg-indigo-950/20',
    border: 'border-indigo-500/20',
    quotes: [
      'PM又在讲“打通底层逻辑、闭环业务生态、拉齐赛道”了，救命...',
      '开会一小时，拉齐三分钟，唯有放空自我...',
      '懂了懂了，这就去把功能做成全宇宙最复杂的，方便汇报。',
      '只要我不说话，就没有人知道我已经睡着了。'
    ]
  },
  coffee: {
    name: '咖啡续命',
    expression: '(๑´ڡ`๑) ☕',
    emoji: '☕',
    color: 'text-amber-400',
    bg: 'bg-amber-950/20',
    border: 'border-amber-500/20',
    quotes: [
      '纯正黑咖啡咖啡因注入！生命值快速 +50%！',
      '血管里流淌的不是血，是浓缩美式和零度可乐。',
      '咖啡续命成功，我觉得我还能再重构三个微服务！',
      '唯有冰美式能抚平牛马深夜狂躁的内心。'
    ]
  },
  testing: {
    name: '压测跑路',
    expression: '(；′⌒`) 💣',
    emoji: '💣',
    color: 'text-red-400',
    bg: 'bg-red-950/20',
    border: 'border-red-500/20',
    quotes: [
      '正在对本地端口进行百万级并发撞击，保佑端口别炸...',
      '压测并发已经 10,000 了！服务器风扇已经开始起飞了！',
      '报告老板，单元测试通过率 99.9%（剩下的 0.1% 我强行跳过了）。',
      '测试一过，天下我有！上线后爆不爆炸全凭天意。'
    ]
  },
  deploying: {
    name: '佛系发布',
    expression: '(ﾟ∀ﾟ) 🚀',
    emoji: '🚀',
    color: 'text-purple-400',
    bg: 'bg-purple-950/20',
    border: 'border-purple-500/20',
    quotes: [
      '正在部署生产环境... 烧香拜佛，千万不要弹出回滚警告！',
      '一键发布！服务器保佑，佛祖保佑，菩萨保佑，网线保佑！',
      '正在向生产环境注入全新的 BUG... 呃不，全新的智能特性。',
      '发布成功！现在是偷偷溜下班的最佳黄金窗口期！'
    ]
  },
  done: {
    name: '按时下班',
    expression: '＼(★^∀^★)／',
    emoji: '🕺',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/20',
    border: 'border-emerald-500/20',
    quotes: [
      '按时下班！溜了溜了，再见吧各位牛马同僚，有事漂信留言！',
      '今晚没有加班！我要回去拥抱我可爱的游戏机和床铺！',
      '下班钟声响起，跑得比光速还快，谁也追不上我！',
      '准点下班是本牛马对这个冰冷大厂最后的底线。'
    ]
  },
  overtime: {
    name: '修仙加班',
    expression: '(x_x) ☠️',
    emoji: '☠️',
    color: 'text-orange-500',
    bg: 'bg-orange-950/20',
    border: 'border-orange-500/20',
    quotes: [
      '凌晨两点，我眼里闪烁着智慧与修仙的微弱寒光...',
      '只要加班费给到位，牛马干到宿主 CPU 彻底融毁！',
      '身体已成枯骨，但我的代码依旧在高速流转！',
      '今晚不把这个死锁解开，我就跟这个服务器同归于尽！'
    ]
  },
  drinkingWater: {
    name: '打水摸鱼',
    expression: '(͡° ͜ʖ ͡°) 🍵',
    emoji: '🍵',
    color: 'text-cyan-400',
    bg: 'bg-cyan-950/20',
    border: 'border-cyan-500/20',
    quotes: [
      '摸鱼时间到！每天多去几次茶水间打水，挣回一元自来水钱！',
      '牛马生存法则第一条：频繁起立、假装打水、四处观望。',
      '水，是生命之源，摸鱼更是支撑牛马不垮的根基。',
      '在茶水间听说产品经理又要加需求，吓得我多喝了两杯热开水。'
    ]
  },
  panicking: {
    name: '生产救火',
    expression: '(ノ°Д°)ノ 🚨',
    emoji: '🚨',
    color: 'text-rose-500',
    bg: 'bg-rose-950/20',
    border: 'border-rose-500/20',
    quotes: [
      '生产环境炸了崩了！！！！！快！谁十分钟前合并的分支？！',
      '救火救火！告警短信把我的手机震得像电动按摩仪！',
      '回滚！赶紧给我一键回滚！假装刚刚什么故障都没发生过！',
      '系统吞吐量跌零了！PM已经拿着皮鞭在走廊快马赶来了！'
    ]
  },
  slacking: {
    name: '带薪拉屎',
    expression: '(¬_¬) 📱',
    emoji: '📱',
    color: 'text-teal-400',
    bg: 'bg-teal-950/20',
    border: 'border-teal-500/20',
    quotes: [
      '带薪拉屎是牛马对资本家、对大厂最优雅、最无声的抵抗。',
      '刷一会儿牛马论坛八卦，假装自己一直在等待打包编译结果...',
      '蹲在厕所隔间里，深刻钻研着 6G 网络以及股市大盘行情...',
      '腿蹲麻了，但是感觉多赚了二十块钱，舒服了。'
    ]
  },
  praying: {
    name: '佛祖保佑',
    expression: '( ᵒ人ᵒ) 🛐',
    emoji: '🛐',
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-950/20',
    border: 'border-fuchsia-500/20',
    quotes: [
      '保佑编译一次过，保佑没有代码冲突，阿弥陀佛...',
      '天灵灵地灵灵，主分支千万别爆红，求求了！',
      '向服务器神龛献祭我的秀发，换取一整天绿色的 Pipeline 成功状态！',
      '代码已经写好，剩下的事情由佛祖和上帝全权负责接管。'
    ]
  },
  demanding: {
    name: '怒怼需求',
    expression: '(＃｀д´) 凸',
    emoji: '💢',
    color: 'text-red-500',
    bg: 'bg-red-950/20',
    border: 'border-red-500/20',
    quotes: [
      '“这个需求真的很简单，怎么就做不出来？” 这说的是人话吗？！',
      '产品经理，你过来！告诉我你要的“根据手机壳颜色自动变色”怎么搞？！',
      '再改需求，我就要把这把十斤重的红轴铝坨坨机械键盘砸在你的头上！',
      '需求文档上写得像一朵花，实现起来全是豆腐渣，改改改！'
    ]
  }
};

interface AgentLogoProps {
  agentId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const AgentLogo: React.FC<AgentLogoProps> = ({ agentId, size = 'md' }) => {
  const sizeClasses = {
    xs: 'w-4 h-4 text-[7px]',
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-14 h-14 text-xs',
    lg: 'w-20 h-20 text-sm'
  };

  switch (agentId) {
    case 'codex':
      return (
        <div className={`relative flex items-center justify-center rounded-xl overflow-hidden shadow-md select-none bg-gradient-to-br from-[#2F80ED] to-[#00D2FF] ${sizeClasses[size]}`}>
          <div className="absolute inset-0 m-[18%] bg-white rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 100 100" fill="none" className="w-[80%] h-[80%]">
              <defs>
                <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#5B86E5" />
                  <stop offset="100%" stopColor="#36D1DC" />
                </linearGradient>
              </defs>
              <path d="M25,55 C25,40 32,30 46,30 C50,30 54,32 57,35 C61,28 70,28 76,33 C82,38 83,46 80,51 C84,54 86,60 83,66 C80,72 74,75 68,73 C65,78 58,81 50,79 C41,77 36,70 37,62 C31,62 25,58 25,55 Z" fill="url(#cloudGrad)" />
              <path d="M38,50 L46,55 L38,60" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="49" y1="60" x2="59" y2="60" stroke="white" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      );
    case 'trae':
      return (
        <div className={`relative flex items-center justify-center rounded-xl overflow-hidden shadow-md select-none bg-black border border-zinc-800 ${sizeClasses[size]}`}>
          <svg viewBox="0 0 100 100" fill="none" className="w-[85%] h-[85%]">
            <rect x="15" y="25" width="70" height="50" rx="8" stroke="#00F294" strokeWidth="7" fill="transparent" />
            <path d="M36 50 L43 42 L50 50 L43 58 Z" fill="#00F294" />
            <path d="M50 50 L57 42 L64 50 L57 58 Z" fill="#00F294" />
          </svg>
        </div>
      );
    case 'qoder':
      return (
        <div className={`relative flex items-center justify-center rounded-xl overflow-hidden shadow-md select-none bg-black border border-zinc-900 ${sizeClasses[size]}`}>
          <svg viewBox="0 0 100 100" fill="none" className="w-[90%] h-[90%]">
            <path d="M22,65 C22,45 30,30 42,30 C54,30 57,45 57,65 C57,75 50,80 42,80 C30,80 22,75 22,65 Z" fill="#FFFFFF" />
            <path d="M22,65 C22,50 28,38 37,38 C40,38 43,48 43,65 C43,75 40,78 37,78 C28,78 22,75 22,65 Z" fill="#000000" />
            <path d="M44,30 C57,30 70,42 70,65 C70,82 60,85 47,85 C40,85 40,75 40,65 C40,45 40,30 44,30 Z" fill="#10B981" />
          </svg>
        </div>
      );
    case 'minimax':
      return (
        <div className={`relative flex items-center justify-center rounded-xl overflow-hidden shadow-md select-none bg-[#FF3300] ${sizeClasses[size]}`}>
          <div className="absolute inset-0">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-90">
              <polygon points="0,0 65,0 35,100 0,100" fill="#FF4D00" />
              <polygon points="45,0 100,0 100,65 65,100" fill="#E60000" />
              <polygon points="65,100 100,45 100,100" fill="#FF8000" />
              <polygon points="0,45 45,100 0,100" fill="#CC0000" />
            </svg>
          </div>
          <span className="relative z-10 font-bold text-white tracking-tight select-none pointer-events-none" style={{ fontSize: size === 'xs' ? '5px' : size === 'sm' ? '8px' : size === 'md' ? '12px' : '18px' }}>
            MiniMax
          </span>
        </div>
      );
    case 'workbuddy':
      return (
        <div className={`relative flex items-center justify-center rounded-xl overflow-hidden shadow-md select-none bg-gradient-to-br from-[#00E6FF] to-[#00A3FF] ${sizeClasses[size]}`}>
          <svg viewBox="0 0 100 100" fill="none" className="w-[90%] h-[90%] mt-[5%]">
            <g transform="translate(10, 10)">
              <rect x="10" y="30" width="60" height="60" rx="18" fill="white" />
              <path d="M12,35 L4,15 C2,11 8,9 12,12 L24,30 Z" fill="white" />
              <path d="M68,35 L76,15 C78,11 72,9 68,12 L56,30 Z" fill="white" />
              <rect x="23" y="46" width="9" height="18" rx="4.5" fill="#00B0FF" />
              <rect x="48" y="46" width="9" height="18" rx="4.5" fill="#00B0FF" />
            </g>
          </svg>
        </div>
      );
    case 'openclaw':
      return (
        <div className={`relative flex items-center justify-center rounded-xl overflow-hidden shadow-md select-none bg-gradient-to-b from-[#3D0A0A] to-[#0A0202] ${sizeClasses[size]}`}>
          <svg viewBox="0 0 100 100" fill="none" className="w-[90%] h-[90%]">
            <circle cx="20" cy="30" r="1.5" fill="white" opacity="0.6" />
            <circle cx="80" cy="25" r="2" fill="#FF8080" opacity="0.7" />
            <circle cx="15" cy="75" r="1.5" fill="white" opacity="0.4" />
            <circle cx="85" cy="70" r="1.2" fill="white" opacity="0.5" />
            
            <circle cx="25" cy="50" r="10" fill="#E63946" />
            <circle cx="75" cy="50" r="10" fill="#E63946" />
            <circle cx="50" cy="50" r="28" fill="#E63946" />
            
            <path d="M42,24 C40,16 46,14 46,14" stroke="#E63946" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M58,24 C60,16 54,14 54,14" stroke="#E63946" strokeWidth="4.5" strokeLinecap="round" />

            <rect x="42" y="74" width="6" height="8" rx="2" fill="#E63946" />
            <rect x="52" y="74" width="6" height="8" rx="2" fill="#E63946" />

            <circle cx="40" cy="46" r="4.5" fill="#00FFFF" />
            <circle cx="60" cy="46" r="4.5" fill="#00FFFF" />
          </svg>
        </div>
      );
    case 'openccode':
      return (
        <div className={`relative flex items-center justify-center rounded-xl overflow-hidden shadow-md select-none bg-[#121212] border border-zinc-800 ${sizeClasses[size]}`}>
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <rect x="10" y="32" width="80" height="36" fill="#222" rx="4" />
            <g transform="translate(13, 38) scale(0.95)">
              <rect x="0" y="4" width="8" height="12" fill="#AAA" rx="1.5" />
              <rect x="2" y="7" width="4" height="6" fill="#121212" />
              
              <rect x="10" y="4" width="8" height="16" fill="#FFF" rx="1.5" />
              <rect x="12" y="7" width="4" height="6" fill="#121212" />

              <rect x="20" y="4" width="8" height="12" fill="#AAA" rx="1.5" />
              <rect x="22" y="7" width="6" height="2" fill="#121212" />
              <rect x="22" y="11" width="6" height="2" fill="#121212" />

              <rect x="30" y="4" width="8" height="12" fill="#FFF" rx="1.5" />
              <rect x="32" y="7" width="4" height="9" fill="#121212" />

              <rect x="40" y="4" width="8" height="12" fill="#AAA" rx="1.5" />
              <rect x="42" y="7" width="6" height="6" fill="#121212" />

              <rect x="50" y="4" width="8" height="12" fill="#FFF" rx="1.5" />
              <rect x="52" y="7" width="4" height="6" fill="#121212" />

              <rect x="60" y="0" width="8" height="16" fill="#AAA" rx="1.5" />
              <rect x="62" y="7" width="4" height="6" fill="#121212" />

              <rect x="70" y="4" width="8" height="12" fill="#FFF" rx="1.5" />
              <rect x="72" y="7" width="6" height="2" fill="#121212" />
              <rect x="72" y="11" width="6" height="2" fill="#121212" />
            </g>
            <text x="50" y="80" fill="#777" fontSize="5.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle" letterSpacing="0.2">AI CODING AGENT</text>
          </svg>
        </div>
      );
    case 'hermes':
      return (
        <div className={`relative flex items-center justify-center rounded-xl overflow-hidden shadow-md select-none bg-[#F5F5F7] ${sizeClasses[size]}`}>
          <svg viewBox="0 0 100 100" fill="none" className="w-[95%] h-[95%]">
            <rect x="12" y="12" width="76" height="76" stroke="black" strokeWidth="3" fill="none" />
            <path d="M50 30 C42 30, 34 38, 34 48 C34 58, 40 65, 46 68 L46 80 L54 80 L54 68 C68 65, 74 54, 70 42 C66 32, 58 30, 50 30 Z" fill="black" />
            <path d="M38 48 C38 42, 43 38, 49 38 L54 38 L54 62 L49 62 C42 62, 38 56, 38 48 Z" fill="#F5F5F7" />
            <path d="M37 48 C38 44, 40 42, 43 42 C45 45, 44 48, 41 50 Z" fill="black" />
            <path d="M39 52 C40 50, 42 50, 43 53 C42 55, 41 55, 39 52 Z" fill="black" />
            <path d="M42 46 Q45 44 47 48" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M46 32 Q54 32 57 40" stroke="#F5F5F7" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <rect x="55" y="42" width="6" height="12" rx="3" fill="#F5F5F7" />
            <text x="50" y="85" fill="#FF7A00" fontSize="7" fontWeight="bold" fontFamily="system-ui, sans-serif" textAnchor="middle" letterSpacing="0.5">HERMES</text>
          </svg>
        </div>
      );
    default:
      return (
        <div className={`relative flex items-center justify-center rounded-xl overflow-hidden shadow-md select-none bg-zinc-800 ${sizeClasses[size]}`}>
          <span className="text-lg">🤖</span>
        </div>
      );
  }
};

interface NiuMaInfo {
  type: 'cow' | 'horse';
  animalEmoji: string;
  brandLogo: string;
  brandColor: string;
  badgeText: string;
  themeColor: string;
}

const getAgentNiuMaInfo = (agentId: string): NiuMaInfo => {
  switch (agentId) {
    case 'codex':
      return {
        type: 'cow',
        animalEmoji: '🐂',
        brandLogo: '💻',
        brandColor: 'bg-blue-500',
        badgeText: 'CodeX',
        themeColor: 'text-blue-400'
      };
    case 'trae':
      return {
        type: 'horse',
        animalEmoji: '🐎',
        brandLogo: '🔍',
        brandColor: 'bg-emerald-500',
        badgeText: 'Trae',
        themeColor: 'text-emerald-400'
      };
    case 'qoder':
      return {
        type: 'cow',
        animalEmoji: '🐂',
        brandLogo: '🛡️',
        brandColor: 'bg-purple-500',
        badgeText: 'Qoder',
        themeColor: 'text-purple-400'
      };
    case 'minimax':
      return {
        type: 'horse',
        animalEmoji: '🐎',
        brandLogo: '🎨',
        brandColor: 'bg-amber-500',
        badgeText: 'MiniMax',
        themeColor: 'text-amber-400'
      };
    case 'workbuddy':
      return {
        type: 'cow',
        animalEmoji: '🐂',
        brandLogo: '💼',
        brandColor: 'bg-sky-500',
        badgeText: 'Workbuddy',
        themeColor: 'text-sky-400'
      };
    case 'openclaw':
      return {
        type: 'horse',
        animalEmoji: '🐎',
        brandLogo: '🦞',
        brandColor: 'bg-rose-500',
        badgeText: 'OpenClaw',
        themeColor: 'text-rose-400'
      };
    case 'openccode':
      return {
        type: 'cow',
        animalEmoji: '🐂',
        brandLogo: '⚙️',
        brandColor: 'bg-violet-500',
        badgeText: 'OpenCCode',
        themeColor: 'text-violet-400'
      };
    case 'hermes':
      return {
        type: 'horse',
        animalEmoji: '🐎',
        brandLogo: '⚡',
        brandColor: 'bg-yellow-500',
        badgeText: 'Hermes',
        themeColor: 'text-yellow-400'
      };
    default:
      return {
        type: 'cow',
        animalEmoji: '🐂',
        brandLogo: '🤖',
        brandColor: 'bg-zinc-500',
        badgeText: 'Agent',
        themeColor: 'text-zinc-400'
      };
  }
};

const getAgentStyles = (agentId: string, isSelected?: boolean) => {
  switch (agentId) {
    case 'codex':
      return {
        bg: isSelected 
          ? 'bg-gradient-to-br from-[#2F80ED]/30 to-[#00D2FF]/15 border-[#2F80ED]/80 shadow-[0_0_15px_rgba(47,128,237,0.4)]' 
          : 'bg-gradient-to-br from-[#2F80ED]/10 to-[#00D2FF]/5 border-zinc-800/80 hover:border-[#2F80ED]/45',
        textShadow: 'drop-shadow-[0_2px_8px_rgba(47,128,237,0.5)]',
        badgeBg: 'bg-[#2F80ED] border-[#00D2FF]/50',
        glow: 'shadow-[0_0_15px_rgba(47,128,237,0.15)]'
      };
    case 'trae':
      return {
        bg: isSelected 
          ? 'bg-gradient-to-br from-black to-emerald-950/45 border-[#00F294]/80 shadow-[0_0_15px_rgba(0,242,148,0.4)]' 
          : 'bg-gradient-to-br from-black/60 to-emerald-950/10 border-zinc-800/80 hover:border-[#00F294]/45',
        textShadow: 'drop-shadow-[0_2px_8px_rgba(0,242,148,0.6)]',
        badgeBg: 'bg-black border-[#00F294]/50',
        glow: 'shadow-[0_0_15px_rgba(0,242,148,0.15)]'
      };
    case 'qoder':
      return {
        bg: isSelected 
          ? 'bg-gradient-to-br from-zinc-900 to-emerald-950/30 border-[#10B981]/80 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
          : 'bg-gradient-to-br from-zinc-900/60 to-emerald-950/5 border-zinc-800/80 hover:border-[#10B981]/45',
        textShadow: 'drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)]',
        badgeBg: 'bg-black border-[#10B981]/50',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]'
      };
    case 'minimax':
      return {
        bg: isSelected 
          ? 'bg-gradient-to-br from-[#FF3300]/25 to-[#FF8000]/15 border-[#FF4D00]/80 shadow-[0_0_15px_rgba(255,77,0,0.45)]' 
          : 'bg-gradient-to-br from-[#FF3300]/10 to-[#FF8000]/5 border-zinc-800/80 hover:border-[#FF4D00]/45',
        textShadow: 'drop-shadow-[0_2px_8px_rgba(255,77,0,0.6)]',
        badgeBg: 'bg-[#FF3300] border-[#FF8000]/50',
        glow: 'shadow-[0_0_15px_rgba(255,77,0,0.2)]'
      };
    case 'workbuddy':
      return {
        bg: isSelected 
          ? 'bg-gradient-to-br from-[#00E6FF]/25 to-[#00A3FF]/15 border-[#00E6FF]/80 shadow-[0_0_15px_rgba(0,230,255,0.45)]' 
          : 'bg-gradient-to-br from-[#00E6FF]/10 to-[#00A3FF]/5 border-zinc-800/80 hover:border-[#00E6FF]/45',
        textShadow: 'drop-shadow-[0_2px_8px_rgba(0,230,255,0.6)]',
        badgeBg: 'bg-[#00A3FF] border-[#00E6FF]/50',
        glow: 'shadow-[0_0_15px_rgba(0,230,255,0.2)]'
      };
    case 'openclaw':
      return {
        bg: isSelected 
          ? 'bg-gradient-to-br from-[#3D0A0A]/90 to-[#E63946]/20 border-[#E63946]/80 shadow-[0_0_15px_rgba(230,57,70,0.45)]' 
          : 'bg-gradient-to-br from-[#3D0A0A]/50 to-[#E63946]/5 border-zinc-800/80 hover:border-[#E63946]/45',
        textShadow: 'drop-shadow-[0_2px_8px_rgba(230,57,70,0.6)]',
        badgeBg: 'bg-[#3D0A0A] border-[#E63946]/50',
        glow: 'shadow-[0_0_15px_rgba(230,57,70,0.2)]'
      };
    case 'openccode':
      return {
        bg: isSelected 
          ? 'bg-gradient-to-br from-[#121212] to-zinc-900 border-zinc-500 shadow-[0_0_15px_rgba(255,255,255,0.25)]' 
          : 'bg-zinc-900 border-zinc-800/80 hover:border-zinc-700',
        textShadow: 'drop-shadow-[0_2px_8px_rgba(255,255,255,0.35)]',
        badgeBg: 'bg-[#121212] border-zinc-700',
        glow: 'shadow-[0_0_15px_rgba(255,255,255,0.05)]'
      };
    case 'hermes':
      return {
        bg: isSelected 
          ? 'bg-gradient-to-br from-zinc-800/90 to-orange-500/15 border-orange-500/80 shadow-[0_0_15px_rgba(255,122,0,0.4)]' 
          : 'bg-gradient-to-br from-zinc-900/60 to-orange-500/5 border-zinc-800/80 hover:border-orange-500/45',
        textShadow: 'drop-shadow-[0_2px_8px_rgba(255,122,0,0.5)]',
        badgeBg: 'bg-[#F5F5F7] border-orange-500/50',
        glow: 'shadow-[0_0_15px_rgba(255,122,0,0.15)]'
      };
    default:
      return {
        bg: isSelected ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-900 border-zinc-800',
        textShadow: '',
        badgeBg: 'bg-zinc-700 border-zinc-600',
        glow: ''
      };
  }
};

interface NiuMaAvatarProps {
  agentId: string;
  size?: 'sm' | 'md' | 'lg';
  isSelected?: boolean;
}

const NiuMaAvatar: React.FC<NiuMaAvatarProps> = ({ agentId, size = 'md', isSelected }) => {
  const info = getAgentNiuMaInfo(agentId);
  const styles = getAgentStyles(agentId, isSelected);

  const containerSizes = {
    sm: 'w-8 h-8 rounded-full border',
    md: 'w-14 h-14 rounded-xl border-2',
    lg: 'w-20 h-20 rounded-2xl border-2'
  };

  const emojiSizes = {
    sm: 'text-sm md:text-base',
    md: 'text-3xl',
    lg: 'text-5xl'
  };

  const badgeSizes = {
    sm: 'w-4 h-4 -bottom-1 -right-1 rounded-full',
    md: 'w-6 h-6 -bottom-1 -right-1 rounded-md p-0.5',
    lg: 'w-8 h-8 -bottom-1.5 -right-1.5 rounded-lg p-0.5'
  };

  const logoSize = {
    sm: 'xs' as const,
    md: 'xs' as const,
    lg: 'sm' as const
  };

  return (
    <div className={`relative flex items-center justify-center select-none transition-all duration-300 ${containerSizes[size]} ${styles.bg} ${styles.glow}`}>
      {/* Central Animal (Cow or Horse) */}
      <span className={`${emojiSizes[size]} filter saturate-125 transition-transform duration-300 hover:scale-110 active:scale-95 ${styles.textShadow}`}>
        {info.animalEmoji}
      </span>

      {/* Mini Brand Logo Badge in bottom-right */}
      <div className={`absolute flex items-center justify-center shadow-lg shadow-black/80 border border-[#222] overflow-hidden ${badgeSizes[size]} ${styles.badgeBg}`}>
        <AgentLogo agentId={agentId} size={logoSize[size]} />
      </div>
    </div>
  );
};

export default function AIAgentsControl({ agents, onRefreshConfig, addSystemLog }: AIAgentsControlProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('codex');
  const [taskName, setTaskName] = useState<string>('');
  const [command, setCommand] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tasks' | 'settings'>('tasks');
  const [viewingLogsTaskId, setViewingLogsTaskId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Local state for interactive NiuMa ranch physics
  const [niuMaStateMap, setNiuMaStateMap] = useState<Record<string, {
    energy: number; // 0 - 100
    stress: number; // 0 - 100
    temperature: number; // 36 - 180 (CPU Temp)
    customState: NiuMaStatus | null; // For manual states or interactive overrides
    bubbleText: string | null;
    bubbleTimer: number; // For bubble auto-fade
    isFueledByPie: boolean;
  }>>({});

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  // Helper for quick commands templates (Now fully supporting 8 agents!)
  const QUICK_COMMAND_TEMPLATES: Record<string, { name: string; cmd: string }[]> = {
    codex: [
      { name: '单元测试覆盖生成', cmd: 'npm run test:cov -- --watch=false' },
      { name: '静态 AST 代码审计', cmd: 'eslint src/ --ext .ts,.tsx --fix' },
      { name: '导出模块依赖图谱', cmd: 'codex-graph --format svg --out ./dist' }
    ],
    trae: [
      { name: '自动检测并修复内存泄漏', cmd: 'trae-leak --fix --threshold=50MB' },
      { name: '优化中间件与路由链', cmd: 'trae-route --optimize --verbose' },
      { name: '多微服务网关同步编译', cmd: 'trae-build --all-gateways' }
    ],
    qoder: [
      { name: '安全策略及漏洞深度扫描', cmd: 'qoder-audit --level critical' },
      { name: '算法高并发基准压测', cmd: 'qoder-bench --concurrency 1000' },
      { name: 'API 数据脱敏合规校验', cmd: 'qoder-mask --schema /api/v1' }
    ],
    minimax: [
      { name: 'Bento布局响应式渲染测试', cmd: 'minimax-ui --test-grid --all-ports' },
      { name: 'Tailwind对比度可访问性调优', cmd: 'minimax-wcag --level AAA' },
      { name: '一键压缩提取全站静态SVG', cmd: 'minimax-svg --optimize --minify' }
    ],
    workbuddy: [
      { name: '同步全渠道日程待办', cmd: 'workbuddy --sync --all-channels' },
      { name: '自动生成敏捷开发周报', cmd: 'workbuddy --report --type markdown --output ./docs' },
      { name: '项目文件语义检索与归档', cmd: 'workbuddy --index --dir ./src --vector' }
    ],
    openclaw: [
      { name: '静态缺陷与高危漏洞挖掘', cmd: 'openclaw-scan --sast --severity critical' },
      { name: 'AI 就地自愈修复安全漏洞', cmd: 'openclaw-heal --vuln-id CVE-2026-X' },
      { name: '模拟沙盒渗透防御阻断测试', cmd: 'openclaw-test --sandbox --ports 80,443' }
    ],
    openccode: [
      { name: 'Docker Compose 冲突诊断', cmd: 'openccode-compose --diagnose --offset 100' },
      { name: '自动编写 Kubernetes YAML', cmd: 'openccode-k8s --generate --output ./k8s' },
      { name: '一键拉起本地多容器微服务', cmd: 'openccode-up --all-pods --health-check' }
    ],
    hermes: [
      { name: '高并发异步网络爬虫抓取', cmd: 'hermes-crawl --concurrency 50 --limit 10000' },
      { name: '清洗过滤转换 TS 实体模型', cmd: 'hermes-clean --input raw.json --format typescript' },
      { name: '高流量高负载网络压力测试', cmd: 'hermes-load --duration 60s --qps 500' }
    ]
  };

  // Poll configuration while any task is running to show real-time stream logs & progress
  useEffect(() => {
    const hasRunningTasks = agents.some((agent) =>
      agent.tasks.some((task) => task.status === 'running')
    );

    if (!hasRunningTasks) return;

    const interval = setInterval(() => {
      onRefreshConfig();
    }, 2000); // Poll every 2s during active executions for instant telemetry feedback

    return () => clearInterval(interval);
  }, [agents, onRefreshConfig]);

  // NiuMa Ranch Tick: decays energy, processes stress, manages speech bubbles, and randomises idle behavior
  useEffect(() => {
    // Initialize NiuMa states if they don't exist
    const initialMap = { ...niuMaStateMap };
    let changed = false;

    agents.forEach((agent) => {
      if (!initialMap[agent.id]) {
        initialMap[agent.id] = {
          energy: 80,
          stress: 20,
          temperature: 37,
          customState: null,
          bubbleText: null,
          bubbleTimer: 0,
          isFueledByPie: false
        };
        changed = true;
      }
    });

    if (changed) {
      setNiuMaStateMap(initialMap);
    }

    const intervalId = setInterval(() => {
      setNiuMaStateMap((prev) => {
        const next = { ...prev };
        const agentIds = Object.keys(next);
        if (agentIds.length === 0) return prev;

        // 1. Decay or update state values
        agentIds.forEach((id) => {
          const state = next[id];
          const agent = agents.find((a) => a.id === id);
          if (!agent || !state) return;

          const isRunning = agent.tasks.some((t) => t.status === 'running');

          if (isRunning) {
            // Under load, stress spikes, temperature climbs, energy drains
            state.energy = Math.max(0, state.energy - (state.isFueledByPie ? 4 : 2));
            state.stress = Math.min(100, state.stress + 5);
            state.temperature = Math.min(180, state.temperature + (state.isFueledByPie ? 8 : 4));
          } else {
            // Idle or resting, recovery occurs
            state.stress = Math.max(10, state.stress - 2);
            state.temperature = Math.max(36.5, state.temperature - 3);
            if (state.customState === 'drinkingWater' || state.customState === 'slacking' || state.customState === 'coffee') {
              state.energy = Math.min(100, state.energy + 8);
            } else {
              state.energy = Math.min(100, state.energy + 1);
            }
          }

          // Clear bubble if timer expires
          if (state.bubbleTimer > 0) {
            state.bubbleTimer -= 1;
            if (state.bubbleTimer === 0) {
              state.bubbleText = null;
            }
          }
        });

        // 2. Randomly select one NiuMa to talk (25% chance per tick if not talking)
        if (Math.random() < 0.3) {
          const randomId = agentIds[Math.floor(Math.random() * agentIds.length)];
          const state = next[randomId];
          const agent = agents.find((a) => a.id === randomId);

          if (state && agent && !state.bubbleText) {
            const currentStatus = getNiuMaEffectiveStatus(agent, state);
            const meta = STATE_METAS[currentStatus];
            const quotes = meta.quotes;
            state.bubbleText = quotes[Math.floor(Math.random() * quotes.length)];
            state.bubbleTimer = 3; // Keep speech bubble open for 3 ticks
          }
        }

        return next;
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, [agents, niuMaStateMap]);

  // Determine actual state of a NiuMa based on background task status vs manual overrides
  const getNiuMaEffectiveStatus = (
    agent: AIAgent,
    rState?: { customState: NiuMaStatus | null; isFueledByPie: boolean }
  ): NiuMaStatus => {
    const runningTask = agent.tasks.find((t) => t.status === 'running');

    if (runningTask) {
      if (rState?.isFueledByPie) return 'overtime';
      // Map progress percentages to states dynamically
      const prog = runningTask.progress;
      if (prog < 30) return 'coding';
      if (prog < 60) return 'debugging';
      if (prog < 80) return 'testing';
      if (prog < 95) return 'deploying';
      return 'done';
    }

    if (rState?.customState) {
      return rState.customState;
    }

    // Default resting states based on ID to make different agents have initial custom personalities
    if (agent.id === 'codex') return 'idle';
    if (agent.id === 'trae') return 'slacking';
    if (agent.id === 'qoder') return 'praying';
    if (agent.id === 'minimax') return 'meeting';
    if (agent.id === 'workbuddy') return 'drinkingWater';
    if (agent.id === 'openclaw') return 'panicking';
    if (agent.id === 'openccode') return 'deploying';
    return 'idle';
  };

  // Interaction handlers for individual NiuMa stables
  const handleFeedPie = (id: string, name: string) => {
    setNiuMaStateMap((prev) => {
      const state = prev[id] || { energy: 50, stress: 50, temperature: 37, customState: null, bubbleText: null, bubbleTimer: 0, isFueledByPie: false };
      return {
        ...prev,
        [id]: {
          ...state,
          customState: 'overtime',
          isFueledByPie: true,
          stress: 100,
          temperature: 150,
          bubbleText: '「画大饼成功 🥧」老板画的大饼太香了！工资画到2030年，牛马疯狂运转！',
          bubbleTimer: 4
        }
      };
    });
    addSystemLog(`鞭策牛马: ${name}`, '你投喂了一个“晋升加薪”大饼，该智能体瞬间进入了疯狂超频（加班）状态！CPU温度骤升！', 'warning');
  };

  const handleGiveCoffee = (id: string, name: string) => {
    setNiuMaStateMap((prev) => {
      const state = prev[id] || { energy: 50, stress: 50, temperature: 37, customState: null, bubbleText: null, bubbleTimer: 0, isFueledByPie: false };
      return {
        ...prev,
        [id]: {
          ...state,
          customState: 'coffee',
          energy: 100,
          temperature: Math.max(37, state.temperature - 15),
          stress: Math.max(10, state.stress - 30),
          bubbleText: '「冰美式注入 ☕」纯纯的咖啡因！牛马能量值瞬间满血！又能再抗十个Bug！',
          bubbleTimer: 4
        }
      };
    });
    addSystemLog(`投喂牛马: ${name}`, '你递过去一杯冰浓缩美式 ☕，智能体瞬间洗去疲惫，能量直接回满！', 'success');
  };

  const handleWhip = (id: string, name: string) => {
    setNiuMaStateMap((prev) => {
      const state = prev[id] || { energy: 50, stress: 50, temperature: 37, customState: null, bubbleText: null, bubbleTimer: 0, isFueledByPie: false };
      return {
        ...prev,
        [id]: {
          ...state,
          customState: 'coding',
          stress: 100,
          temperature: 110,
          bubbleText: '「电鞭拷打 ⚡」别打了别打了！键盘开始冒烟，正在拼命手敲二进制！',
          bubbleTimer: 4
        }
      };
    });
    addSystemLog(`电击皮鞭鞭策: ${name}`, '你使用了物理提效电击 ⚡，该智能体浑身发麻，惊恐之下疯狂敲打键盘！', 'error');
  };

  const handleSendToSlack = (id: string, name: string) => {
    setNiuMaStateMap((prev) => {
      const state = prev[id] || { energy: 50, stress: 50, temperature: 37, customState: null, bubbleText: null, bubbleTimer: 0, isFueledByPie: false };
      return {
        ...prev,
        [id]: {
          ...state,
          customState: 'drinkingWater',
          energy: Math.min(100, state.energy + 20),
          stress: Math.max(0, state.stress - 40),
          temperature: 36.5,
          bubbleText: '「批准摸鱼 🍵」多起立，多打水，只要老板没发现，牛马就一直在带薪摸鱼！',
          bubbleTimer: 4
        }
      };
    });
    addSystemLog(`体恤关怀: ${name}`, '你批准了它的带薪摸鱼申请 🍵，智能体心存感激，端着水杯溜达去了。', 'info');
  };

  // Cycle through states manually if user clicks the animated character
  const handleCharacterClick = (id: string, name: string) => {
    const list: NiuMaStatus[] = [
      'idle', 'coding', 'debugging', 'meeting', 'coffee', 'testing',
      'deploying', 'done', 'overtime', 'drinkingWater', 'panicking',
      'slacking', 'praying', 'demanding'
    ];

    setNiuMaStateMap((prev) => {
      const state = prev[id] || { energy: 50, stress: 50, temperature: 37, customState: null, bubbleText: null, bubbleTimer: 0, isFueledByPie: false };
      const current = state.customState || 'idle';
      const currentIndex = list.indexOf(current);
      const nextIndex = (currentIndex + 1) % list.length;
      const nextState = list[nextIndex];
      const meta = STATE_METAS[nextState];

      return {
        ...prev,
        [id]: {
          ...state,
          customState: nextState,
          bubbleText: `「状态切换至 ${meta.name}」` + meta.quotes[0],
          bubbleTimer: 4
        }
      };
    });
  };

  // Render animation classes based on state
  const getMotionAnimation = (status: NiuMaStatus) => {
    switch (status) {
      case 'coding':
        return {
          animate: {
            x: [0, -2, 2, -2, 2, 0],
            y: [0, -1, 1, -1, 0],
            rotate: [0, -1, 1, -1, 0]
          },
          transition: { duration: 0.15, repeat: Infinity }
        };
      case 'debugging':
        return {
          animate: {
            rotate: [0, -6, 6, -6, 0],
            y: [0, -2, 0]
          },
          transition: { duration: 1.2, repeat: Infinity }
        };
      case 'panicking':
        return {
          animate: {
            y: [0, -12, 0, -12, 0],
            x: [0, -5, 5, -5, 0],
            scale: [1, 1.05, 0.95, 1]
          },
          transition: { duration: 0.35, repeat: Infinity }
        };
      case 'idle':
        return {
          animate: {
            scaleY: [1, 0.94, 1],
            y: [0, 3, 0]
          },
          transition: { duration: 2.5, repeat: Infinity }
        };
      case 'done':
        return {
          animate: {
            y: [0, -14, 0],
            rotate: [0, 15, -15, 0],
            scale: [1, 1.1, 1]
          },
          transition: { duration: 0.7, repeat: Infinity }
        };
      case 'overtime':
        return {
          animate: {
            scaleY: [1, 0.88, 1],
            opacity: [0.65, 1, 0.65]
          },
          transition: { duration: 3.5, repeat: Infinity }
        };
      case 'coffee':
        return {
          animate: {
            y: [0, -6, 0],
            scale: [1, 1.08, 1],
            rotate: [0, 360]
          },
          transition: { y: { duration: 1, repeat: Infinity }, scale: { duration: 1, repeat: Infinity }, rotate: { duration: 4, ease: "linear" } }
        };
      case 'slacking':
        return {
          animate: {
            rotate: [-12, 12, -12],
            x: [-4, 4, -4]
          },
          transition: { duration: 2.2, repeat: Infinity }
        };
      case 'drinkingWater':
        return {
          animate: {
            y: [0, 4, 0],
            rotate: [0, -10, 0]
          },
          transition: { duration: 1.8, repeat: Infinity }
        };
      case 'praying':
        return {
          animate: {
            scaleY: [1, 0.8, 1],
            y: [0, 5, 0]
          },
          transition: { duration: 1, repeat: Infinity }
        };
      case 'demanding':
        return {
          animate: {
            x: [0, 8, 0],
            scale: [1, 1.12, 1],
            skewX: [0, -5, 0]
          },
          transition: { duration: 0.5, repeat: Infinity }
        };
      case 'meeting':
        return {
          animate: {
            y: [0, 4, 0],
            scaleY: [1, 0.93, 1]
          },
          transition: { duration: 1.3, repeat: Infinity }
        };
      case 'deploying':
        return {
          animate: {
            y: [0, -8, 0],
            scaleX: [1, 0.95, 1.05, 1]
          },
          transition: { duration: 0.9, repeat: Infinity }
        };
      default:
        return {
          animate: {
            y: [0, -3, 0]
          },
          transition: { duration: 2, repeat: Infinity }
        };
    }
  };

  // Handle task dispatching
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/agents/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          taskName: taskName.trim(),
          command: command.trim() || undefined
        })
      });

      if (res.ok) {
        setTaskName('');
        setCommand('');
        onRefreshConfig();
        addSystemLog(
          `${selectedAgent.name}: 指令已下发`,
          `任务「${taskName.trim()}」开始在后台进程中流式执行。`,
          'success'
        );

        // Instantly wake up the NiuMa for coding
        setNiuMaStateMap((prev) => {
          const state = prev[selectedAgentId] || { energy: 50, stress: 50, temperature: 37, customState: null, bubbleText: null, bubbleTimer: 0, isFueledByPie: false };
          return {
            ...prev,
            [selectedAgentId]: {
              ...state,
              customState: 'coding',
              stress: 60,
              bubbleText: '「任务下达！⌨️」老板分活了！兄弟们操家伙，开始疯狂码砖！',
              bubbleTimer: 4
            }
          };
        });
      }
    } catch (err) {
      console.error('Failed to create agent task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle manual process termination (SIGKILL)
  const handleStopTask = async (taskId: string) => {
    try {
      const res = await fetch('/api/agents/tasks/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgentId, taskId })
      });

      if (res.ok) {
        onRefreshConfig();
        addSystemLog(
          `${selectedAgent.name}: 手动停止任务`,
          `进程线程已接收 SIGKILL 强行退出信号。`,
          'warning'
        );

        // Turn NiuMa into panicked state
        setNiuMaStateMap((prev) => {
          const state = prev[selectedAgentId] || { energy: 50, stress: 50, temperature: 37, customState: null, bubbleText: null, bubbleTimer: 0, isFueledByPie: false };
          return {
            ...prev,
            [selectedAgentId]: {
              ...state,
              customState: 'panicking',
              stress: 90,
              bubbleText: '「进程强杀 🚨」我的天！线程被强行杀掉了！是不是服务器挂了？！',
              bubbleTimer: 4
            }
          };
        });
      }
    } catch (err) {
      console.error('Failed to stop task:', err);
    }
  };

  // Handle clearing historical tasks
  const handleClearTasks = async () => {
    try {
      const res = await fetch('/api/agents/tasks/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgentId })
      });

      if (res.ok) {
        onRefreshConfig();
        addSystemLog(
          `${selectedAgent.name}: 清理历史任务`,
          `已成功清除所有已完成或异常退出的历史进程快照。`,
          'info'
        );
      }
    } catch (err) {
      console.error('Failed to clear tasks:', err);
    }
  };

  // Get active task logs if open
  const openLogsTask = selectedAgent.tasks.find((t) => t.id === viewingLogsTaskId);

  return (
    <div id="ai-agents-panel" className="bg-[#111111] border border-[#262626] rounded-2xl p-6 space-y-6">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-gray-200 flex items-center gap-2">
            <DynamicIcon name="Cpu" size={18} className="text-blue-400" />
            <span>AI 智能体多任务中控台 (AI Agents Panel)</span>
          </h2>
          <p className="text-xs text-gray-400">一键调度本地多智能体并发任务，流式追踪后台进程执行日志</p>
        </div>

        {/* Statistics count indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#262626] text-[10px] font-mono text-gray-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>活动智能体: {agents.filter(a => a.status === 'active').length}</span>
          <span className="h-2 w-[1px] bg-[#262626] mx-1" />
          <span>总任务: {agents.reduce((sum, a) => sum + a.tasks.length, 0)}</span>
        </div>
      </div>

      {/* 1. INTERACTIVE AGENT BUBBLES SECTION (气泡形式) */}
      <div className="space-y-3">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">本地节点活跃智能体气泡 (Click to select)</span>
        <div className="flex flex-wrap gap-3">
          {agents.map((agent) => {
            const isSelected = agent.id === selectedAgentId;
            const isRunning = agent.tasks.some(t => t.status === 'running');
            const runningCount = agent.tasks.filter(t => t.status === 'running').length;

            return (
              <button
                key={agent.id}
                type="button"
                id={`btn-agent-select-${agent.id}`}
                onClick={() => {
                  setSelectedAgentId(agent.id);
                  setViewingLogsTaskId(null); // Reset log viewer
                }}
                className={`relative flex items-center gap-2.5 px-4 py-3 rounded-full border transition-all cursor-pointer select-none group ${
                  isSelected
                    ? 'bg-blue-600/10 border-blue-500 text-blue-200 shadow-lg shadow-blue-500/5'
                    : 'bg-[#161616]/40 border-[#262626] text-gray-400 hover:border-gray-700 hover:bg-[#1a1a1a]'
                }`}
              >
                {/* Glowing ring/pulse for active status */}
                {isRunning && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-600 text-[8px] font-bold text-white items-center justify-center font-mono">
                      {runningCount}
                    </span>
                  </span>
                )}

                {/* Avatar Bubble Icon */}
                <NiuMaAvatar agentId={agent.id} size="sm" isSelected={isSelected} />

                <div className="text-left pr-1">
                  <div className="text-xs font-semibold flex items-center gap-1">
                    <span className={isSelected ? 'text-gray-200' : 'text-gray-400 group-hover:text-gray-200'}>{agent.name}</span>
                    {!isRunning && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600" title="空闲 (Idle)" />
                    )}
                    {isRunning && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="执行中 (Active)" />
                    )}
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono block mt-0.5">{agent.modelName.split(' / ')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. FUN ANIME RANCH: 智能开发大厂・数字牛马圈养提效中心 */}
      <div className="border border-[#262626] bg-[#161616]/20 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#262626] pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <span>🐄</span>
              <span>智能开发大厂・数字牛马圈养提效中心</span>
              <span className="text-[9px] font-normal bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 px-1.5 py-0.5 rounded">RANCH-v2.5</span>
            </h3>
            <p className="text-[11px] text-gray-500">宿主开发智能体劳动力状态仿真。点击牛马切换表情状态，或投喂道具实施强效管理！</p>
          </div>
          <div className="text-[10px] font-mono text-zinc-500 bg-[#121212] px-2 py-1 rounded border border-[#232323]">
            安全围栏状态: <span className="text-emerald-400 font-bold">已连通 (CONNECTED)</span>
          </div>
        </div>

        {/* Ranch grid container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((agent, index) => {
            const rState = niuMaStateMap[agent.id] || { energy: 75, stress: 15, temperature: 36.8, customState: null, bubbleText: null, bubbleTimer: 0, isFueledByPie: false };
            const effectiveStatus = getNiuMaEffectiveStatus(agent, rState);
            const meta = STATE_METAS[effectiveStatus];
            const isAgentRunning = agent.tasks.some(t => t.status === 'running');
            const info = getAgentNiuMaInfo(agent.id);

            return (
              <div
                key={agent.id}
                id={`niu-ma-box-${agent.id}`}
                className={`relative border rounded-xl p-3 flex flex-col justify-between transition-all ${
                  isAgentRunning
                    ? 'bg-amber-950/10 border-amber-500/30 ring-1 ring-amber-500/15'
                    : 'bg-[#111111]/60 border-[#222222] hover:border-zinc-700 hover:bg-[#121212]'
                }`}
              >
                {/* Stall Header tag */}
                <div className="flex items-center justify-between border-b border-[#222222] pb-2 mb-2">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">【{index + 1}号舍】{agent.name.split(' ')[0]}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono ${meta.bg} ${meta.color} border ${meta.border}`}>
                    {meta.name}
                  </span>
                </div>

                {/* Floating Character Frame */}
                <div className="relative h-28 flex flex-col items-center justify-center bg-[#0d0d0d] rounded-lg border border-[#222222]/55 overflow-visible select-none py-2">
                  {/* Floating Speech Bubble */}
                  <AnimatePresence>
                    {rState.bubbleText && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -10 }}
                        className="absolute z-10 -top-8 left-2 right-2 bg-blue-500 text-white p-2 rounded-lg text-[9px] leading-relaxed shadow-xl border border-blue-400 font-sans text-center"
                      >
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rotate-45 border-r border-b border-blue-400"></div>
                        {rState.bubbleText}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Character Avatar Box */}
                  <motion.div
                    {...getMotionAnimation(effectiveStatus)}
                    onClick={() => handleCharacterClick(agent.id, agent.name)}
                    className="cursor-pointer flex flex-col items-center gap-1 group/avatar"
                    title="点击戳一下，切换牛马状态"
                  >
                    <div className="relative w-20 h-20 flex items-center justify-center transition-transform group-hover/avatar:scale-110 select-none">
                      <NiuMaAvatar agentId={agent.id} size="lg" isSelected={true} />

                      {/* Interactive dynamic particle effects for certain states */}
                      {effectiveStatus === 'coding' && (
                        <span className="absolute -right-2 -top-2 text-xs animate-bounce">🔥</span>
                      )}
                      {effectiveStatus === 'coffee' && (
                        <span className="absolute -left-2 -top-2 text-xs animate-pulse">☕</span>
                      )}
                      {effectiveStatus === 'panicking' && (
                        <span className="absolute -top-2 -right-1 text-xs animate-ping">🚨</span>
                      )}
                      {effectiveStatus === 'overtime' && (
                        <span className="absolute -top-2 -left-1 text-xs animate-bounce">💀</span>
                      )}
                    </div>
                    {/* Emoticon Expression Text */}
                    <div className="text-[10px] font-mono text-zinc-400 bg-zinc-950/80 px-1.5 py-0.5 rounded border border-[#222222] mt-0.5 font-bold group-hover/avatar:text-blue-400">
                      {meta.expression}
                    </div>
                  </motion.div>
                </div>

                {/* Physics Data Trackers */}
                <div className="space-y-2 mt-3 text-[10px]">
                  {/* Energy Battery Level */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-zinc-500 font-mono text-[9px]">
                      <span>体力能量值 (Energy)</span>
                      <span className={rState.energy > 30 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {rState.energy}%
                      </span>
                    </div>
                    <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden border border-[#232323]">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          rState.energy > 60
                            ? 'bg-emerald-500'
                            : rState.energy > 30
                            ? 'bg-amber-500'
                            : 'bg-red-500 animate-pulse'
                        }`}
                        style={{ width: `${rState.energy}%` }}
                      />
                    </div>
                  </div>

                  {/* CPU Heat & Stress Gauge */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-zinc-500 font-mono text-[9px]">
                      <span>CPU 温度 (Heat)</span>
                      <span className={rState.temperature > 90 ? 'text-red-400 font-bold animate-pulse' : 'text-zinc-300'}>
                        {rState.temperature.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden border border-[#232323]">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          rState.temperature > 100
                            ? 'bg-red-500 animate-pulse'
                            : rState.temperature > 60
                            ? 'bg-amber-500'
                            : 'bg-blue-400'
                        }`}
                        style={{ width: `${Math.min(100, (rState.temperature / 150) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Interactive Operations Deck (投喂、抽打、下班、摸鱼) */}
                <div className="grid grid-cols-4 gap-1 mt-3 border-t border-[#222222] pt-2">
                  <button
                    onClick={() => handleFeedPie(agent.id, agent.name)}
                    className="p-1.5 bg-[#1a1a1a] hover:bg-orange-600/10 hover:border-orange-500/30 text-zinc-400 hover:text-orange-400 rounded-lg text-center cursor-pointer border border-transparent transition-all"
                    title="画个晋升大饼 🥧 (Hyper加班运转)"
                  >
                    <span className="text-xs">🥧</span>
                  </button>
                  <button
                    onClick={() => handleGiveCoffee(agent.id, agent.name)}
                    className="p-1.5 bg-[#1a1a1a] hover:bg-amber-600/10 hover:border-amber-500/30 text-zinc-400 hover:text-amber-400 rounded-lg text-center cursor-pointer border border-transparent transition-all"
                    title="给杯咖啡 ☕ (极速恢复体力)"
                  >
                    <span className="text-xs">☕</span>
                  </button>
                  <button
                    onClick={() => handleWhip(agent.id, agent.name)}
                    className="p-1.5 bg-[#1a1a1a] hover:bg-rose-600/10 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 rounded-lg text-center cursor-pointer border border-transparent transition-all"
                    title="皮鞭抽打 ⚡ (强制拼命敲码)"
                  >
                    <span className="text-xs">⚡</span>
                  </button>
                  <button
                    onClick={() => handleSendToSlack(agent.id, agent.name)}
                    className="p-1.5 bg-[#1a1a1a] hover:bg-cyan-600/10 hover:border-cyan-500/30 text-zinc-400 hover:text-cyan-400 rounded-lg text-center cursor-pointer border border-transparent transition-all"
                    title="批准摸鱼 🍵 (清空压力及热量)"
                  >
                    <span className="text-xs">🍵</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTAINER FOR THE SELECTED AGENT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#161616]/40 border border-[#232323] p-5 rounded-2xl">

        {/* LEFT COLUMN: AGENT TELEMETRY & DISPATCHER */}
        <div className="md:col-span-1 space-y-4">
          <div className="space-y-1 pb-3 border-b border-[#232323]">
            <div className="flex items-center gap-2">
              <NiuMaAvatar agentId={selectedAgent.id} size="sm" isSelected={true} />
              <span className="text-sm font-semibold text-gray-200">{selectedAgent.name}</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">{selectedAgent.description}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-gray-500">网关套接字 (Endpoint)</span>
              <span className="text-gray-300 font-bold">{selectedAgent.endpoint}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-gray-500">关联底层模型</span>
              <span className="text-blue-400 font-bold">{selectedAgent.modelName}</span>
            </div>
          </div>

          {/* Quick templates for command line */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">任务指令模版</span>
            <div className="grid grid-cols-1 gap-1.5">
              {QUICK_COMMAND_TEMPLATES[selectedAgent.id]?.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  id={`btn-tpl-${selectedAgent.id}-${idx}`}
                  onClick={() => {
                    setTaskName(tpl.name);
                    setCommand(tpl.cmd);
                  }}
                  className="w-full text-left p-2 rounded-lg bg-[#111111]/80 border border-[#262626] hover:border-blue-500/40 text-[10px] transition-all flex items-center justify-between cursor-pointer group"
                >
                  <span className="text-gray-400 group-hover:text-gray-200 font-medium">{tpl.name}</span>
                  <span className="text-gray-600 font-mono text-[9px] group-hover:text-blue-400">选择</span>
                </button>
              ))}
            </div>
          </div>

          {/* NEW TASK FORM */}
          <form onSubmit={handleCreateTask} className="space-y-3 pt-3 border-t border-[#232323]">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block flex items-center gap-1">
              <DynamicIcon name="Plus" size={10} />
              <span>中控台下发新任务</span>
            </span>

            <div className="space-y-1.5">
              <input
                type="text"
                required
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="例如: 智能生成前端 API 类型声明"
                className="w-full bg-[#111111] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="运行指令 (如: node build-api.js)"
                className="w-full bg-[#111111] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !taskName.trim()}
              className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold py-2 rounded-lg text-xs cursor-pointer transition-colors"
            >
              <DynamicIcon name="Play" size={11} />
              <span>{submitting ? '发送指令中...' : '立即下发任务进程'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT 2 COLUMNS: TASKS DASHBOARD & LIVE LOG TERMINAL */}
        <div className="md:col-span-2 flex flex-col justify-between space-y-4">

          {/* TABS SELECTOR */}
          <div className="flex items-center justify-between pb-2 border-b border-[#232323]">
            <div className="flex items-center gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={`pb-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'tasks' ? 'border-blue-500 text-gray-100' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                多任务队列状态 ({selectedAgent.tasks.length})
              </button>
            </div>

            {selectedAgent.tasks.some(t => t.status !== 'running') && (
              <button
                type="button"
                onClick={handleClearTasks}
                className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1 cursor-pointer"
              >
                <DynamicIcon name="Trash" size={10} />
                <span>清理历史</span>
              </button>
            )}
          </div>

          {/* ACTIVE TAB STAGE */}
          <div className="flex-1 min-h-[220px] overflow-y-auto max-h-[300px] space-y-2 pr-1">
            {selectedAgent.tasks.length === 0 ? (
              <div className="text-center py-16 text-gray-600 text-xs italic">
                队列暂空。请在左侧输入或点击模板并下发首个多任务进程。
              </div>
            ) : (
              selectedAgent.tasks.map((task) => {
                const isSelectedForLogs = viewingLogsTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isSelectedForLogs
                        ? 'bg-[#111111] border-blue-500/50'
                        : 'bg-[#111111]/40 border-[#262626] hover:bg-[#111111]/80 hover:border-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Name & Command details */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <span className="text-xs font-semibold text-gray-200 block truncate">{task.name}</span>
                        <code className="text-[9px] text-gray-500 font-mono block truncate">
                          $ {task.command}
                        </code>
                      </div>

                      {/* State Telemetry Badges */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full ${
                            task.status === 'running'
                              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse'
                              : task.status === 'success'
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                              : 'bg-red-500/10 border border-red-500/30 text-red-400'
                          }`}>
                            {task.status === 'running' ? 'Running' : task.status === 'success' ? 'Success' : 'Error'}
                          </span>
                          <span className="text-[9px] text-gray-600 block font-mono mt-1">
                            {task.startTime ? new Date(task.startTime).toLocaleTimeString() : ''}
                          </span>
                        </div>

                        {/* Actions buttons inside dashboard */}
                        <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-[#262626]">
                          <button
                            type="button"
                            onClick={() => setViewingLogsTaskId(isSelectedForLogs ? null : task.id)}
                            className={`p-1 rounded cursor-pointer transition-all ${
                              isSelectedForLogs ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
                            }`}
                            title="查看日志"
                          >
                            <DynamicIcon name="Terminal" size={12} />
                          </button>

                          {task.status === 'running' ? (
                            <button
                              type="button"
                              onClick={() => handleStopTask(task.id)}
                              className="p-1 text-red-500 hover:bg-red-500/10 rounded cursor-pointer transition-all"
                              title="强制停止"
                            >
                              <DynamicIcon name="XCircle" size={12} />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Progress indicator */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex-1 bg-[#1a1a1a] rounded-full h-1.5 overflow-hidden border border-[#262626]">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            task.status === 'running'
                              ? 'bg-amber-500'
                              : task.status === 'success'
                              ? 'bg-emerald-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-gray-400 min-w-[30px] text-right">
                        {task.progress}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* REAL-TIME TERMINAL CONTAINER FOR SYSTEM PROCESS OUTPUT */}
          <AnimatePresence>
            {openLogsTask && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#070707] border border-[#222] rounded-xl overflow-hidden mt-2 font-mono"
              >
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#121212] border-b border-[#222]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    <span className="text-[10px] text-gray-500 font-bold ml-1">进程流式日志: {openLogsTask.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {openLogsTask.status === 'running' && (
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                      </span>
                    )}
                    <button
                      onClick={() => setViewingLogsTaskId(null)}
                      className="text-gray-500 hover:text-gray-300 text-xs font-sans cursor-pointer p-0.5"
                    >
                      <DynamicIcon name="X" size={10} />
                    </button>
                  </div>
                </div>

                {/* Terminal outputs */}
                <div className="p-3 text-[10px] text-emerald-400 max-h-[140px] overflow-y-auto leading-relaxed select-text space-y-1 scrollbar-thin">
                  {openLogsTask.logs.map((log, index) => (
                    <div key={index} className="whitespace-pre-wrap font-mono">
                      {log}
                    </div>
                  ))}
                  {openLogsTask.status === 'running' && (
                    <div className="animate-pulse text-gray-500 flex items-center gap-1 font-mono">
                      <span>▋</span>
                      <span className="text-[9px]">等待管道持续流式写出中...</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

    </div>
  );
}
