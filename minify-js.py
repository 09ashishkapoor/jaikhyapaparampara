#!/usr/bin/env python3
"""
Simple JavaScript minification
"""
import re

with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Remove single-line comments
js = re.sub(r'//.*?$', '', js, flags=re.MULTILINE)

# Remove multi-line comments (careful with URLs)
js = re.sub(r'/\*.*?\*/', '', js, flags=re.DOTALL)

# Remove unnecessary whitespace
js = re.sub(r'\s+', ' ', js)

# Preserve semicolons and braces
js = re.sub(r'\s*([{}();,])\s*', r'\1', js)

# Clean up
js = js.strip()

with open('script.min.js', 'w', encoding='utf-8') as f:
    f.write(js)

print(f"✓ JavaScript minified: {len(js)} bytes")

