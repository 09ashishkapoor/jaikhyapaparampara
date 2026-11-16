"use strict";

// Weekly SEO report: turns the raw daily rows into a short, deterministic
// digest plus a machine-readable action queue. The report is pushed to a
// private repository; nothing here writes to the site or to the public repo.
//
// Everything is a pure function of (rows, articles, sitemap, previous, now),
// so the fixture run and the live run produce the same output for the same
// inputs. The thresholds below are the tuning surface; they are deliberately
// conservative because this site has low traffic and noisy week-to-week data.

const { addDays, windowEndingAt } = require("./dates.js");

const SCHEMA_VERSION = 1;
const WINDOW_DAYS = 28;
const PRIOR_DAYS = 28;
const GSC_LAG_DAYS = 2;
const CF_LAG_DAYS = 1;
const MEASURE_LAG_DAYS = 2;
const MEASURE_WINDOW_DAYS = 14;
const STALE_ACTION_DAYS = 21;
const MAX_ACTIONS = 5;
const MAX_WATCHLIST = 5;
const MAX_CARRY = 10;
const SETTLED_HISTORY_DAYS = 56;

// Minimum volume before a finding is worth a line. Below these floors the
// numbers are direction, not signal.
const STRIKING_MIN_IMPRESSIONS = 20;
const STRIKING_MIN_GAP = 0.005; // 0.5 percentage points of CTR
const ZERO_CLICK_MIN_IMPRESSIONS = 50;
const BLIND_MIN_VISITS = 20;
const WOW_MIN_CLICKS = 20;
const NEW_ARTICLE_DAYS = 14;
// An article cannot be indexed before it is deployed; asking for indexing on
// day zero produces a false finding every publish week.
const INDEXING_MIN_AGE_DAYS = 3;

// Approximate CTR by Google position. Used only to rank opportunities: an
// article at position 7 earning 0.8% is worth more attention than one at
// position 12 earning 1%. Keep the curve monotonic and crude on purpose.
const CTR_BY_POSITION = [
	[1, 0.28],
	[2, 0.15],
	[3, 0.1],
	[4, 0.07],
	[5, 0.05],
	[6, 0.04],
	[7, 0.032],
	[8, 0.026],
	[9, 0.022],
	[10, 0.019],
	[11, 0.017],
	[12, 0.015],
	[13, 0.014],
	[14, 0.013],
	[15, 0.012],
	[20, 0.009],
	[30, 0.006],
];

const STOPWORDS = new Set([
	"a", "an", "the", "of", "in", "on", "for", "and", "or", "to", "is", "are",
	"what", "how", "why", "who", "with", "from", "by", "at", "as", "that",
	"this", "it", "its", "be", "can", "do", "does", "i", "my", "me", "we",
	"you", "your", "vs", "versus", "meaning", "means", "english",
]);

function round(value, digits = 2) {
	const factor = 10 ** digits;
	return Math.round(Number(value || 0) * factor) / factor;
}

