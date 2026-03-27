# How-to — Step-by-step

Add a new article

1. Create `articles/your-article.md` with this frontmatter template:

```yaml
layout: article
title: "Full Title Here"
breadcrumbTitle: "Short 5-7 Word Version"
description: "1-2 sentence summary"
keywords: "Guru Deva Shyama Khyapa, Gupta Sadhak, Smashana Bhairava, Khyapa Parampara"
category: "Guru Stories"
author: "🗣️ Gupta Sadhak Shyama Khyapa"
date: 2026-03-05
readingTime: 6
tags:
  - articles
  - Guru Baba Shyama Khyapa
source: |
  <p><strong>Source:</strong> YouTube video | Bengali to English Translation</p>
```

2. Body: use `transcript-container` + `speaker-block` HTML. Example:

```html
<div class="transcript-container" style="...">
  <div class="speaker-block" style="...">
    <span class="speaker-name">DEVOTEE:</span>
    <span class="speech-text">Question text here.</span>
  </div>
</div>
```

3. Run `npm run serve` to preview.

Process transcripts using `blog-converter` agents

- For large batches, run `blog-converter-a`/`b`/`c` (parallel queues) or single `blog-converter` for ad-hoc runs.
- Agents read `markdownfiles_forblog/tobeprocessed/` (or queue subfolders) and write to `articles/`.
- Progress files: `_blog_conversion_progress*.md` at repo root — review before and after runs.

Agent usage — practical steps & checklist

1. Inspect progress files before running any agent:

```bash
ls -1 _blog_conversion_progress*.md _article_fix_progress.md
cat _blog_conversion_progress.md
```

2. Sample local ad-hoc conversion (script-based):

```bash
python3 convert_transcript_format.py --help
python3 convert_transcript_format.py markdownfiles_forblog/tobeprocessed/yourfile.txt
```

3. For large batches: use the repository agents in `queue-a/`, `queue-b/`, `queue-c/`.

4. After a run, review progress and validate 3–5 generated articles in `articles/`.

5. For published-article fixes: run `article-fixer`, inspect `_article_fix_progress.md`, and preview locally.

Run the build and preview production output

```bash
npm run build
# output -> _site/

# Serve locally (production-like)
npm start
```

Deploy to Cloudflare Pages

- Cloudflare is configured via `wrangler.toml` to use `_site/` as the build output directory; pushing to `main` triggers deployment.