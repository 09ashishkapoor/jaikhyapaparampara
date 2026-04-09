#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Minify CSS file."""
import re

from minify_common import run_minifier


def minify_css(css: str) -> str:
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r'\s*([{}:;,])\s*', r'\1', css)
    return css.strip()


if __name__ == "__main__":
    run_minifier("styles.css", "styles.min.css", "CSS", minify_css)
