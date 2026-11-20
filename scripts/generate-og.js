#!/usr/bin/env node
// Pre-generate the 1200x630 Open Graph cards committed to images/og/.
//
//   npm run og              incremental: only missing or changed cards
//   npm run og -- --force   re-render every card
//   npm run og -- --check   exit 1 if any card is missing or stale
//   npm run og -- --only <slug> [--limit N]
//
// Cards are keyed by article file slug (the same slug as the page URL). The
// cache lives in _data/cache/og-cache.json and is committed so a fresh clone
// does not re-render 1,205 unchanged cards.
//
// Guardrails: writes only into images/og/. It never reads or writes the gallery
// masters, and it only deletes files it generated itself (--force/full runs
// prune cards whose article no longer exists).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const matter = require("gray-matter");
const sharp = require("sharp");
const satori = require("satori").default;
const { Resvg } = require("@resvg/resvg-js");
const { categoryLabel } = require("../lib/taxonomy.js");

const ROOT = path.join(__dirname, "..");
const ARTICLE_DIR = path.join(ROOT, "articles");
const CARD_DIR = path.join(ROOT, "images", "og");
// Temp files must live outside images/: Eleventy passthrough-copies that tree
// and a transient .tmp file would race the copy.
const TMP_DIR = path.join(ROOT, "_data", "cache", "og-tmp");
const CACHE_FILE = path.join(ROOT, "_data", "cache", "og-cache.json");
const FONT_DIR = path.join(__dirname, "og-fonts");
const CARD_VERSION = 2;
const WIDTH = 1200;
const HEIGHT = 630;
const CONCURRENCY = 4;

const FONT_FILES = [
	{ file: "Philosopher-Bold.ttf", name: "Philosopher", weight: 700 },
	{ file: "Philosopher-Regular.ttf", name: "Philosopher", weight: 400 },
	{ file: "CrimsonText-SemiBold.ttf", name: "Crimson Text", weight: 600 },
	{ file: "CrimsonText-Regular.ttf", name: "Crimson Text", weight: 400 },
];

function parseArgs(argv) {
	const args = { force: false, check: false, only: "", limit: 0 };
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--force") args.force = true;
		else if (arg === "--check") args.check = true;
		else if (arg === "--only") args.only = String(argv[++i] || "");
		else if (arg === "--limit") args.limit = Number(argv[++i]) || 0;
		else if (arg === "--help" || arg === "-h") {
			console.log(
				"Usage: node scripts/generate-og.js [--force] [--check] [--only <slug>] [--limit N]",
			);
			process.exit(0);
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}
	return args;
}

function loadFonts() {
	return FONT_FILES.map((font) => {
		const file = path.join(FONT_DIR, font.file);
		const data = fs.readFileSync(file);
		return { ...font, data };
	});
}

function fontSignature(fonts) {
	const hash = crypto.createHash("sha1");
	for (const font of fonts) {
		hash.update(font.file);
		hash.update(font.data);
	}
	return hash.digest("hex").slice(0, 16);
}

function titleFontSize(title) {
	// The numbered namavali now displays long compounds as joined names.
	// Satori can clip a single unbroken word before the rest of the title wraps.
	if (/^Kalabhairava Name \d+:/.test(title) && /\S{36}/.test(title)) return 40;
	const length = title.length;
	if (length <= 45) return 76;
	if (length <= 65) return 66;
	if (length <= 85) return 58;
	if (length <= 110) return 50;
	return 44;
}

function element(type, style, ...children) {
	return {
		type,
		props: {
			style,
			children: children.length === 1 ? children[0] : children,
		},
	};
}

