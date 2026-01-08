import os
import re

# Directory containing the articles
ARTICLES_DIR = r"d:\websites_inproduction\jaikhyapaparampara\articles"

# SEO Constraints
NEW_AUTHOR_NAME = "🗣️ Gupta Sadhak Shyama Khyapa"
OLD_AUTHOR_NAME = "🗣️ Guru Baba Shyama Khyapa"

# Keywords to inject if missing
SEO_KEYWORDS = [
    "Gupta Sadhak Shyamakhyapa",
    "Shyama Khyapa",
    "Smashana Bhairava",
    "Gupta Sadhak",
    "GuruDeva Shyama Khyapa"
]

# Tags to ensure exist
SEO_TAGS = [
    "Gupta Sadhak Shyamakhyapa",
    "Smashana Bhairava"
]

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # 1. Update Author Field
    # Look for author: "🗣️ Guru Baba Shyama Khyapa" or similar
    # We use regex to be flexible with quotes
    content = re.sub(r'author:\s*["\']?🗣️ Guru Baba Shyama Khyapa["\']?', f'author: "{NEW_AUTHOR_NAME}"', content)
    
    # 2. Update Keywords
    # Find the keywords line
    keywords_match = re.search(r'keywords:\s*"(.*?)"', content)
    if keywords_match:
        current_keywords = keywords_match.group(1)
        # Create list, strip whitespace
        k_list = [k.strip() for k in current_keywords.split(',')]
        
        # Add new keywords if not present
        added_count = 0
        for sk in SEO_KEYWORDS:
            # Check case-insensitive
            if not any(sk.lower() == k.lower() for k in k_list):
                k_list.insert(0, sk) # Insert at front for weight
                added_count += 1
        
        if added_count > 0:
            new_keywords_str = ", ".join(k_list)
            content = content.replace(f'keywords: "{current_keywords}"', f'keywords: "{new_keywords_str}"')

    # 3. Update Tags
    # This is trickier as tags are YAML lists.
    # We'll do a simple text check for the tag block and append if missing.
    # A more robust way would be YAML parsing, but regex is safer for preserving arbitrary formatting comments.
    
    # Find the tags block
    tags_match = re.search(r'(tags:\s*\n(?:\s*-\s*.*\n)+)', content)
    if tags_match:
        tags_block = tags_match.group(1)
        new_tags_block = tags_block
        
        for tag in SEO_TAGS:
            if tag not in tags_block:
                # Add with same indentation as last tag
                # Find indentation of last tag
                last_tag_match = re.findall(r'(\s*)-\s*', tags_block)
                if last_tag_match:
                    indent = last_tag_match[-1]
                    new_tags_block += f"{indent}- {tag}\n"
        
        if new_tags_block != tags_block:
            content = content.replace(tags_block, new_tags_block)

    # 4. Update Description (Optional but recommended)
    # If "Guru Baba Shyama Khyapa" is in description, we might want to ensure "Gupta Sadhak" is near it?
    # For now, let's just stick to metadata to avoid changing the "voice" of the description too much.

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Updated SEO for: {os.path.basename(filepath)}")
        return True
    else:
        print(f"⚪ No changes needed: {os.path.basename(filepath)}")
        return False

def main():
    print("🚀 Starting SEO Optimization for Guru Shyama Khyapa articles...")
    count = 0
    for filename in os.listdir(ARTICLES_DIR):
        if filename.endswith(".md"):
            filepath = os.path.join(ARTICLES_DIR, filename)
            if update_file(filepath):
                count += 1
    
    print(f"\n✨ SEO Update Complete. Optimized {count} articles.")

if __name__ == "__main__":
    main()
