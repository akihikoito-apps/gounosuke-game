import { defineConfig, devices } from '@playwright/test';

// ビルド済みアプリ（vite preview, 127.0.0.1 のみ）に対して実行する。
// この環境には Chromium のみ導入済み。WebKit は未導入のため未実行（TEST_REPORT.md に記録）。
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e-results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173/',
    serviceWorkers: 'block',
    trace: 'off',
  },
  webServer: {
    command: 'npx vite build --mode e2e --outDir dist-e2e && npx vite preview --outDir dist-e2e --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: false,
    timeout: 90_000,
  },
  projects: [
    { name: 'phone-portrait', use: { ...devices['Pixel 7'], browserName: 'chromium', viewport: { width: 390, height: 844 } } },
  ],
});
