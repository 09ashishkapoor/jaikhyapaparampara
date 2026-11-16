#!/usr/bin/env node
// ROADMAP Item 8 (D6 + D7). Two jobs, one script:
//
//   1. Generate the gallery lightbox derivatives declared as `viewer` in
//      _data/galleryImages.js. A viewer is the largest width at or below
//      min(2048, native) — never an upscale — and it is what the lightbox loads
//      instead of a 1200/1600 px variant that used to downscale 13 works.
//   2. Refresh _data/cache/images-cache.json, the size manifest the Eleventy
//      build reads to emit intrinsic width/height on every local <img> (D6).
//
//   npm run images              generate what is missing or stale, refresh manifest
//   npm run images -- --check   exit 1 if a derivative or manifest entry is stale
//   npm run images -- --force   re-encode every declared viewer
//
// Guardrails (ROADMAP §10, AGENTS.md rule 2):
//   * reads images/gallery/<master> only and never writes to a master;
//   * every output is <file>-<width>.webp inside images/gallery/responsive/,
//     a separate directory, and the target path is asserted before the rename;
//   * declared widths never exceed the master's native width (no upscaling);
//   * writes a content hash per derivative so re-runs only touch changed files,
//     and two runs with nothing to do produce identical bytes and a byte-identical
//     cache file;
//   * never resizes, re-encodes over, or deletes a gallery original.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const GALLERY_DIR = path.join(ROOT, "images", "gallery");
const RESPONSIVE_DIR = path.join(GALLERY_DIR, "responsive");
// Temp files live under _data/, never under images/: Eleventy passthrough-copies
// that tree and a transient file would race the copy.
const TMP_DIR = path.join(ROOT, "_data", "cache", "images-tmp");
const CACHE_FILE = path.join(ROOT, "_data", "cache", "images-cache.json");
const CACHE_VERSION = 1;
// Bump to force every viewer derivative to be re-encoded.
const ENCODER_VERSION = 1;
const VIEWER_MAX_WIDTH = 2048;
const QUALITY = 80;
const CONCURRENCY = 2;
// images/og/ holds 1,205 generated social cards. They are never <img> sources,
// so probing them would only slow the run down.
const SKIP_DIRS = new Set(["og"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"]);

function parseArgs(argv) {
	const args = { check: false, force: false };
	for (const arg of argv) {
		if (arg === "--check") args.check = true;
		else if (arg === "--force") args.force = true;
		else if (arg === "--help" || arg === "-h") {
			console.log(
				"Usage: node scripts/optimize-images.js [--check] [--force]\n" +
					"  (no flags)  generate missing/stale viewers and refresh the manifest\n" +
					"  --check     verify derivatives and manifest; exit 1 on any drift\n" +
					"  --force     re-encode every declared viewer derivative",
			);
			process.exit(0);
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}
	if (args.check && args.force) {
		throw new Error("--check and --force cannot be combined");
	}
	return args;
}

function urlPath(file) {
	return `/${path.relative(ROOT, file).split(path.sep).join("/")}`;
}

function isImageFile(file) {
	return IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase());
}

/**
 * Drop files git ignores. A few root-level images are deliberately untracked, so
 * including them would put paths in the committed manifest that a fresh clone
 * does not have — and `npm run images:check` would then report them as gone.
 */
function filterGitIgnored(files) {
	if (!files.length) return files;
	const relative = files.map((file) => path.relative(ROOT, file));
	try {
		const output = execFileSync("git", ["check-ignore", "--stdin", "-z"], {
			cwd: ROOT,
			input: `${relative.join("\0")}\0`,
			encoding: "utf8",
			maxBuffer: 32 * 1024 * 1024,
		});
		const ignored = new Set(output.split("\0").filter(Boolean));
		return files.filter((file, index) => !ignored.has(relative[index]));
	} catch {
		// Exit code 1 means "nothing is ignored"; a missing git is not fatal either.
		return files;
	}
}

/** Every local file that could be an <img> source: images/ (minus og/) + repo root. */
function listImageSources() {
	const files = [];

	const walk = (dir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			if (entry.isDirectory()) {
				if (dir === path.join(ROOT, "images") && SKIP_DIRS.has(entry.name)) continue;
				walk(path.join(dir, entry.name));
			} else if (entry.isFile() && isImageFile(entry.name)) {
				files.push(path.join(dir, entry.name));
			}
		}
	};
	walk(path.join(ROOT, "images"));

	for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
		if (entry.isFile() && isImageFile(entry.name)) files.push(path.join(ROOT, entry.name));
	}

	return filterGitIgnored(files).sort((a, b) => urlPath(a).localeCompare(urlPath(b)));
}

async function probe(file) {
	try {
		const meta = await sharp(file).metadata();
		if (!meta.width || !meta.height) return null;
		return {
			width: meta.width,
			height: meta.height,
			bytes: fs.statSync(file).size,
		};
	} catch {
		return null;
	}
}

async function sha1(file) {
	const hash = crypto.createHash("sha1");
	hash.update(fs.readFileSync(file));
	return hash.digest("hex");
}

