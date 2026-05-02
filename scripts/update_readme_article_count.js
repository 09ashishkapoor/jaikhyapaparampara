#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const articlesDir = path.join(root, 'articles');
const readmePath = path.join(root, 'README.md');

if (!fs.existsSync(articlesDir) || !fs.existsSync(readmePath)) {
  process.exit(1);
}

const articleCount = fs
  .readdirSync(articlesDir)
  .filter((fileName) => fileName.endsWith('.md')).length;
const articleCountWithCommas = articleCount.toLocaleString('en-US');

const original = fs.readFileSync(readmePath, 'utf8');

let updated = original.replace(
  /(The site contains \*\*)([\d,]+)(\s+articles\*\*)/,
  `$1${articleCountWithCommas}$3`
);

updated = updated.replace(
  /(articles\/\s+#\s*)([\d,]+)(\s+Markdown articles)/,
  `$1${articleCount}$3`
);

if (updated !== original) {
  fs.writeFileSync(readmePath, updated, 'utf8');
  process.stdout.write(`Updated README article count to ${articleCount}\n`);
} else {
  process.stdout.write(`README already at ${articleCount}\n`);
}
