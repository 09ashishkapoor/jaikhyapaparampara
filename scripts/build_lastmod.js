#!/usr/bin/env node
// Writes the git commit date of every article to _data/articleLastmod.json.
// Cloudflare Pages builds from a shallow clone, so the deployed sitemap reads
// this committed map; local builds prefer live git history.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "_data", "articleLastmod.json");

const log = execFileSync(
	"git",
	["log", "--format=%cI", "--name-only", "--", "articles"],
	{ cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);

const dates = {};
let current = "";
for (const line of log.split("\n")) {
	const value = line.trim();
	if (!value) continue;
	if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
		current = value;
	} else if (value.startsWith("articles/") && !dates[value]) {
		dates[value] = current;
		dates[`./${value}`] = current;
	}
}

fs.writeFileSync(output, `${JSON.stringify(dates, null, 2)}\n`, "utf8");
console.log(`Wrote ${Object.keys(dates).length / 2} article dates to ${path.relative(root, output)}`);
