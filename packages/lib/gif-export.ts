import { GIFEncoder, type GifPalette, applyPalette, quantize } from "gifenc";
import { toPng } from "html-to-image";

const EXPORT_ATTRIBUTE = "data-exporting";

/** Default capture scale — 2x for Instagram-quality output */
const GIF_CAPTURE_SCALE_HIGH = 2;

const waitForNextPaint = () =>
	new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
	);

/**
 * Wait for marquee and CSS animations to start before first frame capture.
 * Uses multiple rAF ticks + a short setTimeout to ensure layout and
 * animation state have settled.
 */
async function waitForAnimationsReady(): Promise<void> {
	await waitForNextPaint();
	await new Promise<void>((resolve) => setTimeout(resolve, 200));
	await waitForNextPaint();
}

async function waitForImages(element: HTMLElement) {
	const images = [...element.querySelectorAll<HTMLImageElement>("img")];

	await Promise.all(
		images.map(
			(image) =>
				new Promise<void>((resolve, reject) => {
					if (image.complete && image.naturalWidth > 0) {
						resolve();
						return;
					}

					const timeoutId = window.setTimeout(() => {
						reject(
							new Error(
								`Image load timeout: ${image.src.slice(0, 96)}`,
							),
						);
					}, 5000);

					image.addEventListener("load", () => {
						window.clearTimeout(timeoutId);
						resolve();
					});
					image.addEventListener("error", () => {
						window.clearTimeout(timeoutId);
						reject(
							new Error(
								`Image load failed: ${image.src.slice(0, 96)}`,
							),
						);
					});
				}),
		),
	);
}

const loadImage = (src: string) =>
	new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image();
		img.addEventListener("load", () => resolve(img));
		img.addEventListener("error", () =>
			reject(new Error("Failed to decode GIF frame")),
		);
		img.src = src;
	});

const drawImageToCanvas = async (src: string) => {
	const img = await loadImage(src);
	const canvas = document.createElement("canvas");
	canvas.width = img.naturalWidth || img.width;
	canvas.height = img.naturalHeight || img.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Missing canvas context");
	}
	ctx.drawImage(img, 0, 0);
	return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

/**
 * Compare two RGBA pixel buffers and return the fraction of pixels that differ.
 * A difference threshold of 4 (per channel) absorbs JPEG/quantization noise.
 */
function frameDifference(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
	if (a.length !== b.length) return 1;
	let diffPixels = 0;
	const totalPixels = a.length / 4;
	for (let i = 0; i < a.length; i += 4) {
		if (
			Math.abs(a[i] - b[i]) > 4 ||
			Math.abs(a[i + 1] - b[i + 1]) > 4 ||
			Math.abs(a[i + 2] - b[i + 2]) > 4
		) {
			diffPixels++;
		}
	}
	return diffPixels / totalPixels;
}

/**
 * Floyd-Steinberg dithering — distributes quantization error to neighboring
 * pixels for smoother gradient rendering in 256-color GIFs.
 */
