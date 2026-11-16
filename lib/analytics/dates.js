"use strict";

// Date helpers for the analytics pull. Every date in this pipeline is a plain
// ISO calendar date (YYYY-MM-DD) in UTC, matching both the Search Console API
// and Cloudflare's RUM `date` dimension. No local timezone math is involved.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function assertIsoDate(value, label = "date") {
	const text = String(value == null ? "" : value);
	if (!ISO_DATE.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) {
		throw new Error(`${label} must be an ISO date (YYYY-MM-DD), got "${text}"`);
	}
	return text;
}

function toIsoDate(date) {
	if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
		throw new Error("toIsoDate expects a valid Date");
	}
	return date.toISOString().slice(0, 10);
}

function addDays(isoDate, days) {
	const base = new Date(`${assertIsoDate(isoDate)}T00:00:00Z`);
	base.setUTCDate(base.getUTCDate() + Number(days));
	return toIsoDate(base);
}

function dateRange(start, end) {
	assertIsoDate(start, "start");
	assertIsoDate(end, "end");
	if (start > end) {
		throw new Error(`start (${start}) is after end (${end})`);
	}
	const dates = [];
	for (let date = start; date <= end; date = addDays(date, 1)) {
		dates.push(date);
	}
	return dates;
}

// A window of `days` calendar days that ends on `end` (inclusive).
function windowEndingAt(end, days) {
	const endDate = assertIsoDate(end, "end");
	if (!Number.isInteger(days) || days < 1) {
		throw new Error(`days must be a positive integer, got "${days}"`);
	}
	const start = addDays(endDate, -(days - 1));
	return { start, end: endDate, days, dates: dateRange(start, end) };
}

// The nightly pull window. `lagDays` skips days whose data is not final yet:
// Search Console settles after ~2-3 days, Cloudflare after ~1.
function rollingWindow({ now = new Date(), days = 7, lagDays = 0 } = {}) {
	if (!Number.isInteger(lagDays) || lagDays < 0) {
		throw new Error(`lagDays must be a non-negative integer, got "${lagDays}"`);
	}
	return windowEndingAt(addDays(toIsoDate(now), -lagDays), days);
}

// Split a range into chunks so a single Cloudflare request never spans more
// than the documented 30-day limit (and retries stay small).
function chunkRange(start, end, chunkDays) {
	if (!Number.isInteger(chunkDays) || chunkDays < 1) {
		throw new Error(`chunkDays must be a positive integer, got "${chunkDays}"`);
	}
	const chunks = [];
	let cursor = assertIsoDate(start, "start");
	const last = assertIsoDate(end, "end");
	while (cursor <= last) {
		const chunkEnd = addDays(cursor, chunkDays - 1) > last ? last : addDays(cursor, chunkDays - 1);
		chunks.push({ start: cursor, end: chunkEnd });
		cursor = addDays(chunkEnd, 1);
	}
	return chunks;
}

module.exports = {
	assertIsoDate,
	toIsoDate,
	addDays,
	dateRange,
	windowEndingAt,
	rollingWindow,
	chunkRange,
};
