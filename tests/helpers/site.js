const EXTERNAL_NOISE_PATTERNS = [
  'https://www.googletagmanager.com/**',
  'https://www.google-analytics.com/**',
  'https://fonts.googleapis.com/**',
  'https://fonts.gstatic.com/**'
];

const STABILITY_STYLES = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }

  html {
    scroll-behavior: auto !important;
  }
`;

async function blockExternalNoise(page) {
  for (const pattern of EXTERNAL_NOISE_PATTERNS) {
    await page.route(pattern, (route) => route.abort());
  }
}

async function stabilizePage(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({ content: STABILITY_STYLES });

  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // Ignore blocked font requests; fallback fonts are acceptable for validation.
      }
    }
  });
}

async function gotoAndStabilize(page, url, options = {}) {
  await blockExternalNoise(page);
  await page.goto(url, { waitUntil: 'domcontentloaded', ...options });
  await page.waitForLoadState('networkidle');
  await stabilizePage(page);
}

module.exports = {
  blockExternalNoise,
  gotoAndStabilize,
  stabilizePage
};
