# Phase 4 — Batch transcript context workflow

This is the repeatable version of the `transcript-context` skill.

## Click workflow (no CLI)

Open `click/` and double-click:

1. `1-draft-next-5.cmd` — drafts the next 5, opens the review file in Notepad.
2. `2-apply-reviewed.cmd` — applies the reviewed batch, archives it, shows progress.
3. `3-check-build.cmd` — runs the test build.

See `click/README.md` for the loop. The queue always skips articles that already have context, so the next click is always the next 5. No tracking files, no offsets.

It does **not** replace the skill's rules. It only automates the repetitive parts:

- finding transcript articles that still need a context paragraph
- preparing a batch of articles for one model call
- validating and inserting reviewed paragraphs
- running the skill's guard after every edit

The transcript, frontmatter, quotations, speaker labels, and sacred-text articles remain untouched.

## Current status

```bash
npm run context:status
```

Expected now:

```
Articles with a transcript: 962
Already have context:       ~19
Eligible:                   ~943
Batches of 5:               ~189
```

## The loop

### 1. Prepare a batch

```bash
npm run context:prepare
```

Writes a file like:

```
.cache/context-batches/batch-0001-0005.in.json
```

The file contains title, description, category, author, date, and the full transcript body for each article. `.cache/` is already gitignored.

### 2. Draft the summaries

```bash
npm run context:run
```

This calls `pi` headlessly with the batch file and writes:

```
.cache/context-batches/batch-0001-0005.out.json
```

It does **not** edit articles. Review the summaries first.

To draft and apply in one step:

```bash
npm run context:run -- --apply
```

Use `--apply` only after you trust the batch quality.

### 3. Review

Open the `.out.json` file. Each entry should be:

- 2–3 sentences, 45–90 words
- specific to that conversation
- attributed to the speaker where needed
- free of links, headings, and generic filler
- not a copy of the description

The applier rejects summaries that are too short, too long, have HTML/link characters, are under two sentences, or are too close to the existing description.

### 4. Apply

```bash
npm run context:apply -- .cache/context-batches/batch-0001-0005.out.json --dry-run
npm run context:apply -- .cache/context-batches/batch-0001-0005.out.json
```

What happens:

1. Rejects any article that already has content before the transcript.
2. Runs `guard.py` **before** editing to confirm the article has a clean protected baseline.
3. Inserts exactly one `<p class="transcript-context">…</p>` before the transcript container.
4. Runs `guard.py` on every changed file.
5. Reverts the whole batch if the guard fails.

The script never changes frontmatter or anything from the transcript container to EOF.

### 5. Build and inspect

```bash
npm run build:test
```

The paragraph is rendered by `_includes/article.liquid` and styled by `.transcript-context`.

### 6. Commit the batch

Commit after each reviewed batch so the next guard baseline is clean:

```bash
git add articles _includes/article.liquid
git commit -m "Add transcript context (batch 1-5)"
```

## Next batch

The queue is content-aware: articles that already have a paragraph are skipped. Just run:

```bash
npm run context:run
```

The next 5 eligible articles are selected automatically. No offset bookkeeping is needed.

## Batch size

Default is 5. Keep it there. Smaller batches reduce the chance of drift, vague summaries, and cross-article mix-ups. Override only with `--limit N`; 10 is the practical upper bound.

Cost scales with total transcript length, not article count. The transcript corpus is about 2.9 million words, so the whole run is roughly 4 million input tokens across all batches. Use a cheap model for drafting and review the output.

## Which model?

The runner does not hard-code a model. It calls `pi -p` with no `--model`, so pi uses its configured default. On this machine that is currently:

```
openrouter/deepseek/deepseek-v4.1-flash-1017
```

Check or change the default with `pi config`, or list IDs with `pi --list-models`. Override one run without changing your default:

```bash
npm run context:run -- --model "openrouter/google/gemini-flash-latest"
```

Use the `provider/model` form. The default flash model is cheap and adequate for short summaries; a stronger model is worth it if you see vague or off-topic drafts.

## Sacred-text safety

The queue only selects articles with a `<div class="transcript-container"` block. Scripture, kavacham, stotram, sahasranama, and ashtakam files in this repository do not have that block, so they are never selected.

If a discourse article about a sacred text appears in a batch, skip it by removing its entry from the `.out.json` before applying. The applier only writes entries that are present.

## What still needs a human

- Reviewing the batch summaries for accuracy and tone.
- Spot-checking names, places, and claims against the transcript.
- Committing each batch.
- Deciding when a paragraph is not worth adding and removing it from the batch.

The model drafts; you approve. That is the sustainable part.

## Files

| File | Purpose |
|---|---|
| `scripts/transcript_context.py` | Queue, batch, draft, validate, insert, guard |
| `.agents/skills/transcript-context/SKILL.md` | Rules for a single article |
| `.agents/skills/transcript-context/scripts/guard.py` | Protected-content check |
| `_includes/article.liquid` | Renders the paragraph and its style |
| `.cache/context-batches/` | Local batch files, gitignored |
