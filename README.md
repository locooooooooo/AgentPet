# 多 Agent 牛马核心部门

从 `E:\个人服务导航面板` 的多 agent 控制舱拆出的独立桌面版 P0。

## 当前范围

- Electron 桌面壳：窗口、托盘、隐藏到托盘、退出菜单。
- React 控制舱：8 个 agent 工位、牛马状态、交互按钮、任务队列和日志终端。
- 本地持久化：数据写入 Electron `userData/agent-data/agents.json`。
- 模拟 runner：任务会自动推进进度并写入日志，不启动真实外部 agent 进程。

## 命令

```bash
npm install
npm run dev
npm run build
npm start
```

`npm run dev` 会启动 Vite renderer 和 Electron 窗口。`npm run build` 会生成 `dist/` 与 `dist-electron/`。

## 后续接真实 runner 的位置

- `src/lib/agentCore.ts`：现在的任务状态机和模拟推进逻辑。
- `electron/main.ts`：后续可在 IPC handler 里接 `child_process.spawn`、Codex CLI、Trae/Qoder HTTP bridge 等真实执行器。
- `electron/preload.ts`：保持前端只访问受控 API，不直接接触 Node 能力。
