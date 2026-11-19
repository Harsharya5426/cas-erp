import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  webServer: [
    {
      command: 'node apps/api/dist/server.js',
      port: 4000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'development',
        PORT: '4000',
        MONGODB_URI: process.env.E2E_MONGODB_URI || 'mongodb://127.0.0.1:27017/cas_erp_e2e'
      }
    },
    {
      command: 'npx vite apps/web --host localhost --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI
    }
  ]
});
