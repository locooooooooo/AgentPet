/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CustomPlugin } from '../types.js';
import DynamicIcon from './DynamicIcon.js';

interface PluginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plugin: CustomPlugin) => void;
  editingPlugin: CustomPlugin | null;
}

const TEMPLATE_SCRIPTS = [
  {
    name: '实时数字时钟小部件',
    desc: '在面板中呈现高精度的本地/北京时间与当日日期。',
    icon: 'Clock',
    code: `// 实时数字时钟部件
const clockDiv = document.createElement('div');
clockDiv.className = 'text-center py-4 bg-[#1a1a1a]/50 rounded-lg border border-[#262626]';

const timeEl = document.createElement('div');
timeEl.className = 'text-2xl font-bold font-mono text-blue-400 tracking-wider';

const dateEl = document.createElement('div');
dateEl.className = 'text-xs text-gray-500 mt-1 font-mono';

clockDiv.appendChild(timeEl);
clockDiv.appendChild(dateEl);
container.appendChild(clockDiv);

function updateTime() {
  const now = new Date();
  timeEl.textContent = now.toLocaleTimeString();
  dateEl.textContent = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

updateTime();
const timer = setInterval(updateTime, 1000);

// 返回清理回调，卸载或更新时释放定时器
return () => {
  clearInterval(timer);
};`
  },
  {
    name: '心跳随机名言推荐',
    desc: '每次刷新或间隔显示句极客及系统开发者的名言警句。',
    icon: 'Sparkles',
    code: `// 极客名言滚动插件
const quotes = [
  "Talk is cheap. Show me the code. — Linus Torvalds",
  "Simplicity is the soul of efficiency. — Austin Freeman",
  "Make it work, make it right, make it fast. — Kent Beck",
  "The only way to learn a new programming language is by writing programs in it. — Dennis Ritchie",
  "There are only two hard things in Computer Science: cache invalidation and naming things. — Phil Karlton"
];

const quoteDiv = document.createElement('div');
quoteDiv.className = 'p-3 bg-[#1a1a1a]/30 border border-[#262626] rounded-lg italic text-gray-300 leading-relaxed text-xs';
container.appendChild(quoteDiv);

function rotate() {
  const idx = Math.floor(Math.random() * quotes.length);
  quoteDiv.textContent = '“ ' + quotes[idx] + ' ”';
}

rotate();
quoteDiv.addEventListener('click', rotate);
quoteDiv.style.cursor = 'pointer';
quoteDiv.title = '点击更换下一句名言';`
  },
  {
    name: 'JSON API 接口监测',
    desc: '获取任意公共 HTTP JSON 接口并格式化展示关键属性。',
    icon: 'Network',
    code: `// 动态 API 聚合提取器
const apiDiv = document.createElement('div');
apiDiv.className = 'p-3 bg-[#1a1a1a]/40 border border-[#262626] rounded-lg font-mono space-y-2';
container.appendChild(apiDiv);

const header = document.createElement('div');
header.className = 'text-[10px] text-gray-500 uppercase flex items-center justify-between border-b border-[#262626] pb-1';
header.innerHTML = '<span>请求源: IPify API</span><span class="text-emerald-400">GET OK</span>';
apiDiv.appendChild(header);

const body = document.createElement('div');
body.className = 'text-xs text-gray-300';
body.textContent = '正在发起网络调用...';
apiDiv.appendChild(body);

async function fetchData() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    body.innerHTML = \`<div class="flex items-center justify-between">
      <span class="text-gray-500">公网 IP:</span>
      <span class="text-gray-100 font-bold">\${data.ip}</span>
    </div>\`;
  } catch (err) {
    body.textContent = '网络请求异常: ' + err.message;
  }
}

fetchData();`
  }
];

const AVAILABLE_ICONS = [
  'Clock', 'Sparkles', 'Network', 'Activity', 'FileText', 'Terminal', 'Sliders', 'Layers', 'Boxes', 'Cpu', 'Database'
];

