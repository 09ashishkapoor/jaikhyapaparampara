#!/usr/bin/env python3
"""
Move small transcript files (< 4KB) from tobeprocessed into a subfolder,
so you can tackle bigger transcripts first.

Usage:
  python isolate_small_transcripts.py              # dry-run: report only, no moves
  python isolate_small_transcripts.py --move       # actually move small files
"""

import argparse
import sys
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent
TOBEPROCESSED = WORKSPACE / "markdownfiles_forblog" / "tobeprocessed"
SMALL_SUBFOLDER = "small"  # tobeprocessed/small/
SIZE_LIMIT_BYTES = 4 * 1024  # 4KB


def main():
    parser = argparse.ArgumentParser(description="Isolate small transcript files into subfolder")
    parser.add_argument(
        "--move",
        action="store_true",
        help="Actually move small files to subfolder (default: dry-run)",
    )
    args = parser.parse_args()

    if not TOBEPROCESSED.exists():
        print(f"Error: tobeprocessed folder not found: {TOBEPROCESSED}")
        sys.exit(1)

    small_dir = TOBEPROCESSED / SMALL_SUBFOLDER
    small_files = []

    for path in sorted(TOBEPROCESSED.glob("*.md")):
        if path.parent == small_dir:
            continue  # skip files already in the small subfolder
        if path.stat().st_size < SIZE_LIMIT_BYTES:
            small_files.append(path)

    if not small_files:
        print(f"No files smaller than 4KB found in {TOBEPROCESSED}")
        return

    print(f"Found {len(small_files)} files < 4KB:\n")
    for p in small_files:
        size_kb = p.stat().st_size / 1024
        print(f"  {p.name} ({size_kb:.2f} KB)")

    if args.move:
        small_dir.mkdir(parents=True, exist_ok=True)
        print(f"\nMoving {len(small_files)} files to {SMALL_SUBFOLDER}/...")
        for path in small_files:
            dest = small_dir / path.name
            path.rename(dest)
            print(f"  Moved: {path.name}")
        print("\nDone.")
    else:
        print(f"\nDry run. Use --move to actually move these files to {SMALL_SUBFOLDER}/")


if __name__ == "__main__":
    main()
