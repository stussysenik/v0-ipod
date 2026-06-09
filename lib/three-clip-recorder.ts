import { ArrayBufferTarget, Muxer } from "mp4-muxer";

import type { ThreeDIpodHandle } from "@/components/three/three-d-ipod";
import type { CameraMove, LoopStyle, StudioPose } from "@/lib/studio-camera";

/**
 * Encode a high-fidelity MP4 of the 3D iPod.
 *
 * This is NOT a real-time `MediaRecorder` grab. That path streamed the live
 * canvas at wall-clock speed — it dropped frames whenever the GPU hitched, only
 * ever emitted WebM (which IG and Safari reject), and recorded whatever ambient
 * wobble happened to be on screen. Instead we render the clip *offline*: the
 * model snaps to rest with the now-playing screen baked on (the same path the
 * still uses), the camera flies a deterministic seamless-loop orbit, and every
 * frame is rendered supersampled then handed to a WebCodecs `VideoEncoder` and
 * muxed into H.264/MP4. The result is frame-accurate, repeatable, and as crisp
 * as the PNG still — faster than real time, because nothing waits on a clock.
 *
 * Requires WebCodecs (`VideoEncoder`/`VideoFrame`) — Chrome/Edge today, Safari
 * 16.4+. `isClipRecordingSupported()` gates the UI accordingly.
 */
export interface ClipRecorderOptions {
	durationMs?: number;
	fps?: number;
	/** Target average bitrate in bits/sec. */
	bitsPerSecond?: number;
	/** Vertical (IG 9:16) output resolution. */
	width?: number;
	height?: number;
	/** Oversample factor for the offline render before downscale (default 1; MSAA carries AA). */
	supersample?: number;
	/** Which camera move to fly. Defaults to the gentle orbit. */
	move?: CameraMove;
	/** Cadence multiplier (1 = natural); matches the live preview. */
	speed?: number;
	/** loop / boomerang / hold — `hold` renders a motion-free held angle. */
	loop?: LoopStyle;
	/** Hero framing the move is anchored on (the composed pose). */
	anchor?: StudioPose;
	/** Progress callback: frames encoded so far, total frames. Drives the veil %. */
	onProgress?: (encoded: number, total: number) => void;
	/**
	 * Called with clip progress (0→1) right before each screen re-bake. Forwarded
	 * straight to `renderClipFrames` so the app can pin the marquee + song clock to
	 * the deterministic clip timeline at bake time. See lib/export-clock.ts.
	 */
	onClipProgress?: (progress: number) => void;
}

export function isClipRecordingSupported(): boolean {
	return (
		typeof window !== "undefined" &&
		typeof VideoEncoder !== "undefined" &&
		typeof VideoFrame !== "undefined"
	);
}

/**
 * Probe for an H.264 config the platform will actually accept, widest profile
 * first. 1080×1920@30 needs a level that clears the macroblock-rate ceiling, so
 * we lead with High@5.2 and fall back through Main and Baseline.
 */
async function pickH264Codec(
	width: number,
	height: number,
	fps: number,
	bitrate: number,
): Promise<string | null> {
	const candidates = [
		"avc1.640034", // High 5.2
		"avc1.640033", // High 5.1
		"avc1.64002a", // High 4.2
		"avc1.4d0034", // Main 5.2
		"avc1.42e01f", // Baseline 3.1
	];
	for (const codec of candidates) {
		try {
			const support = await VideoEncoder.isConfigSupported({
				codec,
				width,
				height,
				bitrate,
				framerate: fps,
			});
			if (support.supported) return codec;
		} catch {
			// isConfigSupported can throw on malformed descriptors — keep probing.
		}
	}
	return null;
}

export async function recordIpodClip(
	handle: ThreeDIpodHandle,
	options: ClipRecorderOptions = {},
): Promise<Blob | null> {
	const {
		durationMs = 5000,
		fps = 30,
		bitsPerSecond = 14_000_000,
		width = 1080,
		height = 1920,
		supersample = 1,
		move = "orbit",
		speed = 1,
		loop = "loop",
		anchor,
		onProgress,
		onClipProgress,
	} = options;

	if (!isClipRecordingSupported()) return null;

	const codec = await pickH264Codec(width, height, fps, bitsPerSecond);
	if (!codec) return null;

	const muxer = new Muxer({
		target: new ArrayBufferTarget(),
		video: { codec: "avc", width, height, frameRate: fps },
		fastStart: "in-memory",
	});

	let encodeError: DOMException | Error | null = null;
	const encoder = new VideoEncoder({
		output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
		error: (error) => {
			encodeError = error;
		},
	});
	encoder.configure({
		codec,
		width,
		height,
		bitrate: bitsPerSecond,
		framerate: fps,
		latencyMode: "quality",
	});

	const frameDurationUs = 1_000_000 / fps;

	try {
		await handle.renderClipFrames(
			{ width, height, supersample, durationMs, fps, move, speed, loop, anchor, onClipProgress },
			async (frameCanvas, index, total) => {
				if (encodeError) throw encodeError;

				// Construct synchronously: VideoFrame snapshots the canvas now, before
				// the render loop reuses it for the next frame.
				const frame = new VideoFrame(frameCanvas, {
					timestamp: Math.round(index * frameDurationUs),
					duration: Math.round(frameDurationUs),
				});
				// Keyframe once per second keeps the file seekable and loop-friendly.
				encoder.encode(frame, { keyFrame: index % fps === 0 });
				frame.close();

				onProgress?.(index + 1, total);

				// Backpressure: don't let the encoder queue run away on a fast machine.
				if (encoder.encodeQueueSize > 6) {
					while (encoder.encodeQueueSize > 2) {
						await new Promise((resolve) => setTimeout(resolve, 4));
						if (encodeError) throw encodeError;
					}
				}
			},
		);

		await encoder.flush();
		if (encodeError) throw encodeError;
		muxer.finalize();

		const { buffer } = muxer.target as ArrayBufferTarget;
		return new Blob([buffer], { type: "video/mp4" });
	} finally {
		if (encoder.state !== "closed") encoder.close();
	}
}
