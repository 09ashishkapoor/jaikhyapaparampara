"use strict";

// Google Search Console client — no `googleapis` dependency. A service-account
// key signs an RS256 JWT, the JWT is exchanged for an access token, and the
// token queries the Search Analytics API.
//
// Docs: https://developers.google.com/webmaster-tools/v1/searchanalytics/query
// Scope: https://www.googleapis.com/auth/webmasters.readonly

const crypto = require("crypto");
const { assertIsoDate } = require("./dates.js");

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_ROOT = "https://searchconsole.googleapis.com/webmasters/v3/sites";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const JWT_GRANT = "urn:ietf:params:oauth:grant-type:jwt-bearer";
const ROW_LIMIT = 25000;

// GSC reports one row per dimension tuple and aggregates over the requested
// range, so `date` must be a dimension to get a daily grain.
const DATASETS = {
	query: { dimensions: ["date", "query"], fields: ["query"] },
	page: { dimensions: ["date", "page"], fields: ["page"] },
	// The joined export answers "which page ranks for this query" without a
	// heuristic. It is larger, so it is pulled alongside the other two rather
	// than instead of them.
	querypage: { dimensions: ["date", "query", "page"], fields: ["query", "page"] },
};

function round(value, digits = 4) {
	const factor = 10 ** digits;
	return Math.round(Number(value || 0) * factor) / factor;
}

function base64url(value) {
	return Buffer.from(value).toString("base64url");
}

function normalizePrivateKey(value) {
	return String(value || "").replace(/\\n/g, "\n");
}

function parseServiceAccount(input) {
	const source = typeof input === "string" ? input.trim() : input;
	if (!source) {
		throw new Error("Search Console service account is not configured (GSC_SERVICE_ACCOUNT_JSON)");
	}
	let account = source;
	if (typeof source === "string") {
		try {
			account = JSON.parse(source);
		} catch (error) {
			throw new Error(`GSC_SERVICE_ACCOUNT_JSON is not valid JSON: ${error.message}`);
		}
	}
	if (!account || typeof account !== "object") {
		throw new Error("Search Console service account must be a JSON object");
	}
	if (!account.client_email) throw new Error("Service account JSON is missing client_email");
	if (!account.private_key) throw new Error("Service account JSON is missing private_key");
	return {
		clientEmail: String(account.client_email),
		privateKey: normalizePrivateKey(account.private_key),
		privateKeyId: account.private_key_id ? String(account.private_key_id) : "",
	};
}

function assertSiteUrl(siteUrl) {
	const text = String(siteUrl || "").trim();
	if (!text) throw new Error("Search Console property is not configured (GSC_SITE_URL)");
	// A domain property is `sc-domain:example.com`; a URL-prefix property is
	// an absolute URL ending in `/`.
	if (!/^sc-domain:[a-z0-9.-]+$/i.test(text) && !/^https?:\/\/[^\s]+\/$/i.test(text)) {
		throw new Error(
			`GSC_SITE_URL must be "sc-domain:example.com" or an absolute URL ending in "/", got "${text}"`,
		);
	}
	return text;
}

function buildJwt({ serviceAccount, scope = SCOPE, audience = TOKEN_URL, now = new Date(), ttlSeconds = 3600 } = {}) {
	if (!serviceAccount || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
		throw new Error("buildJwt requires a parsed service account");
	}
	const issuedAt = Math.floor(now.getTime() / 1000);
	const header = { alg: "RS256", typ: "JWT" };
	if (serviceAccount.privateKeyId) header.kid = serviceAccount.privateKeyId;
	const claims = {
		iss: serviceAccount.clientEmail,
		scope,
		aud: audience,
		iat: issuedAt,
		exp: issuedAt + ttlSeconds,
	};
	const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
	const signature = crypto
		.sign("RSA-SHA256", Buffer.from(unsigned), serviceAccount.privateKey)
		.toString("base64url");
	return `${unsigned}.${signature}`;
}

async function getAccessToken({ serviceAccount, fetchImpl = fetch, now = new Date() } = {}) {
	const assertion = buildJwt({ serviceAccount, now });
	const response = await fetchImpl(TOKEN_URL, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({ grant_type: JWT_GRANT, assertion }).toString(),
	});
	const text = await response.text();
	if (!response.ok) {
		throw new Error(`Search Console token exchange failed: ${response.status} ${text.slice(0, 300)}`);
	}
	let payload;
	try {
		payload = JSON.parse(text);
	} catch {
		throw new Error("Search Console token exchange returned invalid JSON");
	}
	if (!payload.access_token) {
		throw new Error("Search Console token exchange returned no access_token");
	}
	return { accessToken: String(payload.access_token), expiresIn: Number(payload.expires_in || 0) };
}

