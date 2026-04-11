module.exports = {
  data() {
    return {
      permalink: "/search-index.json",
      eleventyExcludeFromCollections: true
    };
  },
  render(data) {
    const articles = (data.collections.articles || []).map(a => {
      // Strip HTML tags from rendered content to enable full-text search
      const rawContent = (a.templateContent || "")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 1200);
      return {
        title: a.data.title || "",
        url: a.url,
        description: a.data.description || "",
        category: a.data.category || "",
        tags: (a.data.tags || []).filter(t => t !== "articles"),
        date: a.date instanceof Date ? a.date.toISOString().split('T')[0] : String(a.date),
        readingTime: a.data.readingTime || 0,
        content: rawContent
      };
    });
    return JSON.stringify(articles);
  }
};
