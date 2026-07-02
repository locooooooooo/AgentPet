/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { DashboardConfig, LocalService, SystemMessage } from './src/types.js';

// Initialize Express
const app = express();
const PORT = 3000;

// Ensure JSON parsing is enabled
app.use(express.json({ limit: '10mb' }));

// Setup data directory and default config path
const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default Configuration
const DEFAULT_CONFIG: DashboardConfig = {
  services: [
    {
      id: 'srv-1',
      name: 'Nginx Gateway',
      category: 'Web Server',
      port: 80,
      url: 'http://localhost:80',
      icon: 'Globe',
      status: 'offline',
      description: '本地 Nginx 反向代理网关及静态资源服务器',
      pingType: 'tcp',
      isStarted: false
    },
    {
      id: 'srv-2',
      name: 'PostgreSQL Database',
      category: 'Database',
      port: 5432,
      url: 'postgresql://localhost:5432',
      icon: 'Database',
      status: 'offline',
      description: '主开发数据库，存储各类服务和开发数据',
      pingType: 'tcp',
      isStarted: false
    },
    {
      id: 'srv-3',
      name: 'Redis Cache',
      category: 'Database',
      port: 6379,
      url: 'redis://localhost:6379',
      icon: 'Zap',
      status: 'offline',
      description: '高性能内存键值数据库与缓存服务',
      pingType: 'tcp',
      isStarted: false
    },
    {
      id: 'srv-4',
      name: 'Docker Daemon',
      category: 'Dev Tool',
      port: 2375,
      url: 'http://localhost:2375',
      icon: 'Container',
      status: 'offline',
      description: '本地 Docker 守护进程管理端口',
      pingType: 'tcp',
      isStarted: false
    },
    {
      id: 'srv-5',
      name: 'Jenkins CI/CD',
      category: 'Dev Tool',
      port: 8080,
      url: 'http://localhost:8080',
      icon: 'Cpu',
      status: 'offline',
      description: '持续集成和自动化部署流水线控制台',
      pingType: 'http',
      isStarted: false
    },
    {
      id: 'srv-6',
      name: 'Prometheus',
      category: 'NAS & Monitor',
      port: 9090,
      url: 'http://localhost:9090',
      icon: 'TrendingUp',
      status: 'offline',
      description: '系统时序指标监控与报警收集器',
      pingType: 'http',
      isStarted: false
    }
  ],
  links: [
    {
      id: 'lnk-1',
      title: 'GitHub Desktop',
      url: 'https://github.com',
      category: '开发平台',
      description: '全球开发者代码托管与协作平台',
      icon: 'Github'
    },
    {
      id: 'lnk-2',
      title: 'AI Studio Build',
      url: 'https://ai.studio/build',
      category: 'AI 工具',
      description: 'Google 开发者智能构建平台',
      icon: 'Sparkles'
    },
    {
      id: 'lnk-3',
      title: 'StackOverflow',
      url: 'https://stackoverflow.com',
      category: '开发平台',
      description: '程序员技术问答与社区分享平台',
      icon: 'HelpCircle'
    },
    {
      id: 'lnk-4',
      title: 'V2EX',
      url: 'https://v2ex.com',
      category: '技术社区',
      description: '一个关于创意者和开发者的社区',
      icon: 'MessageSquare'
    }
  ],
  plugins: [
    {
      id: 'plg-sys',
      name: '系统负载模拟看板',
      description: '实时显示 CPU、内存及网络吞吐指标（基于高频刷新引擎）。',
      icon: 'Activity',
      version: '1.0.0',
      author: 'Admin',
      enabled: true,
      code: `// 系统监控插件逻辑
const canvas = document.createElement('canvas');
canvas.style.width = '100%';
canvas.style.height = '120px';
canvas.height = 120;
const ctx = canvas.getContext('2d');

let history = Array(40).fill(0).map(() => Math.random() * 30 + 15);

function draw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 模拟一些新数据
  history.shift();
  const lastVal = history[history.length - 1];
  const change = (Math.random() - 0.5) * 10;
  const newVal = Math.min(Math.max(lastVal + change, 5), 95);
  history.push(newVal);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  
  const step = canvas.width / (history.length - 1);
  for (let i = 0; i < history.length; i++) {
    const x = i * step;
    const y = canvas.height - (history[i] / 100) * (canvas.height - 20) - 10;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fill();

  // 绘制线条
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < history.length; i++) {
    const x = i * step;
    const y = canvas.height - (history[i] / 100) * (canvas.height - 20) - 10;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // 显示实时数值
  ctx.fillStyle = '#f3f4f6';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(\`CPU: \${newVal.toFixed(1)}% | MEM: 48.2% | NET: 2.1 MB/s\`, 10, 20);
}

const interval = setInterval(draw, 1000);
container.appendChild(canvas);

// 返回一个清理函数
return () => {
  clearInterval(interval);
};`
    },
    {
      id: 'plg-note',
      name: '智能备忘便签',
      description: '轻量级的 Markdown 本地速记便签，支持快速检索与内容分级。',
      icon: 'FileText',
      version: '1.0.1',
      author: 'Admin',
      enabled: true,
      code: `// 创建便签 UI
const textarea = document.createElement('textarea');
textarea.className = 'w-full h-28 bg-neutral-800 text-neutral-200 p-2 rounded text-xs border border-neutral-700 focus:outline-none focus:border-indigo-500 resize-none font-sans';
textarea.placeholder = '输入你的速记内容，系统会自动保存在本地缓存中...';
textarea.value = localStorage.getItem('nav_plugin_notes') || '';

textarea.addEventListener('input', (e) => {
  localStorage.setItem('nav_plugin_notes', e.target.value);
});

container.appendChild(textarea);`
    }
  ],
  messages: [
    {
      id: 'msg-1',
      timestamp: new Date().toISOString(),
      type: 'info',
      title: '系统面板初始化成功',
      content: '高性能本地导航面板已成功加载，包含 6 项默认端口监控，支持多通道 TCP 级测试。'
    }
  ],
  agents: [
    {
      id: 'codex',
      name: 'Codex Agent',
      avatar: '💻',
      description: '本地源码分析与测试套件自动化生成智能体',
      status: 'idle',
      modelName: 'Gemini 2.5 Flash / Codex-V3',
      endpoint: 'http://localhost:5100',
      tasks: [
        {
          id: 'tsk-codex-1',
          name: '自动化单元测试覆盖 (Coverage)',
          status: 'success',
          progress: 100,
          startTime: '2026-06-29 09:30:15',
          endTime: '2026-06-29 09:32:00',
          command: 'npm run test:cov',
          logs: [
            '[Process 48102] Codex Agent initiated.',
            '[Process 48102] Analysis of repository file system completed (24 files found).',
            '[Process 48102] Writing test cases to /tests/auth.test.ts',
            '[Process 48102] Running coverage reports...',
            '[Process 48102] Process exited with status 0 (Success).'
          ]
        }
      ]
    },
    {
      id: 'trae',
      name: 'Trae Agent',
      avatar: '🚀',
      description: '极速架构重构与多文件依赖关联编排智能体',
      status: 'idle',
      modelName: 'Claude 3.5 Sonnet / Trae-Engine',
      endpoint: 'http://localhost:5200',
      tasks: [
        {
          id: 'tsk-trae-1',
          name: '服务间依赖关系树分析',
          status: 'success',
          progress: 100,
          startTime: '2026-06-29 09:12:00',
          endTime: '2026-06-29 09:13:40',
          command: 'trae-dep --analyze',
          logs: [
            '[Trae Engine] Triggering dependency resolution...',
            '[Trae Engine] Found 14 local web service routes.',
            '[Trae Engine] Dependency tree constructed in memory.',
            '[Trae Engine] Output mapped to /data/deps.json successfully.'
          ]
        },
        {
          id: 'tsk-trae-2',
          name: '重构数据库连接池泄漏',
          status: 'error',
          progress: 45,
          startTime: '2026-06-29 09:45:00',
          command: 'trae-leak --fix',
          logs: [
            '[Trae Engine] Parsing /src/db/connection.ts...',
            '[Trae Engine] Analyzing heap allocation of pg pool client...',
            '[Trae Engine] ERROR: Failed to patch connection leaks - permission denied on system sockets.'
          ]
        }
      ]
    },
    {
      id: 'qoder',
      name: 'Qoder Agent',
      avatar: '🧠',
      description: '高性能底层算法调优与安全性合规漏洞扫描智能体',
      status: 'idle',
      modelName: 'DeepSeek-R1 / Qoder-Core',
      endpoint: 'http://localhost:5300',
      tasks: [
        {
          id: 'tsk-qoder-1',
          name: 'SHA-256 加密算法性能基准测试',
          status: 'success',
          progress: 100,
          startTime: '2026-06-29 09:22:11',
          endTime: '2026-06-29 09:23:05',
          command: 'qoder-bench --algo sha256',
          logs: [
            '[Qoder AI] Init performance benchmarking...',
            '[Qoder AI] Running SHA-256 over 10M operations...',
            '[Qoder AI] Benchmark completed. Mean latency: 0.045ms/op.'
          ]
        }
      ]
    },
    {
      id: 'minimax',
      name: 'Minimax Agent',
      avatar: '🎨',
      description: '富交互 UI 组件渲染与前端用户体验设计智能体',
      status: 'idle',
      modelName: 'MiniMax-Abab6.5 / UI-Gen',
      endpoint: 'http://localhost:5400',
      tasks: [
        {
          id: 'tsk-mini-1',
          name: '响应式 Bento 侧边栏交互演进',
          status: 'success',
          progress: 100,
          startTime: '2026-06-29 08:55:00',
          endTime: '2026-06-29 08:57:30',
          command: 'minimax-ui --theme bento',
          logs: [
            '[MiniMax UI] Loaded Bento configuration.',
            '[MiniMax UI] Re-calculating grids for view ports.',
            '[MiniMax UI] Applying smooth transition animations.'
          ]
        }
      ]
    },
    {
      id: 'workbuddy',
      name: 'Workbuddy Agent',
      avatar: '💼',
      description: '全天候智能协同工作助理，支持自动化日程安排与文件管理',
      status: 'idle',
      modelName: 'Gemini 2.5 Flash / Work-Buddy-v1.2',
      endpoint: 'http://localhost:5500',
      tasks: [
        {
          id: 'tsk-work-1',
          name: '同步开发周报与待办清单',
          status: 'success',
          progress: 100,
          startTime: '2026-06-29 08:30:00',
          endTime: '2026-06-29 08:31:12',
          command: 'workbuddy --sync-weekly',
          logs: [
            '[Workbuddy] Synchronizing tasks with Microsoft To Do...',
            '[Workbuddy] Synced 12 items. Generating draft weekly report...',
            '[Workbuddy] Draft completed and saved to workbuddy/weekly_draft.md'
          ]
        }
      ]
    },
    {
      id: 'openclaw',
      name: 'OpenClaw Agent',
      avatar: '🦞',
      description: '智能代码库重构、高精度自动化 Bug 定位与全局漏洞挖掘智能体',
      status: 'idle',
      modelName: 'Claude 3.5 Sonnet / OpenClaw-v2.0',
      endpoint: 'http://localhost:5600',
      tasks: []
    },
    {
      id: 'openccode',
      name: 'OpenCCode Agent',
      avatar: '🛠️',
      description: '云原生容器化部署与 Kubernetes 全自动运维配置编排智能体',
      status: 'idle',
      modelName: 'DeepSeek-Coder / OpenCCode-v1.5',
      endpoint: 'http://localhost:5700',
      tasks: []
    },
    {
      id: 'hermes',
      name: 'Hermes Agent',
      avatar: '⚡',
      description: '超高速高并发网络抓取、安全边界测试与流量流控管理智能体',
      status: 'idle',
      modelName: 'Llama-3-70B / Hermes-OS',
      endpoint: 'http://localhost:5800',
      tasks: []
    }
  ],
  settings: {
    darkMode: true,
    refreshInterval: 10,
    autoRefresh: true,
    layoutMode: 'bento',
    systemName: 'DevCenter 个人导航面板',
    showServices: true,
    showAgents: true,
    showPlugins: true,
    showBookmarks: true,
    showCommands: true,
    showLogs: true,
    showAssistant: true,
    showWinDevSuite: true
  }
};

