const fs = require("fs");
const path = require("path");

const outputDir = path.resolve(process.argv[2] || "_site");
const baselineDir = process.argv[3] && path.resolve(process.argv[3]);
const failures = [];
const siteOrigin = "https://jaikhyapaparampara.com";
const redirects = new Set(
	fs.readFileSync(path.join(outputDir, "_redirects"), "utf8")
		.split(/\r?\n/)
		.filter((line) => line && !line.startsWith("#"))
		.map((line) => line.trim().split(/\s+/)[0]),
);

function readArticles(dir) {
	const articles = JSON.parse(
		fs.readFileSync(path.join(dir, "article-index.json"), "utf8"),
	);
	const urls = articles.map((article) => article.url);
	if (new Set(urls).size !== urls.length) {
		failures.push(`${dir}: duplicate article URLs in article-index.json`);
	}
	return new Map(articles.map((article) => [article.url, article]));
}

function articlePath(dir, url) {
	if (!/^\/articles\/[^?#]+\/$/.test(url) || url.includes("..")) {
		throw new Error(`Unexpected article URL: ${url}`);
	}
	return path.join(dir, url.slice(1), "index.html");
}

function articleParts(html, url) {
	const title = html.match(/<h1 class="article-title">([^<]+)<\/h1>/)?.[1];
	const content = html.split("<!-- Article Content -->")[1]?.split("<!-- Related Articles -->")[0];
	const canonical = `https://jaikhyapaparampara.com${url}`;
	if (!title?.trim()) failures.push(`${url}: missing article title`);
	if (!content || content.replace(/<[^>]*>/g, "").trim().length < 50) {
		failures.push(`${url}: missing or empty article body`);
	}
	if (!html.includes(`<link rel="canonical" href="${canonical}">`)) {
		failures.push(`${url}: missing canonical URL`);
	}
	return { title, content };
}

function checkInternalLinks(html, pageUrl) {
	const tags = html.match(/<(?:a|img)\b[^>]*>/gi) || [];
	for (const tag of tags) {
		const raw = tag.match(/\b(?:href|src)="([^"]+)"/i)?.[1];
		if (!raw || raw.startsWith("#")) continue;
		let target;
		try {
			target = new URL(raw.replaceAll("&amp;", "&"), siteOrigin + pageUrl);
		} catch {
			failures.push(`${pageUrl}: invalid link ${raw}`);
			continue;
		}
		if (target.origin !== siteOrigin) continue;
		const pathname = decodeURIComponent(target.pathname);
		if (redirects.has(pathname)) continue;
		const relative = pathname.replace(/^\//, "");
		const candidates = pathname.endsWith("/")
			? [path.join(outputDir, relative, "index.html")]
			: [
				path.join(outputDir, relative),
				path.join(outputDir, relative, "index.html"),
				path.join(outputDir, `${relative}.html`),
			];
		if (!candidates.some((candidate) => fs.existsSync(candidate))) {
			failures.push(`${pageUrl}: broken internal link ${raw}`);
		}
	}
}

const current = readArticles(outputDir);
const baseline = baselineDir && readArticles(baselineDir);
let changedTagFooters = 0;

for (const [url] of current) {
	const file = articlePath(outputDir, url);
	if (!fs.existsSync(file)) {
		failures.push(`${url}: generated page is missing`);
		continue;
	}
	const currentHtml = fs.readFileSync(file, "utf8");
	const currentParts = articleParts(currentHtml, url);
	checkInternalLinks(currentHtml, url);
	if (!baseline?.has(url)) continue;
	const oldHtml = fs.readFileSync(articlePath(baselineDir, url), "utf8");
	const oldParts = articleParts(oldHtml, url);
	if (currentParts.title !== oldParts.title) failures.push(`${url}: title changed`);
	if (currentParts.content !== oldParts.content) failures.push(`${url}: article body changed`);
	if (currentHtml !== oldHtml) {
		const withoutTags = (html) =>
			html.replace(/<div class="article-tags">[\s\S]*?<\/div>/, "<div class=\"article-tags\"></div>");
		if (withoutTags(currentHtml) !== withoutTags(oldHtml)) {
			failures.push(`${url}: page HTML changed outside the tag footer`);
		} else {
			changedTagFooters++;
		}
	}
}

if (baseline) {
	for (const url of baseline.keys()) {
		if (!current.has(url)) failures.push(`${url}: article URL disappeared`);
	}
	for (const url of current.keys()) {
		if (!baseline.has(url)) failures.push(`${url}: new article URL appeared`);
	}
}

console.log(
	`Checked ${current.size} generated articles${baseline ? ` against ${baseline.size} baseline articles` : ""}.`,
);
if (baseline) console.log(`${changedTagFooters} tag footers changed after the slugify upgrade.`);
if (failures.length) {
	console.error(failures.slice(0, 50).join("\n"));
	if (failures.length > 50) console.error(`...and ${failures.length - 50} more failures`);
	process.exitCode = 1;
} else {
	console.log("Article URLs, titles, bodies, canonical links, and internal links passed.");
}
