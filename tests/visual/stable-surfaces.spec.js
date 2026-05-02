const { test, expect } = require("@playwright/test");
const { gotoAndStabilize } = require("../helpers/site");

test.describe("stable visual surfaces", () => {
	test("homepage hero remains stable", async ({ page }) => {
		await gotoAndStabilize(page, "/");

		await expect(page.locator(".hero-content")).toHaveScreenshot(
			"home-hero.png",
			{
				animations: "disabled",
				caret: "hide",
				scale: "css",
				maxDiffPixelRatio: 0.01,
			},
		);
	});

	test("search landing panel remains stable", async ({ page }) => {
		await gotoAndStabilize(page, "/search/");

		await expect(page.locator(".search-header")).toHaveScreenshot(
			"search-panel.png",
			{
				animations: "disabled",
				caret: "hide",
				scale: "css",
				maxDiffPixelRatio: 0.01,
			},
		);
	});

	test("gallery featured row remains stable", async ({ page }) => {
		await gotoAndStabilize(page, "/gallery/");

		await expect(page.locator(".gallery-featured")).toHaveScreenshot(
			"gallery-featured.png",
			{
				animations: "disabled",
				caret: "hide",
				scale: "css",
				maxDiffPixelRatio: 0.01,
			},
		);
	});
});
