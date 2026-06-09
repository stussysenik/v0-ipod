/**
 * Export clip-clock — the single deterministic timeline every looping element on
 * the iPod reads while a clip is baked offline.
 *
 * WHY THIS EXISTS
 * ---------------
 * A clip export does NOT play in real time. `renderClipFrames` (three-d-ipod.tsx)
 * walks a fixed number of frames and bakes each one; the only honest notion of
 * "time" during that walk is the frame index normalised to the clip: `i / total`,
 * i.e. progress ∈ [0, 1). Anything that animated off a *different* clock drifted or
 * froze in the output:
 *   • the marquee ran off wall-clock `requestAnimationFrame`, which stalls whenever
 *     the offline render hogs the main thread → "marquee gets stuck";
 *   • the song position was advanced from the *encoder's* progress, which stalls
 *     under back-pressure → "music stops at 0:20 on a 60s clip".
 *
 * The fix is to derive BOTH from the same `progress` value, sampled at bake time.
 * These are pure functions so they can be unit-tested for continuity (monotonic
 * between loop wraps, never a frozen run) without spinning up WebGL or an encoder.
 *
 * Teaching note: keeping the clock math pure — no Date.now(), no React, no DOM — is
 * what makes "the export is continuous" a property you can *prove* in a test rather
 * than eyeball in a video.
 */

export interface ClipSongClockOptions {
	/** Now-playing position (seconds) the user had composed before exporting. */
	baseTime: number;
	/** The user-denoted clip length in seconds. */
	durationSec: number;
	/** The song's length in seconds (0 / unknown → no wrap, just count up). */
	songDuration: number;
}

/** Clamp progress into the half-open clip range [0, 1] (safety against fp drift). */
function clampProgress(progress: number): number {
	if (Number.isNaN(progress)) return 0;
	if (progress < 0) return 0;
	if (progress > 1) return 1;
	return progress;
}

/**
 * The whole-second now-playing position to display at a given clip `progress`.
 *
 * Loops seamlessly: a 20s song over a 60s clip plays through ~3 times. We wrap on
 * `songDuration + 1` (not `songDuration`) to match the live playback clock in
 * ipod-3d-stage.tsx, which holds the final second for one tick before resetting —
 * keeping the exported clip and the live transport visually identical.
 */
export function clipSongSecond(progress: number, opts: ClipSongClockOptions): number {
	const elapsed = clampProgress(progress) * opts.durationSec;
	const absolute = Math.floor(opts.baseTime + elapsed);
	return opts.songDuration > 0 ? absolute % (opts.songDuration + 1) : absolute;
}

/**
 * The marquee's elapsed-time input (ms) at a given clip `progress`. The scroll
 * engine (lib/marquee.ts `getMarqueeFrame`) is already a pure function of elapsed
 * ms, so feeding it clip-time makes the scroll position deterministic per frame.
 */
export function clipMarqueeElapsedMs(progress: number, durationSec: number): number {
	return clampProgress(progress) * durationSec * 1000;
}
