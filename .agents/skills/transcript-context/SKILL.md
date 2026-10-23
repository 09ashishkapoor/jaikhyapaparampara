---
name: transcript-context
description: Add concise, attributed reader context before an existing Guru-disciple transcript in this site's articles and provide a local preview link for human review. Use for one transcript article at a time; never change transcript text, frontmatter, or sacred-text articles.
---

# Transcript context

Work on **one named article per invocation** under `articles/`. Do not select or process a batch automatically. A reviewer can choose the next article after reading the diff. This skill is for articles with a `<div class="transcript-container"` block, not scripture, kavacham, chants, or articles without that block.

1. Read the entire named article, including its transcript and existing editorial text. If it already has an adequate introduction, say so and make no change. Note any existing links to avoid duplicating them.
2. Add **at most one** short editorial paragraph (2–3 sentences) between the closing frontmatter `---` and the first transcript block. Answer what this particular conversation covers; attribute interpretations, historical accounts, and spiritual claims to the speaker. Do not invent sources or add generic filler. An optional single contextual link to an existing article is allowed only when its subject genuinely matches; check the destination exists.
3. Do not change frontmatter (including title, date, author, URL, metadata), the transcript block or anything after its opening tag, quotations, mantras, speaker labels, or translations. Do not insert headings inside the transcript. Preserve the file's line endings.
4. Run `python3 .agents/skills/transcript-context/scripts/guard.py articles/<filename>.md` from the repository root. The guard compares frontmatter and everything from the first transcript block through EOF against `HEAD`. If it fails, restore those protected parts; never rationalize an exception. Check the diff before handing the article to a human for review. A successful guard does **not** certify theological or historical accuracy.
5. If there is no committed baseline, the article already has uncommitted protected changes, or a task requires editing the transcript, stop and ask for a clean baseline or an explicit different workflow. Do not commit, deploy, or move to the next article without the reviewer's direction.
6. After the guard passes and you check the diff, build with `npm run build:test`, then serve `_site` with `python3 -m http.server 8080 --bind 127.0.0.1 --directory _site` from the repository root, leaving it running for review. Find the article's actual URL in the generated `_site/articles/` output (do not assume the filename is the permalink); verify it responds at `http://127.0.0.1:8080/` and give the reviewer a clickable link. If the server or page fails, say so rather than offering an unverified link. Check `git status` again because the build may update generated files; do not include unrelated changes in the article diff.

Pi discovers this project skill at `.agents/skills/transcript-context/SKILL.md`. In Pi, run `/skill:transcript-context articles/<filename>.md` from the project root (reload Pi after adding the skill). For other Agent Skills-compatible agents, load this `SKILL.md` and use the same guard command. The check uses only Python 3 and Git.
