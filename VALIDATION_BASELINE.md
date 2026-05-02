# Validation Baseline Standard

This repo now uses a small validation baseline designed for static or frontend-heavy sites that need repeatable merge checks without a large test harness.

## What was standardized
- **Existing repo validation kept:** the Eleventy build remains the core baseline and is run before browser checks.
- **Playwright smoke coverage:** focused on the highest-value flows for this site:
  1. homepage loads with the key archive entry points,
  2. homepage search leads into a real article,
  3. gallery lightbox opens, advances, and closes.
- **Accessibility check:** a scoped `@axe-core/playwright` scan of the search results experience (`/search/?q=bhairava`), which is a stable critical discovery flow.
- **Visual regression:** only three stable surfaces are snapshotted:
  - homepage hero,
  - search landing panel,
  - gallery featured row.
- **Performance budget:** a Playwright budget test for the homepage shell using navigation timings, LCP, resource count, and transfer size.
- **CI baseline:** GitHub Actions runs the Playwright suite on **Windows + Chromium** so the committed visual baselines match the platform used to capture them locally.
- **Link checking in CI:** `lycheeverse/lychee-action` checks `README.md` plus built key entry pages after the site is generated.

## Files to copy when reusing this pattern
For a similar repo, start by copying and then adapting these files:
- `playwright.config.js`
- `scripts/serve_test_site.js`
- `tests/helpers/site.js`
- `tests/smoke/`
- `tests/accessibility/`
- `tests/visual/`
- `tests/performance/`
- `.github/workflows/validation.yml`
- the `package.json` validation scripts

## How to adapt it for another repo
1. **Keep the build/test command that already matters.** In this repo that is `npm run build`.
2. **Pick only 1-3 smoke flows.** Choose routes that represent the real happy path, not every feature.
3. **Scope accessibility to one stable critical flow first.** Expand only after that path is reliable.
4. **Choose visual targets that do not churn.** Prefer stable panels/sections over full pages.
5. **Measure before choosing budgets.** Start with current timings, then set thresholds with some headroom.
6. **Match CI to the snapshot platform.** If baselines are captured on Windows, keep CI on Windows until you intentionally rebaseline elsewhere.

## Local commands
- Run the full browser validation baseline:
  ```bash
  npm run validate
  ```
- Refresh visual baselines intentionally:
  ```bash
  npm run validate:update-snapshots
  ```

## How to intentionally update visual baselines
Only update screenshots when the UI change is expected.

1. Make the intended UI change.
2. Run:
   ```bash
   npm run validate:update-snapshots
   ```
3. Review the files created or changed under `tests/visual/*-snapshots/`.
4. Re-run the full suite with:
   ```bash
   npm run validate
   ```
5. Commit the updated snapshot files with the code change that required them.

## Repo-specific notes
- The validation helpers block analytics and Google-hosted font requests so browser tests stay deterministic.
- The smoke suite prefers semantic selectors and stable text over brittle DOM indexing.
- The visual scope is intentionally narrow so this stays reviewable and low-flake.
