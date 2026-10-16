const searchIndex = require("./search-index.11ty.js");

module.exports = {
	data() {
		return {
			permalink: "/article-index.json",
			eleventyExcludeFromCollections: true,
		};
	},
	render(data) {
		return searchIndex.render(data, false);
	},
};
