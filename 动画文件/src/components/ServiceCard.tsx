/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LocalService } from '../types.js';
import DynamicIcon from './DynamicIcon.js';
import { motion } from 'motion/react';

interface ServiceCardProps {
  service: LocalService;
  onPing: (serviceId: string) => void;
  onLaunch: (service: LocalService) => void;
  onEdit: (service: LocalService) => void;
  onDelete: (serviceId: string) => void;
  onOpenUrl: (url: string) => void;
}

export default function ServiceCard({
  service,
  onPing,
  onLaunch,
  onEdit,
  onDelete,
  onOpenUrl
}: ServiceCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusColor = {
    online: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    offline: 'bg-zinc-600',
    checking: 'bg-amber-500 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.5)]'
  }[service.status];

  const statusBg = {
    online: 'border-emerald-500/20 bg-emerald-500/5',
    offline: 'border-[#262626] bg-[#111111]',
    checking: 'border-amber-500/20 bg-amber-500/5'
  }[service.status];

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (service.port) {
      navigator.clipboard.writeText(service.port.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      id={`srv-card-${service.id}`}
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative group rounded-xl border p-5 transition-all duration-300 ${statusBg}`}
    >
      {/* Background Glow */}
      <div className={`absolute -inset-px rounded-xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 -z-10 bg-radial from-neutral-800/50 to-transparent`} />

      {/* Header Info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg border ${
            service.status === 'online' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-zinc-800 border-zinc-700 text-zinc-400'
          }`}>
            <DynamicIcon name={service.icon || 'Server'} size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-zinc-100 text-sm tracking-tight leading-none">
                {service.name}
              </h3>
              <span className="px-2 py-0.5 text-[10px] rounded bg-zinc-800 border border-zinc-700 text-zinc-400">
                {service.category}
              </span>
              {service.autoRecover && service.startupCommand && (
                <span className="px-1.5 py-0.5 text-[9px] rounded bg-blue-950/40 border border-blue-900/30 text-blue-400 font-bold font-mono" title="故障自愈机制已激活：检测到离线时将自动拉起">
                  ⚡ 自愈启用
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 leading-snug line-clamp-1">
              {service.description || '暂无详细描述'}
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
          <span className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
            {service.status === 'online' ? 'Online' : service.status === 'checking' ? 'Testing' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Metric Detail Line */}
      <div className="mt-4 flex items-center justify-between border-t border-zinc-800/60 pt-3 text-xs text-zinc-400">
        <div className="flex items-center gap-4">
          {service.port && (
            <div 
              className="flex items-center gap-1.5 font-mono bg-zinc-950 px-2 py-1 rounded cursor-pointer border border-zinc-800/80 hover:border-blue-500/50 transition-colors"
              onClick={handleCopy}
              title="点击复制端口号"
            >
              <span className="text-[10px] text-zinc-500 uppercase font-sans">Port:</span>
              <span className="text-zinc-300 font-bold">{service.port}</span>
              <span className="text-[10px] text-zinc-500">
                {copied ? '已复制' : '📋'}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">协议:</span>
            <span className="font-mono text-zinc-300 uppercase bg-zinc-800/50 px-1.5 py-0.5 rounded text-[10px]">
              {service.pingType === 'none' ? '免监控' : service.pingType}
            </span>
          </div>
        </div>
        
        {/* URL Target */}
        <div className="flex items-center gap-1 max-w-[150px] overflow-hidden truncate">
          <span className="text-zinc-500">地址:</span>
          <span 
            onClick={() => onOpenUrl(service.url)}
            className="text-blue-400 hover:text-blue-300 cursor-pointer underline truncate font-mono text-[11px]"
            title={service.url}
          >
            {service.url.replace(/^https?:\/\//, '')}
          </span>
        </div>
      </div>

      {/* Startup Command */}
      {service.startupCommand && (
        <div className="mt-3 bg-zinc-950/80 rounded p-2 border border-zinc-900 font-mono text-[11px] text-zinc-400 flex items-center justify-between group-hover:border-zinc-800 transition-colors">
          <span className="truncate text-zinc-400 select-all" title={service.startupCommand}>
            🚀 {service.startupCommand}
          </span>
        </div>
      )}

      {/* Action Controls Overlay */}
      <div className="mt-4 flex items-center justify-end gap-2 border-t border-zinc-800/40 pt-3">
        <button
          onClick={() => onPing(service.id)}
          disabled={service.status === 'checking'}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
          title="重新检查此端口状态"
        >
          <DynamicIcon name="RefreshCw" size={12} className={service.status === 'checking' ? 'animate-spin' : ''} />
          <span>测试</span>
        </button>

        {service.startupCommand && (
          <button
            onClick={() => onLaunch(service)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer font-semibold ${
              service.status === 'offline'
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/10'
                : 'bg-emerald-950 border border-emerald-800/40 hover:bg-emerald-900 text-emerald-300'
            }`}
            title={service.status === 'offline' ? '监测到服务处于离线状态，点击立即触发一键故障自愈重启' : '一键启动服务'}
          >
            <DynamicIcon name={service.status === 'offline' ? 'Zap' : 'Play'} size={11} className={service.status === 'offline' ? 'animate-bounce' : ''} />
            <span>{service.status === 'offline' ? '一键自愈 (重启)' : '启动'}</span>
          </button>
        )}

        <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

        <button
          onClick={() => onEdit(service)}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          title="修改配置"
        >
          <DynamicIcon name="Edit" size={13} />
        </button>

        <button
          onClick={() => onDelete(service.id)}
          className="p-1 rounded hover:bg-red-950/40 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
          title="删除此服务"
        >
          <DynamicIcon name="Trash" size={13} />
        </button>
      </div>
    </motion.div>
  );
}