// Load configuration helper
function loadConfig(): DashboardConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      // Ensure essential fields exist
      const loadedAgents = parsed.agents || DEFAULT_CONFIG.agents;
      const mergedAgents = [...loadedAgents];
      DEFAULT_CONFIG.agents.forEach(defAgent => {
        if (!mergedAgents.some(a => a.id === defAgent.id)) {
          mergedAgents.push(defAgent);
        }
      });
      return {
        services: parsed.services || DEFAULT_CONFIG.services,
        links: parsed.links || DEFAULT_CONFIG.links,
        plugins: parsed.plugins || DEFAULT_CONFIG.plugins,
        messages: parsed.messages || DEFAULT_CONFIG.messages,
        agents: mergedAgents,
        settings: { ...DEFAULT_CONFIG.settings, ...parsed.settings }
      };
    }
  } catch (error) {
    console.error('Error reading config file, using defaults:', error);
  }
  return DEFAULT_CONFIG;
}

// Save configuration helper
function saveConfig(config: DashboardConfig) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

// TCP Port Checker
function checkTcpPort(port: number, host: string = '127.0.0.1', timeout: number = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      if (!isResolved) {
        isResolved = true;
        resolve(true);
        socket.destroy();
      }
    });

    socket.on('timeout', () => {
      if (!isResolved) {
        isResolved = true;
        resolve(false);
        socket.destroy();
      }
    });

    socket.on('error', () => {
      if (!isResolved) {
        isResolved = true;
        resolve(false);
        socket.destroy();
      }
    });

    socket.connect(port, host);
  });
}

