#!/usr/bin/env python3
"""
Update the `index.html` file's span with id `last-updated-value` to the current
date/time (human friendly). Designed to be called from the pre-commit hook so
that each commit includes an updated "Last Updated" footer value.

Usage:
  python scripts/update_last_updated.py path/to/index.html
"""
import sys
import datetime
from pathlib import Path


def format_date(dt: datetime.datetime) -> str:
    # Example: December 05, 2025 14:23 UTC
    return dt.strftime('%B %d, %Y %H:%M %Z') if dt.tzinfo else dt.strftime('%B %d, %Y %H:%M')


def update_file(html_path: Path) -> int:
    if not html_path.exists():
        print(f"File not found: {html_path}")
        return 1

    text = html_path.read_text(encoding='utf-8')

    # Compute timestamp in UTC (clear and consistent)
    now = datetime.datetime.utcnow()
    # Use a friendly string and append 'UTC' to indicate timezone
    nice = now.strftime('%B %d, %Y %H:%M') + ' UTC'

    # Replace the inner text of <span id="last-updated-value">...</span>
    import re

    pattern = re.compile(r'(<span[^>]*id\s*=\s*"last-updated-value"[^>]*>)(.*?)(</span>)', re.IGNORECASE | re.DOTALL)

    if not pattern.search(text):
        print('No span with id="last-updated-value" found in file.')
        return 2

    new_text = pattern.sub(r'\1' + nice + r'\3', text, count=1)

    if new_text == text:
        # Nothing changed
        return 0

    html_path.write_text(new_text, encoding='utf-8')
    print(f'Updated {html_path} -> "{nice}"')
    return 0


def main(argv):
    if len(argv) < 2:
        print('Usage: update_last_updated.py path/to/index.html')
        return 1
    path = Path(argv[1])
    return update_file(path)


if __name__ == '__main__':
    raise SystemExit(main(sys.argv))
