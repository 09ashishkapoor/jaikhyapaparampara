# Taxonomy Proposal — Phase 1 controlled vocabulary

> **Status: approved, implemented, and deployed 2026-11-01.**
> Prepared 2026-11-01 from a clean local build (`npm run build:test`) over 1,205 articles.
> Extraction was read-only; no article file, frontmatter, or transcript was modified.
> See **Implementation record** below for what shipped and the three small deviations.

---

## TL;DR

| Change | Before | After |
|---|---|---|
| Indexable topic pages | 8 curated hubs + 2,225 tag pages + 23 tag-directory pages | **8 curated hubs** |
| Tag pages | `index, follow`, in sitemap | `noindex, follow`, **out of sitemap** |
| Category values | 28 free-text values | 28 legacy values → **8 canonical topics** (build-time alias map, frontmatter untouched) |
| Unknown category | silently accepted | **build fails** |
| Sitemap URLs | 3,514 | **≈ 1,266** (−64%) |

This is the README's target shape: ~1,200 articles + 8 hubs, every indexable URL deliberately chosen.
It does **not** touch article frontmatter, so the Phase 4 context workflow and its guard are unaffected.

---

## Implementation record (2026-11-01)

Approved by the site owner, shipped in commit `d04baac`, and deployed 2026-11-01. Verified locally against a clean build and then on the live site:

| Check | Result |
|---|---|
| Build | passes; `_data/topics.js` is the single source of truth |
| Sitemap | 3,514 → **1,266** URLs; **0** `/tags/` URLs |
| Tag pages | 2,225 still generated for navigation, all `noindex, follow` |
| Tag directory | `/tags/` + 22 pages, `noindex, follow`, out of sitemap |
| Hubs | 8, `index, follow`, counts unchanged (106 / 35 / 125 / 10 / 3 / 359 / 43 / 524) |
| Articles | 1,205 untouched (`git diff -- "articles/*.md"` empty) |
| Category guard | unknown category fails the build, naming the file (verified with a throwaway article) |
| Phase 4 | context status unchanged: 205 done, 757 eligible |
| Live deploy | verified: sitemap 1,266 / 0 tags, tag pages `noindex`, hub `index`, 4 promoted tag URLs return **301** to their hubs |

Deviations from the plan, all smaller than the alternative:

1. **Duplicate alias-key check dropped.** JS object literals cannot contain duplicate keys, so the check cannot fail; the guard instead validates that every alias points at a real topic slug, and that topic slugs are unique.
2. **Canonical names get the placement bonus.** `scoreGroup` now awards the +4 category bonus when `category` equals the hub's canonical name as well as for legacy values. No legacy value's behaviour changed, so no article moved.
3. **Search index gained `categoryLabel`.** The raw `category` stays in the index for matching; display uses the label. Homepage cards, search results, article chips, and both archives now show the 8 labels.
4. **Two smoke tests encoded the old policy** (tags indexable and in the sitemap). Rewritten to the approved contract; the article-archive half still asserts `index, follow`.

---

## 1. What was measured (facts, 2026-11-01)

| Metric | Value |
|---|---|
| Articles | 1,205 |
| Distinct `category` values | 28 (all 1,205 articles have one) |
| Distinct tag values | 2,340 |
| Distinct tag URLs after `slugify` | **2,225** |
| Tags used exactly once | 1,674 |
| Tags on ≥5 articles | 203 |
| Tags on ≥8 articles | 106 |
| Tag URL families that differ only by case/punctuation | 112 |

Sitemap composition today (3,514 URLs):

| Bucket | URLs |
|---|---|
| Core pages (`/`, `/gallery/`, `/glossary/`) | 3 |
| Topic hubs | 8 |
| Articles | 1,205 |
| Article index/pagination (`/articles/`, `/articles/a-z/…`) | 50 |
| Tag pages | **2,225** |
| Tag directory pages (`/tags/`, `/tags/page/2/…`) | 23 |

Two facts that shape the proposal:

1. **Three tags are site identity, not topics.** `Guru Baba Shyama Khyapa` (929 articles), `Smashana Bhairava` (915), `Gupta Sadhak Shyamakhyapa` (899) appear on ~75% of the corpus. They cannot meaningfully be topic pages.
2. **The 8 hubs already cover all 1,205 articles.** The existing keyword scorer assigns each article to exactly one hub (counts below). No article is unassigned, so Phase 1 does not need to re-file anything.

