import type {
  AIAgent,
  AgentSnapshot,
  AgentSystemMessage,
  AgentTask,
  CreateTaskInput,
  NiuMaAction,
  NiuMaRuntimeState,
  NiuMaStatus
} from '../types';

interface StateMeta {
  name: string;
  expression: string;
  quotes: string[];
}

export const STATE_METAS: Record<NiuMaStatus, StateMeta> = {
  idle: {
    name: '熟睡躺平',
    expression: '(•_•) 💤',
    quotes: [
      '呼噜呼噜... 只要老板看不见，我就是离线状态。',
      '别点我，已经躺平，进入低功耗待机模式。',
      '系统空闲中，灵魂已下班，肉体在打盹。',
      '摸鱼不算偷，这叫技术沉淀与能耗控制。'
    ]
  },
  coding: {
    name: '疯狂码砖',
    expression: '(╬☉д⊙) ⌨️',
    quotes: [
      '键盘冒烟了，正在手写一万行完美代码。',
      '看我的无敌指法：Ctrl+C、Ctrl+V、完美编译。',
      '别打断我，正在用业务逻辑重塑数字文明。',
      '一行代码两个坑，留给后人去修坑。'
    ]
  },
  debugging: {
    name: '揪发排障',
    expression: '(⊙_◎) 🔍',
    quotes: [
      '这个 Bug 很诡异，昨天明明还能跑。',
      '一行代码十个报错，头发正在离职。',
      '前人写的逻辑真精彩，仔细一看是我自己。',
      '只要我不看日志，错误就处于量子态。'
    ]
  },
  meeting: {
    name: '废话周会',
    expression: '(－_－) zzZ',
    quotes: [
      '会议开始三分钟，灵魂已经开始漫游。',
      '懂了懂了，这就去把简单需求做成分布式系统。',
      '只要我不发言，就没人知道我已经睡着。',
      '同步、对齐、闭环，今天又学会三个咒语。'
    ]
  },
  coffee: {
    name: '咖啡续命',
    expression: '(☕_☕) ++',
    quotes: [
      '咖啡因注入成功，生命值临时恢复。',
      '血管里流的不是血，是冰美式。',
      '我还能再重构三个微服务。',
      '唯有咖啡能抚平深夜赶工的内心。'
    ]
  },
  testing: {
    name: '压测跑路',
    expression: '(；´д`) 🧪',
    quotes: [
      '正在进行百万级并发想象测试。',
      '单元测试通过率 99.9%，剩下的先交给玄学。',
      '测试一过，天下我有。',
      '上线后稳不稳定，全凭今天的善良。'
    ]
  },
  deploying: {
    name: '拜佛发布',
    expression: '(🙏_🙏) 🚀',
    quotes: [
      '正在部署生产环境，请各路神仙保佑。',
      '一键发布，三秒祈祷，五分钟观察。',
      '正在向生产注入全新的智能特性。',
      '发布成功，现在是偷偷下班的黄金窗口。'
    ]
  },
  done: {
    name: '按时下班',
    expression: '(^_^) ✅',
    quotes: [
      '准点下班，速度比光还快。',
      '今晚没有加班，我要回去拥抱床。',
      '收工，今天没有把生产环境点着。',
      '这是本牛马最后的底线。'
    ]
  },
  overtime: {
    name: '修仙加班',
    expression: '(x_x) 🌙',
    quotes: [
      '凌晨两点，眼里闪着智慧和疲惫。',
      '只要加班费到位，CPU 可以烧到天亮。',
      '身体已经成灰，但代码还在跑。',
      '今晚不解开这个死锁，我就和服务器同归于尽。'
    ]
  },
  drinkingWater: {
    name: '打水摸鱼',
    expression: '(￣▽￣) 🥤',
    quotes: [
      '打水时间到，顺便巡逻茶水间。',
      '频繁起立、假装打水、四处观察。',
      '水是生命之源，摸鱼是续航之本。',
      '在茶水间听到新需求，吓得我多喝两杯。'
    ]
  },
  panicking: {
    name: '生产救火',
    expression: '(╯°□°)╯ 🔥',
    quotes: [
      '生产炸了，快找十分钟前合并的人。',
      '报警短信把手机震成按摩仪。',
      '回滚，赶紧回滚，假装什么都没发生。',
      '吞吐量跌到零，走廊已经开始有脚步声。'
    ]
  },
  slacking: {
    name: '带薪摸鱼',
    expression: '(¬_¬) 📱',
    quotes: [
      '带薪摸鱼是一门优雅的时间管理艺术。',
      '等待构建结果时，研究一下世界局势。',
      '腿麻了，但感觉多赚了二十块。',
      '只要 IDE 开着，我就算在工作。'
    ]
  },
  praying: {
    name: '佛祖保佑',
    expression: '(人´∀`) ✨',
    quotes: [
      '保佑编译一次过，别爆红。',
      '代码已经写好，剩下交给运气。',
      '向服务器神明献上今天的缓存。',
      '今天的 Pipeline 请务必给我面子。'
    ]
  },
  demanding: {
    name: '怒怼需求',
    expression: '(#｀皿´) 📌',
    quotes: [
      '这个需求真的简单吗？请展开说说。',
      '文档写得像花，实现起来全是坑。',
      '再改需求，我就把排期贴在门上。',
      '先定义完成标准，再谈今天下班。'
    ]
  }
};

