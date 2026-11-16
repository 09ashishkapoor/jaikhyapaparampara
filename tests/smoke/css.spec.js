const { test, expect } = require("@playwright/test");

// ROADMAP Item 7 (D8). The site CSS used to be inlined into every page: article
// pages carried ~17 KB of <style> that no browser could cache between pages.
// site.min.css now holds the tokens, reset and chrome every page needs;
// article.min.css holds the article-only rules and is loaded by article pages
// alone. These tests keep that split honest.
const PAGES = [
	"/",
	"/gallery/",
	"/search/",
	"/about/",
	"/articles/",
	"/articles/topics/sadhana-tantra-mantra/",
	"/colophon/",
	"/changelog/",
	"/articles/kalabhairava-name-001-kala-bhairava-devaya/",
	"/articles/batuka-bhairava-brahma-kavacham-sanskrit-english/",
];

const ARTICLE_PAGES = [
	"/articles/kalabhairava-name-001-kala-bhairava-devaya/",
	"/articles/batuka-bhairava-brahma-kavacham-sanskrit-english/",
];

const inlineCssBytes = (html) =>
	[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].reduce(
		(total, match) => total + match[1].length,
		0,
	);

for (const url of PAGES) {
	test(`${url} links the shared stylesheet with an absolute path`, async ({
		request,
	}) => {
		const html = await (await request.get(url)).text();
		expect(html).toContain('href="/site.min.css"');
		// A relative href only resolves from /, so this catches a regression on
		// the homepage.
		expect(html).not.toMatch(/href="site\.min\.css"/);
		expect(html).not.toMatch(/href="styles\.min\.css"/);
	});
}

test("article pages carry almost no inline CSS and add the article bundle", async ({
	request,
}) => {
	for (const url of ARTICLE_PAGES) {
		const html = await (await request.get(url)).text();
		expect(inlineCssBytes(html), url).toBeLessThan(5 * 1024);
		expect(html, url).toContain('href="/article.min.css"');
	}
});

test("non-article pages do not download the article bundle", async ({ request }) => {
	for (const url of ["/", "/gallery/", "/search/", "/about/", "/articles/", "/colophon/", "/changelog/"]) {
		const html = await (await request.get(url)).text();
		expect(html, url).not.toContain('href="/article.min.css"');
	}
});

test("the homepage inline CSS no longer carries the site chrome", async ({
	request,
}) => {
	const html = await (await request.get("/")).text();
	// Was ~35.6 KB with the chrome block inlined; ~29.5 KB after the move.
	expect(inlineCssBytes(html)).toBeLessThan(32 * 1024);
});

test("the shared stylesheets are served and hold the expected rules", async ({
	request,
}) => {
	const site = await request.get("/site.min.css");
	expect(site.status()).toBe(200);
	expect(site.headers()["content-type"]).toMatch(/^text\/css/);
	const siteCss = await site.text();
	expect(siteCss).toContain(":root{");
	expect(siteCss).toContain(".site-header{");
	expect(siteCss).toContain(".site-footer{");
	// The legacy chrome selectors were provably unused and must not come back.
	expect(siteCss).not.toContain(".nav-menu{");
	expect(siteCss).not.toContain(".footer-blessing{");

	const article = await request.get("/article.min.css");
	expect(article.status()).toBe(200);
	expect(article.headers()["content-type"]).toMatch(/^text\/css/);
	const articleCss = await article.text();
	expect(articleCss).toContain(".article-content{");
	expect(articleCss).toContain("body.article-page{");
	// Shared rules live in site.css only.
	expect(articleCss).not.toContain(".site-header{");
	expect(articleCss).not.toContain(":root{");
});

test("both stylesheets are cached for an hour in the built headers", async ({
	request,
}) => {
	const headers = await (await request.get("/_headers")).text();
	for (const file of ["/site.min.css", "/article.min.css"]) {
		const block = new RegExp(
			`${file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\r?\\n\\s+Cache-Control: ([^\\r\\n]+)`,
		).exec(headers);
		expect(block, file).not.toBeNull();
		expect(block[1].trim()).toBe("public, max-age=3600");
	}
});
