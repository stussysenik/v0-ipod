import { expect, test } from "@playwright/test";

/**
 * Mobile responsive stability & usability (spec: mobile-responsive-layout).
 *
 * Pins true phone-class viewports (below the desktop Chrome window floor) to prove
 * the regressions the change fixes:
 *   1. Portrait device scale is stable against viewport-height changes (no collapse).
 *   2. The compact toolbox panel is bounded + scrollable (no controls off-screen).
 *   3. /3d in landscape has no horizontal document overflow.
 */

/** Reads the live `transform: scale()` applied to the workbench device wrapper. */
async function readDeviceScale(page: import("@playwright/test").Page): Promise<number | null> {
	return page.evaluate(() => {
		const wrapper = Array.from(document.querySelectorAll("div")).find(
			(d) =>
				d.style.transform.includes("scale(") &&
				d.style.transformOrigin.includes("top"),
		);
		if (!wrapper) return null;
		return new DOMMatrixReadOnly(getComputedStyle(wrapper).transform).a;
	});
}

test.describe("workbench portrait scaling", () => {
	test("device scale is stable across a viewport-height change", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/", { waitUntil: "networkidle" });
		await page.waitForTimeout(400);

		const tall = await readDeviceScale(page);
		expect(tall, "device wrapper scale not found").not.toBeNull();

		// Shrink only the height — the URL-bar/keyboard scenario — staying in portrait
		// (height still > width). The width-lock must keep the scale identical.
		await page.setViewportSize({ width: 390, height: 500 });
		await page.waitForTimeout(400);
		const short = await readDeviceScale(page);

		expect(short).not.toBeNull();
		// Pre-fix this collapsed (~0.81 → ~0.61). Width-lock holds it constant.
		expect(Math.abs((short as number) - (tall as number))).toBeLessThan(0.005);
		// And it never shrinks to nothing.
		expect(short as number).toBeGreaterThan(0.5);
	});

	test("the device container scrolls instead of clipping when width-locked", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 500 });
		await page.goto("/", { waitUntil: "networkidle" });
		// The width-lock + scroll only engages once the resize effect commits the
		// real viewport, so wait for the compact-portrait class to land.
		await page.waitForFunction(
			() => {
				const el = document.querySelector("div.min-h-dvh.flex-col");
				return !!el && getComputedStyle(el).overflowY === "auto";
			},
			{ timeout: 15_000 },
		);

		const overflowY = await page.evaluate(() => {
			const el = document.querySelector("div.min-h-dvh.flex-col");
			return el ? getComputedStyle(el).overflowY : null;
		});
		expect(overflowY).toBe("auto");
	});
});

test.describe("compact toolbox reachability", () => {
	test("the open toolbox panel stays within the viewport and scrolls", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 500 });
		await page.goto("/", { waitUntil: "networkidle" });

		// The compact toolbox panel is open by default below 768px; it is the only
		// surface that combines a bounded max-height with internal scroll.
		await page.waitForSelector('[class*="max-h-"][class*="overflow-y-auto"]', { timeout: 15_000 });

		const panel = await page.evaluate(() => {
			const el = document.querySelector<HTMLElement>(
				'[class*="max-h-"][class*="overflow-y-auto"]',
			);
			if (!el) return null;
			const r = el.getBoundingClientRect();
			const cs = getComputedStyle(el);
			return {
				top: r.top,
				bottom: r.bottom,
				winH: window.innerHeight,
				overflowY: cs.overflowY,
				bounded: el.scrollHeight > el.clientHeight + 1 || r.bottom <= window.innerHeight + 1,
			};
		});

		expect(panel, "bounded toolbox panel not found").not.toBeNull();
		// Top edge is never pushed off-screen (the original bug clipped buttons above 0).
		expect(panel!.top).toBeGreaterThanOrEqual(-1);
		expect(panel!.overflowY).toBe("auto");
		// Either it fits, or it scrolls — every control is reachable.
		expect(panel!.bounded).toBe(true);
	});
});

test.describe("/3d landscape", () => {
	test("no horizontal document overflow in landscape", async ({ page }) => {
		await page.setViewportSize({ width: 844, height: 390 });
		// /3d compiles on first hit in dev; give the canvas a generous window.
		await page.goto("/3d", { waitUntil: "domcontentloaded" });
		await expect(page.locator("canvas").first()).toBeVisible({ timeout: 60_000 });

		const diag = await page.evaluate(() => ({
			docW: document.documentElement.scrollWidth,
			bodyW: document.body.scrollWidth,
			winW: window.innerWidth,
		}));
		expect(diag.docW, "document scrolls horizontally").toBeLessThanOrEqual(diag.winW + 1);
		expect(diag.bodyW, "body scrolls horizontally").toBeLessThanOrEqual(diag.winW + 1);
	});
});
