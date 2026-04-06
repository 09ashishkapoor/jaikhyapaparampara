# Deep Interview Spec — articles-directory-navigation

## Metadata
- **Profile:** standard
- **Rounds:** 6
- **Final ambiguity:** 11.2%
- **Threshold:** 20%
- **Context type:** brownfield
- **Interview ID:** 4bdad35d-5a14-45db-9d2c-10017dc08140
- **Context snapshot:** `.omx/context/blog-navigation-nightmare-20260405T215223Z.md`
- **Transcript:** `.omx/interviews/articles-directory-navigation-20260405T220634Z.md`

## Clarity Breakdown
| Dimension | Score |
|---|---:|
| Intent | 0.94 |
| Outcome | 0.90 |
| Scope | 0.88 |
| Constraints | 0.86 |
| Success Criteria | 0.78 |
| Brownfield Context | 0.90 |

## Intent
Transform `/articles/` from an overwhelming chronological archive into a modern, beautiful, highly navigable directory that helps readers discover knowledge with minimal friction.

## Desired Outcome
Users should be able to enter the archive, quickly orient themselves through clear topic-led groups, choose one article to start with in under roughly 10 seconds, and then continue into adjacent reading paths without feeling overwhelmed.

## In Scope
- Redesign the `/articles/` landing experience
- Replace chronology-first browsing with directory-first browsing
- Introduce clearer neutral grouping structures for article discovery
- Improve navigation, grouping, visual hierarchy, and onward-reading flow
- Derive cleaner higher-level browse groups from existing metadata where needed
- Reuse current content, URLs, and search rather than rebuilding them

## Out of Scope / Non-goals
- Retagging hundreds of articles manually
- Changing article content
- Changing article URLs or links
- Replacing or re-architecting search
- Date-based grouping as a primary navigation method
- Editorial curation that imposes a “featured path” bias

## Decision Boundaries
OMX may decide without additional confirmation:
- The grouping model
- The information architecture of `/articles/`
- The visual layout and density
- Whether `/articles/` becomes a directory-first landing page instead of chronology-first
- How higher-level browse groups are derived from messy existing metadata

OMX may not:
- Group by date
- Change article URLs/content/search fundamentals
- Turn the archive into a curator-led recommendation system

## Constraints
- Preserve existing article pages and links
- Work within the current Eleventy/Nunjucks codebase
- Prefer neutral, self-directed discovery over editorially curated entry points
- Use cleaner derived browse groups when raw metadata is too noisy to support usability

## Testable Acceptance Criteria
1. `/articles/` no longer relies on a simple 22-page chronological list as the primary browsing experience.
2. A first-time visitor can understand the main topic/group entry points without scanning dozens of article rows.
3. The redesign uses topic/theme grouping rather than date grouping.
4. Existing article URLs remain intact.
5. Existing article search remains intact rather than being replaced.
6. The page visibly supports onward exploration after the first click (for example via adjacent groups, subgroups, or related pathways).
7. The archive feels more modern and visually intentional than the current plain paginated list.

## Assumptions Exposed + Resolutions
- **Assumption:** “Helping users start” might mean editorial curation.  
  **Resolution:** Rejected. The user wants self-directed discovery, not curated featured paths.
- **Assumption:** Existing raw metadata should be preserved literally to avoid bias.  
  **Resolution:** Rejected. Cleaner, higher-level derived grouping is preferred if it reduces friction.
- **Assumption:** Search or article content may need rework.  
  **Resolution:** Rejected. Navigation and grouping are the target; search/content are not the issue.

## Pressure-pass Finding
The interview revisited the “readers should find their own path” principle and stress-tested whether that forbids metadata abstraction. The user explicitly approved clean derived browse groups, which resolved the central IA tension.

## Brownfield Evidence vs Inference
### Evidence
- `articles/index.njk` paginates `collections.articles` with `size: 50`.
- The repository currently has `1084` article markdown files.
- `articles/tags.njk` provides tag landing pages.
- Current categories are dominated by a few labels plus a long tail of one-off values.

### Inference
- Raw tags/categories alone are unlikely to provide a strong primary IA without some normalization or derived grouping.
- A directory-first `/articles/` landing page is likely the best fit for the user’s stated goals.

## Technical Context Findings
Likely touchpoints:
- `articles/index.njk`
- `articles/tags.njk`
- `.eleventy.js`
- `search-index.11ty.js`
- shared archive CSS/JS in the archive template or global assets

## Recommended Handoff
**Recommended:** `$ralplan`

Suggested invocation:
`$plan --consensus --direct .omx/specs/deep-interview-articles-directory-navigation.md`

Reason: requirements are now clear, but the archive redesign still has important IA and implementation tradeoffs that benefit from one planning pass before execution.
