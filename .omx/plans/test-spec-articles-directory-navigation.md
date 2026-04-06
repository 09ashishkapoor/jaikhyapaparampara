# Test Spec — Articles Directory Navigation

## Verification Commands
- `npm run build`
- `npm run serve`

## Manual Test Matrix
### 1. First-visit orientation
- Open `/articles/`.
- Confirm the page presents topic/group entry points before any exhaustive chronological list.
- Confirm the page does not require pagination scanning to understand where to start.

### 2. First-click discovery
- From the default `/articles/` view, choose a visible group/path.
- Confirm a user can reach an article or focused sub-browse state without stepping through chronological pagination.
- Confirm group entry points are browse-oriented rather than hand-picked “featured article” shortcuts.

### 3. Neutrality and non-goals
- Confirm there is no featured-editorial path that implies “start here because we chose it for you.”
- Confirm no primary section is grouped by date.
- Confirm the exhaustive fallback browse path is also not grouped by date.
- Confirm article URLs and article content remain unchanged.

### 4. Search regression
- Use the existing archive search.
- Confirm it still fetches and renders results as before.

### 5. Onward-reading flow
- After entering one topic path, confirm the UI exposes adjacent groups, related browse paths, or a clear next step to keep reading.

### 6. Responsive review
- Review the archive on desktop and mobile widths.
- Confirm groups/cards remain scannable and primary actions stay visible.

## Exit Criteria
- Build succeeds.
- Topic-led navigation is primary.
- Date-based grouping is absent from the primary IA.
- Search and existing URLs still work.
- Manual browse-path checks pass on desktop and mobile.
