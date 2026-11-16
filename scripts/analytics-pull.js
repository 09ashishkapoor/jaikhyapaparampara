#!/usr/bin/env node
"use strict";

// Analytics ingestion for jaikhyapaparampara.com.
//
//   npm run analytics:pull                 # nightly: GSC + Cloudflare -> R2
//   npm run analytics:pull -- --dry-run    # print the plan, touch nothing
//   npm run analytics:fixtures             # offline demo from tests/fixtures
//
// Search Console came first (roadmap Item 3): it is the half the SEO decisions
// depend on and it is independent of the Cloudflare analytics switch.
//
// Design rules from the roadmap:
//   * always re-pull the last 7 days — late data is normal;
//   * upsert by (date, source, dataset), so re-running a day replaces it;
//   * store raw at daily grain so new questions need no re-ingestion;
//   * keep raw data out of the Eleventy build (written to R2 or .analytics/).
//
// Environment (GitHub Actions secrets unless noted):
//   GSC_SERVICE_ACCOUNT_JSON  service-account key JSON (or GSC_SERVICE_ACCOUNT_FILE)
//   GSC_SITE_URL              sc-domain:jaikhyapaparampara.com (default)
//   CF_API_TOKEN              token with Account Analytics: Read
//   CF_ACCOUNT_ID             account id
//   CF_RUM_SITE_TAG           32-char Web Analytics site tag (not the zone id)
//   R2_ACCOUNT_ID             Cloudflare account id
//   R2_BUCKET                 bucket name
//   R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
//   R2_ENDPOINT               optional custom endpoint
//   ANALYTICS_DAYS            pull window, default 7
//   ANALYTICS_DASHBOARD_DAYS  dashboard window, default 28

const fs = require("fs");
const path = require("path");

const { rollingWindow, windowEndingAt } = require("../lib/analytics/dates.js");
const { parseJsonl, encodeJsonl, mergeRows, groupRowsByDate } = require("../lib/analytics/jsonl.js");
const { createFileStore, createR2Store } = require("../lib/analytics/store.js");
const { buildDashboard, parseSitemapUrls } = require("../lib/analytics/dashboard.js");
const { pullSearchConsole, normalizeSearchAnalyticsRows } = require("../lib/analytics/gsc.js");
const { pullCloudflare, normalizePageLoadPayload } = require("../lib/analytics/cloudflare.js");

const RAW_PREFIX = "analytics/raw";
const DASHBOARD_KEY = "analytics/dashboard.json";
const DEFAULT_SITE = "https://jaikhyapaparampara.com";
const DEFAULT_DAYS = 7;
const DEFAULT_DASHBOARD_DAYS = 28;
const GSC_LAG_DAYS = 2;
const CF_LAG_DAYS = 1;

const USAGE = `Usage: node scripts/analytics-pull.js [options]

  --days N               pull window in days (default ${DEFAULT_DAYS})
  --end YYYY-MM-DD       last day to pull (default: today minus the source lag)
  --dashboard-days N     dashboard window in days (default ${DEFAULT_DASHBOARD_DAYS})
  --source all|gsc|cf    source selection (default all)
  --local                write to a local directory instead of R2
  --store-dir PATH       local store root (implies --local)
  --dashboard-out PATH   local dashboard.json path (default .analytics/dashboard.json)
  --fixtures DIR         run offline against raw API fixtures in DIR
  --sitemap PATH         sitemap.xml for orphan detection (default ./sitemap.xml)
  --dry-run              print the resolved plan without network or writes
  --quiet                only print the final summary
  --help                 show this text`;

