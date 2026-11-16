// Compact, metadata-only article index shared by /article-index.json.
//
// The index is fetched whole by the search page, the homepage discovery strip,
// and the "Surprise me" control on /articles/, so it must stay small. Article
// bodies are deliberately excluded: shipping them made the payload 9.62 MB for
// 1,205 articles (ROADMAP defect D4). Full text remains available on the
// article pages themselves; search matches title, description, category and
// tags only.
const { categoryLabel } = require("./taxonomy.js");

function cleanText(value) {
	return String(value || "")
		.replace(/<style[\s\S]*?<\/style>/gi, " ")
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function shortText(value, maxLength) {
	const text = cleanText(value);
	if (text.length <= maxLength) return text;
	const boundary = text.lastIndexOf(" ", maxLength - 1);
	return `${text.slice(0, boundary > 80 ? boundary : maxLength).trim()}…`;
}

function entryForArticle(article) {
	const data = article.data || {};
	return {
		title: data.title || "",
		url: article.url,
		date: article.date,
		description: shortText(
			data.metaDescription || data.description || "",
			180,
		),
		category: data.category || "",
		categoryLabel: categoryLabel(data.category),
		tags: (data.tags || []).filter((tag) => tag !== "articles"),
		readingTime: data.readingTime || 0,
	};
}

function buildArticleIndex(collections) {
	return (collections.articles || []).map(entryForArticle);
}

function renderArticleIndex(collections) {
	return JSON.stringify(buildArticleIndex(collections));
}

// Full-text companion index, fetched only after the metadata results are on
// screen. Entries carry the body text keyed by URL so the search page can merge
// body matches into results without duplicating metadata.
function buildArticleTextIndex(collections) {
	return (collections.articles || []).map((article) => ({
		url: article.url,
		content: cleanText(article.templateContent || ""),
	}));
}

function renderArticleTextIndex(collections) {
	return JSON.stringify(buildArticleTextIndex(collections));
}

module.exports = {
	buildArticleIndex,
	renderArticleIndex,
	buildArticleTextIndex,
	renderArticleTextIndex,
};
