import os
import re
import collections

articles_dir = 'articles'
data = []

# Regex patterns
title_pattern = re.compile(r'^title:\s*"(.*)"', re.MULTILINE)
vid_pattern = re.compile(r'youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})')

for filename in os.listdir(articles_dir):
    if filename.endswith('.md'):
        filepath = os.path.join(articles_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
            title_match = title_pattern.search(content)
            vid_match = vid_pattern.search(content)
            
            title = title_match.group(1) if title_match else None
            vid = vid_match.group(1) if vid_match else None
            
            # Extract first two speaker blocks for near-duplicate check
            speaker_blocks = re.findall(r'<div class="speaker-block".*?>(.*?)</div>', content, re.DOTALL)
            first_blocks = " ".join([re.sub('<[^<]+?>', '', b).strip()[:100] for b in speaker_blocks[:2]])
            
            data.append({
                'file': filename,
                'title': title,
                'vid': vid,
                'first_blocks': first_blocks,
                'size': len(content)
            })

# Group by YouTube ID
vid_groups = collections.defaultdict(list)
for d in data:
    if d['vid']:
        vid_groups[d['vid']].append(d)

print("--- DUPLICATE YOUTUBE IDS ---")
for vid, files in vid_groups.items():
    if len(files) > 1:
        print(f"Video ID: {vid}")
        for f in files:
            print(f"  - {f['file']} (Title: {f['title']}, Size: {f['size']})")

# Group by Title
title_groups = collections.defaultdict(list)
for d in data:
    if d['title']:
        title_groups[d['title']].append(d)

print("\n--- DUPLICATE TITLES ---")
for title, files in title_groups.items():
    if len(files) > 1:
        print(f"Title: {title}")
        for f in files:
            print(f"  - {f['file']} (VID: {f['vid']}, Size: {f['size']})")

# Group by Content (First two speaker blocks)
content_groups = collections.defaultdict(list)
for d in data:
    if d['first_blocks']:
        # Use a simplified version of first_blocks for grouping
        key = re.sub(r'\W+', '', d['first_blocks']).lower()[:150]
        if len(key) > 50:
            content_groups[key].append(d)

print("\n--- POTENTIAL CONTENT DUPLICATES (Similar start) ---")
for key, files in content_groups.items():
    if len(files) > 1:
        # Filter out if they were already caught by title or VID
        unique_titles = set(f['title'] for f in files)
        unique_vids = set(f['vid'] for f in files)
        if len(unique_titles) > 1 or (len(unique_vids) > 1 and None not in unique_vids):
            print(f"Similar Content Start Match:")
            for f in files:
                 print(f"  - {f['file']} (Title: {f['title']}, VID: {f['vid']})")
