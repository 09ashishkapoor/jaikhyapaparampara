#!/usr/bin/env python3
"""Batch queue and applier for the transcript-context skill.

The single-article skill stays the source of truth for what a context
paragraph must be. This script only automates the repetitive parts:
finding eligible articles, preparing one batch file, and inserting
reviewed paragraphs without touching frontmatter or transcript text.

Usage:
    python scripts/transcript_context.py status
    python scripts/transcript_context.py prepare --limit 5
    python scripts/transcript_context.py run --limit 5
    python scripts/transcript_context.py apply .cache/context-batches/batch-0001-0005.out.json --dry-run
    python scripts/transcript_context.py apply .cache/context-batches/batch-0001-0005.out.json
"""

import argparse
import difflib
import html
import json
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTICLE_DIR = ROOT / "articles"
BATCH_DIR = ROOT / ".cache" / "context-batches"
GUARD = ROOT / ".agents" / "skills" / "transcript-context" / "scripts" / "guard.py"
MARKER = '<div class="transcript-container"'
CONTEXT_CLASS = "transcript-context"

PROMPT = (
    "You are drafting reader context for transcript articles on a Hindu guru-disciple site. "
    "Read the JSON below. For every article, write ONE plain-text paragraph of 2-3 sentences "
    "(45-90 words) that tells the reader what this particular conversation covers and why it matters. "
    "Use only facts stated in that article. Attribute spiritual, historical, and prophetic claims to "
    "the speaker (for example, 'Guru Shyama Khyapa describes...'). Do not copy the description, do not "
    "add links or headings, do not use generic filler such as 'In this insightful discourse', and do "
    "not invent sources, dates, names, or claims. Output ONLY valid JSON in this shape: "
    '{"summaries":{"articles/example.md":"paragraph text"}}. Include exactly one entry per article '
    "path from the input. No markdown fences, no commentary."
)


def split_article(text):
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        raise ValueError("missing opening frontmatter delimiter")
    end = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
    if end is None:
        raise ValueError("missing closing frontmatter delimiter")
    frontmatter = "".join(lines[: end + 1])
    body = "".join(lines[end + 1 :])
    marker_index = body.find(MARKER)
    if marker_index == -1:
        raise ValueError("no transcript container")
    before = body[:marker_index]
    visible = re.sub(r"<[^>]+>", " ", before)
    visible = re.sub(r"\s+", " ", visible).strip()
    return frontmatter, body, marker_index, bool(visible)


def read_article(path):
    with open(path, encoding="utf-8", newline="") as handle:
        return handle.read()


def write_article(path, text):
    with open(path, "w", encoding="utf-8", newline="") as handle:
        handle.write(text)


def frontmatter_value(frontmatter, key):
    match = re.search(rf"^{re.escape(key)}:\s*[\"']?(.+?)[\"']?\s*$", frontmatter, re.M)
    return match.group(1).strip() if match else ""


def candidates():
    result = []
    for path in sorted(ARTICLE_DIR.glob("*.md")):
        try:
            text = read_article(path)
            frontmatter, body, marker_index, has_context = split_article(text)
        except ValueError:
            continue
        result.append(
            {
                "path": path.relative_to(ROOT).as_posix(),
                "title": frontmatter_value(frontmatter, "title"),
                "description": frontmatter_value(frontmatter, "description"),
                "category": frontmatter_value(frontmatter, "category"),
                "author": frontmatter_value(frontmatter, "author"),
                "date": frontmatter_value(frontmatter, "date"),
                "has_context": has_context,
                "body": body,
            }
        )
    return result


def status(_args):
    rows = candidates()
    done = sum(1 for row in rows if row["has_context"])
    eligible = len(rows) - done
    print(f"Articles with a transcript: {len(rows)}")
    print(f"Already have context:      {done}")
    print(f"Eligible:                  {eligible}")
    print(f"Batches of 5:              {(eligible + 4) // 5}")


