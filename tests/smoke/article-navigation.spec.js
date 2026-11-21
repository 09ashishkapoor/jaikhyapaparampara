const { test, expect } = require("@playwright/test");

const article = (slug) => `/articles/${slug}/`;
const atmaOne = article("atma-part-one-five-koshas-three-bodies-soul-shyama-khyapa");
const atmaTwo = article("atma-part-2-bama-khyapa-miracles-karma-paramatma-soul-journey");
const kakaradi = (range) => article(`kakaradi-kali-sahasranama-names-${range}-one-line-meanings`);

test("readers can follow a verified series in both directions without JavaScript", async ({ browser, baseURL }) => {
	const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
	try {
		const page = await context.newPage();
		await page.goto(atmaOne);
		const series = page.getByRole("navigation", { name: "In this series: Atma" });
		await expect(series.getByRole("link", { name: /Next in this series/ })).toHaveAttribute("href", atmaTwo);
		await expect(page.locator(".article-content .article-series")).toHaveCount(0);
		await expect(page.locator(`.related-article-card[href="${atmaTwo}"]`)).toHaveCount(0);
		await series.getByRole("link", { name: /Next in this series/ }).click();
		await expect(page).toHaveURL(atmaTwo);
		await expect(series.getByRole("link", { name: /Previous in this series/ })).toHaveAttribute("href", atmaOne);
	} finally {
		await context.close();
	}
});

test("authored series links remain in place and a missing forward link is supplied", async ({ page }) => {
	await page.goto(kakaradi("112-222"));
	await expect(page.locator(`.article-content a[href="${kakaradi("1-111")}"]`).first()).toBeVisible();
	const series = page.getByRole("navigation", { name: "In this series: Kakaradi Kali Sahasranama" });
	await expect(series.getByRole("link")).toHaveCount(1);
	await expect(series.getByRole("link", { name: /Next in this series/ })).toHaveAttribute("href", kakaradi("223-333"));
});

test("topic badge describes its destination and the archive link actually opens A-Z", async ({ page }) => {
	await page.goto(article("hey-beginner-lets-start-japa-mala-nam-jap-sankalp-set-asan-IxeSBqAdZNk"));
	const hub = "/articles/topics/sadhana-tantra-mantra/";
	const badge = page.locator("a.article-category");
	await expect(badge).toHaveText("Sadhana & Tantra");
	await expect(badge).toHaveAttribute("href", hub);
	await expect(page.getByRole("navigation", { name: "Explore the archive" }).getByRole("link", { name: /Sadhana, Tantra and Mantra/ })).toHaveAttribute("href", hub);
	await badge.click();
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sadhana, Tantra and Mantra");
	await page.getByRole("link", { name: "Browse all A-Z", exact: true }).click();
	await expect(page).toHaveURL("/articles/a-z/#browse-all");
	await expect(page.locator("#browse-all")).toBeVisible();
});

test("topic hub links to the start of an ordered reading path", async ({ page }) => {
	await page.goto("/articles/topics/sacred-texts-scriptures/");
	const paths = page.getByRole("navigation", { name: "Read a series in order" });
	await expect(paths.getByRole("link", { name: "Kakaradi Kali Sahasranama" })).toHaveAttribute("href", kakaradi("1-111"));
});

test("joined Kalabhairava names match the headings and keep the original article and tag routes", async ({ page }) => {
	const first = article("kalabhairava-name-001-kala-bhairava-devaya");
	const second = article("kalabhairava-name-002-kala-kalaya");
	await page.goto(first);
	const next = page.locator(".name-navigation").getByRole("link", { name: "2. KalaKalaya" });
	await expect(next).toHaveAttribute("href", second);
	await next.click();
	await expect(page).toHaveURL(second);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kalabhairava Name 2: KalaKalaya - Meaning and Significance");
	await expect(page.getByRole("heading", { level: 2, name: "2. KalaKalaya" })).toBeVisible();
	await expect(page.locator(".breadcrumbs").getByText("KalaKalaya", { exact: true })).toBeVisible();
	const tag = page.locator(".article-tags").getByRole("link", { name: "KalaKalaya", exact: true });
	await expect(tag).toHaveAttribute("href", "/tags/kala-kalaya/");
	await tag.click();
	await expect(page).toHaveURL("/tags/kala-kalaya/");
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Topic: KalaKalaya");
});

test("a long joined Kalabhairava name fits on a narrow screen", async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await page.goto(article("kalabhairava-name-031-kona-rekhastha-bhadrastha-pradesa-bindu-pithakaya"));
	await expect(page.getByRole("heading", { level: 1 })).toContainText("KonaRekhasthaBhadrasthaPradesaBinduPithakaya");
	const overflow = await page.locator(".article-title, .article-content h2, .name-navigation, .breadcrumbs").evaluateAll((nodes) =>
		nodes.filter((node) => node.scrollWidth > node.clientWidth + 1).map((node) => node.className || node.tagName),
	);
	expect(overflow).toEqual([]);
});

test("the one-line namavali links to all 108 names and keeps unresolved spellings", async ({ page }) => {
	await page.goto(article("kalabhairava-108-names-one-line-meanings"));
	const links = page.locator('.article-content ol li a[href^="/articles/kalabhairava-name-"]');
	await expect(links).toHaveCount(108);
	await expect(links.filter({ hasText: /^KalaKalaya$/ })).toHaveAttribute("href", article("kalabhairava-name-002-kala-kalaya"));
	await expect(links.filter({ hasText: /^Kalii-kalavatii-diiksa-samskara-upasana-priyaya$/ })).toHaveAttribute("href", article("kalabhairava-name-022-kali-kalavatii-diiksa-samskaaropasanapriyaya"));
});
