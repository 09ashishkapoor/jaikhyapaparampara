module.exports = {
  data() {
    return {
      permalink: "/search-index.json",
      eleventyExcludeFromCollections: true
    };
  },
  render(data) {
    const articles = (data.collections.articles || []).map(a => ({
      title: a.data.title || "",
      url: a.url,
      description: a.data.description || "",
      category: a.data.category || "",
      tags: (a.data.tags || []).filter(t => t !== "articles"),
      date: a.date instanceof Date ? a.date.toISOString().split('T')[0] : String(a.date),
      readingTime: a.data.readingTime || 0
    }));
    return JSON.stringify(articles);
  }
};
