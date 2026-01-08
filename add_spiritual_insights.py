import os
import re

ARTICLES_DIR = r"d:\websites_inproduction\jaikhyapaparampara\articles"

HTML_TEMPLATE = """
<div class="conclusion-section" style="background:rgba(255,215,0,0.05);padding:2rem;border-radius:8px;border:1px dashed var(--border-gold);margin-top:3rem;">
<h3 style="color:var(--accent-bright);margin-top:0;">Spiritual Insight</h3>
<p>{}</p>
</div>
"""

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already exists
    if 'class="conclusion-section"' in content:
        return False

    # Extract description
    desc_match = re.search(r'description:\s*"(.*?)"', content)
    if not desc_match:
        print(f"Skipping {os.path.basename(filepath)} - No description found")
        return False
        
    description = desc_match.group(1)
    
    # Enhance description for the insight box
    # If it starts with "Guru Shyama Khyapa...", it's already good.
    # We can just use it directly as the insight.
    
    insight_html = HTML_TEMPLATE.format(description)
    
    # Append to end of file, ensuring newline
    if not content.endswith('\n'):
        content += '\n'
    
    content += insight_html
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    return True

def main():
    print("🚀 Adding Spiritual Insights...")
    count = 0
    for filename in os.listdir(ARTICLES_DIR):
        if filename.endswith(".md"):
            filepath = os.path.join(ARTICLES_DIR, filename)
            if update_file(filepath):
                print(f"✅ Added insight to: {filename}")
                count += 1
    
    print(f"\n✨ Completed. Added insights to {count} articles.")

if __name__ == "__main__":
    main()
