# Next steps — start here

Paste this file into a new session, or tell the agent: **"Read `SEO-UNPLUG/NEXT-STEPS.md`, `SEO-UNPLUG/README.md`, and `SEO-UNPLUG/PHASE-4-BATCH.md`. Continue from here."**

Last updated: 2026-11-01

---

## Where we are

| Item | State |
|---|---|
| Articles | 1,205 |
| Transcript articles | 962 |
| Context paragraphs done | **962** (947 generated + 15 pre-existing intros) |
| Eligible remaining | **0** |
| Phase 1 taxonomy | **Deployed and verified live 2026-11-01** |
| Phase 2 frontmatter | **Done — all 1,205 categories canonical** |
| Phase 4 batch queue | **Complete, pushed, verified live** |

The Phase 4 queue is finished. Every transcript article now carries reader context or already had its own intro. The runner still works for new transcript articles:

```bash
python scripts/transcript_context.py auto          # queue runs until nothing is left
python scripts/transcript_context.py auto --max-batches 20
```

**Phase 1 and Phase 4 verified live on 2026-11-01:**

- `sitemap.xml` → 1,266 URLs, zero `/tags/`, 8 hub URLs.
- `/tags/kali/` → `noindex, follow`.
- `/articles/topics/prophecy-world-events/` → `index, follow`, with its cluster linked.
- The four promoted tag URLs 301 to their hubs.
- Articles link up to their hub; related-article links exist.
- 947/947 generated context paragraphs render on production URLs.

Confirm locally with:

```bash
npm run build:test
python scripts/transcript_context.py status
git status --short
```

Expected: build passes, `962` done, `0` eligible, tree clean.

---

## What to do next, in order

### 1. Phase 5 — GSC measurement (external, needs your access)

- Resubmit `https://jaikhyapaparampara.com/sitemap.xml`.
- URL Inspection: one tag page (expect noindex), one hub (expect indexable).
- Create URL-prefix groups for `/articles/`, `/tags/`, and `/articles/topics/`.
- Watch **article** indexed count, not the aggregate. "Excluded by noindex" will jump and total indexed will fall — that is the cleanup, not a regression.
- Recheck in 2–4 weeks; tag URLs take time to leave the index.

### 2. Phase 3 — hub copy review

The eight hubs already have a description, a two-paragraph overview, key ideas, and linked clusters (inherited from the old `.eleventy.js` and now owned by `_data/topics.js`). Nothing is missing; the remaining work is editorial polish if you want it:

- Refresh each hub's intro/overview for search intent.
- Check the start-here set on each hub still lists the best five articles.

Do not generate hub copy automatically; it is the part that needs an editor.

### 3. Phase 2 — done

All 1,205 articles now use a canonical hub name in `category:` (commit "Normalize article categories to the controlled vocabulary"). `categoryAliases` stays in place for any legacy value that reappears; the taxonomy guard still fails the build on anything unmapped.

Side effect to know about: six articles moved hubs because hub membership is a score, not a strict assignment. "Our Roots" articles moved to Guru Stories, "Dasa Mahavidyas" to Spiritual Teachings, "Spiritual Remedies"/"Spiritual Tools" to Sadhana, and one Guru Stories article that had been scoring into Prophecy moved back to Guru Stories. All match the alias map.

### 4. New content — keep the queue empty

- New transcript articles: add them, then run `auto`.
- Any new category must resolve in `_data/topics.js` or the build fails.

---

## Guardrails for the next session

- **Never** change transcript text, frontmatter, speaker labels, or quotations in Phase 4 articles.
- The guard is `python .agents/skills/transcript-context/scripts/guard.py <articles...>`.
- `auto` applies without human review. Its safety net is the applier's validation (length, sentences, description similarity, path existence) plus the guard. Nothing checks theological or historical accuracy — spot-check committed diffs.
- Keep tag pages `noindex, follow` and out of `sitemap.liquid`; that is the Phase 1 policy, not a temporary experiment.
- New articles can only use a category from `_data/topics.js`; the build fails otherwise.
- Do not bulk-edit `category` frontmatter while a batch run is in progress.

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
| `scripts/transcript_context.py` | Batch queue, drafting, apply, guard, unattended loop |
| `.agents/skills/transcript-context/SKILL.md` | Per-article quality rules |
| `.agents/skills/transcript-context/scripts/guard.py` | Protected-content check |
| `_includes/article.liquid` | Renders `.transcript-context` |
| `.eleventy.js` | Collections, taxonomy, browse groups |
| `sitemap.liquid` | Sitemap URL selection |
| `_redirects` | 301s for old tag/article URLs |

---

## One-paragraph session opener

> Read `SEO-UNPLUG/NEXT-STEPS.md`, `SEO-UNPLUG/README.md`, and `SEO-UNPLUG/PHASE-4-BATCH.md`. Continue from the current state: Phase 1 taxonomy is deployed and verified live (sitemap 1,266 URLs, tag pages noindex, 4 promoted tag 301s working), Phase 2 is done (all 1,205 categories canonical), Phase 4 is complete (962/962 transcript articles, 947 generated paragraphs, all verified live and pushed), working tree clean. Next: Phase 5 GSC URL-group measurement, then optional Phase 3 hub copy polish.

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

The fix is structural: cut the tag URLs back to curated hubs and concentrate crawl budget on articles. Phase 4 improved the articles themselves; Phase 1 fixed whether Google spends time on them.
