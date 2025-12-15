#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix all quotes and apostrophes in script.js"""

import re

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# First, replace all Unicode smart quotes with regular ASCII quotes
replacements = [
    ('\u2018', "'"),  # Left single quote
    ('\u2019', "'"),  # Right single quote  
    ('\u201c', '"'),  # Left double quote
    ('\u201d', '"'),  # Right double quote
    ('\u2013', '-'),  # En dash
    ('\u2014', '-'),  # Em dash
]

for old, new in replacements:
    content = content.replace(old, new)

# Now find all strings that contain unescaped apostrophes within single quotes
# This is a regex pattern to find: 'some text with ' apostrophe'
# We need to fix these by escaping the inner apostrophe

def fix_string(match):
    """Fix apostrophes inside a single-quoted string"""
    full_string = match.group(0)
    # Get the content between the outer quotes
    inner = full_string[1:-1]  # Remove first and last quote
    # Escape any unescaped apostrophes
    inner_fixed = inner.replace("'", "\\'")
    # But don't double-escape already escaped ones
    inner_fixed = inner_fixed.replace("\\\\'", "\\'")
    return "'" + inner_fixed + "'"

# Find all single-quoted strings (but be careful with already escaped quotes)
# This pattern matches 'string content' but handles escaped quotes
pattern = r"'(?:[^'\\]|\\.)*'"

content = re.sub(pattern, fix_string, content)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed all quotes in script.js")

