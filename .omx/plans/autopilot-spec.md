# Autopilot Spec — archive-search-removal

## Task
Remove the non-working search affordance from the new `/articles/` experience if it is no longer needed.

## Desired outcome
- No broken/ineffective search UI remains in the archive flow.
- Directory-first browsing stays intact.
- Surprise/random discovery still works.
- Existing `search-index.json` consumers that still add value remain intact.

## Grounded facts
- `/articles/` currently includes a search input in `articles/index.njk`.
- The homepage still contains a search strip that routes queries to `/articles/?q=...` in `index.html`.
- `search-index.json` is also used for homepage article discovery features and surprise/random navigation, so it should not be deleted blindly.

## Scope
- Remove or repurpose the search affordance from `/articles/`.
- Remove or repurpose the homepage search strip so it no longer points to removed archive search behavior.
- Keep random article discovery and other search-index consumers.
