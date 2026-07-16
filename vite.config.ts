import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { CodexHostMonitor } from './electron/codexHostMonitor';

const projectRoot = dirname(fileURLToPath(import.meta.url));

function codexHostStatusPlugin(): Plugin {
  const monitor = new CodexHostMonitor();
  return {
    name: 'codex-host-status',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__niuma/codex-host', (request, response, next) => {
        if (request.method !== 'GET') {
          next();
          return;
        }
        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        response.end(JSON.stringify(monitor.getSnapshot()));
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), codexHostStatusPlugin()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: resolve(projectRoot, 'index.html'),
        ranch: resolve(projectRoot, 'ranch.html')
      }
    }
  }
});
