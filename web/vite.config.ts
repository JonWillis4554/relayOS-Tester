import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// API_TARGET is a Node.js env var (not VITE-prefixed) — consumed by the proxy,
// never sent to the browser. In docker compose it's set to http://test-target:3100.
const apiTarget = process.env['API_TARGET'] ?? 'http://localhost:3100';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      // All API calls are scoped under /api/ so they never collide with
      // React Router paths (/streetlights, /work-orders) on page refresh.
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
});
