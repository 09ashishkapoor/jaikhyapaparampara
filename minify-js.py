#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Simple JavaScript minification."""
import re

from minify_common import run_minifier


def minify_js(js: str) -> str:
    js = re.sub(r'//.*?$', '', js, flags=re.MULTILINE)
    js = re.sub(r'/\*.*?\*/', '', js, flags=re.DOTALL)
    js = re.sub(r'\s+', ' ', js)
    js = re.sub(r'\s*([{}();,])\s*', r'\1', js)
    return js.strip()


if __name__ == "__main__":
    run_minifier("script.js", "script.min.js", "JavaScript", minify_js)
