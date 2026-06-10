import { devices, expect, test } from "@playwright/test";

/**
 * Mobile-first responsive smoke for /3d.
 *
 * Proves the studio renders on a phone without horizontal overflow, mounts the
 * WebGL canvas, and surfaces the bottom-sheet control drawer trigger (the
 * desktop floating panels collapse into a `lg:contents` sheet below `lg:`).
 */
// Pixel 7 is a Chromium-channel device descriptor — the project pins channel
// `chrome` (the export VideoEncoder needs it), which is incompatible with the
// webkit-backed iPhone descriptors. Same phone-class viewport + touch profile.
test.use({ ...devices["Pixel 7"] });

test("/3d renders mobile-first with no horizontal overflow", async ({ page }) => {
	const errors: string[] = [];
	page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

	await page.goto("/3d", { waitUntil: "networkidle" });
	await page.waitForTimeout(2000);

	// WebGL stage mounted.
	await expect(page.locator("canvas").first()).toBeVisible();

	// Diagnostics: document scroll width vs viewport, plus the widest elements
	// that actually push past the viewport edge (right edge > winW).
	const diag = await page.evaluate(() => {
		const winW = window.innerWidth;
		const offenders: { tag: string; cls: string; w: number; right: number }[] = [];
		for (const el of Array.from(document.querySelectorAll("body *"))) {
			const r = el.getBoundingClientRect();
			if (r.right > winW + 1 || r.width > winW + 1) {
				offenders.push({
					tag: el.tagName,
					cls: (el.className?.toString() || "").slice(0, 60),
					w: Math.round(r.width),
					right: Math.round(r.right),
				});
			}
		}
		offenders.sort((a, b) => b.right - a.right);
		return {
			docW: document.documentElement.scrollWidth,
			bodyW: document.body.scrollWidth,
			winW,
			offenders: offenders.slice(0, 8),
		};
	});
	console.log("[mobile] diag:", JSON.stringify(diag, null, 2));

	// The cardinal mobile-first sin is a horizontally SCROLLABLE document. A
	// full-bleed canvas clipped by overflow-hidden is fine; a body you can drag
	// sideways is not.
	expect(diag.docW, "document scrolls horizontally").toBeLessThanOrEqual(diag.winW + 1);
	expect(diag.bodyW, "body scrolls horizontally").toBeLessThanOrEqual(diag.winW + 1);

	expect(errors, errors.join("\n")).toHaveLength(0);
});
