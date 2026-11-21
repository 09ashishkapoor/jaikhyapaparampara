const { test } = require("node:test");
const assert = require("node:assert/strict");
const { articleLinksIn, articleUrl, buildArticleNavigation } = require("../../lib/articleNavigation.js");

function article(slug, tags = [], { category = "Spiritual Teachings", date = "2026-01-01" } = {}) {
	return { url: articleUrl(slug), date: new Date(date), data: { title: slug, tags, category } };
}

test("detects article body links, not neighboring attributes, scripts, or comments", () => {
	const body = `
		<a title='see href="/articles/wrong/"' HREF="/articles/first/index.html#read">First</a>
		<a href=https://jaikhyapaparampara.com/articles/second?from=body>Second</a>
		<a href="../third/">Third</a><a href="#section">Section</a>
		<!-- <a href="/articles/commented/">Ignored</a> -->
		<script>let x = '<a href="/articles/script/">Ignored</a>';</script>
		<a data-href="/articles/data/" href="https://example.com/articles/external/">External</a>`;
	assert.deepEqual([...articleLinksIn(body, articleUrl("current"))], ["first", "second", "third"].map(articleUrl));
});

test("a specific shared tag outranks recency and generic archive tags do not match", () => {
	const common = "Guru Baba Shyama Khyapa";
	const current = article("current", ["articles", common, "Recitation", "Study"], { date: "2025-01-01" });
	const exact = article("specific", ["articles", common, "  recitation "], { date: "2025-01-01" });
	const general = article("general", ["articles", common, "Study"], { date: "2026-01-01" });
	const boilerplateOnly = article("newest", ["articles", common], { date: "2026-11-01" });
	const other = Array.from({ length: 12 }, (_, i) => article(`other-${i}`, ["articles", common, ...(i < 5 ? ["Study"] : [])]));
	const navigation = buildArticleNavigation([current, exact, general, boilerplateOnly, ...other], []);
	const related = navigation(current.url, "").related;
	assert.equal(related[0], exact);
	assert.ok(related.includes(general));
	assert.ok(!related.includes(boilerplateOnly));
	assert.equal(related.length, 6);
	assert.deepEqual(navigation(boilerplateOnly.url, "").related, []);
});

test("series order is editorial and generated reading links do not duplicate body links", () => {
	const first = article("first", ["shared"], { date: "2026-03-01" });
	const second = article("second", ["shared"], { date: "2026-02-01" });
	const third = article("third", ["shared"], { date: "2026-01-01" });
	const companion = article("companion", ["shared"]);
	const navigation = buildArticleNavigation([third, first, companion, second], [
		{ title: "Three parts", slugs: ["first", "second", "third"] },
	]);
	const middle = navigation(second.url, `<a href="${first.url}#begin">First</a>`);
	assert.equal(middle.seriesTitle, "Three parts");
	assert.deepEqual(middle.seriesLinks, [{ direction: "Next in this series", article: third }]);
	assert.deepEqual(middle.related, [companion]);
	assert.deepEqual(navigation(third.url, "").seriesLinks, [{ direction: "Previous in this series", article: second }]);
	assert.deepEqual(navigation(companion.url, `<a href="${first.url}">First</a>`).related, [second]);
});

test("only one entry from the existing numbered names sequence is recommended", () => {
	const current = article("intro", ["Bhairava"]);
	const first = article("kalabhairava-name-001-first", ["Bhairava"]);
	const second = article("kalabhairava-name-002-second", ["Bhairava"], { date: "2026-11-20" });
	const navigation = buildArticleNavigation([second, first, current], []);
	assert.deepEqual(navigation(current.url, "").related, [first]);
	assert.deepEqual(navigation(first.url, "").seriesLinks, []);
});

test("matching the actual topic breaks equally relevant matches before date", () => {
	const current = article("current", ["shared"]);
	const older = article("older", ["shared"], { date: "2025-02-01", category: "Sadhana" });
	const newer = article("newer", ["shared"], { date: "2026-02-01" });
	const navigation = buildArticleNavigation([current, older, newer], [], [
		{ slug: "actual-topic", articles: [current, older] },
		{ slug: "different-topic", articles: [newer] },
	]);
	assert.deepEqual(navigation(current.url, "").related, [older, newer]);
});

test("reading paths cannot reference missing articles or repeat an article", () => {
	const articles = [article("first"), article("second")];
	assert.throws(() => buildArticleNavigation(articles, [
		{ title: "Invalid", slugs: ["first", "missing"] },
	]), /missing article/);
	assert.throws(() => buildArticleNavigation(articles, [
		{ title: "Invalid", slugs: ["first", "first"] },
	]), /multiple reading paths/);
});
