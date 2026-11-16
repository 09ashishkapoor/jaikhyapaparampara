"use strict";

// Fold the raw daily rows into the single dashboard.json the /stats/ page
// renders. Everything here is a pure function of rows + window so the fixture
// run and the nightly run produce the same shape.

const SCHEMA_VERSION = 1;
const TOP_ROWS = 25;
const ORPHAN_EXAMPLES = 20;

function round(value, digits = 2) {
	const factor = 10 ** digits;
	return Math.round(Number(value || 0) * factor) / factor;
}

function ratio(numerator, denominator) {
	if (!denominator) return 0;
	return round(numerator / denominator, 6);
}

function parsePagePath(pageUrl) {
	const text = String(pageUrl || "");
	try {
		const url = new URL(text);
		return `${url.pathname}${url.search || ""}`;
	} catch {
		return text;
	}
}

function parseSitemapUrls(xml) {
	const urls = new Set();
	for (const match of String(xml || "").matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
		urls.add(match[1]);
	}
	return [...urls];
}

function summarize(rows) {
	const clicks = rows.reduce((total, row) => total + Number(row.clicks || 0), 0);
	const impressions = rows.reduce((total, row) => total + Number(row.impressions || 0), 0);
	const weightedPosition = rows.reduce(
		(total, row) => total + Number(row.position || 0) * Number(row.impressions || 0),
		0,
	);
	return {
		clicks: round(clicks, 2),
		impressions: round(impressions, 2),
		position: impressions ? round(weightedPosition / impressions, 2) : 0,
	};
}

function uniqueDates(rows) {
	return new Set(rows.map((row) => row.date));
}

function latestDate(rows) {
	const dates = [...uniqueDates(rows)].sort();
	return dates.length ? dates[dates.length - 1] : null;
}

function buildQueryTable(rows) {
	const byQuery = new Map();
	for (const row of rows) {
		const query = String(row.query || "").trim();
		if (!query) continue;
		const entry = byQuery.get(query) || {
			query,
			clicks: 0,
			impressions: 0,
			weightedPosition: 0,
		};
		entry.clicks += Number(row.clicks || 0);
		entry.impressions += Number(row.impressions || 0);
		entry.weightedPosition += Number(row.position || 0) * Number(row.impressions || 0);
		byQuery.set(query, entry);
	}
	return [...byQuery.values()]
		.map((entry) => ({
			query: entry.query,
			clicks: round(entry.clicks, 2),
			impressions: round(entry.impressions, 2),
			ctr: ratio(entry.clicks, entry.impressions),
			position: entry.impressions ? round(entry.weightedPosition / entry.impressions, 1) : 0,
		}))
		.sort(
			(a, b) =>
				b.clicks - a.clicks ||
				b.impressions - a.impressions ||
				a.query.localeCompare(b.query),
		)
		.slice(0, TOP_ROWS);
}

function buildPageTable({ gscPageRows, cfRows }) {
	const pages = new Map();
	const ensure = (path) => {
		if (!pages.has(path)) {
			pages.set(path, {
				path,
				pageUrl: "",
				clicks: 0,
				impressions: 0,
				weightedPosition: 0,
				pageLoads: 0,
				visits: 0,
			});
		}
		return pages.get(path);
	};

	for (const row of gscPageRows) {
		const pageUrl = String(row.page || "");
		if (!pageUrl) continue;
		const entry = ensure(parsePagePath(pageUrl));
		if (!entry.pageUrl) entry.pageUrl = pageUrl;
		entry.clicks += Number(row.clicks || 0);
		entry.impressions += Number(row.impressions || 0);
		entry.weightedPosition += Number(row.position || 0) * Number(row.impressions || 0);
	}

	for (const row of cfRows) {
		const path = String(row.path || "/");
		const entry = ensure(path);
		entry.pageLoads += Number(row.pageLoads || 0);
		entry.visits += Number(row.visits || 0);
	}

	return [...pages.values()]
		.map((entry) => ({
			path: entry.path,
			pageUrl: entry.pageUrl,
			clicks: round(entry.clicks, 2),
			impressions: round(entry.impressions, 2),
			ctr: ratio(entry.clicks, entry.impressions),
			position: entry.impressions ? round(entry.weightedPosition / entry.impressions, 1) : 0,
			pageLoads: round(entry.pageLoads, 2),
			visits: round(entry.visits, 2),
		}))
		.sort(
			(a, b) =>
				b.clicks - a.clicks ||
				b.pageLoads - a.pageLoads ||
				b.impressions - a.impressions ||
				a.path.localeCompare(b.path),
		);
}

