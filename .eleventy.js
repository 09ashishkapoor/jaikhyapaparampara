module.exports = (eleventyConfig) => {
	const fs = require("fs");
	const path = require("path");

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
		return collectionApi.getFilteredByGlob("articles/*.md");
	}

	function normalizeCategory(value) {
		return String(value || "")
			.replace(/^['"]+|['"]+$/g, "")
			.trim();
	}

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
		return (article.data.tags || [])
			.filter((tag) => typeof tag === "string" && tag !== "articles")
			.map((tag) => tag.trim())
			.filter(Boolean);
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
			const category = normalizeCategory(article.data.category);
			if (!category) continue;
			counts.set(category, (counts.get(category) || 0) + 1);
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

	const browseGroupDefinitions = [
		{
			slug: "prophecy-world-events",
			name: "Prophecy and World Events",
			description:
				"Predictions, warnings, and spiritual readings of world events, social upheaval, and cycles of time.",
			overview: [
				"This hub gathers prophecy, warning, and world-event articles for readers who want to understand how Gurudev Shyama Khyapa frames social upheaval, disasters, pandemics, and cycles of time through a devotional lens.",
				"Use it as a careful study path: the articles may discuss intense subjects, but the page keeps the context spiritual rather than presenting medical, safety, political, or disaster-preparedness advice.",
			],
			keyIdeas: [
				"Kali Yuga: the current age of decline and spiritual testing in Hindu cosmology.",
				"Bhabishya Malika: a prophetic textual tradition often discussed in relation to future events.",
				"Kalki: the future avatara associated with the restoration of dharma.",
				"Pralay: dissolution or upheaval, interpreted here within devotional teaching.",
			],
			relatedEntitySlugs: [
				"guru-shyama-khyapa",
				"khyapa-parampara",
				"adya-mahakali",
			],
			exactCategories: [
				"prophecy",
				"prophecies",
				"prophecy & science",
				"prophecy & spirituality",
				"spiritual warnings",
			],
			keywords: [
				"prophecy",
				"predictions",
				"future",
				"world war",
				"earthquake",
				"covid",
				"taliban",
				"afghanistan",
				"climate",
				"virus",
				"warning",
				"kali yuga",
				"kalki",
				"bhabishya",
				"cataclysm",
				"pralay",
				"end times",
				"mars",
				"eclipse",
			],
		},
		{
			slug: "rituals-worship-festivals",
			name: "Rituals, Worship and Festivals",
			description:
				"Puja, homa, sacred observances, and ceremonial guidance for devotional practice.",
			overview: [
				"This hub is for devotees looking for puja, homa, observance, and festival articles connected with Ma Kali, Bhairava, Annapurna, Ambubachi, Navratri, Shivratri, and related sacred days.",
				"The material is organized for discovery and study. Where articles describe ritual detail, readers should follow their own tradition, guru guidance, family practice, and local safety norms rather than treating a web article as personal instruction.",
			],
			keyIdeas: [
				"Puja: devotional worship offered through mantra, materials, attention, and reverence.",
				"Homa or yagya: sacred fire offering performed according to lineage and ritual rules.",
				"Ambubachi: a Shakti observance linked with the creative power of the Goddess and nature.",
				"Vrata: a vow, discipline, or observance undertaken with devotional intent.",
			],
			relatedEntitySlugs: [
				"kali-ma-kali",
				"adya-mahakali",
				"bhairava",
				"kalabhairava",
				"shantikunj",
			],
			exactCategories: ["rituals & yagyas", "prayers and chants"],
			keywords: [
				"puja",
				"homa",
				"homam",
				"yagya",
				"yajna",
				"ritual",
				"worship",
				"festival",
				"ashtami",
				"navratri",
				"durga puja",
				"kali puja",
				"shivratri",
				"annapurna",
				"falaharini",
				"ambubachi",
				"tritiya",
			],
		},
		{
			slug: "sacred-texts-scriptures",
			name: "Sacred Texts and Scriptures",
			description:
				"Stotrams, kavachams, sahasranamas, and scripture-focused articles meant for study and recitation.",
			overview: [
				"This hub collects scripture-oriented resources: sahasranamas, kavachams, stotrams, meanings, chanting references, and articles that help readers approach sacred texts with steadiness.",
				"It is useful for visitors who came for free texts as well as readers comparing article commentary with downloadable books, audio, and other Temple of Knowledge resources on the home page.",
			],
			keyIdeas: [
				"Sahasranama: a thousand-name hymn or litany for contemplation and recitation.",
				"Kavacham: a protective hymn traditionally recited as spiritual armor.",
				"Stotram: a hymn of praise addressed to a deity or sacred principle.",
				"Meaning and recitation: textual study is paired with devotion, pronunciation, and intent.",
			],
			relatedEntitySlugs: [
				"kali-ma-kali",
				"adya-mahakali",
				"bhairava",
				"kalabhairava",
				"khyapa-parampara",
			],
			exactCategories: ["temple of knowledge"],
			keywords: [
				"stotram",
				"stotra",
				"kavach",
				"kavacham",
				"ashtakam",
				"sahasranama",
				"lyrics",
				"meaning",
				"scripture",
				"gita",
				"veda",
				"upanishad",
				"commentary",
			],
		},
		{
			slug: "sadhana-tantra-mantra",
			name: "Sadhana, Tantra and Mantra",
			description:
				"Practices, mantra guidance, tantra teachings, and articles centered on inner discipline and sacred method.",
			overview: [
				"This hub is for seekers studying sadhana, mantra, tantra, diksha, japa, and the discipline required for Kali and Bhairava-centered practice within the Khyapa Parampara context.",
				"The page keeps practice articles connected without flattening lineage boundaries. Readers should treat advanced or tantric material with humility and seek qualified guidance before attempting practices.",
			],
			keyIdeas: [
				"Sadhana: sustained spiritual discipline undertaken with devotion and method.",
				"Mantra: sacred sound or formula used for remembrance, japa, and inner alignment.",
				"Diksha: initiation or transmission within a living lineage or teacher relationship.",
				"Bhairava and Kali sadhana: fierce devotional paths that emphasize surrender, courage, and discipline.",
			],
			relatedEntitySlugs: [
				"kali-ma-kali",
				"adya-mahakali",
				"bhairava",
				"kalabhairava",
				"guru-shyama-khyapa",
			],
			exactCategories: ["sadhana"],
			keywords: [
				"sadhana",
				"tantra",
				"mantra",
				"yantra",
				"chakra",
				"kundalini",
				"diksha",
				"japa",
				"upasana",
				"bhairava sadhana",
				"kali sadhana",
				"agni chakra",
				"vairagya",
			],
		},
		{
			slug: "sacred-places-pilgrimage",
			name: "Sacred Places and Pilgrimage",
			description:
				"Temples, cremation grounds, pilgrimages, and location-based teachings tied to sacred geography.",
			overview: [
				"This hub organizes articles about sacred geography: Tarapith, Kamakhya, Kashi, Shantikunj, cremation grounds, temples, Shakti Peethas, and pilgrimage encounters.",
				"It is meant for readers tracing the places that recur across the articles and for devotees who want location-based stories, not for travel logistics, booking advice, or official temple information.",
			],
			keyIdeas: [
				"Tarapith: a major Shakti and Tara pilgrimage center associated with Bama Khepa.",
				"Kamakhya: a central Shakti Peetha and living tantric pilgrimage site in Assam.",
				"Shantikunj: the Parampara-associated devotional center appearing in many articles.",
				"Smashan: cremation-ground symbolism tied to Kali, Tara, renunciation, and impermanence.",
			],
			relatedEntitySlugs: ["tarapith", "kamakhya", "shantikunj", "bama-khepa"],
			exactCategories: ["sacred places"],
			keywords: [
				"tarapith",
				"tarapeeth",
				"kamakhya",
				"kashi",
				"varanasi",
				"temple",
				"shakti peeth",
				"pilgrimage",
				"shantikunj",
				"ujjain",
				"vindhyachal",
				"cremation ground",
				"smashan",
				"jyotirlinga",
			],
		},
		{
			slug: "guru-stories-devotee-lives",
			name: "Guru Stories and Devotee Lives",
			description:
				"Stories, testimonies, healing accounts, and life events centered on Gurudev and devotees.",
			overview: [
				"This hub brings together stories of Gurudev Shyama Khyapa, devotees, disciples, blessings, journeys, celebrations, healing testimony, and remembered experiences from the Parampara.",
				"It is designed for readers who learn through lived examples. Accounts are preserved as devotional testimony and should be read with respect for the people, context, and lineage behind each story.",
			],
			keyIdeas: [
				"Guru bhakti: devotion to the teacher as a path of surrender and transformation.",
				"Testimony: a devotee account of experience, grace, healing, or change.",
				"Parampara: the living stream of transmission, relationship, memory, and teaching.",
				"Seva: service offered to guru, deity, community, and sacred work.",
			],
			relatedEntitySlugs: [
				"guru-shyama-khyapa",
				"bama-khepa",
				"khyapa-parampara",
				"shantikunj",
			],
			exactCategories: [
				"guru stories",
				"miracle stories",
				"healing testimonies",
				"miracles & healing",
				"divine stories",
			],
			keywords: [
				"story",
				"stories",
				"testimony",
				"miracle",
				"healing",
				"devotee",
				"disciple",
				"friendship",
				"birthday",
				"celebration",
				"journey",
				"visit",
				"blessing",
			],
		},
		{
			slug: "discourses-practical-life",
			name: "Discourses, Questions & Practical Life",
			description:
				"Question-driven guidance, society, ethics, culture, and practical spiritual life in the modern world.",
			overview: [
				"This hub is for question-led and practical-life articles: family, society, ethics, culture, health-adjacent reflections, education, politics, science, and everyday spiritual responsibility.",
				"It helps readers separate broad devotional guidance from specific professional advice. Use the articles for spiritual reflection and consult qualified experts for medical, legal, financial, or safety decisions.",
			],
			keyIdeas: [
				"Dharma in daily life: applying spiritual values to family, society, and choices.",
				"Question discourse: teaching that begins from a devotee or audience question.",
				"Culture and roots: memory, tradition, and identity viewed through spiritual responsibility.",
				"Discernment: using humility and qualified guidance where devotional reflection is not enough.",
			],
			relatedEntitySlugs: [
				"guru-shyama-khyapa",
				"khyapa-parampara",
				"shantikunj",
			],
			exactCategories: [
				"discourse",
				"guru messages",
				"social commentary",
				"health & wellness",
				"our roots",
				"history & spirituality",
				"patriotism & history",
				"science and spirituality",
			],
			keywords: [
				"question",
				"questions",
				"answering",
				"fans",
				"society",
				"social",
				"women",
				"family",
				"marriage",
				"education",
				"health",
				"science",
				"politics",
				"culture",
				"freedom",
				"rights",
				"practical",
			],
		},
		{
			slug: "spiritual-teachings-philosophy",
			name: "Spiritual Teachings and Philosophy",
			description:
				"Core teachings, philosophical reflections, and broad spiritual wisdom for self-directed study.",
			overview: [
				"This hub collects philosophical and teaching articles on atma, brahma, dharma, jnana, conscience, self-inquiry, realization, and the wider spiritual principles that support devotional life.",
				"It is intended as a study doorway for readers who want the Parampara's reflective teachings in one place before moving into specific ritual, scripture, guru-story, or sadhana paths.",
			],
			keyIdeas: [
				"Atma: the self or soul considered in relation to body, mind, karma, and realization.",
				"Brahma jnana: knowledge of the Absolute or ultimate reality.",
				"Dharma: right order, duty, integrity, and spiritual responsibility.",
				"Vairagya: detachment or dispassion that supports inner freedom.",
			],
			relatedEntitySlugs: [
				"khyapa-parampara",
				"guru-shyama-khyapa",
				"kali-ma-kali",
				"bhairava",
			],
			exactCategories: ["spiritual teachings", "philosophy"],
			keywords: [
				"atma",
				"brahma",
				"vedanta",
				"tattva",
				"dharma",
				"jnana",
				"wisdom",
				"truth",
				"realization",
				"conscience",
				"self",
				"soul",
			],
		},
	];

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

		if (definition.exactCategories.includes(category)) {
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
		const slugToArticles = new Map();

		for (const item of articles) {
			for (const tag of getArticleTags(item)) {
				const slug = slugifyValue(tag);
				if (!slugToTags.has(slug)) {
					slugToTags.set(slug, new Set());
					slugToArticles.set(slug, []);
				}
				slugToTags.get(slug).add(tag);
				if (!slugToArticles.get(slug).includes(item)) {
					slugToArticles.get(slug).push(item);
				}
			}
		}

		const entries = Array.from(slugToTags.entries())
			.map(([slug, tags]) => {
				const canonicalTag = [...tags].sort((a, b) =>
					a.localeCompare(b, "en", { sensitivity: "base" }),
				)[0];
				const tagArticles = sortArticlesByDateDesc(slugToArticles.get(slug));

				return {
					slug,
					canonicalTag,
					count: tagArticles.length,
					isIndexable: tagArticles.length >= 8,
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
