import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);
const useLocalServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== '1';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 7_500 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI
    ? [['line'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'en-US',
    timezoneId: 'America/New_York'
  },
  webServer: useLocalServer
    ? {
        command: 'python3 -m http.server 4173 --bind 127.0.0.1',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !isCI,
        timeout: 120_000
      }
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'tablet',
      use: { ...devices['iPad (gen 7)'] }
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] }
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 13'] }
    }
  ]
});
