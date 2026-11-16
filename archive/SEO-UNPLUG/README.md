# SEO Unplug — Long-Term Indexing & Ranking Plan

> Site: `jaikhyapaparampara.com`
> Source: Google Search Console coverage export (2026-10-30, data through 2026-10-22)
> Purpose: permanently fix article indexing and build a taxonomy that does not collapse every few months.

**Resuming a session? Start with [NEXT-STEPS.md](NEXT-STEPS.md).**

---

## The honest framing

You're right to want the long-term version, because a threshold is **not** a strategy — it's just a guardrail. Here's the honest framing.

### First, separate two different problems

1. **Indexing** — will Google include the page at all? That's what the CSV measures. Tags are the current blocker.
2. **Ranking** — will Google show it for a query? Indexing is necessary but nowhere near sufficient. A page can be indexed and never appear.

If you fix indexing and do nothing else, you'll get more articles *in the index* and still not much traffic. The sustainable solution has to address both, and it starts with taxonomy.

---

## Why tags exploded (the real root cause)

The site uses **uncontrolled free-text taxonomy**. Both fields are free text:

- `category`: 29 distinct values, including `Prophecy`, `Prophecies`, `Prophecy & Science`, `Prophecy & Spirituality`, `'Guru Stories'` (quoted), `Guru Stories`. Those are duplicates.
- `tags`: 2,237 values, 1,609 used once. `Guru Baba Shyama Khyapa`, `Gupta Sadhak Shyamakhyapa`, `Smashana Bhairava` — variants of the same entities.

Free-text taxonomy always does this. Every new article invents 5–10 new tags, and the build faithfully turns each one into an indexable URL. A threshold only hides the symptom; the next 500 articles will recreate it.

You already have the right idea in the codebase: **8 curated browse groups** (`/articles/topics/...`) with hand-written descriptions, overviews, key ideas, and related entities. That is the seed of the sustainable model. It just isn't the thing Google is being pointed at.

---

## The sustainable model: curated topic hubs, tags are navigation only

This is the standard topic-cluster / pillar-and-cluster architecture, and it's sustainable because it grows with **editorial decisions**, not with tag count.

**The rule, permanently:**

> A page is indexable only if it is a curated topic hub with an editorial overview, or an article. Free-form tags are navigation, never SEO landing pages.

Concretely:

| Page type | Example | Indexable? | In sitemap? |
|---|---|---|---|
| Home / core pages | `/`, `/gallery/` | Yes | Yes |
| Curated topic hubs | `/articles/topics/smashana-bhairava/` | Yes | Yes |
| Articles | `/articles/...` | Yes | Yes |
| Free-form tag archives | `/tags/kabul/` | **No** (`noindex, follow`) | **No** |
| Promoted tags | `/tags/smashana-bhairava/` → hub | Redirect (301) to hub | No |

Target shape: **~15–30 hubs + ~1,200 articles ≈ 1,230 indexable URLs**, down from 3,514. Every one of those URLs is something you deliberately chose to rank, not a byproduct.

Why this is better than "index tags with ≥5 articles": the threshold still lets the tag list grow unbounded and still creates thousands of near-duplicate pages over time. The hub model caps the taxonomy at what you can actually maintain.

---

## What "no shortcuts" actually requires

### Phase 1 — Controlled vocabulary (technical foundation)

- Create one explicit source of truth: `_data/topics.js` — slug, name, description, overview, key ideas, aliases.
- Normalize the 29 messy categories into a fixed allowlist (probably 10–15 primary topics), with an alias map (`Prophecies` → `Prophecy`, `'Guru Stories'` → `Guru Stories`).
- Build-time guard: unknown category or unmapped tag = build warning/failure. This is the piece that stops the problem from coming back.
- Enforce: only hubs + articles are indexable and in the sitemap; all other tags `noindex, follow` and excluded.
- 301 the high-value existing tag URLs to their hub.

### Phase 2 — Editorial taxonomy pass (one-time, reviewable)

- Assign every article exactly one primary hub, plus optional curated subtopics. This is derived from `category`, so it's mostly automatable with a mapping table you approve.
- Merge synonym tags. Keep tag display for readers, but it no longer creates URLs.

### Phase 3 — Make hubs rank

- Each hub targets a real head term, with an editorial intro, a "start here" set, and links to every cluster article. You already have the data model for this.
- Articles link up to their hub and sideways to genuinely related articles.