export default function PluginModal({
  isOpen,
  onClose,
  onSave,
  editingPlugin
}: PluginModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('Admin');
  const [version, setVersion] = useState('1.0.0');
  const [icon, setIcon] = useState('Cpu');
  const [code, setCode] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [manifestInput, setManifestInput] = useState('');
  const [manifestError, setManifestError] = useState<string | null>(null);

  useEffect(() => {
    if (editingPlugin) {
      setName(editingPlugin.name);
      setDescription(editingPlugin.description);
      setAuthor(editingPlugin.author || 'Admin');
      setVersion(editingPlugin.version);
      setIcon(editingPlugin.icon);
      setCode(editingPlugin.code);
      setPermissions(editingPlugin.permissions || []);
    } else {
      setName('');
      setDescription('');
      setAuthor('Admin');
      setVersion('1.0.0');
      setIcon('Cpu');
      // Load first template code as default
      setCode(TEMPLATE_SCRIPTS[0].code);
      setPermissions(['allow-network', 'allow-storage']);
    }
    setManifestInput('');
    setManifestError(null);
  }, [editingPlugin, isOpen]);

  const handleImportManifest = (jsonStr: string) => {
    setManifestInput(jsonStr);
    if (!jsonStr.trim()) {
      setManifestError(null);
      return;
    }
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.name) {
        setManifestError('JSON 缺少必要的 "name" 属性');
        return;
      }
      setName(parsed.name || '');
      setDescription(parsed.description || '');
      setAuthor(parsed.author || 'Admin');
      setVersion(parsed.version || '1.0.0');
      setIcon(parsed.icon || 'Cpu');
      setCode(parsed.code || '');
      setPermissions(parsed.permissions || []);
      setManifestError(null);
    } catch (e: any) {
      setManifestError('JSON 语法错误: ' + e.message);
    }
  };

  const togglePermission = (perm: string) => {
    setPermissions(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const applyTemplate = (tpl: typeof TEMPLATE_SCRIPTS[0]) => {
    setName(tpl.name);
    setDescription(tpl.desc);
    setIcon(tpl.icon);
    setCode(tpl.code);
    if (tpl.name.includes('接口')) {
      setPermissions(['allow-network']);
    } else {
      setPermissions(['allow-storage']);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const savedPlugin: CustomPlugin = {
      id: editingPlugin?.id || `plg-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      author: author.trim() || 'Admin',
      version: version.trim() || '1.0.0',
      icon,
      code: code.trim(),
      enabled: editingPlugin?.enabled ?? true,
      permissions
    };

    onSave(savedPlugin);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        id="plugin-modal-container"
        className="bg-[#111111] border border-[#262626] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-[#262626] px-6 py-4 sticky top-0 bg-[#111111] z-10">
          <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
            <DynamicIcon name={editingPlugin ? 'Code' : 'Plus'} size={18} className="text-blue-400" />
            <span>{editingPlugin ? '开发/修改插件代码' : '创建自定义面板插件'}</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 cursor-pointer p-1 rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <DynamicIcon name="X" size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Templates & Import Selector */}
          {!editingPlugin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 border border-[#222222] bg-[#161616]/20 p-3.5 rounded-xl">
                <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider block">选择官方模板</span>
                <div className="grid grid-cols-1 gap-2">
                  {TEMPLATE_SCRIPTS.map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="flex flex-col gap-1 p-2 rounded-lg border border-[#262626] bg-[#1a1a1a]/30 hover:bg-[#1a1a1a]/80 hover:border-blue-500/30 text-left transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <DynamicIcon name={tpl.icon} size={13} className="text-blue-400 shrink-0" />
                        <span className="font-medium text-xs text-gray-200">{tpl.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 line-clamp-1">{tpl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Import Manifest JSON */}
              <div className="space-y-2 border border-[#222222] bg-[#161616]/20 p-3.5 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">导入 Plugin Manifest JSON</span>
                  <p className="text-[10px] text-zinc-500 leading-snug mb-2">可粘贴或上传第三方分发的插件描述 JSON 文件，快速还原完整属性与沙箱代码。</p>
                  <textarea
                    value={manifestInput}
                    onChange={(e) => handleImportManifest(e.target.value)}
                    placeholder='例如：{ "name": "新插件", "version": "1.0.0", "permissions": ["allow-network"], "code": "..." }'
                    rows={4}
                    className="w-full bg-[#0c0c0c] border border-[#262626] rounded-lg p-2.5 text-[10px] text-blue-400 placeholder-zinc-700 font-mono focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed"
                  />
                </div>
                {manifestError ? (
                  <span className="text-[10px] text-red-400 font-mono mt-1 block">❌ {manifestError}</span>
                ) : manifestInput ? (
                  <span className="text-[10px] text-emerald-400 font-mono mt-1 block">✓ Manifest 解析成功并已填充到下方</span>
                ) : null}
              </div>
            </div>
          )}

          <div className="h-[1px] bg-[#262626] my-4" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">插件名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：系统流量计"
                  className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">版本号</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g., 1.0.0"
                    className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">作者签名</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Admin"
                    className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">简要功能描述</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="在此说明该插件的作用与核心功能..."
                className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300 block">外观图标</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {AVAILABLE_ICONS.map((ico) => (
                    <button
                      key={ico}
                      type="button"
                      onClick={() => setIcon(ico)}
                      className={`p-2 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        icon === ico
                          ? 'bg-blue-600/15 border-blue-500 text-blue-400 scale-105'
                          : 'bg-[#1a1a1a]/30 border border-[#262626] text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <DynamicIcon name={ico} size={14} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions & Security Settings */}
              <div className="space-y-2 border border-[#232323] bg-[#161616]/10 p-3.5 rounded-xl">
                <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <span>🔒</span>
                  <span>安全沙箱权限声明 (Sandbox Security Claims)</span>
                </span>
                <p className="text-[10px] text-zinc-500 leading-snug">
                  沙箱强制拦截未授权的数据持久化与网络请求。请在此声明该插件运行所需的最小化权限：
                </p>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 select-none">
                    <input
                      type="checkbox"
                      checked={permissions.includes('allow-network')}
                      onChange={() => togglePermission('allow-network')}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500"
                    />
                    <span>允许发起网络请求 (<code className="text-blue-400 text-[10px]">allow-network</code>)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 select-none">
                    <input
                      type="checkbox"
                      checked={permissions.includes('allow-storage')}
                      onChange={() => togglePermission('allow-storage')}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500"
                    />
                    <span>分配独立沙箱存储空间 (<code className="text-blue-400 text-[10px]">allow-storage</code>)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* JavaScript editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-300">JavaScript 沙箱代码 <span className="text-red-500">*</span></label>
                <span className="text-[10px] font-mono text-blue-400 font-semibold">ES6 JavaScript</span>
              </div>
              <textarea
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// 编写你的 JS 逻辑..."
                rows={11}
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-xs text-emerald-400 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono resize-y leading-relaxed"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262626]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1a1a1a] hover:bg-[#262626] text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
              >
                关闭
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all cursor-pointer hover:scale-[1.02]"
              >
                {editingPlugin ? '应用并测试' : '完成安装'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