---

## 2. Proposed topic vocabulary (the whole allowlist)

Eight topics, exactly the existing curated hubs. Slugs and hub copy do not change; `label` is the short form for article chips and cards (currently the raw 28-value category is shown).

| # | Topic slug | Hub name (unchanged) | Proposed label | Articles on hub today |
|---|---|---|---|---|
| 1 | `prophecy-world-events` | Prophecy and World Events | Prophecy | 106 |
| 2 | `rituals-worship-festivals` | Rituals, Worship and Festivals | Rituals & Worship | 35 |
| 3 | `sacred-texts-scriptures` | Sacred Texts and Scriptures | Sacred Texts | 125 |
| 4 | `sadhana-tantra-mantra` | Sadhana, Tantra and Mantra | Sadhana & Tantra | 10 |
| 5 | `sacred-places-pilgrimage` | Sacred Places and Pilgrimage | Sacred Places | 3 |
| 6 | `guru-stories-devotee-lives` | Guru Stories and Devotee Lives | Guru Stories | 359 |
| 7 | `discourses-practical-life` | Discourses, Questions & Practical Life | Discourses & Life | 43 |
| 8 | `spiritual-teachings-philosophy` | Spiritual Teachings and Philosophy | Spiritual Teachings | 524 |

Notes for approval:

- **No new hubs.** The README guessed 10–15; 8 is enough because the corpus is concentrated (topics 1, 6, 8 hold 989 articles) and every extra hub needs editorial copy you have to write. More hubs can be added later by editing one file.
- **Two hubs are thin** — Sacred Places (3 articles) and Sadhana & Tantra (10). They have full editorial copy already, so they stay; whether to grow or fold them is a Phase 3 editorial call, not a taxonomy call. Flagging now so the thinness is not a surprise.
- **Hub membership stays as it is.** The scorer uses category + tags; in 47 cases it files an article into a *more specific* hub than its declared category (e.g. a `Spiritual Teachings` article about Durga Puja lands in Rituals). Spot checks show those moves are right, so Phase 1 deliberately does not change membership. Phase 2 can add explicit per-article overrides for the few disagreements.

---

## 3. Category alias map (28 legacy values → 8 topics)

Every current value is mapped. Declared-topic totals below differ from the hub totals above because display label and hub cluster are computed differently (see §2 note).

| Legacy `category` | Articles | → Topic | Label shown |
|---|---:|---|---|
| Spiritual Teachings | 561 | `spiritual-teachings-philosophy` | Spiritual Teachings |
| Philosophy | 1 | `spiritual-teachings-philosophy` | Spiritual Teachings |
| Dasa Mahavidyas | 1 | `spiritual-teachings-philosophy` | Spiritual Teachings |
| Guru Stories | 356 | `guru-stories-devotee-lives` | Guru Stories |
| Our Roots | 2 | `guru-stories-devotee-lives` | Guru Stories |
| Miracle Stories | 1 | `guru-stories-devotee-lives` | Guru Stories |
| Healing Testimonies | 1 | `guru-stories-devotee-lives` | Guru Stories |
| Miracles & Healing | 1 | `guru-stories-devotee-lives` | Guru Stories |
| Divine Stories | 1 | `guru-stories-devotee-lives` | Guru Stories |
| Temple of Knowledge | 125 | `sacred-texts-scriptures` | Sacred Texts |
| Prophecy | 91 | `prophecy-world-events` | Prophecy |
| Prophecy & Science | 4 | `prophecy-world-events` | Prophecy |
| Prophecies | 2 | `prophecy-world-events` | Prophecy |
| Prophecy & Spirituality | 1 | `prophecy-world-events` | Prophecy |
| Spiritual Warnings | 1 | `prophecy-world-events` | Prophecy |
| Discourse | 28 | `discourses-practical-life` | Discourses & Life |
| Guru Messages | 6 | `discourses-practical-life` | Discourses & Life |
| Health & Wellness | 2 | `discourses-practical-life` | Discourses & Life |
| Social Commentary | 2 | `discourses-practical-life` | Discourses & Life |
| History & Spirituality | 1 | `discourses-practical-life` | Discourses & Life |
| Patriotism & History | 1 | `discourses-practical-life` | Discourses & Life |
| Science and Spirituality | 1 | `discourses-practical-life` | Discourses & Life |
| Rituals & Yagyas | 9 | `rituals-worship-festivals` | Rituals & Worship |
| Prayers and Chants | 2 | `rituals-worship-festivals` | Rituals & Worship |
| Sadhana | 1 | `sadhana-tantra-mantra` | Sadhana & Tantra |
| Spiritual Remedies | 1 | `sadhana-tantra-mantra` | Sadhana & Tantra |
| Spiritual Tools | 1 | `sadhana-tantra-mantra` | Sadhana & Tantra |
| Sacred Places | 1 | `sacred-places-pilgrimage` | Sacred Places |

