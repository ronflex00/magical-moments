import { defineConfig, devices } from '@playwright/test';
import { appPath } from './tests/e2e/paths';
const target = new URL(process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:4323${appPath('/')}`);
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: { baseURL: target.origin, trace: 'retain-on-failure' },
  projects: [
    { name: 'ordinateur', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined } } },
    // Keep native focus deterministic for interruption tests on Windows.
    { name: 'webkit', workers: process.platform === 'win32' ? 1 : undefined, use: { ...devices['iPhone 13'], defaultBrowserType: 'webkit' } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: 'node node_modules/astro/bin/astro.mjs preview --host 127.0.0.1 --port 4323 --ignore-lock', url: target.href, reuseExistingServer: !process.env.CI },
});
