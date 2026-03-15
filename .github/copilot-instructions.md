# Jai Khyapa Parampara — Copilot Instructions

## Project Overview

This is a static site built with **Eleventy 11ty** (a JavaScript static site generator) hosted on **Cloudflare Pages**. The core content is a spiritual blog featuring conversations with Guru Shyama Khyapa, with 500+ articles covering spiritual teachings, prophecies, and guru stories. Articles are published in both **English** (transcribed from Bengali YouTube videos) and use HTML templates embedded in Markdown.

## Build & Deployment

- **Build**: `npm run build` — Runs Eleventy, outputs to `_site/`
- **Dev serve**: `npm run serve` or `npm start` — Eleventy with live reload on `http://localhost:8080`
- **Deployment**: Automatic via Cloudflare Pages on push to `main`. Build settings are in `wrangler.toml` with output dir `_site/`

## Repository Structure

- **`articles/`** — 500+ article markdown files (frontmatter + HTML transcript divs)
- **`_includes/`** — Nunjucks templates (`article.njk`, `base.njk`)
- **`markdownfiles_forblog/`** — Raw transcripts in three states:
  - `tobeprocessed/` — Raw YouTube transcript files (title, link, dialogue in `**Name:**` format)
  - `processed/` — Transcripts that have been converted to blog posts
  - `redundant/` — Duplicates/archived transcripts
- **`.eleventy.js`** — Build config: passthrough for assets, tag collections, date filters, article sorting
- **`scripts/`** — Python scripts (`update_build.py`, `update_last_updated.py`) for post-build automation

## Key Conventions

### Article Frontmatter & Structure

Every article follows this exact YAML frontmatter:
```yaml
layout: article
title: "Full Title Here"
breadcrumbTitle: "Short 5-7 Word Version"
description: "1-2 sentence summary"
keywords: "Guru Deva Shyama Khyapa, Gupta Sadhak, Smashana Bhairava, Khyapa Parampara, [topic-specific terms]"
category: "Guru Stories" | "Spiritual Teachings" | "Discourse"
author: "🗣️ Gupta Sadhak Shyama Khyapa"
date: 2026-03-05  # or with time for batch articles: 2026-03-05 10:00:00
readingTime: 6    # word count ÷ 200, rounded up
tags:
  - articles
  - Guru Baba Shyama Khyapa
  - [topic tags as hyphenated keywords]
source: |
  <p><strong>Source:</strong> YouTube video | Bengali to English Translation</p>
  <p><a href="https://www.youtube.com/watch?v=..." target="_blank" rel="noopener" style="color:var(--accent-bright);">📺 Watch Original Bengali Video</a></p>
  <p style="margin-top:0.5rem;"><em>Verified by Kaliputra-Ashish</em></p>
```

### Transcript HTML Format

All article bodies use a `transcript-container` div with embedded `speaker-block` divs (no regular markdown lists/paragraphs in the body):

```html
<div class="transcript-container" style="background:rgba(45,15,24,0.4);border:1px solid var(--border-gold);padding:2.5rem;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.3);margin-bottom:2rem;">

<div class="speaker-block" style="margin-bottom:2rem;border-left:3px solid var(--accent-color);padding-left:1.5rem;">
<span class="speaker-name" style="font-weight:700;color:var(--accent-bright);margin-right:0.5rem;text-transform:uppercase;letter-spacing:1px;font-size:1rem;">SPEAKER NAME:</span>
<span class="speech-text" style="display:block;margin-top:0.5rem;">Full text of what they said.</span>
</div>

</div>
```

**Key points:**
- Speaker labels use uppercase, gold-colored inline styling
- Speech text is plain (no italics or markdown formatting)
- Multiple speaker blocks per article; common speakers are `Devotee:`, `Guru Shyama Khyapa:`, `Narrator:`
- No regular markdown headings inside the body — conversation structure provides organization

### Eleventy Collections & Filters

- **`articles` collection** — All `.md` files in `articles/`, sorted by date (newest first), then by filename
- **`allTags` collection** — Deduplicated tags across all articles (slugified to handle case differences)
- **`all` collection** — Dynamic tag collections merging tags that slugify to the same URL
- **Date filters**: `dateDisplay` (formatted), `isoDate` (ISO 8601 for schema.org)
- **`relatedArticles` filter** — Returns up to 4 articles sharing at least one content tag with current article

### Asset Management

Eleventy passthrough copies (no processing):
- CSS: `styles.css`, `styles.min.css`, `icons.css`, `performance-optimizations.css`, `CLS_FIXES.css`
- JS: `script.js`, `script.min.js`, `translations.js`
- Images & media: `images/`, `*.{png,jpg,webp,mp3}`
- Metadata: `manifest.json`, `robots.txt`, `favicon-*`
- Cloudflare config: `_headers`, `_redirects`

Sitemap is generated and copied to root after build (`.eleventy.js` hook).

## Custom Copilot Agents

Two specialized agents are configured in `.github/agents/`:

1. **`article-fixer`** — Fixes stub articles by rewriting them as full word-for-word transcripts sourced from YouTube transcripts. Tracks progress in `_article_fix_progress.md`. Processes articles one at a time in strict order, stops every 10 to confirm continuation.

2. **`blog-converter`** — Converts raw transcript files from `markdownfiles_forblog/tobeprocessed/` into fully formatted blog posts in `articles/`. Automatically checks for duplicates, generates frontmatter metadata, performs session resume tracking via `_blog_conversion_progress.md`. Stops every 50 articles to confirm continuation.

**Use these agents via the Task tool** with `agent_type: "article-fixer"` or `agent_type: "blog-converter"` for content processing workflows.

## Common Tasks

- **Add a new article**: Create markdown file in `articles/` with the exact frontmatter structure above, use transcript HTML format for body.
- **Process transcripts**: Use the `blog-converter` agent to convert files from `markdownfiles_forblog/tobeprocessed/`.
- **Fix published articles**: Use the `article-fixer` agent to rewrite March 9 articles with full transcript content.
- **Verify build**: Run `npm run build` and check `_site/` output; then run `npm start` to serve and test locally.
- **Python helpers** in root: Use sparingly; most content work is done through Eleventy or the agents.

## SEO & Metadata

- All articles include the core guru name keywords in `keywords` field
- Reading time estimates are consistent: `ceil(wordCount / 200)`
- Tags are normalized/slugified for consistent URL generation (deduplication in Eleventy config)
- Category field uses exactly 3 types: "Guru Stories", "Spiritual Teachings", "Discourse"
- Each article links to its source YouTube video in the `source` HTML block

## MCP Servers

Two MCP servers are configured to enhance Copilot's capabilities:

1. **Web Browsing** — Enables verification of YouTube links, scraping of transcript data, and checking external references. Useful when validating article sources or finding new content.

2. **File System** — Provides advanced file operations and structured exploration of the `markdownfiles_forblog/` and `articles/` directories for batch processing or analysis.

These servers are optional but recommended for content workflow tasks like verifying YouTube URLs or analyzing article distributions.

## Notes for Future Sessions

- **Don't run Python scripts for content processing** — use the custom agents instead; they track progress and maintain session resume capability.
- **Article dates** — When adding multiple articles in a batch, use incrementing timestamps (e.g., `2026-03-09 10:00:00`, `10:01:00`, `10:02:00`) to keep articles sortable by recency.
- **Keywords field** — Always include the four core Khyapa Parampara terms for consistency across all articles.
- **Transcript HTML is mandatory** — Do not use regular Markdown lists or paragraphs for dialogue; use the `transcript-container` and `speaker-block` HTML structure exactly as shown.
