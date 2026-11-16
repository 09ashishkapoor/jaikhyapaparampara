// One absolute social image per page. Both head layouts read this value, so the
// OG/Twitter tags and the Article JSON-LD cannot drift apart again.
//
// Priority: explicit `ogImage` frontmatter override -> generated article card
// (images/og/<slug>.jpg) -> legacy `featuredImage` -> site default.
const fs = require("fs");
const path = require("path");

const SITE_ORIGIN = "https://jaikhyapaparampara.com";
const DEFAULT_IMAGE = "/Bama_Khepa.webp";
const DEFAULT_ALT = "Bama Khepa — Jai Khyapa Parampara";
const CARD_DIR = path.join(__dirname, "..", "images", "og");

function absoluteUrl(value) {
	const text = String(value || "").trim();
	if (!text) return `${SITE_ORIGIN}${DEFAULT_IMAGE}`;
	if (/^https?:\/\//i.test(text)) return text;
	if (text.startsWith("//")) return `https:${text}`;
	return `${SITE_ORIGIN}${text.startsWith("/") ? "" : "/"}${text}`;
}

function articleCardUrl(data) {
	if (data.layout !== "article") return "";
	const slug = data.page && data.page.fileSlug;
	if (!slug) return "";
	if (!fs.existsSync(path.join(CARD_DIR, `${slug}.jpg`))) return "";
	return `/images/og/${slug}.jpg`;
}

module.exports = {
	socialImage(data) {
		if (data.ogImage) return absoluteUrl(data.ogImage);
		const card = articleCardUrl(data);
		if (card) return absoluteUrl(card);
		if (data.featuredImage) return absoluteUrl(data.featuredImage);
		return absoluteUrl(DEFAULT_IMAGE);
	},
	socialImageAlt(data) {
		if (data.ogImageAlt) return data.ogImageAlt;
		if (data.layout === "article" && data.title) return data.title;
		return DEFAULT_ALT;
	},
};
