const { test, expect } = require("@playwright/test");
const { gotoAndStabilize } = require("../helpers/site");

// ROADMAP Item 8 (D1, D6, D7).
//
// D6: every local <img> must carry intrinsic width/height, and the rendered box
// must keep the file's own aspect ratio. The ratio half matters because a height
// attribute on an image whose CSS constrains only the width would stretch it.
// These two articles cover the two source shapes: a floated 250px image whose
// style had no height declaration, and a full-width image that already had one.
const ARTICLE_IMAGES = [
	"/articles/kalabhairava-name-001-kala-bhairava-devaya/",
	"/articles/kakaradi-kali-sahasranama-names-1-111-one-line-meanings/",
];

for (const url of ARTICLE_IMAGES) {
	test(`article images on ${url} reserve their intrinsic box`, async ({ page }) => {
		await gotoAndStabilize(page, url);

		const images = await page.evaluate(() =>
			[...document.querySelectorAll(".article-content img")].map((image) => {
				const box = image.getBoundingClientRect();
				return {
					src: image.getAttribute("src"),
					width: Number(image.getAttribute("width")),
					height: Number(image.getAttribute("height")),
					naturalWidth: image.naturalWidth,
					naturalHeight: image.naturalHeight,
					renderedWidth: box.width,
					renderedHeight: box.height,
				};
			}),
		);

		expect(images.length).toBeGreaterThan(0);
		for (const image of images) {
			expect(image.width, image.src).toBeGreaterThan(0);
			expect(image.height, image.src).toBeGreaterThan(0);
			expect(image.naturalWidth, image.src).toBeGreaterThan(0);

			const naturalRatio = image.naturalWidth / image.naturalHeight;
			expect(Math.abs(image.width / image.height - naturalRatio), image.src).toBeLessThan(
				0.01,
			);
			expect(
				Math.abs(image.renderedWidth / image.renderedHeight - naturalRatio),
				image.src,
			).toBeLessThan(0.01);
		}
	});
}

test("gallery tiles point at files that exist, originals included", async ({
	request,
}) => {
	const html = await (await request.get("/gallery/")).text();

	const full = [...html.matchAll(/data-full="([^"]+)"/g)].map((match) => match[1]);
	const original = [...html.matchAll(/data-original="([^"]+)"/g)].map(
		(match) => match[1],
	);

	// One tile per work; the masters must all still be linked.
	expect(new Set(original).size).toBe(44);

	// Every tile must know the weight of what it opens, or the preload gate
	// silently lets a multi-megabyte neighbour through.
	const bytes = [...html.matchAll(/data-bytes="(\d+)"/g)].map((match) =>
		Number(match[1]),
	);
	expect(bytes).toHaveLength(44);
	expect(bytes.filter((value) => value <= 0)).toEqual([]);

	for (const url of new Set([...full, ...original])) {
		const response = await request.get(url);
		expect(response.status(), url).toBe(200);
		expect(response.headers()["content-type"], url).toMatch(/^image\//);
	}
});

test("the 13 downscaled works open a larger derivative", async ({ request }) => {
	const html = await (await request.get("/gallery/")).text();
	const tile = (slug) => {
		const match = new RegExp(
			`data-slug="${slug}"[^>]*data-full="([^"]+)"`,
		).exec(html);
		expect(match, slug).not.toBeNull();
		return match[1];
	};

	// Masters wider than 2048 px get the cap; the rest get a native-width
	// derivative, never an upscale.
	for (const slug of [
		"kali-0249",
		"kalika-1061",
		"shmashana-kali-0144",
		"bhairava-0344",
	]) {
		expect(tile(slug), slug).toMatch(/-2048\.webp$/);
	}
	expect(tile("shmashana-kali-0270")).toBe(
		"/images/gallery/responsive/shmashana_kali_0270-1472.webp",
	);
	expect(tile("adya-mahakali-0154")).toBe(
		"/images/gallery/responsive/adya_mahakali_0154-1280.webp",
	);

	// Works whose largest variant is already at native resolution keep the
	// untouched master. These are not defects and must not grow a variant.
	expect(tile("kali-0248")).toBe("/images/gallery/kali_0248.webp");
	expect(tile("bhairava-2199")).toBe("/images/gallery/bhairava_2199.webp");
});

test("the lightbox renders the 2048 px derivative and keeps View original", async ({
	page,
}) => {
	await gotoAndStabilize(page, "/gallery/#image-kali-0249");

	const image = page.locator("#lightbox-img");
	await expect(image).toBeVisible();
	await expect
		.poll(() => image.evaluate((element) => element.naturalWidth), {
			timeout: 15_000,
		})
		.toBeGreaterThanOrEqual(2048);

	expect(
		await image.evaluate((element) => new URL(element.currentSrc).pathname),
	).toBe("/images/gallery/responsive/kali_0249-2048.webp");
	await expect(page.locator("#lightbox-original")).toHaveAttribute(
		"href",
		"/images/gallery/kali_0249.webp",
	);
});

test("heavy lightbox neighbours are not speculatively fetched", async ({
	page,
}) => {
	// kalika_1061 is 1.6 MB and its neighbour kali_1542 is 0.9 MB, so both sit
	// above the preload budget: opening one must not start the other.
	const neighbourRequests = [];
	page.on("request", (request) => {
		const pathname = new URL(request.url()).pathname;
		if (pathname.endsWith("/kali_1542-2048.webp")) neighbourRequests.push(pathname);
	});

	const opened = page.waitForResponse((response) =>
		response.url().endsWith("/kalika_1061-2048.webp"),
	);
	await gotoAndStabilize(page, "/gallery/#image-kalika-1061");
	await opened;

	await page.waitForTimeout(1_500);
	expect(neighbourRequests).toEqual([]);
});

test("heavy tiles advertise their byte size to the lightbox", async ({ request }) => {
	const html = await (await request.get("/gallery/")).text();
	const bytes = (slug) => {
		const match = new RegExp(`data-slug="${slug}"[^>]*data-bytes="(\\d+)"`).exec(html);
		expect(match, slug).not.toBeNull();
		return Number(match[1]);
	};

	expect(bytes("kalika-1061")).toBeGreaterThan(1024 * 1024);
	expect(bytes("shmashana-kali-0270")).toBeLessThan(600 * 1024);
});

test("built headers cache WebP for a year", async ({ request }) => {
	const headers = await (await request.get("/_headers")).text();
	const block = /\/\*\.webp\s*\r?\n\s+Cache-Control: ([^\r\n]+)/.exec(headers);
	expect(block).not.toBeNull();
	expect(block[1].trim()).toBe("public, max-age=31536000, immutable");
});
