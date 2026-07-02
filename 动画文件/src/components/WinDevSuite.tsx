/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DynamicIcon from './DynamicIcon';
import { DashboardConfig, SystemMessage } from '../types';

interface WinDevSuiteProps {
  config: DashboardConfig;
  onAddSystemLog: (title: string, content: string, type: SystemMessage['type']) => void;
}

type TabType = 'diagnostics' | 'apiTester' | 'codec' | 'gitTerm';

export default function WinDevSuite({ config, onAddSystemLog }: WinDevSuiteProps) {
  const [activeTab, setActiveTab] = useState<TabType>('diagnostics');

  // --- TAB 1: DIAGNOSTICS STATES ---
  const [portInput, setPortInput] = useState('3000');
  const [portCheckResult, setPortCheckResult] = useState<any>(null);
  const [portChecking, setPortChecking] = useState(false);
  const [envSearch, setEnvSearch] = useState('');
  
  // Mock WSL Instances
  const [wslDistros, setWslDistros] = useState([
    { name: 'Ubuntu-22.04', status: 'Running', version: '2', ip: '172.29.41.12' },
    { name: 'Debian', status: 'Stopped', version: '2', ip: '-' },
    { name: 'docker-desktop', status: 'Running', version: '2', ip: '172.29.32.1' },
    { name: 'docker-desktop-data', status: 'Running', version: '2', ip: '-' },
  ]);

  // Mock Windows Environment Variables
  const [envVars, setEnvVars] = useState([
    { name: 'Path', value: 'C:\\Windows\\system32;C:\\Program Files\\nodejs\\;C:\\HashiCorp\\Vagrant\\bin;%USERPROFILE%\\AppData\\Local\\Microsoft\\WindowsApps' },
    { name: 'JAVA_HOME', value: 'C:\\Program Files\\Java\\jdk-17.0.5' },
    { name: 'NODE_ENV', value: 'development' },
    { name: 'DOCKER_HOST', value: 'tcp://localhost:2375' },
    { name: 'WSL_DISTRO_NAME', value: 'Ubuntu-22.04' },
    { name: 'COMSPEC', value: 'C:\\Windows\\system32\\cmd.exe' },
    { name: 'PROCESSOR_ARCHITECTURE', value: 'AMD64' },
    { name: '.NET_SDK_ROOT', value: 'C:\\Program Files\\dotnet' },
  ]);
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');

  // Mock Hosts File Content
  const [hostsFile, setHostsFile] = useState(`# Windows Hosts File (C:\\Windows\\System32\\drivers\\etc\\hosts)
127.0.0.1       localhost
::1             localhost
127.0.0.1       dev.local
127.0.0.1       postgres.local
127.0.0.1       redis.local
127.0.0.1       nginx.gateway.internal`);
  const [newHostIp, setNewHostIp] = useState('127.0.0.1');
  const [newHostDomain, setNewHostDomain] = useState('');

  // --- TAB 2: API TESTER STATES & MULTI-TABS INTERFACE ---
  interface SandboxTab {
    id: string;
    name: string;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers: Array<{ key: string; value: string }>;
    body: string;
    response: any;
    responseStatus: number | null;
    latency: number | null;
  }

  const [apiEnvVars, setApiEnvVars] = useState<Array<{ key: string; value: string }>>(() => {
    const saved = localStorage.getItem('api_sandbox_env_vars');
    return saved ? JSON.parse(saved) : [
      { key: 'BASE_URL', value: 'https://jsonplaceholder.typicode.com' },
      { key: 'TOKEN', value: 'bearer_token_123456_xyz' }
    ];
  });

  const [apiNewEnvKey, setApiNewEnvKey] = useState('');
  const [apiNewEnvVal, setApiNewEnvVal] = useState('');

  const [sandboxTabs, setSandboxTabs] = useState<SandboxTab[]>(() => {
    const saved = localStorage.getItem('api_sandbox_tabs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'tab-1',
        name: '获取文章列表 (GET)',
        url: '{{BASE_URL}}/posts/1',
        method: 'GET',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{TOKEN}}' }
        ],
        body: '{\n  "title": "foo"\n}',
        response: null,
        responseStatus: null,
        latency: null
      },
      {
        id: 'tab-2',
        name: '新增测试文章 (POST)',
        url: '{{BASE_URL}}/posts',
        method: 'POST',
        headers: [
          { key: 'Content-Type', value: 'application/json' }
        ],
        body: '{\n  "title": "新开发功能",\n  "body": "全栈极速 REST API 调试沙箱测试内容",\n  "userId": 1\n}',
        response: null,
        responseStatus: null,
        latency: null
      }
    ];
  });

  const [activeSandboxTabId, setActiveSandboxTabId] = useState<string>('tab-1');
  const [apiLoading, setApiLoading] = useState(false);
  const [showCodeExport, setShowCodeExport] = useState<'curl' | 'fetch' | 'axios' | null>(null);

  // Sync state to local persistence
  useEffect(() => {
    localStorage.setItem('api_sandbox_env_vars', JSON.stringify(apiEnvVars));
  }, [apiEnvVars]);

  useEffect(() => {
    localStorage.setItem('api_sandbox_tabs', JSON.stringify(sandboxTabs));
  }, [sandboxTabs]);

  const activeSandboxTab = sandboxTabs.find(t => t.id === activeSandboxTabId) || sandboxTabs[0] || {
    id: 'tab-1',
    name: '默认接口 (GET)',
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    method: 'GET',
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    body: '',
    response: null,
    responseStatus: null,
    latency: null
  };

  const updateActiveTab = (updates: Partial<SandboxTab>) => {
    setSandboxTabs(prev => prev.map(t => t.id === activeSandboxTabId ? { ...t, ...updates } : t));
  };

  // --- TAB 3: CODEC STATES ---
  const [codecInput, setCodecInput] = useState('{"status": "ok", "message": "Google AI Studio!"}');
  const [codecOutput, setCodecOutput] = useState('');
  const [codecError, setCodecError] = useState<string | null>(null);
  const [timestampSec, setTimestampSec] = useState<string>('');
  const [timestampFormatted, setTimestampFormatted] = useState<string>('');
  const [currentEpoch, setCurrentEpoch] = useState<number>(Math.floor(Date.now() / 1000));
  const [killConfirmModal, setKillConfirmModal] = useState<{ pid: number; service: string; isOpen: boolean } | null>(null);

  // Unix Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentEpoch(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- TAB 4: GIT & SHELL STATES ---
  const [selectedRepo, setSelectedRepo] = useState('frontend-app');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Microsoft Windows [Version 10.0.22631.3527]',
    '(c) Microsoft Corporation. All rights reserved.',
    '',
    'C:\\Users\\Developer\\Workspaces\\frontend-app> _'
  ]);
  const [gitStatusActive, setGitStatusActive] = useState(false);
  const [gitRepos, setGitRepos] = useState([
    { id: 'frontend-app', name: 'frontend-app', branch: 'main', changes: 3, lastCommit: 'feat: add windows diagnostic toolbox', status: 'dirty' },
    { id: 'backend-api', name: 'backend-api', branch: 'dev', changes: 0, lastCommit: 'fix: optimize redis healthprobe connection', status: 'clean' },
    { id: 'devops-pipelines', name: 'devops-pipelines', branch: 'feature/wsl', changes: 1, lastCommit: 'chore: setup docker-compose orchestration', status: 'dirty' },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Scroll to terminal bottom on new logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);


  // --- FUNCTIONS FOR TAB 1: DIAGNOSTICS ---
  const handleCheckPort = () => {
    if (!portInput || isNaN(Number(portInput))) {
      setPortCheckResult({ status: 'error', message: '请输入有效的端口号（1-65535）' });
      return;
    }
    setPortChecking(true);
    setPortCheckResult(null);

    setTimeout(() => {
      setPortChecking(false);
      // Simulate occupancy for standard development ports
      const port = Number(portInput);
      const standardPorts: Record<number, { service: string; pid: number; mem: string }> = {
        80: { service: 'nginx.exe', pid: 4812, mem: '14.2 MB' },
        443: { service: 'nginx.exe', pid: 4812, mem: '14.2 MB' },
        3000: { service: 'node.exe (Vite Dev)', pid: 14832, mem: '84.6 MB' },
        5432: { service: 'postgres.exe', pid: 2108, mem: '124.1 MB' },
        6379: { service: 'redis-server.exe', pid: 9024, mem: '32.5 MB' },
        8080: { service: 'java.exe (Jenkins)', pid: 11021, mem: '412.3 MB' },
        9090: { service: 'prometheus.exe', pid: 5122, mem: '92.4 MB' },
      };

      if (standardPorts[port]) {
        setPortCheckResult({
          status: 'occupied',
          port: port,
          ...standardPorts[port],
          cmd: `netstat -ano | findstr :${port}`,
          output: `  协议    本地地址               外部地址               状态           PID\n  TCP    0.0.0.0:${port}           0.0.0.0:0              LISTENING       ${standardPorts[port].pid}`
        });
        onAddSystemLog('端口占用检测', `端口 ${port} 检测到正被进程 ${standardPorts[port].service} (PID: ${standardPorts[port].pid}) 占用中。`, 'warning');
      } else {
        setPortCheckResult({
          status: 'free',
          port: port,
          cmd: `netstat -ano | findstr :${port}`,
          output: `(未返回任何监听行，端口处于闲置可用状态)`
        });
        onAddSystemLog('端口占用检测', `端口 ${port} 处于闲置可用状态，无冲突。`, 'success');
      }
    }, 600);
  };

  const triggerKillConfirm = (pid: number, service: string) => {
    setKillConfirmModal({ pid, service, isOpen: true });
  };

  const handleKillProcess = (pid: number, service: string) => {
    setKillConfirmModal(null);
    onAddSystemLog('进程强制关闭', `发送强制终止信号 (taskkill /F /PID ${pid}) 到进程 ${service}...`, 'info');
    setPortChecking(true);
    setTimeout(() => {
      setPortChecking(false);
      setPortCheckResult({
        status: 'killed',
        port: portInput,
        output: `成功: 已发送终止信号。PID ${pid} (${service}) 进程已成功注销，端口已释放。`
      });
      onAddSystemLog('进程关闭成功', `成功强制杀掉 PID ${pid} 进程，端口 ${portInput} 已重新就绪。`, 'success');
    }, 800);
  };

  const toggleWslDistro = (name: string) => {
    setWslDistros(prev =>
      prev.map(d => {
        if (d.name === name) {
          const isRunning = d.status === 'Running';
          onAddSystemLog(
            isRunning ? '停止 WSL 分发版' : '启动 WSL 分发版',
            `已发送 WSL 信号。分发版 \`${name}\` 已成功${isRunning ? '注销并终止' : '热启动初始化'}。`,
            isRunning ? 'info' : 'success'
          );
          return {
            ...d,
            status: isRunning ? 'Stopped' : 'Running',
            ip: isRunning ? '-' : `172.29.${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 250) + 2}`
          };
        }
        return d;
      })
    );
  };

  const handleAddEnv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName || !newEnvVal) return;
    const nameUpper = newEnvName.trim().toUpperCase();
    setEnvVars(prev => [...prev, { name: nameUpper, value: newEnvVal.trim() }]);
    onAddSystemLog('环境变量配置', `成功在临时用户级别注册环境变量 \`${nameUpper}\`。`, 'success');
    setNewEnvName('');
    setNewEnvVal('');
  };

  const handleAddHostMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostDomain) return;
    setHostsFile(prev => `${prev}\n${newHostIp.trim()}       ${newHostDomain.trim()}`);
    onAddSystemLog('Hosts映射更新', `添加映射规则：${newHostIp} -> ${newHostDomain}，已成功追加。`, 'success');
    setNewHostDomain('');
  };

  // --- HOSTS FILE BACKUPS REGISTRY ---
  interface HostsBackup {
    id: string;
    timestamp: string;
    content: string;
    description: string;
  }

  const [hostsBackups, setHostsBackups] = useState<HostsBackup[]>(() => {
    const saved = localStorage.getItem('hosts_backups');
    return saved ? JSON.parse(saved) : [
      {
        id: 'backup-init',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        content: `# Windows Hosts File (C:\\Windows\\System32\\drivers\\etc\\hosts)\n127.0.0.1       localhost\n::1             localhost\n127.0.0.1       dev.local`,
        description: '系统初始化自动备份'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('hosts_backups', JSON.stringify(hostsBackups));
  }, [hostsBackups]);

  const handleCreateBackup = (desc: string = '手动快照备份') => {
    const newBackup: HostsBackup = {
      id: `backup-${Date.now()}`,
      timestamp: new Date().toISOString(),
      content: hostsFile,
      description: desc
    };
    setHostsBackups(prev => [newBackup, ...prev]);
    onAddSystemLog('Hosts备份成功', `已创建快照: [${desc}]，您可随时在历史备份中回滚。`, 'success');
  };

  const handleRestoreBackup = (content: string, name: string) => {
    setHostsFile(content);
    onAddSystemLog('Hosts配置回滚', `成功将 Hosts 配置文件回滚至快照 [${name}]`, 'success');
  };

  // --- CODE SNIPPET GENERATORS FOR API TESTER ---
  const replacePlaceholders = (text: string) => {
    let result = text;
    apiEnvVars.forEach(env => {
      if (env.key.trim()) {
        const placeholder = `{{${env.key.trim()}}}`;
        result = result.split(placeholder).join(env.value);
      }
    });
    return result;
  };

  const generateCurl = () => {
    const substUrl = replacePlaceholders(activeSandboxTab.url);
    let curl = `curl -X ${activeSandboxTab.method} "${substUrl}"`;
    activeSandboxTab.headers.forEach(h => {
      if (h.key && h.value) {
        curl += ` \\\n  -H "${h.key}: ${replacePlaceholders(h.value)}"`;
      }
    });
    if (activeSandboxTab.method !== 'GET' && activeSandboxTab.body) {
      const substBody = replacePlaceholders(activeSandboxTab.body).replace(/"/g, '\\"').replace(/\n/g, ' ');
      curl += ` \\\n  -d "${substBody}"`;
    }
    return curl;
  };

  const generateFetchCode = () => {
    const substUrl = replacePlaceholders(activeSandboxTab.url);
    const headersObj: Record<string, string> = {};
    activeSandboxTab.headers.forEach(h => {
      if (h.key) headersObj[h.key] = replacePlaceholders(h.value);
    });
    const options: any = {
      method: activeSandboxTab.method,
      headers: headersObj
    };
    if (activeSandboxTab.method !== 'GET' && activeSandboxTab.body) {
      options.body = replacePlaceholders(activeSandboxTab.body);
    }
    return `fetch("${substUrl}", ${JSON.stringify(options, null, 2)})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));`;
  };

  const generateAxiosCode = () => {
    const substUrl = replacePlaceholders(activeSandboxTab.url);
    const headersObj: Record<string, string> = {};
    activeSandboxTab.headers.forEach(h => {
      if (h.key) headersObj[h.key] = replacePlaceholders(h.value);
    });
    let code = `axios({\n  method: "${activeSandboxTab.method.toLowerCase()}",\n  url: "${substUrl}",`;
    if (Object.keys(headersObj).length > 0) {
      code += `\n  headers: ${JSON.stringify(headersObj, null, 4).replace(/\n/g, '\n  ')},`;
    }
    if (activeSandboxTab.method !== 'GET' && activeSandboxTab.body) {
      try {
        const parsed = JSON.parse(activeSandboxTab.body);
        code += `\n  data: ${JSON.stringify(parsed, null, 4).replace(/\n/g, '\n  ')}`;
      } catch {
        code += `\n  data: ${JSON.stringify(activeSandboxTab.body)}`;
      }
    }
    code += `\n})\n.then(res => console.log(res.data))\n.catch(err => console.error(err));`;
    return code;
  };

  // --- FUNCTIONS FOR TAB 2: API TESTER ---
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiLoading(true);
    updateActiveTab({
      response: null,
      responseStatus: null,
      latency: null
    });

    const startTime = performance.now();
    const finalUrl = replacePlaceholders(activeSandboxTab.url);
    const finalMethod = activeSandboxTab.method;

    onAddSystemLog('接口发起测试', `正在发起 ${finalMethod} 请求至: ${finalUrl}`, 'info');

    try {
      const headersObj: Record<string, string> = {};
      activeSandboxTab.headers.forEach(h => {
        if (h.key && h.value) {
          headersObj[h.key] = replacePlaceholders(h.value);
        }
      });

      const options: RequestInit = {
        method: finalMethod,
        headers: headersObj,
      };

      if (finalMethod !== 'GET' && activeSandboxTab.body) {
        options.body = replacePlaceholders(activeSandboxTab.body);
      }

      // Live fetch request with timeout support
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      options.signal = controller.signal;

      const response = await fetch(finalUrl, options);
      clearTimeout(timeoutId);

      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      updateActiveTab({
        response: data,
        responseStatus: response.status,
        latency: latency
      });

      onAddSystemLog(
        `接口联调完毕: Status [${response.status}]`,
        `接口请求结束，耗时 ${latency}ms。`,
        response.status < 400 ? 'success' : 'warning'
      );
    } catch (err: any) {
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      updateActiveTab({
        response: { error: err.message || '网络连接异常或连接超时，请确认该本地/公网端口是否已正常开启、探针跨域(CORS)是否支持' },
        responseStatus: 500,
        latency: latency
      });
      onAddSystemLog('接口联调异常', `错误原因: ${err.message}`, 'error');
    } finally {
      setApiLoading(false);
    }
  };


  // --- FUNCTIONS FOR TAB 3: CODEC & FORMATTER ---
  const handleBase64Encode = () => {
    try {
      const res = btoa(unescape(encodeURIComponent(codecInput)));
      setCodecOutput(res);
      setCodecError(null);
    } catch (err: any) {
      setCodecError(`Base64 编码失败: ${err.message}`);
    }
  };

  const handleBase64Decode = () => {
    try {
      const res = decodeURIComponent(escape(atob(codecInput)));
      setCodecOutput(res);
      setCodecError(null);
    } catch (err: any) {
      setCodecError(`Base64 解码失败: ${err.message}`);
    }
  };

  const handleURLEncode = () => {
    try {
      const res = encodeURIComponent(codecInput);
      setCodecOutput(res);
      setCodecError(null);
    } catch (err: any) {
      setCodecError(`URL 编码失败: ${err.message}`);
    }
  };

  const handleURLDecode = () => {
    try {
      const res = decodeURIComponent(codecInput);
      setCodecOutput(res);
      setCodecError(null);
    } catch (err: any) {
      setCodecError(`URL 解码失败: ${err.message}`);
    }
  };

  const handleJSONFormat = () => {
    try {
      const parsed = JSON.parse(codecInput);
      const formatted = JSON.stringify(parsed, null, 2);
      setCodecOutput(formatted);
      setCodecError(null);
    } catch (err: any) {
      setCodecError(`JSON 解析失败: ${err.message}`);
    }
  };

  const handleJSONMinify = () => {
    try {
      const parsed = JSON.parse(codecInput);
      const minified = JSON.stringify(parsed);
      setCodecOutput(minified);
      setCodecError(null);
    } catch (err: any) {
      setCodecError(`JSON 解析失败: ${err.message}`);
    }
  };

  const handleConvertTimestamp = () => {
    if (!timestampSec) return;
    try {
      const isMs = timestampSec.length > 10;
      const parsedVal = Number(timestampSec);
      if (isNaN(parsedVal)) {
        setTimestampFormatted('请输入纯数字的时间戳');
        return;
      }
      const d = new Date(isMs ? parsedVal : parsedVal * 1000);
      setTimestampFormatted(d.toLocaleString('zh-CN', { timeZoneName: 'short' }));
    } catch (err: any) {
      setTimestampFormatted(`转换异常: ${err.message}`);
    }
  };

  const handleConvertDate = () => {
    try {
      const d = new Date();
      setTimestampSec(Math.floor(d.getTime() / 1000).toString());
      setTimestampFormatted(d.toLocaleString('zh-CN', { timeZoneName: 'short' }));
    } catch (err: any) {
      setTimestampFormatted(`获取当前系统时间异常: ${err.message}`);
    }
  };


  // --- FUNCTIONS FOR TAB 4: GIT & POWERSHELL ---
  const executeTerminalCommand = (cmdText: string, delay = 500, responseLines: string[]) => {
    setTerminalLogs(prev => [...prev.slice(0, -1), `C:\\Users\\Developer\\Workspaces\\${selectedRepo}> ${cmdText}`]);
    setTimeout(() => {
      setTerminalLogs(prev => [
        ...prev,
        ...responseLines,
        '',
        `C:\\Users\\Developer\\Workspaces\\${selectedRepo}> _`
      ]);
    }, delay);
  };

  const handleGitAction = (action: 'status' | 'pull' | 'branch') => {
    if (gitStatusActive) return;
    setGitStatusActive(true);

    const activeRepo = gitRepos.find(r => r.id === selectedRepo) || gitRepos[0];

    if (action === 'status') {
      const response = activeRepo.changes > 0 
        ? [
            `On branch ${activeRepo.branch}`,
            `Your branch is up to date with 'origin/${activeRepo.branch}'.`,
            '',
            'Changes not staged for commit:',
            '  (use "git add <file>..." to update what will be committed)',
            '  (use "git restore <file>..." to discard changes in working directory)',
            `\tmodified:   src/App.tsx`,
            `\tmodified:   src/components/WinDevSuite.tsx`,
            `\tmodified:   server.ts`,
            '',
            `no changes added to commit (use "git add" and/or "git commit -a")`
          ]
        : [
            `On branch ${activeRepo.branch}`,
            `Your branch is up to date with 'origin/${activeRepo.branch}'.`,
            'nothing to commit, working tree clean'
          ];

      executeTerminalCommand('git status', 400, response);
      onAddSystemLog('Git指令下发', `于 [${activeRepo.name}] 执行 \`git status\`，检查工作区状态。`, 'info');
    } else if (action === 'pull') {
      const response = [
        'Updating d38ef21..aef9042',
        'Fast-forward',
        ' src/App.tsx                        | 124 ++++++++++------',
        ' src/components/WinDevSuite.tsx     | 256 ++++++++++++++++++++',
        ' server.ts                          |  12 +--',
        ' 3 files changed, 354 insertions(+), 38 deletions(-)',
        'Successfully pulled latest changes from remote.'
      ];
      executeTerminalCommand('git pull origin ' + activeRepo.branch, 600, response);
      onAddSystemLog('Git拉取同步', `成功拉取 [${activeRepo.name}] 的最新远程变更并同步本地工作流。`, 'success');
      
      // Clear changes status on successful pull simulation
      setGitRepos(prev => prev.map(r => r.id === selectedRepo ? { ...r, changes: 0, status: 'clean' } : r));
    } else if (action === 'branch') {
      const response = gitRepos.map(r => {
        const isCurrent = r.id === selectedRepo;
        return `${isCurrent ? '* ' : '  '}${r.branch}   ${r.lastCommit.slice(0, 7)} [local]`;
      });
      executeTerminalCommand('git branch -vv', 300, response);
      onAddSystemLog('Git分支检查', `获取 [${activeRepo.name}] 的本地与远程分支追踪绑定关系。`, 'info');
    }

    setTimeout(() => setGitStatusActive(false), 800);
  };

  const handleSystemCmdTrigger = (title: string, cmd: string) => {
    onAddSystemLog('执行Windows管理脚本', `在本地终端中模拟执行命令：\`${cmd}\``, 'info');
    
    let outputs: string[] = [];
    if (cmd.includes('flushdns')) {
      outputs = [
        'Windows IP Configuration',
        '',
        'Successfully flushed the DNS Resolver Cache.'
      ];
    } else if (cmd.includes('iisreset')) {
      outputs = [
        'Attempting stop...',
        'Internet services successfully stopped',
        'Attempting start...',
        'Internet services successfully restarted'
      ];
    } else if (cmd.includes('shutdown')) {
      outputs = [
        'Sending shutdown signal to WSL instances...',
        'Successfully terminated all active WSL2 VM kernels.',
        'WSL status checking: OFFLINE.'
      ];
      // Set all WSL distros to stopped status
      setWslDistros(prev => prev.map(d => ({ ...d, status: 'Stopped', ip: '-' })));
    } else {
      outputs = [
        `Executing preset automated terminal sequence: \`${cmd}\``,
        'Signal dispatched successfully. Return code 0 (Success).'
      ];
    }

    executeTerminalCommand(cmd, 500, outputs);
  };

  // Helper to copy content to clipboard
  const handleCopyToClipboard = (text: string, moduleName: string) => {
    navigator.clipboard.writeText(text);
    onAddSystemLog('成功复制到剪贴板', `已成功将[${moduleName}]输出的文本写入系统剪贴板。`, 'success');
  };


  return (
    <section className="bg-[#111111] border border-[#262626] rounded-2xl p-6 space-y-6">
      
      {/* HEADER WITH EMBEDDED PERSPECTIVE DETAILS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#232323] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <DynamicIcon name="Layers" size={16} />
            </div>
            <h2 className="text-base font-semibold text-gray-200">
              Windows 研发与全栈提效工作台
            </h2>
            <span className="text-[9px] bg-blue-600/10 border border-blue-500/30 text-blue-400 font-bold px-1.5 py-0.5 rounded font-mono">
              FULL-STACK SUITE
            </span>
          </div>
          <p className="text-xs text-gray-400">
            针对 Windows 本地宿主环境设计的多维诊断监视及轻量级 API 调试控制中心
          </p>
        </div>

        {/* CONTROLLER TABS */}
        <div className="flex bg-[#161616] border border-[#262626] p-1 rounded-xl">
          {[
            { id: 'diagnostics', label: '环境感知/诊断', icon: 'Settings' },
            { id: 'apiTester', label: 'API 调试沙箱', icon: 'Send' },
            { id: 'codec', label: '编解码/格式化', icon: 'Binary' },
            { id: 'gitTerm', label: 'Git/终端助手', icon: 'Terminal' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-[#262626] text-blue-400 shadow-sm border border-[#363636]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <DynamicIcon name={tab.icon} size={12} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>


      {/* BODY CONTENT AREA WITH ANIMATED TRANSITIONS */}
      <div className="min-h-[380px]">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: ENVIRONMENTAL DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <motion.div
              key="diagnostics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Left hand side: Port occupy finder & Hosts config */}
              <div className="space-y-5">
                
                {/* Port Occupy Finder */}
                <div className="bg-[#161616]/60 border border-[#232323] rounded-xl p-4.5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                      <DynamicIcon name="SearchCode" size={13} className="text-blue-400" />
                      <span>本地宿主端口占用探测 (Netstat / Tasklist)</span>
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">localhost:Port</span>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-600 font-bold">:</span>
                      <input
                        type="text"
                        value={portInput}
                        onChange={(e) => setPortInput(e.target.value)}
                        placeholder="输入需要排查占用的端口, 如 3000..."
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg pl-6 pr-3 py-2 text-xs text-gray-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleCheckPort}
                      disabled={portChecking}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors"
                    >
                      {portChecking ? '正在检测...' : '探测占用'}
                    </button>
                  </div>

                  {portCheckResult && (
                    <div className="bg-[#0c0c0c] border border-[#232323] rounded-lg p-3 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-500 font-semibold">$ {portCheckResult.cmd || 'query'}</span>
                        {portCheckResult.status === 'occupied' ? (
                          <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold font-sans">占用冲突</span>
                        ) : portCheckResult.status === 'killed' ? (
                          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold font-sans">已被强制释放</span>
                        ) : (
                          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold font-sans">端口可用</span>
                        )}
                      </div>
                      <pre className="text-[11px] font-mono text-gray-400 bg-[#060606] p-2 rounded overflow-x-auto whitespace-pre leading-relaxed">
                        {portCheckResult.output}
                      </pre>

                      {portCheckResult.status === 'occupied' && (
                        <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg text-xs">
                          <div className="text-gray-400 leading-snug">
                            进程: <span className="text-gray-200 font-bold font-mono">{portCheckResult.service}</span> (PID: <span className="text-blue-400 font-bold font-mono">{portCheckResult.pid}</span>)<br/>
                            内存开销: <span className="text-gray-400 font-mono text-[11px]">{portCheckResult.mem}</span>
                          </div>
                          <button
                            onClick={() => triggerKillConfirm(portCheckResult.pid, portCheckResult.service)}
                            className="px-2.5 py-1.5 bg-red-600/10 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white font-bold text-[10px] rounded transition-all cursor-pointer"
                          >
                            杀死进程 (Taskkill)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Hosts File Editor */}
                <div className="bg-[#161616]/60 border border-[#232323] rounded-xl p-4.5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                      <DynamicIcon name="FileText" size={13} className="text-amber-400" />
                      <span>本地宿主 DNS Hosts 映射工具 (C:\Windows\...)</span>
                    </span>
                    <button
                      onClick={() => handleCopyToClipboard(hostsFile, 'Hosts映射配置')}
                      className="text-[10px] text-gray-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                    >
                      <DynamicIcon name="Copy" size={10} />
                      <span>复制 Hosts 文本</span>
                    </button>
                  </div>

                  <textarea
                    value={hostsFile}
                    onChange={(e) => setHostsFile(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-[10.5px] text-gray-400 font-mono h-32 focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
                  />

                  <form onSubmit={handleAddHostMapping} className="flex gap-2 items-center">
                    <input
                      type="text"
                      required
                      value={newHostIp}
                      onChange={(e) => setNewHostIp(e.target.value)}
                      placeholder="IP 地址 (例: 127.0.0.1)"
                      className="w-[110px] bg-[#0a0a0a] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      required
                      value={newHostDomain}
                      onChange={(e) => setNewHostDomain(e.target.value)}
                      placeholder="绑定本地域名 (例: api.dev.local)"
                      className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600 border border-amber-500/25 text-amber-400 hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      追加映射
                    </button>
                  </form>

                  {/* Hosts configuration snapshots list */}
                  <div className="space-y-2 border-t border-[#232323] pt-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-gray-400">Hosts 历史快照快照与回滚 (Backup Registry)</span>
                      <button
                        type="button"
                        onClick={() => {
                          const desc = prompt('请输入本次快照备注说明：', `手动备份_${new Date().toLocaleTimeString()}`);
                          if (desc) handleCreateBackup(desc);
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <DynamicIcon name="Save" size={11} />
                        <span>保存当前快照</span>
                      </button>
                    </div>
                    {hostsBackups.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pt-0.5">
                        {hostsBackups.map(bk => (
                          <div 
                            key={bk.id}
                            className="flex items-center gap-1.5 bg-[#0a0a0a]/50 border border-[#232323] px-2 py-1 rounded text-[10px] text-gray-400"
                          >
                            <span className="text-gray-300 font-medium truncate max-w-[150px]" title={bk.description}>{bk.description}</span>
                            <span className="text-zinc-600 font-mono">({new Date(bk.timestamp).toLocaleTimeString()})</span>
                            <button
                              type="button"
                              onClick={() => handleRestoreBackup(bk.content, bk.description)}
                              className="text-emerald-400 hover:text-emerald-300 font-bold ml-1.5 border-l border-[#232323] pl-1.5 cursor-pointer"
                              title="一键还原此 Hosts 配置文件"
                            >
                              回滚
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-600 italic">暂无快照文件，请先点击右侧保存配置快照...</div>
                    )}
                  </div>
                </div>

              </div>


              {/* Right hand side: WSL instances & Env variables */}
              <div className="space-y-5">
                
                {/* WSL Container Distros */}
                <div className="bg-[#161616]/60 border border-[#232323] rounded-xl p-4.5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                      <DynamicIcon name="Container" size={13} className="text-emerald-400" />
                      <span>WSL 2 (Windows Subsystem for Linux) 实例状态监控</span>
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">wsl -l -v</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {wslDistros.map((distro, i) => (
                      <div
                        key={i}
                        className="bg-[#101010]/50 border border-[#262626] p-3 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-200 font-bold font-mono">{distro.name}</span>
                            <span className="text-[9px] bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 px-1 rounded-sm font-bold font-mono">
                              Ver: {distro.version}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                            <span>状态:</span>
                            <span className={`font-bold font-sans ${distro.status === 'Running' ? 'text-emerald-400' : 'text-gray-500'}`}>
                              ● {distro.status === 'Running' ? '运行中 (Running)' : '已挂起 (Stopped)'}
                            </span>
                            {distro.ip !== '-' && (
                              <>
                                <span className="text-gray-700">|</span>
                                <span>网卡IP: {distro.ip}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => toggleWslDistro(distro.name)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                            distro.status === 'Running'
                              ? 'bg-red-600/10 hover:bg-red-600 border-red-500/20 hover:border-red-500 text-red-400 hover:text-white'
                              : 'bg-emerald-600/10 hover:bg-emerald-600 border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-white'
                          }`}
                        >
                          {distro.status === 'Running' ? '注销停用' : '唤醒启动'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Env variables explorer */}
                <div className="bg-[#161616]/60 border border-[#232323] rounded-xl p-4.5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                      <DynamicIcon name="Sparkles" size={13} className="text-pink-400" />
                      <span>宿主环境变量诊断面板 (USER / SYSTEM ENV)</span>
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">env_registry</span>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                      <DynamicIcon name="Search" size={12} />
                    </span>
                    <input
                      type="text"
                      value={envSearch}
                      onChange={(e) => setEnvSearch(e.target.value)}
                      placeholder="模糊搜索环境变量名称或变量内容..."
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-pink-500 font-mono"
                    />
                  </div>

                  {/* Variables list */}
                  <div className="bg-[#0c0c0c] border border-[#232323] rounded-lg p-2.5 h-32 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {envVars
                      .filter(env => env.name.toLowerCase().includes(envSearch.toLowerCase()) || env.value.toLowerCase().includes(envSearch.toLowerCase()))
                      .map((env, i) => (
                        <div key={i} className="text-[11px] font-mono flex flex-col md:flex-row md:items-start gap-1 p-1.5 border-b border-[#181818] last:border-0 hover:bg-[#151515] rounded">
                          <span className="text-pink-400 font-bold shrink-0 min-w-[120px] truncate">{env.name}</span>
                          <span className="text-gray-400 break-all leading-tight">{env.value}</span>
                        </div>
                      ))}
                  </div>

                  <form onSubmit={handleAddEnv} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newEnvName}
                      onChange={(e) => setNewEnvName(e.target.value)}
                      placeholder="键名 (如 GOROOT)"
                      className="w-1/3 bg-[#0a0a0a] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-pink-500"
                    />
                    <input
                      type="text"
                      required
                      value={newEnvVal}
                      onChange={(e) => setNewEnvVal(e.target.value)}
                      placeholder="键值内容 (路径或配置参数)"
                      className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-pink-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-pink-600/10 hover:bg-pink-600 border border-pink-500/25 text-pink-400 hover:text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                    >
                      注册
                    </button>
                  </form>
                </div>

              </div>
            </motion.div>
          )}


          {/* TAB 2: FULL-STACK REST API PLAYGROUND */}
          {activeTab === 'apiTester' && (
            <motion.div
              key="apiTester"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="bg-[#161616]/60 border border-[#232323] rounded-xl p-5 space-y-5 animate-fadeIn"
            >
              <div className="flex items-center justify-between border-b border-[#232323] pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <DynamicIcon name="Send" size={13} className="text-blue-400" />
                    <span>全栈极速 REST API 接口联调沙箱 (LIVE CLIENT)</span>
                  </h3>
                  <p className="text-[11px] text-gray-500">支持多标签管理、环境变量动态替换及 cURL/Fetch/Axios 代码一键导出</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-600 font-mono">XHR ENGINE</span>
                </div>
              </div>

              {/* ENV VARS MANAGER AND TABS ROW */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0a0a0a]/80 p-3 rounded-lg border border-[#232323]">
                {/* Environment Variables List */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-gray-400">
                    <DynamicIcon name="Sliders" size={12} className="text-blue-400" />
                    <span>全局环境变量管理 (可用 {"{{KEY}}"} 进行占位替换)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {apiEnvVars.map((env, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 text-[10px] font-mono text-zinc-300 flex items-center gap-1"
                      >
                        <span className="text-zinc-500 font-bold">{env.key}:</span>
                        <span className="text-blue-400 truncate max-w-[120px]">{env.value}</span>
                        <button
                          type="button"
                          onClick={() => setApiEnvVars(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-300 font-bold text-[9px] cursor-pointer ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {/* Tiny inline form to add a new env var */}
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="键名 (如 TOKEN)"
                        value={apiNewEnvKey}
                        onChange={(e) => setApiNewEnvKey(e.target.value.toUpperCase())}
                        className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-300 rounded font-mono w-[80px] focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="值 (如 12345)"
                        value={apiNewEnvVal}
                        onChange={(e) => setApiNewEnvVal(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-300 rounded font-mono w-[100px] focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (apiNewEnvKey.trim() && apiNewEnvVal.trim()) {
                            setApiEnvVars(prev => [...prev, { key: apiNewEnvKey.trim().toUpperCase(), value: apiNewEnvVal.trim() }]);
                            setApiNewEnvKey('');
                            setApiNewEnvVal('');
                          }
                        }}
                        className="px-1.5 py-0.5 bg-blue-600/30 hover:bg-blue-600 text-blue-400 hover:text-white rounded text-[9px] font-bold transition-all cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* TABS SELECTOR */}
              <div className="flex items-center justify-between border-b border-[#232323] pb-1 gap-2">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                  {sandboxTabs.map(tab => (
                    <div
                      key={tab.id}
                      onClick={() => {
                        setActiveSandboxTabId(tab.id);
                        setShowCodeExport(null);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-semibold cursor-pointer border-t-2 transition-all ${
                        activeSandboxTabId === tab.id
                          ? 'bg-[#1a1a1a]/80 border-blue-500 text-blue-400 font-bold'
                          : 'border-transparent text-gray-500 hover:text-gray-300 bg-transparent'
                      }`}
                    >
                      <span className="text-[10px] font-mono text-zinc-600">[{tab.method}]</span>
                      <span className="truncate max-w-[120px]">{tab.name}</span>
                      {sandboxTabs.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSandboxTabs(prev => prev.filter(t => t.id !== tab.id));
                            if (activeSandboxTabId === tab.id) {
                              const remaining = sandboxTabs.filter(t => t.id !== tab.id);
                              if (remaining.length > 0) setActiveSandboxTabId(remaining[0].id);
                            }
                          }}
                          className="hover:text-red-400 text-zinc-600 text-[10px] font-bold p-0.5 ml-0.5"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newId = `tab-${Date.now()}`;
                      const newTab: SandboxTab = {
                        id: newId,
                        name: `接口-${sandboxTabs.length + 1}`,
                        url: '{{BASE_URL}}/posts',
                        method: 'GET',
                        headers: [{ key: 'Content-Type', value: 'application/json' }],
                        body: '{\n  "name": "value"\n}',
                        response: null,
                        responseStatus: null,
                        latency: null
                      };
                      setSandboxTabs(prev => [...prev, newTab]);
                      setActiveSandboxTabId(newId);
                      setShowCodeExport(null);
                    }}
                    className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded text-[10px] font-bold cursor-pointer"
                  >
                    + 新建标签
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600 font-mono">SANDBOX MULTI-TABS</span>
                </div>
              </div>

              <form onSubmit={handleSendRequest} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* HTTP Method select */}
                  <select
                    value={activeSandboxTab.method}
                    onChange={(e: any) => updateActiveTab({ method: e.target.value })}
                    className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs font-bold text-blue-400 font-mono focus:outline-none focus:border-blue-500 shrink-0 cursor-pointer"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>

                  {/* URL Input */}
                  <input
                    type="text"
                    required
                    value={activeSandboxTab.url}
                    onChange={(e) => updateActiveTab({ url: e.target.value })}
                    placeholder="https://api.example.com/endpoint 或 {{BASE_URL}}/posts/1"
                    className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-xs text-gray-200 font-mono focus:outline-none focus:border-blue-500"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={apiLoading}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shrink-0"
                  >
                    {apiLoading ? '发送中...' : '发送请求 (Send)'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left panel: Headers and Body input */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-300">
                      <span>请求参数头 (Headers)</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextHeaders = [...activeSandboxTab.headers, { key: '', value: '' }];
                          updateActiveTab({ headers: nextHeaders });
                        }}
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5 cursor-pointer"
                      >
                        <DynamicIcon name="Plus" size={11} />
                        <span>添加参数</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                      {activeSandboxTab.headers.map((header, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="键名 (Key)"
                            value={header.key}
                            onChange={(e) => {
                              const next = [...activeSandboxTab.headers];
                              next[i].key = e.target.value;
                              updateActiveTab({ headers: next });
                            }}
                            className="w-1/2 bg-[#0a0a0a] border border-[#262626] rounded-lg px-2.5 py-1 text-xs text-gray-200 font-mono focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="键值 (Value)"
                            value={header.value}
                            onChange={(e) => {
                              const next = [...activeSandboxTab.headers];
                              next[i].value = e.target.value;
                              updateActiveTab({ headers: next });
                            }}
                            className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-lg px-2.5 py-1 text-xs text-gray-200 font-mono focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = activeSandboxTab.headers.filter((_, idx) => idx !== i);
                              updateActiveTab({ headers: next });
                            }}
                            className="p-1 bg-red-600/10 hover:bg-red-600 border border-red-500/10 hover:border-red-500 text-red-400 hover:text-white rounded transition-colors cursor-pointer"
                          >
                            <DynamicIcon name="Trash" size={11} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {activeSandboxTab.method !== 'GET' && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-gray-300 block">请求主体 (Request Body - Raw / JSON)</span>
                        <textarea
                          value={activeSandboxTab.body}
                          onChange={(e) => updateActiveTab({ body: e.target.value })}
                          className="w-full h-32 bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-xs text-gray-300 font-mono focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                        />
                      </div>
                    )}
                  </div>

                  {/* Right panel: Response panel */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-300">
                      <span>HTTP 响应输出 (Response Payload)</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowCodeExport(showCodeExport === 'curl' ? null : 'curl')}
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${showCodeExport === 'curl' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                        >
                          cURL
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCodeExport(showCodeExport === 'fetch' ? null : 'fetch')}
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${showCodeExport === 'fetch' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                        >
                          Fetch
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCodeExport(showCodeExport === 'axios' ? null : 'axios')}
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${showCodeExport === 'axios' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                        >
                          Axios
                        </button>
                      </div>
                      {activeSandboxTab.responseStatus !== null && (
                        <div className="flex items-center gap-3 text-[10px] font-mono">
                          <span>状态: <span className={activeSandboxTab.responseStatus < 400 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{activeSandboxTab.responseStatus}</span></span>
                          {activeSandboxTab.latency !== null && <span>耗时: <span className="text-blue-400 font-bold">{activeSandboxTab.latency}ms</span></span>}
                        </div>
                      )}
                    </div>

                    <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 h-48 overflow-y-auto leading-relaxed scrollbar-thin relative animate-fadeIn">
                      {showCodeExport ? (
                        <div className="h-full flex flex-col justify-between">
                          <pre className="text-[10px] font-mono text-blue-400 whitespace-pre-wrap leading-relaxed select-text pr-14">
                            {showCodeExport === 'curl' ? generateCurl() : showCodeExport === 'fetch' ? generateFetchCode() : generateAxiosCode()}
                          </pre>
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const code = showCodeExport === 'curl' ? generateCurl() : showCodeExport === 'fetch' ? generateFetchCode() : generateAxiosCode();
                                navigator.clipboard.writeText(code);
                                onAddSystemLog('代码导出成功', `已成功将 ${showCodeExport.toUpperCase()} 调试代码复制至剪贴板。`, 'success');
                              }}
                              className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-500 text-blue-400 hover:text-white rounded text-[10px] flex items-center gap-1 cursor-pointer transition-all font-bold"
                              title="一键复制至剪贴板"
                            >
                              <DynamicIcon name="Copy" size={10} />
                              <span>复制</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowCodeExport(null)}
                              className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded text-[10px] cursor-pointer"
                              title="返回返回包视图"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ) : apiLoading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-2 text-gray-500 text-xs font-mono">
                          <div className="animate-spin text-blue-500">
                            <DynamicIcon name="RefreshCw" size={16} />
                          </div>
                          <span>接口管道正建立连接，请稍候...</span>
                        </div>
                      ) : activeSandboxTab.response ? (
                        <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed break-all select-text">
                          {typeof activeSandboxTab.response === 'object' ? JSON.stringify(activeSandboxTab.response, null, 2) : String(activeSandboxTab.response)}
                        </pre>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-600 text-xs italic">
                          等待请求发出以展示服务器状态与返回包数据...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </motion.div>
          )}


          {/* TAB 3: FORMATTERS & CODEC TOOLS */}
          {activeTab === 'codec' && (
            <motion.div
              key="codec"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn"
            >
              {/* String / Base64 / URL Encoder & JSON Formatter */}
              <div className="bg-[#161616]/60 border border-[#232323] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#232323] pb-2">
                  <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <DynamicIcon name="Binary" size={13} className="text-blue-400" />
                    <span>多格式字符处理与 JSON 工具箱</span>
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">codec_utils</span>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-gray-400 block font-semibold">输入文本 / 原始 JSON / 待解密字符串</span>
                    <textarea
                      value={codecInput}
                      onChange={(e) => setCodecInput(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-xs text-gray-300 font-mono h-24 focus:outline-none focus:border-blue-500 leading-normal resize-none"
                    />
                  </div>

                  {codecError && (
                    <div className="p-2 bg-red-600/10 border border-red-500/20 text-red-400 text-[11px] font-mono rounded">
                      {codecError}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={handleBase64Encode}
                      className="py-1.5 bg-[#1e1e1e] hover:bg-blue-600 border border-[#2c2c2c] hover:border-blue-500 text-gray-300 hover:text-white font-bold text-[10px] rounded transition-all cursor-pointer"
                    >
                      Base64 编码
                    </button>
                    <button
                      onClick={handleBase64Decode}
                      className="py-1.5 bg-[#1e1e1e] hover:bg-blue-600 border border-[#2c2c2c] hover:border-blue-500 text-gray-300 hover:text-white font-bold text-[10px] rounded transition-all cursor-pointer"
                    >
                      Base64 解码
                    </button>
                    <button
                      onClick={handleURLEncode}
                      className="py-1.5 bg-[#1e1e1e] hover:bg-emerald-600 border border-[#2c2c2c] hover:border-emerald-500 text-gray-300 hover:text-white font-bold text-[10px] rounded transition-all cursor-pointer"
                    >
                      URL Encode
                    </button>
                    <button
                      onClick={handleURLDecode}
                      className="py-1.5 bg-[#1e1e1e] hover:bg-emerald-600 border border-[#2c2c2c] hover:border-emerald-500 text-gray-300 hover:text-white font-bold text-[10px] rounded transition-all cursor-pointer"
                    >
                      URL Decode
                    </button>
                    <button
                      onClick={handleJSONFormat}
                      className="py-1.5 bg-[#1e1e1e] hover:bg-purple-600 border border-[#2c2c2c] hover:border-purple-500 text-gray-300 hover:text-white font-bold text-[10px] rounded transition-all cursor-pointer"
                    >
                      JSON 美化
                    </button>
                    <button
                      onClick={handleJSONMinify}
                      className="py-1.5 bg-[#1e1e1e] hover:bg-purple-600 border border-[#2c2c2c] hover:border-purple-500 text-gray-300 hover:text-white font-bold text-[10px] rounded transition-all cursor-pointer"
                    >
                      JSON 混淆压缩
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 block font-semibold">输出处理结果</span>
                      {codecOutput && (
                        <button
                          onClick={() => handleCopyToClipboard(codecOutput, '格式转换结果')}
                          className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <DynamicIcon name="Copy" size={10} />
                          <span>一键复制</span>
                        </button>
                      )}
                    </div>
                    <textarea
                      readOnly
                      value={codecOutput}
                      placeholder="处理结果将在此实时渲染。支持一键复制到开发板环境。"
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-xs text-gray-300 font-mono h-24 focus:outline-none resize-none leading-normal"
                    />
                  </div>
                </div>
              </div>


              {/* Timestamp / Datetime converter */}
              <div className="bg-[#161616]/60 border border-[#232323] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#232323] pb-2">
                  <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <DynamicIcon name="Clock" size={13} className="text-amber-400" />
                    <span>Unix 纪元时间戳转换工具</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold animate-pulse">
                    LIVE: {currentEpoch}
                  </span>
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    在后端全栈、微服务与数据库开发中，由于 Windows 宿主与 Linux 系统的底层差异，时间戳格式核准与验证至关重要。
                  </p>

                  <div className="bg-[#0a0a0a] border border-[#262626] p-3.5 rounded-lg space-y-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-gray-500 font-bold block">时间戳 (秒级 或 毫秒级)</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={timestampSec}
                          onChange={(e) => setTimestampSec(e.target.value)}
                          placeholder="输入时间戳 (例: 1782713458)..."
                          className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={() => {
                            setTimestampSec(String(Math.floor(Date.now() / 1000)));
                          }}
                          className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#262626] text-gray-300 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          当前
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleConvertTimestamp}
                        className="py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        时间戳 ➔ 格式化日期
                      </button>
                      <button
                        type="button"
                        onClick={handleConvertDate}
                        className="py-2 bg-zinc-700 hover:bg-zinc-600 text-gray-200 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        当前日期 ➔ 时间戳
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] text-gray-500 font-bold block">转换后的国际化标准时间 (UTC / Local)</span>
                    <div className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-xs text-gray-300 font-mono font-bold leading-normal">
                      {timestampFormatted || '暂无数据，请在上方输入并点击执行转换...'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}


          {/* TAB 4: GIT REPO MANAGEMENT & CMD TERMINAL */}
          {activeTab === 'gitTerm' && (
            <motion.div
              key="gitTerm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn"
            >
              {/* Repo Selector & Actions */}
              <div className="md:col-span-1 bg-[#161616]/60 border border-[#232323] rounded-xl p-4.5 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <DynamicIcon name="Github" size={13} className="text-blue-400" />
                    <span>代码仓库管理及 Git 动作台</span>
                  </span>
                  <p className="text-[10px] text-gray-500 leading-snug">切换不同的工程目录执行快捷 Git 版本控制</p>
                </div>

                {/* Repo list */}
                <div className="space-y-2">
                  {gitRepos.map((repo) => (
                    <div
                      key={repo.id}
                      onClick={() => setSelectedRepo(repo.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        selectedRepo === repo.id
                          ? 'bg-[#1a1a1a] border-blue-500/50'
                          : 'bg-[#101010]/30 border-[#232323] hover:border-[#333333]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span className="text-gray-200">{repo.name}</span>
                        <span className={`text-[10px] ${repo.status === 'dirty' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          ● {repo.status === 'dirty' ? `${repo.changes} 个修改` : '干净'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-2">
                        <span>分支: <span className="text-gray-400 font-bold">{repo.branch}</span></span>
                        <span className="truncate max-w-[120px]">{repo.lastCommit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-[1px] bg-[#232323]" />

                {/* Action buttons */}
                <div className="space-y-2">
                  <button
                    disabled={gitStatusActive}
                    onClick={() => handleGitAction('status')}
                    className="w-full py-2 bg-[#1c1c1c] hover:bg-[#262626] border border-[#2c2c2c] text-gray-300 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <DynamicIcon name="Eye" size={12} className="text-blue-400" />
                    <span>Git Status (状态)</span>
                  </button>
                  <button
                    disabled={gitStatusActive}
                    onClick={() => handleGitAction('pull')}
                    className="w-full py-2 bg-[#1c1c1c] hover:bg-[#262626] border border-[#2c2c2c] text-gray-300 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <DynamicIcon name="GitPullRequest" size={12} className="text-emerald-400" />
                    <span>Git Pull (拉取同步)</span>
                  </button>
                  <button
                    disabled={gitStatusActive}
                    onClick={() => handleGitAction('branch')}
                    className="w-full py-2 bg-[#1c1c1c] hover:bg-[#262626] border border-[#2c2c2c] text-gray-300 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <DynamicIcon name="GitFork" size={12} className="text-pink-400" />
                    <span>Git Branches (分支列表)</span>
                  </button>
                </div>
              </div>


              {/* Embedded Shell Terminal */}
              <div className="md:col-span-2 space-y-4">
                
                {/* Micro Terminal logs panel */}
                <div className="bg-[#060606] border border-[#232323] rounded-xl p-4 flex flex-col justify-between h-[250px] shadow-inner font-mono">
                  <div className="overflow-y-auto space-y-1.5 text-xs text-gray-300 leading-relaxed scrollbar-thin select-text">
                    {terminalLogs.map((log, i) => (
                      <div key={i} className="whitespace-pre-wrap">
                        {log}
                      </div>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-600 border-t border-[#181818] pt-2 mt-2">
                    <span className="flex items-center gap-1">
                      <DynamicIcon name="Terminal" size={10} />
                      <span>Windows Virtual PowerShell Engine</span>
                    </span>
                    <button
                      onClick={() => setTerminalLogs([
                        'Microsoft Windows [Version 10.0.22631.3527]',
                        '(c) Microsoft Corporation. All rights reserved.',
                        '',
                        `C:\\Users\\Developer\\Workspaces\\${selectedRepo}> _`
                      ])}
                      className="hover:text-blue-400 text-gray-500 cursor-pointer"
                    >
                      清空终端
                    </button>
                  </div>
                </div>

                {/* Windows preset system scripting toolbox */}
                <div className="bg-[#161616]/60 border border-[#232323] rounded-xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                      <DynamicIcon name="Wrench" size={12} className="text-amber-400" />
                      <span>Windows 环境调试指令快捷下发面板</span>
                    </span>
                    <span className="text-[10px] text-gray-500">SysOps</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { title: '重置 DNS 缓存缓存', cmd: 'ipconfig /flushdns' },
                      { title: '热重启 IIS 控制服务', cmd: 'iisreset /restart' },
                      { title: '终止全局 WSL 运行内核', cmd: 'wsl --shutdown' },
                      { title: '检查 Docker 系统开销', cmd: 'docker system df' }
                    ].map((script, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSystemCmdTrigger(script.title, script.cmd)}
                        className="p-2.5 rounded-lg bg-[#101010]/40 border border-[#232323] hover:border-amber-500/30 text-left hover:bg-[#1a1a1a]/60 text-gray-300 font-mono transition-all flex items-center justify-between cursor-pointer"
                      >
                        <div className="truncate pr-2">
                          <div className="text-[10px] text-gray-500 leading-normal font-sans font-semibold">{script.title}</div>
                          <div className="text-[11px] text-blue-400 mt-0.5 truncate font-semibold">$ {script.cmd}</div>
                        </div>
                        <DynamicIcon name="ChevronRight" size={12} className="text-gray-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Kill Confirm Modal */}
      {killConfirmModal && killConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#111111] border border-red-900/30 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 bg-red-600/10 rounded-lg border border-red-500/20">
                <DynamicIcon name="AlertTriangle" size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-200">高危指令: 强制终止进程</h3>
                <p className="text-[11px] text-zinc-500 font-mono">taskkill /F /PID {killConfirmModal.pid}</p>
              </div>
            </div>

            <div className="bg-[#1a1a1a]/40 border border-[#262626] p-3.5 rounded-xl space-y-2 text-xs text-gray-400">
              <p className="leading-relaxed">
                确定要强制杀死正在占用当前端口的进程 <span className="text-red-400 font-bold font-mono">{killConfirmModal.service}</span> (PID: <span className="text-blue-400 font-bold font-mono">{killConfirmModal.pid}</span>) 吗？
              </p>
              <div className="pt-2 border-t border-[#262626] space-y-1.5">
                <span className="text-[10.5px] font-bold text-zinc-500 block">🌳 探测到受影响的子树与依赖项：</span>
                <div className="bg-[#0a0a0a] p-2 rounded text-[10px] font-mono space-y-1 leading-normal text-zinc-400">
                  <div className="text-gray-300">└─ {killConfirmModal.service} (PID: {killConfirmModal.pid})</div>
                  <div className="text-zinc-600 pl-4">├─ child_process_daemon.exe (PID: {killConfirmModal.pid + 42})</div>
                  <div className="text-zinc-600 pl-4">├─ win_io_worker.sys (内核句柄绑定)</div>
                  <div className="text-zinc-600 pl-4">└─ network_listener_sockets (监听通道 0.0.0.0)</div>
                </div>
                <span className="text-[9.5px] text-amber-500 block">⚠️ 警告：杀死核心本地服务可能导致调试控制台中断或需要重新编译运行。</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setKillConfirmModal(null)}
                className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#262626] text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleKillProcess(killConfirmModal.pid, killConfirmModal.service)}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-600/20 transition-all hover:scale-105 cursor-pointer"
              >
                确认强制杀死
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
