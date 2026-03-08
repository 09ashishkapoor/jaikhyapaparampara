import os
import yaml
from datetime import datetime, date

def extract_frontmatter(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    if content.startswith('---'):
        end = content.find('---', 3)
        if end != -1:
            frontmatter = content[3:end].strip()
            try:
                data = yaml.safe_load(frontmatter)
                return data
            except yaml.YAMLError:
                return None
    return None

def main():
    articles_dir = 'articles'
    articles = []

    for filename in os.listdir(articles_dir):
        if filename.endswith('.md'):
            file_path = os.path.join(articles_dir, filename)
            frontmatter = extract_frontmatter(file_path)
            if frontmatter and 'date' in frontmatter and 'title' in frontmatter:
                date_val = frontmatter['date']
                date_obj = date_val
                if isinstance(date_obj, datetime):
                    date_obj = date_obj.date()
                articles.append({
                    'date': date_obj,
                    'title': frontmatter['title'],
                    'filename': filename
                })

    # Sort by date descending
    articles.sort(key=lambda x: x['date'], reverse=True)

    # Write to file
    with open('articles_descending_order.txt', 'w', encoding='utf-8') as f:
        for article in articles:
            f.write(f"{article['date'].strftime('%Y-%m-%d')} - {article['title']}\n")

if __name__ == '__main__':
    main()