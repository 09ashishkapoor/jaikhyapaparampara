import os
import re

# Directory containing the articles
ARTICLES_DIR = r"d:\websites_inproduction\jaikhyapaparampara\articles"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    in_frontmatter = False
    fm_count = 0
    modified = False

    for line in lines:
        stripped = line.strip()
        
        # Track frontmatter boundaries
        if stripped == '---':
            fm_count += 1
            if fm_count == 1:
                in_frontmatter = True
            elif fm_count == 2:
                in_frontmatter = False
        
        if in_frontmatter:
            # Check for our specific broken tags at start of line
            if line.startswith("- Gupta Sadhak Shyamakhyapa") or line.startswith("- Smashana Bhairava"):
                # Add 2 spaces indentation
                new_lines.append("  " + line)
                modified = True
                continue
            
            # Also fix cases where there might be only 1 space (if that happened) or weird spacing
            # But primarily we saw 0 spaces.
            
            # Optional: remove blank lines inside tags block if they are causing issues, 
            # though YAML allows them. The main issue was indentation.
        
        new_lines.append(line)

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"🔧 Fixed indentation in: {os.path.basename(filepath)}")
        return True
    return False

def main():
    print("🚀 Starting YAML Indentation Fix...")
    count = 0
    for filename in os.listdir(ARTICLES_DIR):
        if filename.endswith(".md"):
            filepath = os.path.join(ARTICLES_DIR, filename)
            if fix_file(filepath):
                count += 1
    
    print(f"\n✨ Indentation Fix Complete. Fixed {count} files.")

if __name__ == "__main__":
    main()
