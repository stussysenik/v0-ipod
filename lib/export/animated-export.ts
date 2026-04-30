export type AnimatedExportFormat = "gif" | "mp4";

export const MIN_ANIMATED_EXPORT_DURATION_SECONDS = 2;
export const MAX_ANIMATED_EXPORT_DURATION_SECONDS = 20;
export const DEFAULT_ANIMATED_EXPORT_DURATION_SECONDS = 4;
export const DEFAULT_GIF_EXPORT_FPS = 10;
export const DEFAULT_MP4_EXPORT_FPS = 12;
export const MAX_GIF_FRAME_COUNT = 120;
export const MAX_MP4_FRAME_COUNT = 96;
export const GIF_CAPTURE_SCALE_HIGH = 1.25;
export const GIF_CAPTURE_SCALE_BALANCED = 1;
export const MP4_CAPTURE_SCALES = [1, 0.85, 0.75] as const;
export const MP4_BITRATE_BITS_PER_SECOND = 4_500_000;

export interface AnimatedExportPlan {
	targetWidth: number;
	targetHeight: number;
	captureWidth: number;
	captureHeight: number;
	captureDurationMs: number;
	frameCount: number;
	frameDelayMs: number;
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

	return {
		targetWidth: safeTargetWidth,
		targetHeight: safeTargetHeight,
		captureWidth: ensureEvenDimension(safeTargetWidth * options.captureScale),
		captureHeight: ensureEvenDimension(safeTargetHeight * options.captureScale),
		captureDurationMs,
		frameCount,
		frameDelayMs: captureDurationMs / frameCount,
	};
}
