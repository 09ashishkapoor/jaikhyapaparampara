#!/usr/bin/env node
"use strict";

// Copy analytics/dashboard.json out of R2 into the local build input that the
// /stats/ page renders. Runs before `eleventy` in the build script.
//
// It is deliberately fail-open: a local build without R2 credentials, or a
// transient R2 outage, must never block a content deploy. The /stats/ page
// shows a clear "no data yet" state in that case. Pass --required to turn
// failures into a non-zero exit (the nightly workflow can use that).
//
//   npm run analytics:fetch
//   npm run analytics:fetch -- --required

const fs = require("fs");
const path = require("path");

const { createR2Store } = require("../lib/analytics/store.js");

const DASHBOARD_KEY = "analytics/dashboard.json";
const DEFAULT_OUT = path.join(".analytics", "dashboard.json");
const SCHEMA_VERSION = 1;

const USAGE = `Usage: node scripts/analytics-fetch.js [options]

  --out PATH     destination file (default ${DEFAULT_OUT})
  --required     exit non-zero when R2 is unconfigured, unreachable, or empty
  --help         show this text`;

function parseArgs(argv) {
	const options = { out: DEFAULT_OUT, required: false, help: false };
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--out") {
			options.out = argv[++index] || "";
			if (!options.out) throw new Error("--out needs a value");
		} else if (arg === "--required") {
			options.required = true;
		} else if (arg === "--help" || arg === "-h") {
			options.help = true;
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}
	return options;
}

function r2Config(env = process.env) {
	return {
		accountId: String(env.R2_ACCOUNT_ID || env.CF_ACCOUNT_ID || ""),
		bucket: String(env.R2_BUCKET || ""),
		accessKeyId: String(env.R2_ACCESS_KEY_ID || ""),
		secretAccessKey: String(env.R2_SECRET_ACCESS_KEY || ""),
		endpoint: String(env.R2_ENDPOINT || ""),
		sessionToken: String(env.R2_SESSION_TOKEN || ""),
	};
}

function isConfigured(config) {
	return Boolean(
		config.bucket && config.accessKeyId && config.secretAccessKey && (config.accountId || config.endpoint),
	);
}

function writeAtomic(file, text) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	const temporary = `${file}.tmp-${process.pid}`;
	fs.writeFileSync(temporary, text, "utf8");
	fs.renameSync(temporary, file);
}

async function main(
	argv = process.argv.slice(2),
	{ env = process.env, fetchImpl = fetch, cwd = process.cwd(), log = console.log } = {},
) {
	const options = parseArgs(argv);
	if (options.help) {
		log(USAGE);
		return { skipped: true };
	}
	const out = path.resolve(cwd, options.out);
	const config = r2Config(env);

	if (!isConfigured(config)) {
		const message =
			"analytics: skipped dashboard fetch — R2 credentials are not configured (R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).";
		if (options.required) throw new Error(message);
		log(message);
		return { skipped: true, reason: "unconfigured" };
	}

	let text;
	try {
		text = await createR2Store({ ...config, fetchImpl }).get(DASHBOARD_KEY);
	} catch (error) {
		if (options.required) throw error;
		log(`analytics: dashboard fetch failed, keeping the existing copy — ${error.message}`);
		return { skipped: true, reason: "error" };
	}

	if (text == null) {
		const message = `analytics: no ${DASHBOARD_KEY} in R2 yet — keeping the existing copy.`;
		if (options.required) throw new Error(message);
		log(message);
		return { skipped: true, reason: "missing" };
	}

	let dashboard;
	try {
		dashboard = JSON.parse(text);
	} catch {
		throw new Error(`analytics: ${DASHBOARD_KEY} is not valid JSON`);
	}
	if (!dashboard || dashboard.schemaVersion !== SCHEMA_VERSION) {
		throw new Error(
			`analytics: ${DASHBOARD_KEY} has an unsupported schemaVersion (expected ${SCHEMA_VERSION})`,
		);
	}

	let previous = "";
	try {
		previous = fs.readFileSync(out, "utf8");
	} catch {
		// First run: no local copy yet.
	}
	if (previous !== text) writeAtomic(out, text);

	const totals = dashboard.totals || {};
	log(
		`analytics: dashboard loaded (${dashboard.window ? `${dashboard.window.start}..${dashboard.window.end}` : "no window"}, ` +
			`${Number(totals.clicks || 0)} clicks, ${Number(totals.pageLoads || 0)} page loads) -> ${path.relative(cwd, out)}`,
	);
	return { dashboard, out };
}

if (require.main === module) {
	main().catch((error) => {
		console.error(error.stack || error.message);
		process.exit(1);
	});
}

module.exports = { parseArgs, r2Config, isConfigured, main };