const AGENT_SEEDS: AIAgent[] = [
  {
    id: 'codex',
    slot: '1号舍',
    name: 'Codex',
    codename: '批发排障',
    badge: 'RANCH-v2.5',
    avatar: '🐂',
    description: '拆解任务、修改代码、闭环验证的主力牛马。',
    status: 'idle',
    modelName: 'Codex / GPT-5',
    endpoint: 'app://codex-orchestrator',
    accent: '#2f80ed',
    tasks: []
  },
  {
    id: 'trae',
    slot: '2号舍',
    name: 'Trae',
    codename: '带薪拉屎',
    badge: 'IDE',
    avatar: '🐎',
    description: '负责跨文件重构、依赖梳理和工程结构清理。',
    status: 'idle',
    modelName: 'Claude 3.5 / Trae',
    endpoint: 'app://trae-refactor',
    accent: '#00f294',
    tasks: []
  },
  {
    id: 'qoder',
    slot: '3号舍',
    name: 'Qoder',
    codename: '佛祖保佑',
    badge: 'QA',
    avatar: '🐂',
    description: '负责测试覆盖、风险审查和安全合规扫描。',
    status: 'idle',
    modelName: 'DeepSeek-R1 / Qoder',
    endpoint: 'app://qoder-qa',
    accent: '#10b981',
    tasks: []
  },
  {
    id: 'minimax',
    slot: '4号舍',
    name: 'MiniMax',
    codename: '废话周会',
    badge: 'UI',
    avatar: '🐎',
    description: '负责界面布局、交互动效和视觉表达。',
    status: 'idle',
    modelName: 'MiniMax / UI-Gen',
    endpoint: 'app://minimax-frontend',
    accent: '#ff4d00',
    tasks: []
  },
  {
    id: 'workbuddy',
    slot: '5号舍',
    name: 'WorkBuddy',
    codename: '打水摸鱼',
    badge: 'OPS',
    avatar: '🐂',
    description: '负责日程、文件、状态提醒和轻量自动化。',
    status: 'idle',
    modelName: 'Gemini 2.5 / WorkBuddy',
    endpoint: 'app://workbuddy',
    accent: '#00c8ff',
    tasks: []
  },
  {
    id: 'openclaw',
    slot: '6号舍',
    name: 'OpenClaw',
    codename: '生产救火',
    badge: 'BUG',
    avatar: '🐎',
    description: '负责 Bug 定位、事故复盘和漏洞挖掘。',
    status: 'idle',
    modelName: 'Claude / OpenClaw',
    endpoint: 'app://openclaw',
    accent: '#e63946',
    tasks: []
  },
  {
    id: 'openccode',
    slot: '7号舍',
    name: 'OpenCCode',
    codename: '佛系发版',
    badge: 'CLOUD',
    avatar: '🐂',
    description: '负责容器化、云部署和发布流水线。',
    status: 'idle',
    modelName: 'DeepSeek-Coder / OpenCCode',
    endpoint: 'app://openccode',
    accent: '#8b5cf6',
    tasks: []
  },
  {
    id: 'hermes',
    slot: '8号舍',
    name: 'Hermes',
    codename: '热舞躺平',
    badge: 'NET',
    avatar: '🐎',
    description: '负责网络抓取、流量观察和边界测试。',
    status: 'idle',
    modelName: 'Llama / Hermes',
    endpoint: 'app://hermes',
    accent: '#f97316',
    tasks: []
  }
];

