import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:4001');
  
  // Wait for the app to load
  await page.waitForSelector('[data-testid="ipod-screen"]');

  // Toggle "Classic" mode if not already active
  // Based on my implementation:
  // 1. Open settings
  await page.click('[data-testid="theme-button"]');
  // 2. Click "Classic (1:1)"
  const classicButton = page.locator('[data-testid="fidelity-classic-button"]');
  if (await classicButton.isVisible()) {
    await classicButton.click();
  }
  
  // Close settings to clear the view
  await page.click('[data-testid="theme-button"]');

  // Wait for transitions
  await page.waitForTimeout(1000);

  // Take screenshot of the iPod
  const ipod = page.locator('[data-export-shell="false"]');
  await ipod.screenshot({ path: 'classic-verify.png' });

  await browser.close();
  console.log('Screenshot saved as classic-verify.png');
})();
