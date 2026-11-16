const { defineConfig, devices } = require('@playwright/test');

const port = Number(process.env.PLAYWRIGHT_PORT || 41817);
const baseURL = `http://127.0.0.1:${port}`;
const desktopViewport = { width: 1440, height: 960 };

module.exports = defineConfig({
  testDir: './tests',
  testIgnore: ['**/helpers/**', '**/unit/**'],
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: process.env.PLAYWRIGHT_USE_SYSTEM_CHROME ? 'off' : 'retain-on-failure',
    viewport: desktopViewport
  },
  webServer: {
    command: `npm run build:test && node scripts/serve_test_site.js ${port} _site`,
    url: baseURL,
    reuseExistingServer: false,
    // A clean build runs ~100 s on CI but can take ~150 s on a busy Windows host
    // (Defender scanning ~3,500 fresh files). 180 s left no headroom and timed
    // out locally; a slow-but-progressing build is not a failure.
    timeout: 300_000
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.PLAYWRIGHT_USE_SYSTEM_CHROME ? { channel: 'chrome' } : {}),
        viewport: desktopViewport
      }
    }
  ]
});
