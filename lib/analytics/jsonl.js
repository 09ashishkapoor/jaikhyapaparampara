"use strict";

// Raw analytics rows are stored as newline-delimited JSON, one row per
// (date, source, dataset, dimension values) tuple. Re-pulling a date must
// replace that date's rows for the pulled source+dataset, never duplicate
// them, so the store stays idempotent by construction.

function groupKey(row) {
	return `${row.source}|${row.dataset}|${row.date}`;
}

function sortRows(rows) {
	return [...rows].sort((a, b) => {
		const byDate = String(a.date).localeCompare(String(b.date));
		if (byDate !== 0) return byDate;
		const bySource = String(a.source).localeCompare(String(b.source));
		if (bySource !== 0) return bySource;
		const byDataset = String(a.dataset).localeCompare(String(b.dataset));
		if (byDataset !== 0) return byDataset;
		// Final tie-break keeps byte-for-byte determinism across runs.
		return JSON.stringify(a).localeCompare(JSON.stringify(b));
	});
}

function parseJsonl(text) {
	const rows = [];
	const lines = String(text || "").split("\n");
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index].trim();
		if (!line) continue;
		try {
			const row = JSON.parse(line);
			if (!row || typeof row !== "object" || Array.isArray(row)) {
				throw new Error("row is not an object");
			}
			rows.push(row);
		} catch (error) {
			throw new Error(`Invalid JSONL at line ${index + 1}: ${error.message}`);
		}
	}
	return rows;
}

function encodeJsonl(rows) {
	if (!rows.length) return "";
	return `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
}

// Replace every existing row whose (source, dataset, date) group appears in
// `replacedGroups`, then append the incoming rows. Explicit groups let a pull
// with zero result rows still clear stale data for the queried dates.
function mergeRows(existingRows, incomingRows, replacedGroups) {
	const groups =
		replacedGroups != null
			? new Set(replacedGroups)
			: new Set(incomingRows.map((row) => groupKey(row)));
	const kept = existingRows.filter((row) => !groups.has(groupKey(row)));
	return sortRows([...kept, ...incomingRows]);
}

function groupRowsByDate(rows) {
	const byDate = new Map();
	for (const row of rows) {
		if (!byDate.has(row.date)) byDate.set(row.date, []);
		byDate.get(row.date).push(row);
	}
	return byDate;
}

module.exports = {
	groupKey,
	sortRows,
	parseJsonl,
	encodeJsonl,
	mergeRows,
	groupRowsByDate,
};