const QUICK_TASKS: Record<string, Array<{ name: string; command: string }>> = {
  codex: [
    { name: '定位构建失败', command: 'npm run lint && npm run build' },
    { name: '拆解实现路线', command: 'codex plan --scope current-lane' }
  ],
  trae: [
    { name: '扫描跨文件依赖', command: 'trae refactor --dry-run' },
    { name: '整理重复组件', command: 'trae cleanup src/components' }
  ],
  qoder: [
    { name: '生成回归用例', command: 'qoder test --risk=high' },
    { name: '安全边界审查', command: 'qoder audit --surface ipc' }
  ],
  minimax: [
    { name: '打磨控制舱布局', command: 'minimax-ui polish --density=ops' },
    { name: '检查移动端适配', command: 'minimax-ui viewport --mobile' }
  ],
  workbuddy: [
    { name: '整理今日待办', command: 'workbuddy todo --today' },
    { name: '生成状态播报', command: 'workbuddy report --short' }
  ],
  openclaw: [
    { name: '事故根因定位', command: 'openclaw incident --trace' },
    { name: '漏洞扫描', command: 'openclaw scan --local' }
  ],
  openccode: [
    { name: '发版前检查', command: 'openccode release --check' },
    { name: '容器配置审计', command: 'openccode k8s --review' }
  ],
  hermes: [
    { name: '接口连通巡检', command: 'hermes probe --all' },
    { name: '流量边界测试', command: 'hermes traffic --limit' }
  ]
};

export function getQuickTasks(agentId: string) {
  return QUICK_TASKS[agentId] ?? [
    { name: '常规巡检', command: 'agent run --mode simulated' }
  ];
}

export function createSeedSnapshot(): AgentSnapshot {
  const now = new Date().toISOString();
  const runtime = Object.fromEntries(
    AGENT_SEEDS.map((agent) => [agent.id, createRuntimeState(agent.id, now)])
  );

  return {
    version: 1,
    updatedAt: now,
    agents: AGENT_SEEDS.map((agent) => ({ ...agent, tasks: [] })),
    runtime,
    messages: [
      createMessage('success', '核心部门已启动', '多 Agent 牛马桌面控制舱已完成本地初始化。')
    ]
  };
}

export function normalizeSnapshot(value: unknown): AgentSnapshot {
  if (!isRecord(value)) {
    return createSeedSnapshot();
  }

  const now = new Date().toISOString();
  const agents = Array.isArray(value.agents)
    ? value.agents.map((agentLike, index) => normalizeAgent(agentLike, index))
    : AGENT_SEEDS.map((agent) => ({ ...agent, tasks: [] }));

  const runtimeCandidate = isRecord(value.runtime) ? value.runtime : {};
  const runtime = Object.fromEntries(
    agents.map((agent) => [
      agent.id,
      normalizeRuntimeState(runtimeCandidate[agent.id], agent.id, now)
    ])
  );

  return {
    version: 1,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
    agents,
    runtime,
    messages: Array.isArray(value.messages)
      ? value.messages.map(normalizeMessage).filter(Boolean).slice(0, 80) as AgentSystemMessage[]
      : []
  };
}

export function createTask(snapshot: AgentSnapshot, input: CreateTaskInput): AgentSnapshot {
  const taskName = input.taskName.trim();
  const command = input.command.trim() || 'agent run --mode simulated';
  if (!taskName) {
    return snapshot;
  }

  const now = new Date().toISOString();
  const task: AgentTask = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: taskName,
    command,
    runner: input.runner ?? 'simulated',
    status: 'running',
    progress: 0,
    startTime: now,
    logs: [
      `[${formatLogTime()}] 调度器收到任务：${taskName}`,
      `[${formatLogTime()}] 绑定${input.runner === 'local' ? '本地命令' : '模拟'} runner：${command}`,
      `[${formatLogTime()}] 牛马开始进入工位。`
    ]
  };

  let changed = false;
  const agents = snapshot.agents.map((agent) => {
    if (agent.id !== input.agentId) {
      return agent;
    }
    changed = true;
    return {
      ...agent,
      status: 'active' as const,
      tasks: [task, ...agent.tasks].slice(0, 12)
    };
  });

  if (!changed) {
    return snapshot;
  }

  return syncAgentTaskRuntime(
    withMessage({
      ...snapshot,
      updatedAt: now,
      agents
    }, 'info', '任务已下发', `${getAgentName(agents, input.agentId)} 开始执行「${taskName}」。`, input.agentId),
    input.agentId
  );
}

