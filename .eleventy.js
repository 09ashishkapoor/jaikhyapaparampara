module.exports = (eleventyConfig) => {
	const fs = require("fs");
	const path = require("path");
	const { topics: browseGroupDefinitions, categoryAliases } = require("./_data/topics.js");

	function syncReadmeArticleCount() {
		try {
			const articlesDir = path.join(__dirname, "articles");
			const readmePath = path.join(__dirname, "README.md");

			if (!fs.existsSync(articlesDir) || !fs.existsSync(readmePath)) {
				return;
			}

			const articleCount = fs
				.readdirSync(articlesDir)
				.filter((fileName) => fileName.endsWith(".md")).length;
			const articleCountWithCommas = articleCount.toLocaleString("en-US");
			const original = fs.readFileSync(readmePath, "utf8");
			let updated = original;

			updated = updated.replace(
				/(The site contains \*\*)([\d,]+)(\s+articles\*\*)/,
				`$1${articleCountWithCommas}$3`,
			);
			updated = updated.replace(
				/(articles\/\s+#\s*)([\d,]+)(\s+Markdown articles)/,
				`$1${articleCount}$3`,
			);

			if (updated !== original) {
				fs.writeFileSync(readmePath, updated, "utf8");
			}
		} catch (error) {
			console.error("Failed to sync README article count:", error);
		}
	}

	// Copy static assets to output
	eleventyConfig.addPassthroughCopy("styles.css");
	eleventyConfig.addPassthroughCopy("styles.min.css");
	eleventyConfig.addPassthroughCopy("icons.css");
	eleventyConfig.addPassthroughCopy("performance-optimizations.css");
	eleventyConfig.addPassthroughCopy("CLS_FIXES.css");
	eleventyConfig.addPassthroughCopy("script.js");
	eleventyConfig.addPassthroughCopy("script.min.js");
	eleventyConfig.addPassthroughCopy("images");
	eleventyConfig.addPassthroughCopy("*.png");
	eleventyConfig.addPassthroughCopy("*.jpg");
	eleventyConfig.addPassthroughCopy("*.webp");
	eleventyConfig.addPassthroughCopy("*.mp3");
	eleventyConfig.addPassthroughCopy("favicon-96x96.png");
	eleventyConfig.addPassthroughCopy("favicon.ico");
	eleventyConfig.addPassthroughCopy("apple-touch-icon.png");
	eleventyConfig.addPassthroughCopy("manifest.json");
	eleventyConfig.addPassthroughCopy("robots.txt");
	eleventyConfig.addPassthroughCopy("llms.txt");
	eleventyConfig.addPassthroughCopy("_headers");
	eleventyConfig.addPassthroughCopy("_redirects");

	eleventyConfig.on("eleventy.before", () => {
		syncReadmeArticleCount();
	});

	// Copy sitemap to root after build completes
	eleventyConfig.on("eleventy.after", ({ dir }) => {
		const sitemapSrc = path.join(dir.output, "sitemap.xml");
		const sitemapDest = path.join(".", "sitemap.xml");

		try {
			if (fs.existsSync(sitemapSrc)) {
				fs.copyFileSync(sitemapSrc, sitemapDest);
			}
		} catch (err) {
			console.error("Error copying sitemap:", err);
		}
	});

	eleventyConfig.addFilter("dateDisplay", (dateObj) => {
		return new Date(dateObj).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			timeZone: "UTC",
		});
	});

	eleventyConfig.addFilter("isoDate", (dateObj) => {
		return new Date(dateObj).toISOString();
	});

	eleventyConfig.addFilter("jsonify", (value) => {
		return JSON.stringify(value == null ? "" : value);
	});

	eleventyConfig.addFilter("attrEscape", (value) => {
		return String(value == null ? "" : value)
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	});

	eleventyConfig.addFilter("categoryLabel", categoryLabel);

	eleventyConfig.addFilter("articleTopicUrl", (groups, currentUrl) => {
		if (!groups || !currentUrl) return "";
		for (const group of groups) {
			if (group.articles && group.articles.some((a) => a.url === currentUrl)) {
				return group.url;
			}
		}
		return "";
	});

	eleventyConfig.addFilter(
		"relatedArticles",
		(articles, currentTags, currentUrl) => {
			const contentTags = (currentTags || []).filter(
				(tag) => tag !== "articles",
			);
			if (!contentTags.length) return [];

			return articles
				.filter((article) => article.url !== currentUrl)
				.filter(
					(article) =>
						Array.isArray(article.data.tags) &&
						article.data.tags.some((tag) => contentTags.includes(tag)),
				)
				.sort((a, b) => new Date(b.date) - new Date(a.date))
				.slice(0, 6);
		},
	);

	const glossaryEntityAliases = {
		"kali-ma-kali": [
			"ma kali",
			"maa kali",
			"mother kali",
			"kali puja",
			"dakshina kali",
			"smashana kali",
			"shmashana kali",
			"shmashan kali",
		],
		"adya-mahakali": [
			"adya mahakali",
			"adya maha kali",
			"adya kali",
			"maha adya kali",
			"mahamaya",
		],
		bhairava: ["bhairava", "bhairab", "batuka", "smashana bhairava"],
		kalabhairava: ["kalabhairava", "kaal bhairav", "kaalbhairav"],
		"bama-khepa": [
			"bama khepa",
			"bamakhyapa",
			"bamdeb",
			"bamdev",
			"vama khepa",
		],
		"guru-shyama-khyapa": [
			"guru shyama khyapa",
			"shyama khyapa",
			"shyamakhyapa",
			"gurudev",
			"guru baba shyama khyapa",
		],
		"khyapa-parampara": ["khyapa parampara", "parampara"],
		tarapith: ["tarapith", "tarapeeth", "tara peeth"],
		kamakhya: ["kamakhya", "kamakshya"],
		shantikunj: ["shantikunj", "shanti kunj", "shantikunja"],
	};

	function normalizeEntityText(value) {
		return String(value || "")
			.toLowerCase()
			.replace(/[’']/g, "")
			.replace(/[^a-z0-9]+/g, " ")
			.replace(/\s+/g, " ")
			.trim();
	}

	eleventyConfig.addFilter(
		"relatedCoreEntities",
		(coreEntities, title, description, keywords, category, tags) => {
			if (!Array.isArray(coreEntities)) return [];

			// Keep glossary/schema matches tied to reader-visible or page-level topic
			// signals. The legacy meta keywords often include sitewide boilerplate,
			// so they are intentionally not used for entity matching.
			void keywords;
			const haystack = normalizeEntityText(
				[
					title,
					description,
					category,
					Array.isArray(tags) ? tags.join(" ") : "",
				].join(" "),
			);

			return coreEntities
				.filter((entity) => {
					const aliases = glossaryEntityAliases[entity.slug] || [entity.name];
					return aliases.some((alias) => {
						const normalizedAlias = normalizeEntityText(alias);
						return normalizedAlias && haystack.includes(normalizedAlias);
					});
				})
				.slice(0, 4);
		},
	);

	function getArticles(collectionApi) {
		const articles = collectionApi.getFilteredByGlob("articles/*.md");
		validateTaxonomy(articles);
		return articles;
	}

	function normalizeCategory(value) {
		return String(value || "")
			.replace(/^['"]+|['"]+$/g, "")
			.trim();
	}

	const labelBySlug = new Map(
		browseGroupDefinitions.map((topic) => [topic.slug, topic.label]),
	);

	function categoryTopicSlug(value) {
		return categoryAliases[normalizeCategory(value).toLowerCase()] || "";
	}

	function categoryLabel(value) {
		return labelBySlug.get(categoryTopicSlug(value)) || normalizeCategory(value);
	}

	function validateTopics() {
		const slugs = new Set();
		for (const topic of browseGroupDefinitions) {
			for (const field of ["slug", "name", "label"]) {
				if (!topic[field]) {
					throw new Error(`_data/topics.js: topic is missing "${field}"`);
				}
			}
			if (slugs.has(topic.slug)) {
				throw new Error(`_data/topics.js: duplicate topic slug "${topic.slug}"`);
			}
			slugs.add(topic.slug);
		}
		for (const [alias, slug] of Object.entries(categoryAliases)) {
			if (!slugs.has(slug)) {
				throw new Error(
					`_data/topics.js: category alias "${alias}" points at unknown topic "${slug}"`,
				);
			}
		}
	}

	function validateTaxonomy(articles) {
		const problems = [];
		for (const article of articles) {
			const raw = normalizeCategory(article.data.category);
			if (!raw) {
				problems.push(`${article.inputPath}: missing category`);
			} else if (!categoryTopicSlug(raw)) {
				problems.push(
					`${article.inputPath}: unknown category "${raw}" (add it to categoryAliases in _data/topics.js)`,
				);
			}
		}
		if (problems.length) {
			throw new Error(
				`Taxonomy guard: ${problems.length} article(s) outside the controlled vocabulary\n${problems.join("\n")}`,
			);
		}
	}

	validateTopics();

	function slugifyValue(str) {
		return String(str || "")
			.toLowerCase()
			.trim()
			.replace(/\s+/g, "-")
			.replace(/[^\w-]+/g, "")
			.replace(/--+/g, "-");
	}

	function getArticleTitle(article) {
		return String(
			article.data.title || article.data.breadcrumbTitle || "Untitled Article",
		).trim();
	}

	function getArticleDescription(article) {
		return String(article.data.description || "").trim();
	}

	function getArticleTags(article) {
		const tags = Array.isArray(article.data.tags) ? article.data.tags : [];
		return tags
			.map((tag) => String(tag == null ? "" : tag).trim())
			.filter((tag) => tag && tag !== "articles");
	}

	function sortArticlesByDateDesc(articles) {
		return [...articles].sort((a, b) => {
			const dateDiff = b.date - a.date;
			if (dateDiff !== 0) return dateDiff;
			return b.inputPath.localeCompare(a.inputPath);
		});
	}

	function sortArticlesAlphabetically(articles) {
		return [...articles].sort((a, b) => {
			const titleDiff = getArticleTitle(a).localeCompare(
				getArticleTitle(b),
				"en",
				{
					sensitivity: "base",
					numeric: true,
				},
			);
			if (titleDiff !== 0) return titleDiff;
			return (a.url || a.inputPath).localeCompare(b.url || b.inputPath, "en", {
				sensitivity: "base",
				numeric: true,
			});
		});
	}

	function getInitialLetter(article) {
		const firstChar = getArticleTitle(article).trim().charAt(0).toUpperCase();
		return /[A-Z]/.test(firstChar) ? firstChar : "#";
	}

	function getLetterBuckets(articles) {
		const buckets = new Map();

		for (const article of sortArticlesAlphabetically(articles)) {
			const letter = getInitialLetter(article);
			if (!buckets.has(letter)) buckets.set(letter, []);
			buckets.get(letter).push(article);
		}

		return Array.from(buckets.entries()).map(([letter, items]) => ({
			letter,
			slug: letter === "#" ? "0-9" : slugifyValue(letter),
			count: items.length,
			articles: items,
		}));
	}

	function getTopCategoryLabels(articles, max = 3) {
		const counts = new Map();

		for (const article of articles) {
			const label = categoryLabel(article.data.category);
			if (!label) continue;
			counts.set(label, (counts.get(label) || 0) + 1);
		}

		return Array.from(counts.entries())
			.sort(
				(a, b) =>
					b[1] - a[1] ||
					a[0].localeCompare(b[0], "en", { sensitivity: "base" }),
			)
			.slice(0, max)
			.map(([name]) => name);
	}

	// Topic vocabulary, hub copy, and category aliases live in _data/topics.js.

	function scoreGroup(article, definition) {
		const category = normalizeCategory(article.data.category).toLowerCase();
		const tags = getArticleTags(article).map((tag) => tag.toLowerCase());
		const haystack = [
			article.fileSlug,
			getArticleTitle(article),
			getArticleDescription(article),
			category,
			tags.join(" "),
		]
			.join(" ")
			.toLowerCase();

		let score = 0;

		if (
			definition.exactCategories.includes(category) ||
			category === definition.name.toLowerCase()
		) {
			score += 4;
		}

		for (const keyword of definition.keywords) {
			if (haystack.includes(keyword)) score += 1;
		}

		return score;
	}

	function buildBrowseGroups(articles) {
		const preparedGroups = browseGroupDefinitions.map((definition) => ({
			...definition,
			articles: [],
		}));

		for (const article of articles) {
			let bestGroup = preparedGroups[preparedGroups.length - 1];
			let bestScore = -1;

			for (const group of preparedGroups) {
				const score = scoreGroup(article, group);
				if (score > bestScore) {
					bestScore = score;
					bestGroup = group;
				}
			}

			bestGroup.articles.push(article);
		}

		return preparedGroups
			.map((group) => {
				const groupArticles = sortArticlesAlphabetically(group.articles);
				const latestArticles = sortArticlesByDateDesc(group.articles);
				const letterBuckets = getLetterBuckets(groupArticles);
				return {
					slug: group.slug,
					url: `/articles/topics/${group.slug}/`,
					name: group.name,
					label: group.label,
					description: group.description,
					overview: group.overview || [],
					keyIdeas: group.keyIdeas || [],
					relatedEntitySlugs: group.relatedEntitySlugs || [],
					count: groupArticles.length,
					latestDate: latestArticles[0] ? latestArticles[0].date : undefined,
					startHereArticles: latestArticles.slice(0, 5),
					categoryLabels: getTopCategoryLabels(groupArticles),
					letters: letterBuckets,
					articles: groupArticles,
					exactCategories: group.exactCategories,
				};
			})
			.filter((group) => group.count > 0);
	}

	function buildTagLookup(articles) {
		const slugToTags = new Map();
		const slugToTagCounts = new Map();
		const slugToArticles = new Map();
		const slugifyTag = eleventyConfig.getFilter("slugify");

		for (const item of articles) {
			for (const tag of getArticleTags(item)) {
				const slug = slugifyTag(tag);
				if (!slugToTags.has(slug)) {
					slugToTags.set(slug, new Set());
					slugToTagCounts.set(slug, new Map());
					slugToArticles.set(slug, []);
				}
				slugToTags.get(slug).add(tag);
				if (!slugToArticles.get(slug).includes(item)) {
					slugToArticles.get(slug).push(item);
					const tagCounts = slugToTagCounts.get(slug);
					tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
				}
			}
		}

		const entries = Array.from(slugToTags.entries())
			.map(([slug, tags]) => {
				// Display form: the spelling used by the most articles (alphabetical tie-break).
				const canonicalTag = [...slugToTagCounts.get(slug).entries()].sort(
					(a, b) =>
						b[1] - a[1] ||
						a[0].localeCompare(b[0], "en", { sensitivity: "base" }),
				)[0][0];
				const tagArticles = sortArticlesByDateDesc(slugToArticles.get(slug));

				return {
					slug,
					canonicalTag,
					count: tagArticles.length,
					isIndexable: tagArticles.length > 0,
					url: `/tags/${slug}/`,
					articles: tagArticles,
					tags: [...tags],
				};
			})
			.sort((a, b) =>
				a.canonicalTag.localeCompare(b.canonicalTag, "en", {
					sensitivity: "base",
				}),
			);

		const allTags = entries.map((entry) => entry.canonicalTag);
		const tagCollections = {};
		const metaByTag = {};

		for (const entry of entries) {
			tagCollections[entry.canonicalTag] = entry.articles;

			for (const tag of entry.tags) {
				metaByTag[tag] = {
					slug: entry.slug,
					canonicalTag: entry.canonicalTag,
					count: entry.count,
					isIndexable: entry.isIndexable,
					url: entry.url,
				};
			}
		}

		return {
			allTags,
			tagCollections,
			metaByTag,
		};
	}

	eleventyConfig.addCollection("articles", (collectionApi) =>
		sortArticlesByDateDesc(getArticles(collectionApi)),
	);

	eleventyConfig.addCollection("articlesAlpha", (collectionApi) =>
		sortArticlesAlphabetically(getArticles(collectionApi)),
	);

	eleventyConfig.addCollection("browseGroups", (collectionApi) =>
		buildBrowseGroups(getArticles(collectionApi)),
	);

	eleventyConfig.addCollection(
		"allTags",
		(collectionApi) => buildTagLookup(getArticles(collectionApi)).allTags,
	);

	eleventyConfig.addCollection("tagDirectoryPages", (collectionApi) => {
		const tags = buildTagLookup(getArticles(collectionApi)).allTags;
		const pageSize = 100;
		const totalPages = Math.ceil(tags.length / pageSize);
		return Array.from({ length: totalPages }, (_, index) => ({
			number: index + 1,
			url: index === 0 ? "/tags/" : `/tags/page/${index + 1}/`,
			tags: tags.slice(index * pageSize, (index + 1) * pageSize),
			totalTags: tags.length,
			totalPages,
		}));
	});

	eleventyConfig.addCollection(
		"all",
		(collectionApi) =>
			buildTagLookup(getArticles(collectionApi)).tagCollections,
	);

	eleventyConfig.addCollection(
		"tagMeta",
		(collectionApi) => buildTagLookup(getArticles(collectionApi)).metaByTag,
	);

	return {
		dir: {
			input: ".",
			output: "_site",
			includes: "_includes",
			data: "_data",
		},
		templateFormats: ["md", "liquid", "html", "11ty.js"],
		markdownTemplateEngine: "liquid",
		htmlTemplateEngine: "liquid",
		dataTemplateEngine: "liquid",
	};
};
