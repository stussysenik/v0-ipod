/**
 * Capture clock — an imperative, React-free time source the marquee reads while a
 * clip is baked offline.
 *
 * WHY NOT REACT STATE?
 * --------------------
 * During an export, `renderClipFrames` rasterizes the live screen DOM onto the LCD
 * texture (`refreshScreen`) and then immediately renders that texture. For the bake
 * to capture the right marquee position, the marquee's `transform` must already be
 * set *synchronously* at that instant. A React state update would schedule a
 * re-render that may not flush before the rasterize — the bake would capture a stale
 * frame (exactly the "marquee frozen in the export" bug).
 *
 * So instead of routing the clip-time through props/state, the export pushes it into
 * this tiny pub/sub. `MarqueeText` subscribes and writes `track.style.transform`
 * directly inside the callback — no render, no flush, no lag. When `elapsedMs` is
 * `null` the marquee falls back to its normal live wall-clock rAF animation.
 *
 * It's a module singleton because there is only ever one export in flight, and every
 * marquee on the device (title / artist / album) must share one timeline so their
 * stagger stays in phase — the same reason the live view shares one rAF origin.
 */

type CaptureClockListener = (elapsedMs: number | null) => void;

let currentElapsedMs: number | null = null;
const listeners = new Set<CaptureClockListener>();

/**
 * Drive (or release) the capture clock. Pass a number to pin all marquees to that
 * elapsed time; pass `null` to hand positioning back to the live rAF animation.
 * Notifies subscribers synchronously so the next screen bake captures this frame.
 */
export function setCaptureElapsedMs(elapsedMs: number | null): void {
	currentElapsedMs = elapsedMs;
	for (const listener of listeners) listener(elapsedMs);
}

/** The current capture time, or `null` when no export is driving the marquee. */
export function getCaptureElapsedMs(): number | null {
	return currentElapsedMs;
}

/** Subscribe to capture-clock changes. Returns an unsubscribe function. */
export function subscribeCaptureClock(listener: CaptureClockListener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
