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
      day: 'numeric'
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

  // Get all tags from articles
  eleventyConfig.addCollection("allTags", function(collectionApi) {
    const articles = collectionApi.getFilteredByGlob("articles/*.md");
    const tagSet = new Set();
    
    articles.forEach(item => {
      (item.data.tags || []).forEach(tag => {
        if (tag !== "articles") {
          tagSet.add(tag);
        }
      });
    });

    return Array.from(tagSet).sort();
  });

  // Create collections for each tag dynamically
  eleventyConfig.addCollection("all", function(collectionApi) {
    const articles = collectionApi.getFilteredByGlob("articles/*.md");
    
    // Get all unique tags and group articles by tag
    const tagMap = new Map();
    articles.forEach(item => {
      (item.data.tags || []).forEach(tag => {
        if (tag !== "articles") {
          if (!tagMap.has(tag)) {
            tagMap.set(tag, []);
          }
          tagMap.get(tag).push(item);
        }
      });
    });

    // Sort articles within each tag by date (newest first)
    tagMap.forEach(tagArticles => {
      tagArticles.sort((a, b) => b.date - a.date);
    });

    // Return as object so templates can access collections.all[tagName]
    const result = {};
    tagMap.forEach((articles, tag) => {
      result[tag] = articles;
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
