import { describe, expect, it } from "vitest";

import { clipMarqueeElapsedMs, clipSongSecond } from "./export-clock";

/**
 * These tests encode the property the export pipeline must guarantee: across a clip,
 * every looping element advances CONTINUOUSLY and never freezes. Because the clock
 * math is pure (no Date.now / DOM / encoder), "the export doesn't get stuck" becomes
 * something we can assert directly instead of eyeballing a rendered video.
 *
 * We sample progress on the same grid the bake loop walks: `i / total`.
 */

/** Sample clip progress over `frames` evenly-spaced bake points, p ∈ [0, 1). */
function sampleProgress(frames: number): number[] {
	return Array.from({ length: frames }, (_, i) => i / frames);
}

describe("clipMarqueeElapsedMs", () => {
	it("advances strictly monotonically across the whole clip (never frozen)", () => {
		const durationSec = 60;
		const samples = sampleProgress(1800).map((p) => clipMarqueeElapsedMs(p, durationSec));
		for (let i = 1; i < samples.length; i++) {
			expect(samples[i]).toBeGreaterThan(samples[i - 1]);
		}
	});

	it("maps progress linearly onto clip-time in ms", () => {
		expect(clipMarqueeElapsedMs(0, 60)).toBe(0);
		expect(clipMarqueeElapsedMs(0.5, 60)).toBe(30_000);
		expect(clipMarqueeElapsedMs(1, 60)).toBe(60_000);
	});

	it("clamps out-of-range progress instead of producing NaN/negative time", () => {
		expect(clipMarqueeElapsedMs(-0.2, 60)).toBe(0);
		expect(clipMarqueeElapsedMs(1.5, 60)).toBe(60_000);
		expect(clipMarqueeElapsedMs(Number.NaN, 60)).toBe(0);
	});
});

describe("clipSongSecond", () => {
	const opts = { baseTime: 0, durationSec: 60, songDuration: 20 };

	it("is non-decreasing between loop wraps (the clock only ever moves forward)", () => {
		const seconds = sampleProgress(1800).map((p) => clipSongSecond(p, opts));
		let wraps = 0;
		for (let i = 1; i < seconds.length; i++) {
			if (seconds[i] < seconds[i - 1]) wraps++; // a wrap is the only allowed step-down
			else expect(seconds[i]).toBeGreaterThanOrEqual(seconds[i - 1]);
		}
		// A 20s song over a 60s clip must loop ~3×, not stall on one value.
		expect(wraps).toBeGreaterThanOrEqual(2);
	});

	it("covers the full song range over the clip (no truncated/early stop)", () => {
		const seconds = new Set(sampleProgress(1800).map((p) => clipSongSecond(p, opts)));
		// Every whole second of the 20s song (0..20 inclusive, the +1 hold) should appear.
		for (let s = 0; s <= opts.songDuration; s++) {
			expect(seconds.has(s)).toBe(true);
		}
	});

	it("never produces a frozen run spanning the whole clip", () => {
		const distinct = new Set(sampleProgress(1800).map((p) => clipSongSecond(p, opts)));
		expect(distinct.size).toBeGreaterThan(1);
	});

	it("respects the composed base time and wraps from there", () => {
		const fromMid = { baseTime: 15, durationSec: 60, songDuration: 20 };
		expect(clipSongSecond(0, fromMid)).toBe(15);
		// 15 + 0.5*60 = 45 → 45 % 21 = 3
		expect(clipSongSecond(0.5, fromMid)).toBe(3);
	});

	it("counts up without wrapping when the song length is unknown", () => {
		const unknown = { baseTime: 0, durationSec: 60, songDuration: 0 };
		expect(clipSongSecond(0, unknown)).toBe(0);
		expect(clipSongSecond(0.5, unknown)).toBe(30);
		expect(clipSongSecond(1, unknown)).toBe(60);
	});
});
