# Click workflow

Double-click in this order.

| File | What it does |
|---|---|
| `1-draft-next-5.cmd` | Picks the next 5 newest unprocessed articles, drafts summaries, opens the review file in Notepad |
| `2-apply-reviewed.cmd` | Inserts exactly the reviewed summaries, runs the guard, archives the batch, shows progress |
| `3-check-build.cmd` | Runs `npm run build:test` |
| `4-status.cmd` | Shows how many articles are left |

## The loop

1. Double-click **1-draft-next-5.cmd**.
2. Read `next-batch.review.md` when Notepad opens. Each section shows the summary and the existing description.
3. If a summary is wrong, edit it in `.cache\context-batches\next-batch.out.json`, or delete that entry to skip the article for this round. A skipped article will reappear in a later batch; add a skip list only if that becomes noisy.
4. Double-click **2-apply-reviewed.cmd**.
5. Double-click **3-check-build.cmd**.
6. Commit the diff when you are happy.

Then repeat from step 1. The queue always skips articles that already have context, so the next click is always the next 5.

## What is safe

- The guard runs before and after every edit. Frontmatter and transcript text are never changed.
- If the guard fails, the whole batch is reverted.
- A failed apply leaves the batch in place; clicking **2** again retries the same reviewed file.
- A successful apply archives the batch under `.cache\context-batches\applied\`, so it cannot be applied twice.

## Model

The draft button uses pi's configured default model. To pin a different one for these clicks, edit `1-draft-next-5.cmd` and add `--model` to the command, for example:

```bat
python scripts\transcript_context.py run --fixed --limit 5 --model "openrouter/google/gemini-flash-latest"
```

## Files

```
.cache\context-batches\
  next-batch.in.json        input for the model
  next-batch.out.json       reviewed summaries, used by apply
  next-batch.review.md      human-readable review, opened automatically
  applied\                  archived successful batches
```

`.cache\` is gitignored. Nothing in it is committed.
