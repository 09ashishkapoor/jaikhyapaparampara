# Repository instructions

Read `ROADMAP.md` before non-trivial work. It is the source of truth for planned
changes and the constraints below.

1. **After adding or editing an article, run `npm run og` and commit the changed
   files in `images/og/`.** Articles ship incomplete without a 1200×630 social
   card. `npm run og -- --check` lists missing or stale cards. If you change the
   card design in `scripts/generate-og.js`, bump `CARD_VERSION` first so every
   card is regenerated.

2. **Never resize, re-encode over, or delete a file in `images/gallery/`.** The
   gallery masters are the archive, they are linked from the lightbox "View
   original" control, and they are published in the gallery `image[]` JSON-LD.
   Derivatives go in a separate output directory; never write a same-name `.webp`
   sibling next to a `.jpg` source (11 such pairs already exist).

3. **Never add a root-level `.md` file without checking `.eleventyignore`.** A
   root Markdown file that is not ignored is published as a bare HTML fragment.
   `/*.md` and `archive/` are currently ignored; verify before adding an
   exception.

4. **Editing `styles.css` requires `python minify-css.py`; editing `script.js`
   requires `python minify-js.py`.** Neither minify step runs inside
   `npm run build`, so an unminified edit never reaches the site. Link the
   stylesheet with the absolute path `/styles.min.css`; the homepage's relative
   `href="styles.min.css"` only works because it is at `/`.

5. **Build and verify by reading `_site/`.** Run `npm run build:test` (~105 s,
   ~3,700 files), then inspect the generated file. Do not trust the build log.
   Serve `_site` if you need to check a page in a browser.

6. **Article frontmatter must satisfy the taxonomy guard.** Required:
   `layout: article`, `title`, `description`, `date`, and a `category` that
   resolves through `categoryAliases` in `_data/topics.js` — an unknown category
   fails the build. Prefer the canonical hub name (for example "Prophecy and
   World Events").

7. **Sacred text is immutable.** Do not edit transcript bodies, mantras,
   quotations, speaker labels, or translations in `articles/` unless explicitly
   asked. Transcript-context work follows
   `.agents/skills/transcript-context/SKILL.md`, including its one-article-per-run
   rule and its `guard.py` check.

8. **Anything non-trivial goes through `ROADMAP.md`.** Do not relitigate its
   settled decisions, and do not copy image-optimisation recipes that resize
   sources in place.

9. **`/stats/` is private and there is no third-party analytics tag.** The
   dashboard renders traffic data, is `noindex`, excluded from `sitemap.liquid`,
   and protected by Cloudflare Access. Never link it from navigation, the
   footer, or `llms.txt`; never put traffic JSON on a public path; never commit
   an `.analytics/` file. Measurement is Cloudflare Web Analytics (edge-injected,
   cookieless) plus the Search Console API — do not re-add Google Analytics or
   any other client-side tracker. Run `npm run test:analytics` after touching
   `lib/analytics/` or `scripts/analytics-*.js`.

10. **Fonts are self-hosted; never re-add a Google Fonts reference.** `fonts/`
    holds the Crimson Text + Philosopher woff2 subsets and the generated
    `fonts/fonts.css`. Regenerate with `npm run fonts:fetch` instead of editing
    either by hand, and keep the preload hints in `_includes/font-head.liquid`
    pointing at files that exist (`npm run fonts:check` verifies both). The CSP in
    `_headers` no longer allows `fonts.googleapis.com` or `fonts.gstatic.com`.
