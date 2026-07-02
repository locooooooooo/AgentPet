/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LocalService } from '../types.js';
import DynamicIcon from './DynamicIcon.js';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: LocalService) => void;
  editingService: LocalService | null;
}

const PRESETS = [
  { name: 'Nginx Gateway', category: 'Web Server', port: 80, url: 'http://localhost:80', icon: 'Globe', pingType: 'tcp', description: '本地 Nginx 反向代理网关及静态资源服务器', startupCommand: 'nginx -s reload' },
  { name: 'MySQL DB', category: 'Database', port: 3306, url: 'mysql://127.0.0.1:3306', icon: 'Database', pingType: 'tcp', description: '本地 MySQL 关系型数据库集群', startupCommand: 'docker start mysql' },
  { name: 'Redis Cache', category: 'Database', port: 6379, url: 'redis://127.0.0.1:6379', icon: 'Zap', pingType: 'tcp', description: '极速内存缓存与键值对存储数据库', startupCommand: 'redis-server' },
  { name: 'React Development', category: 'Dev Tool', port: 5173, url: 'http://localhost:5173', icon: 'Globe', pingType: 'http', description: 'Vite 驱动的 React 前端热加载本地服务器', startupCommand: 'npm run dev' },
  { name: 'Docker Agent', category: 'Dev Tool', port: 2375, url: 'http://127.0.0.1:2375', icon: 'Cpu', pingType: 'tcp', description: 'Docker Engine TCP 监控监听端口', startupCommand: 'systemctl start docker' },
  { name: 'Jenkins Build', category: 'Dev Tool', port: 8080, url: 'http://localhost:8080', icon: 'Cpu', pingType: 'http', description: '自动化打包部署发布流水线系统', startupCommand: 'docker start jenkins' }
];

const AVAILABLE_ICONS = [
  'Globe', 'Database', 'Zap', 'Cpu', 'Server', 'Activity', 'FileText', 'Terminal', 
  'Settings', 'TrendingUp', 'Shield', 'HardDrive', 'Network', 'Boxes', 'Layers', 'Gauge'
];

