const { test, expect } = require('@playwright/test');
const { blockExternalNoise, stabilizePage } = require('../helpers/site');

test('homepage shell stays within the repo performance budget', async ({ page }) => {
  await blockExternalNoise(page);

  await page.addInitScript(() => {
    window.__validationPerf = { lcp: 0 };
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        window.__validationPerf.lcp = lastEntry.startTime;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });

  await page.goto('/', { waitUntil: 'load' });
  await page.waitForLoadState('networkidle');
  await stabilizePage(page);

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const firstContentfulPaint = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0;
    const resources = performance.getEntriesByType('resource');

    return {
      domContentLoaded: navigation?.domContentLoadedEventEnd ?? 0,
      loadEventEnd: navigation?.loadEventEnd ?? 0,
      firstContentfulPaint,
      largestContentfulPaint: window.__validationPerf?.lcp ?? 0,
      resourceCount: resources.length,
      transferSizeKb: Math.round(resources.reduce((sum, entry) => sum + (entry.transferSize || 0), navigation?.transferSize || 0) / 1024)
    };
  });

  expect(metrics.domContentLoaded).toBeLessThan(1800);
  expect(metrics.loadEventEnd).toBeLessThan(2800);
  expect(metrics.firstContentfulPaint).toBeLessThan(1200);
  expect(metrics.largestContentfulPaint).toBeLessThan(2600);
  expect(metrics.resourceCount).toBeLessThan(45);
  // This homepage intentionally carries large devotional imagery, so the budget
  // guards against further growth instead of forcing an unrealistically tiny payload.
  expect(metrics.transferSizeKb).toBeLessThan(3200);
});
