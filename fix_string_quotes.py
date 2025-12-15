#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix string quotes in script.js - use double quotes for strings with apostrophes"""

with open('script.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixed_lines = []
for line in lines:
    # Check if this is a translation line
    if "': '" in line and not line.strip().startswith('//'):
        # Split to get the value part
        parts = line.split("': '", 1)
        if len(parts) == 2:
            # Check if the value contains an apostrophe or backslash-escaped quote
            value_part = parts[1]
            if "\\'" in value_part or "'" in value_part.split("',")[0] if "'," in value_part else False:
                # Convert to double quotes
                # First, remove the escaped apostrophes
                value_part = value_part.replace("\\'", "'")
                # Now convert the string delimiters from single to double quotes
                if "'," in value_part:
                    value_content = value_part.split("',", 1)[0]
                    rest = value_part.split("',", 1)[1]
                    line = parts[0] + '": "' + value_content + '",' + rest
                elif value_part.rstrip().endswith("'"):
                    value_content = value_part.rstrip()[:-1]
                    line = parts[0] + '": "' + value_content + '"\n'
    
    fixed_lines.append(line)

with open('script.js', 'w', encoding='utf-8') as f:
    f.writelines(fixed_lines)

print(f"Fixed {len(fixed_lines)} lines")

