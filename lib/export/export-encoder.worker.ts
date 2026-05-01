/// <reference lib="webworker" />

import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import type {
	AppendGifFrameMessage,
	AppendMp4FrameMessage,
	EncoderWorkerRequest,
	EncoderWorkerResponse,
} from "@/lib/export/export-encoder-protocol";
import { resolveSupportedMp4EncoderConfig } from "@/lib/export/mp4-support";

type GifEncoderPalette = [number, number, number][];

type GifState = {
	type: "gif";
	encoder: ReturnType<typeof GIFEncoder>;
	width: number;
	height: number;
	frames: { rgba: Uint8Array; delayMs: number }[];
	canvas: OffscreenCanvas;
	ctx: OffscreenCanvasRenderingContext2D;
};

type Mp4State = {
	type: "mp4";
	target: ArrayBufferTarget;
	muxer: Muxer<ArrayBufferTarget>;
	encoder: VideoEncoder;
	canvas: OffscreenCanvas;
	ctx: OffscreenCanvasRenderingContext2D;
	frameRate: number;
};

let activeState: GifState | Mp4State | null = null;

function post(response: EncoderWorkerResponse, transfer?: Transferable[]) {
	self.postMessage(response, transfer ?? []);
}

function fail(id: number, error: unknown) {
	post({
		id,
		type: "error",
		error: error instanceof Error ? error.message : "Unknown export encoder error",
	});
}

/**
 * Floyd-Steinberg dithering — distributes quantization error to neighboring
 * pixels for smoother gradient rendering in 256-color GIFs.
 */
function floydSteinbergDither(
	data: Uint8ClampedArray | Uint8Array,
	width: number,
	height: number,
	palette: GifEncoderPalette,
): void {
	const findClosest = (r: number, g: number, b: number): [number, number, number] => {
		let bestIdx = 0;
		let bestDist = Infinity;
		for (let i = 0; i < palette.length; i++) {
			const dr = r - palette[i][0];
			const dg = g - palette[i][1];
			const db = b - palette[i][2];
			const dist = dr * dr + dg * dg + db * db;
			if (dist < bestDist) {
				bestDist = dist;
				bestIdx = i;
			}
		}
		const c = palette[bestIdx];
		return [c[0], c[1], c[2]];
	};

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = (y * width + x) * 4;
			const oldR = data[idx];
			const oldG = data[idx + 1];
			const oldB = data[idx + 2];

			const [newR, newG, newB] = findClosest(oldR, oldG, oldB);
			data[idx] = newR;
			data[idx + 1] = newG;
			data[idx + 2] = newB;

			const errR = oldR - newR;
			const errG = oldG - newG;
			const errB = oldB - newB;

			const spread = (dx: number, dy: number, weight: number) => {
				const nx = x + dx;
				const ny = y + dy;
				if (nx >= 0 && nx < width && ny < height) {
					const ni = (ny * width + nx) * 4;
					data[ni] = Math.max(
						0,
						Math.min(255, data[ni] + errR * weight),
					);
					data[ni + 1] = Math.max(
						0,
						Math.min(255, data[ni + 1] + errG * weight),
					);
					data[ni + 2] = Math.max(
						0,
						Math.min(255, data[ni + 2] + errB * weight),
					);
				}
			};

			spread(1, 0, 7 / 16);
			spread(-1, 1, 3 / 16);
			spread(0, 1, 5 / 16);
			spread(1, 1, 1 / 16);
		}
	}
}

async function handleGifFrame(message: AppendGifFrameMessage) {
	if (!activeState || activeState.type !== "gif") {
		throw new Error("GIF encoder has not been started");
	}

	const { canvas, ctx } = activeState;
	try {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(message.bitmap, 0, 0, canvas.width, canvas.height);
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		activeState.frames.push({
			rgba: new Uint8Array(imageData.data.buffer),
			delayMs: message.delayMs,
		});
	} finally {
		message.bitmap.close();
	}
}

async function handleMp4Frame(message: AppendMp4FrameMessage) {
	if (!activeState || activeState.type !== "mp4") {
		throw new Error("MP4 encoder has not been started");
	}

	const { canvas, ctx, encoder, frameRate } = activeState;
	try {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(message.bitmap, 0, 0, canvas.width, canvas.height);
	} finally {
		message.bitmap.close();
	}

	const frame = new VideoFrame(canvas, {
		timestamp: message.timestampUs,
		duration: message.durationUs,
	});
	try {
		encoder.encode(frame, {
			keyFrame: message.frameIndex % Math.max(frameRate, 1) === 0,
		});
		if (encoder.encodeQueueSize >= 8) {
			await encoder.flush();
		}
	} finally {
		frame.close();
	}
}

const yieldWorker = () => new Promise((resolve) => setTimeout(resolve, 0));

