#!/usr/bin/env python3
"""Fail if a transcript article's frontmatter or transcript-to-EOF differs from HEAD."""

import argparse
import subprocess
import sys
from pathlib import Path

MARKER = b'<div class="transcript-container"'


def protected_parts(data, name):
    lines = data.splitlines(keepends=True)
    if not lines or lines[0].rstrip(b"\r\n") != b"---":
        raise ValueError(f"{name}: missing opening frontmatter delimiter")
    end = next((i for i, line in enumerate(lines[1:], 1) if line.rstrip(b"\r\n") == b"---"), None)
    if end is None:
        raise ValueError(f"{name}: missing closing frontmatter delimiter")
    if data.count(MARKER) != 1:
        raise ValueError(f"{name}: expected exactly one transcript container")
    marker = data.index(MARKER)
    frontmatter = b"".join(lines[:end + 1])
    if marker < len(frontmatter):
        raise ValueError(f"{name}: transcript marker is inside frontmatter")
    return frontmatter, data[marker:]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("articles", nargs="+", help="Existing articles/*.md paths")
    args = parser.parse_args()
    root = Path(subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip()).resolve()
    failures = 0
    for filename in args.articles:
        try:
            path = Path(filename).resolve()
            relative = path.relative_to(root)
            if len(relative.parts) != 2 or relative.parts[0] != "articles" or path.suffix != ".md":
                raise ValueError("only articles/*.md files are eligible")
            baseline = subprocess.run(
                ["git", "show", f"HEAD:{relative.as_posix()}"], cwd=root,
                capture_output=True, check=True,
            ).stdout
            original_frontmatter, original_transcript = protected_parts(baseline, filename + " at HEAD")
            current_frontmatter, current_transcript = protected_parts(path.read_bytes(), filename)
            if original_frontmatter != current_frontmatter:
                raise ValueError("frontmatter changed; restore it before review")
            if original_transcript != current_transcript:
                raise ValueError("transcript or material after it changed; restore it before review")
            print(f"PASS {relative}: frontmatter and transcript unchanged")
        except (ValueError, OSError, subprocess.CalledProcessError) as exc:
            print(f"FAIL {filename}: {exc}", file=sys.stderr)
            failures += 1
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
