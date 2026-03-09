#!/usr/bin/env python3
"""
convert_blog_gemini.py — Headless blog article converter using Google Gemini.

Reads transcript markdown files from markdownfiles_forblog/tobeprocessed/,
converts each one to a fully formatted, word-for-word conversation-style article,
and writes the output to articles/. Tracks progress in _blog_conversion_progress.md
so interrupted runs resume automatically.

Configuration (via .env file in workspace root, or environment variables):
  GEMINI_API_KEY   — Required. Your Google AI Studio API key.
  GEMINI_MODEL     — Optional. Default: gemini-2.0-flash
  BATCH_LIMIT      — Optional. Max articles per run. 0 = no limit. Default: 0
  DELAY_SECONDS    — Optional. Seconds to sleep between API calls. Default: 4

Usage:
  python convert_blog_gemini.py               # process all pending files
  python convert_blog_gemini.py --limit 5     # process at most 5 files this run
  python convert_blog_gemini.py --dry-run     # list pending files without converting
"""

import argparse
import logging
import os
import re
import shutil
import sys
import time
from datetime import date
from pathlib import Path

# ── optional dotenv support ───────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed; read env vars directly

try:
    from google import genai
    from google.genai import types as genai_types
except ImportError:
    print("ERROR: google-genai is not installed.")
    print("Install it with: pip install google-genai")
    sys.exit(1)

# ── paths ─────────────────────────────────────────────────────────────────────
WORKSPACE     = Path(__file__).resolve().parent
TOBEPROCESSED = WORKSPACE / "markdownfiles_forblog" / "tobeprocessed"
PROCESSED_DIR = WORKSPACE / "markdownfiles_forblog" / "processed"
ARTICLES_DIR  = WORKSPACE / "articles"
PROGRESS_FILE = WORKSPACE / "_blog_conversion_progress.md"
REFERENCE_ART = WORKSPACE / "articles" / "kali-puja-tantra-amavasya-dangers-shyama-khyapa.md"
LOG_FILE      = WORKSPACE / "blog_conversion.log"

# ── configuration from environment ───────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL   = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
BATCH_LIMIT    = int(os.environ.get("BATCH_LIMIT", "0"))
DELAY_SECONDS  = float(os.environ.get("DELAY_SECONDS", "4"))

# ── logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)

# ── progress tracking ─────────────────────────────────────────────────────────
_PROGRESS_HEADER = (
    "# Blog Conversion Progress\n"
    "<!-- This file is auto-maintained by convert_blog_gemini.py. Do not edit manually. -->\n\n"
    "## Completed Transcripts\n"
)


def load_progress() -> set:
    """Return set of transcript filenames already processed."""
    if not PROGRESS_FILE.exists():
        PROGRESS_FILE.write_text(_PROGRESS_HEADER, encoding="utf-8")
        return set()
    done = set()
    for line in PROGRESS_FILE.read_text(encoding="utf-8").splitlines():
        # lines look like: - markdownfiles_forblog/processed/filename.md → articles/slug.md
        m = re.match(r"-\s+markdownfiles_forblog/processed/(.+?\.md)", line)
        if m:
            done.add(m.group(1))
    return done


def update_progress(transcript_name: str, article_slug: str) -> None:
    """Append one completed entry to the progress file."""
    with PROGRESS_FILE.open("a", encoding="utf-8") as f:
        f.write(
            f"- markdownfiles_forblog/processed/{transcript_name}"
            f" → articles/{article_slug}\n"
        )


# ── slug helpers ──────────────────────────────────────────────────────────────

def title_to_slug(title: str) -> str:
    """Convert an article title to a URL-safe hyphenated slug."""
    slug = title.lower()
    slug = re.sub(r"[''\"():,!?|/\\]", "", slug)
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug.strip())
    slug = re.sub(r"-{2,}", "-", slug)
    return slug.strip("-")


def extract_title_from_article(content: str) -> str:
    """Pull the title value from YAML frontmatter."""
    m = re.search(r'^title:\s*["\']?(.+?)["\']?\s*$', content, re.MULTILINE)
    return m.group(1).strip().strip('"').strip("'") if m else ""


