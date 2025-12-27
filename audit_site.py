import os
import re
import yaml
from bs4 import BeautifulSoup
from pathlib import Path

def audit_site():
    base_dir = Path(r"d:\websites_inproduction\jaikhyapaparampara")
    articles_dir = base_dir / "articles"
    site_blog_dir = base_dir / "_site" / "blog"
    blog_src_dir = base_dir / "blog"
    images_dir = base_dir / "images"
    
    html_files = list(articles_dir.glob("*.html"))
    for d in site_blog_dir.iterdir():
        if d.is_dir():
            index_file = d / "index.html"
            if index_file.exists():
                html_files.append(index_file)
    
    # Add root index.html
    root_index = base_dir / "index.html"
    if root_index.exists():
        html_files.append(root_index)

    report = []
    
    # 1, 2, 4, 5: SEO, Content, Links, Consistency
    for html_path in html_files:
        file_report = {"file": str(html_path.relative_to(base_dir)), "issues": []}
        
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
            soup = BeautifulSoup(content, 'html.parser')
            
            # SEO: Title
            title_tag = soup.find('title')
            if title_tag:
                title_text = title_tag.get_text()
                if len(title_text) > 60:
                    file_report["issues"].append(f"SEO: Title too long ({len(title_text)} chars): '{title_text}'")
            else:
                file_report["issues"].append("SEO: Missing <title> tag")
                
            # SEO: Description
            desc_tag = soup.find('meta', attrs={'name': 'description'})
            if desc_tag:
                desc_content = desc_tag.get('content', '')
                if not (120 <= len(desc_content) <= 160):
                    file_report["issues"].append(f"SEO: Description length {len(desc_content)} (expected 120-160)")
            else:
                file_report["issues"].append("SEO: Missing <meta name='description'>")
                
            # SEO: Alt tags
            imgs = soup.find_all('img')
            for img in imgs:
                if not img.get('alt'):
                    file_report["issues"].append(f"SEO: Missing alt tag for image: {img.get('src')}")
                    
            # SEO: JSON-LD
            json_ld = soup.find('script', type='application/ld+json')
            if not json_ld:
                file_report["issues"].append("SEO: Missing JSON-LD Schema")
                
            # Content: Markdown artifacts
            # We check the text content of the body, excluding scripts and styles
            body = soup.find('body')
            if body:
                # Remove scripts and styles
                for script_or_style in body(["script", "style"]):
                    script_or_style.decompose()
                
                body_text = body.get_text()
                artifacts = []
                if re.search(r'##\s', body_text): artifacts.append("##")
                if re.search(r'\*\*[^*]+\*\*', body_text): artifacts.append("**")
                if re.search(r'__[^_]+__', body_text): artifacts.append("__")
                # Simple check for markdown links [text](url)
                if re.search(r'\[[^\]]+\]\([^)]+\)', body_text): artifacts.append("[text](url)")
                
                if artifacts:
                    file_report["issues"].append(f"Content: Markdown artifacts found: {', '.join(artifacts)}")
            
            # Consistency: h1 vs front matter
            h1_tag = soup.find('h1')
            h1_text = h1_tag.get_text().strip() if h1_tag else None
            
            # Try to find source md
            md_file = None
            if html_path.parent.name == "articles":
                md_file = blog_src_dir / (html_path.stem + ".md")
            elif html_path.parent.parent.name == "blog":
                md_file = blog_src_dir / (html_path.parent.name + ".md")
                
            if md_file and md_file.exists():
                with open(md_file, 'r', encoding='utf-8') as mf:
                    md_content = mf.read()
                    # Extract front matter
                    fm_match = re.match(r'^---\s*\n(.*?)\n---\s*\n', md_content, re.DOTALL)
                    if fm_match:
                        try:
                            fm = yaml.safe_load(fm_match.group(1))
                            fm_title = fm.get('title', '').strip()
                            if h1_text and fm_title and h1_text != fm_title:
                                # Sometimes titles have quotes or extra spaces
                                if h1_text.replace('"', '').replace("'", "") != fm_title.replace('"', '').replace("'", ""):
                                    file_report["issues"].append(f"Consistency: <h1> ('{h1_text}') does not match front matter title ('{fm_title}')")
                        except Exception as e:
                            file_report["issues"].append(f"Error parsing front matter in {md_file.name}: {e}")
            elif html_path.name != "index.html": # Skip root index and articles index for now
                 pass # Could not find source md
            
            # Links: Internal links
            links = soup.find_all('a', href=True)
            for link in links:
                href = link['href']
                if href.startswith(('http', 'mailto:', 'tel:', '#')):
                    continue
                
                # Resolve relative path
                if href.startswith('/'):
                    link_path = (base_dir / href.lstrip('/')).resolve()
                else:
                    link_path = (html_path.parent / href).resolve()
                # Check if it exists
                if not link_path.exists():
                    # Try with index.html if it's a directory
                    if (link_path / "index.html").exists():
                        continue
                    file_report["issues"].append(f"Links: Broken internal link: {href} (resolved to {link_path})")

        if file_report["issues"]:
            report.append(file_report)

    # 3: Performance: Image sizes
    image_report = []
    for img_path in images_dir.rglob("*"):
        if img_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
            size_kb = img_path.stat().st_size / 1024
            if size_kb > 300: # 300KB threshold
                image_report.append(f"Performance: Large image: {img_path.relative_to(base_dir)} ({size_kb:.2f} KB)")

    # Output Report
    print("--- WEBSITE AUDIT REPORT ---")
    print(f"Total HTML files checked: {len(html_files)}")
    print("\n--- Issues by File ---")
    for r in report:
        print(f"\nFile: {r['file']}")
        for issue in r['issues']:
            print(f"  - {issue}")
            
    print("\n--- Performance Issues (Images > 300KB) ---")
    if image_report:
        for img_issue in image_report:
            print(f"  - {img_issue}")
    else:
        print("  No large images found.")

if __name__ == "__main__":
    audit_site()