// HTTP Checker
async function checkHttpStatus(url: string, timeout: number = 2000): Promise<boolean> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const cleanUrl = url.trim();
    const res = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (PersonalServiceDashboard; Port Monitor)'
      },
      signal: controller.signal
    });
    clearTimeout(id);
    return res.status >= 200 && res.status < 400;
  } catch (err) {
    clearTimeout(id);
    return false;
  }
}

// Initialize Gemini client (Lazy initialization)
let ai: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      ai = new GoogleGenAI({ apiKey });
    }
  }
  return ai;
}

// --- API ROUTES ---

// 1. Get entire configuration
app.get('/api/config', (req, res) => {
  const config = loadConfig();
  res.json(config);
});

// 2. Save entire configuration
app.post('/api/config', (req, res) => {
  const newConfig = req.body as DashboardConfig;
  if (!newConfig) {
    return res.status(400).json({ error: 'Invalid configuration payload' });
  }
  saveConfig(newConfig);
  res.json({ success: true, message: '配置已安全保存至本地磁盘' });
});

// 3. Ping single service
app.post('/api/ping-service', async (req, res) => {
  const service = req.body as LocalService;
  if (!service) {
    return res.status(400).json({ error: 'Service details required' });
  }

  let isAlive = false;

  try {
    if (service.port === 3000 || (service.url && (service.url.includes(':3000') || service.url.includes('localhost:3000') || service.url.includes('127.0.0.1:3000')))) {
      isAlive = true;
    } else if (service.pingType === 'tcp' && service.port) {
      // Parse host from URL, default to 127.0.0.1
      let host = '127.0.0.1';
      try {
        if (service.url.includes('://')) {
          const u = new URL(service.url);
          host = u.hostname || '127.0.0.1';
        }
      } catch (e) {
        // Fallback parser for non-standard schemes (like redis://, postgresql://)
        const match = service.url.match(/\/\/([^:/]+)/);
        if (match) host = match[1];
      }
      isAlive = await checkTcpPort(service.port, host);
    } else if (service.pingType === 'http') {
      isAlive = await checkHttpStatus(service.url);
    } else {
      isAlive = true; // None pingType always reports active
    }
  } catch (error) {
    isAlive = false;
  }

  res.json({ id: service.id, status: isAlive ? 'online' : 'offline' });
});

