# 11ty Blog Migration Guide

## Setup Complete! ✅

Your blog is now running on 11ty while maintaining the exact same styling as your HTML articles.

## What Was Done:

1. **Installed 11ty** - Added as a dev dependency with build scripts
2. **Created Layout Templates** - `article.njk` and `base.njk` with identical HTML structure and CSS
3. **Set Up Blog Folder** - `/blog/` directory for all blog content
4. **Converted Sample Article** - One article converted to markdown format
5. **Configured 11ty** - `.eleventy.js` with proper paths and collections

## File Structure:

```
jaikhyapaparampara/
├── blog/                              # New blog content folder
│   ├── index.njk                      # Blog listing page
│   └── living-bhairava-....md         # Sample converted article
├── _includes/                         # 11ty templates
│   ├── article.njk                    # Article layout (exact HTML match)
│   └── base.njk                       # Base layout for blog index
├── _site/                             # Generated output (gitignored)
├── articles/                          # Original HTML articles (keep as reference)
├── .eleventy.js                       # 11ty configuration
├── package.json                       # Dependencies
└── .eleventyignore                    # Files to exclude from build
```

## Live Preview:

- **Local Server**: http://localhost:8080/
- **Blog Index**: http://localhost:8080/blog/
- **Sample Article**: http://localhost:8080/blog/living-bhairava-bama-khepa-guru-parampara/

## How to Add New Articles:

Create a new `.md` file in the `/blog/` folder with this front matter:

```markdown
---
layout: article
title: "Your Article Title"
description: "Article description for SEO"
keywords: "keyword1, keyword2, keyword3"
category: "Guru Stories"
author: "KaliPutra-Ashish"
date: 2025-12-27
readingTime: 10
featuredImage: "image.webp"
tags:
  - articles
  - tag1
  - tag2
---

## Your Content Here

Write in markdown...
```

## Converting Existing HTML Articles:

I've created one sample. You can either:

1. **Manually convert** - Copy content from HTML, paste into markdown
2. **Use the existing HTML** - 11ty can process HTML files too
3. **Hybrid approach** - Keep some as HTML in `/blog/` folder

## Commands:

```bash
npm run build     # Build the static site to _site/
npm run serve     # Start dev server with live reload
npm start         # Same as serve
```

## Deployment:

The generated files in `_site/` folder are your production-ready blog. You can:

1. Copy `_site/blog/` folder to your main website
2. Deploy entire `_site/` folder
3. Keep main HTML pages and blog together

## Styling:

✅ Colors match exactly
✅ Buttons look the same
✅ Layout is identical
✅ All CSS variables preserved
✅ Mobile responsive works

The blog articles will look **exactly** like your existing HTML articles because the templates use the same HTML structure and inline CSS.

## Next Steps:

1. ✅ Test the sample article at http://localhost:8080/blog/living-bhairava-bama-khepa-guru-parampara/
2. Convert remaining articles from `/articles/` folder to markdown in `/blog/`
3. Update main index.html to link to `/blog/` instead of `/articles/`
4. Keep adding new articles as markdown files

---

**Jai Khyapa Parampara** 🙏
