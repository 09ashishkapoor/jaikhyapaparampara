import re
import os
from pathlib import Path

def convert_speaker_to_html(content):
    """Convert markdown speaker format to HTML speaker-block format"""
    
    # Pattern to match **Speaker:** followed by text
    pattern = r'\*\*(Gurudev|Gurudeb|Devotee|Disciple|Host):\*\*\s*(.+?)(?=\n\*\*(?:Gurudev|Gurudeb|Devotee|Disciple|Host):\*\*|\n\n|\Z)'
    
    def replace_speaker(match):
        speaker = match.group(1)
        # Normalize speaker name
        if speaker == "Gurudeb":
            speaker = "Gurudev"
        text = match.group(2).strip()
        
        return f'''<div class="speaker-block">
<span class="speaker-name">{speaker}:</span>
<span class="speech-text">{text}</span>
</div>
'''
    
    # Replace all speaker patterns
    converted = re.sub(pattern, replace_speaker, content, flags=re.DOTALL)
    
    return converted

def process_blog_file(filepath):
    """Process a single blog markdown file"""
    print(f"Processing: {filepath.name}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already has speaker-block divs (already converted)
    if 'class="speaker-block"' in content:
        print(f"  ✓ Already converted, skipping")
        return False
    
    # Check if has markdown speaker format
    if not re.search(r'\*\*(Gurudev|Devotee|Disciple):\*\*', content):
        print(f"  - No conversation format found, skipping")
        return False
    
    # Convert the format
    converted_content = convert_speaker_to_html(content)
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(converted_content)
    
    print(f"  ✓ Converted successfully")
    return True

def main():
    blog_dir = Path('blog')
    
    if not blog_dir.exists():
        print("Error: blog directory not found")
        return
    
    # Get all markdown files
    md_files = list(blog_dir.glob('*.md'))
    
    print(f"Found {len(md_files)} markdown files in blog directory\n")
    
    converted_count = 0
    for filepath in md_files:
        if process_blog_file(filepath):
            converted_count += 1
    
    print(f"\n✓ Conversion complete! Converted {converted_count} files.")

if __name__ == '__main__':
    main()
