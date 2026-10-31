const { execFileSync } = require("child_process");

// Maps "articles/foo.md" to the ISO date of its last commit.
// shortcut: a shallow CI clone (single commit) collapses every date to the
// checkout commit. Upgrade to a committed lastmod map if that happens.
module.exports = () => {
	const dates = {};
	try {
		// A shallow deploy clone reports one commit; using it would mark every
		// article as freshly updated. Fall back to the publish date instead.
		const commitCount = Number(
			execFileSync("git", ["rev-list", "--count", "HEAD"], {
				encoding: "utf8",
			}).trim(),
		);
		if (commitCount < 2) return dates;
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
	} catch {
		// No git history available; templates fall back to the publish date.
	}
	return dates;
};
