import { describe, expect, it, vi } from "vitest";

import {
	buildClipTargetLadder,
	ClipCodecUnavailableError,
	H264_PROFILE_CANDIDATES,
	MIN_CLIP_BITRATE,
	resolveClipCodec,
	type CodecSupportProbe,
} from "./clip-codec-ladder";

describe("buildClipTargetLadder", () => {
	it("keeps the requested target as the top rung and preserves aspect ratio", () => {
		const ladder = buildClipTargetLadder(1080, 1920, 14_000_000);

		expect(ladder[0]).toMatchObject({ width: 1080, height: 1920, bitrate: 14_000_000 });
		// Every rung holds the source 9:16 aspect (within the even-rounding tolerance).
		for (const rung of ladder) {
			expect(Math.abs(rung.width / rung.height - 1080 / 1920)).toBeLessThan(0.01);
		}
	});

	it("steps resolution down monotonically with even dimensions", () => {
		const ladder = buildClipTargetLadder(1080, 1920, 14_000_000);

		expect(ladder.length).toBeGreaterThan(1);
		for (let i = 1; i < ladder.length; i++) {
			expect(ladder[i].width).toBeLessThan(ladder[i - 1].width);
			expect(ladder[i].height).toBeLessThan(ladder[i - 1].height);
		}
		for (const rung of ladder) {
			expect(rung.width % 2).toBe(0);
			expect(rung.height % 2).toBe(0);
		}
	});

	it("scales bitrate with pixel count but never below the watchable floor", () => {
		const ladder = buildClipTargetLadder(1080, 1920, 14_000_000);
		const bottom = ladder[ladder.length - 1];

		// A 0.5x frame carries ~0.25x the bits — smaller than the top, at/above the floor.
		expect(bottom.bitrate).toBeLessThan(ladder[0].bitrate);
		expect(bottom.bitrate).toBeGreaterThanOrEqual(MIN_CLIP_BITRATE);
	});
});

describe("resolveClipCodec", () => {
	const request = { width: 1080, height: 1920, framerate: 30, bitrate: 14_000_000 };

	it("returns the widest profile at full resolution when the device can encode it", async () => {
		const probe: CodecSupportProbe = async () => true;

		const resolved = await resolveClipCodec(request, probe);

		expect(resolved).not.toBeNull();
		expect(resolved?.codec).toBe(H264_PROFILE_CANDIDATES[0]);
		expect(resolved?.width).toBe(1080);
		expect(resolved?.height).toBe(1920);
		expect(resolved?.steppedDown).toBe(false);
	});

	it("steps DOWN to a lower resolution when full-res H.264 is unsupported", async () => {
		// The phone rejects anything at the 1080-wide top rung but accepts the next rung down.
		const probe = vi.fn<CodecSupportProbe>(async (config) => config.width < 1080);

		const resolved = await resolveClipCodec(request, probe);

		expect(resolved).not.toBeNull();
		expect(resolved!.width).toBeLessThan(1080);
		expect(resolved?.steppedDown).toBe(true);
		// It probed the full-res rung first (proof it did not skip the top).
		expect(probe.mock.calls.some(([c]) => c.width === 1080)).toBe(true);
	});

	it("falls through profiles at a rung before dropping resolution", async () => {
		// Only Baseline is acceptable, but at full resolution — no step-down needed.
		const baseline = H264_PROFILE_CANDIDATES[H264_PROFILE_CANDIDATES.length - 1];
		const probe: CodecSupportProbe = async (config) =>
			config.codec === baseline && config.width === 1080;

		const resolved = await resolveClipCodec(request, probe);

		expect(resolved?.codec).toBe(baseline);
		expect(resolved?.width).toBe(1080);
		expect(resolved?.steppedDown).toBe(false);
	});

	it("keeps probing when isConfigSupported throws on a descriptor", async () => {
		const baseline = H264_PROFILE_CANDIDATES[H264_PROFILE_CANDIDATES.length - 1];
		const probe: CodecSupportProbe = async (config) => {
			if (config.codec !== baseline) throw new TypeError("bad descriptor");
			return config.width === 1080;
		};

		const resolved = await resolveClipCodec(request, probe);

		expect(resolved?.codec).toBe(baseline);
	});

	it("returns null when the entire ladder is exhausted", async () => {
		const probe: CodecSupportProbe = async () => false;

		expect(await resolveClipCodec(request, probe)).toBeNull();
	});
});

describe("ClipCodecUnavailableError", () => {
	it("is an Error carrying an honest, device-specific message", () => {
		const error = new ClipCodecUnavailableError();

		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe("ClipCodecUnavailableError");
		expect(error.message).toMatch(/encode/i);
	});
});
