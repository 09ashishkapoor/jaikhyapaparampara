# PRD — Articles Directory Navigation

## Problem
`/articles/` currently behaves like a 22-page chronological archive. With 1084 articles, the primary browsing experience overwhelms users who want to discover by topic rather than by publish order.

## Goal
Turn `/articles/` into a modern, beautiful, directory-first experience that helps readers find one article to start with quickly, then continue into adjacent reading paths.

## User Intent
- Discover by topic/theme, not by date
- Feel less overwhelmed on first arrival
- Follow a self-directed path rather than an editorially curated one

## Requirements
1. Replace chronology-first archive browsing with topic/group-led entry points.
2. Use neutral, higher-level browse groups derived through deterministic normalization of existing metadata where needed.
3. Preserve existing article URLs, article content, and search behavior.
4. Keep an exhaustive all-articles path available as a fallback, but make that fallback non-date-based.
5. Support onward reading after the first article selection.
6. Avoid date-based grouping in both the primary IA and the exhaustive fallback browse path.
7. Avoid featured/curated editorial pathways.

## Non-goals
- Retagging the corpus manually
- Rewriting article content
- Replacing search
- URL migrations
- Date-based archive redesign

## Touchpoints
- `articles/index.njk`
- `articles/tags.njk`
- `.eleventy.js`
- archive CSS/JS embedded in the template or shared assets

## Acceptance Criteria
- `/articles/` no longer opens with a simple long chronological list as its main structure.
- A user can identify a topic path quickly without browsing page numbers.
- The primary IA is topic/group-led, not date-led.
- Existing search and URLs still work.
- The page includes a clear fallback to browse all articles.
- The fallback browse-all path is not organized by publish date.
- The page makes onward reading obvious after a user picks one path.
