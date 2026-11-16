# SEO audit — jaikhyapaparampara.com

Checked 22 October 2026 (UTC). Business type: noncommercial spiritual knowledge archive and publisher.

## Executive summary

**Provisional SEO health: 79/100 on assessed categories only** (editorial estimate, not a Google score). PageSpeed/CrUX measurements were added after the initial audit, but INP and AI search visibility remain unmeasured, so this is **not** a full 100-point audit. No verified critical indexability blocker was found on the sampled pages.

**Scope:** Live homepage, robots.txt, sitemap, 60 sitemap URLs (12 general/archive, 27 article, 21 tag pages), GSC inspection for homepage and one tag page, GSC query/page performance for 24 September–19 October 2026, and GSC sitemap status. The 60 URLs returned HTTP 200 and had titles, descriptions, and self-referencing canonicals. Sitemap contains **3,514 URLs**: **2,248 tags**, **1,263 article paths** (including archive paths), homepage, gallery and glossary. Sample was not a complete 3,514-page crawl; it cannot establish sitewide absence of broken links, duplicates or schema errors.

### Highest-priority findings

1. **High — taxonomy index bloat risk:** 2,248 tag URLs make up 64% of the sitemap. In a random sample, 12/21 tags list just one article; 11/21 tag pages had fewer than 150 visible words (navigation included). Example: `/tags/ganapati/` has one article and ~140 words; Google's URL Inspection returned **“URL is unknown to Google”** for that particular URL. This does not prove that all tag pages are unindexed or harmful. Review actual indexed/low-value tag counts in GSC before pruning or applying `noindex`.
2. **Medium — repetitive archive descriptions:** Sampled `/articles/2/` through `/articles/6/` share one description; `/articles/a-z/2/` through `/articles/a-z/6/` share another. Titles and canonicals differ. Give page-specific summaries if these pages earn search impressions; otherwise this is a lower-priority snippet issue.
3. **Medium — content quick wins:** GSC query/page rows identify `bhadrakali` (854 impressions, 4 clicks, position 9.5), `krishnananda agamavagisha` (539, 5, position 8.2), and `batuka bhairava brahma kavacham` (347, 27, position 7.2). Verify query intent and strengthen the relevant articles' answers, titles, introductory text, and contextual internal links; don't stuff terms.
4. **Low — gallery semantics:** `/gallery/` has two H1s (site name and gallery heading) and one image lacking nonempty alt text (source attribute empty in rendered HTML). Check whether that image is decorative; if so, `alt=""` is appropriate. Make the site-name heading non-H1 if the gallery title is the page's primary heading.

## Technical and indexation

- `robots.txt` returns 200, permits normal crawling and references the sitemap; `/version.json` is disallowed. The sampled URLs are crawlable and return HTTP 200.
- Sampled pages have canonical tags equal to their final URLs. Homepage GSC inspection: **submitted and indexed**, robots allowed, fetched successfully as mobile, Google canonical matches declared canonical; last crawl **20 October 2026**. One checked thin tag, `/tags/ganapati/`, is **unknown to Google**; this is an individual observation, not an indexation rate.
- GSC lists the primary sitemap with zero reported errors or warnings. GSC's sitemap response displays `indexed: 0` even though homepage inspection confirms it indexed; do **not** interpret that field as proof of zero indexed pages. GSC also lists an older `www` sitemap; investigate whether it is still needed.
- HTTPS homepage serves CSP, referrer policy, `nosniff` and frame protection headers. No security-header failure verified.

## Content, on-page and internal linking

- Sampled article pages contain at least ~724 visible words; this is not an originality, accuracy, E-E-A-T or full duplicate-content evaluation. Sampled tag pages are often brief. Articles, archive and tags contain internal links; this check did not validate every destination.
- Titles and descriptions were present on all 60 pages; H1 was singular except gallery. Five sampled newest-first archive pages and five A–Z archive pages each reused their group's description.
- GSC query/page output had 1,062 rows, totaling **402 clicks and 9,854 impressions across returned rows** for 24 September–19 October 2026. These are returned query/page rows, not necessarily the property's total search traffic. Search Console data lags a few days.

## Structured data, images and AI readiness

- Homepage has parseable WebSite, BreadcrumbList, Organization, SoftwareApplication and FAQPage JSON-LD; a checked article has Article and BreadcrumbList; gallery has ImageGallery. Presence/JSON parse is **not** Google rich-result validation. Many archives and tag pages had no JSON-LD; this alone is not a defect.
- Only gallery had an image without nonempty alt text among the sampled HTML. Other sampled pages passed this limited check; image bytes, dimensions and visual quality were not audited.
- Named authorship and subject-specific content support attribution; no independent measurement of AI Overview citations, off-site mentions or authority was made. **AI search readiness: unscored.**

## Performance / Core Web Vitals

**Updated 22 October 2026 after configuring the API key.** Lighthouse lab scores on the homepage: **mobile 65**, **desktop 93** (performance); accessibility 100, best practices 92 and SEO 100 on both. Mobile lab LCP **6.8 s (Poor)** and CLS **0.125 (Needs improvement)**; desktop lab LCP **1.3 s (Good)** and CLS **0.026 (Good)**. The mobile audit flags up to ~600 ms of unused JavaScript savings. One lab run is not representative of real-user Core Web Vitals.

CrUX **origin-level, all devices combined**, 23 September–20 October 2026: LCP p75 **1.286 s (Good)**; CLS p75 **0.00 (Good)**. **INP was not returned**, so the full three-metric CWV pass/fail cannot be established. PSI's mobile URL-level CLS p75 was **0.04 (Good)**; mobile LCP was only available at origin level. These different scopes should not be conflated. Mobile lab LCP is the clearest performance investigation target, not proof of poor field LCP.

## Method and limitations

A seeded stratified sample of 60 live sitemap URLs was fetched with at most five concurrent requests and a one-second gap between batches. The site's robots.txt was read and honored for sampled pages. Sitemap is larger than the skill's 500-page maximum; this is a **sampled audit**, not an exhaustive crawl. No GA4 data, backlink audit, INP field result, third-party SERP data, rendered screenshots or image-byte audit. Avoid treating the provisional score as an empirical ranking prediction.

For a PDF, the audit skill offers `scripts/google_report.py --type full` once compatible JSON datasets are collected; no PDF was generated from missing performance data.