function buildSearchAnalyticsRequest({
	siteUrl,
	startDate,
	endDate,
	dataset,
	startRow = 0,
	rowLimit = ROW_LIMIT,
} = {}) {
	const definition = DATASETS[dataset];
	if (!definition) {
		throw new Error(
			`Unknown Search Console dataset "${dataset}" (expected ${Object.keys(DATASETS).join(", ")})`,
		);
	}
	assertSiteUrl(siteUrl);
	assertIsoDate(startDate, "startDate");
	assertIsoDate(endDate, "endDate");
	if (startDate > endDate) throw new Error("Search Console startDate is after endDate");
	return {
		url: `${API_ROOT}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
		body: {
			startDate,
			endDate,
			dimensions: definition.dimensions,
			type: "web",
			rowLimit,
			startRow,
		},
	};
}

async function querySearchAnalytics({
	accessToken,
	siteUrl,
	startDate,
	endDate,
	dataset,
	fetchImpl = fetch,
	rowLimit = ROW_LIMIT,
	maxRows = 100000,
	onPage = null,
} = {}) {
	if (!accessToken) throw new Error("querySearchAnalytics requires an access token");
	const rows = [];
	let startRow = 0;
	for (;;) {
		const request = buildSearchAnalyticsRequest({
			siteUrl,
			startDate,
			endDate,
			dataset,
			startRow,
			rowLimit,
		});
		const response = await fetchImpl(request.url, {
			method: "POST",
			headers: {
				authorization: `Bearer ${accessToken}`,
				"content-type": "application/json",
			},
			body: JSON.stringify(request.body),
		});
		const text = await response.text();
		if (!response.ok) {
			throw new Error(
				`Search Console ${dataset} query failed: ${response.status} ${text.slice(0, 300)}`,
			);
		}
		let payload;
		try {
			payload = JSON.parse(text);
		} catch {
			throw new Error("Search Console query returned invalid JSON");
		}
		const page = Array.isArray(payload.rows) ? payload.rows : payload.rows === undefined ? [] : null;
		if (page === null) throw new Error("Search Console query returned a malformed rows field");
		rows.push(...page);
		if (onPage) onPage({ dataset, rowsFetched: rows.length });
		if (page.length < rowLimit || rows.length >= maxRows) break;
		startRow += rowLimit;
	}
	return rows.slice(0, maxRows);
}

// Convert API rows into flat, daily-grain JSONL rows. Keys arrive in the same
// order as the requested dimensions.
function normalizeSearchAnalyticsRows({ rows, dataset } = {}) {
	const definition = DATASETS[dataset];
	if (!definition) throw new Error(`Unknown Search Console dataset "${dataset}"`);
	const output = [];
	for (const row of rows || []) {
		const keys = Array.isArray(row.keys) ? row.keys : [];
		const date = keys[definition.dimensions.indexOf("date")];
		const values = {};
		let complete = true;
		for (const field of definition.fields) {
			const value = keys[definition.dimensions.indexOf(field)];
			if (!value) {
				complete = false;
				break;
			}
			values[field] = String(value);
		}
		if (!complete) continue;
		assertIsoDate(date, `Search Console ${dataset} row date`);
		output.push({
			source: "gsc",
			dataset,
			date,
			...values,
			clicks: round(row.clicks, 4),
			impressions: round(row.impressions, 4),
			ctr: round(row.ctr, 6),
			position: round(row.position, 2),
		});
	}
	return output;
}

async function pullSearchConsole({
	serviceAccount,
	siteUrl,
	startDate,
	endDate,
	datasets = Object.keys(DATASETS),
	fetchImpl = fetch,
	now = new Date(),
	log = () => {},
} = {}) {
	const site = assertSiteUrl(siteUrl);
	const account = parseServiceAccount(serviceAccount);
	const { accessToken } = await getAccessToken({ serviceAccount: account, fetchImpl, now });
	const rows = [];
	for (const dataset of datasets) {
		log(`gsc ${dataset}: ${startDate}..${endDate}`);
		const raw = await querySearchAnalytics({
			accessToken,
			siteUrl: site,
			startDate,
			endDate,
			dataset,
			fetchImpl,
		});
		const normalized = normalizeSearchAnalyticsRows({ rows: raw, dataset });
		log(`gsc ${dataset}: ${raw.length} rows (${normalized.length} usable)`);
		rows.push(...normalized);
	}
	return { source: "gsc", datasets, rows };
}

module.exports = {
	TOKEN_URL,
	SCOPE,
	ROW_LIMIT,
	DATASETS,
	base64url,
	parseServiceAccount,
	assertSiteUrl,
	buildJwt,
	getAccessToken,
	buildSearchAnalyticsRequest,
	querySearchAnalytics,
	normalizeSearchAnalyticsRows,
	pullSearchConsole,
};
