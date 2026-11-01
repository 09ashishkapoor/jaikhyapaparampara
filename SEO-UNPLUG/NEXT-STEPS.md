# Next steps — start here

Paste this file into a new session, or tell the agent: **"Read `SEO-UNPLUG/NEXT-STEPS.md`, `SEO-UNPLUG/README.md`, and `SEO-UNPLUG/PHASE-4-BATCH.md`. Continue from here."**

Last updated: 2026-11-01

---

## Where we are

| Item | State |
|---|---|
| Articles | 1,205 |
| Transcript articles | 962 |
| Context paragraphs done | **205** |
| Eligible remaining | **757** |
| Batches of 5 remaining | **152** |
| Last commit | `d2616c7 Add transcript context to 5 articles` |

The Phase 4 click workflow is working. It drafts 5 articles at a time, opens a review file, applies the reviewed batch, runs the guard, and archives the batch.

**Working tree is clean.** The 20 paragraphs from the last four click batches are committed. To confirm:

```bash
git status --short
python scripts/transcript_context.py status
```

Expected: clean tree, `205` done, `757` eligible.

**Phase 1 has a proposal ready for approval: [TAXONOMY-PROPOSAL.md](TAXONOMY-PROPOSAL.md).** Read that first; implementation starts only after it is approved.

---

## What to do next, in order

### 1. Approve or edit the Phase 1 taxonomy proposal

Open `SEO-UNPLUG/TAXONOMY-PROPOSAL.md`. It contains the measured state, the 8-topic vocabulary, the 28-value category alias map, the tag `noindex` policy, four 301 candidates, and an approval checklist.

Nothing is applied yet. Approve it (or edit it in place), then implement:

- `_data/topics.js` becomes the single source of truth.
- Unknown category fails the build.
- Tag pages become `noindex, follow` and leave the sitemap.
- Sitemap drops from 3,514 to ≈1,266 URLs.

### 2. Continue Phase 4 in the background

The click workflow is independent of Phase 1. Keep running it whenever you have time.

```bash
# or double-click SEO-UNPLUG/click/1-draft-next-5.cmd
python scripts/transcript_context.py run --fixed --limit 5
python scripts/transcript_context.py apply .cache/context-batches/next-batch.out.json
```

### 3. Phase 5 — GSC measurement

Set up URL-group tracking in Search Console:

- `/articles/` → article indexing count
- `/tags/` → old tag noise
- `/articles/topics/` → hub indexing count

Track **article** indexed count separately. The aggregate number mixes all three and is why it looked stuck.

### 4. Phase 3 — hub copy and internal links

After the vocabulary is approved:

- Write the editorial intro/overview for each hub.
- Link every hub to its cluster articles and back.
- Do not generate hub copy automatically; it is the one part that needs a human editor.

### 5. Phase 2 — article frontmatter cleanup (last, optional)

If you want clean source files instead of a build-time alias map:

- Rewrite `category` in all 1,205 articles as one separate migration.
- Pause Phase 4 click batches while that diff is uncommitted.
- Commit it before resuming clicks, so the guard baseline is clean.

---

## Guardrails for the next session

- **Never** change transcript text, frontmatter, speaker labels, or quotations in Phase 4 articles.
- The guard is `python .agents/skills/transcript-context/scripts/guard.py <articles...>`.
- Phase 4 apply must be reviewed batch by batch. Do not run 757 articles unreviewed.
- Do not bulk-edit `category` frontmatter while Phase 4 is active.
- Do not deploy Phase 1 without reviewing the sitemap and `noindex` changes.
- Only 5 context paragraphs per batch; the default is deliberate.

---

## Key files

| File | Purpose |
|---|---|
| `SEO-UNPLUG/README.md` | Full long-term plan and rationale |
| `SEO-UNPLUG/TAXONOMY-PROPOSAL.md` | **Phase 1 vocabulary proposal — awaiting approval** |
| `SEO-UNPLUG/PHASE-4-BATCH.md` | Phase 4 command reference |
| `SEO-UNPLUG/click/README.md` | Click workflow |
| `SEO-UNPLUG/NEXT-STEPS.md` | This file |
| `scripts/transcript_context.py` | Batch queue, drafting, apply, guard |
| `.agents/skills/transcript-context/SKILL.md` | Per-article quality rules |
| `.agents/skills/transcript-context/scripts/guard.py` | Protected-content check |
| `_includes/article.liquid` | Renders `.transcript-context` |
| `.eleventy.js` | Collections, taxonomy, browse groups |
| `sitemap.liquid` | Sitemap URL selection |
| `_redirects` | 301s for old tag/article URLs |

---

## One-paragraph session opener

> Read `SEO-UNPLUG/NEXT-STEPS.md`, `SEO-UNPLUG/README.md`, and `SEO-UNPLUG/PHASE-4-BATCH.md`. Continue from the current state: 205 context paragraphs done, 757 eligible, working tree clean, Phase 1 proposal waiting in `SEO-UNPLUG/TAXONOMY-PROPOSAL.md`. If the proposal is approved, implement it; otherwise keep Phase 4 clicks running independently. Do not bulk-edit article frontmatter.

---

## Current GSC snapshot (2026-10-22)

| Bucket | Pages |
|---|---|
| Indexed | 946 |
| Excluded by `noindex` | 1,352 |
| Crawled — currently not indexed | 710 |
| Discovered — currently not indexed | 507 |
| Alternate page with proper canonical | 70 |
| 404 | 6 |
| Page with redirect | 4 |
| **Total known** | **~3,595** |

The fix is structural: cut the tag URLs back to curated hubs and concentrate crawl budget on articles. Phase 4 improves the articles themselves; Phase 1 fixes whether Google spends time on them.
