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

module.exports = {
	data() {
		return {
			permalink: "/search-index.json",
			eleventyExcludeFromCollections: true,
		};
	},
	render(data) {
		const articles = (data.collections.articles || []).map((a) => {
			const description = shortText(
				a.data.metaDescription || a.data.description || "",
				180,
			);
			const content = cleanText(a.templateContent || "");

			return {
				title: a.data.title || "",
				url: a.url,
				description,
				category: a.data.category || "",
				tags: (a.data.tags || []).filter((t) => t !== "articles"),
				readingTime: a.data.readingTime || 0,
				content,
			};
		});
		return JSON.stringify(articles);
	},
};
