/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ServiceStatus = 'online' | 'offline' | 'checking';

export interface LocalService {
  id: string;
  name: string;
  category: string; // e.g., "Database", "Web Server", "Dev Tool", "NAS"
  port?: number;
  url: string; // URL to open on click (e.g., http://localhost:8080)
  icon: string; // Lucide icon name or emoji
  status: ServiceStatus;
  description?: string;
  lastChecked?: string;
  pingType: 'tcp' | 'http' | 'none';
  customHeaders?: string; // JSON string of custom headers for http checks
  startupCommand?: string; // Local command template for starting up
  isStarted: boolean;
  autoRecover?: boolean;
}

export interface WebLink {
  id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
  icon?: string;
}

export interface SystemMessage {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  content: string;
  serviceId?: string;
}

export interface CustomPlugin {
  id: string;
  name: string;
  description: string;
  icon: string;
  code: string; // JavaScript/React-like evaluation script or simple HTML/CSS sandbox
  enabled: boolean;
  version: string;
  author?: string;
  settings?: Record<string, any>;
  permissions?: string[];
}

export interface AgentTask {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  progress: number;
  startTime: string;
  endTime?: string;
  command?: string;
  logs: string[];
  artifact?: string;
}

export interface AIAgent {
  id: string;
  name: string;
  avatar: string;
  description: string;
  status: 'idle' | 'active';
  tasks: AgentTask[];
  modelName: string;
  endpoint: string;
}

export interface DashboardConfig {
  services: LocalService[];
  links: WebLink[];
  plugins: CustomPlugin[];
  messages: SystemMessage[];
  agents?: AIAgent[];
  settings: {
    darkMode: boolean;
    refreshInterval: number; // in seconds, e.g., 10, 30, 60
    autoRefresh: boolean;
    layoutMode: 'grid' | 'list' | 'bento';
    systemName: string;
    showServices?: boolean;
    showAgents?: boolean;
    showPlugins?: boolean;
    showBookmarks?: boolean;
    showCommands?: boolean;
    showLogs?: boolean;
    showAssistant?: boolean;
    showWinDevSuite?: boolean;
  };
}
