const test = require("node:test");
const assert = require("node:assert/strict");
const {
	addImageDimensions,
	needsAutoHeight,
} = require("../../lib/imageAttributes.js");

// Shapes copied from the real sources so the tests describe the actual pages.
const SIZES = {
	"/images/gallery/bhairava_2199.webp": { width: 948, height: 1596, bytes: 1 },
	"/images/articles/0tu2e00n.jpg": { width: 1202, height: 1600, bytes: 1 },
	"/images/articles/kalabhairava-ashtakam.webp": { width: 1200, height: 1490, bytes: 1 },
};

test("adds both dimensions and height:auto for a width-only float", () => {
	const html =
		'<img src="/images/gallery/bhairava_2199.webp" alt="Kalabhairava Name" ' +
		'style="width: 100%; max-width: 250px; float: right; margin: 0 0 1.5rem 1.5rem;" />';
	const out = addImageDimensions(html, SIZES);

	assert.match(out, /\swidth="948"/);
	assert.match(out, /\sheight="1596"/);
	assert.match(
		out,
		/style="width: 100%; max-width: 250px; float: right; margin: 0 0 1.5rem 1.5rem;height:auto"/,
	);
	assert.ok(out.endsWith('height="1596"/>'), out);
	assert.equal(out.match(/width=/g).length, 1);
});

test("leaves a style that already declares height alone", () => {
	const html =
		'<img src="/images/articles/0tu2e00n.jpg" alt="Ma Kali" ' +
		'style="max-width:100%;height:auto;border-radius:8px;" loading="eager" />';
	const out = addImageDimensions(html, SIZES);

	assert.match(out, /\swidth="1202"/);
	assert.match(out, /\sheight="1600"/);
	assert.match(out, /style="max-width:100%;height:auto;border-radius:8px;"/);
});

test("adds no style attribute when the tag has none", () => {
	const out = addImageDimensions(
		'<img src="/images/articles/kalabhairava-ashtakam.webp" alt="Lord Kalabhairava">',
		SIZES,
	);

	assert.equal(
		out,
		'<img src="/images/articles/kalabhairava-ashtakam.webp" alt="Lord Kalabhairava" width="1200" height="1490">',
	);
});

test("keeps existing intrinsic dimensions", () => {
	const html = '<img src="/images/gallery/bhairava_2199.webp" width="948" height="1596">';
	assert.equal(addImageDimensions(html, SIZES), html);
});

test("fills in the missing half of a partial pair", () => {
	const out = addImageDimensions(
		'<img src="/images/gallery/bhairava_2199.webp" width="474">',
		SIZES,
	);
	assert.match(out, /\swidth="474"/);
	assert.match(out, /\sheight="798"/); // 474 * 1596 / 948
});

test("ignores relative, remote, missing and unknown sources", () => {
	const cases = [
		'<img src="images/articles/0tu2e00n.jpg">',
		'<img src="//cdn.example.com/x.jpg">',
		'<img src="https://example.com/x.jpg">',
		'<img id="lightbox-img" alt="" decoding="async">',
		'<img src="/images/not-in-the-manifest.jpg">',
	];
	for (const html of cases) assert.equal(addImageDimensions(html, SIZES), html);
});

test("no-ops without a manifest", () => {
	const html = '<img src="/images/gallery/bhairava_2199.webp">';
	assert.equal(addImageDimensions(html, {}), html);
	assert.equal(addImageDimensions(html, null), html);
});

test("a > inside an alt value does not end the tag early", () => {
	const out = addImageDimensions(
		'<img src="/images/gallery/bhairava_2199.webp" alt="Kala > Bhairava">text',
		SIZES,
	);
	assert.equal(
		out,
		'<img src="/images/gallery/bhairava_2199.webp" alt="Kala > Bhairava" width="948" height="1596">text',
	);
});

test("needsAutoHeight only fires for width constraints without a height", () => {
	assert.equal(needsAutoHeight("width: 100%; max-width: 250px;"), true);
	assert.equal(needsAutoHeight("max-width:100%;height:auto;"), false);
	assert.equal(needsAutoHeight("border-width: 1px;"), false);
	assert.equal(needsAutoHeight(null), false);
});
