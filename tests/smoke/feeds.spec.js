const { test, expect } = require("@playwright/test");

const origin = "https://jaikhyapaparampara.com";

test("combined Atom feed exposes 30 recent articles with absolute ids", async ({
	request,
}) => {
	const response = await request.get("/feed.xml");
	expect(response.status()).toBe(200);
	const xml = await response.text();

	expect(xml.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true);
	expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom"');
	expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;)/i);

	const entries = [...xml.matchAll(/<entry>[\s\S]*?<\/entry>/g)].map((m) => m[0]);
	expect(entries).toHaveLength(30);
	for (const entry of entries) {
		expect(entry).toMatch(
			/<id>https:\/\/jaikhyapaparampara\.com\/articles\/[^<]+<\/id>/,
		);
		expect(entry).toMatch(/<published>[^<]+<\/published>/);
		expect(entry).toMatch(/<summary type="text">[^<]+<\/summary>/);
	}

	const homepage = await (await request.get("/")).text();
	expect(homepage).toContain(
		'rel="alternate" type="application/atom+xml"',
	);
});

test("every topic feed contains only that topic's articles", async ({
	request,
}) => {
	const sitemap = await (await request.get("/sitemap.xml")).text();
	const topicUrls = [
		...sitemap.matchAll(
			/<loc>(https:\/\/jaikhyapaparampara\.com\/articles\/topics\/[^<]+\/)<\/loc>/g,
		),
	].map((match) => match[1]);
	expect(topicUrls).toHaveLength(8);

	for (const topicUrl of topicUrls) {
		const topicPath = new URL(topicUrl).pathname;
		const topicPage = await (await request.get(topicPath)).text();
		expect(topicPage).toContain(`href="${topicPath}feed.xml"`);
		expect(topicPage).toContain(
			`rel="alternate" type="application/atom+xml"`,
		);

		const linked = new Set(
			[...topicPage.matchAll(/href="([^"]+)" class="article-row-link"/g)].map(
				(match) => new URL(match[1], topicUrl).href,
			),
		);
		expect(linked.size).toBeGreaterThan(0);

		const feed = await (await request.get(`${topicPath}feed.xml`)).text();
		expect(feed).not.toMatch(
			/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;)/i,
		);
		const ids = [
			...feed.matchAll(/<entry>\s*<id>([^<]+)<\/id>/g),
		].map((match) => match[1]);
		expect(ids).toHaveLength(Math.min(30, linked.size));
		expect(ids.every((id) => linked.has(id))).toBe(true);
	}
});

test("article pages advertise the combined and topic feeds", async ({
	request,
}) => {
	const articles = await (await request.get("/article-index.json")).json();
	const response = await request.get(articles[0].url);
	expect(response.status()).toBe(200);
	const html = await response.text();
	expect(html).toContain('href="/feed.xml"');
	expect(html).toMatch(
		/href="\/articles\/topics\/[^"]+\/feed\.xml"/,
	);
});