function buildCard(title, category) {
	const titleSize = titleFontSize(title);
	// Card frame is inset 26px; content sits 54px inside the 1px frame border.
	const contentLeft = "81px";
	const contentWidth = "1038px";
	return element(
		"div",
		{
			width: `${WIDTH}px`,
			height: `${HEIGHT}px`,
			display: "flex",
			position: "relative",
			backgroundColor: "#1F0B11",
			backgroundImage:
				"linear-gradient(150deg, #2E1019 0%, #1F0B11 52%, #0B0406 100%)",
			color: "#F0DCC8",
			fontFamily: "Crimson Text",
		},
		element("div", {
			position: "absolute",
			top: "26px",
			left: "26px",
			right: "26px",
			bottom: "26px",
			border: "1px solid rgba(232,196,104,0.38)",
		}),
		element(
			"div",
			{
				position: "absolute",
				top: "70px",
				left: contentLeft,
				width: contentWidth,
				display: "flex",
				justifyContent: "space-between",
				alignItems: "flex-start",
			},
			element(
				"div",
				{ display: "flex", flexDirection: "column" },
				element(
					"div",
					{
						fontFamily: "Philosopher",
						fontWeight: 700,
						fontSize: "19px",
						letterSpacing: "7px",
						color: "#E8C468",
					},
					"JAI KHYAPA PARAMPARA",
				),
				element(
					"div",
					{
						marginTop: "10px",
						fontWeight: 600,
						fontSize: "18px",
						letterSpacing: "4px",
						color: "rgba(240,220,200,0.58)",
					},
					"SACRED KNOWLEDGE ARCHIVE",
				),
			),
			element(
				"div",
				{
					display: "flex",
					padding: "8px 20px",
					border: "1px solid rgba(232,196,104,0.5)",
					borderRadius: "999px",
					fontWeight: 600,
					fontSize: "20px",
					color: "#E8C468",
					maxWidth: "400px",
				},
				category,
			),
		),
		element(
			"div",
			{
				position: "absolute",
				top: "170px",
				left: contentLeft,
				width: contentWidth,
				height: "300px",
				display: "flex",
				alignItems: "center",
			},
			element(
				"div",
				{
					display: "flex",
					maxWidth: "1000px",
					overflow: "hidden",
					fontFamily: "Philosopher",
					fontWeight: 700,
					fontSize: `${titleSize}px`,
					lineHeight: 1.18,
					lineClamp: 5,
					overflowWrap: "break-word",
					textOverflow: "ellipsis",
					color: "#F4E4C1",
				},
				title,
			),
		),
		element(
			"div",
			{
				position: "absolute",
				bottom: "64px",
				left: contentLeft,
				width: contentWidth,
				display: "flex",
				flexDirection: "column",
			},
			element("div", {
				height: "1px",
				backgroundColor: "rgba(232,196,104,0.28)",
			}),
			element(
				"div",
				{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginTop: "16px",
					fontSize: "21px",
					color: "rgba(240,220,200,0.66)",
				},
				element("div", { display: "flex" }, "jaikhyapaparampara.com"),
				element("div", { display: "flex", color: "#E8C468" }, "Jai Ma Adya Mahakali"),
			),
		),
	);
}

function readArticles() {
	return fs
		.readdirSync(ARTICLE_DIR)
		.filter((file) => file.endsWith(".md"))
		.map((file) => {
			const slug = file.slice(0, -3);
			const source = fs.readFileSync(path.join(ARTICLE_DIR, file), "utf8");
			const data = matter(source).data || {};
			const title = String(data.title || data.breadcrumbTitle || "").trim();
			if (!title) throw new Error(`${file}: missing title`);
			const category = categoryLabel(data.category);
			return { slug, title, category };
		})
		.sort((a, b) => a.slug.localeCompare(b.slug));
}

function contentHash(article, signature) {
	return crypto
		.createHash("sha1")
		.update(
			JSON.stringify([
				CARD_VERSION,
				signature,
				article.title,
				article.category,
			]),
		)
		.digest("hex")
		.slice(0, 12);
}

function loadCache() {
	try {
		const parsed = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
		if (parsed && typeof parsed.cards === "object") return parsed;
	} catch {
		// Missing or unreadable cache means a full render; never a hard failure.
	}
	return { version: 1, fontHash: "", cards: {} };
}

function saveCache(fontHash, cards) {
	fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
	const keys = Object.keys(cards).sort();
	const lines = keys.map(
		(key) => `    ${JSON.stringify(key)}: ${JSON.stringify(cards[key])}`,
	);
	const text = [
		"{",
		'  "version": 1,',
		`  "fontHash": ${JSON.stringify(fontHash)},`,
		'  "cards": {',
		lines.join(",\n"),
		"  }",
		"}",
		"",
	].join("\n");
	fs.writeFileSync(CACHE_FILE, text, "utf8");
}

async function renderCard(article, fonts) {
	const svg = await satori(buildCard(article.title, article.category), {
		width: WIDTH,
		height: HEIGHT,
		fonts: fonts.map(({ name, data, weight }) => ({
			name,
			data,
			weight,
			style: "normal",
		})),
	});
	const png = new Resvg(svg, {
		fitTo: { mode: "width", value: WIDTH },
	}).render().asPng();
	const output = path.join(CARD_DIR, `${article.slug}.jpg`);
	const tmp = path.join(TMP_DIR, `${article.slug}.tmp`);
	await sharp(png)
		.jpeg({ quality: 80, mozjpeg: true, chromaSubsampling: "4:4:4" })
		.toFile(tmp);
	fs.renameSync(tmp, output);
}