export function stopTask(snapshot: AgentSnapshot, agentId: string, taskId: string): AgentSnapshot {
  const now = new Date().toISOString();
  let changed = false;

  const agents = snapshot.agents.map((agent) => {
    if (agent.id !== agentId) {
      return agent;
    }

    const tasks = agent.tasks.map((task) => {
      if (task.id !== taskId || task.status !== 'running') {
        return task;
      }
      changed = true;
      return {
        ...task,
        status: 'error' as const,
        progress: Math.max(task.progress, 8),
        endTime: now,
        logs: [...task.logs, `[${formatLogTime()}] 已人工停止。`],
        artifact: '任务被人工停止。'
      };
    });

    return {
      ...agent,
      status: tasks.some((task) => task.status === 'running') ? 'active' as const : 'idle' as const,
      tasks
    };
  });

  if (!changed) {
    return snapshot;
  }

  return syncAgentTaskRuntime(
    withMessage({ ...snapshot, agents, updatedAt: now }, 'warning', '任务已停止', `${getAgentName(agents, agentId)} 的任务已停止。`, agentId),
    agentId
  );
}

export function clearCompletedTasks(snapshot: AgentSnapshot, agentId: string): AgentSnapshot {
  const now = new Date().toISOString();
  let removed = 0;
  const agents = snapshot.agents.map((agent) => {
    if (agent.id !== agentId) {
      return agent;
    }

    const tasks = agent.tasks.filter((task) => {
      const keep = task.status === 'running';
      if (!keep) {
        removed += 1;
      }
      return keep;
    });

    return { ...agent, tasks };
  });

  if (removed === 0) {
    return snapshot;
  }

  return withMessage({ ...snapshot, agents, updatedAt: now }, 'info', '历史已清理', `已清理 ${removed} 条已完成任务。`, agentId);
}

export function applyNiuMaAction(snapshot: AgentSnapshot, agentId: string, action: NiuMaAction): AgentSnapshot {
  const current = snapshot.runtime[agentId] ?? createRuntimeState(agentId, new Date().toISOString());
  const now = new Date().toISOString();
  const patch = actionPatch(action);
  const status = patch.status;
  const isPie = action === 'pie';
  const nextRuntime: NiuMaRuntimeState = {
    ...current,
    status,
    energy: clamp(current.energy + patch.energy),
    stress: clamp(current.stress + patch.stress),
    temperature: Math.max(28, Math.min(120, current.temperature + patch.temperature)),
    quote: pickQuote(status, agentId, Date.now()),
    lastInteractionAt: now,
    customState: status,
    bubbleText: actionBubble(action),
    bubbleTimer: 4,
    isFueledByPie: isPie
  };

  return withMessage({
    ...snapshot,
    updatedAt: now,
    runtime: {
      ...snapshot.runtime,
      [agentId]: nextRuntime
    }
  }, patch.messageType, patch.messageTitle, `${getAgentName(snapshot.agents, agentId)}：${patch.messageBody}`, agentId);
}

export function progressRunningTasks(snapshot: AgentSnapshot): AgentSnapshot {
  const now = new Date().toISOString();
  let changed = false;

  const agents = snapshot.agents.map((agent) => {
    let agentChanged = false;
    const tasks = agent.tasks.map((task) => {
      if (task.status !== 'running' || task.runner === 'local') {
        return task;
      }

      changed = true;
      agentChanged = true;
      const nextProgress = Math.min(100, task.progress + 12 + Math.floor(Math.random() * 13));
      const done = nextProgress >= 100;
      const logs = [
        ...task.logs,
        done
          ? `[${formatLogTime()}] 任务完成，产物已写入模拟工单。`
          : `[${formatLogTime()}] 进度 ${nextProgress}%，正在消耗咖啡和意志力。`
      ].slice(-12);

      return {
        ...task,
        progress: nextProgress,
        status: done ? 'success' as const : 'running' as const,
        endTime: done ? now : undefined,
        logs,
        artifact: done ? `模拟产物：${agent.name} 已完成 ${task.name}` : undefined
      };
    });

    if (!agentChanged) {
      return agent;
    }

    return {
      ...agent,
      status: tasks.some((task) => task.status === 'running') ? 'active' as const : 'idle' as const,
      tasks
    };
  });

  if (!changed) {
    return snapshot;
  }

  const runtime = { ...snapshot.runtime };
  agents.forEach((agent) => {
    const current = runtime[agent.id] ?? createRuntimeState(agent.id, now);
    const hasRunning = agent.tasks.some((task) => task.status === 'running');
    const justDone = !hasRunning && snapshot.agents.find((item) => item.id === agent.id)?.tasks.some((task) => task.status === 'running');
    runtime[agent.id] = {
      ...current,
      status: hasRunning ? pickBusyStatus(agent.id, agent.tasks.length) : justDone ? 'done' : current.status,
      energy: clamp(current.energy + (hasRunning ? -4 : 1)),
      stress: clamp(current.stress + (hasRunning ? 6 : -3)),
      temperature: Math.max(31, Math.min(110, current.temperature + (hasRunning ? 2.7 : -1.8))),
      quote: hasRunning
        ? pickQuote(pickBusyStatus(agent.id, agent.tasks.length), agent.id, agent.tasks.length)
        : justDone
          ? pickQuote('done', agent.id, agent.tasks.length)
          : current.quote,
      lastInteractionAt: now,
      // 任务进行中时,投喂态(customState)被任务进度自动接管,但不重置 isFueledByPie
      customState: hasRunning ? null : current.customState
    };
  });

  return {
    ...snapshot,
    agents,
    runtime,
    updatedAt: now
  };
}

