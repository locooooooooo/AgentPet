/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SystemMessage } from '../types.js';
import DynamicIcon from './DynamicIcon.js';

interface MessagePanelProps {
  messages: SystemMessage[];
  onClear: () => void;
  onAddSystemLog: (title: string, content: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function MessagePanel({
  messages,
  onClear,
  onAddSystemLog
}: MessagePanelProps) {
  const [filter, setFilter] = useState<'all' | 'error' | 'success' | 'warning'>('all');
  const [isExpanded, setIsExpanded] = useState(true);

  const filteredMessages = messages
    .filter((msg) => filter === 'all' || msg.type === filter)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getLogColors = (type: SystemMessage['type']) => {
    switch (type) {
      case 'success':
        return { text: 'text-emerald-400', border: 'border-emerald-500/20 bg-emerald-500/5', icon: 'CheckCircle' };
      case 'error':
        return { text: 'text-red-400', border: 'border-red-500/20 bg-red-500/5', icon: 'AlertTriangle' };
      case 'warning':
        return { text: 'text-amber-400', border: 'border-amber-500/20 bg-amber-500/5', icon: 'AlertCircle' };
      default:
        return { text: 'text-gray-300', border: 'border-[#262626] bg-[#1a1a1a]/30', icon: 'Info' };
    }
  };

  const handleManualAlert = () => {
    onAddSystemLog(
      '手动网络诊断警报',
      '检测到 127.0.0.1 上多个待监控端口响应超过 1.5 秒延迟，请核查网卡负荷。',
      'warning'
    );
  };

  return (
    <div className="bg-[#111111] border border-[#262626] rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#262626] px-4 py-3 bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <DynamicIcon name="Bell" size={16} className="text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">系统事件监控与通知日志 ({messages.length})</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualAlert}
            className="text-[10px] bg-[#1a1a1a] border border-[#262626] text-gray-400 hover:text-gray-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
            title="生成诊断警报"
          >
            发起诊断
          </button>
          <button
            onClick={onClear}
            className="text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
          >
            清空日志
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-300 cursor-pointer p-0.5 rounded"
          >
            <DynamicIcon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={14} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col flex-1 h-[250px]">
          {/* Filters Bar */}
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#262626] bg-[#0a0a0a]">
            {(['all', 'success', 'warning', 'error'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize cursor-pointer transition-all ${
                  filter === t
                    ? 'bg-[#262626] text-gray-200 border border-[#333333]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t === 'all' ? '全部' : t}
              </button>
            ))}
          </div>

          {/* Logs List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono scrollbar-thin scrollbar-thumb-zinc-800">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-10 text-zinc-600 text-xs italic">
                无符合筛选条件的系统日志消息
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const colors = getLogColors(msg.type);
                return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 transition-all hover:border-zinc-800 ${colors.border}`}
                  >
                    <DynamicIcon name={colors.icon} size={14} className={`${colors.text} shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-semibold ${colors.text}`}>{msg.title}</span>
                        <span className="text-[10px] text-zinc-600 shrink-0">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[11px] mt-1 break-all select-all">{msg.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
