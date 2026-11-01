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
| Phase 1 taxonomy | **Implemented 2026-11-01 — awaiting deploy** |

The Phase 4 click workflow is working. It drafts 5 articles at a time, opens a review file, applies the reviewed batch, runs the guard, and archives the batch.

**Phase 1 is implemented and committed.** Sitemap is down to 1,266 URLs, tag pages are `noindex, follow`, and `_data/topics.js` is the single source of truth. Confirm with:

```bash
git log --oneline -3
npm run build:test
python scripts/transcript_context.py status
```

Expected: build passes, `205` done, `757` eligible.

---

## What to do next, in order

### 1. Deploy Phase 1 and verify in the wild

Deploy, then check on the live site:

- `https://jaikhyapaparampara.com/sitemap.xml` → 1,266 URLs, zero `/tags/` URLs.
- Any `/tags/...` page → `<meta name="robots" content="noindex, follow">`.
- A hub, e.g. `/articles/topics/prophecy-world-events/` → `index, follow`.
- Resubmit the sitemap in GSC; use URL Inspection on one tag page and one hub.

The redirects (`/tags/prophecy/`, `/tags/guru-stories/`, `/tags/spiritual-teachings/`, `/tags/sacred-texts/`) depend on Cloudflare Pages applying `_redirects`; verify one of them after deploy.

Before deploying, run `npm run build:test` and eyeball `_site/sitemap.xml`.

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

After Phase 1 is live:

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
- Keep tag pages `noindex, follow` and out of `sitemap.liquid`; that is the Phase 1 policy, not a temporary experiment.
- New articles can only use a category from `_data/topics.js`; the build fails otherwise.
- Only 5 context paragraphs per batch; the default is deliberate.

---

## Key files

| File | Purpose |
|---|---|
| `SEO-UNPLUG/README.md` | Full long-term plan and rationale |
| `SEO-UNPLUG/TAXONOMY-PROPOSAL.md` | Phase 1 vocabulary — implemented 2026-11-01 |
| `_data/topics.js` | **Single source of truth** for topics + category aliases |
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

> Read `SEO-UNPLUG/NEXT-STEPS.md`, `SEO-UNPLUG/README.md`, and `SEO-UNPLUG/PHASE-4-BATCH.md`. Continue from the current state: Phase 1 taxonomy is implemented (sitemap 1,266 URLs, tag pages noindex), 205 context paragraphs done, 757 eligible, working tree clean. Next: deploy and verify Phase 1 in GSC, then keep Phase 4 clicks running independently, then Phase 3 hub copy. Do not bulk-edit article frontmatter.

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
