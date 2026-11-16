"use strict";

// Minimal AWS Signature Version 4 signer. The pipeline talks to Cloudflare R2
// through its S3-compatible API, so this replaces a ~10 MB SDK with the ~100
// lines of HMAC that the request actually needs. R2 uses the `auto` region and
// the `s3` service in the credential scope.
//
// Verified against AWS's published `get-vanilla` conformance vector in
// tests/unit/analytics.test.js.

const crypto = require("crypto");

function sha256Hex(data) {
	return crypto.createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key, data) {
	return crypto.createHmac("sha256", key).update(data).digest();
}

function encodeRfc3986(value) {
	return encodeURIComponent(String(value)).replace(/[!'()*]/g, (character) => {
		return `%${character.charCodeAt(0).toString(16).toUpperCase()}`;
	});
}

function canonicalPath(pathname) {
	const raw = pathname && pathname !== "" ? pathname : "/";
	// SigV4 encodes each path segment exactly once. Decode first so a URL that
	// already contains %XX escapes is not double-encoded.
	return raw
		.split("/")
		.map((segment) => {
			let decoded = segment;
			try {
				decoded = decodeURIComponent(segment);
			} catch {
				// Leave malformed escapes alone; callers only build safe keys.
			}
			return encodeRfc3986(decoded);
		})
		.join("/");
}

function canonicalQuery(searchParams) {
	const pairs = [];
	for (const [key, value] of searchParams.entries()) {
		pairs.push([encodeRfc3986(key), encodeRfc3986(value)]);
	}
	pairs.sort((a, b) => (a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])));
	return pairs.map(([key, value]) => `${key}=${value}`).join("&");
}

function amzDate(date) {
	return date
		.toISOString()
		.replace(/[-:]/g, "")
		.replace(/\.\d{3}Z$/, "Z");
}

function signRequest({
	method = "GET",
	url,
	headers = {},
	body = "",
	accessKeyId,
	secretAccessKey,
	sessionToken,
	region = "auto",
	service = "s3",
	now = new Date(),
	includeContentSha256 = true,
} = {}) {
	if (!url) throw new Error("signRequest requires a url");
	if (!accessKeyId || !secretAccessKey) {
		throw new Error("signRequest requires accessKeyId and secretAccessKey");
	}
	const parsed = new URL(url);
	const nowDate = now instanceof Date ? now : new Date(now);
	if (Number.isNaN(nowDate.getTime())) throw new Error("signRequest received an invalid date");
	const stamp = amzDate(nowDate);
	const dateStamp = stamp.slice(0, 8);
	const payload = body == null ? "" : String(body);
	const payloadHash = sha256Hex(payload);

	const headerMap = new Map();
	for (const [name, value] of Object.entries(headers)) {
		const lower = String(name).toLowerCase();
		if (lower === "authorization" || lower === "host" || value == null) continue;
		headerMap.set(
			lower,
			String(value).trim().replace(/\s+/g, " "),
		);
	}
	headerMap.set("host", parsed.host);
	headerMap.set("x-amz-date", stamp);
	if (includeContentSha256) headerMap.set("x-amz-content-sha256", payloadHash);
	if (sessionToken) headerMap.set("x-amz-security-token", String(sessionToken));

	const headerNames = [...headerMap.keys()].sort();
	const canonicalHeaders = headerNames
		.map((name) => `${name}:${headerMap.get(name)}\n`)
		.join("");
	const signedHeaders = headerNames.join(";");

	const canonicalRequest = [
		String(method).toUpperCase(),
		canonicalPath(parsed.pathname),
		canonicalQuery(parsed.searchParams),
		canonicalHeaders,
		signedHeaders,
		payloadHash,
	].join("\n");

	const scope = `${dateStamp}/${region}/${service}/aws4_request`;
	const stringToSign = [
		"AWS4-HMAC-SHA256",
		stamp,
		scope,
		sha256Hex(canonicalRequest),
	].join("\n");

	const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
	const kRegion = hmacSha256(kDate, region);
	const kService = hmacSha256(kRegion, service);
	const signingKey = hmacSha256(kService, "aws4_request");
	const signature = crypto
		.createHmac("sha256", signingKey)
		.update(stringToSign)
		.digest("hex");

	const authorization = [
		`AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}`,
		`SignedHeaders=${signedHeaders}`,
		`Signature=${signature}`,
	].join(", ");

	const outgoing = {};
	for (const [name, value] of headerMap) outgoing[name] = value;
	outgoing.authorization = authorization;

	return {
		headers: outgoing,
		signature,
		canonicalRequest,
		stringToSign,
		payloadHash,
	};
}

module.exports = {
	signRequest,
	sha256Hex,
	encodeRfc3986,
	canonicalPath,
	canonicalQuery,
};