self.onmessage = async (event: MessageEvent<EncoderWorkerRequest>) => {
	const message = event.data;

	try {
		switch (message.type) {
			case "start-gif": {
				const canvas = new OffscreenCanvas(message.width, message.height);
				const ctx = canvas.getContext("2d", {
					willReadFrequently: true,
				});
				if (!ctx) {
					throw new Error("Failed to create GIF offscreen canvas context");
				}

				activeState = {
					type: "gif",
					encoder: GIFEncoder(),
					width: message.width,
					height: message.height,
					frames: [],
					canvas,
					ctx,
				};
				post({ id: message.id, type: "ok" });
				return;
			}
			case "append-gif-frame": {
				await handleGifFrame(message);
				post({ id: message.id, type: "ok" });
				return;
			}
			case "start-mp4": {
				if (
					typeof OffscreenCanvas === "undefined" ||
					typeof VideoEncoder === "undefined"
				) {
					throw new Error("This browser does not support MP4 export");
				}

				const support = await resolveSupportedMp4EncoderConfig({
					codecCandidates: message.codec
						? [message.codec]
						: undefined,
					width: message.width,
					height: message.height,
					bitrate: message.bitrate,
					framerate: message.frameRate,
				});
				if (!support) {
					throw new Error(
						"H.264 MP4 export is not supported in this browser",
					);
				}

				const target = new ArrayBufferTarget();
				const muxer = new Muxer({
					target,
					fastStart: "in-memory",
					video: {
						codec: "avc",
						width: message.width,
						height: message.height,
						frameRate: message.frameRate,
					},
				});
				const canvas = new OffscreenCanvas(message.width, message.height);
				const ctx = canvas.getContext("2d", {
					alpha: false,
					desynchronized: true,
				});
				if (!ctx) {
					throw new Error(
						"Failed to create MP4 offscreen canvas context",
					);
				}

				const encoder = new VideoEncoder({
					output(chunk, metadata) {
						muxer.addVideoChunk(chunk, metadata);
					},
					error(error) {
						throw error;
					},
				});

				encoder.configure({
					...support.config,
				});

				activeState = {
					type: "mp4",
					target,
					muxer,
					encoder,
					canvas,
					ctx,
					frameRate: message.frameRate,
				};
				post({ id: message.id, type: "ok" });
				return;
			}
			case "append-mp4-frame": {
				await handleMp4Frame(message);
				post({ id: message.id, type: "ok" });
				return;
			}
			case "finalize": {
				if (!activeState) {
					throw new Error("No active export encoder");
				}

				if (activeState.type === "gif") {
					const { frames, width, height, encoder } = activeState;

					if (frames.length === 0) {
						throw new Error("No GIF frames to finalize");
					}

					post({
						id: message.id,
						type: "progress",
						progress: 0.02,
						detail: "Preparing color optimization",
					});
					await yieldWorker();

					// Build global palette from sample frames
					const samplePixels: number[] = [];
					// Increase sample count for better color fidelity
					const sampleCount = Math.min(frames.length, 12);
					for (let i = 0; i < sampleCount; i++) {
						const idx = Math.floor(
							(i / (sampleCount - 1 || 1)) *
								(frames.length - 1),
						);
						const frame = frames[idx];

						post({
							id: message.id,
							type: "progress",
							progress: 0.02 + (i / sampleCount) * 0.08,
							detail: `Sampling frame ${idx + 1} for palette`,
						});
						await yieldWorker();

						// Sample pixels (every 4th pixel to keep sample size manageable)
						for (let p = 0; p < frame.rgba.length; p += 16) {
							samplePixels.push(
								frame.rgba[p],
								frame.rgba[p + 1],
								frame.rgba[p + 2],
								frame.rgba[p + 3],
							);
						}
					}

					post({
						id: message.id,
						type: "progress",
						progress: 0.12,
						detail: "Generating optimal 256-color palette",
					});
					await yieldWorker();

					const globalPalette = quantize(
						new Uint8Array(samplePixels),
						256,
					) as GifEncoderPalette;

					// Write frames with dithering and global palette
					for (let i = 0; i < frames.length; i++) {
						const frame = frames[i];
						// Work on a copy for dithering as it's destructive
						const ditherBuffer = new Uint8Array(frame.rgba);
						floydSteinbergDither(
							ditherBuffer,
							width,
							height,
							globalPalette,
						);
						const indexed = applyPalette(
							ditherBuffer,
							globalPalette,
						);

						encoder.writeFrame(indexed, width, height, {
							palette: globalPalette,
							delay: frame.delayMs,
							repeat: i === 0 ? 0 : undefined,
						});

						if (i % 2 === 0 || i === frames.length - 1) {
							post({
								id: message.id,
								type: "progress",
								progress: 0.15 + (i / frames.length) * 0.82,
								detail: `Encoding frame ${i + 1} of ${frames.length}`,
							});
							await yieldWorker();
						}
					}

					post({
						id: message.id,
						type: "progress",
						progress: 0.98,
						detail: "Packaging GIF",
					});
					await yieldWorker();

					encoder.finish();
					const bytes = encoder.bytesView();
					const buffer = bytes.buffer.slice(
						bytes.byteOffset,
						bytes.byteOffset + bytes.byteLength,
					);
					activeState = null;
					post(
						{
							id: message.id,
							type: "finalized",
							buffer,
							mimeType: "image/gif",
						},
						[buffer],
					);
					return;
				}

				post({
					id: message.id,
					type: "progress",
					progress: 0.92,
					detail: "Finalizing H.264 stream",
				});
				await activeState.encoder.flush();
				activeState.encoder.close();

				post({
					id: message.id,
					type: "progress",
					progress: 0.98,
					detail: "Packaging MP4 container",
				});
				activeState.muxer.finalize();
				const buffer = activeState.target.buffer;
				activeState = null;
				post(
					{
						id: message.id,
						type: "finalized",
						buffer,
						mimeType: "video/mp4",
					},
					[buffer],
				);
				return;
			}
			default: {
				const exhaustive: never = message;
				throw new Error(
					`Unsupported encoder message: ${String(exhaustive)}`,
				);
			}
		}
	} catch (error) {
		fail(message.id, error);
	}
};

export {};