def extract_youtube_url(text: str) -> str:
    """Extract the first YouTube watch URL from the text."""
    m = re.search(r'https://www\.youtube\.com/watch\?v=[\w-]+', text)
    return m.group(0) if m else ""


def extract_video_id_from_filename(filename: str) -> str:
    """Pull the YouTube video ID out of a transcript filename.

    Handles both 'transcript_{ID}_batch.md' and 'transcript_{ID}_english.md'.
    """
    m = re.match(r'transcript_([\w-]+)_(?:batch|english)\.md', filename)
    return m.group(1) if m else ""


def build_existing_video_id_index() -> dict:
    """Return a dict mapping YouTube video ID → article filename for all
    articles that already exist in articles/.

    Scans article content for 'youtube.com/watch?v={ID}' so it catches
    articles created under any slug.
    """
    index = {}
    for article_path in ARTICLES_DIR.glob("*.md"):
        text = article_path.read_text(encoding="utf-8", errors="ignore")
        m = re.search(r'youtube\.com/watch\?v=([\w-]+)', text)
        if m:
            index[m.group(1)] = article_path.name
    return index


# ── Gemini prompts ────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
You are a blog article formatter for the Jai Khya Parampara website.
Your sole task is converting raw transcripts into correctly structured blog posts.

RULES — NEVER BREAK THESE:
1. ZERO summarization. Include EVERY single line of dialogue from the transcript without
   omitting, merging, condensing, or paraphrasing any exchange whatsoever.
2. Output ONLY the raw article content. Start your response with --- (YAML opening delimiter).
   Do not write any explanation, preamble, or commentary before or after the article.
3. Do not wrap your output in markdown code fences of any kind.
4. Do not add italics to any speech text. Use plain text exactly as in the transcript.
5. Do not add <h2> or <h3> headings inside the transcript body.
6. Do not add a conclusion section, editorial note, or "Spiritual Insight" box.
7. Match the reference article YAML frontmatter fields and HTML div structure exactly.
8. Speaker labels to use:
   - The interviewer / host / questioner → "Devotee:"
   - The Guru / Gurudev → "Guru Shyama Khyapa:"
   - Narrated or descriptive context lines → "Narrator:"
   - A named third person speaking (e.g. "Chandan:") → keep their name as-is.
