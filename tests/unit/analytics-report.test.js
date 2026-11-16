"use strict";

// Unit tests for the weekly report. Run with:
//   npm run test:analytics
// Playwright ignores this directory (see testIgnore in playwright.config.js).

const test = require("node:test");
const assert = require("node:assert/strict");

const dates = require("../../lib/analytics/dates.js");
const gsc = require("../../lib/analytics/gsc.js");
const report = require("../../lib/analytics/report.js");

function makeArticle({ slug, title, description = "", keywords = "", tags = [], date = "2026-01-01" }) {
	return {
		file: `articles/${slug}.md`,
		slug,
		path: `/articles/${slug}/`,
		title,
		description,
		metaDescription: "",
		keywords,
		tags,
		category: "Sacred Texts and Scriptures",
		date,
	};
}

const QUERY = "kala bhairava devaya";

function makeArticles({ now }) {
	return [
		makeArticle({
			slug: "art-a",
			title: "Kala-Bhairava-Devaya — Meaning and Significance",
			description: "English meaning of the first name of Kalabhairava.",
			keywords: "Kala-Bhairava-Devaya, kalabhairava, namavali",
			tags: ["articles", "Kalabhairava"],
		}),
		makeArticle({
			slug: "art-b",
			title: "Kali Mantra Guide",
			description: "How to recite the Kali mantra.",
			keywords: "kali mantra",
			tags: ["articles", "Kali"],
		}),
		makeArticle({
			slug: "art-c",
			title: "Bama Khepa Life",
			description: "The life of Bama Khepa.",
			keywords: "bama khepa",
			tags: ["articles", "Khyapa"],
		}),
		...Array.from({ length: 8 }, (_, index) =>
			makeArticle({
				slug: `orphan-${index + 1}`,
				title: `Orphan article ${index + 1}`,
				description: "Never linked.",
				date: "2025-06-01",
			}),
		),
		makeArticle({
			slug: "art-new",
			title: "A newly published talk",
			description: "Fresh content.",
			date: dates.addDays(now, -3),
		}),
	];
}

function makeRows({ now }) {
	const end = dates.addDays(now, -2);
	const start = dates.addDays(end, -55);
	const rows = [];
	for (const date of dates.dateRange(start, end)) {
		rows.push({
			source: "gsc",
			dataset: "query",
			date,
			query: QUERY,
			clicks: 0.05,
			impressions: 4,
			ctr: 0.0125,
			position: 7.4,
		});
		rows.push({
			source: "gsc",
			dataset: "querypage",
			date,
			query: QUERY,
			page: "https://jaikhyapaparampara.com/articles/art-a/",
			clicks: 0.05,
			impressions: 4,
			ctr: 0.0125,
			position: 7.4,
		});
		rows.push({
			source: "gsc",
			dataset: "page",
			date,
			page: "https://jaikhyapaparampara.com/articles/art-a/",
			clicks: 0.05,
			impressions: 4,
			ctr: 0.0125,
			position: 7.4,
		});
		rows.push({
			source: "gsc",
			dataset: "page",
			date,
			page: "https://jaikhyapaparampara.com/articles/art-b/",
			clicks: 0,
			impressions: 3,
			ctr: 0,
			position: 5,
		});
		rows.push({
			source: "cf",
			dataset: "pageloads",
			date,
			path: "/articles/art-c/",
			pageLoads: 2,
			visits: 1.2,
		});
	}
	return rows;
}

function build({ now = "2026-11-16", previous = null } = {}) {
	return report.buildReport({
		rows: makeRows({ now }),
		articles: makeArticles({ now }),
		sitemapUrls: [],
		previous,
		now,
		generatedAt: `${now}T06:10:00.000Z`,
		siteUrl: "https://jaikhyapaparampara.com",
		missingDates: [],
	});
}

test("the CTR curve falls monotonically and stays inside sane bounds", () => {
	assert.ok(report.expectedCtr(1) > report.expectedCtr(3));
	assert.ok(report.expectedCtr(3) > report.expectedCtr(7));
	assert.ok(report.expectedCtr(7) > report.expectedCtr(12));
	assert.ok(report.expectedCtr(12) > report.expectedCtr(30));
	assert.ok(report.expectedCtr(1) <= 0.35);
	assert.ok(report.expectedCtr(30) >= 0.001);
	assert.equal(report.expectedCtr(7), 0.032);
});

test("ISO weeks are stable across year boundaries", () => {
	assert.equal(report.isoWeek("2026-01-01"), "2026-W01");
	assert.equal(report.isoWeek("2025-12-29"), "2026-W01");
	assert.equal(report.isoWeek("2026-11-16"), "2026-W47");
	assert.equal(report.isoWeek("2026-11-23"), "2026-W48");
});

test("frontmatter parsing handles the article shape without a YAML dependency", () => {
	const sample = `---
layout: article
title: "Kala-Bhairava-Devaya — Meaning and Significance"
description: "English meaning and spiritual significance."
keywords: "Kala-Bhairava-Devaya, kalabhairava, namavali"
category: "Sacred Texts and Scriptures"
date: 2026-04-12
tags:
  - articles
  - Kalabhairava
  - Namavali
---

Body text starts here.
`;
	const data = report.parseFrontmatter(sample);
	assert.equal(data.title, "Kala-Bhairava-Devaya — Meaning and Significance");
	assert.equal(data.keywords, "Kala-Bhairava-Devaya, kalabhairava, namavali");
	assert.equal(data.date, "2026-04-12");
	assert.deepEqual(data.tags, ["articles", "Kalabhairava", "Namavali"]);
	assert.deepEqual(report.parseFrontmatter("no frontmatter"), {});

	assert.deepEqual(report.parseFrontmatter("---\ntags: [a, b]\n---\n").tags, ["a", "b"]);
});