function viewerHash(sourceHash, width) {
	return crypto
		.createHash("sha1")
		.update(
			JSON.stringify([CACHE_VERSION, ENCODER_VERSION, QUALITY, width, sourceHash]),
		)
		.digest("hex")
		.slice(0, 16);
}

/**
 * Resolve the `viewer` declarations against the gallery data.
 *
 * data-full already falls back to the master when the largest variant is under
 * 1200 px, so only a work carrying a 1200/1600 px variant can be downscaled in
 * the lightbox. Those are exactly the works that must declare a viewer.
 */
function collectViewerJobs(images) {
	const jobs = [];
	const problems = [];

	for (const image of images) {
		const source = path.join(ROOT, String(image.original || "").replace(/^\/+/, ""));
		const variants = Array.isArray(image.variants) ? image.variants : [];
		const maxVariant = variants.length ? variants[variants.length - 1] : 0;
		const nativeWidth = Number(image.width) || 0;
		const needsViewer = maxVariant >= 1200 && nativeWidth > maxVariant;
		const expectedWidth = Math.min(VIEWER_MAX_WIDTH, nativeWidth);

		if (!fs.existsSync(source)) {
			problems.push(`${image.file}: master not found at ${urlPath(source)}`);
			continue;
		}

		if (!image.viewer) {
			if (needsViewer) {
				problems.push(
					`${image.file}: no viewer declared (native ${nativeWidth}px, largest variant ${maxVariant}px)`,
				);
			}
			continue;
		}

		if (!needsViewer) {
			problems.push(
				`${image.file}: viewer declared but the master is ${nativeWidth}px and the largest variant is ${maxVariant}px`,
			);
			continue;
		}

		const match = /-(\d+)\.webp$/.exec(image.viewer);
		if (!match) {
			problems.push(`${image.file}: viewer must end in -<width>.webp`);
			continue;
		}

		const width = Number(match[1]);
		if (width !== expectedWidth) {
			problems.push(
				`${image.file}: viewer is ${width}px, expected ${expectedWidth}px (min(${VIEWER_MAX_WIDTH}, native ${nativeWidth}))`,
			);
			continue;
		}

		const output = path.join(ROOT, image.viewer.replace(/^\/+/, ""));
		if (path.dirname(output) !== RESPONSIVE_DIR) {
			problems.push(
				`${image.file}: viewer must live in images/gallery/responsive/ (got ${urlPath(output)})`,
			);
			continue;
		}

		jobs.push({ image, source, output, width, url: image.viewer });
	}

	return { jobs, problems };
}

async function runPool(items, worker, size) {
	let index = 0;
	const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
		while (index < items.length) {
			const current = index;
			index += 1;
			await worker(items[current]);
		}
	});
	await Promise.all(runners);
}

async function encodeViewer(job) {
	// Encode to memory, not straight to the destination: libvips memory-maps
	// files it opens on Windows, and a mapped file cannot be renamed (EBUSY).
	const buffer = await sharp(job.source)
		.rotate()
		.resize({ width: job.width, withoutEnlargement: true })
		.webp({ quality: QUALITY, effort: 4 })
		.toBuffer();

	const meta = await sharp(buffer).metadata();
	if (meta.width !== job.width) {
		throw new Error(
			`${job.image.file}: encoded ${meta.width}px, expected ${job.width}px`,
		);
	}

	// Guardrail: the destination is a derivative directory, never a master.
	if (path.dirname(job.output) !== RESPONSIVE_DIR) {
		throw new Error(`refusing to write outside ${urlPath(RESPONSIVE_DIR)}: ${job.output}`);
	}

	fs.mkdirSync(TMP_DIR, { recursive: true });
	const tmp = path.join(TMP_DIR, `${path.basename(job.output)}.tmp`);
	fs.writeFileSync(tmp, buffer);
	await renameWithRetry(tmp, job.output);
	return { width: meta.width, height: meta.height };
}

/** Windows virus scanners and indexers can hold a fresh file briefly. */
async function renameWithRetry(from, to, attempts = 6) {
	for (let attempt = 1; ; attempt += 1) {
		try {
			fs.renameSync(from, to);
			return;
		} catch (error) {
			const transient = ["EBUSY", "EPERM", "EACCES"].includes(error.code);
			if (!transient || attempt >= attempts) throw error;
			await new Promise((resolve) => setTimeout(resolve, attempt * 100));
		}
	}
}

function loadCache() {
	try {
		const parsed = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
		if (parsed && parsed.files && parsed.viewers && parsed.version === CACHE_VERSION) {
			return parsed;
		}
	} catch {
		// Missing or unreadable cache means a full rebuild; never a hard failure.
	}
	return { version: CACHE_VERSION, encoderVersion: ENCODER_VERSION, quality: QUALITY, viewers: {}, files: {} };
}

function serializeJson(value) {
	return `${JSON.stringify(value, null, 2)}\n`;
}

