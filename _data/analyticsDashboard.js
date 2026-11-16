// Build-time view of the analytics dashboard.
//
// The nightly job writes analytics/dashboard.json to R2; `npm run analytics:fetch`
// copies it to .analytics/dashboard.json before Eleventy runs. The file is
// gitignored, and its absence is a supported state: /stats/ renders setup
// instructions instead of failing the build.
const fs = require("fs");
const path = require("path");

const DASHBOARD_FILE = path.join(__dirname, "..", ".analytics", "dashboard.json");
const SCHEMA_VERSION = 1;

function loadDashboard() {
	try {
		const dashboard = JSON.parse(fs.readFileSync(DASHBOARD_FILE, "utf8"));
		if (!dashboard || dashboard.schemaVersion !== SCHEMA_VERSION) return null;
		if (!dashboard.window || !Array.isArray(dashboard.daily)) return null;
		return dashboard;
	} catch {
		return null;
	}
}

module.exports = loadDashboard();
