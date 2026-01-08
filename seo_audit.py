import os
import re
import yaml

ARTICLES_DIR = r"d:\websites_inproduction\jaikhyapaparampara\articles"

def analyze_article(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split frontmatter and body
    parts = content.split('---', 2)
    if len(parts) < 3:
        return {"error": "Invalid Frontmatter"}
    
    try:
        frontmatter = yaml.safe_load(parts[1])
    except yaml.YAMLError:
        return {"error": "YAML Error"}
        
    body = parts[2]
    
    report = {
        "title": frontmatter.get("title", ""),
        "description": frontmatter.get("description", ""),
        "keywords": frontmatter.get("keywords", ""),
        "body_len": len(body.split()),
        "issues": []
    }

    # 1. Title Check
    t_len = len(report["title"])
    if t_len < 30:
        report["issues"].append(f"Title too short ({t_len} chars). Aim for 30-60.")
    elif t_len > 70: # Expanded slightly
        report["issues"].append(f"Title too long ({t_len} chars). Aim for under 60.")

    # 2. Description Check
    d_len = len(report["description"])
    if d_len < 100:
        report["issues"].append(f"Description too short ({d_len} chars). Aim for 120-160.")
    elif d_len > 170:
        report["issues"].append(f"Description too long ({d_len} chars). Aim for under 160.")

    # 3. Keywords Check
    if not report["keywords"]:
        report["issues"].append("Missing keywords.")

    # 4. H1 Check in Body (Should NOT exist, as template adds it)
    if re.search(r'^#\s+', body, re.MULTILINE):
        report["issues"].append("Multiple H1s found (body contains # Header). Use ## for subtitles.")

    # 5. Image Alt Text Check
    # Markdown image format: ![alt](src)
    images = re.findall(r'!\[(.*?)\]\((.*?)\)', body)
    for alt, src in images:
        if not alt or len(alt.strip()) == 0:
            report["issues"].append(f"Missing alt text for image: {src}")

    return report

def main():
    print("running SEO Audit...\n")
    print(f"{'File':<50} | {'Status':<10} | {'Issues'}")
    print("-" * 100)

    for filename in os.listdir(ARTICLES_DIR):
        if filename.endswith(".md"):
            filepath = os.path.join(ARTICLES_DIR, filename)
            result = analyze_article(filepath)
            
            if "error" in result:
                print(f"{filename[:48]:<50} | ERROR | {result['error']}")
                continue

            status = "FAIL" if result["issues"] else "PASS"
            issues_str = ", ".join(result["issues"]) if result["issues"] else ""
            
            # Print row
            print(f"{filename[:48]:<50} | {status:<6} | {issues_str}")

if __name__ == "__main__":
    main()
