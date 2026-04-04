import { test, expect } from "@playwright/test";
import { WebVitalsCollector } from "./helpers/cdp-web-vitals";
import { WEB_VITALS_THRESHOLDS, formatMetric } from "./helpers/performance-thresholds";

test.describe("Web Vitals — Cold Load", () => {
  test("FCP is under 1.8s (target sub-1s)", async ({ page }) => {
    const collector = await WebVitalsCollector.create(page);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    // Wait for iPod screen to be the contentful paint
    await expect(page.getByTestId("theme-button")).toBeVisible({ timeout: 10_000 });

    const { fcp } = await collector.collectPaintMetrics();
    await collector.dispose();

    expect(fcp).not.toBeNull();
    const value = fcp!;
    console.info(
      `FCP: ${formatMetric("fcp", value)} (good: <${WEB_VITALS_THRESHOLDS.fcp.good}ms, fail: >${WEB_VITALS_THRESHOLDS.fcp.acceptable}ms)`,
    );
    expect(value).toBeLessThanOrEqual(WEB_VITALS_THRESHOLDS.fcp.acceptable);
  });

  test("LCP is under 2.5s (target sub-1.5s)", async ({ page }) => {
    const collector = await WebVitalsCollector.create(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Ensure iPod shell is rendered — that's the largest contentful element
    await expect(page.getByTestId("theme-button")).toBeVisible({ timeout: 10_000 });

    const { lcp } = await collector.collectPaintMetrics();
    await collector.dispose();

    expect(lcp).not.toBeNull();
    const value = lcp!;
    console.info(
      `LCP: ${formatMetric("lcp", value)} (good: <${WEB_VITALS_THRESHOLDS.lcp.good}ms, fail: >${WEB_VITALS_THRESHOLDS.lcp.acceptable}ms)`,
    );
    expect(value).toBeLessThanOrEqual(WEB_VITALS_THRESHOLDS.lcp.acceptable);
  });

  test("CLS is under 0.1 (target zero)", async ({ page }) => {
    const collector = await WebVitalsCollector.create(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Wait for layout to fully settle
    await expect(page.getByTestId("theme-button")).toBeVisible({ timeout: 10_000 });
    // Extra frame wait for any late layout shifts
    await page.evaluate(
      () =>
        new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
    );

    const cls = await collector.collectCLS();
    await collector.dispose();

    console.info(
      `CLS: ${formatMetric("cls", cls)} (good: <${WEB_VITALS_THRESHOLDS.cls.good}, fail: >${WEB_VITALS_THRESHOLDS.cls.acceptable})`,
    );
    expect(cls).toBeLessThanOrEqual(WEB_VITALS_THRESHOLDS.cls.acceptable);
  });

  test("TTFB is under 600ms", async ({ page }) => {
    const collector = await WebVitalsCollector.create(page);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const ttfb = await collector.collectTTFB();
    await collector.dispose();

    console.info(
      `TTFB: ${formatMetric("ttfb", ttfb)} (good: <${WEB_VITALS_THRESHOLDS.ttfb.good}ms, fail: >${WEB_VITALS_THRESHOLDS.ttfb.acceptable}ms)`,
    );
    expect(ttfb).toBeLessThanOrEqual(WEB_VITALS_THRESHOLDS.ttfb.acceptable);
  });
});

test.describe("Web Vitals — Interaction (INP)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("theme-button")).toBeVisible({ timeout: 10_000 });
  });

  test("INP for view mode switch is under 200ms", async ({ page }) => {
    const collector = await WebVitalsCollector.create(page);
    // Navigate to page again with observer injected
    await page.goto("/");
    await expect(page.getByTestId("theme-button")).toBeVisible({ timeout: 10_000 });

    const inp = await collector.measureINP(async () => {
      await page.getByTestId("preview-view-button").click();
    });
    await collector.dispose();

    console.info(
      `INP (view switch): ${formatMetric("inp", inp)} (good: <${WEB_VITALS_THRESHOLDS.inp.good}ms, fail: >${WEB_VITALS_THRESHOLDS.inp.acceptable}ms)`,
    );
    expect(inp).toBeLessThanOrEqual(WEB_VITALS_THRESHOLDS.inp.acceptable);
  });

  test("INP for theme panel toggle is under 200ms", async ({ page }) => {
    const collector = await WebVitalsCollector.create(page);
    await page.goto("/");
    await expect(page.getByTestId("theme-button")).toBeVisible({ timeout: 10_000 });

    const inp = await collector.measureINP(async () => {
      await page.getByTestId("theme-button").click();
    });
    await collector.dispose();

    console.info(`INP (theme toggle): ${formatMetric("inp", inp)}`);
    expect(inp).toBeLessThanOrEqual(WEB_VITALS_THRESHOLDS.inp.acceptable);
  });
});
