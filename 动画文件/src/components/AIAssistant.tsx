/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { DashboardConfig, CustomPlugin } from '../types.js';
import DynamicIcon from './DynamicIcon.js';
import Markdown from 'react-markdown';

interface AIAssistantProps {
  config: DashboardConfig;
  onInstallPlugin: (plugin: CustomPlugin) => void;
  onAddSystemLog: (title: string, content: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_SUGGESTIONS = [
  '生成一个实时网络网速插件',
  '怎么配置 Nginx 反向代理？',
  '解决 Address already in use 端口冲突',
  '生成一个天气时钟一体插件'
];

export default function AIAssistant({
  config,
  onInstallPlugin,
  onAddSystemLog
}: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '👋 你好！我是您的 **DevOps 智能助手**。你可以问我关于端口冲突检测、服务排障、Nginx 代理路由等运维问题。\n\n**✨ 核心能力：**\n- 帮您排查和解决端口占用。\n- **一键生成仪表盘插件代码**。生成后我会自动提取并提供 **【立即安装此插件】** 按钮。'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract custom javascript plugin code block if generated
  const extractPluginCode = (text: string): { code: string; name: string } | null => {
    // Look for ```javascript ... ``` or ```js ... ``` block
    const jsBlockMatch = text.match(/```(?:javascript|js)\n([\s\S]*?)```/);
    if (jsBlockMatch && jsBlockMatch[1]) {
      const code = jsBlockMatch[1].trim();
      // Try to guess or extract a name, e.g., name: '...' or class/variable names
      let name = 'AI 自动生成插件';
      const nameMatch = text.match(/名称[：:]\s*\*?([^\n*]+)\*?/i) || code.match(/name\s*:\s*['"]([^'"]+)['"]/);
      if (nameMatch && nameMatch[1]) {
        name = nameMatch[1].trim();
      }
      return { code, name };
    }
    return null;
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg,
          context: {
            services: config.services.map(s => ({ name: s.name, port: s.port, status: s.status, pingType: s.pingType })),
            installedPlugins: config.plugins.map(p => ({ name: p.name, enabled: p.enabled })),
            settings: config.settings
          }
        })
      });

      const data = await res.json();
      if (data.error) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `❌ **调用失败:** ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || '助手未返回有效回应' }]);
      }
    } catch (error: any) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `❌ **网络异常:** ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallExtracted = (pluginInfo: { code: string; name: string }) => {
    const newPlugin: CustomPlugin = {
      id: `plg-ai-${Date.now()}`,
      name: pluginInfo.name,
      description: '由 AI 研发助理自动编写和配置的个性化功能插件。',
      icon: 'Sparkles',
      version: '1.0.0',
      author: 'AI Copilot',
      enabled: true,
      code: pluginInfo.code
    };

    onInstallPlugin(newPlugin);
    onAddSystemLog(
      `插件加载成功`,
      `已自动编译并注册由 AI 生成的 【${pluginInfo.name}】 插件，现在可以立即在控制板上开启使用！`,
      'success'
    );
  };

  return (
    <div className="bg-[#111111] border border-[#262626] rounded-xl overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#262626] px-4 py-3 bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <div className="relative">
            <DynamicIcon name="Sparkles" size={16} className="text-blue-400" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">AI 智能辅助与插件编译器</h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 bg-[#1a1a1a] px-1.5 py-0.5 rounded">
          Gemini Pro Live
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.map((msg, index) => {
          const isAI = msg.role === 'assistant';
          const extractedPlugin = isAI ? extractPluginCode(msg.content) : null;

          return (
            <div key={index} className={`flex gap-2.5 ${isAI ? 'justify-start' : 'justify-end'}`}>
              {isAI && (
                <div className="h-7 w-7 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <DynamicIcon name="Sparkles" size={14} />
                </div>
              )}

              <div className="flex flex-col gap-1.5 max-w-[85%]">
                <div className={`p-3 rounded-xl border ${
                  isAI 
                    ? 'bg-[#1a1a1a]/30 border-[#262626] text-gray-200' 
                    : 'bg-blue-600/10 border-blue-500/20 text-blue-300'
                }`}>
                  <div className="markdown-body text-[11px] leading-relaxed space-y-2 prose prose-invert max-w-full">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>

                {/* Direct Action for Code Block */}
                {extractedPlugin && (
                  <button
                    onClick={() => handleInstallExtracted(extractedPlugin)}
                    className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-[10px] transition-all cursor-pointer shadow-sm self-start hover:scale-[1.02]"
                  >
                    <DynamicIcon name="Plus" size={12} />
                    <span>安装并启用「{extractedPlugin.name}」到面板</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="h-7 w-7 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <DynamicIcon name="Sparkles" size={14} className="animate-spin" />
            </div>
            <div className="p-3 rounded-xl border bg-[#1a1a1a]/30 border-[#262626] text-gray-400 italic">
              AI 专家正在分析您的系统架构与组件逻辑...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion tags */}
      {messages.length === 1 && (
        <div className="px-4 py-2 border-t border-[#262626] bg-[#0a0a0a]/20">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => handleSend(tag)}
                className="text-[10px] bg-[#1a1a1a] border border-[#262626] text-gray-400 hover:text-gray-200 px-2 py-1 rounded-md transition-all cursor-pointer hover:border-blue-500/30"
              >
                💡 {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="border-t border-[#262626] p-3 bg-[#0a0a0a] flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="问问 AI 运维助手（例如：'如何排查 3000 端口占用'）..."
          className="flex-1 bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DynamicIcon name="Terminal" size={14} />
        </button>
      </form>
    </div>
  );
}
