# Next steps — start here

Paste this file into a new session, or tell the agent: **"Read `SEO-UNPLUG/NEXT-STEPS.md`, `SEO-UNPLUG/README.md`, and `SEO-UNPLUG/PHASE-4-BATCH.md`. Continue from here."**

Last updated: 2026-10-30

---

## Where we are

| Item | State |
|---|---|
| Articles | 1,205 |
| Transcript articles | 962 |
| Context paragraphs done | **44** |
| Eligible remaining | **918** |
| Batches of 5 remaining | **184** |
| Last commit | `137c36e Add transcript context to first nine articles` |

The Phase 4 click workflow is working. It drafts 5 articles at a time, opens a review file, applies the reviewed batch, runs the guard, and archives the batch.

**Important:** the working tree currently has **20 applied but uncommitted** context paragraphs from the last four click batches. Review and commit them before starting Phase 1:

```bash
git status --short
git diff --stat
git diff -- articles
git add articles
git commit -m "Add more transcript context paragraphs"
```

---

## What to do next, in order

### 1. Finish the uncommitted Phase 4 batch

Review the 20 article diffs, commit them, then run:

```bash
python scripts/transcript_context.py status
```

Expected: 44 done, 918 eligible.

### 2. Start Phase 1 — controlled vocabulary (the actual indexation fix)

This is the highest-value remaining work. Do **not** wait for Phase 4 to finish.

The safe first step is read-only:

1. Extract every `category` and tag from `articles/*.md`.
2. Propose a controlled topic list and an alias map:
   - `Prophecies` → `Prophecy`
   - `'Guru Stories'` → `Guru Stories`
   - `Prophecy & Science` / `Prophecy & Spirituality` → `Prophecy`
   - etc.
3. Write the proposal to `SEO-UNPLUG/TAXONOMY-PROPOSAL.md`.
4. Human approves/edits it.
5. Only then implement.

Known facts to reuse:

- 29 messy category values, including duplicates and quoted variants.
- 2,237 unique tags; 1,609 used exactly once; only 184 tags have ≥5 articles.
- Sitemap currently has 3,514 URLs: 1,264 articles + 2,248 tags.
- 8 curated browse groups already exist in `.eleventy.js` (`browseGroupDefinitions`).

Implementation rules for Phase 1:

- Normalize categories with an **alias map in `_data/topics.js` at build time**.
- **Do not bulk-rewrite article frontmatter now.** That would collide with the Phase 4 guard.
- Only curated hubs + articles are indexable and in the sitemap.
- Free-form tags become `noindex, follow` and leave the sitemap.
- 301 high-value existing tag URLs to their hub.
- Add a build-time guard so unknown categories cannot silently reappear.

### 3. Start Phase 5 — GSC measurement

Set up URL-group tracking in Search Console:

- `/articles/` → article indexing count
- `/tags/` → old tag noise
- `/articles/topics/` → hub indexing count

Track **article** indexed count separately. The aggregate number mixes all three and is why it looked stuck.

### 4. Continue Phase 4 in the background

The click workflow is independent of Phase 1. Keep running it whenever you have time.

```bash
# or double-click SEO-UNPLUG/click/1-draft-next-5.cmd
python scripts/transcript_context.py run --fixed --limit 5
python scripts/transcript_context.py apply .cache/context-batches/next-batch.out.json
```

### 5. Phase 3 — hub copy and internal links

After the vocabulary is approved:

- Write the editorial intro/overview for each hub.
- Link every hub to its cluster articles and back.
- Do not generate hub copy automatically; it is the one part that needs a human editor.

### 6. Phase 2 — article frontmatter cleanup (last, optional)

If you want clean source files instead of a build-time alias map:

- Rewrite `category` in all 1,205 articles as one separate migration.
- Pause Phase 4 click batches while that diff is uncommitted.
- Commit it before resuming clicks, so the guard baseline is clean.

---

## Guardrails for the next session

- **Never** change transcript text, frontmatter, speaker labels, or quotations in Phase 4 articles.
- The guard is `python .agents/skills/transcript-context/scripts/guard.py <articles...>`.
- Phase 4 apply must be reviewed batch by batch. Do not run 918 articles unreviewed.
- Do not bulk-edit `category` frontmatter while Phase 4 is active.
- Do not deploy Phase 1 without reviewing the sitemap and `noindex` changes.
- Only 5 context paragraphs per batch; the default is deliberate.

---

## Key files

| File | Purpose |
|---|---|
| `SEO-UNPLUG/README.md` | Full long-term plan and rationale |
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

> Read `SEO-UNPLUG/NEXT-STEPS.md`, `SEO-UNPLUG/README.md`, and `SEO-UNPLUG/PHASE-4-BATCH.md`. Continue from the current state: 44 context paragraphs done, 20 uncommitted article changes to review, Phase 1 not started. Do not bulk-edit article frontmatter. Start by extracting all categories and tags and producing a proposed controlled vocabulary and alias map in `SEO-UNPLUG/TAXONOMY-PROPOSAL.md` for approval. Keep Phase 4 clicks independent.

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
