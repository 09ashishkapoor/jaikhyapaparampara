const { test, expect } = require("@playwright/test");

const GA_PATTERN = /googletagmanager\.com|google-analytics\.com|G-KCVSN3F2DL|gtag\(/;
const AN_ARTICLE = "/articles/batuka-bhairava-brahma-kavacham-sanskrit-english/";

test("no Google Analytics tag or request survives on any page type", async ({ request }) => {
  for (const pathname of ["/", "/gallery/", AN_ARTICLE, "/search/", "/about/", "/glossary/"]) {
    const response = await request.get(pathname);
    expect(response.status(), pathname).toBe(200);
    const html = await response.text();
    expect(html, `${pathname} still references Google Analytics`).not.toMatch(GA_PATTERN);
    expect(html, `${pathname} still loads a gtag script`).not.toContain("/gtag/js");
  }

  // The CSP is the second half of the removal: no GA hosts may remain, but the
  // Cloudflare Web Analytics beacon (auto-injected at the edge) must be allowed.
  const headers = await request.get("/_headers");
  expect(headers.status()).toBe(200);
  const headerText = await headers.text();
  expect(headerText).not.toMatch(/googletagmanager|google-analytics/);
  expect(headerText).toContain("https://static.cloudflareinsights.com");
  expect(headerText).toContain("connect-src 'self' https://radio.jaikhyapaparampara.com");
});

test("/stats/ is reachable, noindex, and absent from the sitemap", async ({ request }) => {
  const response = await request.get("/stats/");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
  expect(html).toContain('<link rel="canonical" href="https://jaikhyapaparampara.com/stats/">');
  expect(html).toContain("Site analytics");
  // Data is either rendered or the page explains how to produce it; either way
  // no article body or visitor-level field may appear.
  expect(html).toMatch(/No dashboard data yet|Window/);
  expect(html).not.toMatch(/ipAddress|sessionId|userId/);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("<loc>https://jaikhyapaparampara.com/stats/</loc>");

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /stats/");

  const headers = await (await request.get("/_headers")).text();
  expect(headers).toContain("/stats/");
  expect(headers).toContain("X-Robots-Tag: noindex, nofollow");
  expect(headers).toContain("Cache-Control: private, no-store");
});

test("the private dashboard is not linked from public navigation or the footer", async ({ request }) => {
  for (const pathname of ["/", AN_ARTICLE, "/about/"]) {
    const html = await (await request.get(pathname)).text();
    expect(html, pathname).not.toContain('href="/stats/"');
    expect(html, pathname).not.toContain("jaikhyapaparampara.com/stats");
  }
});