function floydSteinbergDither(
	data: Uint8ClampedArray,
	width: number,
	height: number,
	palette: GifPalette,
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

export interface GifCaptureOptions {
	element: HTMLElement;
	backgroundColor?: string;
	pixelRatio?: number;
	durationMs?: number;
	fps?: number;
	onProgress?: (progress: number) => void;
	onFrame?: (index: number, total: number) => void;
}

export interface GifCapturedFrames {
	frameDataUrls: string[];
	frameCount: number;
	delayMs: number;
}

export interface GifExportOptions extends GifCaptureOptions {
	filename: string;
}

export interface GifExportResult {
	success: boolean;
	blob?: Blob;
	error?: string;
}

export async function captureGifFrames({
	element,
	backgroundColor,
	pixelRatio = GIF_CAPTURE_SCALE_HIGH,
	durationMs = 2600,
	fps = 12,
	onProgress,
	onFrame,
}: GifCaptureOptions): Promise<GifCapturedFrames> {
	const existingExportAttribute = element.getAttribute(EXPORT_ATTRIBUTE);
	element.setAttribute(EXPORT_ATTRIBUTE, "true");

	try {
		await waitForImages(element);
		// 1.5.1: Pre-capture delay — ensure marquee/CSS animations are running
		await waitForAnimationsReady();

		const frameCount = Math.max(6, Math.floor((durationMs / 1000) * fps));
		const delayMs = Math.max(20, Math.round(1000 / fps));
		const frameDataUrls: string[] = [];

		for (let i = 0; i < frameCount; i += 1) {
			onFrame?.(i, frameCount);
			await waitForNextPaint();

			const frameDataUrl = await toPng(element, {
				cacheBust: true,
				pixelRatio,
				backgroundColor,
				skipFonts: false,
				includeQueryParams: true,
				style: {
					transform: "scale(1)",
				},
			});

			frameDataUrls.push(frameDataUrl);
			onProgress?.((i + 1) / frameCount);
		}

		return {
			frameDataUrls,
			frameCount,
			delayMs,
		};
	} finally {
		if (existingExportAttribute === null) {
			element.removeAttribute(EXPORT_ATTRIBUTE);
		} else {
			element.setAttribute(EXPORT_ATTRIBUTE, existingExportAttribute);
		}
	}
}

/**
 * Build a global 256-color palette from sample frames (first, middle, last).
 * This produces better inter-frame consistency than per-frame quantization.
 */
function buildGlobalPalette(frames: ImageData[]): GifPalette {
	// Sample pixels from first, middle, and last frame
	const sampleIndices = [0, Math.floor(frames.length / 2), frames.length - 1];
	const samplePixels: number[] = [];
	for (const idx of sampleIndices) {
		const frame = frames[Math.min(idx, frames.length - 1)];
		// Sample every 4th pixel to keep the input manageable
		for (let i = 0; i < frame.data.length; i += 16) {
			samplePixels.push(
				frame.data[i],
				frame.data[i + 1],
				frame.data[i + 2],
				frame.data[i + 3],
			);
		}
	}
	return quantize(new Uint8Array(samplePixels), 256);
}

export async function encodeGifFrames(frameDataUrls: string[], delayMs: number): Promise<Blob> {
	if (frameDataUrls.length === 0) {
		throw new Error("GIF preview did not generate any frames");
	}

	// Decode all frames first
	const allFrames: ImageData[] = [];
	for (const url of frameDataUrls) {
		allFrames.push(await drawImageToCanvas(url));
	}

	// 1.5.2: Frame-difference detection — check for static GIF
	let hasMotion = false;
	if (allFrames.length >= 2) {
		for (let i = 1; i < allFrames.length; i++) {
			const diff = frameDifference(allFrames[0].data, allFrames[i].data);
			if (diff > 0.001) {
				hasMotion = true;
				break;
			}
		}
	}

	// If all frames are identical, log a warning (the pre-capture delay
	// should prevent this, but we detect it as a safety net)
	if (!hasMotion && allFrames.length >= 2) {
		console.warn("[gif-export] Static frames detected — animation may not be visible");
	}

	// 1.5.3: Build a single global palette from sample frames
	const globalPalette = buildGlobalPalette(allFrames);

	const gif = GIFEncoder();

	for (let i = 0; i < allFrames.length; i += 1) {
		const frameData = allFrames[i];

		// 1.5.5: Apply Floyd-Steinberg dithering before palette mapping
		const ditheredData = new Uint8ClampedArray(frameData.data);
		floydSteinbergDither(
			ditheredData,
			frameData.width,
			frameData.height,
			globalPalette,
		);

		const indexed = applyPalette(ditheredData, globalPalette);

		gif.writeFrame(indexed, frameData.width, frameData.height, {
			delay: delayMs,
			palette: globalPalette,
			repeat: i === 0 ? 0 : undefined,
		});
	}

	gif.finish();
	const output = Uint8Array.from(gif.bytes());
	return new Blob([output], { type: "image/gif" });
}

export async function exportGif({
	element,
	filename,
	backgroundColor,
	pixelRatio = GIF_CAPTURE_SCALE_HIGH,
	durationMs = 2600,
	fps = 12,
	onProgress,
	onFrame,
}: GifExportOptions): Promise<GifExportResult> {
	void filename;

	try {
		const captured = await captureGifFrames({
			element,
			backgroundColor,
			pixelRatio,
			durationMs,
			fps,
			onProgress,
			onFrame,
		});

		const blob = await encodeGifFrames(captured.frameDataUrls, captured.delayMs);

		return {
			success: true,
			blob,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "GIF export failed",
		};
	}
}
