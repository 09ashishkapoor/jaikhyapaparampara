const { test, expect } = require("@playwright/test");
const { gotoAndStabilize } = require("../helpers/site");

// ROADMAP Item 5: Crimson Text + Philosopher are self-hosted woff2 subsets under
// fonts/. Nothing on a page may talk to Google's font origins, and the faces the
// first viewport needs must actually load from this origin.
const PAGES = [
	"/",
	"/gallery/",
	"/articles/batuka-bhairava-brahma-kavacham-sanskrit-english/",
];

const THIRD_PARTY_FONT_HOSTS = /fonts\.googleapis\.com|fonts\.gstatic\.com/;

for (const url of PAGES) {
	test(`fonts on ${url} load from this origin only`, async ({ page }) => {
		const requests = [];
		page.on("request", (request) => requests.push(request.url()));

		await gotoAndStabilize(page, url);

		const facts = await page.evaluate(async () => {
			await document.fonts.ready;
			const loaded = [...document.fonts].filter(
				(face) => face.status === "loaded",
			);
			return {
				loadedFamilies: [...new Set(loaded.map((face) => face.family))],
				hasLocalStylesheet: [...document.styleSheets].some((sheet) =>
					(sheet.href || "").endsWith("/fonts/fonts.css"),
				),
				bodyFamily: getComputedStyle(document.body).fontFamily,
			};
		});

		expect(facts.hasLocalStylesheet).toBe(true);
		expect(facts.bodyFamily).toMatch(/Crimson Text/);
		expect(facts.loadedFamilies).toContain("Crimson Text");
		expect(facts.loadedFamilies).toContain("Philosopher");

		expect(
			requests.filter((request) => THIRD_PARTY_FONT_HOSTS.test(request)),
		).toEqual([]);

		const fontRequests = requests.filter((request) =>
			/\.woff2?(\?|$)/.test(request),
		);
		expect(fontRequests.length).toBeGreaterThan(0);
		const origin = new URL(page.url()).origin;
		for (const request of fontRequests) {
			expect(new URL(request).origin).toBe(origin);
		}
	});
}