const REAL_TASK_BUSY_STATUSES: NiuMaStatus[] = ['coding', 'debugging', 'testing', 'demanding'];

function isDeployCommand(command: string) {
  const lower = command.toLowerCase();
  return lower.includes('deploy') || lower.includes('release');
}

export function getNiuMaEffectiveStatus(agent: AIAgent, runtime: NiuMaRuntimeState): NiuMaStatus {
  const runningTask = agent.tasks.find((task) => task.status === 'running');
  if (runningTask) {
    if (isDeployCommand(runningTask.command)) {
      return 'deploying';
    }
    if (runningTask.progress < 10) {
      return 'coding';
    }

    const index = Math.floor(runningTask.progress) % REAL_TASK_BUSY_STATUSES.length;
    return REAL_TASK_BUSY_STATUSES[index] ?? 'coding';
  }

  const latestTask = agent.tasks[0];
  if (latestTask?.status === 'error') {
    return 'panicking';
  }

  if (latestTask?.status === 'success' && latestTask.endTime) {
    const endedAt = Date.parse(latestTask.endTime);
    if (Number.isFinite(endedAt) && Date.now() - endedAt < 10_000) {
      return 'done';
    }
  }

  return runtime.customState ?? 'idle';
}

export function syncAgentTaskRuntime(snapshot: AgentSnapshot, agentId: string): AgentSnapshot {
  const agent = snapshot.agents.find((item) => item.id === agentId);
  if (!agent) {
    return snapshot;
  }

  const now = new Date().toISOString();
  const current = snapshot.runtime[agentId] ?? createRuntimeState(agentId, now);
  const hasRunning = agent.tasks.some((task) => task.status === 'running');
  const nextCustomState = hasRunning ? null : current.customState;
  const effectiveStatus = getNiuMaEffectiveStatus(agent, {
    ...current,
    customState: nextCustomState
  });
  const statusChanged = effectiveStatus !== current.status;

  const nextRuntime: NiuMaRuntimeState = {
    ...current,
    status: effectiveStatus,
    quote: statusChanged ? pickQuote(effectiveStatus, agent.id, agent.tasks.length) : current.quote,
    lastInteractionAt: statusChanged ? now : current.lastInteractionAt,
    customState: nextCustomState
  };

  if (
    nextRuntime.status === current.status &&
    nextRuntime.quote === current.quote &&
    nextRuntime.lastInteractionAt === current.lastInteractionAt &&
    nextRuntime.customState === current.customState
  ) {
    return snapshot;
  }

  return {
    ...snapshot,
    runtime: {
      ...snapshot.runtime,
      [agentId]: nextRuntime
    },
    updatedAt: now
  };
}

/**
 * Ranch 物理 tick (2s 一次)
 *  - 任务运行中:能量 -2, 压力 +5, 温度 +4 (被画饼时 -4 / +8 / +8)
 *  - 空闲休息:能量 +1, 压力 -2, 温度 -3
 *  - 喝水/咖啡/摸鱼态:能量 +8
 *  - bubble 计时器 -1, 到 0 清空 bubbleText
 *  - 30% 概率随机选一头空闲牛马触发台词 bubble
 */
