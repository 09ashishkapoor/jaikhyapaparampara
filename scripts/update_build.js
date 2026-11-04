#!/usr/bin/env node

const fs = require('fs');

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

function getBuildVersion(date) {
  const pad = (value) => String(value).padStart(2, '0');
  const year = String(date.getUTCFullYear()).slice(-2);
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  return `1.${year}${month}${day}.${hours}${minutes}`;
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

    const nowUtc = new Date();
    const currentVersion = versionMatch[1];
    const newVersion = getBuildVersion(nowUtc);

    content = content.replace(
      /meta name="build-version" content="[^"]*"/,
      `meta name="build-version" content="${newVersion}"`
    );
    content = content.replace(
      /<span id="version-value">V[0-9.]+<\/span>/,
      `<span id="version-value">V${newVersion}</span>`
    );

    console.log(`Version: ${currentVersion} -> ${newVersion}`);

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
