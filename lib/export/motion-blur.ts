/**
 * Temporal motion blur for the offline export — the difference between a clip that
 * strobes and one that flows.
 *
 * The render loop draws each output frame as the AVERAGE of several sub-frames
 * sampled at slightly different points in time. This module answers the only
 * question that needs to be exact: WHERE in time do those sub-frames sit relative
 * to the frame's nominal instant? They sit inside the "shutter open" window,
 * centered on the frame, spread evenly. Offsets are returned in units of one
 * frame-duration, so the render loop multiplies by its per-frame progress step to
 * get sub-progress values to sample the camera/screen at.
 *
 * Shutter angle is the cinematographer's dial: 360° = open the whole frame
 * (maximal blur), 180° = open half the frame (the filmic default), 90° = a crisp
 * quarter. `shutterFraction` converts the angle to the open fraction of a frame.
 */

/** Open fraction of a single frame for a given shutter angle (clamped to (0,1]). */
export function shutterFraction(shutterAngle: number): number {
	const angle = Number.isFinite(shutterAngle) ? shutterAngle : 180;
	const clamped = Math.min(360, Math.max(1, angle));
	return clamped / 360;
}

/**
 * Sub-frame time offsets (in frame-duration units) for `samples` sub-frames at the
 * given shutter angle. One sample (or fewer) disables blur and renders only at the
 * frame instant. For N>1 the samples are spread evenly across the shutter window
 * and centered on 0, e.g. samples=4 @ 180° → roughly [-0.1875, -0.0625, 0.0625,
 * 0.1875] (mean 0, span = the 0.5 window).
 */
export function subFrameOffsets(samples: number, shutterAngle: number): number[] {
	const n = Math.floor(samples);
	if (!Number.isFinite(n) || n <= 1) {
		return [0];
	}

	const fraction = shutterFraction(shutterAngle);
	const offsets: number[] = [];
	// Evenly spaced sample CENTERS across the window: the i-th of n samples covers
	// the sub-interval [i/n, (i+1)/n) of the window; we sample its midpoint, then
	// shift so the set is centered on 0.
	for (let i = 0; i < n; i++) {
		const center = (i + 0.5) / n - 0.5; // ∈ (-0.5, 0.5)
		offsets.push(center * fraction);
	}
	return offsets;
}

/**
 * A running per-channel sum for averaging motion-blur sub-frames without holding N
 * full RGBA buffers in memory at once (a supersampled frame is large; N copies
 * would be huge). The render loop renders each sub-frame, `add()`s its bytes, then
 * `average()`s into the output buffer and `reset()`s for the next frame.
 */
export class FrameAccumulator {
	private readonly sum: Float64Array;
	private count = 0;
	readonly length: number;

	constructor(length: number) {
		this.length = length;
		this.sum = new Float64Array(length);
	}

	add(buffer: Uint8ClampedArray): void {
		const sum = this.sum;
		const n = Math.min(this.length, buffer.length);
		for (let i = 0; i < n; i++) {
			sum[i] += buffer[i];
		}
		this.count += 1;
	}

	/** Write the rounded average of all added buffers into `out`. */
	average(out: Uint8ClampedArray): Uint8ClampedArray {
		const divisor = this.count || 1;
		for (let i = 0; i < this.length; i++) {
			out[i] = Math.round(this.sum[i] / divisor);
		}
		return out;
	}

	reset(): void {
		this.sum.fill(0);
		this.count = 0;
	}
}
