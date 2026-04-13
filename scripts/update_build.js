#!/usr/bin/env node

const fs = require('fs');

const FILE_PATH = 'index.html';

function formatDateUtc(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function formatDateFooter(date) {
  const month = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(date);
  const day = new Intl.DateTimeFormat('en-US', { day: '2-digit', timeZone: 'UTC' }).format(date);
  const year = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'UTC' }).format(date);
  return `${month} ${day}, ${year}`;
}

function getNextVersion(currentVersion) {
  const parts = currentVersion.split('.');
  const lastPart = Number.parseInt(parts[parts.length - 1], 10);
  if (Number.isNaN(lastPart)) {
    throw new Error('Current version is not numeric');
  }
  parts[parts.length - 1] = String(lastPart + 1);
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
    const newVersion = getNextVersion(currentVersion);

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
