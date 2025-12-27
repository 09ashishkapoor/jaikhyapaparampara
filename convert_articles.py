"""
HTML to Markdown Article Converter for 11ty Blog
Converts existing HTML articles to markdown format for 11ty
"""

from bs4 import BeautifulSoup
import os
import re
from datetime import datetime

def extract_meta_content(soup, name):
    """Extract content from meta tags"""
    meta = soup.find('meta', {'name': name}) or soup.find('meta', {'property': name})
    return meta.get('content', '') if meta else ''

def convert_html_to_markdown(html_file_path, output_dir='blog'):
    """Convert a single HTML article to markdown"""
    
    with open(html_file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Extract metadata
    title = soup.find('h1', class_='article-title')
    title_text = title.get_text(strip=True) if title else soup.find('title').get_text().split('|')[0].strip()
    
    description = extract_meta_content(soup, 'description')
    keywords = extract_meta_content(soup, 'keywords')
    
    # Extract category
    category_elem = soup.find('span', class_='article-category')
    category = category_elem.get_text(strip=True) if category_elem else 'Articles'
    
    # Extract author
    author = extract_meta_content(soup, 'author') or 'KaliPutra-Ashish'
    
    # Extract date from meta or use today
    date_str = extract_meta_content(soup, 'article:published_time')
    if date_str:
        date = date_str.split('T')[0]
    else:
        date = datetime.now().strftime('%Y-%m-%d')
    
    # Extract reading time
    reading_time_elem = soup.find(string=re.compile(r'⏱'))
    reading_time = ''
    if reading_time_elem:
        match = re.search(r'(\d+)\s*min', reading_time_elem)
        if match:
            reading_time = match.group(1)
    
    # Extract tags
    tags_section = soup.find('div', class_='article-tags')
    tags = ['articles']
    if tags_section:
        for tag_link in tags_section.find_all('a', class_='tag'):
            tag_text = tag_link.get_text(strip=True)
            if tag_text:
                tags.append(tag_text)
    
    # Extract source info
    source_elem = soup.find('div', class_='article-source')
    source_html = str(source_elem) if source_elem else ''
    if source_html:
        # Clean up the source HTML for YAML
        source_html = source_html.replace('<div class="article-source">', '').replace('</div>', '')
        source_html = source_html.strip()
    
    # Extract main content
    content_div = soup.find('div', class_='article-content')
    if not content_div:
        print(f"Warning: No content found in {html_file_path}")
        return
    
    # Convert HTML content to markdown-friendly format
    content_html = str(content_div)
    
    # Replace headings
    content_html = re.sub(r'<h2[^>]*>(.*?)</h2>', r'## \1', content_html, flags=re.DOTALL)
    content_html = re.sub(r'<h3[^>]*>(.*?)</h3>', r'### \1', content_html, flags=re.DOTALL)
    
    # Replace paragraphs
    content_html = re.sub(r'<p[^>]*>(.*?)</p>', r'\1\n\n', content_html, flags=re.DOTALL)
    
    # Replace lists
    content_html = re.sub(r'<ul[^>]*>', '\n', content_html)
    content_html = re.sub(r'</ul>', '\n', content_html)
    content_html = re.sub(r'<ol[^>]*>', '\n', content_html)
    content_html = re.sub(r'</ol>', '\n', content_html)
    content_html = re.sub(r'<li[^>]*>(.*?)</li>', r'- \1', content_html, flags=re.DOTALL)
    
    # Replace emphasis
    content_html = re.sub(r'<em[^>]*>(.*?)</em>', r'*\1*', content_html, flags=re.DOTALL)
    content_html = re.sub(r'<strong[^>]*>(.*?)</strong>', r'**\1**', content_html, flags=re.DOTALL)
    
    # Keep certain divs with classes intact
    content_html = re.sub(r'<div class="article-content">', '', content_html)
    
    # Remove other simple tags but keep content
    content_html = re.sub(r'</?(span|div)[^>]*>', '', content_html)
    
    # Clean up extra newlines
    content_html = re.sub(r'\n{3,}', '\n\n', content_html)
    content_html = content_html.strip()
    
    # Create front matter
    front_matter = f"""---
layout: article
title: "{title_text}"
description: "{description}"
keywords: "{keywords}"
category: "{category}"
author: "{author}"
date: {date}"""
    
    if reading_time:
        front_matter += f"\nreadingTime: {reading_time}"
    
    front_matter += "\ntags:\n"
    for tag in tags:
        front_matter += f"  - {tag}\n"
    
    if source_html:
        front_matter += f'source: |\n  {source_html}\n'
    
    front_matter += "---\n\n"
    
    # Combine
    markdown_content = front_matter + content_html
    
    # Generate filename
    filename = os.path.basename(html_file_path).replace('.html', '.md')
    output_path = os.path.join(output_dir, filename)
    
    # Write to file
    os.makedirs(output_dir, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    
    print(f"✅ Converted: {html_file_path} -> {output_path}")
    return output_path

def convert_all_articles(articles_dir='articles', output_dir='blog'):
    """Convert all HTML articles in a directory"""
    if not os.path.exists(articles_dir):
        print(f"Error: {articles_dir} directory not found")
        return
    
    html_files = [f for f in os.listdir(articles_dir) if f.endswith('.html') and f != 'index.html']
    
    print(f"Found {len(html_files)} articles to convert\n")
    
    for html_file in html_files:
        html_path = os.path.join(articles_dir, html_file)
        try:
            convert_html_to_markdown(html_path, output_dir)
        except Exception as e:
            print(f"❌ Error converting {html_file}: {str(e)}")
    
    print(f"\n✨ Conversion complete! Check the '{output_dir}' folder.")

if __name__ == '__main__':
    print("=" * 60)
    print("HTML to Markdown Article Converter for 11ty")
    print("=" * 60)
    print()
    
    # Convert all articles
    convert_all_articles()
