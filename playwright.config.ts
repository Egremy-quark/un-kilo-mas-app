import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'pruebas',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'off',
  },
  projects: [
    { name: 'panel', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'cliente', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
  ],
  outputDir: 'test-results',
});
