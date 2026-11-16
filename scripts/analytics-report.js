#!/usr/bin/env node
"use strict";

// Weekly SEO report for jaikhyapaparampara.com.
//
//   npm run analytics:report                          # R2 -> a local report dir
//   npm run analytics:report -- --reports-dir DIR     # write into a reports checkout
//   npm run analytics:report -- --fixtures --store-dir .analytics/fixture-store
//
// The report is two files: a one-screen Markdown digest and a machine-readable
// action queue. They are committed to a private repository, never to this one
// and never to a public path. The script deliberately prints no traffic
// numbers: CI logs for a public repository must stay clean.
//
// Environment:
//   R2_ACCOUNT_ID / R2_BUCKET / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
//   ANALYTICS_SITE_URL   default https://jaikhyapaparampara.com

const fs = require("fs");
const path = require("path");

const { addDays, dateRange, toIsoDate } = require("../lib/analytics/dates.js");
const { parseJsonl } = require("../lib/analytics/jsonl.js");
const { createR2Store, createFileStore } = require("../lib/analytics/store.js");
const { parseSitemapUrls } = require("../lib/analytics/dashboard.js");
const { buildReport, parseFrontmatter } = require("../lib/analytics/report.js");
const { resolveConfig, isR2Configured } = require("./analytics-pull.js");

const RAW_PREFIX = "analytics/raw";
const READ_DAYS = 58;
const DEFAULT_SITE = "https://jaikhyapaparampara.com";

const USAGE = `Usage: node scripts/analytics-report.js [options]

  --now YYYY-MM-DD       report day (default: today, UTC)
  --end YYYY-MM-DD       last Search Console day (default: now minus 2)
  --store-dir PATH       read raw JSONL from a local directory
  --reports-dir PATH     private reports checkout; writes PATH/reports/
  --out PATH             local output directory (default .analytics/reports)
  --sitemap PATH         sitemap.xml used for the coverage check
  --sitemap-url URL      fetch the sitemap instead (default: live site)
  --quiet                suppress progress lines
  --help                 show this text`;

function parseArgs(argv) {
	const options = {
		now: "",
		end: "",
		storeDir: "",
		reportsDir: "",
		out: "",
		sitemap: "",
		sitemapUrl: "",
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
			case "--now":
				options.now = takeValue(arg);
				break;
			case "--end":
				options.end = takeValue(arg);
				break;
			case "--store-dir":
				options.storeDir = takeValue(arg);
				break;
			case "--reports-dir":
				options.reportsDir = takeValue(arg);
				break;
			case "--out":
				options.out = takeValue(arg);
				break;
			case "--sitemap":
				options.sitemap = takeValue(arg);
				break;
			case "--sitemap-url":
				options.sitemapUrl = takeValue(arg);
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
	for (const [name, value] of [
		["--now", options.now],
		["--end", options.end],
	]) {
		if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
			throw new Error(`${name} must be an ISO date (YYYY-MM-DD)`);
		}
	}
	return options;
}

function createStore({ options, config, cwd }) {
	if (options.storeDir) return createFileStore(path.resolve(cwd, options.storeDir));
	if (isR2Configured(config.r2)) return createR2Store(config.r2);
	throw new Error(
		"R2 is not configured (R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID) " +
			"and --store-dir was not given",
	);
}

function loadArticles(dir) {
	if (!fs.existsSync(dir)) throw new Error(`articles directory not found: ${dir}`);
	const names = fs
		.readdirSync(dir)
		.filter((name) => name.endsWith(".md"))
		.sort();
	const articles = [];
	for (const name of names) {
		const text = fs.readFileSync(path.join(dir, name), "utf8");
		const data = parseFrontmatter(text);
		const slug = name.replace(/\.md$/, "");
		articles.push({
			file: `articles/${name}`,
			slug,
			path: `/articles/${slug}/`,
			title: data.title || "",
			description: data.description || "",
			metaDescription: data.metaDescription || "",
			keywords: data.keywords || "",
			tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
			category: data.category || "",
			date: data.date || "",
		});
	}
	return articles;
}

