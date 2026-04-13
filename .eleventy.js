module.exports = function(eleventyConfig) {
  const fs = require("fs");
  const path = require("path");

  function syncReadmeArticleCount() {
    try {
      const articlesDir = path.join(__dirname, "articles");
      const readmePath = path.join(__dirname, "README.md");

      if (!fs.existsSync(articlesDir) || !fs.existsSync(readmePath)) {
        return;
      }

      const articleCount = fs.readdirSync(articlesDir).filter((fileName) => fileName.endsWith(".md")).length;
      const original = fs.readFileSync(readmePath, "utf8");
      let updated = original;

      updated = updated.replace(/(The site contains \*\*)(\d+)(\s+articles\*\*)/, `$1${articleCount}$3`);
      updated = updated.replace(/(articles\/\s+#\s*)(\d+)(\s+Markdown articles)/, `$1${articleCount}$3`);

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
  eleventyConfig.addPassthroughCopy("translations.js");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("gallery.html");
  eleventyConfig.addPassthroughCopy("*.png");
  eleventyConfig.addPassthroughCopy("*.jpg");
  eleventyConfig.addPassthroughCopy("*.webp");
  eleventyConfig.addPassthroughCopy("*.mp3");
  eleventyConfig.addPassthroughCopy("favicon-96x96.png");
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("apple-touch-icon.png");
  eleventyConfig.addPassthroughCopy("manifest.json");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("_headers");
  eleventyConfig.addPassthroughCopy("_redirects");

  eleventyConfig.on("eleventy.before", async () => {
    syncReadmeArticleCount();
  });

  // Copy sitemap to root after build completes
  eleventyConfig.on("eleventy.after", async ({ dir }) => {
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
      timeZone: "UTC"
    });
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => {
    return new Date(dateObj).toISOString();
  });

  eleventyConfig.addFilter("relatedArticles", function(articles, currentTags, currentUrl) {
    const contentTags = (currentTags || []).filter((tag) => tag !== "articles");
    if (!contentTags.length) return [];

    return articles
      .filter((article) => article.url !== currentUrl)
      .filter((article) => Array.isArray(article.data.tags) && article.data.tags.some((tag) => contentTags.includes(tag)))
      .slice(0, 4);
  });

  function getArticles(collectionApi) {
    return collectionApi.getFilteredByGlob("articles/*.md");
  }

  function normalizeCategory(value) {
    return String(value || "")
      .replace(/^['\"]+|['\"]+$/g, "")
      .trim();
  }

  function slugifyValue(str) {
    return String(str || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
  }

  function getArticleTitle(article) {
    return String(article.data.title || article.data.breadcrumbTitle || "Untitled Article").trim();
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
      const titleDiff = getArticleTitle(a).localeCompare(getArticleTitle(b), "en", {
        sensitivity: "base",
        numeric: true
      });
      if (titleDiff !== 0) return titleDiff;
      return (a.url || a.inputPath).localeCompare(b.url || b.inputPath, "en", {
        sensitivity: "base",
        numeric: true
      });
    });
  }

  function getInitialLetter(article) {
    const firstChar = getArticleTitle(article).trim().charAt(0).toUpperCase();
    return /[A-Z]/.test(firstChar) ? firstChar : "#";
  }

  function getLetterBuckets(articles) {
    const buckets = new Map();

    sortArticlesAlphabetically(articles).forEach((article) => {
      const letter = getInitialLetter(article);
      if (!buckets.has(letter)) buckets.set(letter, []);
      buckets.get(letter).push(article);
    });

    return Array.from(buckets.entries()).map(([letter, items]) => ({
      letter,
      slug: letter === "#" ? "0-9" : slugifyValue(letter),
      count: items.length,
      articles: items
    }));
  }

  function getTopCategoryLabels(articles, max = 3) {
    const counts = new Map();

    articles.forEach((article) => {
      const category = normalizeCategory(article.data.category);
      if (!category) return;
      counts.set(category, (counts.get(category) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en", { sensitivity: "base" }))
      .slice(0, max)
      .map(([name]) => name);
  }

  const browseGroupDefinitions = [
    {
      slug: "prophecy-world-events",
      name: "Prophecy and World Events",
      description: "Predictions, warnings, and spiritual readings of world events, social upheaval, and cycles of time.",
      exactCategories: ["prophecy", "prophecies", "prophecy & science", "prophecy & spirituality", "spiritual warnings"],
      keywords: ["prophecy", "predictions", "future", "world war", "earthquake", "covid", "taliban", "afghanistan", "climate", "virus", "warning", "kali yuga", "kalki", "bhabishya", "cataclysm", "pralay", "end times", "mars", "eclipse"]
    },
    {
      slug: "rituals-worship-festivals",
      name: "Rituals, Worship and Festivals",
      description: "Puja, homa, sacred observances, and ceremonial guidance for devotional practice.",
      exactCategories: ["rituals & yagyas", "prayers and chants"],
      keywords: ["puja", "homa", "homam", "yagya", "yajna", "ritual", "worship", "festival", "ashtami", "navratri", "durga puja", "kali puja", "shivratri", "annapurna", "falaharini", "ambubachi", "tritiya"]
    },
    {
      slug: "sacred-texts-scriptures",
      name: "Sacred Texts and Scriptures",
      description: "Stotrams, kavachams, sahasranamas, and scripture-focused articles meant for study and recitation.",
      exactCategories: ["temple of knowledge"],
      keywords: ["stotram", "stotra", "kavach", "kavacham", "ashtakam", "sahasranama", "lyrics", "meaning", "scripture", "gita", "veda", "upanishad", "commentary"]
    },
    {
      slug: "sadhana-tantra-mantra",
      name: "Sadhana, Tantra and Mantra",
      description: "Practices, mantra guidance, tantra teachings, and articles centered on inner discipline and sacred method.",
      exactCategories: ["sadhana"],
      keywords: ["sadhana", "tantra", "mantra", "yantra", "chakra", "kundalini", "diksha", "japa", "upasana", "bhairava sadhana", "kali sadhana", "agni chakra", "vairagya"]
    },
    {
      slug: "sacred-places-pilgrimage",
      name: "Sacred Places and Pilgrimage",
      description: "Temples, cremation grounds, pilgrimages, and location-based teachings tied to sacred geography.",
      exactCategories: ["sacred places"],
      keywords: ["tarapith", "tarapeeth", "kamakhya", "kashi", "varanasi", "temple", "shakti peeth", "pilgrimage", "shantikunj", "ujjain", "vindhyachal", "cremation ground", "smashan", "jyotirlinga"]
    },
    {
      slug: "guru-stories-devotee-lives",
      name: "Guru Stories and Devotee Lives",
      description: "Stories, testimonies, healing accounts, and life events centered on Gurudev and devotees.",
      exactCategories: ["guru stories", "miracle stories", "healing testimonies", "miracles & healing", "divine stories"],
      keywords: ["story", "stories", "testimony", "miracle", "healing", "devotee", "disciple", "friendship", "birthday", "celebration", "journey", "visit", "blessing"]
    },
    {
      slug: "discourses-practical-life",
      name: "Discourses, Questions & Practical Life",
      description: "Question-driven guidance, society, ethics, culture, and practical spiritual life in the modern world.",
      exactCategories: ["discourse", "guru messages", "social commentary", "health & wellness", "our roots", "history & spirituality", "patriotism & history", "science and spirituality"],
      keywords: ["question", "questions", "answering", "fans", "society", "social", "women", "family", "marriage", "education", "health", "science", "politics", "culture", "freedom", "rights", "practical"]
    },
    {
      slug: "spiritual-teachings-philosophy",
      name: "Spiritual Teachings and Philosophy",
      description: "Core teachings, philosophical reflections, and broad spiritual wisdom for self-directed study.",
      exactCategories: ["spiritual teachings", "philosophy"],
      keywords: ["atma", "brahma", "vedanta", "tattva", "dharma", "jnana", "wisdom", "truth", "realization", "conscience", "self", "soul"]
    }
  ];

  function scoreGroup(article, definition) {
    const category = normalizeCategory(article.data.category).toLowerCase();
    const tags = getArticleTags(article).map((tag) => tag.toLowerCase());
    const haystack = [
      article.fileSlug,
      getArticleTitle(article),
      getArticleDescription(article),
      category,
      tags.join(" ")
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;

    if (definition.exactCategories.includes(category)) {
      score += 4;
    }

    definition.keywords.forEach((keyword) => {
      if (haystack.includes(keyword)) score += 1;
    });

    return score;
  }

  function buildBrowseGroups(articles) {
    const preparedGroups = browseGroupDefinitions.map((definition) => ({
      ...definition,
      articles: []
    }));

    articles.forEach((article) => {
      let bestGroup = preparedGroups[preparedGroups.length - 1];
      let bestScore = -1;

      preparedGroups.forEach((group) => {
        const score = scoreGroup(article, group);
        if (score > bestScore) {
          bestScore = score;
          bestGroup = group;
        }
      });

      bestGroup.articles.push(article);
    });

    return preparedGroups
      .map((group) => {
        const groupArticles = sortArticlesAlphabetically(group.articles);
        const letterBuckets = getLetterBuckets(groupArticles);
        return {
          slug: group.slug,
          url: `/articles/topics/${group.slug}/`,
          name: group.name,
          description: group.description,
          count: groupArticles.length,
          categoryLabels: getTopCategoryLabels(groupArticles),
          letters: letterBuckets,
          articles: groupArticles
        };
      })
      .filter((group) => group.count > 0);
  }

  eleventyConfig.addCollection("articles", function(collectionApi) {
    return sortArticlesByDateDesc(getArticles(collectionApi));
  });

  eleventyConfig.addCollection("articlesAlpha", function(collectionApi) {
    return sortArticlesAlphabetically(getArticles(collectionApi));
  });

  eleventyConfig.addCollection("browseGroups", function(collectionApi) {
    return buildBrowseGroups(getArticles(collectionApi));
  });

  eleventyConfig.addCollection("allTags", function(collectionApi) {
    const articles = getArticles(collectionApi);
    const slugToTags = new Map();

    articles.forEach((item) => {
      getArticleTags(item).forEach((tag) => {
        const slug = slugifyValue(tag);
        if (!slugToTags.has(slug)) slugToTags.set(slug, new Set());
        slugToTags.get(slug).add(tag);
      });
    });

    return Array.from(slugToTags.values())
      .map((tags) => [...tags].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))[0])
      .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  });

  eleventyConfig.addCollection("all", function(collectionApi) {
    const articles = getArticles(collectionApi);
    const slugToTags = new Map();
    const slugToArticles = new Map();

    articles.forEach((item) => {
      getArticleTags(item).forEach((tag) => {
        const slug = slugifyValue(tag);
        if (!slugToTags.has(slug)) {
          slugToTags.set(slug, new Set());
          slugToArticles.set(slug, []);
        }
        slugToTags.get(slug).add(tag);
        if (!slugToArticles.get(slug).includes(item)) {
          slugToArticles.get(slug).push(item);
        }
      });
    });

    const result = {};
    slugToTags.forEach((tags, slug) => {
      const canonicalTag = [...tags].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))[0];
      result[canonicalTag] = sortArticlesByDateDesc(slugToArticles.get(slug));
    });

    return result;
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["md", "liquid", "html"],
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    dataTemplateEngine: "liquid"
  };
};
