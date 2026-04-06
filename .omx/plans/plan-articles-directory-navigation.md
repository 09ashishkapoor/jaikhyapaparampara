# Articles Directory Navigation Plan

## Title
Redesign `/articles/` into a directory-first, topic-led archive without changing article URLs, content, or search.

## RALPLAN-DR Summary
### Principles
1. Discovery should start with topics, not chronology.
2. The archive should reduce overwhelm before asking users to scan long lists.
3. Navigation must remain neutral and self-directed, not editorially curated.
4. Existing content, URLs, and search are preserved.
5. Prefer derived high-level browse groups over noisy raw metadata when usability conflicts with literalness.

### Decision Drivers
1. Reduce first-click friction for a 1084-article archive.
2. Avoid bias while still providing clearer structure than the current 22-page chronological list.
3. Stay within the existing Eleventy/Nunjucks architecture with low migration risk.

### Viable Options
| Option | Pros | Cons |
|---|---|---|
| A. Directory-first landing with deterministic derived high-level browse groups and a non-date-based all-articles fallback | Best matches user intent; reduces overwhelm; can reuse existing metadata and keep URLs/search intact | Requires introducing a normalization layer for uneven categories/tags |
| B. Keep chronological archive primary, but add more chips/filter controls around it | Lowest implementation risk; preserves current page model | Still centers scanning long lists; does not solve the core “22 pages of history” problem |
| C. Make raw tag/category pages the main archive IA | Neutral and metadata-driven; existing tag pages already exist | Current metadata is too sparse/uneven; would expose taxonomy noise directly |

**Chosen:** Option A.

## Architect Review
### Verdict
Sound-with-revisions.

### Steelman antithesis
Option C is the purest expression of self-directed discovery because it avoids introducing a derived taxonomy layer that could itself encode bias. If the site can expose existing tags/categories more clearly, adding a new grouping layer may be unnecessary interpretation.

### Real tradeoff tension
Neutrality vs legibility: preserving raw labels is more literal, but the current long-tail taxonomy makes the archive harder to navigate. Derived grouping adds interpretation, but it can be constrained to structural cleanup rather than editorial recommendation.

### Principle violations or architectural risks
- If the fallback “browse all” path remains chronology-first, the plan partially violates the no-date-grouping instruction.
- If representative entry points link directly to hand-picked articles, the design drifts into editorial curation.
- If grouping logic lives only inside `articles/index.njk`, the IA becomes hard to test and maintain.

### Recommended revisions
- Build browse groups through a deterministic build-time normalization layer in code/data rather than inline template logic.
- Make the fallback exhaustive path non-date-based (for example alphabetical browse or search-first exhaustive access), not chronological.
- Ensure group entry points lead to group/subgroup browse states, not hand-picked “featured” articles.

### Synthesis
Use derived high-level browse groups only at the top-level directory, preserve raw article pages/URLs/search, and keep the exhaustive fallback neutral and non-date-based.

## Critic Verdict
**APPROVE** — after incorporating the architect revisions for deterministic grouping, non-date fallback browsing, and non-curated group entry points.

## Proposed Approach
Turn `articles/index.njk` into a directory landing page that first presents a concise set of neutral topic groups, then subgroup/browse entry points, then a secondary exhaustive access path that is not based on date. Keep search intact, but remove chronology from the archive’s primary mental model.

## Workstreams / Implementation Steps
1. **Archive IA shaping**
   - Inspect article metadata patterns and define deterministic normalization rules for high-level browse groups.
   - Prefer a build-time helper/collection (for example in `.eleventy.js` or a small `_data` helper) rather than embedding grouping logic directly in `articles/index.njk`.
2. **Template redesign**
   - Replace chronology-first archive hero/list in `articles/index.njk` with directory-first sections: high-level groups, explanatory copy, and a clear all-articles fallback.
   - Preserve existing search box behavior.
3. **Browse pathways**
   - Add group-entry affordances and onward-reading pathways that let users continue from one topic area into adjacent ones.
   - Ensure group cards link to browse states or grouped lists, not editorially chosen single articles.
   - Reuse `articles/tags.njk` where helpful, but do not make raw tags the primary IA.
   - Design the exhaustive fallback as non-date-based.