Declared-topic totals: Spiritual Teachings 563 · Guru Stories 362 · Sacred Texts 125 · Prophecy 99 · Discourses 41 · Rituals 11 · Sadhana 3 · Sacred Places 1.

**Judgment calls — please confirm or change:**
- `Our Roots` → Guru Stories (lineage/parampara articles; currently filed under Discourses)
- `Dasa Mahavidyas` → Spiritual Teachings (expository series on the Mahavidyas)
- `Spiritual Remedies` and `Spiritual Tools` → Sadhana & Tantra
- `History & Spirituality` → Discourses & Life

**Implementation shape (object keys; `_data/topics.js` wraps them in `module.exports = { … }`):**

```js
// slug, name, label, plus the existing description/overview/keyIdeas/
// relatedEntitySlugs moved here from .eleventy.js unchanged.
topics: [ /* 8 entries as in §2 */ ],

// Lower-cased category value -> topic slug. Anything not in this map fails the build.
categoryAliases: {
  "spiritual teachings": "spiritual-teachings-philosophy",
  "philosophy": "spiritual-teachings-philosophy",
  "dasa mahavidyas": "spiritual-teachings-philosophy",
  "guru stories": "guru-stories-devotee-lives",
  "our roots": "guru-stories-devotee-lives",
  "miracle stories": "guru-stories-devotee-lives",
  "healing testimonies": "guru-stories-devotee-lives",
  "miracles & healing": "guru-stories-devotee-lives",
  "divine stories": "guru-stories-devotee-lives",
  "temple of knowledge": "sacred-texts-scriptures",
  "prophecy": "prophecy-world-events",
  "prophecy & science": "prophecy-world-events",
  "prophecies": "prophecy-world-events",
  "prophecy & spirituality": "prophecy-world-events",
  "spiritual warnings": "prophecy-world-events",
  "discourse": "discourses-practical-life",
  "guru messages": "discourses-practical-life",
  "health & wellness": "discourses-practical-life",
  "social commentary": "discourses-practical-life",
  "history & spirituality": "discourses-practical-life",
  "patriotism & history": "discourses-practical-life",
  "science and spirituality": "discourses-practical-life",
  "rituals & yagyas": "rituals-worship-festivals",
  "prayers and chants": "rituals-worship-festivals",
  "sadhana": "sadhana-tantra-mantra",
  "spiritual remedies": "sadhana-tantra-mantra",
  "spiritual tools": "sadhana-tantra-mantra",
  "sacred places": "sacred-places-pilgrimage",

  // Canonical names are also accepted, so new articles use the vocabulary,
  // not the legacy values (all lower-cased keys):
  "prophecy and world events": "prophecy-world-events",
  "rituals, worship and festivals": "rituals-worship-festivals",
  "sacred texts and scriptures": "sacred-texts-scriptures",
  "sadhana, tantra and mantra": "sadhana-tantra-mantra",
  "sacred places and pilgrimage": "sacred-places-pilgrimage",
  "guru stories and devotee lives": "guru-stories-devotee-lives",
  "discourses, questions & practical life": "discourses-practical-life",
  "spiritual teachings and philosophy": "spiritual-teachings-philosophy"
}
```

Lookup is case-insensitive and trims surrounding whitespace; an unknown value fails the build. The canonical keys deliberately do not collide with the legacy keys (`prophecy` vs `prophecy and world events`, and so on).

---

## 4. Tag policy