async function readSitemap({ options, cwd, siteUrl, fetchImpl = fetch, log = () => {} }) {
	const candidates = [];
	if (options.sitemap) candidates.push(path.resolve(cwd, options.sitemap));
	candidates.push(path.resolve(cwd, "sitemap.xml"));
	for (const file of candidates) {
		try {
			return parseSitemapUrls(fs.readFileSync(file, "utf8"));
		} catch {
			// Try the next candidate.
		}
	}
	const url = options.sitemapUrl || `${siteUrl}/sitemap.xml`;
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 10000);
		try {
			const response = await fetchImpl(url, {
				signal: controller.signal,
				headers: { "user-agent": "jkp-analytics/1.0 (+https://jaikhyapaparampara.com/)" },
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const urls = parseSitemapUrls(await response.text());
			log(`sitemap: ${urls.length} URLs from ${url}`);
			return urls;
		} finally {
			clearTimeout(timer);
		}
	} catch (error) {
		log(`sitemap: skipped (${error.message})`);
		return [];
	}
}

function readPreviousReport(reportsDir, today) {
	if (!reportsDir) return null;
	const dir = path.join(path.resolve(reportsDir), "reports");
	if (!fs.existsSync(dir)) return null;
	const files = fs
		.readdirSync(dir)
		.filter((name) => name.endsWith(".actions.json"))
		.filter((name) => name.slice(0, 10) < today)
		.sort();
	if (!files.length) return null;
	const file = path.join(dir, files[files.length - 1]);
	try {
		return JSON.parse(fs.readFileSync(file, "utf8"));
	} catch (error) {
		throw new Error(`Could not read previous report ${file}: ${error.message}`);
	}
}

async function readRawRows({ store, dates, log = () => {} }) {
	const rows = [];
	const missingDates = [];
	for (const date of dates) {
		const text = await store.get(`${RAW_PREFIX}/${date}.jsonl`);
		if (text == null) {
			missingDates.push(date);
			continue;
		}
		rows.push(...parseJsonl(text));
	}
	log(`raw: ${rows.length} rows, ${missingDates.length} day(s) without an object`);
	return { rows, missingDates };
}

async function run(
	argv = process.argv.slice(2),
	{ env = process.env, cwd = process.cwd(), fetchImpl = fetch, log = console.log } = {},
) {
	const options = parseArgs(argv);
	if (options.help) {
		log(USAGE);
		return { help: true };
	}
	const note = options.quiet ? () => {} : log;
	const config = resolveConfig(env);
	const siteUrl = config.site || DEFAULT_SITE;
	const today = options.now || toIsoDate(new Date());
	const gscEnd = options.end || addDays(today, -2);
	const readDates = dateRange(addDays(gscEnd, -(READ_DAYS - 1)), addDays(today, -1));

	const store = createStore({ options, config, cwd });
	note(`store: ${store.kind === "file" ? path.relative(cwd, store.root) || store.root : `${store.endpoint}/${store.bucket}`}`);

	const { rows, missingDates } = await readRawRows({ store, dates: readDates, log: note });
	const articles = loadArticles(path.resolve(cwd, "articles"));
	const sitemapUrls = await readSitemap({
		options,
		cwd,
		siteUrl,
		fetchImpl,
		log: note,
	});
	const previous = readPreviousReport(options.reportsDir, today);

	const report = buildReport({
		rows,
		articles,
		sitemapUrls,
		previous,
		now: today,
		generatedAt: new Date().toISOString(),
		siteUrl,
		missingDates,
	});

	const outDir = options.reportsDir
		? path.join(path.resolve(cwd, options.reportsDir), "reports")
		: path.resolve(cwd, options.out || path.join(".analytics", "reports"));
	fs.mkdirSync(outDir, { recursive: true });

	const { markdown, ...json } = report;
	const markdownFile = path.join(outDir, `${today}.md`);
	const actionsFile = path.join(outDir, `${today}.actions.json`);
	fs.writeFileSync(markdownFile, markdown, "utf8");
	fs.writeFileSync(actionsFile, `${JSON.stringify(json, null, 2)}\n`, "utf8");

	note(
		`report: ${json.actions.length} action(s), ${json.followup.length} follow-up item(s) → ` +
			`${path.relative(cwd, markdownFile) || markdownFile}`,
	);
	return { report: json, markdownFile, actionsFile };
}

async function main() {
	const result = await run();
	if (result && result.markdownFile) {
		console.log(`analytics:report: wrote ${result.actionsFile}`);
	}
}

if (require.main === module) {
	main().catch((error) => {
		console.error(error.stack || error.message);
		process.exit(1);
	});
}

module.exports = { parseArgs, run, loadArticles, readPreviousReport, readRawRows };
