# Explanation — Architecture, Conventions, and Agents

Architecture overview

- Source: `articles/` (Markdown + embedded HTML).
- Templates: `_includes/` (Nunjucks).
- Build: Eleventy (`.eleventy.js`) → output `_site/`.
- CI/CD: Cloudflare Pages (configured in `wrangler.toml`).

Why the transcript HTML format?

- Preserves speaker boundaries and styling consistently across thousands of articles.
- Avoids ambiguity of Markdown for dialogue and simplifies programmatic processing.

Agents & workflow rationale

- `blog-converter` family: deterministic, resumable batch converters with progress logs. Use for high-throughput conversions.
- `article-fixer`: targeted rewrites of published content using verified transcripts.
- Progress files (`_blog_conversion_progress*.md` and `_article_fix_progress.md`) enable resume, auditing, and manual review checkpoints.

Conventions to follow

- Exact frontmatter schema is required for Eleventy collections and SEO consistency.
- Use the `transcript-container` and `speaker-block` structures for all article bodies.
- When batching, validate a small sample before committing a full run.

Recommended onboarding steps

1. Run dev server and explore a few article templates in `_includes/`.
2. Create a sample article and preview locally.
3. Learn the `blog-converter` agent workflow before converting large batches.
