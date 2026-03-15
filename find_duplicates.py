import os
import re

articles_dir = "articles"
files = [f for f in os.listdir(articles_dir) if f.endswith(".md")]

data = []
yt_pattern = re.compile(r'https?://(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})')
date_pattern = re.compile(r'date:\s*(\d{4}-\d{2}-\d{2})')

for filename in files:
    filepath = os.path.join(articles_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        yt_match = yt_pattern.search(content)
        date_match = date_pattern.search(content)
        
        yt_id = yt_match.group(1) if yt_match else "None"
        date = date_match.group(1) if date_match else "None"
        
        data.append({
            "filename": filename,
            "yt_id": yt_id,
            "date": date
        })

# Group by yt_id
groups = {}
for entry in data:
    yt_id = entry["yt_id"]
    if yt_id == "None":
        continue
    if yt_id not in groups:
        groups[yt_id] = []
    groups[yt_id].append(entry)

# Print duplicates
for yt_id, entries in groups.items():
    if len(entries) > 1:
        print(f"YouTube ID: {yt_id}")
        for entry in entries:
            print(f"  - {entry['filename']} (Date: {entry['date']})")
        print("-" * 20)