function buildDailyTable({ dates, gscQueryRows, cfRows }) {
	const byDate = new Map(
		dates.map((date) => [date, { date, clicks: 0, impressions: 0, pageLoads: 0, visits: 0 }]),
	);
	for (const row of gscQueryRows) {
		const day = byDate.get(row.date);
		if (!day) continue;
		day.clicks += Number(row.clicks || 0);
		day.impressions += Number(row.impressions || 0);
	}
	for (const row of cfRows) {
		const day = byDate.get(row.date);
		if (!day) continue;
		day.pageLoads += Number(row.pageLoads || 0);
		day.visits += Number(row.visits || 0);
	}
	return [...byDate.values()].map((day) => ({
		date: day.date,
		clicks: round(day.clicks, 2),
		impressions: round(day.impressions, 2),
		pageLoads: round(day.pageLoads, 2),
		visits: round(day.visits, 2),
	}));
}

function buildDashboard({
	rows = [],
	window,
	generatedAt = new Date().toISOString(),
	siteUrl = "https://jaikhyapaparampara.com",
	sitemapUrls = [],
	demo = false,
} = {}) {
	if (!window || !window.start || !window.end || !Array.isArray(window.dates)) {
		throw new Error("buildDashboard requires a resolved window with dates");
	}
	const inWindow = rows.filter((row) => row.date >= window.start && row.date <= window.end);
	const gscQueryRows = inWindow.filter(
		(row) => row.source === "gsc" && row.dataset === "query",
	);
	const gscPageRows = inWindow.filter(
		(row) => row.source === "gsc" && row.dataset === "page",
	);
	const cfRows = inWindow.filter(
		(row) => row.source === "cf" && row.dataset === "pageloads",
	);

	const gscTotals = summarize(gscQueryRows);
	const pageLoads = cfRows.reduce((total, row) => total + Number(row.pageLoads || 0), 0);
	const visits = cfRows.reduce((total, row) => total + Number(row.visits || 0), 0);
	const pages = buildPageTable({ gscPageRows, cfRows });
	const pageByPath = new Map(pages.map((page) => [page.path, page]));

	const impressionsNoClicks = pages
		.filter((page) => page.impressions > 0 && page.clicks === 0)
		.sort((a, b) => b.impressions - a.impressions || a.path.localeCompare(b.path))
		.slice(0, TOP_ROWS)
		.map((page) => ({
			path: page.path,
			impressions: page.impressions,
			position: page.position,
		}));

	const trafficNoImpressions = pages
		.filter((page) => page.pageLoads > 0 && page.impressions === 0)
		.sort((a, b) => b.pageLoads - a.pageLoads || a.path.localeCompare(b.path))
		.slice(0, TOP_ROWS)
		.map((page) => ({ path: page.path, pageLoads: page.pageLoads, visits: page.visits }));

	const sitemapPaths = sitemapUrls.map((url) => parsePagePath(url));
	const orphanPaths = sitemapPaths.filter((path) => {
		const page = pageByPath.get(path);
		return !page || (page.impressions === 0 && page.pageLoads === 0);
	});

	return {
		schemaVersion: SCHEMA_VERSION,
		generatedAt,
		site: siteUrl,
		demo: Boolean(demo),
		window: { start: window.start, end: window.end, days: window.days },
		sources: {
			gsc: {
				days: uniqueDates(gscQueryRows).size,
				latestDate: latestDate(gscQueryRows),
				rows: gscQueryRows.length + gscPageRows.length,
			},
			cf: {
				days: uniqueDates(cfRows).size,
				latestDate: latestDate(cfRows),
				rows: cfRows.length,
			},
		},
		totals: {
			clicks: gscTotals.clicks,
			impressions: gscTotals.impressions,
			ctr: ratio(gscTotals.clicks, gscTotals.impressions),
			position: gscTotals.position,
			pageLoads: round(pageLoads, 2),
			visits: round(visits, 2),
		},
		daily: buildDailyTable({ dates: window.dates, gscQueryRows, cfRows }),
		topQueries: buildQueryTable(gscQueryRows),
		topPages: pages.filter(
			(page) => page.clicks > 0 || page.impressions > 0 || page.pageLoads > 0,
		).slice(0, TOP_ROWS),
		coverage: {
			pagesWithData: pages.length,
			sitemapUrls: sitemapUrls.length,
			orphans: {
				count: orphanPaths.length,
				examples: orphanPaths.slice(0, ORPHAN_EXAMPLES),
			},
		},
		gaps: {
			impressionsNoClicks,
			trafficNoImpressions,
		},
	};
}

module.exports = {
	SCHEMA_VERSION,
	TOP_ROWS,
	parsePagePath,
	parseSitemapUrls,
	buildDashboard,
};