export function progressNiuMaTick(snapshot: AgentSnapshot): AgentSnapshot {
  const now = new Date().toISOString();
  let changed = false;
  const nextRuntime: Record<string, NiuMaRuntimeState> = { ...snapshot.runtime };

  for (const agent of snapshot.agents) {
    const current = nextRuntime[agent.id] ?? createRuntimeState(agent.id, now);
    const isRunning = agent.tasks.some((task) => task.status === 'running');
    const nextCustomState = isRunning ? null : current.customState;
    const effectiveStatus = getNiuMaEffectiveStatus(agent, {
      ...current,
      customState: nextCustomState
    });
    const statusChanged = effectiveStatus !== current.status;
    const nextQuote = statusChanged ? pickQuote(effectiveStatus, agent.id, agent.tasks.length) : current.quote;

    const energyDelta = isRunning
      ? -(current.isFueledByPie ? 4 : 2)
      : current.customState === 'coffee' || current.customState === 'drinkingWater' || current.customState === 'slacking'
        ? 8
        : 1;
    const stressDelta = isRunning ? 5 : -2;
    const tempDelta = isRunning ? (current.isFueledByPie ? 8 : 4) : -3;

    const nextBubbleTimer = Math.max(0, current.bubbleTimer - 1);
    const bubbleText = nextBubbleTimer === 0 ? null : current.bubbleText;

    const updated: NiuMaRuntimeState = {
      ...current,
      status: effectiveStatus,
      energy: clamp(current.energy + energyDelta),
      stress: clamp(current.stress + stressDelta),
      temperature: Math.max(31, Math.min(110, current.temperature + tempDelta)),
      quote: nextQuote,
      lastInteractionAt: statusChanged ? now : current.lastInteractionAt,
      customState: nextCustomState,
      bubbleTimer: nextBubbleTimer,
      bubbleText
    };

    if (
      updated.energy !== current.energy ||
      updated.stress !== current.stress ||
      updated.temperature !== current.temperature ||
      updated.status !== current.status ||
      updated.quote !== current.quote ||
      updated.lastInteractionAt !== current.lastInteractionAt ||
      updated.customState !== current.customState ||
      updated.bubbleTimer !== current.bubbleTimer ||
      updated.bubbleText !== current.bubbleText
    ) {
      changed = true;
    }
    nextRuntime[agent.id] = updated;
  }

  // 30% 概率随机选一头牛马说话(仅在 bubble 为空时)
  if (Math.random() < 0.3) {
    const ids = Object.keys(nextRuntime);
    if (ids.length > 0) {
      const pickId = ids[Math.floor(Math.random() * ids.length)];
      const target = nextRuntime[pickId];
      if (target && !target.bubbleText) {
        const agent = snapshot.agents.find((item) => item.id === pickId);
        const meta = STATE_METAS[target.status];
        const quote = meta.quotes[Math.floor(Math.random() * meta.quotes.length)];
        nextRuntime[pickId] = {
          ...target,
          bubbleText: quote,
          bubbleTimer: 3
        };
        changed = true;
        // 抹平未使用变量告警
        void agent;
      }
    }
  }

  if (!changed) {
    return snapshot;
  }

  return {
    ...snapshot,
    runtime: nextRuntime,
    updatedAt: now
  };
}

/**
 * 点击牛马循环切态 — 14 态列表按位取下一个
 * 仅在无任务时有效(任务进度会自动接管)
 */
export function cycleNiuMaState(snapshot: AgentSnapshot, agentId: string): AgentSnapshot {
  const agent = snapshot.agents.find((item) => item.id === agentId);
  if (!agent) return snapshot;

  const hasRunning = agent.tasks.some((task) => task.status === 'running');
  if (hasRunning) {
    return snapshot;
  }

  const now = new Date().toISOString();
  const current = snapshot.runtime[agentId] ?? createRuntimeState(agentId, now);
  const order: NiuMaStatus[] = [
    'idle', 'coding', 'debugging', 'meeting', 'coffee', 'testing',
    'deploying', 'done', 'overtime', 'drinkingWater', 'panicking',
    'slacking', 'praying', 'demanding'
  ];

  const currentStatus: NiuMaStatus = current.customState ?? current.status;
  const idx = order.indexOf(currentStatus);
  const nextStatus = order[(idx + 1 + order.length) % order.length] ?? 'idle';
  const meta = STATE_METAS[nextStatus];

  const nextRuntime: NiuMaRuntimeState = {
    ...current,
    status: nextStatus,
    customState: nextStatus,
    bubbleText: `「状态切换至 ${meta.name}」${meta.quotes[0]}`,
    bubbleTimer: 4,
    lastInteractionAt: now
  };

  return withMessage({
    ...snapshot,
    updatedAt: now,
    runtime: { ...snapshot.runtime, [agentId]: nextRuntime }
  }, 'info', '牛马状态变更', `${getAgentName(snapshot.agents, agentId)}：${meta.name}`, agentId);
}

function normalizeAgent(value: unknown, index: number): AIAgent {
  const seed = AGENT_SEEDS[index] ?? AGENT_SEEDS[0];
  if (!isRecord(value)) {
    return { ...seed, tasks: [] };
  }

  const tasks = Array.isArray(value.tasks)
    ? value.tasks.map(normalizeTask).filter(Boolean).slice(0, 12) as AgentTask[]
    : [];

  return {
    ...seed,
    id: stringOr(value.id, seed.id),
    slot: stringOr(value.slot, seed.slot),
    name: stringOr(value.name, seed.name),
    codename: stringOr(value.codename, seed.codename),
    badge: stringOr(value.badge, seed.badge),
    avatar: stringOr(value.avatar, seed.avatar),
    description: stringOr(value.description, seed.description),
    status: tasks.some((task) => task.status === 'running') ? 'active' : 'idle',
    modelName: stringOr(value.modelName, seed.modelName),
    endpoint: stringOr(value.endpoint, seed.endpoint),
    accent: stringOr(value.accent, seed.accent),
    tasks
  };
}

