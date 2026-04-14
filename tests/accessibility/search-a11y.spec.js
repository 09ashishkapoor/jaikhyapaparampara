const AxeBuilder = require('@axe-core/playwright').default;
const { test, expect } = require('@playwright/test');
const { gotoAndStabilize } = require('../helpers/site');

test('search results experience has no scoped axe violations', async ({ page }) => {
  await gotoAndStabilize(page, '/search/?q=bhairava');

  await expect(page.locator('.result-link').first()).toBeVisible();

  const accessibilityScanResults = await new AxeBuilder({ page })
    .include('main')
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
