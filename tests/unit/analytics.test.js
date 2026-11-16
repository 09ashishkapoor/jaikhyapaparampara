"use strict";

// Unit tests for the analytics pipeline. Run with:
//   npm run test:analytics        (node --test, no browser required)
// Playwright ignores this directory (see testIgnore in playwright.config.js).

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const dates = require("../../lib/analytics/dates.js");
const jsonl = require("../../lib/analytics/jsonl.js");
const sigv4 = require("../../lib/analytics/sigv4.js");
const gsc = require("../../lib/analytics/gsc.js");
const cloudflare = require("../../lib/analytics/cloudflare.js");
const { buildDashboard, parseSitemapUrls } = require("../../lib/analytics/dashboard.js");
const { createFileStore, createR2Store } = require("../../lib/analytics/store.js");
const pull = require("../../scripts/analytics-pull.js");

test("rolling windows are inclusive, lag-aware, and chunked under the Cloudflare limit", () => {
	const window = dates.rollingWindow({
		now: new Date("2026-11-15T12:00:00Z"),
		days: 7,
		lagDays: 2,
	});
	assert.equal(window.end, "2026-11-13");
	assert.equal(window.start, "2026-11-07");
	assert.equal(window.dates.length, 7);
	assert.deepEqual(window.dates, [
		"2026-11-07",
		"2026-11-08",
		"2026-11-09",
		"2026-11-10",
		"2026-11-11",
		"2026-11-12",
		"2026-11-13",
	]);

	assert.deepEqual(
		dates.chunkRange("2026-11-01", "2026-11-20", 7).map((chunk) => [chunk.start, chunk.end]),
		[
			["2026-11-01", "2026-11-07"],
			["2026-11-08", "2026-11-14"],
			["2026-11-15", "2026-11-20"],
		],
	);
	assert.throws(() => dates.assertIsoDate("2026-13-01"), /ISO date/);
	assert.throws(() => dates.windowEndingAt("2026-11-10", 0), /positive integer/);
});

test("mergeRows replaces a re-pulled group and can clear a group with zero rows", () => {
	const existing = [
		{ source: "gsc", dataset: "query", date: "2026-11-10", query: "a", clicks: 1 },
		{ source: "gsc", dataset: "page", date: "2026-11-10", page: "https://x/a/", clicks: 1 },
		{ source: "cf", dataset: "pageloads", date: "2026-11-10", path: "/a/", pageLoads: 3 },
		{ source: "gsc", dataset: "query", date: "2026-11-11", query: "b", clicks: 2 },
	];

	const merged = jsonl.mergeRows(existing, [
		{ source: "gsc", dataset: "query", date: "2026-11-10", query: "a", clicks: 9 },
	], ["gsc|query|2026-11-10"]);

	assert.equal(merged.length, 4);
	assert.equal(
		merged.find((row) => row.source === "gsc" && row.dataset === "query" && row.date === "2026-11-10").clicks,
		9,
	);
	assert.ok(merged.some((row) => row.dataset === "page" && row.date === "2026-11-10"));
	assert.ok(merged.some((row) => row.dataset === "query" && row.date === "2026-11-11"));

	const cleared = jsonl.mergeRows(existing, [], ["gsc|query|2026-11-10"]);
	assert.equal(
		cleared.filter((row) => row.dataset === "query" && row.date === "2026-11-10").length,
		0,
	);
	assert.deepEqual(jsonl.parseJsonl(jsonl.encodeJsonl(merged)), merged);
	assert.throws(() => jsonl.parseJsonl("{not json}"), /Invalid JSONL at line 1/);
});

test("buildJwt signs a verifiable RS256 assertion with the Search Console scope", () => {
	const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
	const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
	const now = new Date("2026-11-15T00:00:00Z");
	const jwt = gsc.buildJwt({
		serviceAccount: { clientEmail: "svc@example.iam.gserviceaccount.com", privateKey: pem },
		now,
	});
	const [header, claims, signature] = jwt.split(".");
	assert.equal(jwt.split(".").length, 3);

	const decodedHeader = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
	const decodedClaims = JSON.parse(Buffer.from(claims, "base64url").toString("utf8"));
	assert.equal(decodedHeader.alg, "RS256");
	assert.equal(decodedHeader.typ, "JWT");
	assert.equal(decodedClaims.iss, "svc@example.iam.gserviceaccount.com");
	assert.equal(decodedClaims.scope, gsc.SCOPE);
	assert.equal(decodedClaims.aud, gsc.TOKEN_URL);
	assert.equal(decodedClaims.exp - decodedClaims.iat, 3600);

	assert.equal(
		crypto.verify(
			"RSA-SHA256",
			Buffer.from(`${header}.${claims}`),
			publicKey,
			Buffer.from(signature, "base64url"),
		),
		true,
	);
});

