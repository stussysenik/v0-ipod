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
	palette: GifEncoderPalette | null;
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

async function handleGifFrame(message: AppendGifFrameMessage) {
	if (!activeState || activeState.type !== "gif") {
		throw new Error("GIF encoder has not been started");
	}

	const rgba = new Uint8Array(message.rgba);
	activeState.palette ??= quantize(rgba, 256) as GifEncoderPalette;
	const indexed = applyPalette(rgba, activeState.palette);
	activeState.encoder.writeFrame(indexed, message.width, message.height, {
		palette: activeState.palette,
		repeat: message.frameIndex === 0 ? 0 : undefined,
		delay: message.delayMs,
	});
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

self.onmessage = async (event: MessageEvent<EncoderWorkerRequest>) => {
	const message = event.data;

	try {
		switch (message.type) {
			case "start-gif": {
				activeState = {
					type: "gif",
					encoder: GIFEncoder(),
					palette: null,
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
					firstTimestampBehavior: "offset",
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
					activeState.encoder.finish();
					const bytes = activeState.encoder.bytesView();
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

				await activeState.encoder.flush();
				activeState.encoder.close();
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
