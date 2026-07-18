/**
 * Clip codec fallback ladder (§7.4).
 *
 * A phone that can't encode 1080×1920 H.264 shouldn't fail the clip outright — it
 * should step DOWN (resolution → bitrate → profile) to the first configuration the
 * platform's WebCodecs encoder will actually accept, and only report "can't encode"
 * once the whole ladder is exhausted. This module is the pure decision layer: given
 * a requested target and an injected `isConfigSupported` probe, it returns the first
 * encodable rung (flagged when it had to step down, for honest messaging) or `null`.
 * The recorder supplies the real probe; tests supply a fake one.
 */

/**
 * H.264 profiles, widest→narrowest. High clears the 1080p macroblock-rate ceiling;
 * Baseline 3.1 is the universal floor every hardware encoder accepts.
 */
export const H264_PROFILE_CANDIDATES = [
	"avc1.640034", // High 5.2
	"avc1.640033", // High 5.1
	"avc1.64002a", // High 4.2
	"avc1.4d0034", // Main 5.2
	"avc1.42e01f", // Baseline 3.1
] as const;

/** Long-edge scale steps: requested, then roughly-half-pixel-budget rungs beneath it. */
export const CLIP_RESOLUTION_STEPS = [1, 0.75, 0.5] as const;

/** Bitrate floor so the smallest rung still reads as a crisp clip rather than mush. */
export const MIN_CLIP_BITRATE = 2_000_000;

export interface ClipTargetRung {
	width: number;
	height: number;
	/** Average bitrate in bits/sec for this rung. */
	bitrate: number;
}

export interface ResolvedClipCodec {
	codec: string;
	width: number;
	height: number;
	bitrate: number;
	/** true when the resolved rung sits below the requested top rung (resolution dropped). */
	steppedDown: boolean;
}

export type CodecSupportProbe = (config: {
	codec: string;
	width: number;
	height: number;
	bitrate: number;
	framerate: number;
}) => Promise<boolean>;

/** Thrown when no rung on the whole ladder is encodable — the honest "can't encode" signal. */
export class ClipCodecUnavailableError extends Error {
	constructor() {
		super(
			"This device can't encode an H.264 clip, even at the lowest fallback resolution.",
		);
		this.name = "ClipCodecUnavailableError";
	}
}

/** Even, ≥2 — H.264 requires mod-2 frame dimensions. */
function toEven(value: number): number {
	return Math.max(2, Math.round(value / 2) * 2);
}

/**
 * Build the resolution/bitrate ladder for a requested clip target. Aspect ratio is
 * preserved (both edges scale by the same step, then round to even); bitrate scales
 * with the pixel count — a 0.5× frame gets ~0.25× the bits — floored so the bottom
 * rung stays watchable. Rungs that round to the same size collapse into one.
 */
export function buildClipTargetLadder(
	width: number,
	height: number,
	bitrate: number,
): ClipTargetRung[] {
	const sourcePixels = width * height;
	const rungs: ClipTargetRung[] = [];
	let lastKey = "";
	for (const step of CLIP_RESOLUTION_STEPS) {
		const w = toEven(width * step);
		const h = toEven(height * step);
		const key = `${w}x${h}`;
		if (key === lastKey) continue;
		lastKey = key;
		const pixelScale = (w * h) / sourcePixels;
		rungs.push({
			width: w,
			height: h,
			bitrate: Math.max(MIN_CLIP_BITRATE, Math.round(bitrate * pixelScale)),
		});
	}
	return rungs;
}

/**
 * Walk the ladder: at each resolution rung, probe profiles widest→narrowest, and
 * drop to the next-lower rung only once every profile there is rejected. Returns the
 * first encodable configuration (with `steppedDown` set when the resolution fell
 * below the request), or `null` when nothing on the ladder is supported.
 */
export async function resolveClipCodec(
	request: { width: number; height: number; framerate: number; bitrate: number },
	probe: CodecSupportProbe,
	profiles: readonly string[] = H264_PROFILE_CANDIDATES,
): Promise<ResolvedClipCodec | null> {
	const ladder = buildClipTargetLadder(request.width, request.height, request.bitrate);
	for (let rungIndex = 0; rungIndex < ladder.length; rungIndex++) {
		const rung = ladder[rungIndex];
		for (const codec of profiles) {
			let supported = false;
			try {
				supported = await probe({
					codec,
					width: rung.width,
					height: rung.height,
					bitrate: rung.bitrate,
					framerate: request.framerate,
				});
			} catch {
				// isConfigSupported can throw on a descriptor the UA dislikes — keep probing.
			}
			if (supported) {
				return {
					codec,
					width: rung.width,
					height: rung.height,
					bitrate: rung.bitrate,
					steppedDown: rungIndex > 0,
				};
			}
		}
	}
	return null;
}