function normalizeTask(value: unknown): AgentTask | null {
  if (!isRecord(value)) {
    return null;
  }

  const status = ['pending', 'running', 'success', 'error'].includes(String(value.status))
    ? value.status as AgentTask['status']
    : 'pending';
  const runner = value.runner === 'local' ? 'local' : 'simulated';
  const normalizedStatus: AgentTask['status'] = runner === 'local' && status === 'running' ? 'error' : status;

  return {
    id: stringOr(value.id, `task-${Date.now()}`),
    name: stringOr(value.name, '未命名任务'),
    status: normalizedStatus,
    progress: clamp(numberOr(value.progress, normalizedStatus === 'success' ? 100 : 0)),
    startTime: stringOr(value.startTime, new Date().toISOString()),
    endTime: typeof value.endTime === 'string' ? value.endTime : runner === 'local' && status === 'running' ? new Date().toISOString() : undefined,
    command: stringOr(value.command, 'agent run --mode simulated'),
    runner,
    pid: typeof value.pid === 'number' && Number.isFinite(value.pid) ? value.pid : undefined,
    exitCode: typeof value.exitCode === 'number' && Number.isFinite(value.exitCode) ? value.exitCode : undefined,
    logs: [
      ...(Array.isArray(value.logs) ? value.logs.filter((line): line is string => typeof line === 'string') : []),
      ...(runner === 'local' && status === 'running' ? [`[${formatLogTime()}] 桌面应用已重启，原本地进程句柄已失效。`] : [])
    ].slice(-80),
    artifact: typeof value.artifact === 'string'
      ? value.artifact
      : runner === 'local' && status === 'running'
        ? '本地进程因应用重启被标记为失效。'
        : undefined
  };
}

function normalizeRuntimeState(value: unknown, agentId: string, now: string): NiuMaRuntimeState {
  if (!isRecord(value)) {
    return createRuntimeState(agentId, now);
  }

  const status = Object.keys(STATE_METAS).includes(String(value.status))
    ? value.status as NiuMaStatus
    : 'idle';

  const customState = Object.keys(STATE_METAS).includes(String(value.customState))
    ? value.customState as NiuMaStatus
    : null;

  return {
    status,
    energy: clamp(numberOr(value.energy, 100)),
    stress: clamp(numberOr(value.stress, 18)),
    temperature: Math.max(30, Math.min(120, numberOr(value.temperature, 36.5))),
    quote: stringOr(value.quote, pickQuote(status, agentId, 0)),
    lastInteractionAt: stringOr(value.lastInteractionAt, now),
    customState,
    bubbleText: typeof value.bubbleText === 'string' && value.bubbleText.trim() ? value.bubbleText : null,
    bubbleTimer: clamp(numberOr(value.bubbleTimer, 0)),
    isFueledByPie: value.isFueledByPie === true
  };
}

function normalizeMessage(value: unknown): AgentSystemMessage | null {
  if (!isRecord(value)) {
    return null;
  }

  const type = ['info', 'success', 'warning', 'error'].includes(String(value.type))
    ? value.type as AgentSystemMessage['type']
    : 'info';

  return {
    id: stringOr(value.id, `msg-${Date.now()}`),
    timestamp: stringOr(value.timestamp, new Date().toISOString()),
    type,
    title: stringOr(value.title, '系统消息'),
    content: stringOr(value.content, ''),
    agentId: typeof value.agentId === 'string' && value.agentId.trim() ? value.agentId.trim() : undefined
  };
}

function createRuntimeState(agentId: string, now: string): NiuMaRuntimeState {
  return {
    status: 'idle',
    energy: 100,
    stress: 18,
    temperature: 36.5,
    quote: pickQuote('idle', agentId, 0),
    lastInteractionAt: now,
    customState: null,
    bubbleText: null,
    bubbleTimer: 0,
    isFueledByPie: false
  };
}

