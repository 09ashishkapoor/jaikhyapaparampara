# Jai Khyapa Parampara

*Om Shri Gurubhyo Namaha*

A devotional website dedicated to Gurushreshta Ma Adya Mahakali and Baba Kalabhairava. It contains wisdom and teachings of **Gurubaba Shyama Khyapa** — the ChaturthaPurusha , GuptaSadhaka of the Khyapa Parampara and **Shri Praveen RadhaKrishnan** founder of Kaliputra Mission and my Guru.The site publishes 1000+ articles: conversations, stories, spiritual discourses, and prophecies, originally spoken in Bengali and transcribed into English.

It also hosts free spiritual ebooks and sacred texts including the Adya Mahakali and Kalabhairava Sahasranamas with chanting guides.

Compiled by KaliPutra-Ashish. Curated with love for all seekers.

> Feel free to clone, fork, and build your own version.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Static site generator | [Eleventy (11ty)](https://www.11ty.dev/) |
| Templating | Nunjucks |
| Deployment | [Cloudflare Pages](https://pages.cloudflare.com/) |
| Node version | 18 (pinned in `.node-version`) |

---

## Quick Start

```bash
# Install dependencies
npm install

# Build to _site/
npm run build

# Serve locally with live reload at http://localhost:8080
npm start
```

---

## Project Structure

```
articles/          # 500+ Markdown articles (frontmatter + HTML transcript bodies)
_includes/         # Nunjucks templates (base.njk, article.njk)
images/            # Site images
.eleventy.js       # Eleventy build config
wrangler.toml      # Cloudflare Pages config
styles.css         # Main stylesheet
script.js          # Main JS
translations.js    # i18n strings
sitemap.njk        # Sitemap template
search-index.njk   # Search index template
gallery.html       # Image gallery page
_headers           # Cloudflare response headers
_redirects         # Cloudflare redirects
```

---

## Article Format

Every article is a Markdown file in `articles/` with this frontmatter:

```yaml
layout: article
title: "Full Title"
breadcrumbTitle: "Short 5-7 Word Version"
description: "1-2 sentence summary."
keywords: "Guru Deva Shyama Khyapa, Gupta Sadhak, Smashana Bhairava, Khyapa Parampara"
category: "Guru Stories"   # or "Spiritual Teachings" or "Discourse"
author: "🗣️ Gupta Sadhak Shyama Khyapa"
date: 2026-03-05
readingTime: 6             # ceil(wordCount / 200)
tags:
  - articles
  - Guru Baba Shyama Khyapa
source: |
  <p><strong>Source:</strong> YouTube video | Bengali to English Translation</p>
  <p><a href="https://www.youtube.com/watch?v=..." target="_blank" rel="noopener">📺 Watch Original Bengali Video</a></p>
```

Article bodies use a `transcript-container` / `speaker-block` HTML structure — no plain Markdown paragraphs for dialogue. See any existing article in `articles/` for a working example.

---

## Deployment

Cloudflare Pages deploys automatically from the `main` branch. The build output directory is `_site/` (set in `wrangler.toml`). No additional configuration is needed after cloning.

---

## Minifying Assets

After editing `styles.css` or `script.js`, regenerate the minified versions:

```bash
python minify-css.py
python minify-js.py
```


## License

MIT — use it, copy it, build on it, sell it. See [LICENSE](LICENSE) for the full text.

The teachings belong to the tradition. Share freely.