test("Search Console requests ask for a daily grain and normalise to flat rows", () => {
	const request = gsc.buildSearchAnalyticsRequest({
		siteUrl: "sc-domain:jaikhyapaparampara.com",
		startDate: "2026-11-08",
		endDate: "2026-11-14",
		dataset: "query",
	});
	assert.deepEqual(request.body.dimensions, ["date", "query"]);
	assert.equal(request.body.rowLimit, 25000);
	assert.equal(request.body.startRow, 0);
	assert.ok(request.url.includes("sc-domain%3Ajaikhyapaparampara.com"));
	assert.ok(request.url.endsWith("/searchAnalytics/query"));

	const rows = gsc.normalizeSearchAnalyticsRows({
		dataset: "query",
		rows: [
			{ keys: ["2026-11-08", "kali mantra"], clicks: 2, impressions: 100, ctr: 0.02, position: 11.5 },
			{ keys: ["2026-11-08", ""], clicks: 1, impressions: 1, ctr: 1, position: 1 },
		],
	});
	assert.equal(rows.length, 1);
	assert.deepEqual(rows[0], {
		source: "gsc",
		dataset: "query",
		date: "2026-11-08",
		query: "kali mantra",
		clicks: 2,
		impressions: 100,
		ctr: 0.02,
		position: 11.5,
	});

	const pageRequest = gsc.buildSearchAnalyticsRequest({
		siteUrl: "https://jaikhyapaparampara.com/",
		startDate: "2026-11-08",
		endDate: "2026-11-14",
		dataset: "page",
	});
	assert.deepEqual(pageRequest.body.dimensions, ["date", "page"]);

	assert.throws(() => gsc.assertSiteUrl("example.com"), /sc-domain/);
	assert.throws(() => gsc.parseServiceAccount("not json"), /valid JSON/);
});

test("Cloudflare page-load query carries the required daily dimensions", async () => {
	const accountId = "a".repeat(32);
	const siteTag = "b".repeat(32);
	const request = cloudflare.buildPageLoadRequest({
		accountId,
		siteTag,
		startDate: "2026-11-08",
		endDate: "2026-11-14",
	});
	for (const dimension of cloudflare.DIMENSIONS) {
		assert.ok(request.query.includes(dimension), `query should include ${dimension}`);
	}
	assert.ok(request.query.includes("bot: 0"));
	assert.deepEqual(request.variables, {
		account: accountId,
		site: siteTag,
		from: "2026-11-08",
		to: "2026-11-14",
	});

	const rows = cloudflare.normalizePageLoadPayload({
		data: {
			viewer: {
				accounts: [
					{
						rumPageloadEventsAdaptiveGroups: [
							{
								count: 8,
								sum: { visits: 6 },
								avg: { sampleInterval: 1.5 },
								dimensions: {
									date: "2026-11-08",
									requestPath: "/articles/x/",
									refererHost: "google.com",
									countryName: "India",
									deviceType: "mobile",
								},
							},
						],
					},
				],
			},
		},
	});
	assert.equal(rows.length, 1);
	assert.equal(rows[0].source, "cf");
	assert.equal(rows[0].dataset, "pageloads");
	assert.equal(rows[0].pageLoads, 8);
	assert.equal(rows[0].visits, 6);
	assert.equal(rows[0].sampleInterval, 1.5);
	assert.equal(rows[0].refererHost, "google.com");
	assert.equal(rows[0].device, "mobile");

	assert.throws(
		() => cloudflare.normalizePageLoadPayload({ errors: [{ message: "permission denied" }] }),
		/permission denied/,
	);
});

test("SigV4 signer matches AWS's published get-vanilla conformance vector", () => {
	const signed = sigv4.signRequest({
		method: "GET",
		url: "https://example.amazonaws.com/",
		accessKeyId: "AKIDEXAMPLE",
		secretAccessKey: "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
		region: "us-east-1",
		service: "service",
		now: new Date("2015-08-30T12:36:00Z"),
		includeContentSha256: false,
	});
	assert.equal(
		signed.signature,
		"5fa00fa31553b73ebf1942676e86291e8372ff2a2260956d9b8aae1d763fbf31",
	);
	assert.equal(
		signed.headers.authorization,
		"AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/service/aws4_request, SignedHeaders=host;x-amz-date, Signature=5fa00fa31553b73ebf1942676e86291e8372ff2a2260956d9b8aae1d763fbf31",
	);
});

