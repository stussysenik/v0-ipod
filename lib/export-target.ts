/**
 * Clamp an offscreen capture target to what the device can actually allocate.
 *
 * The `/3d` still export asks for a fixed 2160×3840 target at 8× MSAA — roughly half a
 * gigabyte of GPU renderbuffer. Desktop GPUs shrug; a phone's WebGL context is killed,
 * which is a primary reason mobile export failed. Two independent ceilings apply:
 *
 *  - **Hard GPU limits** (`maxTextureSize`, `maxSamples` from `renderer.capabilities`):
 *    an allocation past these fails outright.
 *  - **A mobile memory ceiling** (`maxLongEdge`): the dimensions can pass the hard limit
 *    yet still exceed a phone's per-tab memory budget. Capping the long edge trades a
 *    little resolution for an export that completes instead of dropping the context.
 *
 * The scale is uniform, so aspect ratio is preserved exactly (framing is unaffected).
 * On desktop, pass `maxLongEdge: Infinity` and the request passes through untouched.
 */
export interface CaptureTargetRequest {
	width: number;
	height: number;
	samples: number;
}

export interface CaptureLimits {
	/** Hard GPU cap on either texture dimension (`renderer.capabilities.maxTextureSize`). */
	maxTextureSize: number;
	/** Hard GPU cap on MSAA sample count (`renderer.capabilities.maxSamples`). */
	maxSamples: number;
	/** Product ceiling on the longest edge (mobile memory safety). Defaults to no cap. */
	maxLongEdge?: number;
}

/** Long-edge ceiling applied on mobile so a 4K/8× target can't drop the WebGL context. */
export const MOBILE_MAX_LONG_EDGE = 2560;

export function clampCaptureTarget(
	requested: CaptureTargetRequest,
	limits: CaptureLimits,
): CaptureTargetRequest {
	const hardMax = Math.max(1, Math.min(limits.maxTextureSize, limits.maxLongEdge ?? Number.POSITIVE_INFINITY));
	const longest = Math.max(requested.width, requested.height);
	const scale = longest > hardMax ? hardMax / longest : 1;
	return {
		width: Math.max(1, Math.round(requested.width * scale)),
		height: Math.max(1, Math.round(requested.height * scale)),
		samples: Math.max(0, Math.min(requested.samples, limits.maxSamples)),
	};
}
