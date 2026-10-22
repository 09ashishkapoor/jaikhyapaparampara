#!/usr/bin/env node

const fs = require('fs');
const { execFileSync } = require('child_process');

const FILE_PATH = process.argv[2] || '_site/index.html';

function formatDateUtc(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function formatDateFooter(date) {
  const month = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(date);
  const day = new Intl.DateTimeFormat('en-US', { day: '2-digit', timeZone: 'UTC' }).format(date);
  const year = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'UTC' }).format(date);
  return `${month} ${day}, ${year}`;
}

function getVersionForCommit() {
  const versionCommit = execFileSync('git', [
    'log', '-G', 'meta name="build-version" content="[0-9.]+"',
    '-1', '--format=%H', '--', 'index.html',
  ], { encoding: 'utf8' }).trim();
  if (!versionCommit) throw new Error('Could not find the commit that set the build version');

  const baselineHtml = execFileSync('git', ['show', `${versionCommit}:index.html`], { encoding: 'utf8' });
  const baselineVersion = baselineHtml.match(/meta name="build-version" content="([0-9.]+)"/);
  if (!baselineVersion) throw new Error('Could not read the committed build version');
  const commitsSinceVersion = Number.parseInt(execFileSync('git', [
    'rev-list', '--count', `${versionCommit}..HEAD`,
  ], { encoding: 'utf8' }).trim(), 10);
  const parts = baselineVersion[1].split('.');
  const lastPart = Number.parseInt(parts[parts.length - 1], 10);
  if (Number.isNaN(lastPart) || Number.isNaN(commitsSinceVersion)) {
    throw new Error('Build version or commit count is not numeric');
  }
  parts[parts.length - 1] = String(lastPart + commitsSinceVersion);
  return parts.join('.');
}

function updateBuildInfo() {
  if (!fs.existsSync(FILE_PATH)) {
    console.error(`Error: ${FILE_PATH} not found`);
    return false;
  }

  try {
    let content = fs.readFileSync(FILE_PATH, 'utf8');

    const versionMatch = content.match(/meta name="build-version" content="([0-9.]+)"/);
    if (!versionMatch) {
      console.error('Error: Could not find build-version tag');
      return false;
    }

    const currentVersion = versionMatch[1];
    const newVersion = getVersionForCommit();

    content = content.replace(
      /meta name="build-version" content="[^"]*"/,
      `meta name="build-version" content="${newVersion}"`
    );
    content = content.replace(
      /<span id="version-value">V[0-9.]+<\/span>/,
      `<span id="version-value">V${newVersion}</span>`
    );

    console.log(`Version: ${currentVersion} -> ${newVersion}`);

    const nowUtc = new Date();
    const utcTimestamp = formatDateUtc(nowUtc);
    const footerDate = formatDateFooter(nowUtc);

    content = content.replace(
      /meta name="build-date" content="[^"]*"/,
      `meta name="build-date" content="${utcTimestamp}"`
    );
    content = content.replace(
      /<span id="last-updated-value">[^<]*<\/span>/,
      `<span id="last-updated-value">${footerDate}</span>`
    );

    console.log(`Date: ${utcTimestamp}`);

    fs.writeFileSync(FILE_PATH, content, 'utf8');
    console.log('index.html updated successfully!');
    return true;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return false;
  }
}

const success = updateBuildInfo();
process.exit(success ? 0 : 1);
