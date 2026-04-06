# Autopilot Implementation Plan — archive-search-removal

1. Remove archive search input/results code from `articles/index.njk`, keeping only non-search discovery actions that still work.
2. Replace the homepage search strip in `index.html` with browse/surprise CTAs instead of a broken query flow.
3. Keep `search-index.json` generation untouched because homepage spotlight/topic cloud/surprise still depend on it.
4. Rebuild and verify:
   - `/articles/` no longer shows search UI
   - homepage no longer routes users to `/articles/?q=`
   - surprise buttons still work via `search-index.json`
   - build succeeds
