#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix smart quotes in script.js"""

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all Unicode smart quotes with regular ASCII quotes
content = content.replace('\u2018', "'")  # Left single quote
content = content.replace('\u2019', "'")  # Right single quote  
content = content.replace('\u201c', '"')  # Left double quote
content = content.replace('\u201d', '"')  # Right double quote

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed smart quotes in script.js")
