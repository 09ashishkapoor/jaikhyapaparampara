// Category vocabulary shared by the Eleventy build and the OG card generator.
// The alias table itself lives in _data/topics.js.
const { topics, categoryAliases } = require("../_data/topics.js");

const labelBySlug = new Map(topics.map((topic) => [topic.slug, topic.label]));

function normalizeCategory(value) {
	return String(value || "")
		.replace(/^['"]+|['"]+$/g, "")
		.trim();
}

function categoryTopicSlug(value) {
	return categoryAliases[normalizeCategory(value).toLowerCase()] || "";
}

function categoryLabel(value) {
	return labelBySlug.get(categoryTopicSlug(value)) || normalizeCategory(value);
}

module.exports = {
	normalizeCategory,
	categoryTopicSlug,
	categoryLabel,
};