function parseArgs(argv) {
	const options = {
		days: 0,
		end: "",
		dashboardDays: 0,
		source: "all",
		local: false,
		storeDir: "",
		dashboardOut: "",
		fixtures: "",
		sitemap: "",
		dryRun: false,
		quiet: false,
		help: false,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		const takeValue = (name) => {
			const value = argv[index + 1];
			if (value == null || value.startsWith("--")) throw new Error(`${name} needs a value`);
			index += 1;
			return value;
		};
		switch (arg) {
			case "--days":
				options.days = Number(takeValue(arg));
				break;
			case "--end":
				options.end = takeValue(arg);
				break;
			case "--dashboard-days":
				options.dashboardDays = Number(takeValue(arg));
				break;
			case "--source":
				options.source = takeValue(arg);
				break;
			case "--local":
				options.local = true;
				break;
			case "--store-dir":
				options.storeDir = takeValue(arg);
				break;
			case "--dashboard-out":
				options.dashboardOut = takeValue(arg);
				break;
			case "--fixtures":
				options.fixtures = takeValue(arg);
				break;
			case "--sitemap":
				options.sitemap = takeValue(arg);
				break;
			case "--dry-run":
				options.dryRun = true;
				break;
			case "--quiet":
				options.quiet = true;
				break;
			case "--help":
			case "-h":
				options.help = true;
				break;
			default:
				throw new Error(`Unknown argument: ${arg}`);
		}
	}
	if (!["all", "gsc", "cf"].includes(options.source)) {
		throw new Error(`--source must be all, gsc, or cf (got "${options.source}")`);
	}
	for (const [name, value] of [
		["--days", options.days],
		["--dashboard-days", options.dashboardDays],
	]) {
		if (value !== 0 && (!Number.isInteger(value) || value < 1)) {
			throw new Error(`${name} must be a positive integer`);
		}
	}
	return options;
}

function positiveInteger(value, fallback, label) {
	if (value == null || value === "") return fallback;
	const number = Number(value);
	if (!Number.isInteger(number) || number < 1) {
		throw new Error(`${label} must be a positive integer, got "${value}"`);
	}
	return number;
}

function resolveConfig(env = process.env) {
	const serviceAccountJson = String(env.GSC_SERVICE_ACCOUNT_JSON || "").trim();
	const serviceAccountFile = String(env.GSC_SERVICE_ACCOUNT_FILE || "").trim();
	let serviceAccount = serviceAccountJson;
	if (!serviceAccount && serviceAccountFile) {
		const file = path.resolve(serviceAccountFile);
		if (!fs.existsSync(file)) {
			throw new Error(`GSC_SERVICE_ACCOUNT_FILE does not exist: ${file}`);
		}
		serviceAccount = fs.readFileSync(file, "utf8");
	}
	return {
		site: String(env.ANALYTICS_SITE_URL || DEFAULT_SITE).replace(/\/+$/, ""),
		sitemapUrl: String(env.ANALYTICS_SITEMAP_URL || "").trim(),
		days: positiveInteger(env.ANALYTICS_DAYS, DEFAULT_DAYS, "ANALYTICS_DAYS"),
		dashboardDays: positiveInteger(
			env.ANALYTICS_DASHBOARD_DAYS,
			DEFAULT_DASHBOARD_DAYS,
			"ANALYTICS_DASHBOARD_DAYS",
		),
		gsc: {
			siteUrl: String(env.GSC_SITE_URL || "sc-domain:jaikhyapaparampara.com"),
			serviceAccount,
		},
		cf: {
			accountId: String(env.CF_ACCOUNT_ID || ""),
			apiToken: String(env.CF_API_TOKEN || ""),
			siteTag: String(env.CF_RUM_SITE_TAG || ""),
		},
		r2: {
			accountId: String(env.R2_ACCOUNT_ID || env.CF_ACCOUNT_ID || ""),
			bucket: String(env.R2_BUCKET || ""),
			accessKeyId: String(env.R2_ACCESS_KEY_ID || ""),
			secretAccessKey: String(env.R2_SECRET_ACCESS_KEY || ""),
			endpoint: String(env.R2_ENDPOINT || ""),
			sessionToken: String(env.R2_SESSION_TOKEN || ""),
		},
	};
}

