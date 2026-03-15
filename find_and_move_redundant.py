#!/usr/bin/env python3
"""
Find redundant transcript files in tobeprocessed that already exist in processed,
and move them to the redundant folder.

A file in tobeprocessed is redundant if the same transcript (by video ID) already
exists in processed. Handles naming variants: transcript_XXX.md, transcript_XXX_batch.md,
transcript_XXX_english.md.

Usage:
  python find_and_move_redundant.py              # dry-run: report only, no moves
  python find_and_move_redundant.py --move       # actually move redundant files
"""

import argparse
import re
import shutil
import sys
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent
TOBEPROCESSED = WORKSPACE / "markdownfiles_forblog" / "tobeprocessed"
PROCESSED = WORKSPACE / "markdownfiles_forblog" / "processed"
REDUNDANT = WORKSPACE / "markdownfiles_forblog" / "redundant"


def normalized_stem(name: str) -> str:
    """Get canonical transcript base for matching.

    transcript_0fzt4w1XDMI.md          -> transcript_0fzt4w1XDMI
    transcript_2f_K0JCxhqs_batch.md      -> transcript_2f_K0JCxhqs
    transcript_1Khq0T4CWSw_english.md    -> transcript_1Khq0T4CWSw
    """
    stem = name.removesuffix(".md")
    stem = re.sub(r"_(batch|english)$", "", stem)
    return stem


def build_processed_ids(processed_dir: Path) -> set:
    """Return set of normalized transcript stems from processed folder."""
    ids = set()
    for p in processed_dir.glob("*.md"):
        ids.add(normalized_stem(p.name))
    return ids


def main():
    parser = argparse.ArgumentParser(description="Find and move redundant transcripts")
    parser.add_argument(
        "--move",
        action="store_true",
        help="Actually move redundant files to redundant/ (default: dry-run)",
    )
    args = parser.parse_args()

    if not TOBEPROCESSED.exists():
        print(f"Error: tobeprocessed folder not found: {TOBEPROCESSED}")
        sys.exit(1)
    if not PROCESSED.exists():
        print(f"Error: processed folder not found: {PROCESSED}")
        sys.exit(1)

    processed_ids = build_processed_ids(PROCESSED)
    redundant_files = []

    for path in sorted(TOBEPROCESSED.glob("*.md")):
        canonical = normalized_stem(path.name)
        if canonical in processed_ids:
            redundant_files.append(path)

    if not redundant_files:
        print("No redundant files found. All tobeprocessed files are unique.")
        return

    print(f"Found {len(redundant_files)} redundant files (already in processed/):\n")
    for p in redundant_files:
        print(f"  {p.name}")

    if args.move:
        REDUNDANT.mkdir(parents=True, exist_ok=True)
        print(f"\nMoving {len(redundant_files)} files to redundant/...")
        for path in redundant_files:
            dest = REDUNDANT / path.name
            if dest.exists():
                path.unlink()  # Remove from tobeprocessed since redundant copy exists
                print(f"  Removed (already in redundant): {path.name}")
            else:
                shutil.move(str(path), str(dest))
                print(f"  Moved: {path.name}")
        print("\nDone.")
    else:
        print("\nDry run. Use --move to actually move these files to redundant/")


if __name__ == "__main__":
    main()
