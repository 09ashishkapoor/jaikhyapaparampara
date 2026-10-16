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

test("every sitemap tag has a crawlable link from the paginated directory", async ({ request }) => {
	const sitemap = await request.get("/sitemap.xml");
	expect(sitemap.status()).toBe(200);
	const urls = [...(await sitemap.text()).matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
	expect(new Set(urls).size).toBe(urls.length);
	const tagUrls = urls.filter((url) => /\/tags\/[^/]+\/$/.test(url));
	const directoryUrls = urls.filter((url) => /\/tags\/(?:page\/\d+\/)?$/.test(url));
	expect(directoryUrls.length).toBeGreaterThan(1);
	const linkedTags = [];
	for (const url of directoryUrls) {
		const response = await request.get(new URL(url).pathname);
		expect(response.status()).toBe(200);
		const html = await response.text();
		expect(html).toContain(`<link rel="canonical" href="${url}">`);
		expect(html).toContain('<meta name="robots" content="index, follow">');
		const links = [...html.matchAll(/class="tags-index-card" href="([^"]+)"/g)].map((m) => origin + m[1]);
		expect(links.length).toBeGreaterThan(0);
		expect(links.length).toBeLessThanOrEqual(100);
		linkedTags.push(...links);
		for (const otherUrl of directoryUrls.filter((item) => item !== url)) {
			expect(html).toContain(`href="${new URL(otherUrl).pathname}"`);
		}
	}
	expect(linkedTags.sort()).toEqual(tagUrls.sort());
});

test("small tag archives and archive pagination allow indexing", async ({ request }) => {
	for (const pathname of ["/tags/vedanta/", "/tags/shanti-kunja-ashram/", "/articles/2/", "/articles/a-z/5/"]) {
		const response = await request.get(pathname);
		expect(response.status()).toBe(200);
		const html = await response.text();
		expect(html).toContain('<meta name="robots" content="index, follow">');
		expect(html).toContain(`<link rel="canonical" href="${origin}${pathname}">`);
		expect(response.headers()["x-robots-tag"] || "").not.toContain("noindex");
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
