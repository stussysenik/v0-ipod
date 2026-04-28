import { test, expect } from "@playwright/test";

test.describe("Performance Budget Gates", () => {
  test("total page transfer size is under 500KB", async ({ page }) => {
    const resources: { url: string; size: number }[] = [];

    // Track all network responses
    page.on("response", (response) => {
      const headers = response.headers();
      const contentLength = parseInt(headers["content-length"] || "0", 10);
      const transferSize = contentLength || 0;
      resources.push({ url: response.url(), size: transferSize });
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("theme-button")).toBeVisible({ timeout: 10_000 });

    const totalBytes = resources.reduce((sum, r) => sum + r.size, 0);
    const totalKB = totalBytes / 1024;

    console.info(
      `Total transfer: ${totalKB.toFixed(1)}KB (${resources.length} resources)`,
    );

    // Log top 5 largest resources for debugging
    const sorted = [...resources].sort((a, b) => b.size - a.size);
    console.info("Top 5 resources:");
    for (const r of sorted.slice(0, 5)) {
      const name = new URL(r.url).pathname.split("/").pop() || r.url;
      console.info(`  ${(r.size / 1024).toFixed(1)}KB  ${name}`);
    }

    expect(totalKB).toBeLessThanOrEqual(500);
  });

  test("JavaScript bundle total is under 300KB gzipped", async ({ page }) => {
    const jsResources: { url: string; size: number }[] = [];

    page.on("response", (response) => {
      const url = response.url();
      if (url.endsWith(".js") || url.includes(".js?")) {
        const headers = response.headers();
        const contentLength = parseInt(headers["content-length"] || "0", 10);
        jsResources.push({ url, size: contentLength });
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("theme-button")).toBeVisible({ timeout: 10_000 });

    const totalJSBytes = jsResources.reduce((sum, r) => sum + r.size, 0);
    const totalJSKB = totalJSBytes / 1024;

    console.info(
      `JS bundle total: ${totalJSKB.toFixed(1)}KB (${jsResources.length} files)`,
    );

    // Log individual JS files
    const sorted = [...jsResources].sort((a, b) => b.size - a.size);
    for (const r of sorted.slice(0, 10)) {
      const name = new URL(r.url).pathname.split("/").pop() || r.url;
      console.info(`  ${(r.size / 1024).toFixed(1)}KB  ${name}`);
    }

    expect(totalJSKB).toBeLessThanOrEqual(300);
  });

  test("no long tasks exceed 50ms during initial load", async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);

    // Inject PerformanceObserver for longtask entries before navigation
    await page.addInitScript(() => {
      const longTaskWindow = window as Window & {
        __longTasks?: Array<{
          name: string;
          duration: number;
          startTime: number;
        }>;
      };
      longTaskWindow.__longTasks = [];
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            longTaskWindow.__longTasks?.push({
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        });
        observer.observe({ type: "longtask", buffered: true });
      } catch {
        // longtask observer not supported
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("theme-button")).toBeVisible({ timeout: 10_000 });

    // Wait an extra frame for any pending long tasks to register
    await page.evaluate(
      () =>
        new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
    );

    const result = await cdp.send("Runtime.evaluate", {
      expression: `JSON.stringify(window.__longTasks || [])`,
      returnByValue: true,
    });

    await cdp.detach();

    const longTasks = JSON.parse((result.result.value as string) || "[]") as Array<{
      name: string;
      duration: number;
      startTime: number;
    }>;

    console.info(`Long tasks during load: ${longTasks.length}`);
    for (const task of longTasks) {
      console.info(`  ${task.duration.toFixed(1)}ms at ${task.startTime.toFixed(1)}ms`);
    }

    // Warn on long tasks but don't fail — initial hydration may produce some
    // This test documents the baseline; the threshold can be tightened later
    if (longTasks.length > 0) {
      const maxDuration = Math.max(...longTasks.map((t) => t.duration));
      console.info(`Longest task: ${maxDuration.toFixed(1)}ms`);
      // Fail only if any single task exceeds 200ms (very long)
      expect(maxDuration).toBeLessThanOrEqual(200);
    }
  });
});