function isR2Configured(r2) {
	return Boolean(
		r2.bucket && r2.accessKeyId && r2.secretAccessKey && (r2.accountId || r2.endpoint),
	);
}

function createStore({ options, config, cwd, log = () => {} }) {
	const useFile = options.local || options.storeDir || options.fixtures || !isR2Configured(config.r2);
	if (!useFile) return createR2Store(config.r2);
	const root = options.storeDir
		? path.resolve(cwd, options.storeDir)
		: path.join(cwd, ".analytics", "store");
	if (!options.fixtures && !options.quiet) {
		log(`analytics: R2 is not configured — writing to ${path.relative(cwd, root) || root}`);
	}
	return createFileStore(root);
}

// Orphan detection needs the published URL list. Prefer an explicit file, then
// the fixture sitemap, then a local build, then the live sitemap: a fresh CI
// checkout has no `sitemap.xml` because it is a gitignored build artifact.
async function readSitemapUrls({
	options,
	cwd,
	fixtures = "",
	sitemapUrl = "",
	fetchImpl = fetch,
	log = () => {},
}) {
	const candidates = [];
	if (options.sitemap) candidates.push(path.resolve(cwd, options.sitemap));
	if (fixtures) candidates.push(path.join(path.resolve(fixtures), "sitemap.xml"));
	candidates.push(path.resolve(cwd, "sitemap.xml"));
	for (const file of candidates) {
		try {
			return parseSitemapUrls(fs.readFileSync(file, "utf8"));
		} catch {
			// Try the next candidate.
		}
	}
	if (!sitemapUrl) return [];
	try {
		const response = await fetchImpl(sitemapUrl, {
			headers: { "user-agent": "jkp-analytics/1.0 (+https://jaikhyapaparampara.com/)" },
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const urls = parseSitemapUrls(await response.text());
		log(`sitemap: ${urls.length} URLs from ${sitemapUrl}`);
		return urls;
	} catch (error) {
		log(`sitemap: could not load ${sitemapUrl} — orphan analysis skipped (${error.message})`);
		return [];
	}
}

function loadFixtures(dir) {
	const root = path.resolve(dir);
	const readJson = (name) => {
		const file = path.join(root, name);
		if (!fs.existsSync(file)) throw new Error(`Missing fixture: ${file}`);
		return JSON.parse(fs.readFileSync(file, "utf8"));
	};
	return {
		gscQuery: readJson("gsc-query.json"),
		gscPage: readJson("gsc-page.json"),
		cfPageLoads: readJson("cf-pageloads.json"),
	};
}

function fixtureRows(fixtures) {
	return [
		...normalizeSearchAnalyticsRows({ rows: fixtures.gscQuery.rows || [], dataset: "query" }),
		...normalizeSearchAnalyticsRows({ rows: fixtures.gscPage.rows || [], dataset: "page" }),
		...normalizePageLoadPayload(fixtures.cfPageLoads),
	];
}

function fixtureResults({ rows, window }) {
	return [
		{
			source: "gsc",
			datasets: ["query", "page"],
			rows: rows.filter((row) => row.source === "gsc"),
			window,
		},
		{
			source: "cf",
			datasets: ["pageloads"],
			rows: rows.filter((row) => row.source === "cf"),
			window,
		},
	];
}

async function networkResults({ options, config, now, fetchImpl, log }) {
	const days = options.days || config.days;
	const results = [];
	const wantsGsc = options.source === "all" || options.source === "gsc";
	const wantsCf = options.source === "all" || options.source === "cf";

	if (wantsGsc) {
		if (!config.gsc.serviceAccount) {
			if (options.source === "gsc") {
				throw new Error(
					"Search Console is not configured: set GSC_SERVICE_ACCOUNT_JSON (or GSC_SERVICE_ACCOUNT_FILE)",
				);
			}
			log("gsc: skipped — no service account configured");
		} else {
			const window = options.end
				? windowEndingAt(options.end, days)
				: rollingWindow({ now, days, lagDays: GSC_LAG_DAYS });
			const result = await pullSearchConsole({
				serviceAccount: config.gsc.serviceAccount,
				siteUrl: config.gsc.siteUrl,
				startDate: window.start,
				endDate: window.end,
				fetchImpl,
				now,
				log,
			});
			results.push({ ...result, window });
		}
	}

	if (wantsCf) {
		if (!config.cf.accountId || !config.cf.apiToken || !config.cf.siteTag) {
			if (options.source === "cf") {
				throw new Error(
					"Cloudflare Web Analytics is not configured: set CF_ACCOUNT_ID, CF_API_TOKEN, and CF_RUM_SITE_TAG",
				);
			}
			log("cf: skipped — Cloudflare credentials are not set");
		} else {
			const window = options.end
				? windowEndingAt(options.end, days)
				: rollingWindow({ now, days, lagDays: CF_LAG_DAYS });
			const result = await pullCloudflare({
				accountId: config.cf.accountId,
				siteTag: config.cf.siteTag,
				apiToken: config.cf.apiToken,
				startDate: window.start,
				endDate: window.end,
				fetchImpl,
				log,
			});
			results.push({ ...result, window });
		}
	}

	if (results.length === 0) {
		throw new Error(
			"No analytics source is configured. Set GSC_* and/or CF_* variables, or use --fixtures for an offline run.",
		);
	}
	return results;
}

// Write one JSONL object per date. Rows for every (source, dataset) that was
// queried on that date are replaced, even when the new response has zero rows,
// so an analytics API that drops a row cannot leave stale data behind. All
// sources are merged first so each date costs exactly one read and one write.
async function writeRows({ store, results, log = () => {} }) {
	const byDate = new Map();
	for (const result of results) {
		const rowsByDate = groupRowsByDate(result.rows);
		const dates = new Set(result.window.dates);
		for (const date of rowsByDate.keys()) dates.add(date);
		for (const date of dates) {
			if (!byDate.has(date)) byDate.set(date, { rows: [], groups: new Set() });
			const entry = byDate.get(date);
			entry.rows.push(...(rowsByDate.get(date) || []));
			for (const dataset of result.datasets) {
				entry.groups.add(`${result.source}|${dataset}|${date}`);
			}
		}
	}

	let writes = 0;
	for (const date of [...byDate.keys()].sort()) {
		const key = `${RAW_PREFIX}/${date}.jsonl`;
		const previous = (await store.get(key)) || "";
		const existingRows = previous ? parseJsonl(previous) : [];
		const entry = byDate.get(date);
		const merged = mergeRows(existingRows, entry.rows, [...entry.groups]);
		const next = encodeJsonl(merged);
		if (next === previous) continue;
		await store.put(key, next);
		writes += 1;
	}
	log(`store: ${writes} object(s) written`);
	return writes;
}

async function aggregate({
	store,
	window,
	generatedAt,
	siteUrl,
	sitemapUrls,
	demo,
	dashboardOut,
	log = () => {},
}) {
	const rows = [];
	let missing = 0;
	for (const date of window.dates) {
		const text = await store.get(`${RAW_PREFIX}/${date}.jsonl`);
		if (text == null) {
			missing += 1;
			continue;
		}
		rows.push(...parseJsonl(text));
	}
	const dashboard = buildDashboard({
		rows,
		window,
		generatedAt,
		siteUrl,
		sitemapUrls,
		demo,
	});
	const json = `${JSON.stringify(dashboard, null, 2)}\n`;
	await store.put(DASHBOARD_KEY, json);
	const outFile = path.resolve(dashboardOut);
	fs.mkdirSync(path.dirname(outFile), { recursive: true });
	const temporary = `${outFile}.tmp-${process.pid}`;
	fs.writeFileSync(temporary, json, "utf8");
	fs.renameSync(temporary, outFile);
	log(
		`dashboard: ${dashboard.window.start}..${dashboard.window.end}, ` +
			`${dashboard.totals.clicks} clicks · ${dashboard.totals.impressions} impressions · ` +
			`${dashboard.totals.pageLoads} page loads (${missing} day(s) without raw data)`,
	);
	return dashboard;
}

async function run(
	argv = process.argv.slice(2),
	{ env = process.env, now = new Date(), fetchImpl = fetch, cwd = process.cwd(), log = console.log } = {},
) {
	const options = parseArgs(argv);
	if (options.help) {
		log(USAGE);
		return { help: true };
	}
	const config = resolveConfig(env);
	const note = options.quiet ? () => {} : log;
	const store = createStore({ options, config, cwd, log: note });

	const plan = {
		store: store.kind,
		storeRoot: store.kind === "file" ? store.root : `${store.endpoint}/${store.bucket}`,
		source: options.source,
		fixtures: options.fixtures ? path.resolve(options.fixtures) : null,
		days: options.days || config.days,
		dashboardDays: options.dashboardDays || config.dashboardDays,
		end: options.end || null,
	};

	if (options.dryRun) {
		const lines = [
			"analytics plan (dry run — nothing fetched or written)",
			`  store:          ${plan.store} ${plan.storeRoot}`,
			`  source:         ${plan.source}`,
			`  pull window:    ${options.end || `today-${GSC_LAG_DAYS} (gsc) / today-${CF_LAG_DAYS} (cf)`}, ${plan.days} days`,
			`  dashboard:      ${plan.dashboardDays} days`,
			`  fixtures:       ${plan.fixtures || "no (live APIs)"}`,
		];
		log(lines.join("\n"));
		return { dryRun: true, plan };
	}

	let results;
	if (options.fixtures) {
		const fixtures = loadFixtures(options.fixtures);
		const rows = fixtureRows(fixtures);
		const lastDate = rows
			.map((row) => row.date)
			.sort()
			.pop();
		if (!lastDate) throw new Error(`Fixtures in ${options.fixtures} contain no dated rows`);
		const end = options.end || lastDate;
		const window = windowEndingAt(end, plan.days);
		results = fixtureResults({ rows, window });
		log(`fixtures: ${rows.length} rows, window ${window.start}..${window.end}`);
	} else {
		results = await networkResults({ options, config, now, fetchImpl, log: note });
	}

	const writes = await writeRows({ store, results, log: note });

	// The dashboard window ends at the earliest source end, not the latest:
	// Search Console settles two days behind Cloudflare, so ending at the
	// Cloudflare day would paint the newest column as a false zero-clicks drop.
	const dashboardEnd = results.map((result) => result.window.end).sort()[0];
	const dashboardWindow = windowEndingAt(dashboardEnd, plan.dashboardDays);
	const dashboard = await aggregate({
		store,
		window: dashboardWindow,
		generatedAt: now.toISOString(),
		siteUrl: config.site,
		sitemapUrls: await readSitemapUrls({
			options,
			cwd,
			fixtures: options.fixtures,
			sitemapUrl: config.sitemapUrl || `${config.site}/sitemap.xml`,
			fetchImpl,
			log: note,
		}),
		demo: Boolean(options.fixtures),
		dashboardOut: options.dashboardOut
			? path.resolve(cwd, options.dashboardOut)
			: path.join(cwd, ".analytics", "dashboard.json"),
		log: note,
	});

	return { writes, dashboard };
}

async function main() {
	const result = await run();
	if (result && result.dashboard) {
		console.log(
			`analytics: done — ${result.writes} raw object write(s), dashboard ${result.dashboard.window.days} days.`,
		);
	}
}

if (require.main === module) {
	main().catch((error) => {
		console.error(error.stack || error.message);
		process.exit(1);
	});
}

module.exports = {
	parseArgs,
	resolveConfig,
	createStore,
	isR2Configured,
	readSitemapUrls,
	writeRows,
	aggregate,
	run,
};
