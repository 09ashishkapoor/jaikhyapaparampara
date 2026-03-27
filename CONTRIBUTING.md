# Contributing — Content & Editorial Guidelines

Purpose

This document helps non-dev content contributors and editors follow repository conventions for adding or fixing articles.

Quick checklist for new content

- Use the exact frontmatter schema in `docs/How-to.md`.
- Body must use `transcript-container` and `speaker-block` HTML blocks.
- Include a `source` block with YouTube link and verification line.
- Set `readingTime` to `ceil(wordCount / 200)`.

Before you open a PR

1. Run `npm run serve` and preview your article locally.
2. Confirm frontmatter fields match the required keys and formats.
3. Run the linting/cleanup scripts if the repo uses them (ask maintainers if unsure).
4. Add a concise commit message: `content: add article - <short-title>`.

PR checklist for reviewers

- Verify frontmatter keys and values (title, breadcrumbTitle, description, keywords, category, author, date, readingTime, tags, source).
- Preview the page locally (`npm run serve`) and check formatting and speaker blocks.
- Confirm `source` links open the YouTube video and attribute correctly.
- Confirm tags follow project conventions (use existing tags when applicable).

Agent & batch processing notes (for maintainers)

- For batch conversions use the `blog-converter` agent family and review `_blog_conversion_progress*.md`.
- For published-article fixes use `article-fixer` and review `_article_fix_progress.md`.
- Validate a small sample before approving a large run.

Need help?

Open an issue or ping the repo maintainer with the PR link and a short description of the requested change.
