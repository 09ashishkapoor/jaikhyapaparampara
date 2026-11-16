"use strict";

// Two interchangeable stores for the analytics pipeline:
//
//   file  — a directory on disk, used for local runs and the fixture demo
//   r2    — Cloudflare R2 through its S3-compatible API
//
// Both expose the same `get(key)` / `put(key, body)` contract. Keys are
// relative object names such as `analytics/raw/2026-11-15.jsonl`.

const fs = require("fs/promises");
const path = require("path");
const { signRequest } = require("./sigv4.js");

const CONTENT_TYPE_BY_EXTENSION = {
	".jsonl": "application/x-ndjson; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".txt": "text/plain; charset=utf-8",
};

function contentTypeForKey(key) {
	const extension = path.extname(key).toLowerCase();
	return CONTENT_TYPE_BY_EXTENSION[extension] || "application/octet-stream";
}

function snippet(text, limit = 300) {
	const value = String(text == null ? "" : text).replace(/\s+/g, " ").trim();
	return value.length > limit ? `${value.slice(0, limit)}…` : value;
}

function createFileStore(rootDir) {
	if (!rootDir) throw new Error("createFileStore requires a root directory");
	const root = path.resolve(rootDir);

	function resolveKey(key) {
		const target = path.resolve(root, key);
		if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
			throw new Error(`Refusing to escape the store root with key "${key}"`);
		}
		return target;
	}

	async function get(key) {
		try {
			return await fs.readFile(resolveKey(key), "utf8");
		} catch (error) {
			if (error && error.code === "ENOENT") return null;
			throw error;
		}
	}

	async function put(key, body) {
		const target = resolveKey(key);
		await fs.mkdir(path.dirname(target), { recursive: true });
		const temporary = `${target}.tmp-${process.pid}`;
		await fs.writeFile(temporary, String(body), "utf8");
		await fs.rename(temporary, target);
	}

	return { kind: "file", root, get, put };
}

function createR2Store({
	accountId,
	bucket,
	accessKeyId,
	secretAccessKey,
	endpoint,
	sessionToken,
	fetchImpl = fetch,
} = {}) {
	if (!bucket) throw new Error("createR2Store requires an R2 bucket name");
	if (!endpoint && !accountId) {
		throw new Error("createR2Store requires an account id (or an explicit endpoint)");
	}
	if (!accessKeyId || !secretAccessKey) {
		throw new Error("createR2Store requires R2 access key credentials");
	}
	const base = (endpoint || `https://${accountId}.r2.cloudflarestorage.com`).replace(/\/+$/, "");
	const objectUrl = (key) => {
		const encodedKey = String(key)
			.split("/")
			.map((segment) => encodeURIComponent(segment))
			.join("/");
		return `${base}/${encodeURIComponent(bucket)}/${encodedKey}`;
	};

	async function get(key) {
		const url = objectUrl(key);
		const signed = signRequest({
			method: "GET",
			url,
			accessKeyId,
			secretAccessKey,
			sessionToken,
		});
		const response = await fetchImpl(url, { method: "GET", headers: signed.headers });
		if (response.status === 404) return null;
		if (!response.ok) {
			const text = await response.text().catch(() => "");
			throw new Error(
				`R2 GET ${key} failed: ${response.status} ${snippet(text)}`,
			);
		}
		return response.text();
	}

	async function put(key, body) {
		const url = objectUrl(key);
		const text = String(body);
		const signed = signRequest({
			method: "PUT",
			url,
			headers: { "content-type": contentTypeForKey(key) },
			body: text,
			accessKeyId,
			secretAccessKey,
			sessionToken,
		});
		const response = await fetchImpl(url, {
			method: "PUT",
			headers: signed.headers,
			body: text,
		});
		if (!response.ok) {
			const detail = await response.text().catch(() => "");
			throw new Error(
				`R2 PUT ${key} failed: ${response.status} ${snippet(detail)}`,
			);
		}
	}

	return { kind: "r2", bucket, endpoint: base, get, put };
}

module.exports = {
	createFileStore,
	createR2Store,
	contentTypeForKey,
};
