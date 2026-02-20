import { chromium, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:4000';

async function waitForExportResult(page) {
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      page.off('console', onConsole);
      reject(new Error('Timed out waiting for [export] finished log'));
    }, 25000);

    const onConsole = async (msg) => {
      if (!msg.text().includes('[export] finished')) return;
      try {
        const args = await Promise.all(
          msg.args().map(async (arg) => {
            try {
              return await arg.jsonValue();
            } catch {
              return null;
            }
          }),
        );

        const payload = args.find(
          (value) => value && typeof value === 'object' && 'success' in value,
        );
        if (!payload) return;

        clearTimeout(timeout);
        page.off('console', onConsole);
        resolve(payload);
      } catch (error) {
        clearTimeout(timeout);
        page.off('console', onConsole);
        reject(error);
      }
    };

    page.on('console', onConsole);
  });
}

async function exportTwice(page) {
  const firstResultPromise = waitForExportResult(page);
  await page.getByTestId('export-button').click();
  const first = await firstResultPromise;

  await page.waitForFunction(() => {
    const button = document.querySelector('[data-testid="export-button"]');
    return button instanceof HTMLButtonElement && !button.disabled;
  });

  const secondResultPromise = waitForExportResult(page);
  await page.getByTestId('export-button').click();
  const second = await secondResultPromise;

  await page.waitForFunction(() => {
    const button = document.querySelector('[data-testid="export-button"]');
    return button instanceof HTMLButtonElement && !button.disabled;
  });

  return { first, second };
}

async function runScenario(browser, { mobile, snapshot }) {
  const label = `${mobile ? 'mobile' : 'desktop'}-${snapshot ? 'snapshot' : 'placeholder'}`;
  const context = await browser.newContext({
    ...(mobile ? devices['iPhone 13'] : {}),
  });
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.getByTestId('theme-button').waitFor({ timeout: 15000 });

  if (snapshot) {
    await page.getByTestId('theme-button').click();
    await page.getByTestId('load-song-snapshot-button').click();
    await page.waitForTimeout(250);
  }

  const { first, second } = await exportTwice(page);

  await context.close();

  return {
    label,
    mobile,
    snapshot,
    repeatDeterministic:
      first.success &&
      second.success &&
      first.capturePath === second.capturePath &&
      first.blobDigest === second.blobDigest &&
      first.blobSize === second.blobSize,
    first,
    second,
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const scenarios = [
      { mobile: false, snapshot: false },
      { mobile: false, snapshot: true },
      { mobile: true, snapshot: false },
      { mobile: true, snapshot: true },
    ];

    const results = [];
    for (const scenario of scenarios) {
      results.push(await runScenario(browser, scenario));
    }

    const desktopPlaceholder = results.find((r) => r.label === 'desktop-placeholder');
    const mobilePlaceholder = results.find((r) => r.label === 'mobile-placeholder');
    const desktopSnapshot = results.find((r) => r.label === 'desktop-snapshot');
    const mobileSnapshot = results.find((r) => r.label === 'mobile-snapshot');

    const cross = {
      placeholderDesktopVsMobile:
        desktopPlaceholder.first.blobDigest === mobilePlaceholder.first.blobDigest &&
        desktopPlaceholder.first.blobSize === mobilePlaceholder.first.blobSize,
      snapshotDesktopVsMobile:
        desktopSnapshot.first.blobDigest === mobileSnapshot.first.blobDigest &&
        desktopSnapshot.first.blobSize === mobileSnapshot.first.blobSize,
    };

    console.log(JSON.stringify({ results, cross }, null, 2));
  } finally {
    await browser.close();
  }
})();
