const { renderArticleTextIndex } = require("./lib/articleIndex.js");

module.exports = {
	data() {
		return {
			permalink: "/search-index.json",
			eleventyExcludeFromCollections: true,
		};
	},
	render(data) {
		return renderArticleTextIndex(data.collections);
	},
};
