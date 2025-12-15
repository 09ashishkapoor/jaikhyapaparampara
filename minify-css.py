#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Minify CSS file
"""
import re
import sys

# Ensure UTF-8 output for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Remove comments
css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)

# Remove whitespace around selectors and properties
css = re.sub(r'\s+', ' ', css)
css = re.sub(r'\s*([{}:;,])\s*', r'\1', css)

# Clean up
css = css.strip()

with open('styles.min.css', 'w', encoding='utf-8') as f:
    f.write(css)

print(f"CSS minified: {len(css)} bytes")

