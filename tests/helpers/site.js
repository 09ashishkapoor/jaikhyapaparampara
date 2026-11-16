// Safety net only: fonts are self-hosted under fonts/ (ROADMAP Item 5), so these
// routes should never match. Aborting them keeps the suite offline, and
// tests/smoke/fonts.spec.js fails if a Google Fonts reference is reintroduced.
const EXTERNAL_NOISE_PATTERNS = [
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
  await page.waitForLoadState('load');
  try {
    // Some pages keep a request open (analytics/fetch timing), so use networkidle as best-effort.
    await page.waitForLoadState('networkidle', { timeout: 5000 });
  } catch {
    // Proceed once DOM + load are complete; visual assertions target stable regions.
  }
  await stabilizePage(page);
}

module.exports = {
  blockExternalNoise,
  gotoAndStabilize,
  stabilizePage
};
