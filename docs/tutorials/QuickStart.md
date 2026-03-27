# Tutorials — Quick Start

Quick start — local dev

Prereqs: Node.js, npm, Python 3

Commands:

```bash
npm ci
npm run serve
# open http://localhost:8080
```

Add & preview a single article (fast path)

1. Create `articles/your-article.md` with required frontmatter (see How-to).
2. Run `npm run serve` and visit the dev URL printed in the terminal.

Convert a single transcript (manual)

1. Place source file in `markdownfiles_forblog/tobeprocessed/`.
2. For a one-off conversion, run the single-instance converter agent or use the Python helpers:

```bash
python3 convert_transcript_format.py --input markdownfiles_forblog/tobeprocessed/yourfile.txt
```

3. Review generated Markdown in `articles/` and preview with `npm run serve`.

Batch conversion (recommended)

- Use the repository's `blog-converter` agents to process many files with deduplication and progress tracking. See the How-to guide for the agent workflow and progress file locations.