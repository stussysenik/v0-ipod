export type AnimatedExportFormat = "gif" | "mp4";
/**
 * Quality tiers. `cinema` is the new high-water mark: 60fps with a fat bitrate for
 * buttery, long-form exports. `standard`/`pro` are unchanged so existing flows and
 * tests keep their exact behaviour.
 */
export type AnimatedExportQuality = "standard" | "pro" | "cinema";
export type AnimatedExportLayout = "original" | "ig-story";

export const MIN_ANIMATED_EXPORT_DURATION_SECONDS = 2;
/** Raised to allow long-form clips (the "long" in buttery long exports). */
export const MAX_ANIMATED_EXPORT_DURATION_SECONDS = 180;
export const DEFAULT_ANIMATED_EXPORT_DURATION_SECONDS = 4;

export const GIF_QUALITY_CONFIG = {
	standard: { fps: 10, scale: 1.5 },
	pro: { fps: 12, scale: 2.5 },
	cinema: { fps: 16, scale: 3.0 },
} as const;

export const MP4_QUALITY_CONFIG = {
	standard: { fps: 12, bitrate: 12_000_000, scale: 2.0 },
	pro: { fps: 30, bitrate: 50_000_000, scale: 3.375 },
	cinema: { fps: 60, bitrate: 90_000_000, scale: 3.0 },
} as const;

export const DEFAULT_GIF_EXPORT_FPS = GIF_QUALITY_CONFIG.standard.fps;
export const DEFAULT_MP4_EXPORT_FPS = MP4_QUALITY_CONFIG.standard.fps;
export const MP4_BITRATE_BITS_PER_SECOND = MP4_QUALITY_CONFIG.standard.bitrate;
export const GIF_CAPTURE_SCALE_HIGH = GIF_QUALITY_CONFIG.pro.scale;
export const GIF_CAPTURE_SCALE_BALANCED = GIF_QUALITY_CONFIG.standard.scale;
export const MP4_CAPTURE_SCALES = [3.375, 2.5, 2.0, 1.5, 1.0] as const;

export const MAX_GIF_FRAME_COUNT = 900;
/** Long-form headroom: 180s × 60fps cinema clips. */
export const MAX_MP4_FRAME_COUNT = 10_800;

/** Cinematic default shutter angle (180° = half the frame open). */
export const DEFAULT_SHUTTER_ANGLE = 180;

export interface AnimatedExportPlan {
	targetWidth: number;
	targetHeight: number;
	captureWidth: number;
	captureHeight: number;
	captureDurationMs: number;
	frameCount: number;
	frameDelayMs: number;
	/** Temporal-AA sub-frames averaged per output frame (1 = motion blur off). */
	motionBlurSamples: number;
	/** Shutter angle (degrees) controlling the motion-blur window width. */
	shutterAngle: number;
}

export function clampAnimatedExportDurationSeconds(value: number): number {
	if (!Number.isFinite(value)) {
		return DEFAULT_ANIMATED_EXPORT_DURATION_SECONDS;
	}

	return Math.min(
		MAX_ANIMATED_EXPORT_DURATION_SECONDS,
		Math.max(MIN_ANIMATED_EXPORT_DURATION_SECONDS, Math.round(value)),
	);
}

export function ensureEvenDimension(value: number): number {
	const rounded = Math.max(2, Math.round(value));
	return rounded % 2 === 0 ? rounded : rounded + 1;
}

export function buildAnimatedExportPlan(
	targetWidth: number,
	targetHeight: number,
	options: {
		durationSeconds?: number;
		fps: number;
		maxFrameCount: number;
		captureScale: number;
		layout?: AnimatedExportLayout;
		motionBlurSamples?: number;
		shutterAngle?: number;
	},
): AnimatedExportPlan {
	const safeTargetWidth = Math.max(1, Math.ceil(targetWidth));
	const safeTargetHeight = Math.max(1, Math.ceil(targetHeight));
	const durationSeconds = clampAnimatedExportDurationSeconds(
		options.durationSeconds ?? DEFAULT_ANIMATED_EXPORT_DURATION_SECONDS,
	);
	const captureDurationMs = durationSeconds * 1000;
	const requestedFrameDelayMs = 1000 / Math.max(options.fps, 1);
	const frameCount = Math.max(
		1,
		Math.min(
			options.maxFrameCount,
			Math.ceil(captureDurationMs / requestedFrameDelayMs),
		),
	);

	let finalTargetWidth = safeTargetWidth;
	let finalTargetHeight = safeTargetHeight;

	if (options.layout === "ig-story") {
		// Force 9:16 aspect ratio by expanding the canvas
		const targetAspect = 9 / 16;
		const currentAspect = safeTargetWidth / safeTargetHeight;

		if (currentAspect > targetAspect) {
			// Current is wider than 9:16, increase height
			finalTargetHeight = safeTargetWidth / targetAspect;
		} else {
			// Current is taller than 9:16, increase width
			finalTargetWidth = safeTargetHeight * targetAspect;
		}
	}

	return {
		targetWidth: Math.round(finalTargetWidth),
		targetHeight: Math.round(finalTargetHeight),
		captureWidth: ensureEvenDimension(finalTargetWidth * options.captureScale),
		captureHeight: ensureEvenDimension(finalTargetHeight * options.captureScale),
		captureDurationMs,
		frameCount,
		frameDelayMs: captureDurationMs / frameCount,
		motionBlurSamples: Math.max(1, Math.floor(options.motionBlurSamples ?? 1)),
		shutterAngle: options.shutterAngle ?? DEFAULT_SHUTTER_ANGLE,
	};
}