"""


def build_prompt(transcript: str, reference: str, youtube_url: str, today: str) -> str:
    source_block = (
        f"  <p><strong>Source:</strong> YouTube video | Bengali to English Translation</p>\\n"
        f"  <p><a href=\"{youtube_url}\" target=\"_blank\" rel=\"noopener\" "
        f"style=\"color:var(--accent-bright);\">📺 Watch Original Bengali Video</a></p>\\n"
        f"  <p style=\"margin-top:0.5rem;\"><em>Verified by Kaliputra-Ashish</em></p>"
    )
    return (
        "REFERENCE ARTICLE — match this YAML frontmatter structure and HTML div "
        "structure exactly:\n"
        f"{reference}\n\n"
        "---\n\n"
        "TRANSCRIPT TO CONVERT — every dialogue exchange must be present in the "
        "article body verbatim:\n"
        f"{transcript}\n\n"
        "---\n\n"
        "Additional requirements:\n"
        f"- date field: {today}\n"
        f"- source field (YAML multiline pipe block, indent continuation lines 2 spaces):\n"
        f"  source: |\n"
        f"    <p><strong>Source:</strong> YouTube video | Bengali to English Translation</p>\n"
        f"    <p><a href=\"{youtube_url}\" target=\"_blank\" rel=\"noopener\" "
        f"style=\"color:var(--accent-bright);\">📺 Watch Original Bengali Video</a></p>\n"
        f"    <p style=\"margin-top:0.5rem;\"><em>Verified by Kaliputra-Ashish</em></p>\n"
        "- keywords must always include: "
        "GuruDeva Shyama Khyapa, Gupta Sadhak, Smashana Bhairava, Khyapa Parampara\n"
        "- tags must always include: articles, Guru Baba Shyama Khyapa, "
        "Gupta Sadhak Shyamakhyapa, Smashana Bhairava\n"
        "- readingTime: estimate as word count of transcript divided by 200, rounded up\n\n"
        "Output the complete formatted article now, starting with ---"
    )


def call_gemini(transcript: str, reference: str, youtube_url: str) -> str:
    """Call the Gemini API and return the raw response text."""
    client = genai.Client(api_key=GEMINI_API_KEY)
    today = date.today().isoformat()
    prompt = build_prompt(transcript, reference, youtube_url, today)
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=genai_types.GenerateContentConfig(
            system_instruction=_SYSTEM_PROMPT,
            temperature=0.1,         # low temperature = consistent, faithful output
            max_output_tokens=32768, # large transcripts need headroom
        ),
    )
    return response.text


def clean_output(raw: str) -> str:
    """Strip markdown code fence wrappers Gemini may add despite instructions."""
    raw = raw.strip()
    raw = re.sub(r'^```(?:markdown|yaml|html|md)?\s*\n', '', raw)
    raw = re.sub(r'\n```\s*$', '', raw)
    return raw.strip()


# ── per-file pipeline ─────────────────────────────────────────────────────────

def process_one(
    transcript_path: Path,
    reference: str,
    done: set,
    video_id_index: dict,
) -> tuple:
    """
    Process a single transcript file.
    Returns (success: bool, article_slug: str).
    """
    name = transcript_path.name

    # duplicate check 1: already in progress tracking
    if name in done:
        log.info("SKIP (already in progress file): %s", name)
        return False, ""

    # duplicate check 2: already physically moved to processed/
    if (PROCESSED_DIR / name).exists():
        log.info("SKIP (already in processed/ folder): %s", name)
        return False, ""

    # duplicate check 3: YouTube video ID already exists in an article
    video_id = extract_video_id_from_filename(name)
    if video_id and video_id in video_id_index:
        log.info(
            "SKIP (video ID '%s' already in articles/%s): %s",
            video_id, video_id_index[video_id], name,
        )
        return False, ""

    log.info("Reading transcript: %s", name)
    transcript = transcript_path.read_text(encoding="utf-8")
    youtube_url = extract_youtube_url(transcript)
    if not youtube_url:
        log.warning("No YouTube URL found in %s — source field will be incomplete", name)

    log.info("Calling Gemini (%s)...", GEMINI_MODEL)
    try:
        raw = call_gemini(transcript, reference, youtube_url)
    except Exception as exc:
        log.error("Gemini API error for %s: %s", name, exc)
        return False, ""

    article_content = clean_output(raw)

    # parse title to derive slug
    title = extract_title_from_article(article_content)
    if not title:
        log.error("Could not parse title from Gemini output for %s", name)
        log.debug("Gemini output snippet: %s", article_content[:300])
        return False, ""

    slug = title_to_slug(title) + ".md"
    article_path = ARTICLES_DIR / slug

    # duplicate check 4: article slug already exists
    if article_path.exists():
        log.warning("SKIP (article already exists at articles/%s)", slug)
        return False, ""

    # save article
    article_path.write_text(article_content, encoding="utf-8")
    log.info("Created: articles/%s", slug)

    # update progress file before moving (so if move fails, we still track it)
    update_progress(name, slug)

    # update in-memory index so subsequent files in the same run are also protected
    if video_id:
        video_id_index[video_id] = slug

    # move transcript to processed/
    shutil.move(str(transcript_path), str(PROCESSED_DIR / name))
    log.info("Moved to processed/: %s", name)

    return True, slug


# ── retry wrapper ─────────────────────────────────────────────────────────────

def process_one_with_retry(
    transcript_path: Path,
    reference: str,
    done: set,
    video_id_index: dict,
    max_retries: int = 2,
) -> tuple:
    """Wrap process_one with simple retry logic for transient API errors."""
    for attempt in range(1, max_retries + 2):
        success, slug = process_one(transcript_path, reference, done, video_id_index)
        if success or slug == "":  # success or permanent skip — don't retry
            return success, slug
        if attempt <= max_retries:
            wait = 30 * attempt
            log.warning("Retrying %s in %ds (attempt %d/%d)...",
                        transcript_path.name, wait, attempt + 1, max_retries + 1)
            time.sleep(wait)
    return False, ""


# ── entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert transcript markdown files to blog articles using Google Gemini."
    )
    parser.add_argument(
        "--limit", type=int, default=0,
        help="Maximum number of articles to convert in this run (0 = no limit)."
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="List pending files without converting anything."
    )
    args = parser.parse_args()

    if not args.dry_run and not GEMINI_API_KEY:
        log.error(
            "GEMINI_API_KEY is not set. "
            "Add it to a .env file in the workspace root or set it as an environment variable."
        )
        sys.exit(1)

    if not REFERENCE_ART.exists():
        log.error("Reference article not found: %s", REFERENCE_ART)
        sys.exit(1)

    reference = REFERENCE_ART.read_text(encoding="utf-8")
    done = load_progress()
    video_id_index = build_existing_video_id_index()
    pending = sorted(TOBEPROCESSED.glob("*.md"))
    pending_names = {p.name for p in pending}

    # filter to only files not yet done
    pending_new = [p for p in pending if p.name not in done and not (PROCESSED_DIR / p.name).exists()]

    # ─ detect duplicate video IDs within pending_new ─────────────────────────────────
    # build a map of video ID → list of filenames for all pending files
    pending_by_id = {}
    for p in pending_new:
        vid = extract_video_id_from_filename(p.name)
        if vid:
            if vid not in pending_by_id:
                pending_by_id[vid] = []
            pending_by_id[vid].append(p.name)

    # flag any duplicate IDs within the pending batch
    duplicates_in_pending = {vid: names for vid, names in pending_by_id.items() if len(names) > 1}
    if duplicates_in_pending:
        log.warning("[WARNING] Duplicate video IDs found in pending batch:")
        for vid, names in duplicates_in_pending.items():
            log.warning("   Video ID %s: %s", vid, ", ".join(names))
        log.warning("   Only the FIRST occurrence of each duplicate ID will be processed.")
        # filter pending_new to keep only first occurrence of each video ID
        seen_ids = set()
        pending_new_filtered = []
        for p in pending_new:
            vid = extract_video_id_from_filename(p.name)
            if vid and vid in duplicates_in_pending:
                if vid not in seen_ids:
                    pending_new_filtered.append(p)
                    seen_ids.add(vid)
            else:
                pending_new_filtered.append(p)
        pending_new = pending_new_filtered

    log.info("=== Blog Converter — model: %s ===", GEMINI_MODEL)
    log.info("Pending: %d files  |  Already completed: %d  |  Video IDs indexed: %d",
             len(pending_new), len(done), len(video_id_index))

    if args.dry_run:
        log.info("DRY RUN -- files that would be processed:")
        for p in pending_new:
            vid = extract_video_id_from_filename(p.name)
            already = f" [ID {vid} -> articles/{video_id_index[vid]}]" if vid in video_id_index else ""
            status = "SKIP" if already else "CONVERT"
            log.info("  [%s] %s%s", status, p.name, already)
        return

    effective_limit = args.limit or BATCH_LIMIT or 0
    if effective_limit:
        log.info("Batch limit: %d articles this run", effective_limit)

    converted = 0
    for transcript_path in pending_new:
        if effective_limit and converted >= effective_limit:
            log.info("Batch limit (%d) reached. Run again to continue.", effective_limit)
            break

        success, slug = process_one_with_retry(transcript_path, reference, done, video_id_index)
        if success:
            converted += 1
            done.add(transcript_path.name)
            log.info("--- Article %d complete: articles/%s ---", converted, slug)

        # always sleep between files to respect rate limits
        if converted < len(pending_new):
            time.sleep(DELAY_SECONDS)

    log.info("=== Done. Converted %d articles in this run. ===", converted)


if __name__ == "__main__":
    main()
