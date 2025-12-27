import os

directory = r'd:\websites_inproduction\jaikhyapaparampara\articles'
target_string = 'href="./?category='
replacement_string = 'href="index.html?category='

updated_files = []

print(f"Scanning directory: {directory}")

for filename in os.listdir(directory):
    if filename.endswith(".html") and filename != "index.html":
        filepath = os.path.join(directory, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if target_string in content:
                new_content = content.replace(target_string, replacement_string)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                updated_files.append(filename)
                print(f"Updated: {filename}")
        except Exception as e:
            print(f"Error processing {filename}: {e}")

if not updated_files:
    print("No files needed updating.")
else:
    print(f"\nTotal files updated: {len(updated_files)}")
