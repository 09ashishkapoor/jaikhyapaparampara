const { test, expect } = require("@playwright/test");
const { gotoAndStabilize } = require("../helpers/site");

test.describe("repo smoke flows", () => {
	test("homepage exposes the main spiritual archive entry points", async ({
		page,
	}) => {
		await gotoAndStabilize(page, "/");

		const articlesNavLink = page
			.locator("header")
			.getByRole("link", { name: /^Articles$/ });

		await expect(
			page.getByRole("heading", { name: /a flower at the guru's feet/i }),
		).toBeVisible();
		await expect(page.locator("section#sacred-texts")).toBeVisible();
		await expect(page.locator("section#faq")).toBeVisible();
		await expect(articlesNavLink).toBeVisible();
		await expect(
			page.locator('form[action="/search/"] input[name="q"]'),
		).toBeVisible();
	});

	test("search flow leads from the homepage into a matching article", async ({
		page,
	}) => {
		await gotoAndStabilize(page, "/");

		const homepageSearch = page.locator(
			'form[action="/search/"] input[name="q"]',
		);
		await homepageSearch.fill("bhairava");
		await homepageSearch.press("Enter");

		await expect(page).toHaveURL(/\/search\/\?q=bhairava/i);
		await expect(
			page.getByRole("heading", { name: /search all articles/i }),
		).toBeVisible();

		const firstResult = page.locator(".result-link").first();
		await expect(firstResult).toBeVisible();
		await expect(firstResult).toContainText(/bhairava/i);

		await firstResult.click();

		await expect(page.locator("h1.article-title")).toBeVisible();
		await expect(page.locator(".article-content")).toBeVisible();
		await expect(page.locator(".breadcrumbs")).toContainText(/articles/i);
	});

	test("gallery lightbox opens, advances, and closes for sacred art", async ({
		page,
	}) => {
		await gotoAndStabilize(page, "/gallery/");

		await expect(
			page.getByRole("heading", { name: /sacred art gallery/i }),
		).toBeVisible();

		const featuredItem = page.locator(".gallery-item-featured").first();
		await featuredItem.click();

		const lightbox = page.locator("#lightbox.active");
		await expect(lightbox).toBeVisible();
		await expect(page.locator("#lightbox-caption")).not.toHaveText(/^\s*$/);

		await page.getByRole("button", { name: /next/i }).click();
		await expect(page.locator("#lightbox-caption")).toContainText(
			/Jai Ma|Shmashana|Bhairava|Kali|Kalika/i,
		);

		await page.getByRole("button", { name: /close/i }).click();
		await expect(page.locator("#lightbox")).not.toHaveClass(/active/);
	});
});
