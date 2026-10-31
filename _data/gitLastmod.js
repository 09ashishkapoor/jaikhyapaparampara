const { execFileSync } = require("child_process");

// Maps "articles/foo.md" to the ISO date of its last commit.
// Local builds use git; Cloudflare's shallow clone falls back to the committed
// map written by `npm run sitemap:dates`.
module.exports = () => {
	const dates = {};
	try {
		const commitCount = Number(
			execFileSync("git", ["rev-list", "--count", "HEAD"], {
				encoding: "utf8",
			}).trim(),
		);
		if (commitCount >= 2) {
			const output = execFileSync(
				"git",
				["log", "--format=%cI", "--name-only", "--", "articles"],
				{ encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
			);
			let current = "";
			for (const line of output.split("\n")) {
				const value = line.trim();
				if (!value) continue;
				if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
					current = value;
				} else if (value.startsWith("articles/") && !dates[value]) {
					dates[value] = current;
					dates[`./${value}`] = current;
				}
			}
		}
	} catch {
		// Fall through to the committed map.
	}

	if (Object.keys(dates).length > 0) return dates;
	try {
		return require("./articleLastmod.json");
	} catch {
		// No committed map either; templates fall back to the publish date.
		return {};
	}
};
