# Analytics presentation — decision record

**Status:** decided 2026-11-16. **A weekly report, not a dashboard.**
**Supersedes:** the 2026-11-16 bake-off proposal (Observable Framework / Rill /
sqldash), which was never run. The research that changed the decision is in §9.
**Related:** [ROADMAP.md](ROADMAP.md) Item 3 and §13, `AGENTS.md` rule 9.

A new session should be able to read this cold and either work the current
report or rebuild the report generator without repeating the research.

---

## 1. The decision

The presentation layer is a **weekly report** written to the private repository
[`09ashishkapoor/jaikhyapaparampara-analytics`](https://github.com/09ashishkapoor/jaikhyapaparampara-analytics),
plus a machine-readable action queue an LLM can work without re-deriving the
numbers.

No dashboard. No server. No Cloudflare Access application. No email integration.
No new runtime beyond the Node that already runs the pipeline.

The collection half is unchanged: `.github/workflows/analytics.yml` pulls Search
Console and Cloudflare Web Analytics nightly into R2.

## 2. Why the dashboard plan was dropped

1. **The questions are the same every week.** "What changed, which pages
   underperform, which queries are one rank away" is a fixed computation, not
   an exploration. A dashboard makes the owner go looking; a report arrives.
2. **The 2026 shortlist did not survive verification** (§9): Observable
   Framework is in maintenance mode, Evidence's current Core no longer supports
   local DuckDB, Rill still requires WSL on Windows, and sqldash is a 0.1.0
   project with one maintainer. Every remaining option was a new runtime to
   babysit for four recurring answers.
3. **A report with follow-up state is not a snapshot.** The earlier draft
   rejected "a file you regenerate and reopen", and that instinct was right.
   This report is pushed, thresholded, short, and re-measures last week's
   advice, which a dashboard cannot do.

The supporting decision from the earlier draft still stands and is now used by
the report: **DuckDB is the query layer over R2.** The report runs the same
aggregations in plain Node so the pipeline stays dependency-free.

## 3. What the report is

Two files per week, committed to the private repository:

```
reports/2026-11-16.md            # one-screen digest
reports/2026-11-16.actions.json  # machine-readable work order
```

Git is the history; there is no separate state file. The next report reads the
most recent `.actions.json` to measure what changed.

### Windows

| Source | Window | Lag |
|---|---|---|
| Search Console | trailing 28 days | 2 days |
| Cloudflare Web Analytics | trailing 28 days | 1 day |

Each is compared with the 28 days before it. Week-over-week is shown only as a
health signal, never as a finding: at ~150 clicks a week it is noise.

### Sections

1. **Scorecard** — clicks, impressions, CTR, average position, page loads,
   visits, current vs previous 28 days.
2. **Do this week** — at most five actions, each with the article, the query or
   page, the number that justifies it, and the file to edit. Four slots go to
   performance work; one is reserved for internal linking when an orphan exists,
   because an orphan never outranks a CTR gap on its own.
3. **Follow-up** — every previously merged action, re-measured after 14 days:
   `improved`, `unchanged`, `regressed`, `measuring`, or `stale`.
4. **Watchlist** — counts and examples for zero-click pages, non-Google
   traffic, orphans, and new articles.
5. **Pipeline health** — latest data date per source, missing raw objects, a
   large week-over-week drop, sitemap coverage.

### Thresholds

| Finding | Rule |
|---|---|
| Striking distance | position 4–15, ≥20 impressions/28d, ≥0.5 pp CTR below the position's expectation |
| Zero-click page | ≥50 impressions and 0 clicks |
| Traffic without Google | ≥20 Cloudflare visits and no Search Console impressions |
| New article not indexed | published 3–14 days ago, no impressions |
| Orphan | no impressions and no page loads in 28 days; rotated by ISO week so the list does not repeat |
| Week-over-week drop | >40% and the prior week had ≥20 clicks |

Thresholds and the CTR-by-position curve live in `lib/analytics/report.js`.
Change them there, not in a workflow or a prompt.

## 4. The action loop

The report computes; an LLM edits; the next report measures. Analysis and action
are deliberately separate so the model never invents numbers.

Per week:

1. Read the newest `reports/*.actions.json`.
2. Take at most five `actions`, highest priority first.
3. Edit **frontmatter only** in this repository: `title`, `description`,
   `metaDescription`, `keywords`, `tags`.
4. If a title changed, run `npm run og` and commit `images/og/`.
5. Run `npm run build:test`.
6. Open one PR per report, listing the action ids.
7. After merging, add `"merged": "YYYY-MM-DD"` and `"pr": "<url>"` to each
   action in the private repository. The next report measures it.

Every `actions.json` carries a `policy` block with the allowed and forbidden
edits and the required commands. That block is the contract; the article body,
mantras, quotations, speaker labels, translations, and images are always out of
bounds (AGENTS rules 1 and 7).

The action types:

| Type | Lever | Probe |
|---|---|---|
| `serp` | title and/or description for a query or a zero-click page | query CTR, or page CTR |
| `links` | tags/keywords, which drive the related-articles grid | page impressions |
| `indexing` | request indexing, then link from a hub | page impressions |

## 5. Components

| Path | Role |
|---|---|
| `lib/analytics/report.js` | pure report builder: windows, findings, actions, follow-up, Markdown |
| `scripts/analytics-report.js` | CLI: reads R2 (or a local store), articles, sitemap, previous report |
| `.github/workflows/analytics-report.yml` | Monday 06:10 UTC: test, pull, build, push to the private repo |
| `tests/unit/analytics-report.test.js` | thresholds, action ranking, follow-up states, rotation |
| `lib/analytics/gsc.js` | now also pulls the `querypage` dataset, so a query maps to its page exactly |
| private repo | report history and merge ledger |

Commands:

```bash
npm run analytics:report                       # R2 -> .analytics/reports
npm run analytics:report -- --now 2026-11-16   # backfill or fixture run
npm run analytics:report -- --store-dir .analytics/fixture-store --sitemap tests/fixtures/analytics/sitemap.xml
```

The workflow no-ops when the `REPORTS_REPO` repository variable is unset, so a
fork cannot fail on a missing secret.

## 6. Privacy

- The site repository is **public**. The report is never printed to stdout in
  CI: both analytics workflows pass `--quiet`, and the daily pull no longer logs
  traffic totals. The report is committed only to the private repository.
- The write credential is an SSH **deploy key** scoped to that one repository
  (`REPORTS_DEPLOY_KEY`), not a personal access token. Revoke it from the
  repository's settings.
- `/stats/` remains an empty, `noindex`, unlinked page. It is not the
  dashboard; P5 (Access) is cancelled and P6 (deploy hook) is unnecessary.
- Nothing derived from traffic (JSONL, CSV, Parquet, report) is committed to
  this repository or placed on a public path.

## 7. Open questions

None. Tuning thresholds is implementation detail, not a decision to relitigate.

## 8. Revisit criteria

- **Eight weeks with no action taken** → stop sending the report. It is not
  earning its existence.
- **Ad-hoc questions dominate** → install the DuckDB CLI and query R2
  directly; do not build a UI for them.
- **The report must be shared with someone else** → Cloudflare Basin (ex-R2
  SQL, GA 2026-10-01) over Iceberg, not `/stats/`.

## 9. Research notes (2026-11-16)

Facts that changed the earlier recommendation:

- **Observable Framework** — last feature release v1.13.0 (2025); latest
  v1.13.4 (2026-03-02) is a dependency patch. Observable's product effort moved
  to Notebook Kit, default since 2026-09-01. Not a foundation for new work.
- **Evidence Core** — MIT and active (7.1k stars), but the current docs list
  Snowflake, BigQuery, Postgres, Redshift, Athena, Databricks, Fabric, SQL
  Server, and MotherDuck as sources; local DuckDB is no longer one. Its R2
  Parquet connector belongs to Evidence *Warehouse* (Studio). Out of scope for
  a local, no-account setup.
- **Rill** — still Windows-via-WSL only (install docs verified 2026-11-16). The
  strongest interaction model in the comparison; rejected on the WSL tax.
- **sqldash** — 0.1.0, Apache-2.0, one maintainer; DuckDB in core, but
  `attach_files` is local only ("remote object storage is not attached
  automatically"). Trial material, not a dependency.
- **DuckDB 2.0.0 LTS** (2026-10-21) — async I/O for object storage;
  `CREATE SECRET (TYPE R2, …)` remains first-class. The query layer is stable.
- **Cloudflare Basin** (ex-R2 SQL) GA 2026-10-01 — serverless SQL over Iceberg
  in R2. Not needed at this data volume; the future sharing option.

## 10. References

- DuckDB — Cloudflare R2 import:
  <https://duckdb.org/docs/2.0/guides/network_cloud_storage/cloudflare_r2_import.html>
- DuckDB 2.0.0 announcement:
  <https://duckdb.org/2026/10/21/announcing-duckdb-200.html>
- Rill install (Windows requires WSL):
  <https://docs.rilldata.com/developers/get-started/install>
- Observable Framework releases:
  <https://github.com/observablehq/framework/releases>
- Evidence docs index: <https://docs.evidence.dev/llms.txt>
- sqldash: <https://pypi.org/project/sqldash/>
- Cloudflare Basin GA:
  <https://github.com/cloudflare/cloudflare-docs/blob/main/src/content/changelog/basin/2026-10-01-basin-ga.mdx>