test("the joined Search Console dataset carries query and page together", () => {
	const request = gsc.buildSearchAnalyticsRequest({
		siteUrl: "sc-domain:jaikhyapaparampara.com",
		startDate: "2026-11-08",
		endDate: "2026-11-14",
		dataset: "querypage",
	});
	assert.deepEqual(request.body.dimensions, ["date", "query", "page"]);
	const rows = gsc.normalizeSearchAnalyticsRows({
		dataset: "querypage",
		rows: [
			{
				keys: ["2026-11-08", "kali mantra", "https://jaikhyapaparampara.com/articles/kali-mantra-guide/"],
				clicks: 2,
				impressions: 100,
				ctr: 0.02,
				position: 11.5,
			},
			{ keys: ["2026-11-08", "", "https://x/"], clicks: 1, impressions: 1, ctr: 1, position: 1 },
		],
	});
	assert.equal(rows.length, 1);
	assert.equal(rows[0].query, "kali mantra");
	assert.equal(rows[0].page, "https://jaikhyapaparampara.com/articles/kali-mantra-guide/");
});

test("the report ranks actions, resolves the ranking page, and caps the queue", () => {
	const result = build();
	assert.ok(result.actions.length <= report.MAX_ACTIONS);
	assert.equal(result.actions.length, 5);

	const types = result.actions.map((action) => action.type);
	assert.ok(types.includes("indexing"));
	assert.ok(types.includes("serp"));
	assert.ok(types.includes("links"));

	const striking = result.actions.find((action) => action.query === QUERY);
	assert.equal(striking.type, "serp");
	assert.equal(striking.source_file, "articles/art-a.md");
	assert.equal(striking.match, "gsc-query-page");
	assert.equal(striking.baseline.kind, "query");
	assert.ok(striking.metrics.expectedCtr > striking.metrics.ctr);

	const zeroClick = result.actions.find((action) => action.probe?.key === "/articles/art-b/");
	assert.ok(zeroClick);
	assert.equal(zeroClick.source_file, "articles/art-b.md");

	const blind = result.actions.find((action) => action.probe?.key === "/articles/art-c/");
	assert.ok(blind);
	assert.equal(blind.type, "links");

	const indexing = result.actions.find((action) => action.type === "indexing");
	assert.equal(indexing.source_file, "articles/art-new.md");

	assert.match(result.markdown, /## Scorecard/);
	assert.match(result.markdown, /## Do this week/);
	assert.match(result.markdown, /## Follow-up/);
	assert.match(result.markdown, /## Pipeline health/);
	assert.doesNotMatch(result.markdown, /undefined/);
});

test("follow-up measures merged actions, waits out the window, and flags stale ones", () => {
	const now = "2026-11-16";
	const previous = {
		actions: [
			{
				id: "serp-improved",
				type: "serp",
				url: "/articles/art-a/",
				query: QUERY,
				probe: { kind: "query", key: QUERY },
				baseline: { kind: "query", key: QUERY, ctr: 0.005, impressions: 100 },
				opened: dates.addDays(now, -30),
				merged: dates.addDays(now, -30),
				status: "open",
			},
			{
				id: "serp-measuring",
				type: "serp",
				url: "/articles/art-a/",
				query: QUERY,
				probe: { kind: "query", key: QUERY },
				baseline: { kind: "query", key: QUERY, ctr: 0.005, impressions: 100 },
				opened: dates.addDays(now, -10),
				merged: dates.addDays(now, -5),
				status: "open",
			},
			{
				id: "serp-stale",
				type: "serp",
				url: "/articles/art-a/",
				query: QUERY,
				probe: { kind: "query", key: QUERY },
				baseline: { kind: "query", key: QUERY, ctr: 0.005, impressions: 100 },
				opened: dates.addDays(now, -30),
				status: "open",
			},
			{
				id: "serp-regressed",
				type: "serp",
				url: "/articles/art-a/",
				query: QUERY,
				probe: { kind: "query", key: QUERY },
				baseline: { kind: "query", key: QUERY, ctr: 0.02, impressions: 100 },
				opened: dates.addDays(now, -30),
				merged: dates.addDays(now, -30),
				status: "open",
			},
		],
		followup: [],
	};
	const result = build({ now, previous });
	const byId = new Map(result.followup.map((entry) => [entry.id, entry]));
	assert.equal(byId.get("serp-improved").status, "improved");
	assert.equal(byId.get("serp-measuring").status, "measuring");
	assert.equal(byId.get("serp-stale").status, "stale");
	assert.equal(byId.get("serp-regressed").status, "regressed");
	assert.match(result.markdown, /\| improved \|/);
});

test("orphan rotation changes with the week instead of repeating the same list", () => {
	const first = build({ now: "2026-11-16" });
	const second = build({ now: "2026-11-23" });
	assert.equal(first.findings.orphans.count, 8);
	assert.equal(first.findings.orphans.examples.length, 5);
	assert.notDeepEqual(first.findings.orphans.examples, second.findings.orphans.examples);
});

test("an empty dataset still renders a report instead of throwing", () => {
	const result = report.buildReport({
		rows: [],
		articles: [],
		now: "2026-11-16",
		generatedAt: "2026-11-16T06:10:00.000Z",
		missingDates: ["2026-11-15"],
	});
	assert.equal(result.actions.length, 0);
	assert.match(result.markdown, /No action crosses the thresholds/);
	assert.match(result.markdown, /latest none/);
	assert.match(result.markdown, /1 \(2026-11-15\)/);
});
