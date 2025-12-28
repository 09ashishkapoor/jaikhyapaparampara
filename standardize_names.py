import os
import re

def standardize_name(text):
    # First, protect existing "Guru Baba Shyama Khyapa"
    text = text.replace("Guru Baba Shyama Khyapa", "PLACEHOLDER_NAME")
    
    # Replace variations
    # 1. "Guru Shyama Khyapa Baba" -> "Guru Baba Shyama Khyapa"
    text = text.replace("Guru Shyama Khyapa Baba", "PLACEHOLDER_NAME")
    
    # 2. "Guru Shyama Khyapa" -> "Guru Baba Shyama Khyapa"
    text = text.replace("Guru Shyama Khyapa", "PLACEHOLDER_NAME")
    
    # 3. "Shri Shyama Khyapa" -> "Guru Baba Shyama Khyapa"
    text = text.replace("Shri Shyama Khyapa", "PLACEHOLDER_NAME")
    
    # 4. "Shyama Khyapa" -> "Guru Baba Shyama Khyapa"
    text = text.replace("Shyama Khyapa", "PLACEHOLDER_NAME")
    
    # Restore
    text = text.replace("PLACEHOLDER_NAME", "Guru Baba Shyama Khyapa")
    
    return text

directories = ['articles', '_includes']
extensions = ['.html', '.md', '.njk']

for root_dir in directories:
    if not os.path.exists(root_dir):
        continue
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = standardize_name(content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {path}")

print("Done!")
