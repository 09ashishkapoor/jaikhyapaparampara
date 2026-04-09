#!/usr/bin/env python3
"""Shared helpers for simple asset minification scripts."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Callable


Minifier = Callable[[str], str]


def configure_stdout() -> None:
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8")


def run_minifier(source_name: str, output_name: str, label: str, minify: Minifier) -> None:
    configure_stdout()

    source = Path(source_name)
    output = Path(output_name)
    minified_content = minify(source.read_text(encoding="utf-8"))
    output.write_text(minified_content, encoding="utf-8")

    print(f"{label} minified: {len(minified_content)} bytes")
