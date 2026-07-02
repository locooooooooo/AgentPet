/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { CustomPlugin } from '../types.js';
import DynamicIcon from './DynamicIcon.js';

interface PluginContainerProps {
  plugin: CustomPlugin;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (plugin: CustomPlugin) => void;
}

export default function PluginContainer({
  plugin,
  onToggle,
  onDelete,
  onEdit
}: PluginContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!plugin.enabled || !containerRef.current) return;

    // Clear previous contents
    containerRef.current.innerHTML = '';

    // Create sandbox container
    const sandboxDiv = document.createElement('div');
    sandboxDiv.className = 'w-full text-xs text-zinc-300 space-y-2';
    containerRef.current.appendChild(sandboxDiv);

    // Create sandbox overrides based on declared permissions
    const permissions = plugin.permissions || [];
    const hasNetwork = permissions.includes('allow-network');
    const hasStorage = permissions.includes('allow-storage');

    const sandboxFetch = hasNetwork ? window.fetch.bind(window) : () => {
      throw new Error("⚠️ [权限拒绝] 该插件未声明 'allow-network' (允许网络) 权限。请在插件代码中勾选声明所需权限。");
    };

    const sandboxLocalStorage = hasStorage ? {
      getItem: (key: string) => localStorage.getItem(`plg_store_${plugin.id}_${key}`),
      setItem: (key: string, val: string) => localStorage.setItem(`plg_store_${plugin.id}_${key}`, val),
      removeItem: (key: string) => localStorage.removeItem(`plg_store_${plugin.id}_${key}`),
      clear: () => {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith(`plg_store_${plugin.id}_`)) localStorage.removeItem(k);
        });
      }
    } : {
      getItem: () => { throw new Error("⚠️ [权限拒绝] 该插件未声明 'allow-storage' (允许本地存储) 权限。"); },
      setItem: () => { throw new Error("⚠️ [权限拒绝] 该插件未声明 'allow-storage' (允许本地存储) 权限。"); },
      removeItem: () => { throw new Error("⚠️ [权限拒绝] 该插件未声明 'allow-storage' (允许本地存储) 权限。"); },
      clear: () => { throw new Error("⚠️ [权限拒绝] 该插件未声明 'allow-storage' (允许本地存储) 权限。"); }
    };

    let cleanupFn: (() => void) | undefined;

    try {
      // Evaluate plugin code with strict sandbox parameters and wrappers
      const executePlugin = new Function('container', 'fetch', 'localStorage', plugin.code);
      const result = executePlugin(sandboxDiv, sandboxFetch, sandboxLocalStorage);
      
      if (typeof result === 'function') {
        cleanupFn = result;
      }
    } catch (err: any) {
      console.error(`Plugin "${plugin.name}" load error:`, err);
      sandboxDiv.innerHTML = `
        <div class="p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-red-400 font-mono text-[11px] space-y-1">
          <p class="font-semibold flex items-center gap-1">
            <span>⚠️ 运行报错:</span>
          </p>
          <p class="text-[10px] break-all leading-relaxed">${err.message || err}</p>
          <p class="text-[9px] text-red-500/80 pt-1 border-t border-red-900/20">请点击右侧编辑图标修改 JS 运行代码</p>
        </div>
      `;
    }

    return () => {
      if (cleanupFn) {
        try {
          cleanupFn();
        } catch (e) {
          console.error(`Plugin "${plugin.name}" cleanup error:`, e);
        }
      }
    };
  }, [plugin.code, plugin.enabled]);

  return (
    <div 
      id={`plg-card-${plugin.id}`}
      className="bg-[#111111] border border-[#262626] rounded-xl p-5 hover:border-[#333333] transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* Header control */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${
              plugin.enabled 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50'
            }`}>
              <DynamicIcon name={plugin.icon || 'Cpu'} size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-zinc-100 text-sm tracking-tight">{plugin.name}</h4>
                <span className="text-[10px] font-mono text-zinc-500">v{plugin.version}</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{plugin.description}</p>
              {/* Permission claim badges */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {plugin.permissions && plugin.permissions.length > 0 ? (
                  plugin.permissions.map(perm => (
                    <span 
                      key={perm}
                      className="px-1.5 py-0.5 text-[8.5px] font-bold font-mono rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 flex items-center gap-0.5"
                    >
                      <span>🔒</span>
                      <span>{perm === 'allow-network' ? '网络连接' : perm === 'allow-storage' ? '本地存储' : perm}</span>
                    </span>
                  ))
                ) : (
                  <span className="px-1.5 py-0.5 text-[8.5px] font-mono rounded bg-zinc-900 text-zinc-600">
                    🔒 无特殊权限
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggle(plugin.id)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                plugin.enabled ? 'bg-blue-600' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  plugin.enabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="h-[1px] bg-zinc-900/60 my-4" />

        {/* Custom sandbox render container */}
        <div className="min-h-[60px] flex flex-col justify-center">
          {plugin.enabled ? (
            <div ref={containerRef} className="w-full" />
          ) : (
            <div className="text-center py-4 text-zinc-500 text-xs italic flex flex-col items-center gap-1">
              <DynamicIcon name="Power" size={16} className="text-zinc-600" />
              <span>此插件已处于禁用状态。启用后可加载小组件</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer operations */}
      <div className="mt-4 pt-3 border-t border-zinc-900/60 flex items-center justify-between text-[11px] text-zinc-500">
        <span>作者: {plugin.author || '未知'}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(plugin)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="编写插件代码"
          >
            <DynamicIcon name="Code" size={11} />
            <span>代码</span>
          </button>
          <button
            onClick={() => onDelete(plugin.id)}
            className="p-1 rounded hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
            title="卸载插件"
          >
            <DynamicIcon name="Trash" size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
