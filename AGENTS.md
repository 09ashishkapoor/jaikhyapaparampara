# Repository Guidelines

## Project Structure & Module Organization
- `articles/` contains Eleventy content: Markdown files with YAML frontmatter and transcript-style HTML bodies.
- `_includes/` holds the Nunjucks templates (`base.njk`, `article.njk`).
- Root-level assets such as `index.html`, `styles.css`, `script.js`, `translations.js`, `gallery.html`, and `images/` are copied through the Eleventy build.
- `scripts/` plus root-level Python helpers handle build metadata, minification, and audits.
- `_site/` is generated output. Do not edit it directly.

## Build, Test, and Development Commands
- `npm install` — install Eleventy dependencies (Node `18` is pinned in `.node-version`).
- `npm run build` — build the static site into `_site/`.
- `npm run serve` or `npm start` — run Eleventy locally with live reload on port 8080.
- `npm run update-build` — refresh build metadata on Bash-based environments; on Windows, use `update_build_info.bat` if needed.
- `python minify-css.py` / `python minify-js.py` — regenerate `styles.min.css` and `script.min.js` after editing source assets.
- `python audit_site.py` or `python seo_audit.py` — optional audit checks.

## Coding Style & Naming Conventions
- Match the surrounding file style: `.eleventy.js` and templates lean toward 2-space indentation, while legacy frontend JS and Python commonly use 4 spaces.
- Keep article and asset filenames lowercase and kebab-case, for example `new-spiritual-teaching.md`.
- Keep Python utility names snake_case (for example, `update_last_updated.py`).
- Preserve existing Eleventy, Nunjucks, and transcript HTML patterns; no dedicated formatter or linter is configured.

## Testing Guidelines
- There is no formal automated test suite yet; `npm run build` is the required baseline check for every change.
- For content, layout, or asset updates, also run `npm run serve` and manually review the affected pages in the browser.
- Regenerate minified assets from their source files before submitting related CSS or JS changes.

## Commit & Pull Request Guidelines
- Recent commits use short imperative subjects, sometimes with prefixes such as `feat:`, `Fix:`, or `Refactor`. Follow that pattern and keep the summary specific.
- Preferred examples: `fix: correct sitemap copy step` or `content: add new discourse article`.
- PRs should include a summary, affected folders/files, verification commands run, and screenshots for template or styling changes.
- If the change affects articles or SEO, call that out explicitly in the PR description.

## Content-Specific Notes
- New articles belong in `articles/` and should keep the existing frontmatter fields, category values, and transcript container markup.
- Avoid changing generated files or Cloudflare output settings unless local builds have been tested.
