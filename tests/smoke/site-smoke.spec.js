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

	test("clearing search before its index loads keeps results cleared", async ({ page }) => {
		let releaseIndex;
		let markRequested;
		const requested = new Promise((resolve) => { markRequested = resolve; });
		await page.route("**/search-index.json", async (route) => {
			markRequested();
			await new Promise((resolve) => { releaseIndex = resolve; });
			await route.fulfill({ json: [{ title: "Bhairava", url: "/articles/", content: "Bhairava" }] });
		});
		await page.goto("/search/?q=bhairava", { waitUntil: "domcontentloaded" });
		await expect(page.locator("#searchStatus")).toHaveText("Searching…");
		await requested;
		await page.getByRole("button", { name: "Clear search" }).click();
		const response = page.waitForResponse("**/search-index.json");
		releaseIndex();
		await response;
		await expect(page.locator("#searchInput")).toHaveValue("");
		await expect(page.locator("#searchStatus")).toHaveText("");
		await expect(page.locator(".result-link")).toHaveCount(0);
	});

	test("search retries after the index request fails", async ({ page }) => {
		let requests = 0;
		await page.route("**/search-index.json", async (route) => {
			requests++;
			if (requests === 1) {
				await route.fulfill({ status: 503, body: "Unavailable" });
				return;
			}
			await route.fulfill({ json: [{ title: "Bhairava Kali", url: "/articles/", content: "Bhairava Kali" }] });
		});
		await page.goto("/search/");
		const input = page.locator("#searchInput");
		await input.fill("bhairava");
		await expect(page.locator("#searchStatus")).toHaveText(/Could not load/);
		await input.fill("bhairava kali");
		await expect(page.locator(".result-link")).toHaveCount(1);
		await expect.poll(() => requests).toBe(2);
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

	test("gallery keyboard and browser history work without adding entries", async ({ page }) => {
		await gotoAndStabilize(page, "/gallery/");
		const tile = page.locator(".gallery-item-featured").first();
		await tile.focus();
		await page.keyboard.press("Enter");
		await expect(page.locator("#lightbox")).toHaveClass(/active/);
		await expect(page.locator("#lightbox-close")).toBeFocused();
		await page.goBack();
		await expect(page.locator("#lightbox")).not.toHaveClass(/active/);
		await expect(tile).toBeFocused();
		await page.goForward();
		await expect(page.locator("#lightbox")).toHaveClass(/active/);
		await page.goBack();
		await expect(page.locator("#lightbox")).not.toHaveClass(/active/);
		await page.goForward();
		await expect(page.locator("#lightbox")).toHaveClass(/active/);
		await page.keyboard.press("Escape");
		await expect(page.locator("#lightbox")).not.toHaveClass(/active/);
		await page.locator(".gallery-item").first().focus();
		await page.keyboard.press("Space");
		await expect(page.locator("#lightbox")).toHaveClass(/active/);
	});
});
