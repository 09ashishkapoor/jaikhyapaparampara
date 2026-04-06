# Deep Interview Context Snapshot

- **Task statement:** The current blog section has over 1000 articles sequentially paginated at 50 per page, making topic discovery difficult.
- **Desired outcome:** Replace or augment the current archive experience with a navigation model that helps users find topic-relevant articles quickly.
- **Stated solution:** None yet beyond identifying the current chronological pagination as a navigation problem.
- **Probable intent hypothesis:** Improve findability and reduce the effort required to discover relevant articles in a large spiritual content library.
- **Known facts/evidence:**
  - `articles/index.njk` paginates `collections.articles` with `size: 50`.
  - The archive is currently chronological and uses numbered pagination URLs like `/articles/2/`.
  - The archive page already exposes a search input and a small fixed topic shortcut list.
  - `articles/tags.njk` already generates tag landing pages for every tag.
  - The repository currently contains 1084 article markdown files, which implies 22 archive pages at 50 articles per page.
- **Constraints:** Existing Eleventy/Nunjucks patterns should likely be reused; no user-approved implementation scope yet.
- **Unknowns/open questions:** Whether the goal is to redesign the main archive, expand search/filtering, add taxonomy landing pages, or restructure IA more broadly.
- **Decision-boundary unknowns:** What OMX may decide on information architecture, URL changes, UI density, and taxonomy defaults without additional confirmation.
- **Likely codebase touchpoints:** `articles/index.njk`, `articles/tags.njk`, `.eleventy.js`, `search-index.11ty.js`, shared templates/styles/scripts.
