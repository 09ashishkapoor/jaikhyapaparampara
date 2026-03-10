module.exports = function(eleventyConfig) {
  
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
  
  // Copy sitemap to root after build completes
  eleventyConfig.on('eleventy.after', async ({ dir, results }) => {
    const fs = require('fs');
    const path = require('path');
    const sitemapSrc = path.join(dir.output, 'sitemap.xml');
    const sitemapDest = path.join('.', 'sitemap.xml');
    
    try {
      if (fs.existsSync(sitemapSrc)) {
        fs.copyFileSync(sitemapSrc, sitemapDest);
      }
    } catch (err) {
      console.error('Error copying sitemap:', err);
    }
  });
  
  // Add date filter for formatting dates
  eleventyConfig.addFilter("dateDisplay", (dateObj) => {
    return new Date(dateObj).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  });
  
  // Add ISO date filter for schema.org
  eleventyConfig.addFilter("isoDate", (dateObj) => {
    return new Date(dateObj).toISOString();
  });

  // Create a collection for articles
  eleventyConfig.addCollection("articles", function(collectionApi) {
    return collectionApi.getFilteredByGlob("articles/*.md").sort((a, b) => {
      const dateDiff = b.date - a.date;
      if (dateDiff !== 0) return dateDiff;
      // If dates are identical, sort by filename descending (usually newer files)
      return b.inputPath.localeCompare(a.inputPath);
    });
  });

  // Slugify helper - must match Nunjucks slugify for consistent permalinks
  function slugifyTag(str) {
    return String(str).toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  // Get all tags from articles (deduplicated by slug to avoid permalink conflicts)
  eleventyConfig.addCollection("allTags", function(collectionApi) {
    const articles = collectionApi.getFilteredByGlob("articles/*.md");
    const slugToTags = new Map(); // slug -> Set of tag names that slugify to it
    
    articles.forEach(item => {
      (item.data.tags || []).forEach(tag => {
        if (tag !== "articles" && typeof tag === 'string') {
          const slug = slugifyTag(tag);
          if (!slugToTags.has(slug)) slugToTags.set(slug, new Set());
          slugToTags.get(slug).add(tag);
        }
      });
    });

    // Use lexicographically first tag as canonical for consistency
    return Array.from(slugToTags.values())
      .map(tags => [...tags].sort()[0])
      .sort();
  });

  // Create collections for each tag dynamically (merge tags that slugify to same URL)
  eleventyConfig.addCollection("all", function(collectionApi) {
    const articles = collectionApi.getFilteredByGlob("articles/*.md");
    const slugToTags = new Map();   // slug -> Set of tag names
    const slugToArticles = new Map();  // slug -> articles array

    articles.forEach(item => {
      (item.data.tags || []).forEach(tag => {
        if (tag !== "articles") {
          const slug = slugifyTag(tag);
          if (!slugToTags.has(slug)) {
            slugToTags.set(slug, new Set());
            slugToArticles.set(slug, []);
          }
          slugToTags.get(slug).add(tag);
          if (!slugToArticles.get(slug).includes(item)) {
            slugToArticles.get(slug).push(item);
          }
        }
      });
    });

    // Sort articles within each tag by date (newest first)
    slugToArticles.forEach(articles => {
      articles.sort((a, b) => b.date - a.date);
    });

    // Use same canonical (lexicographically first) as allTags
    const result = {};
    slugToTags.forEach((tags, slug) => {
      const canonicalTag = [...tags].sort()[0];
      result[canonicalTag] = slugToArticles.get(slug);
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
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};
