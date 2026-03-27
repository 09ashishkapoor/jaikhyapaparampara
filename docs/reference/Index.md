# Reference — Files, Scripts, Commands

Important files

- `articles/` — Markdown source articles. Follow strict frontmatter + transcript HTML.
- `_includes/article.njk`, `_includes/base.njk` — Eleventy templates.
- `.eleventy.js` — Eleventy configuration (collections/filters/passthrough).
- `_site/` — Generated site output.
- `markdownfiles_forblog/tobeprocessed/` — raw transcript inputs.
- `_blog_conversion_progress*.md`, `_article_fix_progress.md` — agent progress logs.
- `wrangler.toml` — Cloudflare Pages configuration.

Useful scripts

- `convert_transcript_format.py` — normalize transcript input formats.
- `convert_blog_gemini.py` — alternate converter.
- `minify-css.py`, `minify-js.py`, `optimize_images.py` — asset tooling.
- `update_build.py` / `update_last_updated.py` — post-build helpers.

Common commands

```bash
npm ci
npm run serve
npm run build
npm start
```

Eleventy collections to know

- `articles` — all `.md` files in `articles/`, newest-first.
- `allTags` / `all` — tag collections with slug deduping.

Conventions summary

- Reading time = ceil(wordCount / 200).
- Tags slugified and deduplicated in Eleventy config.
- Transcript HTML structure is required for styling and parsing.