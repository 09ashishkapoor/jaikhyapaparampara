const { test, expect } = require("@playwright/test");

// ROADMAP Item 6: two evergreen, indexable pages at /colophon/ and /changelog/,
// linked from every footer, in the sitemap and in llms.txt. The changelog is
// append-only and newest-first.
const PAGES = ["/colophon/", "/changelog/"];

for (const url of PAGES) {
	test(`${url} builds, is indexable, and uses the shared stylesheet`, async ({
		request,
	}) => {
		const response = await request.get(url);
		expect(response.status()).toBe(200);
		const html = await response.text();

		expect(html).toMatch(/<h1[^>]*>[^<]+<\/h1>/);
		expect(html).toMatch(/<meta name="robots" content="index, follow">/);
		expect(html).toContain('href="/site.min.css"');
		// A real page, not a bare fragment: base.liquid supplies the document shell.
		expect(html).toContain("<!DOCTYPE html>");
		expect(html).toContain('class="site-footer"');
	});
}

test("every footer links to the colophon and the changelog", async ({ request }) => {
	for (const url of ["/", "/about/", "/gallery/", "/articles/kalabhairava-name-001-kala-bhairava-devaya/"]) {
		const html = await (await request.get(url)).text();
		expect(html, url).toContain('<a href="/colophon/">Colophon</a>');
		expect(html, url).toContain('<a href="/changelog/">Changelog</a>');
	}
});

test("both pages are in the sitemap and in llms.txt", async ({ request }) => {
	const sitemap = await (await request.get("/sitemap.xml")).text();
	for (const url of PAGES) {
		expect(sitemap, url).toContain(`<loc>https://jaikhyapaparampara.com${url}</loc>`);
	}

	const llms = await (await request.get("/llms.txt")).text();
	expect(llms).toContain("https://jaikhyapaparampara.com/colophon/");
	expect(llms).toContain("https://jaikhyapaparampara.com/changelog/");
});

test("the changelog is newest-first and dates are machine-readable", async ({
	request,
}) => {
	const html = await (await request.get("/changelog/")).text();
	const dates = [...html.matchAll(/<time datetime="([^"]+)">/g)].map((match) => match[1]);

	expect(dates.length).toBeGreaterThanOrEqual(3);
	expect(dates[0]).toBe("2026-11-16");
	expect(dates).toContain("2026-11-15");
	expect(dates).toContain("2026-10-22");
	const sorted = [...dates].sort().reverse();
	expect(dates).toEqual(sorted);
});

test("the colophon renders live counts with thousands separators", async ({
	request,
}) => {
	const html = await (await request.get("/colophon/")).text();
	expect(html).toMatch(/\b\d{1,3}(,\d{3})+ written articles/);
	expect(html).toMatch(/\b\d+ works in the/);
});
