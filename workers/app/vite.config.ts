// The UI lives in ui/. `vite build` writes ui/dist, which the Worker serves as static assets.
// `vite` (dev, hot reload) sends API calls to the Worker at WORKER_URL (set in mise.toml).
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const worker = process.env.WORKER_URL || 'http://localhost:8787'

export default defineConfig({
  root: 'ui',
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173, proxy: { '/cubejs-api': worker, '/mcp': worker } },
})