// 4. Batch ping all services (Highly optimized for speed)
app.post('/api/ping-all', async (req, res) => {
  const { services } = req.body as { services: LocalService[] };
  if (!services || !Array.isArray(services)) {
    return res.status(400).json({ error: 'Services list required' });
  }

  const checkPromises = services.map(async (service) => {
    let isAlive = false;
    try {
      if (service.port === 3000 || (service.url && (service.url.includes(':3000') || service.url.includes('localhost:3000') || service.url.includes('127.0.0.1:3000')))) {
        isAlive = true;
      } else if (service.pingType === 'tcp' && service.port) {
        let host = '127.0.0.1';
        try {
          if (service.url.includes('://')) {
            const u = new URL(service.url);
            host = u.hostname || '127.0.0.1';
          }
        } catch (e) {
          const match = service.url.match(/\/\/([^:/]+)/);
          if (match) host = match[1];
        }
        isAlive = await checkTcpPort(service.port, host);
      } else if (service.pingType === 'http') {
        isAlive = await checkHttpStatus(service.url);
      } else {
        isAlive = true;
      }
    } catch (e) {
      isAlive = false;
    }
    return { id: service.id, status: isAlive ? 'online' : 'offline' as const };
  });

  const results = await Promise.all(checkPromises);
  res.json(results);
});