test("dashboard joins Search Console pages with Cloudflare paths and finds gaps", () => {
	const window = dates.windowEndingAt("2026-11-10", 2);
	const dashboard = buildDashboard({
		rows: [
			{ source: "gsc", dataset: "query", date: "2026-11-09", query: "kali", clicks: 2, impressions: 100, ctr: 0.02, position: 10 },
			{ source: "gsc", dataset: "query", date: "2026-11-10", query: "kali", clicks: 1, impressions: 50, ctr: 0.02, position: 20 },
			{ source: "gsc", dataset: "page", date: "2026-11-09", page: "https://jaikhyapaparampara.com/articles/a/", clicks: 2, impressions: 100, ctr: 0.02, position: 10 },
			{ source: "gsc", dataset: "page", date: "2026-11-10", page: "https://jaikhyapaparampara.com/articles/a/", clicks: 1, impressions: 50, ctr: 0.02, position: 20 },
			{ source: "cf", dataset: "pageloads", date: "2026-11-09", path: "/articles/a/", pageLoads: 10, visits: 7 },
			{ source: "cf", dataset: "pageloads", date: "2026-11-10", path: "/articles/direct/", pageLoads: 4, visits: 3 },
		],
		window,
		generatedAt: "2026-11-11T00:00:00.000Z",
		sitemapUrls: [
			"https://jaikhyapaparampara.com/articles/a/",
			"https://jaikhyapaparampara.com/articles/direct/",
			"https://jaikhyapaparampara.com/articles/orphan/",
		],
	});

	assert.equal(dashboard.schemaVersion, 1);
	assert.equal(dashboard.totals.clicks, 3);
	assert.equal(dashboard.totals.impressions, 150);
	assert.equal(dashboard.totals.ctr, 0.02);
	assert.equal(dashboard.totals.position, 13.33);
	assert.equal(dashboard.totals.pageLoads, 14);
	assert.equal(dashboard.totals.visits, 10);

	const page = dashboard.topPages.find((row) => row.path === "/articles/a/");
	assert.equal(page.clicks, 3);
	assert.equal(page.pageLoads, 10);
	assert.equal(page.ctr, 0.02);

	assert.equal(dashboard.gaps.trafficNoImpressions.length, 1);
	assert.equal(dashboard.gaps.trafficNoImpressions[0].path, "/articles/direct/");
	assert.equal(dashboard.coverage.orphans.count, 1);
	assert.deepEqual(dashboard.coverage.orphans.examples, ["/articles/orphan/"]);
	assert.equal(dashboard.daily.length, 2);
	assert.deepEqual(dashboard.daily.map((day) => day.date), ["2026-11-09", "2026-11-10"]);
	assert.deepEqual(parseSitemapUrls("<urlset><url><loc> https://x/a/ </loc></url></urlset>"), [
		"https://x/a/",
	]);
});

test("sitemap lookup falls back to the live sitemap when no local build exists", async () => {
	const urls = await pull.readSitemapUrls({
		options: { sitemap: "" },
		cwd: path.join(os.tmpdir(), "jkp-no-such-build"),
		fixtures: "",
		sitemapUrl: "https://jaikhyapaparampara.com/sitemap.xml",
		fetchImpl: async () =>
			new Response(
				'<urlset><url><loc>https://jaikhyapaparampara.com/a/</loc></url><url><loc>https://jaikhyapaparampara.com/b/</loc></url></urlset>',
			),
		log: () => {},
	});
	assert.deepEqual(urls, [
		"https://jaikhyapaparampara.com/a/",
		"https://jaikhyapaparampara.com/b/",
	]);

	const empty = await pull.readSitemapUrls({
		options: { sitemap: "" },
		cwd: path.join(os.tmpdir(), "jkp-no-such-build"),
		sitemapUrl: "https://jaikhyapaparampara.com/sitemap.xml",
		fetchImpl: async () => new Response("nope", { status: 500 }),
		log: () => {},
	});
	assert.deepEqual(empty, []);
});

