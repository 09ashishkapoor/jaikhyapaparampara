# Deep Interview Transcript Summary — articles-directory-navigation

- **Profile:** standard
- **Context type:** brownfield
- **Final ambiguity:** 11.2%
- **Threshold:** 20%
- **Interview ID:** 4bdad35d-5a14-45db-9d2c-10017dc08140
- **Context snapshot:** `.omx/context/blog-navigation-nightmare-20260405T215223Z.md`

## Condensed Transcript

1. **Q:** What is the archive redesign fundamentally trying to achieve?
   **A:** Turn `/articles/` into a modern, highly navigable, beautiful directory that helps users discover content effortlessly.

2. **Q:** What is out of scope even if it might help discovery?
   **A:** Do not retag hundreds of articles, change article URLs/links, or replace search. The problem is usability, navigation, and grouping.

3. **Q:** What may OMX decide without more approval?
   **A:** Full freedom on grouping model, visual layout, and IA, except do not group articles by date.

4. **Q:** What does success look like for a user?
   **A:** Users should be able to quickly find something they want to read, feel less overwhelmed, start one article, then keep reading more.

5. **Q:** What is the best first-step pattern to reduce overwhelm?
   **A:** Topic/theme groups are preferred over curated featured paths, because curation introduces bias and users should find their own path.

6. **Q:** Given messy existing metadata, should the redesign prioritize cleaner derived browse groups or preserve raw labels literally?
   **A:** Prioritize clean higher-level browse groups.

## Pressure-pass finding
A later follow-up revisited the earlier “let readers find their own path” principle and tested whether that principle should block taxonomy cleanup. The answer clarified that neutral, higher-level derived groupings are acceptable and preferred over preserving noisy labels literally.

## Brownfield evidence notes
- `articles/index.njk` currently paginates `collections.articles` at `50` per page.
- The repository contains `1084` article markdown files, which produces `22` archive pages.
- `articles/tags.njk` already generates tag pages, but current tags are sparse/inconsistent.
- Categories are dominated by a few labels with a long tail of one-off values, so raw metadata is not a sufficient primary IA layer.
