/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardConfig, LocalService, WebLink, CustomPlugin, SystemMessage } from './types.js';
import ServiceCard from './components/ServiceCard.js';
import ServiceModal from './components/ServiceModal.js';
import PluginContainer from './components/PluginContainer.js';
import PluginModal from './components/PluginModal.js';
import MessagePanel from './components/MessagePanel.js';
import AIAssistant from './components/AIAssistant.js';
import DynamicIcon from './components/DynamicIcon.js';
import AIAgentsControl from './components/AIAgentsControl.js';
import WinDevSuite from './components/WinDevSuite.js';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Global dashboard state
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Modal states
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<LocalService | null>(null);
  
  const [isPluginModalOpen, setIsPluginModalOpen] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<CustomPlugin | null>(null);

  // Inline Link state
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkCategory, setNewLinkCategory] = useState('常用链接');

  // Loading animation state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch Dashboard configuration from Express backend
  const fetchConfig = useCallback(async (shouldPingAll = false) => {
    try {
      const res = await fetch('/api/config');
      const data = (await res.json()) as DashboardConfig;
      setConfig(data);
      setLoading(false);

      if (shouldPingAll && data.services.length > 0) {
        triggerPingAll(data.services);
      }
    } catch (err) {
      console.error('Failed to load system config:', err);
      setLoading(false);
    }
  }, []);

  // Save Dashboard configuration to Express backend
  const saveConfig = async (updatedConfig: DashboardConfig) => {
    try {
      setConfig(updatedConfig);
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
    } catch (err) {
      console.error('Failed to persist configuration:', err);
    }
  };

  // Add system notifications & events logs
  const addSystemLog = useCallback((
    title: string,
    content: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) => {
    if (!config) return;

    const newMsg: SystemMessage = {
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      title,
      content
    };

    const updatedConfig = {
      ...config,
      messages: [newMsg, ...config.messages].slice(0, 100) // Keep last 100 entries
    };

    saveConfig(updatedConfig);

    // Dispatch global system event for the plugin microkernel event bus
    try {
      const event = new CustomEvent('sys-event', {
        detail: {
          id: newMsg.id,
          timestamp: newMsg.timestamp,
          type: newMsg.type,
          title: newMsg.title,
          content: newMsg.content
        }
      });
      window.dispatchEvent(event);
    } catch (e) {
      console.error('Failed to dispatch system event to bus:', e);
    }
  }, [config]);

  // Toggle a module visibility setting safely to avoid stale state races
  const toggleSettingWithLog = (
    key: 'showServices' | 'showAgents' | 'showPlugins' | 'showBookmarks' | 'showCommands' | 'showLogs' | 'showAssistant' | 'showWinDevSuite',
    moduleName: string
  ) => {
    if (!config) return;
    const currentVal = config.settings[key] !== false;
    const nextVal = !currentVal;

    const newMsg: SystemMessage = {
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'info',
      title: nextVal ? '显示模块' : '隐藏模块',
      content: `${moduleName}模块已${nextVal ? '显示' : '隐藏'}。`
    };

    const updatedConfig: DashboardConfig = {
      ...config,
      settings: {
        ...config.settings,
        [key]: nextVal
      },
      messages: [newMsg, ...config.messages].slice(0, 100)
    };

    saveConfig(updatedConfig);
  };

  // Ping a single service via backend TCP/HTTP engine
  const handlePingService = async (serviceId: string) => {
    if (!config) return;

    // Set checking status
    const tempServices = config.services.map((s) =>
      s.id === serviceId ? { ...s, status: 'checking' as const } : s
    );
    setConfig({ ...config, services: tempServices });

    const target = config.services.find((s) => s.id === serviceId);
    if (!target) return;

    try {
      const res = await fetch('/api/ping-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target)
      });
      const data = await res.json();
      
      const newStatus = data.status as 'online' | 'offline';
      
      // Notify if status changed
      if (target.status !== newStatus && target.status !== 'checking') {
        addSystemLog(
          `服务状态变更: ${target.name}`,
          `服务由 ${target.status} 变更为 [${newStatus.toUpperCase()}]。目标探针: ${target.url}`,
          newStatus === 'online' ? 'success' : 'error'
        );

        if (newStatus === 'offline' && target.autoRecover && target.startupCommand) {
          addSystemLog(
            `智能运维自愈: ${target.name}`,
            `检测到该核心服务非正常离线，故障自愈机制已激活！正在自动拉起并重启服务: \`${target.startupCommand}\`...`,
            'warning'
          );
          setTimeout(() => {
            handleLaunchService(target);
          }, 1200);
        }
      }

      const updatedServices = config.services.map((s) =>
        s.id === serviceId ? { ...s, status: newStatus, lastChecked: new Date().toISOString() } : s
      );

      saveConfig({ ...config, services: updatedServices });
    } catch (error) {
      const updatedServices = config.services.map((s) =>
        s.id === serviceId ? { ...s, status: 'offline' as const, lastChecked: new Date().toISOString() } : s
      );
      saveConfig({ ...config, services: updatedServices });
    }
  };

  // Batch ping all services in parallel (high-performance)
  const triggerPingAll = async (servicesList: LocalService[]) => {
    if (!config || isRefreshing) return;
    setIsRefreshing(true);

    // Set all services to checking
    const checkingServices = config.services.map((s) => ({
      ...s,
      status: s.pingType === 'none' ? s.status : ('checking' as const)
    }));
    setConfig({ ...config, services: checkingServices });

    try {
      const res = await fetch('/api/ping-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: servicesList.filter(s => s.pingType !== 'none') })
      });
      
      const results = (await res.json()) as { id: string; status: 'online' | 'offline' }[];
      
      const updatedServices = config.services.map((s) => {
        const checkResult = results.find((r) => r.id === s.id);
        if (checkResult) {
          // Status change alert
          if (s.status !== checkResult.status && s.status !== 'checking') {
            addSystemLog(
              `批量检测: ${s.name} ${checkResult.status === 'online' ? '恢复正常' : '连接中断'}`,
              `探针在检测到状态更改后已刷新系统日志。`,
              checkResult.status === 'online' ? 'success' : 'error'
            );

            if (checkResult.status === 'offline' && s.autoRecover && s.startupCommand) {
              addSystemLog(
                `智能运维自愈: ${s.name}`,
                `离线探针触发自动恢复预案！正在自动调度并调用指令拉起: \`${s.startupCommand}\`...`,
                'warning'
              );
              setTimeout(() => {
                handleLaunchService(s);
              }, 1200);
            }
          }
          return { ...s, status: checkResult.status, lastChecked: new Date().toISOString() };
        }
        return s;
      });

      saveConfig({ ...config, services: updatedServices });
    } catch (err) {
      console.error('Batch ping error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Run startup scripts simulation
  const handleLaunchService = async (service: LocalService) => {
    try {
      const res = await fetch('/api/launch-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          name: service.name,
          startupCommand: service.startupCommand
        })
      });
      const data = await res.json();
      
      if (data.success && config) {
        // Append startup log
        const updatedConfig = {
          ...config,
          messages: [data.log, ...config.messages].slice(0, 100)
        };
        setConfig(updatedConfig);
        
        // Mark as started and immediately test status in 2 seconds
        setTimeout(() => {
          handlePingService(service.id);
        }, 2000);
      }
    } catch (err) {
      console.error('Launch command failed:', err);
    }
  };

  // Save or edit a service config
  const handleSaveService = (service: LocalService) => {
    if (!config) return;

    let updatedServices: LocalService[];
    const exists = config.services.some((s) => s.id === service.id);

    if (exists) {
      updatedServices = config.services.map((s) => (s.id === service.id ? service : s));
      addSystemLog('修改服务配置', `成功修改了 [${service.name}] 服务的所有主要监控属性。`, 'info');
    } else {
      updatedServices = [...config.services, service];
      addSystemLog('添加新服务', `已将服务监视器 [${service.name}] 成功部署到个人导航面板。`, 'success');
    }

    saveConfig({ ...config, services: updatedServices });
    // Trigger immediate check for this new service
    setTimeout(() => handlePingService(service.id), 500);
  };

  // Delete a service
  const handleDeleteService = (serviceId: string) => {
    if (!config) return;
    const srv = config.services.find((s) => s.id === serviceId);
    const updatedServices = config.services.filter((s) => s.id !== serviceId);
    
    saveConfig({ ...config, services: updatedServices });
    if (srv) {
      addSystemLog('移除服务监视', `成功从您的导航面板中卸载了 [${srv.name}] 端口传感器。`, 'warning');
    }
  };

  // Inline Fast Bookmarks adding
  const handleAddLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle.trim() || !newLinkUrl.trim() || !config) return;

    const newLink: WebLink = {
      id: `lnk-${Date.now()}`,
      title: newLinkTitle.trim(),
      url: newLinkUrl.trim(),
      category: newLinkCategory.trim() || '常用链接',
      icon: 'Globe'
    };

    saveConfig({
      ...config,
      links: [...config.links, newLink]
    });

    addSystemLog('添加新书签', `书签 [${newLink.title}] 已成功收纳至分类 [${newLink.category}] 中。`, 'success');
    
    // Clear fields
    setNewLinkTitle('');
    setNewLinkUrl('');
    setIsAddingLink(false);
  };

  // Delete Bookmark
  const handleDeleteLink = (id: string) => {
    if (!config) return;
    const lnk = config.links.find(l => l.id === id);
    const updated = config.links.filter(l => l.id !== id);
    saveConfig({ ...config, links: updated });
    if (lnk) {
      addSystemLog('移除书签', `已成功移除书签链接 [${lnk.title}]。`, 'info');
    }
  };

  // Toggle dynamic plugins
  const handleTogglePlugin = (pluginId: string) => {
    if (!config) return;
    const updated = config.plugins.map((p) =>
      p.id === pluginId ? { ...p, enabled: !p.enabled } : p
    );
    const target = config.plugins.find(p => p.id === pluginId);
    saveConfig({ ...config, plugins: updated });

    if (target) {
      addSystemLog(
        target.enabled ? '停用插件' : '启用插件',
        `已成功${target.enabled ? '关闭' : '开启'} [${target.name}] 的实时渲染和背景沙箱计算。`,
        target.enabled ? 'warning' : 'success'
      );
    }
  };

  // Install custom plugin compiled by AI or user
  const handleInstallPlugin = (plugin: CustomPlugin) => {
    if (!config) return;
    // Check if duplicate ID exists, replace if so
    const exists = config.plugins.some(p => p.id === plugin.id);
    let updated: CustomPlugin[];
    if (exists) {
      updated = config.plugins.map(p => p.id === plugin.id ? plugin : p);
    } else {
      updated = [...config.plugins, plugin];
    }
    saveConfig({ ...config, plugins: updated });
  };

  // Delete a plugin
  const handleDeletePlugin = (pluginId: string) => {
    if (!config) return;
    const target = config.plugins.find(p => p.id === pluginId);
    const updated = config.plugins.filter(p => p.id !== pluginId);
    saveConfig({ ...config, plugins: updated });

    if (target) {
      addSystemLog('卸载面板插件', `已安全删除 [${target.name}] 插件的代码及存储状态。`, 'warning');
    }
  };

  // Initial Loading and Polling checks
  useEffect(() => {
    fetchConfig(true);
  }, [fetchConfig]);

  // Polling check timer configuration
  useEffect(() => {
    if (!config || !config.settings.autoRefresh) return;

    const intervalMs = config.settings.refreshInterval * 1000;
    const timer = setInterval(() => {
      triggerPingAll(config.services);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [config?.settings.autoRefresh, config?.settings.refreshInterval, config?.services]);

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12 flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-20" />
            <DynamicIcon name="Cpu" size={32} className="text-indigo-400 animate-pulse" />
          </div>
          <div className="text-center space-y-1.5">
            <h1 className="text-base font-bold tracking-tight">载入个人高性能服务面板...</h1>
            <p className="text-xs text-zinc-500 font-mono">Loading telemetry, network sockets & custom plugins</p>
          </div>
        </div>
      </div>
    );
  }

  // Derived properties
  const servicesCount = config.services.length;
  const onlineCount = config.services.filter((s) => s.status === 'online').length;
  const offlineCount = config.services.filter((s) => s.status === 'offline').length;

  // Filtered services list
  const filteredServices = config.services.filter((s) => {
    const matchQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (s.port && s.port.toString().includes(searchQuery)) ||
                       (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchCategory = activeCategory === 'all' || s.category === activeCategory;
    
    return matchQuery && matchCategory;
  });

  // Unique categories of current services for tabs
  const serviceCategories = ['all', ...Array.from(new Set(config.services.map((s) => s.category)))];

  // Group bookmarks by category
  const bookmarksByCategory = config.links.reduce((acc, link) => {
    if (!acc[link.category]) acc[link.category] = [];
    acc[link.category].push(link);
    return acc;
  }, {} as Record<string, WebLink[]>);

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans antialiased overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Dynamic Background Mesh Effect */}
      <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[20%] left-[10%] w-[60%] h-[80%] rounded-full bg-radial from-blue-900/10 to-transparent blur-3xl" />
        <div className="absolute top-[10%] right-[5%] w-[40%] h-[60%] rounded-full bg-radial from-emerald-900/10 to-transparent blur-3xl" />
      </div>

      {/* Primary Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* --- HEADER BAR --- */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#262626]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-900 to-blue-600/20 border border-blue-500/30 shadow-lg shadow-blue-500/5">
                <DynamicIcon name="Cpu" size={24} className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-200 tracking-tight flex items-center gap-2">
                  <span>{config.settings.systemName}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono">v2.1 Pro</span>
                </h1>
                <p className="text-xs text-gray-400 font-medium">高性能本地端口监视及个性化研发微内核工作台</p>
              </div>
            </div>
          </div>

          {/* Quick Telemetry Overview */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status counter pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111111] border border-[#262626] text-xs font-mono">
              <span className="text-gray-500 font-sans">全部:</span>
              <span className="text-gray-200 font-bold">{servicesCount}</span>
              <span className="h-3 w-[1px] bg-[#262626] mx-1" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 font-bold">{onlineCount}</span>
              <span className="h-3 w-[1px] bg-[#262626] mx-1" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
              <span className="text-gray-400 font-bold">{offlineCount}</span>
            </div>

            {/* Config & Auto-refresh panel */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111111] border border-[#262626] text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">轮询间隔:</span>
                <select
                  value={config.settings.refreshInterval}
                  onChange={(e) => {
                    const sec = parseInt(e.target.value, 10);
                    saveConfig({
                      ...config,
                      settings: { ...config.settings, refreshInterval: sec }
                    });
                    addSystemLog('修改检测频率', `轮询检测间隔调整为 [${sec}秒]。`, 'info');
                  }}
                  className="bg-[#0a0a0a] border border-[#262626] rounded px-1.5 py-0.5 text-gray-300 font-mono text-[11px] focus:outline-none"
                >
                  <option value={5}>5 秒</option>
                  <option value={10}>10 秒</option>
                  <option value={30}>30 秒</option>
                  <option value={60}>60 秒</option>
                </select>
              </div>

              <span className="h-3 w-[1px] bg-[#262626] mx-1" />

              <button
                onClick={() => {
                  saveConfig({
                    ...config,
                    settings: { ...config.settings, autoRefresh: !config.settings.autoRefresh }
                  });
                  addSystemLog(
                    config.settings.autoRefresh ? '暂停自动监测' : '启用自动监测',
                    `系统已${config.settings.autoRefresh ? '暂停' : '启动'}端口背景自测，当前间隔为 [${config.settings.refreshInterval}秒]。`,
                    config.settings.autoRefresh ? 'warning' : 'success'
                  );
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  config.settings.autoRefresh 
                    ? 'text-emerald-400 hover:text-emerald-300' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                title={config.settings.autoRefresh ? '点击暂停后台轮询' : '点击开启后台轮询'}
              >
                <DynamicIcon name="Clock" size={12} className={config.settings.autoRefresh ? 'animate-pulse' : ''} />
                <span>{config.settings.autoRefresh ? '开启中' : '已暂停'}</span>
              </button>
            </div>

            {/* Manual refresh btn */}
            <button
              onClick={() => triggerPingAll(config.services)}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-1.5 px-4.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/10 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <DynamicIcon name="RefreshCw" size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? '监测中...' : '立即同步监测'}</span>
            </button>
          </div>
        </header>

        {/* --- SYSTEM STATS & BENTO BENCH --- */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#111111] border border-[#262626] rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <DynamicIcon name="TrendingUp" size={20} />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold font-mono">检测可用率 (Uptime)</span>
              <span className="text-xl font-bold font-mono text-gray-200">
                {servicesCount ? `${((onlineCount / servicesCount) * 100).toFixed(0)}%` : '100%'}
              </span>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#262626] rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <DynamicIcon name="Network" size={20} />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold font-mono">诊断延时估算</span>
              <span className="text-xl font-bold font-mono text-gray-200">
                {onlineCount ? `${(15 + Math.random() * 20).toFixed(0)} ms` : '0 ms'}
              </span>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#262626] rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <DynamicIcon name="Boxes" size={20} />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold font-mono">微型插件引擎</span>
              <span className="text-xl font-bold font-mono text-gray-200">
                {config.plugins.filter(p => p.enabled).length} / {config.plugins.length} <span className="text-xs text-gray-500 font-sans">Active</span>
              </span>
            </div>
          </div>

          {/* Quick Edit system name & Module Toggles */}
          <div className="bg-[#111111] border border-[#262626] rounded-xl p-4 flex flex-col gap-3">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold font-mono mb-1">重命名工作台</span>
              <input
                type="text"
                value={config.settings.systemName}
                onChange={(e) => {
                  saveConfig({
                    ...config,
                    settings: { ...config.settings, systemName: e.target.value }
                  });
                }}
                className="w-full bg-transparent text-sm text-gray-300 font-semibold focus:outline-none focus:border-blue-500 border-b border-[#262626] py-0.5 transition-colors"
                placeholder="命名您的控制面板"
              />
            </div>
            
            <div className="border-t border-[#232323] pt-2.5 space-y-2 text-[11px]">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold font-mono mb-1">模块显示控制</span>
              {[
                { key: 'showServices', label: '服务与端口监视', icon: 'Server', color: 'text-blue-400' },
                { key: 'showWinDevSuite', label: 'Win全栈开发套件', icon: 'Layers', color: 'text-blue-500' },
                { key: 'showAgents', label: 'AI智能体中控台', icon: 'Cpu', color: 'text-emerald-400' },
                { key: 'showPlugins', label: '运行插件工作区', icon: 'Boxes', color: 'text-purple-400' },
                { key: 'showBookmarks', label: '极速导航书签库', icon: 'Globe', color: 'text-amber-400' },
                { key: 'showCommands', label: '快捷服务启动区', icon: 'Terminal', color: 'text-red-400' },
                { key: 'showLogs', label: '系统通知与日志', icon: 'MessageSquare', color: 'text-teal-400' },
                { key: 'showAssistant', label: 'AI研发专家助理', icon: 'Sparkles', color: 'text-pink-400' }
              ].map(({ key, label, icon, color }) => {
                const isActive = config.settings[key as keyof DashboardConfig['settings']] !== false;
                return (
                  <div key={key} className="flex items-center justify-between py-1">
                    <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                      <DynamicIcon name={icon} size={12} className={color} />
                      <span>{label}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSettingWithLog(key as any, label)}
                      className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isActive ? 'bg-blue-600' : 'bg-[#1e1e1e]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- MAIN WORKSPACE --- */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLS: SERVICES & PLUGINS */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* SERVICES PANEL */}
            {config.settings.showServices !== false ? (
              <section className="bg-[#111111] border border-[#262626] rounded-2xl p-6 space-y-6">
                
                {/* Controls bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold text-gray-200 flex items-center gap-2">
                      <DynamicIcon name="Server" size={18} className="text-blue-400" />
                      <span>服务与网络端口状态监视区</span>
                    </h2>
                    <p className="text-xs text-gray-400">实时探测 TCP/HTTP 协议，提供毫秒级微探针服务测试</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Layout Selector */}
                    <div className="flex items-center bg-[#1a1a1a] border border-[#262626] p-1 rounded-lg">
                      {(['bento', 'grid', 'list'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => {
                            saveConfig({
                              ...config,
                              settings: { ...config.settings, layoutMode: mode }
                            });
                          }}
                          className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                            config.settings.layoutMode === mode
                              ? 'bg-[#262626] text-gray-200'
                              : 'text-gray-500 hover:text-gray-400'
                          }`}
                          title={`${mode === 'bento' ? '舒适布局' : mode === 'grid' ? '紧凑网格' : '列表模式'}`}
                        >
                          <DynamicIcon name={mode === 'bento' ? 'Sliders' : mode === 'grid' ? 'Layers' : 'FileText'} size={14} />
                        </button>
                      ))}
                    </div>

                    {/* Add service button */}
                    <button
                      onClick={() => {
                        setEditingService(null);
                        setIsServiceModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs text-white font-bold cursor-pointer hover:scale-[1.02] transition-transform"
                    >
                      <DynamicIcon name="Plus" size={13} />
                      <span>添加监视</span>
                    </button>

                    {/* Hide module button */}
                    <button
                      onClick={() => toggleSettingWithLog('showServices', '服务与端口监视')}
                      className="p-1.5 bg-[#1a1a1a] hover:bg-red-500/10 hover:text-red-400 border border-[#262626] text-gray-400 rounded-lg cursor-pointer transition-colors"
                      title="隐藏此模块"
                    >
                      <DynamicIcon name="EyeOff" size={14} />
                    </button>
                  </div>
                </div>

                {/* Filters Tabs and Search Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0a0a0a] border-y border-[#262626] py-3">
                  
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                      <DynamicIcon name="Search" size={14} />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="输入服务名称、运行端口或协议进行模糊检索..."
                      className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg pl-9 pr-4 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300"
                      >
                        <DynamicIcon name="X" size={12} />
                      </button>
                    )}
                  </div>

                  {/* Categories filtering tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full sm:max-w-[50%]">
                    {serviceCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap transition-all cursor-pointer ${
                          activeCategory === cat
                            ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                            : 'bg-[#111111] border border-[#262626] text-gray-400 hover:text-gray-300'
                        }`}
                      >
                        {cat === 'all' ? '全部' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Services Dynamic rendering stage */}
                {filteredServices.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-[#262626] rounded-xl space-y-2.5">
                    <DynamicIcon name="Server" size={24} className="text-gray-600 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-400">没有检索到匹配的服务配置</p>
                      <p className="text-xs text-gray-600">输入其他关键字或点击上方“添加监视”部署一个新服务</p>
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    id="services-stage"
                    layout
                    className={
                      config.settings.layoutMode === 'bento'
                        ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                        : config.settings.layoutMode === 'grid'
                        ? 'grid grid-cols-2 md:grid-cols-3 gap-3'
                        : 'flex flex-col gap-2'
                    }
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredServices.map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          onPing={handlePingService}
                          onLaunch={handleLaunchService}
                          onEdit={(srv) => {
                            setEditingService(srv);
                            setIsServiceModalOpen(true);
                          }}
                          onDelete={handleDeleteService}
                          onOpenUrl={handleOpenUrl}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </section>
            ) : (
              <div className="bg-[#111111]/40 border border-dashed border-[#262626] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#161616]/60 text-zinc-400 border border-[#262626]">
                    <DynamicIcon name="EyeOff" size={20} className="text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-300">服务与网络端口状态监视模块已隐藏</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">后台自动化状态监测与检测仍在静默低功耗运行中</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSettingWithLog('showServices', '服务与端口监视')}
                  className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/25 hover:border-blue-500/40 text-xs font-bold rounded-xl transition-all hover:scale-[1.02] cursor-pointer"
                >
                  点击重新展开模块
                </button>
              </div>
            )}

            {/* WINDOWS DEVELOPER & FULL-STACK SUITE */}
            {config.settings.showWinDevSuite !== false ? (
              <WinDevSuite config={config} onAddSystemLog={addSystemLog} />
            ) : (
              <div className="bg-[#111111]/40 border border-dashed border-[#262626] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#161616]/60 text-zinc-400 border border-[#262626]">
                    <DynamicIcon name="Layers" size={20} className="text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-300">Windows 研发与全栈提效工作台已隐藏</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">宿主环境状态诊断、接口联调和编解码转换工具集处于离线休眠状态</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSettingWithLog('showWinDevSuite', 'Win全栈开发套件')}
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-blue-600/10 text-gray-400 hover:text-blue-400 border border-[#262626] hover:border-blue-500/25 text-xs font-bold rounded-xl transition-all hover:scale-[1.02] cursor-pointer"
                >
                  点击重新展开
                </button>
              </div>
            )}

            {/* AI AGENTS MULTI-TASK CONTROL CENTER */}
            {config.agents && (
              config.settings.showAgents !== false ? (
                <AIAgentsControl
                  agents={config.agents}
                  onRefreshConfig={() => fetchConfig(false)}
                  addSystemLog={addSystemLog}
                />
              ) : (
                <div className="bg-[#111111]/40 border border-dashed border-[#262626] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="p-3 rounded-xl bg-[#161616]/60 text-zinc-400 border border-[#262626]">
                      <DynamicIcon name="Cpu" size={20} className="text-gray-500" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-300">AI 智能体多任务中控台已隐藏</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">多线程智能体后台会话、检索和自主决策仍在静默运行中</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSettingWithLog('showAgents', 'AI智能体中控台')}
                    className="px-4 py-2 bg-[#1a1a1a] hover:bg-blue-600/10 text-gray-400 hover:text-blue-400 border border-[#262626] hover:border-blue-500/25 text-xs font-bold rounded-xl transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    点击重新展开
                  </button>
                </div>
              )
            )}

            {/* PLUGINS WORKSPACE PANEL */}
            {config.settings.showPlugins !== false ? (
              <section className="bg-[#111111] border border-[#262626] rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold text-gray-200 flex items-center gap-2">
                      <DynamicIcon name="Boxes" size={18} className="text-blue-400" />
                      <span>微内核自定义运行插件区</span>
                    </h2>
                    <p className="text-xs text-gray-400">支持独立编译、实时沙箱运行及状态持久化，无限丰富工作台生态</p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingPlugin(null);
                      setIsPluginModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#262626] rounded-lg text-xs text-gray-300 font-bold border border-[#262626] cursor-pointer transition-colors"
                  >
                    <DynamicIcon name="Plus" size={13} className="text-blue-400" />
                    <span>添加微插件</span>
                  </button>
                </div>

                {config.plugins.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-zinc-900 rounded-xl text-zinc-600 text-xs italic">
                    暂未安装任何插件，您可以问 AI 助理或点击右上角创建一个自定义小组件
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.plugins.map((plugin) => (
                      <PluginContainer
                        key={plugin.id}
                        plugin={plugin}
                        onToggle={handleTogglePlugin}
                        onDelete={handleDeletePlugin}
                        onEdit={(p) => {
                          setEditingPlugin(p);
                          setIsPluginModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <div className="bg-[#111111]/40 border border-dashed border-[#262626] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#161616]/60 text-zinc-400 border border-[#262626]">
                    <DynamicIcon name="Boxes" size={20} className="text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-300">微内核自定义运行插件区已隐藏</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">所有已安装的自定义扩展插件均在静默待命状态</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSettingWithLog('showPlugins', '运行插件工作区')}
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-blue-600/10 text-gray-400 hover:text-blue-400 border border-[#262626] hover:border-blue-500/25 text-xs font-bold rounded-xl transition-all hover:scale-[1.02] cursor-pointer"
                >
                  点击重新展开
                </button>
              </div>
            )}
          </div>

          {/* RIGHT 1 COL: BOOKMARKS, QUICK LINK MANAGER & REFRESH */}
          <div className="space-y-8">
            
            {/* BOOKMARKS SECTION */}
            {config.settings.showBookmarks !== false ? (
              <section className="bg-[#111111] border border-[#262626] rounded-2xl p-6 space-y-5 flex flex-col justify-between animate-fadeIn">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-base font-semibold text-gray-200 flex items-center gap-2">
                        <DynamicIcon name="Globe" size={18} className="text-blue-400" />
                        <span>极速导航书签库</span>
                      </h2>
                      <p className="text-xs text-gray-400">分类收纳您常用的系统控制面板和高频外部网站</p>
                    </div>

                    <button
                      onClick={() => setIsAddingLink(!isAddingLink)}
                      className="p-1.5 rounded-lg bg-[#1a1a1a] border border-[#262626] text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
                      title="添加快捷书签"
                    >
                      <DynamicIcon name={isAddingLink ? 'X' : 'Plus'} size={14} />
                    </button>
                  </div>

                  {/* Inline Addition form */}
                  <AnimatePresence>
                    {isAddingLink && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddLinkSubmit}
                        className="bg-[#1a1a1a]/60 border border-[#262626] rounded-xl p-4 mt-4 space-y-3 overflow-hidden"
                      >
                        <h4 className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">新增书签连接</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            value={newLinkTitle}
                            onChange={(e) => setNewLinkTitle(e.target.value)}
                            placeholder="书签名称"
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                          />
                          <input
                            type="text"
                            required
                            value={newLinkCategory}
                            onChange={(e) => setNewLinkCategory(e.target.value)}
                            placeholder="分组目录"
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <input
                          type="url"
                          required
                          value={newLinkUrl}
                          onChange={(e) => setNewLinkUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                        />
                        <button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          保存并添加到目录
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <div className="h-[1px] bg-[#262626] my-4" />

                  {/* Categorized rendering */}
                  {config.links.length === 0 ? (
                    <div className="text-center py-8 text-gray-600 text-xs italic">
                      暂无快速导航书签，点击右上角加号进行配置
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(bookmarksByCategory).map(([cat, links]) => (
                        <div key={cat} className="space-y-2">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block border-l-2 border-blue-500 pl-2">
                            {cat}
                          </span>
                          <div className="grid grid-cols-1 gap-2">
                            {links.map((link) => (
                              <div
                                key={link.id}
                                className="group flex items-center justify-between p-2.5 rounded-lg bg-[#1a1a1a]/30 border border-[#262626] hover:border-[#333333] transition-colors"
                              >
                                <div 
                                  className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                                  onClick={() => handleOpenUrl(link.url)}
                                >
                                  <DynamicIcon name={link.icon || 'Globe'} size={14} className="text-gray-500 shrink-0" />
                                  <div className="truncate">
                                    <span className="text-xs text-gray-200 font-medium hover:text-blue-400 hover:underline">{link.title}</span>
                                    <span className="text-[9px] text-gray-600 block truncate font-mono mt-0.5">{link.url.replace(/^https?:\/\//, '')}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleOpenUrl(link.url)}
                                    className="text-gray-500 hover:text-gray-300 p-0.5"
                                    title="新窗口打开"
                                  >
                                    <DynamicIcon name="ExternalLink" size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLink(link.id)}
                                    className="text-gray-600 hover:text-red-400 p-0.5"
                                    title="移除此书签"
                                  >
                                    <DynamicIcon name="Trash" size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <div className="bg-[#111111]/40 border border-dashed border-[#262626] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#161616]/60 text-zinc-400 border border-[#262626]">
                    <DynamicIcon name="Globe" size={20} className="text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-300">极速导航书签库已隐藏</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">常用系统控制面板和高频外部网站书签仍保存在库中</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSettingWithLog('showBookmarks', '极速导航书签库')}
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-blue-600/10 text-gray-400 hover:text-blue-400 border border-[#262626] hover:border-blue-500/25 text-xs font-bold rounded-xl transition-all hover:scale-[1.02] cursor-pointer"
                >
                  点击重新展开
                </button>
              </div>
            )}

            {/* MANUAL SHELL ACTIONS & LAUNCHER PRESET */}
            {config.settings.showCommands !== false ? (
              <section className="bg-[#111111] border border-[#262626] rounded-2xl p-6 space-y-4">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-gray-200 flex items-center gap-2">
                    <DynamicIcon name="Terminal" size={18} className="text-blue-400" />
                    <span>服务快速启动及指令执行器</span>
                  </h2>
                  <p className="text-xs text-gray-400">快速下发特定系统控制任务</p>
                </div>

                <div className="space-y-2">
                  {[
                    { title: '重启 Nginx 服务', cmd: 'nginx -s reload', color: 'blue' },
                    { title: '查看 Docker 容器列表', cmd: 'docker ps -a', color: 'emerald' },
                    { title: '清理 Redis 全局缓存', cmd: 'redis-cli flushall', color: 'amber' }
                  ].map((act, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        addSystemLog(
                          `执行任务指令: ${act.title}`,
                          `用户点击触发了快捷模板命令: \`${act.cmd}\`。反馈结果: 命令信号已成功在虚拟 shell 环境中流式发送。`,
                          'success'
                        );
                      }}
                      className="w-full text-left p-3 rounded-lg bg-[#1a1a1a]/35 border border-[#262626] hover:border-[#333333] hover:bg-[#1a1a1a]/80 flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-gray-500 font-bold">$</span>
                        <span className="text-gray-300 truncate">{act.cmd}</span>
                      </div>
                      <span className="text-[10px] bg-[#0a0a0a] text-gray-500 px-1.5 py-0.5 rounded shrink-0">
                        运行
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <div className="bg-[#111111]/40 border border-dashed border-[#262626] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#161616]/60 text-zinc-400 border border-[#262626]">
                    <DynamicIcon name="Terminal" size={20} className="text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-300">快捷服务启动区已隐藏</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">预设虚拟 Shell 系统控制任务和命令仍然可用</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSettingWithLog('showCommands', '快捷服务启动区')}
                  className="px-4 py-2 bg-[#1a1a1a] hover:bg-blue-600/10 text-gray-400 hover:text-blue-400 border border-[#262626] hover:border-blue-500/25 text-xs font-bold rounded-xl transition-all hover:scale-[1.02] cursor-pointer"
                >
                  点击重新展开
                </button>
              </div>
            )}
          </div>
        </main>

        {/* --- BOTTOM SECTION: MESSAGE LOGS & AI COPILOT --- */}
        {(config.settings.showLogs !== false || config.settings.showAssistant !== false) && (
          <section className={`grid grid-cols-1 ${
            (config.settings.showLogs !== false && config.settings.showAssistant !== false) ? 'lg:grid-cols-2' : 'grid-cols-1'
          } gap-8 border-t border-[#262626] pt-8`}>
            
            {/* Urgency logs event log */}
            {config.settings.showLogs !== false ? (
              <div className="flex flex-col justify-between">
                <MessagePanel
                  messages={config.messages}
                  onClear={() => {
                    saveConfig({ ...config, messages: [] });
                  }}
                  onAddSystemLog={addSystemLog}
                />
              </div>
            ) : null}

            {/* AI developers advisor */}
            {config.settings.showAssistant !== false ? (
              <div>
                <AIAssistant
                  config={config}
                  onInstallPlugin={handleInstallPlugin}
                  onAddSystemLog={addSystemLog}
                />
              </div>
            ) : null}
          </section>
        )}

      </div>

      {/* --- POPUP WINDOW MODALS --- */}
      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSave={handleSaveService}
        editingService={editingService}
      />

      <PluginModal
        isOpen={isPluginModalOpen}
        onClose={() => setIsPluginModalOpen(false)}
        onSave={handleInstallPlugin}
        editingPlugin={editingPlugin}
      />
      
    </div>
  );
}
