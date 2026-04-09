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

The site contains **1,084 articles**: word-for-word conversations, Guru stories, spiritual discourses, and prophecies — originally spoken in **Bengali**, transcribed from YouTube and translated into **English**.

### The Tradition

The Khyapa Parampara is a living Tantric lineage rooted in the worship of **Ma Kali** and **Kalabhairava Baba**. Its teachings are are available now in English. *Khyapas* — mean the divine mad who dont shy away from the truth. Irrespective of the consequences.   

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

---

## Tech Stack

| Layer | Technology |
|---|---|
| Static site generator | [Eleventy (11ty)](https://www.11ty.dev/) v2 |
| Templating engine | Nunjucks |
| Content format | Markdown + YAML frontmatter + inline HTML |
| Deployment | [Cloudflare Pages](https://pages.cloudflare.com/) (auto-deploy on push to `main`) |
| Node version | 18 (pinned in `.node-version`) |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/jaikhyapaparampara.git
cd jaikhyapaparampara

# Install dependencies
npm install

# Build to _site/
npm run build

# Serve locally with live reload at http://localhost:8080
npm start
```

After cloning, the site builds and serves identically to production — no environment variables or secrets required.

---

## Repository Structure

```
articles/                     # 1084 Markdown articles
_includes/                    # Nunjucks templates
│   base.njk                  #   Site shell (head, nav, footer)
│   article.njk               #   Per-article layout
images/                       # Site images (WebP optimised)
markdownfiles_forblog/        # Raw YouTube transcript staging area
│   tobeprocessed/            #   Awaiting conversion → articles/
│   processed/                #   Converted transcripts (archive)
│   redundant/                #   Duplicates / retired files
docs/                         # How-to guides and editorial notes
scripts/                      # Python build & audit helpers
.eleventy.js                  # Eleventy build config
wrangler.toml                 # Cloudflare Pages config
styles.css / styles.min.css   # Stylesheet (source + minified)
script.js  / script.min.js    # Frontend JS (source + minified)
translations.js               # i18n strings (EN / HI)
sitemap.njk                   # Sitemap template → sitemap.xml
search-index.njk              # Client-side search index
gallery.html                  # Sacred image gallery
_headers                      # Cloudflare HTTP response headers
_redirects                    # Cloudflare URL redirects
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

Cloudflare Pages auto-deploys on every push to `main`. The build output directory is `_site/` (configured in `wrangler.toml`). No extra secrets or environment variables are needed.

To deploy your own fork:
1. Connect the repository to Cloudflare Pages.
2. Set build command: `npm run build`
3. Set output directory: `_site`

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
