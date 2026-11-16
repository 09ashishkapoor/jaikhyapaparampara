const { renderArticleIndex } = require("./lib/articleIndex.js");

module.exports = {
	data() {
		return {
			permalink: "/article-index.json",
			eleventyExcludeFromCollections: true,
		};
	},
	render(data) {
		return renderArticleIndex(data.collections);
	},
};
