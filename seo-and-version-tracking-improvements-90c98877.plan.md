---
name: SEO and Version Tracking Improvements
overview: Improve SEO for Google ranking, add automatic version tracking (date-based) and last commit date in footer, shorten page title, and update sitemap.xml automatically with each commit.
todos:
  - id: seo-meta-tags
    content: Enhance SEO meta tags in index.html (keywords, descriptions, structured data)
    status: completed
  - id: shorten-title
    content: Shorten page title and update Open Graph/Twitter meta titles
    status: completed
  - id: create-github-workflow
    content: Create GitHub Actions workflow for automatic version and sitemap updates
    status: completed
  - id: update-footer-html
    content: Add version and last updated placeholders in footer HTML structure
    status: completed
  - id: add-version-js
    content: Add JavaScript to load and display version.json in footer
    status: completed
    dependencies:
      - update-footer-html
  - id: update-gitignore
    content: Add version.json to .gitignore (it will be auto-generated)
    status: completed
  - id: test-workflow
    content: Test GitHub Actions workflow and verify version updates work correctly
    status: pending
    dependencies:
      - create-github-workflow
      - add-version-js
---

# SEO and Version Tracking Improvements

## Overview

This plan implements comprehensive SEO improvements, automatic version tracking with date-based versioning (V1.1.YYYYMMDD), last commit date display in footer, shortened page title, and automatic sitemap.xml updates via GitHub Actions.

## Implementation Details

### 1. SEO Enhancements

**Files to modify:** `jaikhyapaparampara/index.html`

- Add more comprehensive meta tags (keywords expansion, author info)
- Enhance structured data (JSON-LD) with more detailed book information
- Add article/blog schema for better content indexing
- Improve alt text for images
- Add hreflang tags if multilingual content exists
- Add breadcrumb structured data
- Optimize meta descriptions with target keywords
- Add more semantic HTML5 elements

### 2. Automatic Version Tracking System

**Files to create:**

- `.github/workflows/version-update.yml` - GitHub Actions workflow
- `version.json` - Version data file (generated automatically)

**Files to modify:**

- `jaikhyapaparampara/index.html` - Add version display in footer
- `jaikhyapaparampara/script.js` - Add JavaScript to load and display version info
- `jaikhyapaparampara/sitemap.xml` - Will be auto-updated by workflow

**Implementation approach:**

- GitHub Actions workflow runs on every push to main branch
- Extracts git commit date and calculates version number (V1.1.YYYYMMDD format)
- Generates `version.json` with version and last commit date
- Updates `sitemap.xml` lastmod date automatically
- Commits and pushes changes back to repository
- HTML footer loads version.json via JavaScript and displays both version and last commit date

### 3. Shorten Page Title

**File to modify:** `jaikhyapaparampara/index.html` (line 41)

- Current: "Jai Khyapa Parampara | Digital Temple for Sacred Texts | Free eBooks"
- New: "Jai Khyapa Parampara | Free Spiritual eBooks"
- Also update Open Graph and Twitter meta titles for consistency

### 4. Footer Updates

**File to modify:** `jaikhyapaparampara/index.html` (footer section, lines 314-322)

- Add version number display: "Version V1.1.YYYYMMDD"
- Add last commit date display: "Last Updated: [Date]"
- Both will be populated dynamically via JavaScript from version.json

### 5. Sitemap Auto-Update

**File to modify:** `.github/workflows/version-update.yml`

- Workflow automatically updates `sitemap.xml` lastmod date to current date on each commit
- Ensures Google always sees fresh content dates

## Technical Approach

### Version Numbering Logic

- Format: V1.1.YYYYMMDD (e.g., V1.1.20250115)
- Base version: V1.1 (current)
- Date component: Extracted from git commit date (YYYYMMDD format)
- Increments automatically with each commit

### GitHub Actions Workflow

- Trigger: On push to main branch
- Steps:

1. Checkout repository
2. Get git commit date (last commit)
3. Format as YYYYMMDD
4. Generate version.json with version and date
5. Update sitemap.xml lastmod date
6. Commit and push changes (if changed)
7. Uses GitHub token for authentication

### JavaScript Implementation

- Fetch version.json on page load
- Parse version and date
- Inject into footer elements
- Fallback display if version.json fails to load

## Files Summary

**New files:**

- `.github/workflows/version-update.yml`
- `version.json` (auto-generated, should be in .gitignore)

**Modified files:**

- `jaikhyapaparampara/index.html` (SEO, title, footer structure)
- `jaikhyapaparampara/script.js` (version loading logic)
- `jaikhyapaparampara/sitemap.xml` (will be auto-updated)
- `jaikhyapaparampara/.gitignore` (add version.json)

## SEO Improvements Checklist

- [x] Enhanced meta descriptions with target keywords
- [x] Expanded keyword meta tags
- [x] Improved structured data (JSON-LD) with more book details
- [x] Added breadcrumb navigation schema
- [x] Optimized image alt text
- [ ] Added article schema for ebook content
- [ ] Improved semantic HTML structure
- [ ] Added more internal linking opportunities
- [x] Enhanced Open Graph tags
- [x] Improved Twitter Card metadata

## Notes

- Version.json will be generated automatically on each commit
- The workflow requires write permissions to the repository
- Version display will show "Loading..." briefly until version.json loads
- Sitemap.xml will be updated automatically, ensuring Google sees fresh dates
- All changes are backward compatible and won't break existing functionality