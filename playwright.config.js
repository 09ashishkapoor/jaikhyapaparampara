const { defineConfig, devices } = require('@playwright/test');

const port = Number(process.env.PLAYWRIGHT_PORT || 41817);
const baseURL = `http://127.0.0.1:${port}`;
const desktopViewport = { width: 1440, height: 960 };

module.exports = defineConfig({
  testDir: './tests',
  testIgnore: ['**/helpers/**'],
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: desktopViewport
  },
  webServer: {
    command: `npm run build && node scripts/serve_test_site.js ${port} _site`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: desktopViewport
      }
    }
  ]
});
