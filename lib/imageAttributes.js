// ROADMAP Item 8 (D6). Give every local <img> an intrinsic width/height so the
// browser can reserve space before the bytes arrive (CLS), without touching the
// sacred-text sources under articles/.
//
// Dimensions come from _data/cache/images-cache.json, which `npm run images`
// regenerates from the files on disk. A page whose image is not in the manifest
// renders exactly as it did before this transform existed.
const fs = require("fs");
const path = require("path");

const CACHE_FILE = path.join(__dirname, "..", "_data", "cache", "images-cache.json");

let manifestCache = {};
let manifestMtime = -1;

function loadManifest() {
	try {
		const stat = fs.statSync(CACHE_FILE);
		if (stat.mtimeMs !== manifestMtime) {
			const parsed = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
			manifestCache = parsed && parsed.files ? parsed.files : {};
			manifestMtime = stat.mtimeMs;
		}
	} catch {
		// No manifest: leave HTML untouched rather than fail the build.
		manifestCache = {};
		manifestMtime = -1;
	}
	return manifestCache;
}

/** End index of the tag starting at `start`, respecting quoted attribute values. */
function findTagEnd(html, start) {
	let quote = "";
	for (let index = start; index < html.length; index += 1) {
		const char = html[index];
		if (quote) {
			if (char === quote) quote = "";
		} else if (char === '"' || char === "'") {
			quote = char;
		} else if (char === ">") {
			return index;
		}
	}
	return -1;
}

function readAttribute(tag, name) {
	const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(tag);
	if (!match) return null;
	return match[1] !== undefined ? match[1] : match[2];
}

// A width constraint without any height declaration is exactly the case where the
// presentational height hint would stretch the image (verified in Chromium: a
// 250px-wide float with height="1596" renders 250x1596 instead of 250x421).
function needsAutoHeight(style) {
	if (style == null) return false;
	const value = style.toLowerCase();
	const hasWidth = /(^|;)\s*(?:max-|min-)?width\s*:/.test(value);
	const hasHeight = /(^|;)\s*(?:max-|min-)?height\s*:/.test(value);
	return hasWidth && !hasHeight;
}

function localPath(src) {
	if (!src || !src.startsWith("/") || src.startsWith("//")) return null;
	return src.split(/[?#]/, 1)[0];
}

function rewriteImgTag(tag, sizes) {
	const src = localPath(readAttribute(tag, "src"));
	if (!src) return tag;

	const size = sizes[src];
	if (!size || !size.width || !size.height) return tag;

	const existingWidth = readAttribute(tag, "width");
	const existingHeight = readAttribute(tag, "height");
	const widthOk = /^\d+$/.test(existingWidth || "");
	const heightOk = /^\d+$/.test(existingHeight || "");
	if (widthOk && heightOk) return tag;

	let width = size.width;
	let height = size.height;
	if (widthOk) height = Math.round((Number(existingWidth) * size.height) / size.width);
	else if (heightOk) width = Math.round((Number(existingHeight) * size.width) / size.height);

	let updated = tag;
	const style = readAttribute(tag, "style");
	if (needsAutoHeight(style)) {
		const declarations = style.replace(/;\s*$/, "");
		updated = updated.replace(
			/(\sstyle\s*=\s*")([^"]*)(")/i,
			(_match, open, _value, close) => `${open}${declarations};height:auto${close}`,
		);
	}

	const closeMatch = /\/?>$/.exec(updated);
	if (!closeMatch) return tag;
	const prefix = updated.slice(0, closeMatch.index).replace(/\s+$/, "");
	const suffix = updated.slice(closeMatch.index);
	const attributes = [widthOk ? "" : `width="${width}"`, heightOk ? "" : `height="${height}"`]
		.filter(Boolean)
		.join(" ");
	return `${prefix} ${attributes}${suffix}`;
}

/**
 * Add intrinsic width/height to every local <img> that lacks them.
 * @param {string} html
 * @param {Record<string, {width: number, height: number}>} [sizes]
 */
function addImageDimensions(html, sizes = loadManifest()) {
	if (!html || !sizes || html.indexOf("<img") === -1) return html;

	const pattern = /<img\b/gi;
	let output = "";
	let cursor = 0;
	let match;
	while ((match = pattern.exec(html))) {
		const start = match.index;
		const end = findTagEnd(html, start);
		if (end === -1) break;
		const tag = html.slice(start, end + 1);
		output += html.slice(cursor, start) + rewriteImgTag(tag, sizes);
		cursor = end + 1;
		pattern.lastIndex = end + 1;
	}
	return output + html.slice(cursor);
}

module.exports = { addImageDimensions, rewriteImgTag, loadManifest, needsAutoHeight };