// 5. Trigger startup command simulation
app.post('/api/launch-service', (req, res) => {
  const { serviceId, name, startupCommand } = req.body as { serviceId: string; name: string; startupCommand?: string };
  if (!serviceId) {
    return res.status(400).json({ error: 'Service ID required' });
  }

  // Create a message log entry on server and return it
  const timestamp = new Date().toISOString();
  const commandLog = startupCommand ? `执行指令: \`${startupCommand}\`` : `尝试唤起服务启动程序`;
  
  const newLog: SystemMessage = {
    id: `msg-${Date.now()}`,
    timestamp,
    type: 'success',
    title: `启动服务: ${name}`,
    content: `${commandLog}。启动信号已发送。正在侦测端口是否变为监听状态。`,
    serviceId
  };

  res.json({
    success: true,
    message: `${name} 启动中...`,
    log: newLog
  });
});

// 6. Gemini Assistant / Copilot Endpoint (Help compile custom plugins or debug config)
app.post('/api/ai-assist', async (req, res) => {
  const { prompt, context } = req.body as { prompt: string; context?: any };
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const client = getGemini();
  if (!client) {
    return res.json({
      reply: `⚠️ **未配置有效 Gemini API Key**\n\n请在右侧或左下角的 **Settings (Secrets)** 菜单中添加 \`GEMINI_API_KEY\` 键和您的 API Key。配置完毕后，AI Assistant 即可为您自动提供：\n1. **一键生成插件代码**（系统图表、API 聚合、小组件等）\n2. **编写 Nginx 路由及 docker-compose 模板**\n3. **诊断本地服务端口冲突**。`
    });
  }

  try {
    const systemInstruction = `
You are a helpful, professional system developer and operations copilot inside a Personal Service Navigation Panel.
You help the user manage local docker containers, local development ports, services (nginx, redis, psql, prometheus, node.js), write script shortcuts, and design custom dashboard plugins.

If the user wants a new custom plugin, please reply with a JSON block containing the plugin specification, and a text explanation.
For example, if you output a plugin code block, format it inside markdown like:
\`\`\`javascript
// plugin code
\`\`\`

The plugin's javascript execution context gives them an HTML div element named 'container' to append child elements, and they can store state in 'localStorage'. To clean up event handlers or timers, they should return a cleanup function.
Keep your response professional, highly functional, and in elegant Chinese as requested by the user.
`;

    const chatSession = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemInstruction}\n\nContext:\n${JSON.stringify(context || {})}\n\nUser Question:\n${prompt}` }] }
      ]
    });

    res.json({ reply: chatSession.text });
  } catch (error: any) {
    console.error('Gemini error:', error);
    res.status(500).json({ error: error.message || 'AI 助手调用失败，请检查配置或重试' });
  }
});

// --- AI Agent Multi-Tasking Endpoints & Process Simulation ---

const SIMULATION_LOGS_TEMPLATES: Record<string, Record<number, string>> = {
  codex: {
    20: '[Codex Agent] 分析本地源码依赖树，载入编译器状态...',
    40: '[Codex Agent] 检测到 8 个活跃文件模块，正在对目标类与函数进行符号解析...',
    60: '[Codex Agent] 发现 3 个测试边缘场景漏洞，正在智能生成自动测试套件...',
    80: '[Codex Agent] 执行本地测试试运行以校验通过率 (Pass Rate)...',
    100: '[Codex Agent] 任务圆满完成。自动生成文件及校验报告已部署。'
  },
  trae: {
    20: '[Trae Engine] 解析系统多文件关联性，构建依赖拓扑...',
    40: '[Trae Engine] 调取底层代码重构模块，优化冗余路由及死循环...',
    60: '[Trae Engine] 检测本地编译冲突... 代码成功通过局部类型校验。',
    80: '[Trae Engine] 安全地将重构代码输出写入至工作区暂存盘...',
    100: '[Trae Engine] 重构与编译流式执行已就绪。所有端口连通无异常！'
  },
  qoder: {
    20: '[Qoder AI] 调入漏洞数据库特征库，启动本地微内核漏洞审计...',
    40: '[Qoder AI] 检测到 12 个公开端口暴露威胁，启动动态边界防御调优...',
    60: '[Qoder AI] 正在重写不安全的指针释放和缓冲区操作...',
    80: '[Qoder AI] 回归测试底层密码学实现与数据签名算法性能...',
    100: '[Qoder AI] 底层深度安全加固与基准性能测试顺利完成！'
  },
  minimax: {
    20: '[MiniMax UI] 载入 Tailwind 配置特征，智能分析样式层次与对比度...',
    40: '[MiniMax UI] 生成全新流式响应式组件布局代码...',
    60: '[MiniMax UI] 在虚拟 Canvas 容器上进行多次界面绘制渲染测试...',
    80: '[MiniMax UI] 调优 hover 与 focus 微交互，注入流畅过渡动画特效...',
    100: '[MiniMax UI] 气泡效果渲染及样式注入完毕，前台看板同步展示！'
  },
  workbuddy: {
    20: '[Workbuddy Agent] 载入全天候协同控制链，同步您的企业日历和邮件索引...',
    40: '[Workbuddy Agent] 识别出 5 项待办计划并完成冲突碰撞检测...',
    60: '[Workbuddy Agent] 正在根据日常开发偏好自动整理周报与待办清单模型...',
    80: '[Workbuddy Agent] 开始拉取远程协作平台的最新通知，聚合同步至飞书/企业微信/Slack...',
    100: '[Workbuddy Agent] 日程冲突检测与全天候协同辅助执行成功。牛马精神注入完毕！'
  },
  openclaw: {
    20: '[OpenClaw] 开始深度遍历项目代码根目录，加载 SAST 安全漏洞扫描引擎...',
    40: '[OpenClaw] 扫描到 3 处可能导致进程中断的未捕获 Promise 异常 and 跨域漏洞...',
    60: '[OpenClaw] 自动对全局异常处理机制与安全签名证书链进行就地代码重写...',
    80: '[OpenClaw] 运行本地模拟黑客沙盒对修改后的端口进行流量重放验证...',
    100: '[OpenClaw] 安全审计与就地缺陷热修复成功结束，系统安全评级已提升至 AAA！'
  },
  openccode: {
    20: '[OpenCCode] 正在与本地 Windows Docker 守护进程及 WSL 网络层对接套接字...',
    40: '[OpenCCode] 检测到 docker-compose.yml 存在遗留端口冲突，正在计算映射偏移量...',
    60: '[OpenCCode] 自动生成高可用的 k8s Deployment 编排定义与 Service 路由图...',
    80: '[OpenCCode] 触发本地多容器快速拉起，检查端口健康探测响应...',
    100: '[OpenCCode] 云原生容器化部署与 K8s 运行编排已准备完毕。Pod 正常拉起！'
  },
  hermes: {
    20: '[Hermes OS] 启动高并发异步网络爬虫与边界安全防御检测集群...',
    40: '[Hermes OS] 解析目标数据源站点拓扑，对 XHR 和静态 DOM 加载并发重试策略...',
    60: '[Hermes OS] 数据清洗管道启动：过滤脏数据、智能分类并格式化为 TS 实体模型...',
    80: '[Hermes OS] 建立断点续传和多进程内存隔离保护，保障大流量传输稳定性...',
    100: '[Hermes OS] 高并发抓取与边界流量测试顺利闭环。共抓取 45,210 条结构化数据。'
  }
};

// Background task progression simulation
setInterval(() => {
  const config = loadConfig();
  if (!config.agents) return;

  let hasChanges = false;
  config.agents = config.agents.map((agent) => {
    let agentChanged = false;
    const updatedTasks = agent.tasks.map((task) => {
      if (task.status === 'running') {
        hasChanges = true;
        agentChanged = true;
        const nextProgress = Math.min(task.progress + 20, 100);
        const newLogs = [...task.logs];
        
        const agentLogs = SIMULATION_LOGS_TEMPLATES[agent.id];
        if (agentLogs && agentLogs[nextProgress]) {
          newLogs.push(agentLogs[nextProgress]);
        } else {
          newLogs.push(`[Progress ${nextProgress}%] Process standard output telemetry streaming...`);
        }

        const isDone = nextProgress === 100;
        return {
          ...task,
          progress: nextProgress,
          status: isDone ? 'success' as const : ('running' as const),
          endTime: isDone ? new Date().toISOString() : undefined,
          logs: newLogs,
          artifact: isDone ? `Result: Execution finished successfully in ${agent.name}.` : undefined
        };
      }
      return task;
    });

    const isAnyRunning = updatedTasks.some(t => t.status === 'running');
    return {
      ...agent,
      status: isAnyRunning ? 'active' as const : ('idle' as const),
      tasks: updatedTasks
    };
  });

  if (hasChanges) {
    saveConfig(config);
  }
}, 3000);

// 1. Create agent task
app.post('/api/agents/tasks/create', (req, res) => {
  const { agentId, taskName, command } = req.body as { agentId: string; taskName: string; command?: string };
  if (!agentId || !taskName) {
    return res.status(400).json({ error: 'Agent ID and task name are required.' });
  }

  const config = loadConfig();
  if (!config.agents) {
    config.agents = [];
  }

  let targetAgent = config.agents.find(a => a.id === agentId);
  if (!targetAgent) {
    return res.status(404).json({ error: `Agent with ID ${agentId} not found.` });
  }

  const newTask = {
    id: `tsk-${Date.now()}`,
    name: taskName,
    status: 'running' as const,
    progress: 0,
    startTime: new Date().toISOString(),
    command: command || 'node agent.js',
    logs: [
      `[SYSTEM] [EXEC_START] Task process registered on local system core.`,
      `[SYSTEM] [PORT_LISTEN] Connected to Virtual agent endpoint: ${targetAgent.endpoint}`,
      `[SYSTEM] Executing command template: \`${command || 'node agent.js'}\`...`
    ]
  };

  targetAgent.tasks = [newTask, ...targetAgent.tasks];
  targetAgent.status = 'active';

  // Log inside System Notification Logs
  const systemLog: SystemMessage = {
    id: `msg-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'success',
    title: `${targetAgent.name}: 启动任务`,
    content: `指令「${taskName}」已下发。本地代理端口 ${targetAgent.endpoint} 已处于进程对接监听状态。`
  };
  config.messages = [systemLog, ...config.messages].slice(0, 100);

  saveConfig(config);
  res.json({ success: true, task: newTask });
});

// 2. Stop agent task
app.post('/api/agents/tasks/stop', (req, res) => {
  const { agentId, taskId } = req.body as { agentId: string; taskId: string };
  if (!agentId || !taskId) {
    return res.status(400).json({ error: 'Agent ID and task ID are required.' });
  }

  const config = loadConfig();
  if (!config.agents) return res.status(404).json({ error: 'No agents registered.' });

  const targetAgent = config.agents.find(a => a.id === agentId);
  if (!targetAgent) return res.status(404).json({ error: 'Agent not found.' });

  targetAgent.tasks = targetAgent.tasks.map(t => {
    if (t.id === taskId) {
      return {
        ...t,
        status: 'error' as const,
        logs: [...t.logs, `[SYSTEM] [TERMINATED] 任务已被管理员手动强制中断。进程信号: SIGKILL (exited with status 137).`]
      };
    }
    return t;
  });

  const isAnyRunning = targetAgent.tasks.some(t => t.status === 'running');
  targetAgent.status = isAnyRunning ? 'active' : 'idle';

  const systemLog: SystemMessage = {
    id: `msg-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'warning',
    title: `${targetAgent.name}: 强制终止进程`,
    content: `管理员手动终止了正在执行的任务线程。进程资源与代理套接字已安全回收。`
  };
  config.messages = [systemLog, ...config.messages].slice(0, 100);

  saveConfig(config);
  res.json({ success: true });
});

// 3. Clear agent completed tasks
app.post('/api/agents/tasks/clear', (req, res) => {
  const { agentId } = req.body as { agentId: string };
  if (!agentId) {
    return res.status(400).json({ error: 'Agent ID required.' });
  }

  const config = loadConfig();
  if (!config.agents) return res.status(404).json({ error: 'No agents registered.' });

  const targetAgent = config.agents.find(a => a.id === agentId);
  if (!targetAgent) return res.status(404).json({ error: 'Agent not found.' });

  // Keep running tasks, clear others
  targetAgent.tasks = targetAgent.tasks.filter(t => t.status === 'running');

  saveConfig(config);
  res.json({ success: true });
});


// --- VITE MIDDLEWARE SETUP & STATIC SERVING ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