test("file store round-trips and rejects keys outside its root", async () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "jkp-store-"));
	const store = createFileStore(root);
	assert.equal(await store.get("analytics/raw/2026-11-14.jsonl"), null);
	await store.put("analytics/raw/2026-11-14.jsonl", '{"a":1}\n');
	assert.equal(await store.get("analytics/raw/2026-11-14.jsonl"), '{"a":1}\n');
	await assert.rejects(() => store.get("../escape.jsonl"), /Refusing to escape/);
	fs.rmSync(root, { recursive: true, force: true });
});

test("R2 store signs GET and PUT with the auto/s3 scope and treats 404 as absent", async () => {
	const calls = [];
	const fetchImpl = async (url, init) => {
		calls.push({ url, init });
		return new Response(init.method === "GET" ? "" : "", {
			status: init.method === "GET" ? 404 : 200,
		});
	};
	const store = createR2Store({
		accountId: "a".repeat(32),
		bucket: "jkp-analytics",
		accessKeyId: "R2KEY",
		secretAccessKey: "R2SECRET",
		fetchImpl,
	});

	assert.equal(await store.get("analytics/raw/2026-11-14.jsonl"), null);
	assert.equal(
		calls[0].url,
		`https://${"a".repeat(32)}.r2.cloudflarestorage.com/jkp-analytics/analytics/raw/2026-11-14.jsonl`,
	);
	assert.match(calls[0].init.headers.authorization, /^AWS4-HMAC-SHA256 Credential=R2KEY\//);
	assert.match(calls[0].init.headers.authorization, /\/auto\/s3\/aws4_request/);
	assert.equal(calls[0].init.headers["x-amz-content-sha256"].length, 64);

	await store.put("analytics/dashboard.json", '{"schemaVersion":1}\n');
	assert.equal(calls[1].init.method, "PUT");
	assert.equal(calls[1].init.headers["content-type"], "application/json; charset=utf-8");
	assert.match(calls[1].init.headers.authorization, /SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date/);
});

test("fixture pull writes canonical raw JSONL, is idempotent, and marks the dashboard demo", async () => {
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "jkp-pull-"));
	const out = path.join(tmp, "dashboard.json");
	const argv = [
		"--fixtures",
		path.join(__dirname, "..", "fixtures", "analytics"),
		"--store-dir",
		path.join(tmp, "store"),
		"--dashboard-out",
		out,
		"--dashboard-days",
		"7",
		"--quiet",
	];

	const first = await pull.run(argv, {
		now: new Date("2026-11-15T06:00:00Z"),
		cwd: tmp,
		log: () => {},
	});
	assert.equal(first.writes, 7);
	assert.equal(first.dashboard.demo, true);
	assert.equal(first.dashboard.window.start, "2026-11-08");
	assert.equal(first.dashboard.window.end, "2026-11-14");
	assert.equal(first.dashboard.totals.clicks, 21);
	assert.equal(first.dashboard.totals.impressions, 1155);
	assert.equal(first.dashboard.totals.position, 12.38);
	assert.equal(first.dashboard.totals.pageLoads, 469);
	assert.equal(first.dashboard.totals.visits, 350);
	assert.equal(first.dashboard.coverage.sitemapUrls, 7);
	assert.equal(first.dashboard.coverage.orphans.count, 1);
	assert.deepEqual(first.dashboard.coverage.orphans.examples, ["/articles/orphan-article/"]);
	assert.equal(first.dashboard.gaps.trafficNoImpressions[0].path, "/");
	assert.ok(
		first.dashboard.gaps.trafficNoImpressions.some((row) => row.path === "/articles/new-discourse/"),
	);

	const raw = fs.readFileSync(
		path.join(tmp, "store", "analytics", "raw", "2026-11-14.jsonl"),
		"utf8",
	);
	const rows = jsonl.parseJsonl(raw);
	assert.equal(rows.length, 3 + 4 + 6);
	assert.ok(rows.every((row) => row.date === "2026-11-14"));
	assert.match(raw, /\n$/);

	const before = fs.readFileSync(out, "utf8");
	const second = await pull.run(argv, {
		now: new Date("2026-11-15T06:00:00Z"),
		cwd: tmp,
		log: () => {},
	});
	assert.equal(second.writes, 0);
	assert.equal(fs.readFileSync(out, "utf8"), before);
	assert.equal(JSON.parse(before).schemaVersion, 1);

	fs.rmSync(tmp, { recursive: true, force: true });
});
