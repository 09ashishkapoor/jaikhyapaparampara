#!/usr/bin/env python3
"""Synchronize README article counts with the number of markdown files in articles/."""

from pathlib import Path
import re


def get_article_count() -> int:
    articles_dir = Path("articles")
    if not articles_dir.exists():
        raise FileNotFoundError(f"Articles directory not found: {articles_dir}")
    return len(list(articles_dir.glob("*.md")))


def update_readme(count: int) -> bool:
    readme_path = Path("README.md")
    if not readme_path.exists():
        raise FileNotFoundError(f"README not found: {readme_path}")

    count_with_commas = f"{count:,}"
    original = readme_path.read_text(encoding="utf-8")
    updated = original

    updated = re.sub(
        r"(The site contains \*\*)([\d,]+)(\s+articles\*\*)",
        lambda match: f"{match.group(1)}{count_with_commas}{match.group(3)}",
        updated,
    )

    updated = re.sub(
        r"(articles/\s+#\s*)([\d,]+)(\s+Markdown articles)",
        lambda match: f"{match.group(1)}{count}{match.group(3)}",
        updated,
    )

    if updated == original:
        return False

    readme_path.write_text(updated, encoding="utf-8")
    return True


def main() -> int:
    count = get_article_count()
    changed = update_readme(count)
    if changed:
        print(f"Updated README article count to {count}")
    else:
        print(f"README already at {count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
