#!/usr/bin/env python3
"""
Convert .md.docx files (Word documents) to .md markdown files.

Reads all *.md.docx files from a source folder, extracts text content,
and writes plain .md files. Preserves paragraph structure.

Usage:
  python convert_docx_to_markdown.py [source_folder] [output_folder]

  If no arguments: converts drive-download-20260309T190150Z-3-001/ → markdownfiles_forblog/tobeprocessed/
  If one argument: converts that folder → markdownfiles_forblog/tobeprocessed/
  If two arguments: converts source → output
"""

import sys
from pathlib import Path

try:
    from docx import Document
except ImportError:
    print("ERROR: python-docx is not installed.")
    print("Install it with: pip install python-docx")
    sys.exit(1)

# Default paths
WORKSPACE = Path(__file__).resolve().parent
DEFAULT_SOURCE = WORKSPACE / "drive-download-20260309T190150Z-3-001"
DEFAULT_OUTPUT = WORKSPACE / "markdownfiles_forblog" / "tobeprocessed"


def convert_docx_to_md(docx_path: Path, md_path: Path) -> bool:
    """Extract text from a Word document and save as markdown."""
    try:
        doc = Document(docx_path)
        lines = []
        for para in doc.paragraphs:
            text = para.text.strip()
            if text:
                lines.append(text)
        content = "\n\n".join(lines)

        # Ensure output directory exists
        md_path.parent.mkdir(parents=True, exist_ok=True)
        md_path.write_text(content, encoding="utf-8")
        return True
    except Exception as e:
        print(f"  [ERROR] {e}")
        return False


def main():
    if len(sys.argv) >= 3:
        source_dir = Path(sys.argv[1])
        output_dir = Path(sys.argv[2])
    elif len(sys.argv) == 2:
        source_dir = Path(sys.argv[1])
        output_dir = DEFAULT_OUTPUT
    else:
        source_dir = DEFAULT_SOURCE
        output_dir = DEFAULT_OUTPUT

    if not source_dir.exists():
        print(f"Error: Source folder not found: {source_dir}")
        sys.exit(1)

    files = list(source_dir.glob("*.md.docx"))
    if not files:
        print(f"No .md.docx files found in {source_dir}")
        sys.exit(0)

    print(f"Converting {len(files)} files from {source_dir}")
    print(f"Output: {output_dir}\n")

    success = 0
    for docx_path in sorted(files):
        # transcript_XXX.md.docx → transcript_XXX.md
        md_name = docx_path.stem.replace(".md", "") + ".md"
        md_path = output_dir / md_name

        print(f"  {docx_path.name} -> {md_path.name}")
        if convert_docx_to_md(docx_path, md_path):
            success += 1

    print(f"\nDone. Converted {success}/{len(files)} files.")


if __name__ == "__main__":
    main()
