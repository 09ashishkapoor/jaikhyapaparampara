<div align="center">

# 🔱 Jai Khyapa Parampara 🔱

### *ॐ श्री गुरुभ्यो नमः*
### *Om Shri Gurubhyo Namaha*

**A living digital shrine to the Khyapa Parampara tradition**

Dedicated to **Gurushreshta Ma Adya Mahakali** and **Baba Kalabhairava**

[![Live Site](https://img.shields.io/badge/Live%20Site-jaikhyapaparampara.com-orange?style=for-the-badge)](https://jaikhyapaparampara.com)
[![Built with Eleventy](https://img.shields.io/badge/Built%20with-Eleventy-black?style=for-the-badge&logo=eleventy)](https://www.11ty.dev/)
[![Hosted on Cloudflare Pages](https://img.shields.io/badge/Hosted%20on-Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflare)](https://pages.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## What Is This?

This repository is the complete source code for **[jaikhyapaparampara.com](https://jaikhyapaparampara.com)** — a spiritual knowledge archive preserving the oral wisdom of the Khyapa Parampara lineage.

The site contains **1,205 articles**: word-for-word conversations, Guru stories, spiritual discourses, and prophecies — originally spoken in **Bengali**, transcribed from YouTube and translated into **English**.

### The Tradition

The Khyapa Parampara is a living Tantric lineage rooted in the worship of **Ma Kali** and **Kalabhairava Baba**. Its teachings are available now in English. *Khyapas* — mean the divine mad who dont shy away from the truth. Irrespective of the consequences.   

This site documents two luminaries of the lineage:

| Teacher | Role |
|---|---|
| **Gurubaba Shyama Khyapa** | ChaturthaPurusha — the fourth realized master of the Khyapa Parampara; GuptaSadhaka (hidden practitioner) |
| **Shri Praveen RadhaKrishnan** | Founder of the Kaliputra Mission; and my Guru ❤️ |

*Compiled with devotion by KaliPutra-Ashish. Curated for all seekers.*

---

## Free Sacred Texts

The site also hosts **free downloadable ebooks**:

- **Adya Mahakali Sahasranama** — 1000 names with chanting guide (English & Hindi)
- **Kalabhairava Sahasranama** — 1000 names with chanting guide (English & Hindi)
- **Kalabhairava Ashtottara Namavali** — 108 names with chanting guide (English)
---

## Tech Stack

| Layer | Technology |
|---|---|
| Static site generator | [Eleventy (11ty)](https://www.11ty.dev/) v2 |
| Templating engine | [Liquid](https://shopify.github.io/liquid/) (Eleventy built-in) |
| Content format | Markdown + YAML frontmatter + inline HTML |
| Deployment | [Cloudflare Pages](https://pages.cloudflare.com/) (auto-deploy on push to `main`) |
| Node version | 18 (pinned in `.node-version`) |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/09ashishkapoor/jaikhyapaparampara.git
cd jaikhyapaparampara

# Install dependencies
npm install

# Build to _site/
npm run build

# Serve locally with live reload at http://localhost:8080
npm start
```

After cloning, the site builds and serves identically to production — no environment variables or secrets required. The private `/stats/` dashboard renders a setup page until analytics credentials are configured.

---

## Validation Baseline

This repo now ships with a lightweight Playwright-based validation baseline for merge review:

- smoke coverage for the homepage, search flow, and sacred art gallery
- a scoped `@axe-core/playwright` accessibility check for the search experience
- 3 stable visual regression snapshots
- a homepage performance budget test
- GitHub Actions for Playwright validation and CI link checking

### Pre-push hook (automatic)

All validations run automatically before every `git push` (including VS Code sync). If any test fails, the push is blocked until fixed — no manual steps needed.

> **Note:** The performance budget test is excluded from the pre-push hook because local machine load affects LCP timing. It runs in GitHub Actions on Linux; run it locally with `npm run validate -- --grep 'performance budget'` when checking performance.

To bypass in an emergency:
```bash
git push --no-verify
```

### Local usage

```bash
# Install Chromium and its Linux system dependencies once after npm install
npx playwright install --with-deps chromium

# Run the full validation suite manually
npm run validate
```

### Updating visual baselines intentionally

```bash
npm run validate:update-snapshots
```

Re-run `npm run validate` after refreshing snapshots, then review the changed files under `tests/visual/*-snapshots/` before committing.

For the repo-standardized pattern and reuse notes, see [VALIDATION_BASELINE.md](VALIDATION_BASELINE.md).

---

## Roadmap

The current plan for the site lives in [ROADMAP.md](ROADMAP.md): settled
decisions, non-negotiable constraints, measured defects, and the work plan.

Defunct plans, audits, and reports are kept in [`archive/`](archive/) for
reference only. They are excluded from the site build and are not maintained.

---

## Repository Structure

```
articles/                     # 1205 Markdown articles
_includes/                    # Liquid templates
│   base.liquid               #   Site shell (head, nav, footer)
│   article.liquid            #   Per-article layout
images/                       # Site images (WebP optimised)
markdownfiles_forblog/        # Raw YouTube transcript staging area
│   tobeprocessed/            #   Awaiting conversion → articles/
│   processed/                #   Converted transcripts (archive)
│   redundant/                #   Duplicates / retired files
docs/                         # How-to guides and editorial notes
lib/analytics/                # Search Console, Cloudflare, SigV4/R2, dashboard aggregation
lib/articleIndex.js           # Metadata + full-text index builders for the search UI
scripts/                      # Build, audit, and analytics helpers (Node + Python)
│   analytics-pull.js         #   Nightly pull → R2 raw JSONL + dashboard.json
│   analytics-fetch.js        #   R2 dashboard → .analytics/ before the build
.eleventy.js                  # Eleventy build config
wrangler.toml                 # Cloudflare Pages config
styles.css / styles.min.css   # Stylesheet (source + minified)
script.js  / script.min.js    # Frontend JS (source + minified)
sitemap.liquid                # Sitemap template → sitemap.xml
article-index.11ty.js         # Emits the compact /article-index.json (JS template)
search-index.11ty.js          # Emits the deferred /search-index.json (JS template)
gallery.liquid                # Sacred image gallery (data: _data/galleryImages.js)
stats.liquid                  # Private /stats/ analytics dashboard (noindex)
_headers                      # Cloudflare HTTP response headers
_redirects                    # Cloudflare URL redirects
.github/workflows/            # Playwright validation + nightly analytics cron
.analytics/                   # Local analytics cache (gitignored, never published)
archive/                      # Retired plans and audits (never published)
ROADMAP.md                    # Current plan (never published)
```

---

## Article Format

Every article in `articles/` is a Markdown file with YAML frontmatter followed by an HTML transcript body.

### Frontmatter

```yaml
layout: article
title: "Full Title Here"
breadcrumbTitle: "Short 5-7 Word Version"
description: "1-2 sentence summary."
keywords: "Guru Deva Shyama Khyapa, Gupta Sadhak, Smashana Bhairava, Khyapa Parampara, [topic terms]"
category: "Guru Stories"      # or "Spiritual Teachings" or "Discourse"
author: "🗣️ Gupta Sadhak Shyama Khyapa"
date: 2026-03-05
readingTime: 6                # ceil(wordCount / 200)
tags:
  - articles
  - Guru Baba Shyama Khyapa
  - [topic-specific tags]
source: |
  <p><strong>Source:</strong> YouTube video | Bengali to English Translation</p>
  <p><a href="https://www.youtube.com/watch?v=VIDEO_ID" target="_blank" rel="noopener">📺 Watch Original Bengali Video</a></p>
  <p style="margin-top:0.5rem;"><em>Verified by Kaliputra-Ashish</em></p>
```

### Transcript Body

Dialogue is structured in `transcript-container` / `speaker-block` HTML — **not** plain Markdown paragraphs:

```html
<div class="transcript-container" style="background:rgba(45,15,24,0.4);border:1px solid var(--border-gold);padding:2.5rem;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.3);margin-bottom:2rem;">

<div class="speaker-block" style="margin-bottom:2rem;border-left:3px solid var(--accent-color);padding-left:1.5rem;">
<span class="speaker-name" style="font-weight:700;color:var(--accent-bright);margin-right:0.5rem;text-transform:uppercase;letter-spacing:1px;font-size:1rem;">GURU SHYAMA KHYAPA:</span>
<span class="speech-text" style="display:block;margin-top:0.5rem;">The full text of what was said.</span>
</div>

</div>
```

Common speaker labels: `DEVOTEE:`, `GURU SHYAMA KHYAPA:`, `NARRATOR:`.

---

## Contributing

Contributions of any kind are welcome — corrections, new transcript conversions, translations, or code improvements.

1. Fork the repository and create a branch.
2. Add or edit your article in `articles/` following the frontmatter schema above.
3. Run `npm run serve` and preview locally.
4. Open a pull request with commit message format: `content: add article - <short-title>`

---

## Deployment

Cloudflare Pages auto-deploys on every push to `main`. The build output directory is `_site/` (configured in `wrangler.toml`). No extra secrets or environment variables are needed to build.

To deploy your own fork:
1. Connect the repository to Cloudflare Pages.
2. Set build command: `npm run build`
3. Set output directory: `_site`

The optional nightly analytics job needs its own secrets (listed in `.github/workflows/analytics.yml`). Without them the build is unchanged: `npm run analytics:fetch` is a no-op and `/stats/` renders setup instructions.

---

## Crawling and indexing

All non-empty tag archives allow indexing. Their links appear on articles and in the alphabetical topic directory at `/tags/`, which lists 100 topics per page. Every directory page is included in the sitemap. Keep this link policy in sync with the robots metadata; removing `noindex` alone does not restore internal links.

The homepage, `/search/`, and the `/articles/` "Surprise me" control load `/article-index.json`, a compact metadata index (title, description, category, tags). The search page renders those results immediately, then loads `/search-index.json` in the background and merges in full article-text matches; the text index never blocks the first result.

Sitemap `<lastmod>` uses each article's last git commit date. Cloudflare Pages builds from a shallow clone, so run `npm run sitemap:dates` after editing article content and commit `_data/articleLastmod.json` with those edits.

The build emits `/404.html` so Cloudflare Pages returns a real 404 for missing URLs instead of its single-page-app homepage fallback. The internal search page, the 404 page, and the private `/stats/` dashboard intentionally use `noindex` and are excluded from the sitemap.

After deploying indexing changes, use Search Console's live URL test on representative URLs and request indexing for important pages. Submit `https://jaikhyapaparampara.com/sitemap.xml` if it is not already submitted. An in-progress validation should be allowed to finish. A nonzero noindex count is expected for intentionally excluded pages; neither sitemap submission nor validation guarantees indexing.

Configure permanent hostname redirects in Cloudflare's Redirect Rules or Bulk Redirects, preserving the path and query string:

| Source hostname | Destination hostname | Status |
| --- | --- | --- |
| `www.jaikhyapaparampara.com` | `jaikhyapaparampara.com` | 301 |
| `jaikhepaparampara.com` | `jaikhyapaparampara.com` | 301 |
| `www.jaikhepaparampara.com` | `jaikhyapaparampara.com` | 301 |

Hostname redirects are configured outside this repository because Cloudflare Pages `_redirects` does not support domain-level redirects. Check Search Console Crawl Stats for host availability failures or crawl errors, and Cloudflare security events for blocked verified Googlebot traffic before changing bot protection.

## Site analytics

Traffic and SEO measurement is cookieless and carries no client-side tag:

| Source | Role |
|---|---|
| **Google Search Console API** | Queries, pages, impressions, clicks, CTR, average position — the primary SEO input |
| **Cloudflare Web Analytics** | Page loads, visits, referrers, country, device — injected at the edge, no cookies |

Google Analytics was removed in favour of these two. `scripts/analytics-pull.js` runs nightly from `.github/workflows/analytics.yml`: it stores raw daily rows as JSONL in Cloudflare R2 (`analytics/raw/YYYY-MM-DD.jsonl`), re-pulling the last seven days every time, and aggregates them into `analytics/dashboard.json`. `npm run analytics:fetch` copies that dashboard to `.analytics/dashboard.json` before Eleventy runs, and `/stats/` renders it.

Cloudflare injects its Web Analytics beacon at the edge, so no tag ships in the HTML. The CSP in `_headers` allows `https://static.cloudflareinsights.com`, and the beacon reports to same-origin `/cdn-cgi/rum`, covered by `connect-src 'self'`.

The dashboard is `noindex`, excluded from the sitemap, and must be protected by Cloudflare Access (plus a `Disallow` in `robots.txt` as defence in depth). It is never linked from the public navigation.

```bash
npm run analytics:pull -- --dry-run     # show resolved sources and windows
npm run analytics:fixtures              # offline demo from tests/fixtures/analytics
npm run test:analytics                  # unit tests, no browser needed
```

Raw analytics never enters the repository (`.analytics/` is gitignored). Without R2 credentials the fetch step is a no-op, so a normal clone builds and serves identically to production.

Setup, outside the repository:

1. Enable the **Search Console API**, create a service account, and add its email as a user on the Search Console property.
2. Create a Cloudflare API token with **Account Analytics: Read**, and note the account id.
3. Enable **Web Analytics** for the zone and copy the 32-character site tag (not the zone id).
4. Create an R2 bucket and an R2 API token, then add every secret listed at the top of `.github/workflows/analytics.yml`.
5. Optionally add a Pages deploy hook as `CF_PAGES_DEPLOY_HOOK_URL` so `/stats/` refreshes after the nightly pull.

These are recorded as deferred pending actions (P1–P7) in [ROADMAP.md](ROADMAP.md#13-pending-owner-actions-deferred), to be done once the remaining roadmap items are finished. The site builds and serves identically until then.

---

## Asset Minification

After editing `styles.css` or `script.js`, regenerate the minified versions:

```bash
python minify-css.py
python minify-js.py
```

---

<div align="center">

### 🌟 Clone it. Fork it. Build your own. Share the light. 🌟

*The code is MIT. The teachings belong to the tradition. Share freely.*

</div>

---

## License

[MIT](LICENSE) — use it, copy it, build on it. See [LICENSE](LICENSE) for the full text.