def build_batch(args):
    eligible = [row for row in candidates() if not row["has_context"]]
    eligible.sort(key=lambda row: (row["date"], row["path"]), reverse=True)
    start = args.offset
    selected = eligible[start : start + args.limit]
    if not selected:
        return None
    BATCH_DIR.mkdir(parents=True, exist_ok=True)
    end = start + len(selected)
    if getattr(args, "fixed", False):
        path = BATCH_DIR / "next-batch.in.json"
    else:
        path = BATCH_DIR / f"batch-{start + 1:04d}-{end:04d}.in.json"
    payload = {
        "batch": f"{start + 1:04d}-{end:04d}",
        "created": datetime.now(timezone.utc).isoformat(),
        "articles": [
            {
                "path": row["path"],
                "title": row["title"],
                "description": row["description"],
                "category": row["category"],
                "author": row["author"],
                "date": row["date"],
                "content": row["body"],
            }
            for row in selected
        ],
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def prepare(args):
    path = build_batch(args)
    if path is None:
        print("No eligible articles in that range.")
        return 0
    print(path)
    print(f"Prepared batch {path.name}.")
    return 0


def parse_model_json(raw):
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("model output did not contain JSON")
    return json.loads(text[start : end + 1])


def write_review(batch_path, out_path):
    payload = json.loads(batch_path.read_text(encoding="utf-8"))
    summaries = json.loads(out_path.read_text(encoding="utf-8"))["summaries"]
    articles = {row["path"]: row for row in payload["articles"]}
    lines = [
        "# Transcript context review",
        "",
        f"Batch: `{batch_path.name}`  ",
        f"Articles: {len(summaries)}",
        "",
        "Check each summary against its article. Remove an entry from the `.out.json` if you do not want it applied.",
        "",
    ]
    for index, (relative, summary) in enumerate(summaries.items(), 1):
        meta = articles.get(relative, {})
        lines.extend(
            [
                f"## {index}. {meta.get('title', relative)}",
                "",
                f"`{relative}`",
                "",
                f"**Summary:** {summary}",
                "",
                f"**Existing description:** {meta.get('description', '')}",
                "",
                "---",
                "",
            ]
        )
    review_path = out_path.with_name(out_path.name.replace(".out.json", ".review.md"))
    review_path.write_text("\n".join(lines), encoding="utf-8")
    return review_path


def find_dsh():
    candidates = [
        os.environ.get("DSH_CLI"),
        shutil.which("dsh"),
        Path(os.environ.get("LOCALAPPDATA", ""))
        / "Programs"
        / "DeepSeek Harness"
        / "resources"
        / "runtime"
        / "cli"
        / "bin"
        / "dsh.cmd",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return str(candidate)
    return None


def draft_summaries(batch_path):
    dsh = find_dsh()
    if not dsh:
        print("dsh CLI not found; run prepare and process the batch manually.", file=sys.stderr)
        return None
    task = (
        PROMPT
        + "\n\nDo not use tools and do not modify any files.\n\nInput JSON:\n\n"
        + batch_path.read_text(encoding="utf-8")
    )
    try:
        result = subprocess.run(
            [dsh, "--profile", "headless", "-"],
            cwd=ROOT,
            input=task,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=900,
        )
    except subprocess.TimeoutExpired:
        print("Model call timed out.", file=sys.stderr)
        return None
    if result.returncode != 0:
        print(result.stderr[-2000:], file=sys.stderr)
        return None
    try:
        return parse_model_json(result.stdout)["summaries"]
    except (ValueError, KeyError) as exc:
        print(f"Could not parse model output: {exc}", file=sys.stderr)
        print(result.stdout[-2000:], file=sys.stderr)
        return None


def run(args):
    batch_path = build_batch(args)
    if batch_path is None:
        print("No eligible articles in that range.")
        return 0
    print(batch_path)
    summaries = None
    for attempt in range(1, 4):
        print(f"Calling dsh for {batch_path.name} (attempt {attempt}) ...", file=sys.stderr)
        summaries = draft_summaries(batch_path)
        if summaries:
            break
        time.sleep(5)
    if not summaries:
        return 1
    out_path = batch_path.with_name(batch_path.name.replace(".in.json", ".out.json"))
    out_path.write_text(json.dumps({"summaries": summaries}, ensure_ascii=False, indent=2), encoding="utf-8")
    review_path = write_review(batch_path, out_path)
    print(out_path)
    print(review_path)
    if args.apply:
        return apply_summaries(out_path, dry_run=False)
    print("Review the summaries, then run: python scripts/transcript_context.py apply " + str(out_path))
    return 0


def validate_summary(summary, description):
    text = re.sub(r"\s+", " ", summary).strip()
    if not 120 <= len(text) <= 800:
        raise ValueError(f"length {len(text)} outside 120-800")
    if any(char in text for char in "<>[]"):
        raise ValueError("contains HTML or link characters")
    if len(re.findall(r"[.!?](?:\s|$)", text)) < 2:
        raise ValueError("expected at least two sentences")
    if description:
        similarity = difflib.SequenceMatcher(None, text.lower(), description.lower()).ratio()
        if similarity > 0.9:
            raise ValueError("too close to the existing description")
    return text


def apply_summaries(path, dry_run=False):
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    summaries = payload.get("summaries", payload)
    if not isinstance(summaries, dict) or not summaries:
        print("No summaries found.", file=sys.stderr)
        return 1

    planned = []
    errors = []
    for relative, summary in summaries.items():
        article_path = (ROOT / relative).resolve()
        if article_path.parent != ARTICLE_DIR.resolve() or article_path.suffix != ".md" or not article_path.exists():
            errors.append(f"{relative}: not an articles/*.md path")
            continue
        try:
            text = read_article(article_path)
            frontmatter, body, marker_index, has_context = split_article(text)
            if has_context:
                errors.append(f"{relative}: already has content before the transcript")
                continue
            description = frontmatter_value(frontmatter, "description")
            clean = validate_summary(summary, description)
            guard_before = subprocess.run(
                [sys.executable, str(GUARD), str(article_path)],
                cwd=ROOT,
                capture_output=True,
                text=True,
            )
            if guard_before.returncode != 0:
                errors.append(f"{relative}: guard failed before edit: {guard_before.stderr.strip()}")
                continue
            planned.append((relative, article_path, text, body, marker_index, clean))
        except (OSError, ValueError) as exc:
            errors.append(f"{relative}: {exc}")

    if errors:
        print("Rejected:", file=sys.stderr)
        for error in errors:
            print(f"  {error}", file=sys.stderr)
        if not planned:
            return 1

    for relative, _article_path, _text, _body, _marker_index, clean in planned:
        print(f"{'DRY ' if dry_run else ''}{relative}: {clean[:120]}...")

    if dry_run:
        print(f"Dry run: {len(planned)} would be written, {len(errors)} rejected.")
        return 0

    written = []
    for relative, article_path, text, body, marker_index, clean in planned:
        newline = "\r\n" if "\r\n" in text else "\n"
        new_body = (
            newline
            + f'<p class="{CONTEXT_CLASS}">{html.escape(clean, quote=False)}</p>'
            + newline
            + newline
            + body[marker_index:]
        )
        write_article(article_path, text[: len(text) - len(body)] + new_body)
        written.append(article_path)

    guard = subprocess.run(
        [sys.executable, str(GUARD), *[str(item) for item in written]],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if guard.returncode != 0:
        for article_path, (_relative, _path, text, _body, _marker_index, _clean) in zip(written, planned):
            write_article(article_path, text)
        print("Guard failed after edit; reverted this batch.", file=sys.stderr)
        print(guard.stdout, file=sys.stderr)
        print(guard.stderr, file=sys.stderr)
        return 1
    print(f"Applied {len(written)} summaries; guard passed. {len(errors)} rejected.")
    if Path(path).name == "next-batch.out.json":
        archive_fixed()
    return 0


def archive_fixed():
    applied = BATCH_DIR / "applied"
    applied.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    for suffix in (".out.json", ".in.json", ".review.md"):
        source = BATCH_DIR / f"next-batch{suffix}"
        if source.exists():
            shutil.move(str(source), str(applied / f"next-batch-{stamp}{suffix}"))
    print(f"Archived in {applied}")


def apply_command(args):
    return apply_summaries(args.batch, dry_run=args.dry_run)


def build_site():
    npm = shutil.which("npm")
    if not npm:
        print("npm not found; skipping build check.", file=sys.stderr)
        return 0
    return subprocess.run([npm, "run", "build:test"], cwd=ROOT).returncode


def commit_applied():
    changed = subprocess.run(
        ["git", "diff", "--name-only", "--", "articles"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    ).stdout.split()
    if not changed:
        return 0
    add = subprocess.run(["git", "add", "--", *changed], cwd=ROOT)
    commit = subprocess.run(
        ["git", "commit", "-m", f"Add transcript context to {len(changed)} articles"],
        cwd=ROOT,
    )
    if add.returncode or commit.returncode:
        return 1
    print(f"Committed {len(changed)} article(s).")
    return 0


def auto(args):
    args.fixed = True
    args.apply = True
    if not args.no_build and build_site() != 0:
        print("Baseline build failed; stopping.", file=sys.stderr)
        return 1
    previous = None
    rounds = 0
    while True:
        remaining = sum(1 for row in candidates() if not row["has_context"])
        if remaining == 0:
            print("All articles have context.")
            break
        if args.max_batches and rounds >= args.max_batches:
            print(f"Stopping after {rounds} batch(es).")
            break
        if remaining == previous:
            print("No progress in the last batch; stopping so it can be inspected.", file=sys.stderr)
            return 1
        previous = remaining
        rounds += 1
        print(f"{remaining} article(s) left (batch {rounds}).")
        if run(args) != 0 or commit_applied() != 0:
            return 1
    return 0 if args.no_build else build_site()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("status", help="Show eligible article counts").set_defaults(func=status)

    prepare_parser = sub.add_parser("prepare", help="Write a batch file for review")
    prepare_parser.add_argument("--limit", type=int, default=5)
    prepare_parser.add_argument("--offset", type=int, default=0)
    prepare_parser.add_argument("--fixed", action="store_true", help="Write next-batch.in.json for the click workflow")
    prepare_parser.set_defaults(func=prepare)

    run_parser = sub.add_parser("run", help="Prepare a batch and ask dsh to draft summaries")
    run_parser.add_argument("--limit", type=int, default=5)
    run_parser.add_argument("--offset", type=int, default=0)
    run_parser.add_argument("--fixed", action="store_true", help="Use next-batch.* names for the click workflow")
    run_parser.add_argument("--apply", action="store_true", help="Apply immediately instead of waiting for review")
    run_parser.set_defaults(func=run)

    apply_parser = sub.add_parser("apply", help="Insert reviewed summaries")
    apply_parser.add_argument("batch")
    apply_parser.add_argument("--dry-run", action="store_true")
    apply_parser.set_defaults(func=apply_command)

    auto_parser = sub.add_parser("auto", help="Draft, apply, commit, and repeat until every article has context")
    auto_parser.add_argument("--limit", type=int, default=5)
    auto_parser.add_argument("--offset", type=int, default=0)
    auto_parser.add_argument("--no-build", action="store_true", help="Skip the npm build check")
    auto_parser.add_argument("--max-batches", type=int, default=0, help="Stop after N batches (0 = run to the end)")
    auto_parser.set_defaults(func=auto)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