### Phase 4 — Make articles rank

- Raw Bengali→English YouTube transcripts are the weakest part. Google can treat them as low-value/duplicated. The `transcript-context` skill already adds reader context — extend that: every article needs a short editorial summary that answers "what will I learn and why does it matter," plus a clear H1/title matching the query.
- Batch workflow: see [PHASE-4-BATCH.md](PHASE-4-BATCH.md). It prepares 5 articles at a time, drafts context paragraphs, validates them, inserts them without touching frontmatter or transcript text, and runs the guard.
- Entity / E-E-A-T signals: author page, lineage, sources, dates, disclaimers. Some already exist.

### Phase 5 — Measurement

- In GSC, create URL-prefix filters or compare `/articles/` vs `/tags/` vs `/articles/topics/`. The aggregate number you've been watching mixes all three, which is why it looks stuck. Track **article** indexed count separately; that's the only number that matters for your goal.

---

## What to do next

Don't start by flipping the tag threshold. Start with Phase 1's vocabulary, because everything else depends on it.

Do this in a reviewable way:

1. Extract every category and tag.
2. Produce a proposed controlled topic list (starting from the existing 8 hubs + the real categories) and an alias map for the duplicates.
3. **You approve / edit it.**
4. Then enforce it in the build, make tags non-indexable, update the sitemap, and add the guard that prevents new uncontrolled topics.

That gives a permanent rule instead of another number that future content will break.

---

## Can the agent do all of this, or is it manual?

Most of it can be done in this repo. The split is deliberate: code and mechanical data work are automated; editorial judgment stays with you.

| Step | Who | Notes |
|---|---|---|
| Extract all categories and tags | Agent | Read-only script over `articles/*.md` |
| Propose topic list + alias map | Agent, you approve | First real decision point |
| Normalize category frontmatter | Agent | Scripted, reviewable diff |
| Create `_data/topics.js` | Agent | Based on approved list |
| Build-time guard for unknown taxonomy | Agent | Prevents regression |
| Make free-form tags `noindex` | Agent | Template + build change |
| Exclude non-hub tags from sitemap | Agent | `sitemap.liquid` change |
| 301 high-value tag URLs to hubs | Agent + you | You decide which tags are worth promoting |
| Assign articles to hubs | Agent, you spot-check | Derived from category + alias map |
| Write hub editorial copy (intro, overview, key ideas) | **You / editor** | Cannot be generated responsibly |
| Improve article titles / summaries for search intent | **You / editor** | Content judgment |
| Author / lineage / E-E-A-T pages | **You**, agent scaffolds | Facts must come from you |
| Deploy and submit sitemap | **You** | Agent prepares, you push |
| GSC monitoring by URL group | **You**, agent documents setup | Access is yours |

### Bottom line

The agent can implement the entire technical foundation end to end: extraction, vocabulary scaffolding, normalization, build guards, noindex rules, sitemap logic, and 301s. You only need to:

1. Approve/edit the topic list and alias map.
2. Write the hub copy.
3. Decide which existing tags deserve promotion.
4. Deploy.

Nothing about Phases 1, 2, 3, or 5 requires manual coding from you. Phase 4 is the one place where human editorial work is irreplaceable.

---

## Appendix — Current GSC snapshot (2026-10-22)

| Bucket | Pages |
|---|---|
| Indexed | **946** |
| Excluded by `noindex` | **1,352** |
| Crawled – currently not indexed | **710** |
| Discovered – currently not indexed | **507** |
| Alternate page w/ proper canonical | 70 |
| 404 | 6 |
| Page with redirect | 4 |
| **Total known** | **~3,595** |

Current published sitemap: **3,514 URLs**
- 1,264 article URLs
- **2,248 tag URLs (64% of the sitemap)**
- ~2 index pages

Article corpus: **1,205 articles**, median body **~2,464 words**.
Tag corpus: **2,237 unique tags**; **1,609 tags used exactly once**; only **184 tags have ≥5 articles**, **80 have ≥8**.

The Sept 27, 2026 commit `d16fc3d` removed the old "index only tags with ≥8 articles" rule. This is why the `noindex` count is still high (old state) while "crawled/discovered – not indexed" is rising (new thin tag URLs). The fix is structural, not a new number.