export default function ServiceModal({
  isOpen,
  onClose,
  onSave,
  editingService
}: ServiceModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Web Server');
  const [port, setPort] = useState<number | ''>('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('Server');
  const [description, setDescription] = useState('');
  const [pingType, setPingType] = useState<'tcp' | 'http' | 'none'>('tcp');
  const [startupCommand, setStartupCommand] = useState('');
  const [autoRecover, setAutoRecover] = useState(false);

  // Sync editing service fields when opening
  useEffect(() => {
    if (editingService) {
      setName(editingService.name);
      setCategory(editingService.category);
      setPort(editingService.port || '');
      setUrl(editingService.url);
      setIcon(editingService.icon);
      setDescription(editingService.description || '');
      setPingType(editingService.pingType);
      setStartupCommand(editingService.startupCommand || '');
      setAutoRecover(editingService.autoRecover || false);
    } else {
      // Clear fields
      setName('');
      setCategory('Web Server');
      setPort('');
      setUrl('http://localhost:');
      setIcon('Server');
      setDescription('');
      setPingType('tcp');
      setStartupCommand('');
      setAutoRecover(false);
    }
  }, [editingService, isOpen]);

  // Adjust default URL based on port changes
  const handlePortChange = (val: string) => {
    if (val === '') {
      setPort('');
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setPort(num);
      // If URL is just standard localhost, append the port automatically for user convenience
      if (url === 'http://localhost:' || url.match(/^http:\/\/localhost:\d*$/)) {
        setUrl(`http://localhost:${num}`);
      }
    }
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setPort(preset.port);
    setUrl(preset.url);
    setIcon(preset.icon);
    setPingType(preset.pingType as 'tcp' | 'http');
    setDescription(preset.description);
    setStartupCommand(preset.startupCommand);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedService: LocalService = {
      id: editingService?.id || `srv-${Date.now()}`,
      name: name.trim(),
      category: category.trim() || 'Other',
      port: port === '' ? undefined : port,
      url: url.trim() || 'http://localhost',
      icon,
      status: editingService?.status || 'offline',
      description: description.trim(),
      pingType,
      startupCommand: startupCommand.trim() || undefined,
      isStarted: editingService?.isStarted || false,
      autoRecover
    };

    onSave(savedService);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        id="service-modal-container"
        className="bg-[#111111] border border-[#262626] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#262626] px-6 py-4 sticky top-0 bg-[#111111] z-10">
          <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
            <DynamicIcon name={editingService ? 'Edit' : 'Plus'} size={18} className="text-blue-400" />
            <span>{editingService ? '编辑服务配置' : '添加本地服务监视'}</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 cursor-pointer p-1 rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <DynamicIcon name="X" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Presets Header (Only when adding) */}
          {!editingService && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">一键加载系统模板</span>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="flex items-center gap-2 p-2 rounded-lg border border-[#262626] bg-[#1a1a1a]/30 hover:bg-[#1a1a1a]/80 hover:border-blue-500/30 text-left text-xs text-gray-300 transition-all cursor-pointer"
                  >
                    <DynamicIcon name={preset.icon} size={14} className="text-blue-400 shrink-0" />
                    <span className="truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="h-[1px] bg-[#262626] my-4" />

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">服务名称 <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：Nginx Proxy"
                className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">服务分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="Web Server">Web Server (Web服务器)</option>
                <option value="Database">Database (数据库)</option>
                <option value="Dev Tool">Dev Tool (开发辅助)</option>
                <option value="NAS & Monitor">NAS & Monitor (监控存储)</option>
                <option value="Network Core">Network Core (网络核心)</option>
                <option value="Other">Other (其他服务)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">网络端口 (Port)</label>
              <input
                type="number"
                value={port}
                onChange={(e) => handlePortChange(e.target.value)}
                placeholder="例如：80"
                min="1"
                max="65535"
                className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-gray-300">探针类型 (Ping Strategy)</label>
              <div className="grid grid-cols-3 gap-2 h-[38px]">
                {(['tcp', 'http', 'none'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPingType(type)}
                    className={`flex items-center justify-center rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      pingType === type
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                        : 'bg-[#1a1a1a]/30 border border-[#262626] hover:bg-[#1a1a1a] text-gray-400'
                    }`}
                  >
                    {type} {type === 'tcp' ? '监听' : type === 'http' ? '网页' : '无'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">目标测试/运行 URL</label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g., http://localhost:8080 或 redis://localhost:6379"
              className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
            />
            <span className="text-[10px] text-gray-500 block">HTTP 探针将发出 GET 请求并核对响应，TCP 探针测试端口的连通性</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">本地快速启动命令 (Startup Template)</label>
            <input
              type="text"
              value={startupCommand}
              onChange={(e) => setStartupCommand(e.target.value)}
              placeholder="如：docker start redis 或 systemctl start nginx (可选)"
              className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
            />
            <span className="text-[10px] text-gray-500 block">如果配置了此项，控制面板上会出现 “启动” 按钮以快速触发 and mock init</span>
          </div>

          {startupCommand && (
            <div className="flex items-center gap-2 bg-[#1a1a1a]/40 border border-[#262626] p-3 rounded-lg">
              <input
                type="checkbox"
                id="auto-recover-checkbox"
                checked={autoRecover}
                onChange={(e) => setAutoRecover(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="auto-recover-checkbox" className="text-xs font-semibold text-gray-300 cursor-pointer select-none">
                启用「一键自愈 & 自动拉起」机制 (Auto-Recovery)
              </label>
              <span className="text-[10px] text-zinc-500 font-mono ml-auto">后台定时探针离线时，将自动调度拉起</span>
            </div>
          )}

          {/* Icon Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300 block">选择图标</label>
            <div className="grid grid-cols-8 gap-2">
              {AVAILABLE_ICONS.map((ico) => (
                <button
                  key={ico}
                  type="button"
                  onClick={() => setIcon(ico)}
                  className={`p-2.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    icon === ico
                      ? 'bg-blue-600/15 border-blue-500 text-blue-400 scale-105'
                      : 'bg-[#1a1a1a]/30 border border-[#262626] text-gray-400 hover:text-gray-200'
                  }`}
                  title={ico}
                >
                  <DynamicIcon name={ico} size={16} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">备注说明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简短记录此服务的用途、默认用户名/密码或配置要点"
              rows={2}
              className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg p-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262626]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1a1a1a] hover:bg-[#262626] text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              {editingService ? '保存修改' : '确认添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