4. **Styling and interaction polish**
   - Add visual hierarchy, modern card/group styling, and lightweight JS only where needed for group reveal/filter interactions.
   - Keep the core IA server-rendered so navigation remains usable without extra client logic.
5. **Verification**
   - Build locally, review desktop/mobile archive flows, verify existing article links/search still work, and confirm date grouping is absent from both the primary IA and the exhaustive fallback.

## Risks & Mitigations
- **Risk:** Derived groups feel arbitrary.  
  **Mitigation:** Base them on repeatable metadata normalization rules, not hand-picked featured content.
- **Risk:** The fallback path quietly reintroduces chronology and undermines the core IA goal.  
  **Mitigation:** Make the exhaustive path alphabetical or otherwise neutral, and verify that date is not used as a browse scaffold.
- **Risk:** Metadata gaps produce empty or lopsided groups.  
  **Mitigation:** Design groups as broad entry buckets and keep all-articles/search fallback intact.
- **Risk:** The redesign becomes visually strong but still hard to scan.  
  **Mitigation:** Verify the “find first article in under ~10 seconds” journey explicitly.

## Verification Strategy
- `npm run build`
- `npm run serve`
- Manual walkthroughs:
  1. First-time visitor lands on `/articles/` and can identify a topic path immediately.
  2. User can reach an article without paging through chronology.
  3. User can continue into adjacent reading after opening one article.
  4. Existing search and article URLs still behave as before.
  5. No primary grouping, sectioning, or exhaustive fallback browse path is date-based.
  6. Group entry points do not rely on hand-picked “featured article” choices.

## ADR
- **Decision:** Make `/articles/` a directory-first, topic-led landing page with deterministic derived high-level browse groups and a non-date-based exhaustive fallback.
- **Drivers:** Reduce overwhelm; preserve neutrality; avoid URL/search/content churn; fit existing Eleventy structure.
- **Alternatives considered:** enhanced chronological list; raw metadata-first IA.
- **Why chosen:** It best aligns with the user’s explicit goals and current metadata realities.
- **Consequences:** Requires a light taxonomy normalization layer and template rewrite, but avoids broad content migration and keeps search/URLs stable.
- **Follow-ups:** Reassess whether any high-level groups should become dedicated landing pages after usage review.

## Available-agent-types roster
- `executor` — primary implementation lane, reasoning: **high**
- `architect` — review IA boundaries and normalization rules, reasoning: **high**
- `designer` — refine scanability and visual hierarchy, reasoning: **high**
- `test-engineer` — define browse-path verification and regression checks, reasoning: **medium**
- `verifier` — final claim validation, reasoning: **high**
- `code-reviewer` — optional final review for maintainability, reasoning: **high**

### Handoff guidance
- **`ralph` path:** best if one owner should implement the archive redesign sequentially and keep iterating until browse verification passes.
- **`team` path:** best if splitting into 3 lanes: IA/data shaping, template/styling, verification.
- **Launch hint:** `$team .omx/plans/prd-articles-directory-navigation.md` after plan approval, with verifier lane reserved for final evidence.

## Concrete team verification path
1. Implementation lane updates archive data/model and template.
2. Review lane checks neutrality, no-date-grouping, and UX scanability.
3. Verification lane runs build + manual path checks on desktop/mobile.
4. Final owner confirms acceptance criteria against PRD + test spec before execution mode closes.

## Draft PRD bullets
- Directory-first `/articles/` landing page
- Neutral high-level topic grouping derived from existing metadata
- Exhaustive fallback browse path remains available but is not date-based
- Preserve article pages, URLs, and search behavior
- Encourage onward reading after first article selection
- No date-based grouping in the primary experience

## Draft Test-Spec bullets
- Validate no primary archive section is grouped by date
- Validate the exhaustive fallback browse path is not date-grouped
- Validate first-click path to an article without paging through chronology
- Validate existing search still returns results and does not regress
- Validate representative group links lead to valid archive/article destinations
- Validate group entry points do not depend on curated featured articles
- Validate desktop and mobile scanability/manual UX walkthroughs
