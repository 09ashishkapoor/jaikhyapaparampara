"use strict";

// Cloudflare Web Analytics client (GraphQL only — there is no wrangler command
// for this data). Web Analytics is account-scoped, so the query filters on the
// RUM `siteTag`, not the zone.
//
// Docs: https://developers.cloudflare.com/analytics/graphql-api/
// Limits: one request spans at most 30 days; the adaptive datasets retain ~30
// days, so the nightly pull must run every day.

const { assertIsoDate, chunkRange } = require("./dates.js");

const GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";
const DATASET = "pageloads";
const GRAPHQL_LIMIT = 10000;

// Dimensions are deliberately at the granularity the roadmap asks the raw store
// to keep: date x path x referer x country x device. New questions can then be
// answered without re-ingesting.
const DIMENSIONS = ["date", "requestPath", "refererHost", "countryName", "deviceType"];

const PAGELOAD_QUERY = `query PageLoads($account: String!, $site: String!, $from: Date!, $to: Date!) {
  viewer {
    accounts(filter: { accountTag: $account }) {
      rumPageloadEventsAdaptiveGroups(
        limit: ${GRAPHQL_LIMIT}
        orderBy: [count_DESC]
        filter: { siteTag: $site, date_geq: $from, date_leq: $to, bot: 0 }
      ) {
        count
        sum { visits }
        avg { sampleInterval }
        dimensions { ${DIMENSIONS.join(" ")} }
      }
    }
  }
}`;

const SITE_TAG_PATTERN = /^[a-f0-9]{32}$/i;

function assertAccountId(value, label = "CF_ACCOUNT_ID") {
	const text = String(value || "").trim();
	if (!/^[a-f0-9]{32}$/i.test(text)) {
		throw new Error(`${label} must be a 32-character hexadecimal account id`);
	}
	return text;
}

function assertSiteTag(value) {
	const text = String(value || "").trim();
	if (!text) throw new Error("Cloudflare Web Analytics site tag is not configured (CF_RUM_SITE_TAG)");
	if (!SITE_TAG_PATTERN.test(text)) {
		throw new Error(
			`CF_RUM_SITE_TAG should be the 32-character Web Analytics site tag, got "${text}"`,
		);
	}
	return text;
}

function buildPageLoadRequest({ accountId, siteTag, startDate, endDate }) {
	assertIsoDate(startDate, "startDate");
	assertIsoDate(endDate, "endDate");
	if (startDate > endDate) throw new Error("Cloudflare startDate is after endDate");
	return {
		query: PAGELOAD_QUERY,
		variables: {
			account: assertAccountId(accountId),
			site: assertSiteTag(siteTag),
			from: startDate,
			to: endDate,
		},
	};
}

function round(value, digits = 2) {
	const factor = 10 ** digits;
	return Math.round(Number(value || 0) * factor) / factor;
}

function normalizePageLoadPayload(payload) {
	if (!payload || typeof payload !== "object") {
		throw new Error("Cloudflare GraphQL returned an empty response");
	}
	if (Array.isArray(payload.errors) && payload.errors.length) {
		const message = payload.errors
			.map((error) => (error && error.message ? error.message : String(error)))
			.join("; ");
		throw new Error(`Cloudflare GraphQL error: ${message}`);
	}
	const accounts = payload.data && payload.data.viewer && payload.data.viewer.accounts;
	if (!Array.isArray(accounts) || accounts.length === 0) {
		throw new Error(
			"Cloudflare GraphQL returned no account — check CF_ACCOUNT_ID and the token's Account Analytics permission",
		);
	}
	const groups = accounts[0].rumPageloadEventsAdaptiveGroups;
	if (!Array.isArray(groups)) {
		throw new Error("Cloudflare GraphQL response is missing rumPageloadEventsAdaptiveGroups");
	}
	return groups.map((group) => {
		const dimensions = group.dimensions || {};
		const date = dimensions.date;
		assertIsoDate(date, "Cloudflare row date");
		const visits = group.sum && typeof group.sum.visits === "number" ? group.sum.visits : 0;
		const sampleInterval =
			group.avg && typeof group.avg.sampleInterval === "number" ? group.avg.sampleInterval : 1;
		return {
			source: "cf",
			dataset: DATASET,
			date,
			path: String(dimensions.requestPath || "/"),
			refererHost: String(dimensions.refererHost || ""),
			country: String(dimensions.countryName || ""),
			device: String(dimensions.deviceType || ""),
			pageLoads: round(group.count, 2),
			visits: round(visits, 2),
			sampleInterval: round(sampleInterval, 4),
		};
	});
}

async function fetchPageLoads({
	accountId,
	siteTag,
	apiToken,
	startDate,
	endDate,
	fetchImpl = fetch,
	endpoint = GRAPHQL_ENDPOINT,
} = {}) {
	if (!apiToken) throw new Error("Cloudflare API token is not configured (CF_API_TOKEN)");
	const request = buildPageLoadRequest({ accountId, siteTag, startDate, endDate });
	const response = await fetchImpl(endpoint, {
		method: "POST",
		headers: {
			authorization: `Bearer ${apiToken}`,
			"content-type": "application/json",
		},
		body: JSON.stringify(request),
	});
	const text = await response.text();
	if (!response.ok) {
		throw new Error(`Cloudflare GraphQL HTTP ${response.status}: ${text.slice(0, 300)}`);
	}
	let payload;
	try {
		payload = JSON.parse(text);
	} catch {
		throw new Error("Cloudflare GraphQL returned invalid JSON");
	}
	return normalizePageLoadPayload(payload);
}

async function pullCloudflare({
	accountId,
	siteTag,
	apiToken,
	startDate,
	endDate,
	fetchImpl = fetch,
	log = () => {},
} = {}) {
	const rows = [];
	for (const chunk of chunkRange(startDate, endDate, 7)) {
		log(`cf ${DATASET}: ${chunk.start}..${chunk.end}`);
		const chunkRows = await fetchPageLoads({
			accountId,
			siteTag,
			apiToken,
			startDate: chunk.start,
			endDate: chunk.end,
			fetchImpl,
		});
		log(`cf ${DATASET}: ${chunkRows.length} rows`);
		if (chunkRows.length >= GRAPHQL_LIMIT) {
			log(
				`cf ${DATASET}: hit the ${GRAPHQL_LIMIT}-row limit — long-tail rows may be truncated; narrow the window`,
			);
		}
		rows.push(...chunkRows);
	}
	return { source: "cf", datasets: [DATASET], rows };
}

module.exports = {
	GRAPHQL_ENDPOINT,
	DATASET,
	DIMENSIONS,
	PAGELOAD_QUERY,
	assertAccountId,
	assertSiteTag,
	buildPageLoadRequest,
	normalizePageLoadPayload,
	fetchPageLoads,
	pullCloudflare,
};