**Rule: tags are navigation, never indexable pages.**

- Every `/tags/*` page becomes `noindex, follow`, stays crawlable, leaves the sitemap.
- The 23 `/tags/` directory pages become `noindex, follow` and leave the sitemap.
- Tag links keep working for readers (article chips, "Explore Topics", the tag directory).
- `/tags/` remains the reader-facing tag directory; it is no longer a search landing page.

**No tag allowlist and no mass synonym merges in Phase 1.** Once tags cannot create indexable URLs, the anti-regression goal is already met; a 2,340-row allowlist would be permanent maintenance with no SEO payoff. What we do instead, at build time, is formatting normalization only:

- trim values, collapse duplicates case-insensitively (the 112 formatting families → one display form each, chosen by highest usage: `Prophecy`, `Karma`, `Bama Khepa`, …);
- coerce numeric tags to strings (13 articles carry unquoted `1429`, `2021`–`2026`; the build currently still emits tag pages for them, and the normalizer makes the coercion explicit);
- tag slugs/URLs do not change, so no redirects are needed for normalization.

Tag merges are available later as an editorial Phase 2 step, informed by GSC query data.

### The one exception: 4 promoted tag URLs → their hub (301)

Only tags whose article set is ≥75% contained in one hub **and** whose name is a synonym of that hub. Everything else stays `noindex, follow`.

| Tag URL | Articles | Overlap with hub | 301 target |
|---|---:|---:|---|
| `/tags/prophecy/` | 122 | 75% in Prophecy | `/articles/topics/prophecy-world-events/` |
| `/tags/guru-stories/` | 36 | 94% in Guru Stories | `/articles/topics/guru-stories-devotee-lives/` |
| `/tags/spiritual-teachings/` | 90 | 84% in Spiritual Teachings | `/articles/topics/spiritual-teachings-philosophy/` |
| `/tags/sacred-texts/` | 17 | 100% in Sacred Texts | `/articles/topics/sacred-texts-scriptures/` |

Four rules in `_redirects`. No other tag redirects: a 301 is destructive, `noindex` is reversible, and there is no GSC query evidence yet for the 2,221 others. If GSC later shows a tag URL with impressions, add one line.

---

## 5. Build and template changes (what gets edited)

| File | Change |
|---|---|
| `_data/topics.js` | **new** — topics + `categoryAliases` (single source of truth) |
| `.eleventy.js` | read hub definitions from `_data/topics.js`; normalize category via alias map; **fail build** on unknown category; expose label filter |
| `_includes/base.liquid` | remove the block that forces `index, follow` on tag pages, so frontmatter `robotsMeta` works |
| `articles/tags.liquid` | `robotsMeta: "noindex, follow"` |
| `tags-index.liquid` | `robotsMeta: "noindex, follow"` |
| `sitemap.liquid` | remove the tag-page loop and tag-directory loop |
| `_redirects` | add the 4 promotions above |
| `_includes/article.liquid`, `articles/index.liquid`, `articles/a-z.liquid`, `articles/tags.liquid`, `articles/topics.liquid`, `index.html` | show the normalized label instead of the raw category string (raw stays where it is behaviour, e.g. the byline rule) |
| `search-index.11ty.js`, `search.liquid` | add and display `categoryLabel`; keep raw `category` for matching |
| `tests/smoke/indexing.spec.js` | rewrite the two tests that asserted tag pages were indexable |

No new dependencies. No article file is opened for writing. Phase 4 keeps running on its own schedule.

### Build guard

The taxonomy guard runs inside the build, so it cannot be forgotten:

1. Unknown or unmapped `category` → **build error** naming the article file. This is the piece that stops the 28 values from becoming 40.
2. Alias map sanity: every alias points at a real topic, and topic slugs are unique. (Duplicate alias keys cannot exist in a JS object literal, so that check was dropped at implementation.)
3. Missing category → build error (currently 0).

A build is therefore also the test: `npm run build:test` must pass, and `_site/sitemap.xml` must contain no `/tags/` URL.

---

## 6. Verification (ran after implementation, 2026-11-01)

```bash
npm run build:test
python scripts/transcript_context.py status        # still says 205 done / 757 eligible
```