function commas(value) {
	const text = String(Math.round(Number(value || 0)));
	return text.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function percent(value, digits = 2) {
	return `${(Number(value || 0) * 100).toFixed(digits)}%`;
}

function expectPercent(value, digits = 1) {
	return `${(Number(value || 0) * 100).toFixed(digits)}%`;
}

function expectedCtr(position) {
	const pos = Number(position) || 0;
	if (pos <= 1) return CTR_BY_POSITION[0][1];
	for (let index = 0; index < CTR_BY_POSITION.length - 1; index += 1) {
		const [startPosition, startCtr] = CTR_BY_POSITION[index];
		const [endPosition, endCtr] = CTR_BY_POSITION[index + 1];
		if (pos >= startPosition && pos <= endPosition) {
			const fraction = (pos - startPosition) / (endPosition - startPosition);
			return startCtr + (endCtr - startCtr) * fraction;
		}
	}
	return CTR_BY_POSITION[CTR_BY_POSITION.length - 1][1];
}

function isoWeek(isoDate) {
	const date = new Date(`${isoDate}T00:00:00Z`);
	const day = (date.getUTCDay() + 6) % 7;
	date.setUTCDate(date.getUTCDate() - day + 3);
	const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
	const firstDay = (firstThursday.getUTCDay() + 6) % 7;
	firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
	const week = 1 + Math.round((date - firstThursday) / (7 * 86400000));
	return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function daysBetween(fromIso, toIso) {
	return Math.round(
		(Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86400000,
	);
}

function fnv1a(text) {
	let hash = 0x811c9dc5;
	const input = String(text);
	for (let index = 0; index < input.length; index += 1) {
		hash ^= input.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193);
	}
	return (hash >>> 0).toString(36);
}

function pagePath(value) {
	const text = String(value || "");
	try {
		const url = new URL(text);
		return `${url.pathname}${url.search || ""}`;
	} catch {
		return text;
	}
}

function articleSlugFromPath(value) {
	const match = /^\/articles\/([^/]+)\/$/.exec(String(value || ""));
	return match ? match[1] : null;
}

function unquote(value) {
	const text = String(value == null ? "" : value).trim();
	if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
		return text.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
	}
	if (text.length >= 2 && text.startsWith("'") && text.endsWith("'")) {
		return text.slice(1, -1).replace(/''/g, "'");
	}
	return text;
}

// Minimal frontmatter reader for articles/*.md. The repository's frontmatter
// is flat: strings, ISO dates, and one block list (tags). A full YAML parser
// would add a dependency to a pipeline that intentionally has none.
function parseFrontmatter(text) {
	const source = String(text || "");
	if (!source.startsWith("---")) return {};
	const end = source.indexOf("\n---", 3);
	if (end < 0) return {};
	const block = source.slice(source.indexOf("\n") + 1, end);
	const data = {};
	let currentList = null;
	for (const rawLine of block.split(/\r?\n/)) {
		if (!rawLine.trim()) continue;
		const listItem = /^\s*-\s+(.*)$/.exec(rawLine);
		if (listItem && currentList) {
			data[currentList].push(unquote(listItem[1]));
			continue;
		}
		const pair = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(rawLine);
		if (!pair) continue;
		const [, key, rest] = pair;
		currentList = null;
		if (!rest.trim()) {
			data[key] = [];
			currentList = key;
			continue;
		}
		const inlineList = /^\[(.*)\]$/.exec(rest.trim());
		if (inlineList) {
			data[key] = inlineList[1]
				.split(",")
				.map((item) => unquote(item))
				.filter(Boolean);
			continue;
		}
		data[key] = unquote(rest);
	}
	return data;
}

function asArray(value) {
	if (Array.isArray(value)) return value.filter(Boolean);
	if (value == null || value === "") return [];
	return [String(value)];
}

function aggregateGsc(rows, dataset, keyField, start, end) {
	const totals = new Map();
	for (const row of rows) {
		if (row.source !== "gsc" || row.dataset !== dataset) continue;
		if (row.date < start || row.date > end) continue;
		const rawKey = String(row[keyField] || "").trim();
		if (!rawKey) continue;
		// Search Console reports absolute page URLs; Cloudflare and the
		// sitemap use paths. Normalise here so both sides join on the same key.
		const key = dataset === "page" ? pagePath(rawKey) : rawKey;
		const entry = totals.get(key) || { key, clicks: 0, impressions: 0, weightedPosition: 0 };
		entry.clicks += Number(row.clicks || 0);
		entry.impressions += Number(row.impressions || 0);
		entry.weightedPosition += Number(row.position || 0) * Number(row.impressions || 0);
		totals.set(key, entry);
	}
	const output = new Map();
	for (const [key, entry] of totals) {
		output.set(key, {
			key,
			clicks: round(entry.clicks, 2),
			impressions: round(entry.impressions, 2),
			ctr: entry.impressions ? round(entry.clicks / entry.impressions, 4) : 0,
			position: entry.impressions ? round(entry.weightedPosition / entry.impressions, 1) : 0,
		});
	}
	return output;
}

function aggregateCloudflare(rows, start, end) {
	const totals = new Map();
	for (const row of rows) {
		if (row.source !== "cf" || row.dataset !== "pageloads") continue;
		if (row.date < start || row.date > end) continue;
		const key = String(row.path || "/");
		const entry = totals.get(key) || { key, pageLoads: 0, visits: 0 };
		entry.pageLoads += Number(row.pageLoads || 0);
		entry.visits += Number(row.visits || 0);
		totals.set(key, entry);
	}
	const output = new Map();
	for (const [key, entry] of totals) {
		output.set(key, {
			key,
			pageLoads: round(entry.pageLoads, 2),
			visits: round(entry.visits, 2),
		});
	}
	return output;
}

function summarizeGsc(map) {
	let clicks = 0;
	let impressions = 0;
	let weightedPosition = 0;
	for (const entry of map.values()) {
		clicks += entry.clicks;
		impressions += entry.impressions;
		weightedPosition += entry.position * entry.impressions;
	}
	return {
		clicks: round(clicks, 2),
		impressions: round(impressions, 2),
		ctr: impressions ? round(clicks / impressions, 4) : 0,
		position: impressions ? round(weightedPosition / impressions, 1) : 0,
	};
}

function summarizeCloudflare(map) {
	let pageLoads = 0;
	let visits = 0;
	for (const entry of map.values()) {
		pageLoads += entry.pageLoads;
		visits += entry.visits;
	}
	return { pageLoads: round(pageLoads, 2), visits: round(visits, 2) };
}

function tokenize(text) {
	return String(text || "")
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function keywordList(article) {
	return tokenize(article.keywords);
}

// Query-to-article matching when the Search Console export has no page
// dimension for the query (historical rows). Deliberately conservative: a
// low score means "review manually" rather than a guessed file.
function scoreArticle(article, queryTokens) {
	if (!queryTokens.length) return 0;
	const titleTokens = tokenize(article.title);
	const keywordTokens = keywordList(article);
	const descriptionTokens = tokenize(article.description);
	let score = 0;
	for (const token of queryTokens) {
		if (titleTokens.includes(token)) score += 3;
		else if (titleTokens.some((word) => word.startsWith(token) && token.length >= 4)) score += 2;
		else if (keywordTokens.includes(token)) score += 2;
		else if (descriptionTokens.includes(token)) score += 0.5;
	}
	return score / (queryTokens.length * 3);
}

function matchArticle(articles, query) {
	const tokens = tokenize(query);
	if (!tokens.length) return null;
	let best = null;
	for (const article of articles) {
		const score = scoreArticle(article, tokens);
		if (!best || score > best.score) best = { article, score };
	}
	return best && best.score >= 0.5 ? best : null;
}

function resolveQueryPage({ query, queryPageMap, articles, pageIndex }) {
	const pages = queryPageMap.get(query);
	if (pages && pages.length) {
		const ranked = [...pages]
			.filter((entry) => entry.path.startsWith("/articles/"))
			.sort((a, b) => b.impressions - a.impressions || a.path.localeCompare(b.path));
		for (const entry of ranked) {
			const article = pageIndex.get(entry.path);
			if (article) return { article, match: "gsc-query-page" };
		}
	}
	const fallback = matchArticle(articles, query);
	return fallback ? { article: fallback.article, match: "text-match" } : { article: null, match: null };
}

function buildQueryPageMap(rows, start, end) {
	const map = new Map();
	for (const row of rows) {
		if (row.source !== "gsc" || row.dataset !== "querypage") continue;
		if (row.date < start || row.date > end) continue;
		const query = String(row.query || "").trim();
		const path = pagePath(row.page || "");
		if (!query || !path) continue;
		const entries = map.get(query) || [];
		const existing = entries.find((entry) => entry.path === path);
		if (existing) existing.impressions += Number(row.impressions || 0);
		else entries.push({ path, impressions: Number(row.impressions || 0) });
		map.set(query, entries);
	}
	return map;
}

// Deterministic week-seeded order, so the orphan list rotates instead of
// repeating the same five articles every Monday.
function seededOrder(items, seed) {
	return [...items].sort((a, b) => {
		const hashA = fnv1a(`${seed}|${a.path || a.key || a}`);
		const hashB = fnv1a(`${seed}|${b.path || b.key || b}`);
		if (hashA !== hashB) return hashA < hashB ? -1 : 1;
		return String(a.path || a.key || a).localeCompare(String(b.path || b.key || b));
	});
}

function makeAction({ type, article, query, metrics, why, probe, baseline, week, now, match }) {
	const key = article ? article.slug : `q-${fnv1a(query || "")}`;
	return {
		id: `${type}-${key}-${fnv1a(week)}`,
		type,
		url: article ? article.path : "",
		source_file: article ? article.file : null,
		query: query || null,
		match: match || null,
		metrics,
		current: article
			? {
					title: article.title || "",
					description: article.description || "",
					metaDescription: article.metaDescription || "",
					keywords: article.keywords || "",
					tags: asArray(article.tags),
				}
			: null,
		why,
		probe,
		baseline,
		opened: now,
		status: "open",
	};
}

function candidatePriority(type) {
	switch (type) {
		case "indexing":
			return 95;
		case "serp":
			return 90;
		case "zero-click":
			return 80;
		case "blind":
			return 70;
		case "links":
			return 50;
		default:
			return 40;
	}
}

function dedupeActions(candidates) {
	const seen = new Set();
	const output = [];
	for (const candidate of candidates) {
		const action = candidate.action;
		const key = action.source_file || action.url || action.query || action.id;
		if (seen.has(key)) continue;
		seen.add(key);
		output.push(candidate);
	}
	return output;
}

function measureAction(action, { queryCurrent, pageCurrent, cfCurrent }) {
	const probe = action.probe || null;
	if (!probe) return null;
	if (probe.kind === "query") {
		const current = queryCurrent.get(probe.key);
		return {
			impressions: current ? current.impressions : 0,
			clicks: current ? current.clicks : 0,
			ctr: current ? current.ctr : 0,
			position: current ? current.position : 0,
		};
	}
	const page = pageCurrent.get(probe.key);
	const cloudflare = cfCurrent.get(probe.key);
	return {
		impressions: page ? page.impressions : 0,
		clicks: page ? page.clicks : 0,
		ctr: page ? page.ctr : 0,
		position: page ? page.position : 0,
		pageLoads: cloudflare ? cloudflare.pageLoads : 0,
		visits: cloudflare ? cloudflare.visits : 0,
	};
}

function judge(action, current) {
	const baseline = action.baseline || { kind: "query", ctr: 0, impressions: 0 };
	if (!current) return { status: "unmeasured", delta: null };
	if (action.type === "links" || action.type === "indexing") {
		const before = Number(baseline.impressions || 0);
		const after = Number(current.impressions || 0);
		if (before === 0 && after > 0) return { status: "improved", delta: { impressions: after } };
		if (before >= 10 && after < before * 0.5) return { status: "regressed", delta: { impressions: after } };
		if (before > 0 && after > before * 1.5 && after - before >= 5) {
			return { status: "improved", delta: { impressions: after } };
		}
		return { status: "unchanged", delta: { impressions: after } };
	}
	const beforeCtr = Number(baseline.ctr || 0);
	const beforeImpressions = Number(baseline.impressions || 0);
	const afterCtr = Number(current.ctr || 0);
	const afterImpressions = Number(current.impressions || 0);
	if (beforeImpressions >= 10 && afterImpressions < beforeImpressions * 0.5) {
		return { status: "regressed", delta: { impressions: afterImpressions, ctr: afterCtr } };
	}
	if (beforeCtr === 0 && afterCtr > 0) {
		return { status: "improved", delta: { impressions: afterImpressions, ctr: afterCtr } };
	}
	if (beforeCtr > 0 && afterCtr >= beforeCtr * 1.5) {
		return { status: "improved", delta: { impressions: afterImpressions, ctr: afterCtr } };
	}
	if (beforeCtr > 0 && afterCtr < beforeCtr * 0.8) {
		return { status: "regressed", delta: { impressions: afterImpressions, ctr: afterCtr } };
	}
	return { status: "unchanged", delta: { impressions: afterImpressions, ctr: afterCtr } };
}

function buildFollowUp({ previous, now, queryCurrent, pageCurrent, cfCurrent }) {
	const followup = [];
	const carried = [];
	if (!previous) return { followup, carried };
	const entries = [
		...asArray(previous.actions).map((entry) => ({ ...entry, __section: "actions" })),
		...asArray(previous.followup).map((entry) => ({ ...entry, __section: "followup" })),
	];
	for (const entry of entries) {
		if (!entry || typeof entry !== "object") continue;
		const action = { ...entry };
		delete action.__section;
		if (action.settledAt && daysBetween(action.settledAt, now) > SETTLED_HISTORY_DAYS) continue;
		if (action.merged) {
			const measureStart = addDays(action.merged, MEASURE_LAG_DAYS);
			if (daysBetween(measureStart, now) < MEASURE_WINDOW_DAYS) {
				followup.push({ ...action, status: "measuring" });
				continue;
			}
			const current = measureAction(action, { queryCurrent, pageCurrent, cfCurrent });
			const result = judge(action, current);
			followup.push({
				...action,
				status: result.status,
				delta: result.delta,
				measuredAt: now,
				settledAt: result.status === "measuring" ? undefined : now,
			});
			continue;
		}
		if (!action.opened || daysBetween(action.opened, now) > STALE_ACTION_DAYS) {
			followup.push({ ...action, status: "stale", settledAt: now });
			continue;
		}
		carried.push(action);
	}
	return { followup, carried: carried.slice(0, MAX_CARRY) };
}

function deltaText(current, previous, invert = false) {
	const before = Number(previous || 0);
	const after = Number(current || 0);
	if (!before) return after ? "new" : "—";
	const change = (after - before) / before;
	if (invert) return change <= 0 ? `${Math.round(change * 100)}%` : `+${Math.round(change * 100)}%`;
	const sign = change > 0 ? "+" : "";
	return `${sign}${Math.round(change * 100)}%`;
}

function buildReport({
	rows = [],
	articles = [],
	sitemapUrls = [],
	previous = null,
	now,
	generatedAt = new Date().toISOString(),
	siteUrl = "https://jaikhyapaparampara.com",
	missingDates = [],
} = {}) {
	const today = String(now || "").slice(0, 10);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error("buildReport requires now as YYYY-MM-DD");
	if (!Array.isArray(rows)) throw new Error("buildReport requires rows as an array");

	const gscEnd = addDays(today, -GSC_LAG_DAYS);
	const cfEnd = addDays(today, -CF_LAG_DAYS);
	const gscWindow = windowEndingAt(gscEnd, WINDOW_DAYS);
	const gscPrior = windowEndingAt(addDays(gscWindow.start, -1), PRIOR_DAYS);
	const cfWindow = windowEndingAt(cfEnd, WINDOW_DAYS);
	const cfPrior = windowEndingAt(addDays(cfWindow.start, -1), PRIOR_DAYS);
	const week = isoWeek(today);

	const queryCurrent = aggregateGsc(rows, "query", "query", gscWindow.start, gscWindow.end);
	const queryPrior = aggregateGsc(rows, "query", "query", gscPrior.start, gscPrior.end);
	const pageCurrent = aggregateGsc(rows, "page", "page", gscWindow.start, gscWindow.end);
	const pagePrior = aggregateGsc(rows, "page", "page", gscPrior.start, gscPrior.end);
	const cfCurrent = aggregateCloudflare(rows, cfWindow.start, cfWindow.end);
	const cfPriorTotals = aggregateCloudflare(rows, cfPrior.start, cfPrior.end);
	const queryPageMap = buildQueryPageMap(rows, gscWindow.start, gscWindow.end);

	const pageIndex = new Map();
	for (const article of articles) pageIndex.set(article.path, article);
	const articleByPath = new Map(articles.map((article) => [article.path, article]));

	const candidates = [];

	// 1. Striking distance: rank 4-15 with impressions and a CTR gap.
	const striking = [];
	for (const entry of queryCurrent.values()) {
		if (entry.impressions < STRIKING_MIN_IMPRESSIONS) continue;
		if (entry.position < 4 || entry.position > 15) continue;
		const expected = expectedCtr(entry.position);
		const gap = expected - entry.ctr;
		if (gap < STRIKING_MIN_GAP) continue;
		striking.push({ ...entry, expected, gap, value: entry.impressions * gap });
	}
	striking.sort((a, b) => b.value - a.value || b.impressions - a.impressions || a.key.localeCompare(b.key));
	for (const entry of striking.slice(0, MAX_ACTIONS)) {
		const resolved = resolveQueryPage({
			query: entry.key,
			queryPageMap,
			articles,
			pageIndex,
		});
		candidates.push({
			priority: candidatePriority("serp"),
			sort: entry.value,
			action: makeAction({
				type: "serp",
				article: resolved.article,
				query: entry.key,
				metrics: {
					impressions: entry.impressions,
					clicks: entry.clicks,
					ctr: entry.ctr,
					position: entry.position,
					expectedCtr: round(entry.expected, 4),
				},
				why:
					`position ${entry.position} with ${commas(entry.impressions)} impressions and ` +
					`${percent(entry.ctr)} CTR (about ${expectPercent(entry.expected)} expected).`,
				probe: { kind: "query", key: entry.key },
				baseline: {
					kind: "query",
					key: entry.key,
					ctr: entry.ctr,
					impressions: entry.impressions,
					position: entry.position,
				},
				week,
				now: today,
				match: resolved.match,
			}),
		});
	}

	// 2. Zero-click pages: impressions but no clicks.
	const zeroClick = [...pageCurrent.values()]
		.filter((entry) => articleByPath.has(entry.key))
		.filter((entry) => entry.impressions >= ZERO_CLICK_MIN_IMPRESSIONS && entry.clicks === 0)
		.sort((a, b) => b.impressions - a.impressions || a.key.localeCompare(b.key));
	for (const entry of zeroClick.slice(0, MAX_WATCHLIST)) {
		const article = articleByPath.get(entry.key);
		candidates.push({
			priority: candidatePriority("zero-click"),
			sort: entry.impressions,
			action: makeAction({
				type: "serp",
				article,
				metrics: {
					impressions: entry.impressions,
					clicks: entry.clicks,
					ctr: entry.ctr,
					position: entry.position,
				},
				why: `${commas(entry.impressions)} impressions over 28 days and zero clicks (average position ${entry.position}).`,
				probe: { kind: "page", key: entry.key },
				baseline: {
					kind: "page",
					key: entry.key,
					ctr: entry.ctr,
					impressions: entry.impressions,
					position: entry.position,
				},
				week,
				now: today,
				match: article ? "page" : null,
			}),
		});
	}

	// 3. Traffic without Google impressions: referrers that are not search.
	const blind = [...cfCurrent.values()]
		.filter((entry) => entry.visits >= BLIND_MIN_VISITS)
		.filter((entry) => articleByPath.has(entry.key))
		.filter((entry) => {
			const page = pageCurrent.get(entry.key);
			return !page || page.impressions === 0;
		})
		.sort((a, b) => b.visits - a.visits || a.key.localeCompare(b.key));
	for (const entry of blind.slice(0, MAX_WATCHLIST)) {
		const article = articleByPath.get(entry.key);
		candidates.push({
			priority: candidatePriority("blind"),
			sort: entry.visits,
			action: makeAction({
				type: "links",
				article,
				metrics: { visits: entry.visits, pageLoads: entry.pageLoads, impressions: 0 },
				why: `${commas(entry.visits)} visits from non-Google referrers and no Search Console impressions.`,
				probe: { kind: "page", key: entry.key },
				baseline: {
					kind: "page",
					key: entry.key,
					impressions: 0,
					clicks: 0,
					ctr: 0,
					visits: entry.visits,
					pageLoads: entry.pageLoads,
				},
				week,
				now: today,
				match: article ? "page" : null,
			}),
		});
	}

	// 4. Orphans: published articles with neither impressions nor page loads.
	const graceCutoff = addDays(today, -NEW_ARTICLE_DAYS);
	const orphans = articles.filter((article) => {
		if (article.date && article.date > graceCutoff) return false;
		const page = pageCurrent.get(article.path);
		const cloudflare = cfCurrent.get(article.path);
		return (!page || page.impressions === 0) && (!cloudflare || cloudflare.pageLoads === 0);
	});
	const rotatedOrphans = seededOrder(orphans, week).slice(0, MAX_WATCHLIST);
	for (const article of rotatedOrphans.slice(0, 2)) {
		candidates.push({
			priority: candidatePriority("links"),
			sort: 0,
			action: makeAction({
				type: "links",
				article,
				metrics: { impressions: 0, pageLoads: 0, visits: 0 },
				why: "No Google impressions and no page loads in 28 days; it is reachable only from its tag and topic pages.",
				probe: { kind: "page", key: article.path },
				baseline: { kind: "page", key: article.path, impressions: 0, clicks: 0, ctr: 0, visits: 0, pageLoads: 0 },
				week,
				now: today,
				match: "page",
			}),
		});
	}

	// 5. New articles, especially ones Google has not seen yet.
	const newArticles = articles
		.filter((article) => article.date && article.date > addDays(today, -NEW_ARTICLE_DAYS))
		.sort((a, b) => b.date.localeCompare(a.date) || a.path.localeCompare(b.path));
	// Two at most: a batch publish must not crowd every performance action out
	// of the queue. The watchlist still lists all new articles.
	const indexingCutoff = addDays(today, -INDEXING_MIN_AGE_DAYS);
	for (const article of newArticles.filter((entry) => entry.date <= indexingCutoff).slice(0, 2)) {
		const page = pageCurrent.get(article.path);
		if (page && page.impressions > 0) continue;
		candidates.push({
			priority: candidatePriority("indexing"),
			sort: newArticles.length,
			action: makeAction({
				type: "indexing",
				article,
				metrics: { impressions: 0, clicks: 0, ctr: 0, position: 0 },
				why: `Published ${String(article.date).slice(0, 10)}; no Search Console impressions yet.`,
				probe: { kind: "page", key: article.path },
				baseline: { kind: "page", key: article.path, impressions: 0, clicks: 0, ctr: 0 },
				week,
				now: today,
				match: "page",
			}),
		});
	}

	const ordered = dedupeActions(candidates).sort(
		(a, b) =>
			b.priority - a.priority ||
			b.sort - a.sort ||
			String(a.action.id).localeCompare(String(b.action.id)),
	);
	const actions = ordered.slice(0, MAX_ACTIONS).map((candidate) => candidate.action);

	const { followup, carried } = buildFollowUp({
		previous,
		now: today,
		queryCurrent,
		pageCurrent,
		cfCurrent,
	});
	const allActions = [...actions, ...carried].slice(0, MAX_ACTIONS + carried.length);

	const summary = {
		gsc: { ...summarizeGsc(queryCurrent), previous: summarizeGsc(queryPrior) },
		cf: { ...summarizeCloudflare(cfCurrent), previous: summarizeCloudflare(cfPriorTotals) },
	};

	const missingFromSitemap = sitemapUrls.length
		? articles.filter((article) => !sitemapUrls.includes(`${siteUrl}${article.path}`))
		: [];
	const health = {
		missingDates,
		latest: {
			gsc: latestDateFor(rows, "gsc"),
			cf: latestDateFor(rows, "cf"),
		},
		expected: { gsc: gscEnd, cf: cfEnd },
		weekOverWeek: weekOverWeek(rows, gscEnd),
		articles: articles.length,
		sitemapUrls: sitemapUrls.length,
		articlesInSitemap: sitemapUrls.length ? articles.length - missingFromSitemap.length : null,
		articlesMissingFromSitemapCount: missingFromSitemap.length,
		articlesMissingFromSitemap: missingFromSitemap
			.slice(0, MAX_WATCHLIST)
			.map((article) => article.path),
	};

	const findings = {
		strikingDistance: striking.slice(0, MAX_WATCHLIST).map((entry) => ({
			query: entry.key,
			impressions: entry.impressions,
			clicks: entry.clicks,
			ctr: entry.ctr,
			position: entry.position,
			expectedCtr: round(entry.expected, 4),
		})),
		zeroClick: zeroClick.slice(0, MAX_WATCHLIST).map((entry) => ({
			path: entry.key,
			impressions: entry.impressions,
			position: entry.position,
		})),
		trafficWithoutImpressions: blind.slice(0, MAX_WATCHLIST).map((entry) => ({
			path: entry.key,
			visits: entry.visits,
			pageLoads: entry.pageLoads,
		})),
		orphans: { count: orphans.length, examples: rotatedOrphans.map((article) => article.path) },
		newArticles: newArticles.slice(0, MAX_WATCHLIST).map((article) => ({
			path: article.path,
			date: article.date,
			impressions: pageCurrent.get(article.path)?.impressions || 0,
		})),
		health,
	};

	const report = {
		schemaVersion: SCHEMA_VERSION,
		generatedAt,
		week,
		site: siteUrl,
		windows: {
			gsc: { start: gscWindow.start, end: gscWindow.end, days: WINDOW_DAYS, previous: { start: gscPrior.start, end: gscPrior.end } },
			cf: { start: cfWindow.start, end: cfWindow.end, days: WINDOW_DAYS, previous: { start: cfPrior.start, end: cfPrior.end } },
		},
		summary,
		findings,
		actions: allActions,
		followup,
		policy: {
			allowed: [
				"frontmatter title",
				"frontmatter description",
				"frontmatter metaDescription",
				"frontmatter keywords",
				"frontmatter tags",
			],
			forbidden: [
				"article body text",
				"mantras, quotations, speaker labels, translations",
				"images",
				"category changes",
				"URL or permalink changes",
			],
			required: [
				"npm run og when a title changes, then commit images/og/",
				"npm run build:test",
				"one PR per report, at most 5 articles",
			],
			maxActionsPerWeek: MAX_ACTIONS,
		},
	};

	return { ...report, markdown: renderMarkdown(report) };
}

function latestDateFor(rows, source) {
	let latest = null;
	for (const row of rows) {
		if (row.source !== source) continue;
		if (!latest || row.date > latest) latest = row.date;
	}
	return latest;
}

function weekOverWeek(rows, end) {
	const currentStart = addDays(end, -6);
	const priorStart = addDays(end, -13);
	const priorEnd = addDays(end, -7);
	let currentClicks = 0;
	let priorClicks = 0;
	for (const row of rows) {
		if (row.source !== "gsc" || row.dataset !== "query") continue;
		if (row.date >= currentStart && row.date <= end) currentClicks += Number(row.clicks || 0);
		if (row.date >= priorStart && row.date <= priorEnd) priorClicks += Number(row.clicks || 0);
	}
	const drop = priorClicks >= WOW_MIN_CLICKS && currentClicks < priorClicks * 0.6;
	return {
		current: round(currentClicks, 2),
		previous: round(priorClicks, 2),
		drop,
	};
}

function renderMarkdown(report) {
	const lines = [];
	const { summary, findings, actions, followup, windows, policy, week } = report;
	lines.push(`# SEO report — week of ${report.generatedAt.slice(0, 10)} (${week})`);
	lines.push("");
	lines.push(
		`Window: Search Console ${windows.gsc.start}..${windows.gsc.end} · ` +
			`Cloudflare ${windows.cf.start}..${windows.cf.end}. ` +
			`Search Console data lags ${GSC_LAG_DAYS} days, Cloudflare ${CF_LAG_DAYS}.`,
	);
	lines.push("");
	lines.push("## Scorecard");
	lines.push("");
	lines.push("| Metric | Last 28 days | Previous 28 days | Change |");
	lines.push("|---|---:|---:|---:|");
	lines.push(
		`| Clicks | ${commas(summary.gsc.clicks)} | ${commas(summary.gsc.previous.clicks)} | ${deltaText(summary.gsc.clicks, summary.gsc.previous.clicks)} |`,
	);
	lines.push(
		`| Impressions | ${commas(summary.gsc.impressions)} | ${commas(summary.gsc.previous.impressions)} | ${deltaText(summary.gsc.impressions, summary.gsc.previous.impressions)} |`,
	);
	lines.push(
		`| CTR | ${percent(summary.gsc.ctr)} | ${percent(summary.gsc.previous.ctr)} | ${deltaText(summary.gsc.ctr, summary.gsc.previous.ctr)} |`,
	);
	lines.push(
		`| Average position | ${summary.gsc.position} | ${summary.gsc.previous.position} | ${deltaText(summary.gsc.position, summary.gsc.previous.position, true)} |`,
	);
	lines.push(
		`| Page loads (Cloudflare) | ${commas(summary.cf.pageLoads)} | ${commas(summary.cf.previous.pageLoads)} | ${deltaText(summary.cf.pageLoads, summary.cf.previous.pageLoads)} |`,
	);
	lines.push(
		`| Visits (Cloudflare) | ${commas(summary.cf.visits)} | ${commas(summary.cf.previous.visits)} | ${deltaText(summary.cf.visits, summary.cf.previous.visits)} |`,
	);
	lines.push("");
	lines.push("Small numbers: treat single-digit differences as noise. The 28-day comparison is the signal.");

	lines.push("");
	lines.push(`## Do this week${actions.length ? ` (${Math.min(actions.length, policy.maxActionsPerWeek)})` : ""}`);
	lines.push("");
	if (!actions.length) {
		lines.push("No action crosses the thresholds this week. That is a valid result.");
	} else {
		for (const [index, action] of actions.slice(0, policy.maxActionsPerWeek).entries()) {
			const target = action.source_file ? `\`${action.source_file}\`` : "no confident page match — review manually";
			lines.push(`${index + 1}. **${action.url || action.query}**${action.query ? ` — “${action.query}”` : ""}`);
			lines.push(`   ${action.why}`);
			lines.push(`   → ${describeChange(action)} · ${target}`);
			if (action.match === "text-match") lines.push("   (page matched by text, not by Search Console data — verify before editing)");
			lines.push("");
		}
	}

	lines.push("");
	lines.push("## Follow-up");
	lines.push("");
	if (!followup.length) {
		lines.push("No merged action is being measured yet.");
	} else {
		lines.push("| Action | Merged | Status | Now |");
		lines.push("|---|---|---|---:|");
		for (const entry of followup) {
			const now = entry.delta
				? entry.probe && entry.probe.kind === "query"
					? `${percent(entry.delta.ctr || 0)} CTR`
					: `${commas(entry.delta.impressions || 0)} impressions`
				: "—";
			lines.push(`| ${entry.url || entry.query || entry.id} | ${entry.merged || "—"} | ${entry.status} | ${now} |`);
		}
	}

	lines.push("");
	lines.push("## Watchlist");
	lines.push("");
	lines.push(
		`- Striking distance (positions 4–15, ≥${STRIKING_MIN_IMPRESSIONS} impressions): ${findings.strikingDistance.length} of the top 5 shown.`,
	);
	lines.push(
		`- Zero-click pages (≥${ZERO_CLICK_MIN_IMPRESSIONS} impressions): ${findings.zeroClick.length}.` +
			(findings.zeroClick.length ? ` First: \`${findings.zeroClick[0].path}\`.` : ""),
	);
	lines.push(
		`- Traffic without Google impressions (≥${BLIND_MIN_VISITS} visits): ${findings.trafficWithoutImpressions.length}.` +
			(findings.trafficWithoutImpressions.length ? ` First: \`${findings.trafficWithoutImpressions[0].path}\`.` : ""),
	);
	lines.push(
		`- Orphaned articles: ${commas(findings.orphans.count)} with no impressions and no page loads in 28 days.` +
			(findings.orphans.examples.length ? ` This week: ${findings.orphans.examples.slice(0, 3).map((path) => `\`${path}\``).join(" · ")}.` : ""),
	);
	if (findings.newArticles.length) {
		const unseen = findings.newArticles.filter((entry) => entry.impressions === 0).length;
		lines.push(`- New articles (last ${NEW_ARTICLE_DAYS} days): ${findings.newArticles.length}; ${unseen} not yet seen by Google.`);
	}

	lines.push("");
	lines.push("## Pipeline health");
	lines.push("");
	const health = findings.health;
	lines.push(`- Search Console data latest ${health.latest.gsc || "none"} (expected ${health.expected.gsc}).`);
	lines.push(`- Cloudflare data latest ${health.latest.cf || "none"} (expected ${health.expected.cf}).`);
	lines.push(`- Days without a raw object in the read window: ${health.missingDates.length}${health.missingDates.length ? ` (${health.missingDates.slice(0, 5).join(", ")})` : ""}.`);
	if (health.weekOverWeek.drop) {
		lines.push(
			`- Last 7 days: ${commas(health.weekOverWeek.current)} clicks vs ${commas(health.weekOverWeek.previous)} the week before — check indexing before treating it as a content problem.`,
		);
	}
	if (health.articlesInSitemap != null) {
		lines.push(
			`- Sitemap: ${commas(health.sitemapUrls)} URLs loaded; ${commas(health.articlesMissingFromSitemapCount)} of ${commas(health.articles)} articles not listed.`,
		);
		if (health.articlesMissingFromSitemap.length) {
			lines.push(`- Not in the sitemap: ${health.articlesMissingFromSitemap.map((path) => `\`${path}\``).join(" · ")}.`);
		}
	}

	lines.push("");
	lines.push("---");
	lines.push("");
	lines.push(`Action queue: \`${report.generatedAt.slice(0, 10)}.actions.json\`. Read the \`policy\` block before editing.`);
	lines.push("");
	return `${lines.join("\n")}\n`;
}

function describeChange(action) {
	if (action.type === "serp") return "rewrite title and/or description for this query";
	if (action.type === "links") return "add tags or keywords that connect it to related articles";
	if (action.type === "indexing") return "request indexing, then link it from a hub";
	return "review";
}

module.exports = {
	SCHEMA_VERSION,
	WINDOW_DAYS,
	GSC_LAG_DAYS,
	CF_LAG_DAYS,
	MAX_ACTIONS,
	expectedCtr,
	isoWeek,
	parseFrontmatter,
	pagePath,
	articleSlugFromPath,
	buildReport,
	renderMarkdown,
};
