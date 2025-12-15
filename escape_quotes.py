#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Escape apostrophes in JavaScript string literals"""

with open('script.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixed_lines = []
for line in lines:
    # Check if this is a translation line (contains ': ' pattern)
    if "': '" in line and not line.strip().startswith('//'):
        # Split by ': ' to separate key from value
        parts = line.split("': '", 1)
        if len(parts) == 2:
            key_part = parts[0] + "': '"
            # Get the value part (everything after ': ')
            value_part = parts[1]
            # Find the closing quote and comma
            if "'," in value_part:
                value_content = value_part.rsplit("',", 1)[0]
                ending = "'," + value_part.rsplit("',", 1)[1]
                # Escape any unescaped apostrophes in the value
                value_content_fixed = value_content.replace("'", "\\'")
                # Reconstruct the line
                line = key_part + value_content_fixed + ending
            elif "'" in value_part:
                # Handle last line without comma
                value_content = value_part.rsplit("'", 1)[0]
                ending = "'" + value_part.rsplit("'", 1)[1]
                # Escape any unescaped apostrophes
                value_content_fixed = value_content.replace("'", "\\'")
                line = key_part + value_content_fixed + ending
    
    fixed_lines.append(line)

with open('script.js', 'w', encoding='utf-8') as f:
    f.writelines(fixed_lines)

print(f"Processed {len(fixed_lines)} lines")

