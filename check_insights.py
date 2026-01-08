import os
import re
import yaml

ARTICLES_DIR = r"d:\websites_inproduction\jaikhyapaparampara\articles"

def get_file_info(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    has_insight = 'class="conclusion-section"' in content
    
    # Extract description from frontmatter
    desc_match = re.search(r'description:\s*"(.*?)"', content)
    description = desc_match.group(1) if desc_match else "No description found."
    
    return has_insight, description

print("Analyzing articles for missing insights...")
missing_count = 0
for filename in os.listdir(ARTICLES_DIR):
    if filename.endswith(".md"):
        filepath = os.path.join(ARTICLES_DIR, filename)
        has_insight, description = get_file_info(filepath)
        
        if not has_insight:
            print(f"[MISSING] {filename}")
            print(f"  Desc: {description[:100]}...")
            missing_count += 1
        else:
            # print(f"[OK] {filename}")
            pass

print(f"\nTotal missing insights: {missing_count}")
