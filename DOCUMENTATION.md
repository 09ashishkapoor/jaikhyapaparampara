# Jai Khyapa Parampara — Documentation (Diátaxis)

Scope & Audience
- Scope: Documentation for editors, content engineers, and maintainers working on the Eleventy static site that publishes Bengali→English transcript-based articles.
- Audience: Content contributors (non-dev), content engineers (Python/Node familiarity), and maintainers handling builds & deployments.

Proposed Outline
1. Tutorials — quick start, add & publish a single article, convert one transcript
  - `docs/tutorials/QuickStart.md`
2. How-to Guides — add new article, run blog-converter, run article-fixer, run build & serve
  - `docs/how-to/Step-by-Step.md`
3. Reference — important files, templates, scripts, commands
  - `docs/reference/Index.md`
4. Explanation — architecture, conventions, frontmatter & transcript HTML rules, agents
  - `docs/explanation/Index.md`

Screenshots
- Dev server: `docs/screenshots/dev-server.png`
- Article preview: `docs/screenshots/article-preview.png`

---

**Tutorials**

Quick start — local dev (5 minutes)
- Prereqs: Node.js, npm, Python 3 (for helpers)

Commands:
```bash
npm ci
npm run serve
# open http://localhost:8080
```

Add & preview a single article (fast path)
1. Create a new Markdown file in `articles/` with the required frontmatter (see How-to below).
2. Run `npm run serve` and visit the page URL produced in dev server output.

Convert a single transcript (manual)
1. Place a raw transcript file in `markdownfiles_forblog/tobeprocessed/`.
2. Run the single-instance converter agent (ad-hoc): see How-to for `blog-converter` usage.

---

**How-to Guides**

Add a new article
- Use exact frontmatter schema (example):

```yaml
layout: article
title: "Full Title Here"
breadcrumbTitle: "Short 5-7 Word Version"
description: "1-2 sentence summary"
keywords: "Guru Deva Shyama Khyapa, Gupta Sadhak, Smashana Bhairava, Khyapa Parampara, [topic]"
category: "Guru Stories"
author: "🗣️ Gupta Sadhak Shyama Khyapa"
date: 2026-03-05
readingTime: 6
tags:
  - articles
  - Guru Baba Shyama Khyapa
source: |
  <p><strong>Source:</strong> YouTube video | Bengali to English Translation</p>
```

- Body: use the mandatory `transcript-container` / `speaker-block` HTML format. Example snippet:

```html
<div class="transcript-container" style="...">
  <div class="speaker-block" style="...">
    <span class="speaker-name">GURU SHYAMA KHYAPA:</span>
    <span class="speech-text">Full text of what they said.</span>
  </div>
</div>
```

Process transcripts using the `blog-converter` agent
- For batch conversion, use the repository's custom agents (`blog-converter`, `blog-converter-a/b/c`) configured in `.github/agents/` as the canonical workflow. They enforce deduplication and progress tracking.
- Ad-hoc single-run: run the `blog-converter` agent or use `convert_transcript_format.py` or `convert_blog_gemini.py` depending on source format. (Check `markdownfiles_forblog/tobeprocessed/` for input expectations.)

Fix published stub articles using `article-fixer`
- The `article-fixer` agent rewrites stub articles (e.g., a specified date range) using verified transcript sources and logs progress into `_article_fix_progress.md`.

Build & deploy
- Build locally:
```bash
npm run build
# output -> _site/
```
- Local static serve (production-like):
```bash
npm start
# or run_server.py / wrangler preview for Cloudflare specifics
```
- Deployment: Cloudflare Pages configured in `wrangler.toml` with `_site/` as output dir; pushes to `main` trigger automatic deploys.

---

**Reference**

Key files and purpose
- `articles/` — source Markdown articles (500+). Follow frontmatter + transcript HTML conventions.
- `_includes/article.njk`, `_includes/base.njk` — core Nunjucks templates used by Eleventy.
- `.eleventy.js` — Eleventy config (collections, filters, passthroughs, sitemap hook).
- `markdownfiles_forblog/tobeprocessed/` — raw transcripts to convert.
- `scripts/` and root-level Python scripts — helpers for conversion, auditing, optimization (see `scripts/` and `*.py` in repo root).
- `package.json` — npm scripts: `serve`, `build`, `start`.
- `wrangler.toml` — Cloudflare Pages build/deploy settings.
- `_site/` — generated site output.
- `_redirects`, `_headers` — deployed routing & headers for Cloudflare Pages.

Useful scripts (examples)
- `convert_transcript_format.py` — normalize raw transcript format
- `update_build.py` / `update_last_updated.py` — post-build helpers
- `minify-css.py`, `minify-js.py`, `optimize_images.py` — asset optimizations

Core conventions (quick)
- Frontmatter keys must match the project's schema exactly.
- Transcript body must use `transcript-container` and `speaker-block` HTML.
- Tags are deduplicated/slugified via Eleventy collections.
- Reading time = ceil(wordCount / 200).

---

**Explanation**

Architecture overview
- Static site built by Eleventy (input: `articles/`, layouts in `_includes/`) → output `_site/`.
- Content processing: Python helpers + custom Copilot agents for large-scale conversions and fixes.
- CI/CD: Cloudflare Pages builds on push to `main`, output dir `_site/` (see `wrangler.toml`).

Why HTML-embedded transcripts?
- The conversation transcript format (HTML `speaker-block`s) preserves speaker structure and consistent styling across thousands of articles; it avoids the ambiguity of freeform Markdown for dialogue.

Agents & workflow rationale
- `blog-converter` and `article-fixer` provide reproducible, resumable processing with progress logs (`_blog_conversion_progress*.md`, `_article_fix_progress.md`). They reduce human error and keep articles consistent.

Where to start (recommendation for new contributors)
1. Read this document.
2. Run the quick-start tutorial (dev server).
3. Try adding a small article in `articles/` following the exact frontmatter + transcript HTML.
4. For batch work, learn the `blog-converter` agent workflow and its progress tracking pattern.

---

Files created:
- `DOCUMENTATION.md` (this file)

If you'd like, I can split this into separate files under a `docs/` directory, add more step-by-step screenshots, or scaffold a `CONTRIBUTING.md` to guide non-dev content contributors.