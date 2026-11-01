const { test, expect } = require("@playwright/test");

const origin = "https://jaikhyapaparampara.com";

test("homepage discovery uses metadata while full-text search keeps article content", async ({ request }) => {
	const compact = await (await request.get("/article-index.json")).json();
	const full = await (await request.get("/search-index.json")).json();
	expect(compact.map((article) => article.url)).toEqual(full.map((article) => article.url));
	expect(compact.every((article) => !Object.hasOwn(article, "content"))).toBe(true);
	expect(full.some((article) => article.content.length > 1000)).toBe(true);
	expect(compact.every((article) => Number.isFinite(Date.parse(article.date)))).toBe(true);
	const homepage = await (await request.get("/")).text();
	expect(homepage).toContain('fetch("/article-index.json")');
	expect(homepage).not.toContain('fetch("/search-index.json")');
});

test("tag pages stay out of the sitemap and are noindex navigation", async ({ request }) => {
	const sitemap = await request.get("/sitemap.xml");
	expect(sitemap.status()).toBe(200);
	const urls = [...(await sitemap.text()).matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
	expect(new Set(urls).size).toBe(urls.length);
	expect(urls.filter((url) => url.startsWith(`${origin}/tags/`))).toEqual([]);
	expect(urls.filter((url) => /\/articles\/topics\/[^/]+\/$/.test(url)).length).toBe(8);

	for (const pathname of ["/tags/", "/tags/page/2/"]) {
		const response = await request.get(pathname);
		expect(response.status()).toBe(200);
		const html = await response.text();
		expect(html).toContain('<meta name="robots" content="noindex, follow">');
		expect(html).toContain(`<link rel="canonical" href="${origin}${pathname}">`);
		const links = [...html.matchAll(/class="tags-index-card" href="([^"]+)"/g)].map((m) => m[1]);
		expect(links.length).toBeGreaterThan(0);
		expect(links.length).toBeLessThanOrEqual(100);
	}
});

test("sitemap includes every self-canonical article archive page", async ({ request }) => {
	const articles = await (await request.get("/article-index.json")).json();
	const sitemap = await (await request.get("/sitemap.xml")).text();
	for (let page = 1; page <= Math.ceil(articles.length / 50); page++) {
		for (const archive of ["/articles/", "/articles/a-z/"]) {
			const pathname = `${archive}${page === 1 ? "" : `${page}/`}`;
			const url = origin + pathname;
			expect(sitemap).toContain(`<loc>${url}</loc>`);
			if (page === 1 || page === Math.ceil(articles.length / 50)) {
				const response = await request.get(pathname);
				expect(response.status()).toBe(200);
				expect(await response.text()).toContain(`<link rel="canonical" href="${url}">`);
			}
		}
	}
});

test("gallery has one primary heading and lightbox images have descriptive alt text", async ({ page }) => {
	await page.goto("/gallery/");
	await expect(page.locator("h1")).toHaveCount(1);
	await expect(page.locator("h1")).toHaveText("Sacred Art Gallery");
	await page.locator(".gallery-item-featured").first().click();
	await expect(page.locator("#lightbox-img")).toHaveAttribute("alt", /Jai Ma Adya Mahakali/);
});

test("paginated article archives have distinct descriptions", async ({ request }) => {
	for (const archive of ["/articles/", "/articles/a-z/"]) {
		const descriptions = [];
		for (const page of [1, 2, 3]) {
			const pathname = `${archive}${page === 1 ? "" : `${page}/`}`;
			const html = await (await request.get(pathname)).text();
			const description = html.match(/<meta name="description" content="([^"]+)"/);
			expect(description, pathname).not.toBeNull();
			descriptions.push(description[1]);
		}
		expect(new Set(descriptions).size).toBe(descriptions.length);
	}
});

test("tag archives are noindex navigation while article archives stay indexable", async ({ request }) => {
	for (const pathname of ["/tags/vedanta/", "/tags/shanti-kunja-ashram/"]) {
		const response = await request.get(pathname);
		expect(response.status()).toBe(200);
		const html = await response.text();
		expect(html).toContain('<meta name="robots" content="noindex, follow">');
		expect(html).toContain(`<link rel="canonical" href="${origin}${pathname}">`);
	}
	for (const pathname of ["/articles/2/", "/articles/a-z/5/"]) {
		const response = await request.get(pathname);
		expect(response.status()).toBe(200);
		const html = await response.text();
		expect(html).toContain('<meta name="robots" content="index, follow">');
		expect(html).toContain(`<link rel="canonical" href="${origin}${pathname}">`);
	}
	const article = await request.get("/articles/homa-yajna-poila-boishakh-coronavirus-world-peace-shyama-khyapa/");
	expect(article.status()).toBe(200);
	expect(await article.text()).toContain('<a href="/tags/shanti-kunja-ashram/" class="tag">Shanti Kunja Ashram</a>');
});

test("404 and internal search stay excluded from indexing and the sitemap", async ({ request }) => {
	const sitemap = await (await request.get("/sitemap.xml")).text();
	for (const pathname of ["/search/", "/404.html"]) {
		const response = await request.get(pathname);
		expect(response.status()).toBe(200);
		expect(await response.text()).toContain('<meta name="robots" content="noindex, follow">');
		expect(sitemap).not.toContain(`<loc>${origin}${pathname}</loc>`);
	}
	const missing = await request.get("/this-page-does-not-exist-index-audit/");
	expect(missing.status()).toBe(404);
});
