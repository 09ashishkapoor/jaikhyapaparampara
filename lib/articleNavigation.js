const { categoryTopicSlug } = require("./taxonomy.js");

const siteOrigin = "https://jaikhyapaparampara.com";
const maxRelated = 6;
const numberedKalabhairavaName = /^\/articles\/kalabhairava-name-(\d{3})-[^/]+\/$/;
const articleUrl = (slug) => `/articles/${slug}/`;

function articleLinksIn(html, currentUrl) {
	const links = new Set();
	const markup = String(html || "").replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
	for (const [anchor] of markup.matchAll(/<a(?=\s|>)(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
		for (const [, attribute, doubleQuoted, singleQuoted, unquoted] of anchor.matchAll(
			/\s+([^\s=/"'<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g,
		)) {
			if (attribute.toLowerCase() !== "href") continue;
			try {
				const target = new URL(doubleQuoted ?? singleQuoted ?? unquoted ?? "", siteOrigin + currentUrl);
				if (target.origin !== siteOrigin) break;
				const pathname = target.pathname.replace(/\/index\.html$/, "/").replace(/\/?$/, "/");
				if (/^\/articles\/[^/]+\/$/.test(pathname) && pathname !== currentUrl) links.add(pathname);
			} catch {
				// Out-of-scope or invalid links are handled by the archive checker.
			}
			break;
		}
	}
	return links;
}

function normalizedTags(tags) {
	return [...new Set((Array.isArray(tags) ? tags : [])
		.filter((tag) => typeof tag === "string")
		.map((tag) => tag.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase())
		.filter((tag) => tag && tag !== "articles"))];
}

function buildArticleNavigation(articles, readingPaths, groups = []) {
	const entries = new Map();
	const byTag = new Map();
	const membership = new Map();
	const topicByUrl = new Map(groups.flatMap((group) =>
		group.articles.map(({ url }) => [url, group.slug]),
	));

	for (const article of articles) {
		const tags = normalizedTags(article.data.tags);
		const entry = {
			article,
			tags,
			topic: topicByUrl.get(article.url) || categoryTopicSlug(article.data.category),
			date: +new Date(article.date) || 0,
			family: null,
			order: 0,
		};
		const numberedName = numberedKalabhairavaName.exec(article.url);
		if (numberedName) {
			// These pages already carry hand-authored previous/next links. Group
			// their recommendations without replacing their authored navigation.
			entry.family = "kalabhairava-names";
			entry.order = Number(numberedName[1]);
		}
		entries.set(article.url, entry);
		for (const tag of tags) {
			if (!byTag.has(tag)) byTag.set(tag, []);
			byTag.get(tag).push(entry);
		}
	}

	for (const [pathIndex, path] of readingPaths.entries()) {
		if (!path.title || path.slugs.length < 2) throw new Error("Reading paths need a title and two or more articles.");
		const steps = path.slugs.map((slug, order) => {
			const url = articleUrl(slug);
			const entry = entries.get(url);
			if (!entry) throw new Error(`Reading path "${path.title}" links to a missing article: ${url}`);
			if (membership.has(url)) throw new Error(`Article belongs to multiple reading paths: ${url}`);
			membership.set(url, { path, order });
			entry.family = `reading-path-${pathIndex}`;
			entry.order = order;
			return entry.article;
		});
		for (const article of steps) membership.get(article.url).steps = steps;
	}

	// Archive-wide boilerplate is not a recommendation signal. Among usable
	// tags, a more specific overlap counts for more than a common one.
	const boilerplate = Math.max(10, Math.ceil(articles.length / 3));
	const tagScores = new Map();
	for (const [tag, matches] of byTag) {
		if (matches.length > 1 && matches.length < boilerplate) {
			tagScores.set(tag, Math.log1p(articles.length / matches.length));
		}
	}

	return (currentUrl, content) => {
		const current = entries.get(currentUrl);
		if (!current) return { seriesLinks: [], related: [] };
		const bodyLinks = articleLinksIn(content, currentUrl);
		const series = membership.get(currentUrl);
		const seriesLinks = series ? [
			{ direction: "Previous in this series", article: series.steps[series.order - 1] },
			{ direction: "Next in this series", article: series.steps[series.order + 1] },
		].filter(({ article }) => article && !bodyLinks.has(article.url)) : [];

		const scores = new Map();
		for (const tag of current.tags) {
			const weight = tagScores.get(tag);
			if (!weight) continue;
			for (const candidate of byTag.get(tag)) {
				if (candidate === current || bodyLinks.has(candidate.article.url)) continue;
				if (current.family && candidate.family === current.family) continue;
				scores.set(candidate, (scores.get(candidate) || 0) + weight);
			}
		}
		const sameTopic = (entry) => Boolean(current.topic && entry.topic === current.topic);
		const compareRelevance = (a, b) => scores.get(b) - scores.get(a) || Number(sameTopic(b)) - Number(sameTopic(a));
		const compare = (a, b) =>
			compareRelevance(a, b) || b.date - a.date || a.article.url.localeCompare(b.article.url, "en");
		const bestByFamily = new Map();
		const suggestions = [];
		for (const candidate of scores.keys()) {
			if (!candidate.family) {
				suggestions.push(candidate);
				continue;
			}
			const best = bestByFamily.get(candidate.family);
			if (!best || (compareRelevance(candidate, best) || candidate.order - best.order) < 0) {
				bestByFamily.set(candidate.family, candidate);
			}
		}

		return {
			seriesTitle: series?.path.title,
			seriesLinks,
			related: suggestions.concat([...bestByFamily.values()]).sort(compare).slice(0, maxRelated).map((entry) => entry.article),
		};
	};
}

module.exports = { articleLinksIn, articleUrl, buildArticleNavigation };