function writeCache(cache) {
	fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
	const sortedFiles = {};
	for (const key of Object.keys(cache.files).sort()) sortedFiles[key] = cache.files[key];
	const sortedViewers = {};
	for (const key of Object.keys(cache.viewers).sort()) sortedViewers[key] = cache.viewers[key];
	fs.writeFileSync(
		CACHE_FILE,
		serializeJson({
			version: CACHE_VERSION,
			encoderVersion: ENCODER_VERSION,
			quality: QUALITY,
			viewerMaxWidth: VIEWER_MAX_WIDTH,
			viewers: sortedViewers,
			files: sortedFiles,
		}),
		"utf8",
	);
}

/** Probe every source, so the manifest always describes the files on disk. */
async function buildManifest() {
	const files = {};
	await runPool(
		listImageSources(),
		async (file) => {
			const meta = await probe(file);
			if (meta) files[urlPath(file)] = meta;
		},
		8,
	);
	const sorted = {};
	for (const key of Object.keys(files).sort()) sorted[key] = files[key];
	return sorted;
}

function describeDrift(expected, cached) {
	const problems = [];
	for (const key of Object.keys(expected).sort()) {
		const want = expected[key];
		const have = cached[key];
		if (!have) problems.push(`manifest missing ${key}`);
		else if (have.width !== want.width || have.height !== want.height || have.bytes !== want.bytes) {
			problems.push(
				`manifest stale ${key} (${have.width}x${have.height} ${have.bytes}B, disk says ${want.width}x${want.height} ${want.bytes}B)`,
			);
		}
	}
	for (const key of Object.keys(cached).sort()) {
		if (!expected[key]) problems.push(`manifest lists a file that is gone: ${key}`);
	}
	return problems;
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const images = require(path.join(ROOT, "_data", "galleryImages.js"));
	const { jobs, problems } = collectViewerJobs(images);

	// Data problems are fatal in every mode: a wrong declaration would ship a
	// broken lightbox or a needless upscale.
	if (problems.length) {
		for (const problem of problems) console.error(`ERROR ${problem}`);
		throw new Error(`${problems.length} gallery viewer problem(s)`);
	}

	const cache = loadCache();
	const checks = [];
	const pending = [];

	for (const job of jobs) {
		const sourceHash = await sha1(job.source);
		const hash = viewerHash(sourceHash, job.width);
		const recorded = cache.viewers[job.url];
		const exists = fs.existsSync(job.output);
		const fresh = exists && recorded && recorded.hash === hash;
		if (args.check) {
			if (!exists) checks.push(`missing viewer ${job.url} (${job.width}px)`);
			else if (!fresh) checks.push(`stale viewer ${job.url} (${job.width}px)`);
		} else if (args.force || !fresh) {
			pending.push({ job, hash });
		}
	}

	const manifest = await buildManifest();
	if (args.check) {
		checks.push(...describeDrift(manifest, cache.files));
		for (const check of checks) console.log(check);
		const total = jobs.length;
		console.log(
			`viewers: ${total} declared, ${checks.length} problem(s)${checks.length ? "" : " — all current"}; manifest: ${Object.keys(manifest).length} files`,
		);
		process.exit(checks.length ? 1 : 0);
	}

	if (pending.length) {
		console.log(
			`viewers: encoding ${pending.length} of ${jobs.length} (${jobs.length - pending.length} cached).`,
		);
		const failures = [];
		await runPool(
			pending,
			async ({ job, hash }) => {
				try {
					const meta = await encodeViewer(job);
					cache.viewers[job.url] = {
						hash,
						width: meta.width,
						height: meta.height,
						bytes: fs.statSync(job.output).size,
					};
					console.log(
						`  ${job.image.file}-${job.width}.webp  ${meta.width}x${meta.height}  ${Math.round(fs.statSync(job.output).size / 1024)} KB`,
					);
				} catch (error) {
					failures.push({ job, error });
				}
			},
			CONCURRENCY,
		);
		if (failures.length) {
			for (const failure of failures) {
				console.error(`FAILED ${failure.job.url}: ${failure.error.message}`);
			}
			throw new Error(`${failures.length} viewer derivative(s) failed`);
		}
	} else {
		console.log(`viewers: all ${jobs.length} current.`);
	}

	// Refresh from disk so sizes, dimensions and byte counts always describe the
	// files that actually exist, including ones just written.
	for (const job of jobs) {
		const meta = await probe(job.output);
		if (!meta) throw new Error(`${job.url}: cannot read the generated derivative`);
		const entry = cache.viewers[job.url] || {};
		cache.viewers[job.url] = { ...entry, ...meta };
	}
	cache.files = await buildManifest();
	writeCache(cache);

	const viewerBytes = jobs.reduce(
		(total, job) => total + (cache.files[job.url]?.bytes || 0),
		0,
	);
	console.log(
		`manifest: ${Object.keys(cache.files).length} images; viewers: ${jobs.length} files, ${(viewerBytes / 1024 / 1024).toFixed(1)} MB in images/gallery/responsive/.`,
	);
}

if (require.main === module) {
	main().catch((error) => {
		console.error(error.stack || error.message);
		process.exit(1);
	});
}

module.exports = { collectViewerJobs, listImageSources, viewerHash, VIEWER_MAX_WIDTH };
