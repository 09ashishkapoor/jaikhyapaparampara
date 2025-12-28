#!/usr/bin/env python3
"""
Lint script to detect and optionally fix markdown formatting artifacts.
Detects asterisks around words that look like formatting errors (single words or terms).
"""

import os
import re
import sys
from pathlib import Path

def find_markdown_artifacts(text):
    """
    Find asterisk-wrapped words that look like unintended formatting.
    Returns list of tuples: (line_number, match, replacement)
    """
    artifacts = []
    
    # Pattern: *word* or *phrase* where it's not part of valid markdown
    # Matches: *Yoga*, *Sankhya Yoga*, *Ishto*, etc.
    pattern = r'\*([A-Z][A-Za-z\s]+?)\*'
    
    for line_num, line in enumerate(text.split('\n'), 1):
        # Skip HTML tags and code blocks
        if '<' in line or '```' in line or line.strip().startswith('```'):
            continue
        
        matches = re.finditer(pattern, line)
        for match in matches:
            full_match = match.group(0)  # e.g., "*Yoga*"
            inner_text = match.group(1)  # e.g., "Yoga"
            replacement = inner_text     # Remove asterisks
            artifacts.append((line_num, full_match, replacement, line))
    
    return artifacts

def process_file(filepath, fix=False):
    """
    Analyze a markdown file for artifacts.
    If fix=True, removes the asterisks.
    Returns True if artifacts found, False otherwise.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return False
    
    artifacts = find_markdown_artifacts(content)
    
    if not artifacts:
        return False
    
    # Report artifacts
    print(f"\n📋 {filepath}")
    print(f"   Found {len(artifacts)} artifact(s):")
    
    for line_num, match, replacement, line in artifacts:
        print(f"   Line {line_num}: {match} → {replacement}")
        print(f"      Context: {line.strip()}")
    
    # Fix if requested
    if fix:
        fixed_content = content
        for _, match, replacement, _ in artifacts:
            fixed_content = fixed_content.replace(match, replacement)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print(f"   ✅ Fixed!")
        except Exception as e:
            print(f"   ❌ Error writing file: {e}")
    
    return True

def main():
    # Parse arguments
    fix = '--fix' in sys.argv
    
    blog_dir = Path('articles')
    
    if not blog_dir.exists():
        print(f"Error: {blog_dir} directory not found")
        sys.exit(1)
    
    # Find all markdown files
    md_files = sorted(blog_dir.glob('*.md'))
    
    if not md_files:
        print(f"No markdown files found in {blog_dir}")
        sys.exit(0)
    
    print(f"🔍 Scanning {len(md_files)} markdown file(s) for formatting artifacts...\n")
    
    found_any = False
    for md_file in md_files:
        if process_file(md_file, fix=fix):
            found_any = True
    
    print("\n" + "="*60)
    if not found_any:
        print("✅ No artifacts found! Your markdown is clean.")
    else:
        if fix:
            print("✅ All artifacts have been fixed!")
        else:
            print(f"⚠️  Found artifacts above. Run with --fix flag to auto-fix:")
            print(f"   python lint_markdown_artifacts.py --fix")
    
    sys.exit(0 if not found_any or fix else 1)

if __name__ == '__main__':
    main()
