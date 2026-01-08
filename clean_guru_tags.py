import os
import re

ARTICLES_DIR = r"d:\websites_inproduction\jaikhyapaparampara\articles"

# Articles that should NOT carry the Shyama Khyapa tags
# These are general spiritual texts or topics not authored by or directly about him
EXCLUDE_FILES = [
    "kalabhairava-ashtakam-lyrics-meaning-english.md",
    "kanda-sasti-kavacam-lyrics-meaning.md",
    "shri-kali-tandava-stotram-lyrics-meaning-commentary.md"
]

TAGS_TO_REMOVE = [
    "  - Gupta Sadhak Shyamakhyapa",
    "- Gupta Sadhak Shyamakhyapa",
    "  - Smashana Bhairava",
    "- Smashana Bhairava",
    "Gupta Sadhak Shyamakhyapa", # Raw text search backup
    "Smashana Bhairava"
]

KEYWORDS_TO_REMOVE = [
    "GuruDeva Shyama Khyapa, ",
    "Gupta Sadhak, ",
    "Smashana Bhairava, ",
    "Shyama Khyapa, ",
    "Gupta Sadhak Shyamakhyapa, ",
    "Guru Baba Shyama Khyapa, "
]

def clean_file(filepath):
    filename = os.path.basename(filepath)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    modified = False
    
    # Check if this is a file we want to clean
    if filename not in EXCLUDE_FILES:
        return False
        
    print(f"Cleaning tags for: {filename}")

    for line in lines:
        stripped = line.strip()
        
        # 1. Remove specific tags lines
        # Check against simple strings to remove lines completely
        if stripped in ["- Gupta Sadhak Shyamakhyapa", "Gupta Sadhak Shyamakhyapa", "- Smashana Bhairava", "Smashana Bhairava"]:
            modified = True
            continue 
            
        # 2. Clean up Keywords line
        if line.lstrip().startswith("keywords:"):
            # This is a bit brute force but effective for the specific injection we did
            original_line = line
            for kw in KEYWORDS_TO_REMOVE:
                line = line.replace(kw, "")
            
            if line != original_line:
                modified = True
        
        new_lines.append(line)

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        return True
    return False

def main():
    print("🚀 Cleaning tags from non-Guru articles...")
    count = 0
    for filename in EXCLUDE_FILES:
        filepath = os.path.join(ARTICLES_DIR, filename)
        if os.path.exists(filepath):
            if clean_file(filepath):
                print(f"✅ Cleaned: {filename}")
                count += 1
        else:
            print(f"⚠️ File not found: {filename}")
    
    print(f"\n✨ Cleanup Complete. Cleaned {count} files.")

if __name__ == "__main__":
    main()
