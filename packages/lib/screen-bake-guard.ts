/**
 * Screen-bake blank guard — keep "dead iPod OS" frames out of exports.
 *
 * The /3d clip export re-rasterizes the live Now Playing DOM onto the LCD mesh
 * mid-clip (html-to-image → SVG foreignObject → canvas). Chromium's foreignObject
 * rasterizer is reliable when called frequently, but when a call lands after a
 * long stretch of main-thread + GPU-saturating work — exactly what the offline
 * render loop does between re-bakes on long clips — it intermittently paints the
 * screen's content layer EMPTY: status bar and progress bar intact, everything
 * between them pure white. In the exported video that reads as "the iPod OS
 * crashed mid-song".
 *
 * Measured behaviour that shaped this module (60s export, 120 re-bakes):
 *   - ~80–95% of re-bakes rasterized blank when bakes were ~300ms apart;
 *   - 0% blanked when bakes were ~100ms apart (warm rasterizer);
 *   - an immediate retry after a blank — issued while the rasterizer's caches
 *     are still warm — repaired 94 of 94 blanks with a single attempt.
 *
 * Policy encoded here:
 *   1. Probe the rasterized PNG's central content region; near-zero luminance
 *      variance means the content layer did not paint (real screens carry text,
 *      artwork and chrome — measured variance ~3000; blanks measure 0).
 *   2. On blank, retry warm (cacheBust=false) up to a small budget.
 *   3. If every attempt is blank, return null — the caller HOLDS the last good
 *      texture. A held frame is invisible in a clip; a blank frame is the bug.
 *
 * A false-positive "blank" only costs an extra rasterize; it can never corrupt
 * the export. That asymmetry is why a simple variance probe is safe here.
 */

export interface LuminanceStats {
	mean: number;
	variance: number;
}

/**
 * Rec. 709 luminance statistics over RGBA bytes. Pure math — no DOM — so the
 * blank policy is unit-testable in node.
 */
export function luminanceStats(rgba: Uint8ClampedArray | Uint8Array): LuminanceStats {
	const pixels = rgba.length / 4;
	if (pixels === 0) return { mean: 0, variance: 0 };
	let sum = 0;
	let sumSq = 0;
	for (let i = 0; i < rgba.length; i += 4) {
		const lum = 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2];
		sum += lum;
		sumSq += lum * lum;
	}
	const mean = sum / pixels;
	return { mean, variance: sumSq / pixels - mean * mean };
}

/**
 * Below this luminance variance a content region is considered unpainted.
 * Real Now Playing content measures ~3000; observed blank bakes measure 0.
 * The wide gap means the exact value is uncritical — 40 sits far above
 * compression noise and far below any legible screen.
 */
export const BLANK_VARIANCE_THRESHOLD = 40;

export function isBlankLuminance(rgba: Uint8ClampedArray | Uint8Array): boolean {
	return luminanceStats(rgba).variance < BLANK_VARIANCE_THRESHOLD;
}

export interface BlankRetryOptions {
	/** Whether attempt #1 busts the resource cache (first bake of a capture). */
	firstAttemptBustsCache?: boolean;
	/** Warm retries after a blank first attempt. Default 2 (measured: 1 suffices). */
	maxRetries?: number;
}

/**
 * Run `rasterize` and verify the result with `probeBlank`; retry warm while the
 * output looks blank. Resolves to the first non-blank rasterization, or null
 * when the budget is exhausted — callers must then hold their last good frame.
 *
 * Dependency-injected (rasterizer + probe are parameters) so the policy is
 * testable without a browser; the DOM-bound probe lives in
 * `probeDataUrlBlank` below.
 */
export async function rasterizeWithBlankRetry(
	rasterize: (bustCache: boolean) => Promise<string>,
	probeBlank: (dataUrl: string) => Promise<boolean>,
	options: BlankRetryOptions = {},
): Promise<string | null> {
	const { firstAttemptBustsCache = true, maxRetries = 2 } = options;
	let dataUrl = await rasterize(firstAttemptBustsCache);
	if (!(await probeBlank(dataUrl))) return dataUrl;
	for (let attempt = 0; attempt < maxRetries; attempt++) {
		// Warm retry: the blank paint itself primed the rasterizer's caches, so an
		// immediate cacheBust-free call almost always paints correctly.
		dataUrl = await rasterize(false);
		if (!(await probeBlank(dataUrl))) return dataUrl;
	}
	return null;
}

/**
 * DOM-bound probe: decode a rasterized PNG data URL, downsample to 64×64 and
 * measure the central content region (excludes the status bar and the progress
 * footer, which paint even on blank bakes and would mask the failure).
 */
export async function probeDataUrlBlank(dataUrl: string): Promise<boolean> {
	try {
		const probe = new Image();
		probe.src = dataUrl;
		await probe.decode();
		const canvas = document.createElement("canvas");
		canvas.width = 64;
		canvas.height = 64;
		const ctx = canvas.getContext("2d");
		if (!ctx) return false;
		ctx.drawImage(probe, 0, 0, 64, 64);
		const region = ctx.getImageData(8, 16, 48, 32).data;
		return isBlankLuminance(region);
	} catch {
		// If the probe itself fails we must not block the export — treat as content.
		return false;
	}
}