async function runPool(items, worker, size) {
	let index = 0;
	const runners = Array.from(
		{ length: Math.min(size, items.length) },
		async () => {
			while (index < items.length) {
				const current = index;
				index += 1;
				await worker(items[current]);
			}
		},
	);
	await Promise.all(runners);
}

function pruneCards(expectedSlugs, cache) {
	fs.mkdirSync(CARD_DIR, { recursive: true });
	let removed = 0;
	for (const file of fs.readdirSync(CARD_DIR)) {
		if (!file.endsWith(".jpg")) continue;
		const slug = file.slice(0, -4);
		if (!expectedSlugs.has(slug)) {
			fs.rmSync(path.join(CARD_DIR, file));
			removed += 1;
		}
	}
	for (const slug of Object.keys(cache.cards)) {
		if (!expectedSlugs.has(slug)) delete cache.cards[slug];
	}
	return removed;
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const fonts = loadFonts();
	const signature = fontSignature(fonts);
	fs.mkdirSync(CARD_DIR, { recursive: true });
	fs.mkdirSync(TMP_DIR, { recursive: true });

	const allArticles = readArticles();
	let articles = allArticles;
	if (args.only) articles = articles.filter((a) => a.slug === args.only);
	if (args.limit > 0) articles = articles.slice(0, args.limit);
	if (args.only && articles.length === 0) {
		throw new Error(`No article with slug "${args.only}"`);
	}

	const cache = loadCache();
	const cacheUseful = cache.fontHash === signature;
	const jobs = articles.map((article) => {
		const hash = contentHash(article, signature);
		const output = path.join(CARD_DIR, `${article.slug}.jpg`);
		const fresh =
			cacheUseful &&
			!args.force &&
			cache.cards[article.slug] === hash &&
			fs.existsSync(output);
		return { article, hash, output, fresh };
	});

	if (args.check) {
		const stale = jobs.filter((job) => !job.fresh);
		for (const job of stale) {
			console.log(`${fs.existsSync(job.output) ? "stale" : "missing"}  ${job.article.slug}`);
		}
		const expected = new Set(allArticles.map((a) => a.slug));
		const orphans = fs
			.readdirSync(CARD_DIR)
			.filter((file) => file.endsWith(".jpg"))
			.map((file) => file.slice(0, -4))
			.filter((slug) => !expected.has(slug));
		for (const slug of orphans) console.log(`orphan  ${slug}`);
		const total = stale.length + orphans.length;
		console.log(
			`${allArticles.length} articles, ${total} card(s) need attention${total ? "" : " — all current"}`,
		);
		process.exit(total ? 1 : 0);
	}

	const pending = jobs.filter((job) => !job.fresh);
	if (pending.length === 0) {
		console.log(`OG cards: all ${jobs.length} current.`);
	} else {
		console.log(
			`OG cards: rendering ${pending.length} of ${jobs.length} (${jobs.length - pending.length} cached).`,
		);
		let done = 0;
		const failures = [];
		await runPool(
			pending,
			async (job) => {
				try {
					await renderCard(job.article, fonts);
					cache.cards[job.article.slug] = job.hash;
				} catch (error) {
					failures.push({ slug: job.article.slug, error });
				}
				done += 1;
				if (done % 100 === 0 || done === pending.length) {
					console.log(`  ${done}/${pending.length}`);
				}
			},
			CONCURRENCY,
		);
		if (failures.length) {
			for (const failure of failures) {
				console.error(`FAILED ${failure.slug}: ${failure.error.message}`);
			}
			throw new Error(`${failures.length} card(s) failed to render`);
		}
	}

	// A full run keeps the repo honest: drop cards for deleted articles. Scoped
	// runs (--only/--limit) leave everything else alone.
	if (!args.only && !args.limit) {
		const expected = new Set(allArticles.map((a) => a.slug));
		const removed = pruneCards(expected, cache);
		if (removed) console.log(`Pruned ${removed} orphaned card(s).`);
	}

	cache.fontHash = signature;
	saveCache(signature, cache.cards);
	const bytes = fs
		.readdirSync(CARD_DIR)
		.filter((file) => file.endsWith(".jpg"))
		.reduce((total, file) => total + fs.statSync(path.join(CARD_DIR, file)).size, 0);
	console.log(
		`OG cards: ${Object.keys(cache.cards).length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB in images/og/.`,
	);
}

if (require.main === module) {
	main().catch((error) => {
		console.error(error.stack || error.message);
		process.exit(1);
	});
}

module.exports = { buildCard, titleFontSize };