function actionPatch(action: NiuMaAction): {
  status: NiuMaStatus;
  energy: number;
  stress: number;
  temperature: number;
  messageType: AgentSystemMessage['type'];
  messageTitle: string;
  messageBody: string;
} {
  switch (action) {
    case 'pie':
      return {
        status: 'overtime',
        energy: 15,
        stress: 8,
        temperature: 4,
        messageType: 'warning',
        messageTitle: '鞭策牛马',
        messageBody: '你投喂了一个「晋升加薪」大饼,智能体瞬间进入疯狂超频(加班)状态,CPU 温度骤升!'
      };
    case 'coffee':
      return {
        status: 'coffee',
        energy: 24,
        stress: 5,
        temperature: 2,
        messageType: 'success',
        messageTitle: '投喂牛马',
        messageBody: '递过去一杯冰浓缩美式 ☕,智能体瞬间洗去疲惫,能量直接回满。'
      };
    case 'whip':
      return {
        status: 'coding',
        energy: -12,
        stress: 18,
        temperature: 8,
        messageType: 'error',
        messageTitle: '电击皮鞭',
        messageBody: '你使用了物理提效电击 ⚡,该智能体浑身发麻,惊恐之下疯狂敲打键盘!'
      };
    case 'slack':
      return {
        status: 'drinkingWater',
        energy: 8,
        stress: -18,
        temperature: -3,
        messageType: 'info',
        messageTitle: '体恤关怀',
        messageBody: '你批准了它的带薪摸鱼申请 🍵,智能体心存感激,端着水杯溜达去了。'
      };
    case 'poke':
      return {
        status: 'demanding',
        energy: -4,
        stress: 10,
        temperature: 3,
        messageType: 'info',
        messageTitle: '戳一下',
        messageBody: '你戳了它一下,这头牛马面露不悦,觉得需求又来了。'
      };
  }
}

function actionBubble(action: NiuMaAction): string {
  switch (action) {
    case 'pie':
      return '「画大饼成功 🥧」老板画的大饼太香了!工资画到 2030 年,牛马疯狂运转!';
    case 'coffee':
      return '「冰美式注入 ☕」纯纯的咖啡因!牛马能量值瞬间满血!又能再抗十个 Bug!';
    case 'whip':
      return '「电鞭拷打 ⚡」别打了别打了!键盘开始冒烟,正在拼命手敲二进制!';
    case 'slack':
      return '「批准摸鱼 🍵」多起立,多打水,只要老板没发现,牛马就一直在带薪摸鱼!';
    case 'poke':
      return '「戳我干嘛 👉」我可不是按钮,有事说事,没事别戳!';
  }
}

function withRuntimeStatus(snapshot: AgentSnapshot, agentId: string, status: NiuMaStatus): AgentSnapshot {
  const current = snapshot.runtime[agentId] ?? createRuntimeState(agentId, new Date().toISOString());
  return {
    ...snapshot,
    runtime: {
      ...snapshot.runtime,
      [agentId]: {
        ...current,
        status,
        quote: pickQuote(status, agentId, Date.now()),
        lastInteractionAt: new Date().toISOString()
      }
    }
  };
}

export function appendSystemMessage(
  snapshot: AgentSnapshot,
  type: AgentSystemMessage['type'],
  title: string,
  content: string,
  agentId?: string
): AgentSnapshot {
  return withMessage(snapshot, type, title, content, agentId);
}

function withMessage(
  snapshot: AgentSnapshot,
  type: AgentSystemMessage['type'],
  title: string,
  content: string,
  agentId?: string
): AgentSnapshot {
  return {
    ...snapshot,
    messages: [createMessage(type, title, content, agentId), ...snapshot.messages].slice(0, 80)
  };
}

function createMessage(
  type: AgentSystemMessage['type'],
  title: string,
  content: string,
  agentId?: string
): AgentSystemMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    type,
    title,
    content,
    agentId
  };
}

function pickBusyStatus(agentId: string, salt: number): NiuMaStatus {
  const statuses: NiuMaStatus[] = agentId === 'openclaw'
    ? ['debugging', 'panicking', 'testing']
    : agentId === 'openccode'
      ? ['deploying', 'praying', 'overtime']
      : agentId === 'minimax'
        ? ['meeting', 'coding', 'testing']
        : ['coding', 'debugging', 'overtime'];
  return statuses[(agentId.length + salt + Math.floor(Date.now() / 2500)) % statuses.length];
}

function pickQuote(status: NiuMaStatus, agentId: string, salt: number): string {
  const quotes = STATE_METAS[status].quotes;
  return quotes[(agentId.length + salt) % quotes.length];
}

function getAgentName(agents: AIAgent[], agentId: string) {
  return agents.find((agent) => agent.id === agentId)?.name ?? agentId;
}

function formatLogTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function numberOr(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