- [x] `_site/sitemap.xml` has **1,266** URLs: 1,205 articles, 50 article index/pagination, 8 hubs, 3 core — **zero** `/tags/`.
- [x] `/tags/kali/` HTML contains `<meta name="robots" content="noindex, follow">`.
- [x] `/articles/topics/prophecy-world-events/` contains `<meta name="robots" content="index, follow">`.
- [x] Every hub page still renders its article list (8 pages, 1,205 articles total).
- [x] Category chips show a label, not `Prophecies` / `Temple of Knowledge`.
- [x] A test build with a deliberately unknown category fails with a clear error.
- [x] `git diff --name-only -- "articles/*.md"` is empty (frontmatter and transcripts untouched).

---

## 7. Explicitly out of scope

- Article frontmatter: untouched. (Phase 2, only if you want clean source files later.)
- Transcript text, context paragraphs, speaker labels: untouched. Phase 4 independent.
- Hub editorial copy, internal linking, "start here" order: Phase 3, editor-owned.
- Removing or merging tags: deferred until GSC shows which tags matter.
- New hubs, sitemap priorities, article pagination pages: unchanged.
- GSC URL-group setup: Phase 5, your account.

---

## 8. Approval record

Approved by the site owner on 2026-11-01, all six decisions as proposed, and implemented the same day. The checklist is kept here for the decision history:

1. **8 topics + labels** — approved as in §2.
2. **Category alias map** — approved, including the four judgment-call bullets covering five categories.
3. **Tag policy** — approved: `noindex, follow`, out of the sitemap, no tag allowlist.
4. **Four 301s** — approved as listed in §4.
5. **Build fails on unknown category** — approved.
6. **Sitemap removal** of the 2,248 tag URLs — approved.

Rollback is a single revert: no URLs are deleted, no content is edited, and the old tag pages remain in the build output.

---

## Appendix A — top 20 tags (for the promotion discussion)

| Articles | Tag | Disposition |
|---:|---|---|
| 929 | Guru Baba Shyama Khyapa | identity tag, navigation only |
| 915 | Smashana Bhairava | identity tag, navigation only |
| 899 | Gupta Sadhak Shyamakhyapa | identity tag, navigation only |
| 132 | Khyapa Parampara | entity tag, navigation only |
| 120 | Namavali | sacred-text class, navigation only |
| 112 | Bhairava | entity, navigation only |
| 112 | Kalabhairava | entity, navigation only |
| 111 | Prophecy | **301 → Prophecy hub** |
| 105 | Shri Praveen Radhakrishna | entity, navigation only |
| 91 | Tantra | subtopic of Sadhana hub, navigation only |
| 90 | Spiritual Teachings | **301 → Spiritual Teachings hub** |
| 55 | Kali Yuga | subtopic of Prophecy, navigation only |
| 51 | Tarapith | place/entity, navigation only |
| 41 | COVID-19 | subtopic, navigation only |
| 40 | Shantikunj | place/entity, navigation only |
| 37 | Kali | entity, navigation only |
| 36 | Guru Stories | **301 → Guru Stories hub** |
| 34 | Gupta Sadhak | entity, navigation only |
| 33 | Sadhana | subtopic of Sadhana hub (hub too thin to absorb 33), navigation only |
| 30 | Guru Deva Shyama Khyapa | entity tag, navigation only |

## Appendix B — adjacent findings (not part of this proposal)

1. **"Related articles" is effectively "latest six sitewide."** `relatedArticles` matches any shared tag; because the three identity tags sit on ~75% of articles, almost every pair matches. Fix is one line (exclude the identity tags from matching) but it changes every article page, so it is not bundled here.
2. **47 articles are tag-scored into a more specific hub than their declared category.** Harmless for Phase 1; Phase 2 can add explicit overrides if you want chip and cluster to agree everywhere.
3. **13 articles have unquoted numeric year tags.** The normalizer will coerce them; optionally quote them during a later cleanup.
4. The `keywords:` frontmatter is separate from `tags:` and is not used by the taxonomy (Google ignores `meta keywords`). No action.

---

*Data extracted with read-only scripts in `.cache/` (gitignored): `extract_taxonomy.js`, `tag_families.js`, `hub_compare.js`, `category_hub_crosstab.js`, `tag_hub_overlap.js`, `final_stats.js`. Re-runnable against any future corpus state.*
