import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Capture console messages to simulate DevTools
  page.on('console', msg => console.log(`[PAGE CONSOLE ${msg.type().toUpperCase()}]`, msg.text()));
  page.on('pageerror', err => console.error(`[PAGE ERROR]`, err.toString()));
  page.on('requestfailed', request => console.error(`[PAGE REQUEST FAILED]`, request.url(), request.failure().errorText));
  page.on('response', response => {
    if (response.status() === 404) {
      console.error(`[PAGE 404]`, response.url());
    }
  });

  try {
    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    
    console.log('Checking for root element...');
    const rootHasContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root && root.innerHTML.trim().length > 0;
    });
    
    if (rootHasContent) {
      console.log('✅ App rendered content in #root');
    } else {
      console.error('❌ App failed to render in #root');
    }
    
    // Check for some known elements from the design (e.g., ipod shell, screen, wheel)
    const elementsExist = await page.evaluate(() => {
      const hasShell = !!document.querySelector('.ipod-shell') || !!document.querySelector('div[style*="background-color"]');
      const hasBattery = document.body.innerHTML.includes('🔋') || document.body.innerHTML.includes('Battery'); // Just a rough check, or check for some class/text
      return { hasShell, hasBattery };
    });
    console.log('DOM Check:', elementsExist);

    // Let the page run for a second to see if marquee/timers crash
    await new Promise(r => setTimeout(r, 1000));
    console.log('Test complete. Closing browser.');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
  }
})();
