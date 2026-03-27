# Jai Khyapa Parampara — Static Eleventy Site

## Project Description

Jai Khyapa Parampara is a content-focused static website built with Eleventy (11ty) that publishes English-transcribed Bengali conversations and teachings of Guru Shyama Khyapa. The repository contains 500+ articles, templates, conversion helpers, and custom Copilot agents to streamline transcript-to-article workflows and publishing to Cloudflare Pages.

## Technology Stack

- Static site generator: Eleventy (11ty)
- Node.js / npm for build & dev tooling
- Python 3 for content-processing helpers and scripts
- Cloudflare Pages for deployment (configured via `wrangler.toml`)
- Templates: Nunjucks (`_includes/article.njk`, `_includes/base.njk`)

## Getting Started

Prerequisites:

- Node.js (recommended: 18+)
- npm
- Python 3

Install dependencies:

```bash
npm install
```

Build the site:

```bash
npm run build
```

Serve locally with live reload:

```bash
npm run serve
# or
npm start
```

Output is written to `_site/` (this is the directory published to Cloudflare Pages).

## Project Structure

- `articles/` — Markdown article files (frontmatter + HTML transcript bodies)
- `markdownfiles_forblog/` — Raw transcripts to be processed
  - `tobeprocessed/` — raw inputs
  - `processed/` — converted posts
  - `redundant/` — archived/duplication
- `_includes/` — Nunjucks templates (`article.njk`, `base.njk`)
- `_site/` — generated site output (build artifact)
- `scripts/` and root-level Python utilities — helpers for migration, SEO, and content checks
- `.github/agents/` and `.github/skills/` — custom Copilot agents and skills
- `wrangler.toml` — Cloudflare Pages build config
- Utility files: `sitemap.njk`, `search-index.11ty.js`, `performance-optimizations.css`, etc.

## Article Conventions (Reference)

- Frontmatter schema (required fields): `layout`, `title`, `breadcrumbTitle`, `description`, `keywords`, `category`, `author`, `date`, `readingTime`, `tags`, `source`.
- Body format: every article uses a `transcript-container` div with `speaker-block` entries — avoid plain Markdown paragraphs for dialogues.
- Categories: exactly one of `"Guru Stories"`, `"Spiritual Teachings"`, or `"Discourse"`.
- Reading time: `ceil(wordCount / 200)`.

(See `.github/copilot-instructions.md` for full conventions and examples.)

## Key Features

- Automated conversion pipelines and helper scripts to transform YouTube transcripts into publishable articles.
- Custom Copilot agents: `blog-converter`, `article-fixer`, and parallel converter instances for batch processing.
- SEO-focused frontmatter and tag normalization/slugification via Eleventy config.
- Passthrough handling for static assets (CSS/JS/images) and sitemap generation.

## Development Workflow

Common tasks:

- Convert raw transcripts: use the `blog-converter` agent or the `markdownfiles_forblog/tobeprocessed/` pipelines.
- Fix published stub articles: use the `article-fixer` agent (configured to run in controlled increments).
- Add a new article: create a markdown file in `articles/` following the required frontmatter and transcript HTML format.

Scripts and helpers:

- `convert_transcript_format.py`, `convert_articles.py`, and other Python scripts assist automated conversions.
- `update_build.py` / `update_last_updated.py` helpers run post-build tasks.

Agent usage note: custom agents and skills are defined under `.github/agents/` and `.github/skills/`. These include `blog-converter`, `article-fixer`, and parallel converters (`blog-converter-a`, `-b`, `-c`).

## Testing & Verification

- Build locally and inspect `_site/`:

```bash
npm run build
# inspect _site/
```

- Serve locally to verify templates and live reload:

```bash
npm run serve
```

- Scripts for audits and checks:

- `seo_audit.py`, `audit_site.py`, `analyze_lighthouse.py` — run as needed (ensure Python deps are installed).

## Contributing

- Follow the article frontmatter and transcript HTML conventions. Use the provided Copilot agents for bulk processing and the Python helpers for targeted fixes.
- When adding or modifying scripts, keep changes minimal and consistent with existing patterns.
- For major changes (wide renames, schema changes), prepare a Destructive Action Plan (DAP) and request review.

## Useful Commands

```bash
# Install dependencies
npm install

# Build
npm run build

# Serve locally
npm run serve

# Run a Python content script (example)
python3 scripts/check_duplicates.py
```

## Where to Look Next

- Conventions and agent usage: `.github/copilot-instructions.md`
- Templates: `_includes/article.njk`, `_includes/base.njk`
- Raw transcripts: `markdownfiles_forblog/tobeprocessed/`
- Progress trackers: `_article_fix_progress.md`, `_blog_conversion_progress*.md`

## License

This repository does not include an explicit license file. Add a `LICENSE` file if you intend to permit reuse.

---

If you'd like, I can now:
- expand any section with examples, or
- open a PR with this README and a short CHANGELOG entry.
