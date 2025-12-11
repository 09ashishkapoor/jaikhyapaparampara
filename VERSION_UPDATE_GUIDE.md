# Automated Version Update Guide

## ✅ Fully Automated with GitHub Actions

Your website now has **fully automated version tracking** using GitHub Actions. Every time you push to the `main` branch, the version and date are updated automatically.

## How It Works

**You don't need to do anything!** Just commit and push your changes normally:

```bash
git add .
git commit -m "your commit message"
git push
```

GitHub Actions will automatically:
1. Count the total commits to generate version (1.309, 1.310, etc.)
2. Use the commit timestamp for "Last Updated"
3. Update the meta tags in `index.html`
4. Update `sitemap.xml`
5. Commit and push the changes back

## What Gets Updated Automatically

In your `index.html`, these meta tags are auto-updated:

```html
<meta name="build-version" content="1.310">
<meta name="build-date" content="2025-12-10T15:30:00Z">
```

The footer displays:
- **Version:** V1.310 (based on commit count)
- **Last Updated:** December 10, 2025, 3:30 PM UTC (from commit date)

## Version Numbering

- Format: `1.[commit_count]`
- Example: If you have 310 commits, version will be `1.310`
- Automatically increments with each commit

## Manual Override (Optional)

If you ever need to manually set a specific version:

1. Edit the meta tags in `index.html`:
   ```html
   <meta name="build-version" content="2.0">
   <meta name="build-date" content="2025-12-10T12:00:00Z">
   ```

2. The next automated run will overwrite it back to auto-versioning

## Checking if it's Working

1. Make any small change to your site
2. Commit and push to GitHub
3. Go to GitHub → Actions tab
4. Watch the "Auto-Update Version and Date" workflow run
5. After ~1 minute, it will push an update commit
6. Your site's version will be automatically incremented

## Benefits

✅ **Zero manual work** - Completely automated  
✅ **Based on git history** - Version increments with commits  
✅ **Always accurate** - Uses actual commit timestamps  
✅ **Reliable** - GitHub Actions runs on every push  
✅ **No local setup needed** - Works entirely in the cloud
