import { toBlob, toPng, toCanvas } from "html-to-image";

import {
	resolveMobileExportDelivery,
	type ExportCapabilities,
} from "@/lib/export-delivery";
import {
	DEFAULT_GIF_EXPORT_FPS,
	DEFAULT_MP4_EXPORT_FPS,
	GIF_CAPTURE_SCALE_BALANCED,
	GIF_CAPTURE_SCALE_HIGH,
	MAX_GIF_FRAME_COUNT,
	MP4_BITRATE_BITS_PER_SECOND,
	buildAnimatedExportPlan,
} from "@/lib/export/animated-export";
import type {
	EncoderWorkerRequestPayload,
	EncoderWorkerRequest,
	EncoderWorkerResponse,
} from "@/lib/export/export-encoder-protocol";
import {
	resolveMp4ExportStrategy,
	resolveSupportedMp4EncoderConfig,
} from "@/lib/export/mp4-support";
import { getMarqueeCycleDurationMs, getMarqueeFrame } from "@/lib/marquee";

export type ExportStatus = "idle" | "preparing" | "encoding" | "sharing" | "success" | "error";

export interface ExportProgress {
	stage:
		| "settling"
		| "cloning"
		| "capturing"
		| "encoding"
		| "finalizing"
		| "downloading"
		| "sharing"
		| "complete"
		| "error";
	label: string;
	detail?: string;
	progress: number;
	currentFrame?: number;
	totalFrames?: number;
	etaSeconds?: number;
}

const EXPORT_ATTRIBUTE = "data-exporting";
const MAX_EXPORT_SETTLE_DELAY_MS = 900;
const EXPORT_PIPELINE_VERSION = "2026-02-20-detached-boundary-v3";
const GIF_DELAY_QUANTUM_MS = 10;
const EXPORT_SHELL_BORDER_COLOR = "rgba(96,102,110,0.24)";
const EXPORT_SHELL_CONTOUR =
	"0 0 0 1px rgba(70,76,84,0.12), inset 0 2px 0 rgba(255,255,255,0.56), inset 0 -2px 0 rgba(0,0,0,0.06)";

type NextDataWindow = Window & {
	__NEXT_DATA__?: {
		buildId?: string;
	};
};

type ShareCapableNavigator = Navigator & {
	canShare?: (data?: ShareData) => boolean;
	share?: (data?: ShareData) => Promise<void>;
	userActivation?: {
		isActive?: boolean;
		hasBeenActive?: boolean;
	};
};

type SavePickerWindow = Window & {
	showSaveFilePicker?: (options?: {
		suggestedName?: string;
		types?: Array<{
			description?: string;
			accept: Record<string, string[]>;
		}>;
	}) => Promise<{
		createWritable: () => Promise<{
			write: (data: Blob) => Promise<void>;
			close: () => Promise<void>;
		}>;
	}>;
};

const waitForMs = (ms: number) =>
	new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, ms)));

const waitForNextPaint = () =>
	new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
	);

function roundGifDelayMs(value: number): number {
	return Math.max(
		GIF_DELAY_QUANTUM_MS,
		Math.round(Math.max(value, GIF_DELAY_QUANTUM_MS) / GIF_DELAY_QUANTUM_MS) *
			GIF_DELAY_QUANTUM_MS,
	);
}

function parseCssTimeToMs(value: string): number {
	const trimmed = value.trim();
	if (!trimmed) return 0;
	if (trimmed.endsWith("ms")) return Number.parseFloat(trimmed) || 0;
	if (trimmed.endsWith("s")) return (Number.parseFloat(trimmed) || 0) * 1000;
	return Number.parseFloat(trimmed) || 0;
}

function longestTimelineMs(durations: string[], delays: string[]): number {
	if (durations.length === 0) {
		return 0;
	}

	let maxMs = 0;
	const count = Math.max(durations.length, delays.length || 1);
	for (let i = 0; i < count; i += 1) {
		const duration = parseCssTimeToMs(durations[i % durations.length] ?? "0ms");
		const delay = parseCssTimeToMs(delays[i % (delays.length || 1)] ?? "0ms");
		maxMs = Math.max(maxMs, duration + delay);
	}
	return maxMs;
}

function getMaxVisualSettleDelayMs(element: HTMLElement): number {
	if (typeof window === "undefined") {
		return 0;
	}

	const nodes = [element, ...element.querySelectorAll<HTMLElement>("*")];
	let maxMs = 0;

	for (const node of nodes) {
		const style = window.getComputedStyle(node);
		const transitionMs = longestTimelineMs(
			style.transitionDuration.split(","),
			style.transitionDelay.split(","),
		);
		const animationMs = longestTimelineMs(
			style.animationDuration.split(","),
			style.animationDelay.split(","),
		);
		maxMs = Math.max(maxMs, transitionMs, animationMs);
		if (maxMs >= MAX_EXPORT_SETTLE_DELAY_MS) {
			return MAX_EXPORT_SETTLE_DELAY_MS;
		}
	}

	return Math.min(maxMs, MAX_EXPORT_SETTLE_DELAY_MS);
}

/**
 * Convert an image to a base64 data URL
 */
async function imageToDataUrl(img: HTMLImageElement): Promise<string> {
	// If already a data URL, return as-is
	if (img.src.startsWith("data:")) {
		return img.src;
	}

	// Create canvas and draw image
	const canvas = document.createElement("canvas");
	canvas.width = img.naturalWidth || img.width;
	canvas.height = img.naturalHeight || img.height;
	const ctx = canvas.getContext("2d");

	if (!ctx) {
		throw new Error("Failed to get canvas context");
	}

	ctx.drawImage(img, 0, 0);

	// Return as PNG data URL
	return canvas.toDataURL("image/png");
}

/**
 * Wait for an image to fully load
 */
function waitForImageLoad(img: HTMLImageElement): Promise<void> {
	return new Promise((resolve, reject) => {
		if (img.complete && img.naturalWidth > 0) {
			resolve();
			return;
		}

		const timeoutId = setTimeout(() => {
			reject(new Error(`Image load timeout: ${img.src.slice(0, 100)}`));
		}, 5000);

		img.addEventListener("load", () => {
			clearTimeout(timeoutId);
			resolve();
		});

		img.addEventListener("error", () => {
			clearTimeout(timeoutId);
			reject(new Error(`Image load failed: ${img.src.slice(0, 100)}`));
		});
	});
}

/**
 * Preload and embed all images in the element as inline data URLs
 * This ensures html-to-image can capture them correctly
 */
async function preloadAndEmbedImages(element: HTMLElement): Promise<void> {
	const images = element.querySelectorAll("img");

	const imagePromises = [...images].map(async (img) => {
		try {
			// Wait for image to load
			await waitForImageLoad(img);

			// Skip if no valid image
			if (!img.naturalWidth || !img.naturalHeight) {
				console.warn("Skipping invalid image:", img.src.slice(0, 100));
				return;
			}

			// Convert to data URL if not already
			if (!img.src.startsWith("data:")) {
				const dataUrl = await imageToDataUrl(img);
				img.src = dataUrl;
			}
		} catch (error) {
			console.warn("Failed to preload image:", error);
			// Don't fail the entire export for one image
		}
	});

	await Promise.all(imagePromises);
}

function createDetachedExportNode(
	element: HTMLElement,
	options?: {
		constrainedFrame?: boolean;
	},
): HTMLElement {
	const constrainedFrame = options?.constrainedFrame ?? false;
	const rect = element.getBoundingClientRect();
	const width = Math.ceil(element.offsetWidth || rect.width || 1);
	const height = Math.ceil(element.offsetHeight || rect.height || 1);
	const clone = element.cloneNode(true) as HTMLElement;

	clone.setAttribute("aria-hidden", "true");
	clone.style.position = "fixed";
	// Keep clone at viewport origin with negative stacking order so detached
	// capture avoids off-screen shadow clipping artifacts in some renderers.
	clone.style.left = "0";
	clone.style.top = "0";
	clone.style.zIndex = "-2147483647";
	clone.style.margin = "0";
	clone.style.pointerEvents = "none";
	clone.style.width = `${width}px`;
	clone.style.height = `${height}px`;
	clone.style.maxWidth = "none";
	clone.style.maxHeight = "none";
	clone.style.overflow = constrainedFrame ? "hidden" : "visible";
	clone.style.transform = "none";
	clone.style.transformOrigin = "top left";
	clone.style.isolation = "isolate";
	clone.setAttribute(EXPORT_ATTRIBUTE, "true");
	sanitizeDetachedCloneForCapture(clone, { constrainedFrame });

	// Freeze animations/transitions to avoid capturing in-between visual states.
	const freezeStyle = document.createElement("style");
	freezeStyle.textContent = `
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
      caret-color: transparent !important;
    }
    [data-export-layer] {
      filter: none !important;
    }
    [data-export-layer="shell"] {
      border-color: ${EXPORT_SHELL_BORDER_COLOR} !important;
      box-shadow: ${EXPORT_SHELL_CONTOUR} !important;
    }
    [data-export-layer="screen"] {
      box-shadow: none !important;
    }
    [data-export-layer="artwork"] {
      box-shadow: none !important;
    }
    [data-export-layer="wheel"] {
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.92), inset 0 -1px 0 rgba(0,0,0,0.05) !important;
    }
    [data-export-layer="wheel-center"] {
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.04) !important;
    }
    [data-marquee-container] {
      mask-image: none !important;
      -webkit-mask-image: none !important;
    }
  `;
	clone.appendChild(freezeStyle);

	document.body.appendChild(clone);
	return clone;
}

function sanitizeDetachedCloneForCapture(
	clone: HTMLElement,
	options?: {
		constrainedFrame?: boolean;
	},
): void {
	const constrainedFrame = options?.constrainedFrame ?? false;
	const shell = clone.querySelector<HTMLElement>('[data-export-layer="shell"]');
	if (shell) {
		shell.style.borderColor = constrainedFrame
			? EXPORT_SHELL_BORDER_COLOR
			: "rgba(0,0,0,0.12)";
		shell.style.boxShadow = EXPORT_SHELL_CONTOUR;
	}

	const screen = clone.querySelector<HTMLElement>('[data-export-layer="screen"]');
	if (screen) {
		screen.style.boxShadow = "inset 0 0 0 1px rgba(0,0,0,0.4), inset 0 1px 2px rgba(0,0,0,0.5)";
	}

	const artwork = clone.querySelector<HTMLElement>('[data-export-layer="artwork"]');
	if (artwork) {
		artwork.style.boxShadow = "0 1px 3px rgba(0,0,0,0.14)";
	}

	const wheel = clone.querySelector<HTMLElement>('[data-export-layer="wheel"]');
	if (wheel) {
		wheel.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.05)";
	}

	const wheelCenter = clone.querySelector<HTMLElement>('[data-export-layer="wheel-center"]');
	if (wheelCenter) {
		wheelCenter.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.86), inset 0 -1px 0 rgba(0,0,0,0.03)";
	}

	const layeredNodes = clone.querySelectorAll<HTMLElement>("[data-export-layer]");
	for (const node of layeredNodes) {
		node.style.filter = "none";
	}

	const allNodes = clone.querySelectorAll<HTMLElement>("*");
	for (const node of allNodes) {
		if (node.style.backgroundImage.includes("noiseFilter")) {
			node.style.backgroundImage = "none";
		}
	}
}

function resolveRuntimeBuildContext() {
	if (typeof window === "undefined") {
		return { deployVersion: "server", buildId: "server" };
	}

	const nextData = window as NextDataWindow;
	const buildId = nextData.__NEXT_DATA__?.buildId ?? "unknown";
	const deployVersion =
		document.documentElement.getAttribute("data-deploy-version") ?? "unknown";
	return { deployVersion, buildId };
}

function removeExportNode(node: HTMLElement | null): void {
	if (node) {
		node.remove();
	}
}

function dataUrlToBlob(dataUrl: string): Blob {
	const [meta, data] = dataUrl.split(",");
	const mime =
		meta.match(/^data:(.*?);base64$/)?.[1] ??
		meta.match(/^data:(.*?);/)?.[1] ??
		"image/png";

	const binary = atob(data);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.codePointAt(i) ?? 0;
	}
	return new Blob([bytes], { type: mime });
}

async function summarizeBlob(blob: Blob): Promise<{ blobSize: number; blobDigest: string }> {
	try {
		const arrayBuffer = await blob.arrayBuffer();
		const digestBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
		const digestHex = [...new Uint8Array(digestBuffer)]
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return {
			blobSize: blob.size,
			blobDigest: digestHex,
		};
	} catch {
		return {
			blobSize: blob.size,
			blobDigest: "unavailable",
		};
	}
}

function parseNumericDataAttribute(value: string | undefined): number | null {
	if (!value) return null;
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function getMarqueeCaptureNodes(root: HTMLElement): MarqueeCaptureNode[] {
	return [...root.querySelectorAll<HTMLElement>('[data-marquee-container="true"]')].flatMap(
		(container) => {
			const track = container.querySelector<HTMLElement>(
				'[data-marquee-track="true"]',
			);
			if (!track) {
				return [];
			}

			const containerWidth =
				parseNumericDataAttribute(container.dataset.marqueeViewportWidth) ??
				Math.ceil(container.clientWidth);
			const contentWidth =
				parseNumericDataAttribute(container.dataset.marqueeContentWidth) ??
				Math.ceil(track.scrollWidth);

			if (containerWidth <= 0 || contentWidth <= 0) {
				return [];
			}

			return [
				{
					track,
					initialElapsedMs:
						parseNumericDataAttribute(
							container.dataset.marqueeElapsedMs,
						) ?? 0,
					metrics: {
						containerWidth: Math.ceil(containerWidth),
						contentWidth: Math.ceil(contentWidth),
						gapWidth: 0,
					},
				},
			];
		},
	);
}

function formatExportTime(seconds: number, isRemaining: boolean): string {
	const clamped = Math.max(0, seconds);
	const m = Math.floor(clamped / 60);
	const s = Math.floor(clamped % 60);
	return `${isRemaining ? "-" : ""}${m}:${s.toString().padStart(2, "0")}`;
}

function flushAnimatedCloneLayout(root: HTMLElement): void {
	void root.offsetWidth;
	const animatedNodes = root.querySelectorAll<HTMLElement>(
		'[data-marquee-track="true"], [data-testid="progress-fill"], [data-testid="elapsed-time"], [data-testid="remaining-time"]',
	);
	for (const node of animatedNodes) {
		void node.offsetWidth;
	}
}

function applyAnimationFrameToClone(root: HTMLElement, elapsedMs: number): number {
	// 1. Apply marquee translateX (existing logic)
	const nodes = getMarqueeCaptureNodes(root);
	let cycleDurationMs = 0;

	for (const node of nodes) {
		const frame = getMarqueeFrame(node.metrics, node.initialElapsedMs + elapsedMs);
		node.track.style.transform = `translateX(${frame.translateX}px)`;
		cycleDurationMs = Math.max(
			cycleDurationMs,
			getMarqueeCycleDurationMs(node.metrics),
		);
	}

	// 2. Animate progress bar and timestamps (standard iPod screen)
	const progressSection = root.querySelector<HTMLElement>('[data-testid="screen-progress"]');
	const elapsedWrapper = root.querySelector<HTMLElement>('[data-testid="elapsed-time"]');
	const remainingWrapper = root.querySelector<HTMLElement>('[data-testid="remaining-time"]');
	const elapsedEl =
		elapsedWrapper?.querySelector<HTMLElement>("[data-export-time-value]") ??
		elapsedWrapper;
	const remainingEl =
		remainingWrapper?.querySelector<HTMLElement>("[data-export-time-value]") ??
		remainingWrapper;
	const progressFill = root.querySelector<HTMLElement>('[data-testid="progress-fill"]');

	const baseDuration =
		parseNumericDataAttribute(root.dataset.exportBaseDuration) ??
		parseNumericDataAttribute(
			progressSection?.dataset.exportDuration ??
				root.querySelector<HTMLElement>('[data-testid="progress-track"]')?.dataset.exportDuration ??
				root.querySelector<HTMLElement>('[data-testid="ascii-pre"]')
					?.dataset.exportDuration,
		);
	const baseCurrentTime =
		parseNumericDataAttribute(root.dataset.exportBaseCurrentTime) ??
		parseNumericDataAttribute(
			elapsedEl?.dataset.exportTimeValue ??
				root.querySelector<HTMLElement>('[data-testid="ascii-pre"]')
					?.dataset.exportTimeValue,
		);

	if (baseDuration !== null && !root.dataset.exportBaseDuration) {
		root.dataset.exportBaseDuration = String(baseDuration);
	}
	if (baseCurrentTime !== null && !root.dataset.exportBaseCurrentTime) {
		root.dataset.exportBaseCurrentTime = String(baseCurrentTime);
	}

	if (baseDuration !== null && baseDuration > 0 && baseCurrentTime !== null) {
		const simulatedTime = Math.min(baseCurrentTime + elapsedMs / 1000, baseDuration);
		const progressPct = (simulatedTime / baseDuration) * 100;

		if (progressFill) {
			progressFill.style.width = `${progressPct}%`;
		}
		if (elapsedEl) {
			elapsedEl.textContent = formatExportTime(simulatedTime, false);
		}
		if (remainingEl) {
			remainingEl.textContent = formatExportTime(
				baseDuration - simulatedTime,
				true,
			);
		}

		// 3. Animate ASCII mode <pre> block if present
		const asciiPre = root.querySelector<HTMLElement>('[data-testid="ascii-pre"]');
		if (asciiPre) {
			const PROGRESS_COLS = 27;
			const filledCount = Math.round(
				(simulatedTime / baseDuration) * PROGRESS_COLS,
			);
			const emptyCount = PROGRESS_COLS - filledCount;
			const progressBar =
				"\u2593".repeat(filledCount) + "\u2591".repeat(emptyCount);
			const elapsedStr = formatExportTime(simulatedTime, false);
			const remainingStr = formatExportTime(baseDuration - simulatedTime, true);
			const timeInner = 28;
			const timeGap = Math.max(
				timeInner - elapsedStr.length - remainingStr.length,
				1,
			);
			const timeLine = ` ${elapsedStr}${" ".repeat(timeGap)}${remainingStr} `;

			const lines = asciiPre.textContent?.split("\n") ?? [];
			if (lines.length >= 11) {
				lines[8] = `\u2502 ${progressBar}  \u2502`;
				lines[9] = `\u2502${timeLine}\u2502`;
				asciiPre.textContent = lines.join("\n");
			}
		}
	}

	return cycleDurationMs;
}

async function captureGifFrameCanvas(
	element: HTMLElement,
	options: {
		backgroundColor?: string;
		pixelRatio?: number;
		outputWidth: number;
		outputHeight: number;
	},
): Promise<HTMLCanvasElement> {
	const sourceCanvas = await toCanvas(element, {
		backgroundColor: options.backgroundColor ?? undefined,
		pixelRatio: Math.max(options.pixelRatio ?? 1, 1),
		cacheBust: true,
		skipFonts: false,
		style: {
			transform: "scale(1)",
		},
		filter: (node: Node) => {
			if (node instanceof HTMLElement && node.tagName === "SCRIPT") {
				return false;
			}
			return true;
		},
	});

	if (
		sourceCanvas.width === options.outputWidth &&
		sourceCanvas.height === options.outputHeight
	) {
		return sourceCanvas;
	}

	const normalizedCanvas = document.createElement("canvas");
	normalizedCanvas.width = options.outputWidth;
	normalizedCanvas.height = options.outputHeight;
	const normalizedCtx = normalizedCanvas.getContext("2d");
	if (!normalizedCtx) {
		throw new Error("Failed to get normalized GIF canvas context");
	}

	normalizedCtx.imageSmoothingEnabled = true;
	normalizedCtx.imageSmoothingQuality = "high";
	normalizedCtx.drawImage(sourceCanvas, 0, 0, options.outputWidth, options.outputHeight);
	return normalizedCanvas;
}

async function decodeBlobToImageData(blob: Blob): Promise<ImageData> {
	const sampleCanvas = document.createElement("canvas");
	sampleCanvas.width = 96;
	sampleCanvas.height = 96;
	const sampleCtx = sampleCanvas.getContext("2d");
	if (!sampleCtx) {
		throw new Error("Failed to get sample canvas context");
	}

	if ("createImageBitmap" in window) {
		const bitmap = await createImageBitmap(blob);
		try {
			sampleCtx.drawImage(bitmap, 0, 0, sampleCanvas.width, sampleCanvas.height);
		} finally {
			bitmap.close();
		}
	} else {
		const url = URL.createObjectURL(blob);
		try {
			const img = await new Promise<HTMLImageElement>((resolve, reject) => {
				const image = new Image();
				image.addEventListener("load", () => resolve(image));
				image.addEventListener("error", () =>
					reject(new Error("Failed to decode exported blob")),
				);
				image.src = url;
			});
			sampleCtx.drawImage(img, 0, 0, sampleCanvas.width, sampleCanvas.height);
		} finally {
			URL.revokeObjectURL(url);
		}
	}

	return sampleCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height);
}

interface BlankMetrics {
	opaquePixels: number;
	spread: number;
	lumaVariance: number;
	edgeStrength: number;
}

function computeBlankMetrics(
	imageData: ImageData,
	startX: number,
	endX: number,
	startY: number,
	endY: number,
): BlankMetrics {
	const { data, width } = imageData;
	let opaquePixels = 0;
	let minR = 255;
	let minG = 255;
	let minB = 255;
	let maxR = 0;
	let maxG = 0;
	let maxB = 0;
	let sumLuma = 0;
	let sumSqLuma = 0;
	let edgeAccumulator = 0;

	for (let y = startY; y < endY; y += 1) {
		for (let x = startX; x < endX; x += 1) {
			const i = (y * width + x) * 4;
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			const a = data[i + 3];

			if (a < 10) {
				continue;
			}

			opaquePixels += 1;
			if (r < minR) minR = r;
			if (g < minG) minG = g;
			if (b < minB) minB = b;
			if (r > maxR) maxR = r;
			if (g > maxG) maxG = g;
			if (b > maxB) maxB = b;

			const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
			sumLuma += luma;
			sumSqLuma += luma * luma;

			if (x > startX) {
				const left = i - 4;
				const leftLuma =
					0.2126 * data[left] +
					0.7152 * data[left + 1] +
					0.0722 * data[left + 2];
				edgeAccumulator += Math.abs(luma - leftLuma);
			}
			if (y > startY) {
				const up = i - width * 4;
				const upLuma =
					0.2126 * data[up] +
					0.7152 * data[up + 1] +
					0.0722 * data[up + 2];
				edgeAccumulator += Math.abs(luma - upLuma);
			}
		}
	}

	if (opaquePixels === 0) {
		return {
			opaquePixels: 0,
			spread: 0,
			lumaVariance: 0,
			edgeStrength: 0,
		};
	}

	const meanLuma = sumLuma / opaquePixels;
	const lumaVariance = Math.max(sumSqLuma / opaquePixels - meanLuma * meanLuma, 0);
	const spread = maxR - minR + (maxG - minG) + (maxB - minB);
	const edgeStrength = edgeAccumulator / (opaquePixels * 255 * 2);

	return {
		opaquePixels,
		spread,
		lumaVariance,
		edgeStrength,
	};
}

async function isLikelyBlankCapture(blob: Blob): Promise<boolean> {
	try {
		const imageData = await decodeBlobToImageData(blob);
		const { width, height } = imageData;

		const full = computeBlankMetrics(imageData, 0, width, 0, height);
		const insetX = Math.floor(width * 0.18);
		const insetY = Math.floor(height * 0.18);
		const center = computeBlankMetrics(
			imageData,
			insetX,
			width - insetX,
			insetY,
			height - insetY,
		);

		if (full.opaquePixels < 64 || center.opaquePixels < 36) {
			return true;
		}

		// Keep this strict so we only reject truly empty/monochrome captures.
		const fullFlat =
			full.spread < 6 && full.lumaVariance < 2 && full.edgeStrength < 0.002;
		const centerFlat =
			center.spread < 8 && center.lumaVariance < 3 && center.edgeStrength < 0.003;

		return fullFlat && centerFlat;
	} catch {
		// If we can't inspect, don't block export.
		return false;
	}
}

export interface ExportResult {
	success: boolean;
	method: "share" | "download" | "dataurl" | "manual" | "prompt";
	capturePath?: string;
	blobSize?: number;
	blobDigest?: string;
	error?: string;
}

interface DownloadAttemptResult {
	success: boolean;
	usedPopup: boolean;
}

interface MarqueeCaptureNode {
	track: HTMLElement;
	initialElapsedMs: number;
	metrics: {
		containerWidth: number;
		contentWidth: number;
		gapWidth: number;
	};
}

function triggerDownloadLinkWithOptions(
	href: string,
	filename: string,
	allowSyntheticClick: boolean,
): boolean {
	if (!allowSyntheticClick) {
		return false;
	}

	try {
		const link = document.createElement("a");
		link.download = filename;
		link.href = href;
		link.rel = "noopener noreferrer";
		link.style.display = "none";
		document.body.appendChild(link);
		link.click();
		requestAnimationFrame(() => {
			link.remove();
		});
		return true;
	} catch {
		return false;
	}
}

function openPreparedPopupWindow(): Window | null {
	try {
		const popup = window.open("", "_blank");
		if (popup?.document) {
			popup.document.title = "Preparing export...";
			popup.document.body.style.margin = "0";
			popup.document.body.style.fontFamily = "system-ui, sans-serif";
			popup.document.body.style.padding = "16px";
			popup.document.body.textContent = "Preparing image...";
		}
		return popup;
	} catch {
		return null;
	}
}

function buildSavePickerTypes(filename: string, mimeType: string) {
	const extensionIndex = filename.lastIndexOf(".");
	const extension =
		extensionIndex >= 0 ? filename.slice(extensionIndex).toLowerCase() : "";
	const accept =
		extension && mimeType
			? {
					[mimeType]: [extension],
				}
			: mimeType
				? {
						[mimeType]: [".bin"],
					}
				: {
						"application/octet-stream": extension ? [extension] : [".bin"],
					};

	return [
		{
			description: mimeType || "Exported file",
			accept,
		},
	];
}

function supportsInlinePreview(mimeType: string): boolean {
	return mimeType.startsWith("image/") || mimeType.startsWith("video/");
}

function getMobilePromptCopy(
	filename: string,
	mimeType: string,
	capabilities: ExportCapabilities,
) {
	if (capabilities.canShareFiles) {
		return {
			title: "File ready",
			detail: `Tap Share / Save to hand off ${filename} to your device.`,
		};
	}

	if (capabilities.canSaveWithPicker) {
		return {
			title: "File ready",
			detail: `Tap Save to choose where ${filename} should go on your device.`,
		};
	}

	if (mimeType.startsWith("image/")) {
		return {
			title: "Image ready",
			detail:
				"Long-press the preview and choose Save Image if your browser does not show a save action.",
		};
	}

	return {
		title: "File ready",
		detail:
			"Open the file, then use your browser's share or download controls to save it.",
	};
}

async function saveBlobWithPicker(
	blob: Blob,
	filename: string,
	mimeType: string,
): Promise<boolean> {
	if (typeof window === "undefined") {
		return false;
	}

	const savePickerWindow = window as SavePickerWindow;
	if (typeof savePickerWindow.showSaveFilePicker !== "function") {
		return false;
	}

	const handle = await savePickerWindow.showSaveFilePicker({
		suggestedName: filename,
		types: buildSavePickerTypes(filename, mimeType),
	});
	const writable = await handle.createWritable();
	await writable.write(blob);
	await writable.close();
	return true;
}

async function presentMobileExportPrompt(
	blob: Blob,
	options: {
		filename: string;
		mimeType: string;
		capabilities: ExportCapabilities;
	},
): Promise<"share" | "download" | "prompt"> {
	const { filename, mimeType, capabilities } = options;
	const shareNavigator = navigator as ShareCapableNavigator;
	const objectUrl = URL.createObjectURL(blob);
	const copy = getMobilePromptCopy(filename, mimeType, capabilities);

	return new Promise((resolve, reject) => {
		let settled = false;
		const hasExplicitSaveAction =
			capabilities.canShareFiles || capabilities.canSaveWithPicker;
		const file = new File([blob], filename, { type: mimeType });
		const overlay = document.createElement("div");
		const card = document.createElement("div");
		const title = document.createElement("h2");
		const detail = document.createElement("p");
		const actions = document.createElement("div");
		const preview = supportsInlinePreview(mimeType)
			? document.createElement(mimeType.startsWith("video/") ? "video" : "img")
			: null;
		const cleanup = () => {
			overlay.remove();
			URL.revokeObjectURL(objectUrl);
		};

		const finish = (result: "share" | "download" | "prompt") => {
			if (settled) {
				return;
			}
			settled = true;
			cleanup();
			resolve(result);
		};

		const fail = (error: Error) => {
			if (settled) {
				return;
			}
			settled = true;
			cleanup();
			reject(error);
		};

		const setDetail = (message: string) => {
			detail.textContent = message;
		};

		const createButton = (label: string) => {
			const button = document.createElement("button");
			button.type = "button";
			button.textContent = label;
			button.style.cssText =
				"border:0;border-radius:999px;padding:12px 16px;background:#111827;color:#fff;" +
				"font:600 14px/1.2 system-ui,sans-serif;cursor:pointer";
			return button;
		};

		overlay.style.cssText =
			"position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.4);" +
			"backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);" +
			"display:flex;align-items:flex-end;justify-content:center;padding:0;transition:opacity 0.3s ease";
		card.style.cssText =
			"width:100%;max-width:540px;max-height:92vh;overflow:hidden;border-radius:24px 24px 0 0;" +
			"background:rgba(255,255,255,0.85);backdrop-filter:saturate(180%) blur(20px);" +
			"-webkit-backdrop-filter:saturate(180%) blur(20px);" +
			"color:#000;padding:24px 20px env(safe-area-inset-bottom, 20px);box-shadow:0 -8px 32px rgba(0,0,0,0.12);" +
			"display:flex;flex-direction:column;gap:20px;transform:translateY(0);transition:transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
		
		const header = document.createElement("div");
		header.style.cssText = "display:flex;flex-direction:column;gap:4px;text-align:center";
		
		title.style.cssText = "margin:0;font:600 17px/1.2 system-ui,-apple-system,sans-serif;letter-spacing:-0.01em";
		detail.style.cssText = "margin:0;font:400 13px/1.4 system-ui,-apple-system,sans-serif;color:#666";

		header.append(title, detail);
		card.appendChild(header);

		if (preview instanceof HTMLImageElement) {
			preview.src = objectUrl;
			preview.alt = filename;
			preview.style.cssText =
				"display:block;width:100%;max-height:40vh;object-fit:contain;" +
				"border-radius:14px;background:rgba(0,0,0,0.03);box-shadow:0 4px 12px rgba(0,0,0,0.08)";
		} else if (preview instanceof HTMLVideoElement) {
			preview.src = objectUrl;
			preview.controls = true;
			preview.playsInline = true;
			preview.style.cssText =
				"display:block;width:100%;max-height:40vh;object-fit:contain;" +
				"border-radius:14px;background:#000;box-shadow:0 4px 12px rgba(0,0,0,0.15)";
		}
		
		if (preview) {
			card.appendChild(preview);
		}

		actions.style.cssText = "display:flex;flex-direction:column;gap:10px;width:100%";

		const createIosButton = (label: string, primary = false) => {
			const button = document.createElement("button");
			button.type = "button";
			button.textContent = label;
			button.style.cssText = primary
				? "border:0;border-radius:12px;padding:14px;background:#007AFF;color:#fff;" +
				  "font:600 17px/1.2 system-ui,-apple-system,sans-serif;cursor:pointer;width:100%"
				: "border:0;border-radius:12px;padding:14px;background:rgba(0,0,0,0.05);color:#007AFF;" +
				  "font:500 17px/1.2 system-ui,-apple-system,sans-serif;cursor:pointer;width:100%";
			return button;
		};

		if (capabilities.canShareFiles) {
			const shareButton = createIosButton("Share / Save", true);
			shareButton.addEventListener("click", async () => {
				try {
					await shareNavigator.share?.({ files: [file] });
					finish("share");
				} catch (error) {
					if (error instanceof Error && error.name === "AbortError") {
						return;
					}
					setDetail("Share failed. Please use another option.");
				}
			});
			actions.appendChild(shareButton);
		}

		if (capabilities.canSaveWithPicker) {
			const saveButton = createIosButton("Save to Files", !capabilities.canShareFiles);
			saveButton.addEventListener("click", async () => {
				try {
					await saveBlobWithPicker(blob, filename, mimeType);
					finish("download");
				} catch (error) {
					if (error instanceof Error && error.name === "AbortError") {
						return;
					}
					setDetail("Save failed. Try opening the file instead.");
				}
			});
			actions.appendChild(saveButton);
		}

		if (!hasExplicitSaveAction || !preview) {
			const openButton = createIosButton("Open File", true);
			openButton.addEventListener("click", () => {
				const opened = window.open(objectUrl, "_blank", "noopener,noreferrer");
				if (opened) {
					finish("download");
					return;
				}
				setDetail("Popup blocked. Please allow popups and try again.");
			});
			actions.appendChild(openButton);
		}

		const closeButton = createIosButton("Cancel");
		closeButton.style.background = "rgba(0,0,0,0.05)";
		closeButton.style.color = "#FF3B30";
		closeButton.addEventListener("click", () => {
			if (settled) {
				cleanup();
				return;
			}
			fail(new Error("Export cancelled."));
		});
		actions.appendChild(closeButton);

		card.appendChild(actions);
		overlay.appendChild(card);
		document.body.appendChild(overlay);
		
		// Animate in
		requestAnimationFrame(() => {
			card.style.transform = "translateY(0)";
		});

		if (!hasExplicitSaveAction && preview) {
			settled = true;
			resolve("prompt");
		}
	});
}

/**
 * Detect platform capabilities for export
 */
export function detectExportCapabilities(): ExportCapabilities {
	const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
	const shareNavigator = typeof navigator !== "undefined" ? (navigator as ShareCapableNavigator) : null;
	const savePickerWindow = typeof window !== "undefined" ? (window as SavePickerWindow) : null;
	const isIOS =
		/iPad|iPhone|iPod/.test(userAgent) &&
		!(window as unknown as { MSStream?: unknown }).MSStream;
	const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
		userAgent,
	);

	const canShare = !!shareNavigator?.share;
	// Check if navigator.canShare exists and supports files
	let canShareFiles = false;
	if (shareNavigator?.canShare) {
		try {
			// Test with a dummy file to see if files are supported
			const testFile = new File(["test"], "test.png", { type: "image/png" });
			canShareFiles = shareNavigator.canShare({ files: [testFile] });
		} catch {
			canShareFiles = false;
		}
	}
	const canSaveWithPicker = typeof savePickerWindow?.showSaveFilePicker === "function";

	const canEncodeMp4 =
		typeof VideoEncoder !== "undefined" &&
		typeof OffscreenCanvas !== "undefined" &&
		typeof Worker !== "undefined";

	const hasTransientUserActivation = !!shareNavigator?.userActivation?.isActive;

	return {
		canShare,
		canShareFiles,
		canSaveWithPicker,
		canEncodeMp4,
		hasTransientUserActivation,
		isIOS,
		isMobile,
	};
}

export function supportsAnimatedMp4Export(): boolean {
	return detectExportCapabilities().canEncodeMp4;
}

export async function probeAnimatedMp4ExportSupport(): Promise<boolean> {
	if (!supportsAnimatedMp4Export() || typeof VideoEncoder === "undefined") {
		return false;
	}

	try {
		const support = await resolveSupportedMp4EncoderConfig({
			width: 320,
			height: 240,
			bitrate: 2_000_000,
			framerate: 24,
		});
		return support !== null;
	} catch {
		return false;
	}
}

interface EncoderWorkerSuccessResponse {
	type: "ok" | "finalized";
	buffer?: ArrayBuffer;
	mimeType?: string;
}

function createExportProgress(progress: ExportProgress): ExportProgress {
	return {
		...progress,
		progress: Math.max(0, Math.min(progress.progress, 1)),
	};
}

function createEncoderWorkerClient(onProgress?: (progress: number, detail?: string) => void) {
	const worker = new Worker(new URL("./export/export-encoder.worker.ts", import.meta.url), {
		type: "module",
	});
	let nextId = 0;
	const pending = new Map<
		number,
		{
			resolve: (response: EncoderWorkerSuccessResponse) => void;
			reject: (error: Error) => void;
		}
	>();

	const rejectAll = (error: Error) => {
		for (const request of pending.values()) {
			request.reject(error);
		}
		pending.clear();
	};

	worker.onmessage = (event: MessageEvent<EncoderWorkerResponse>) => {
		const response = event.data;

		if (response.type === "progress") {
			onProgress?.(response.progress, response.detail);
			return;
		}

		const request = pending.get(response.id);
		if (!request) {
			return;
		}
		pending.delete(response.id);

		if (response.type === "error") {
			request.reject(new Error(response.error));
			return;
		}

		request.resolve(response);
	};

	worker.onerror = (event) => {
		rejectAll(new Error(event.message || "Animated export worker crashed"));
	};

	const call = (message: EncoderWorkerRequestPayload, transfer?: Transferable[]) =>
		new Promise<EncoderWorkerSuccessResponse>((resolve, reject) => {
			const id = nextId;
			nextId += 1;
			pending.set(id, { resolve, reject });
			const request = { ...message, id } as EncoderWorkerRequest;
			worker.postMessage(request, transfer ?? []);
		});

	return {
		call,
		close() {
			rejectAll(new Error("Animated export worker closed"));
			worker.terminate();
		},
	};
}

/**
 * Capture element to blob with iOS retry logic and image handling
 */
export async function captureToBlob(
	element: HTMLElement,
	options: {
		backgroundColor?: string;
		pixelRatio?: number;
	},
	capabilities: ExportCapabilities,
): Promise<Blob> {
	const maxAttempts = capabilities.isIOS ? 3 : 2;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const blob = await toBlob(element, {
				cacheBust: true,
				pixelRatio: options.pixelRatio ?? 4,
				backgroundColor: options.backgroundColor,
				skipFonts: false,
				includeQueryParams: true,
				style: {
					transform: "scale(1)",
				},
				// Filter function to ensure images are properly handled
				filter: (node: Node) => {
					// Include all nodes except script tags
					if (
						node instanceof HTMLElement &&
						node.tagName === "SCRIPT"
					) {
						return false;
					}
					return true;
				},
			});

			if (blob && blob.size > 1000) {
				// Ensure we have a meaningful blob (not just an empty/corrupt image)
				return blob;
			}

			// If blob is null or too small and we have more attempts, wait and retry
			if (attempt < maxAttempts) {
				await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
			}
		} catch (error) {
			if (attempt === maxAttempts) {
				throw error;
			}
			// Wait before retry with increasing delay
			await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
		}
	}

	throw new Error("Failed to capture image after retries");
}

/**
 * Secondary capture fallback for browsers where html-to-image can flatten to a solid color.
 */
async function captureToBlobWithHtml2Canvas(
	element: HTMLElement,
	options: {
		backgroundColor?: string;
		pixelRatio?: number;
	},
): Promise<Blob> {
	const { default: html2canvas } = await import("html2canvas");
	const canvas = await html2canvas(element, {
		backgroundColor: options.backgroundColor ?? null,
		scale: Math.min(Math.max(options.pixelRatio ?? 2, 1), 2.5),
		useCORS: true,
		allowTaint: true,
		logging: false,
		// Better compatibility on Safari/WebKit.
		foreignObjectRendering: false,
	});

	const blob = await new Promise<Blob | null>((resolve) => {
		canvas.toBlob(resolve, "image/png", 1);
	});

	if (!blob || blob.size <= 1000) {
		throw new Error("html2canvas fallback produced invalid blob");
	}

	return blob;
}

/**
 * Capture element to data URL (fallback method)
 */
export async function captureToDataUrl(
	element: HTMLElement,
	options: {
		backgroundColor?: string;
		pixelRatio?: number;
	},
): Promise<string> {
	return toPng(element, {
		cacheBust: true,
		pixelRatio: options.pixelRatio ?? 4,
		backgroundColor: options.backgroundColor,
		skipFonts: false,
		includeQueryParams: true,
		style: {
			transform: "scale(1)",
		},
		filter: (node: Node) => {
			if (node instanceof HTMLElement && node.tagName === "SCRIPT") {
				return false;
			}
			return true;
		},
	});
}

/**
 * Share a file using the system share sheet when file sharing is available.
 */
export async function shareBlobFile(
	blob: Blob,
	filename: string,
	mimeType = blob.type || "application/octet-stream",
): Promise<boolean> {
	const file = new File([blob], filename, { type: mimeType });

	// iOS ONLY supports files-only share - no title or text!
	// Adding title or text will cause the share to fail on iOS Safari
	const shareData: ShareData = { files: [file] };

	try {
		await navigator.share(shareData);
		return true;
	} catch (error) {
		// If share was cancelled, allow download fallback.
		if (error instanceof Error && error.name === "AbortError") {
			return false;
		}
		throw error;
	}
}

/**
 * Download image using blob URL (desktop browsers)
 */
export function downloadImageBlob(blob: Blob, filename: string): boolean {
	return downloadImageBlobWithOptions(blob, filename, {
		allowSyntheticClick: true,
	}).success;
}

function downloadImageBlobWithOptions(
	blob: Blob,
	filename: string,
	options: {
		allowSyntheticClick: boolean;
		popupWindow?: Window | null;
	},
): DownloadAttemptResult {
	let url: string | null = null;
	try {
		url = URL.createObjectURL(blob);
		const downloaded = triggerDownloadLinkWithOptions(
			url,
			filename,
			options.allowSyntheticClick,
		);
		let opened = false;

		// Fallback: some mobile browsers ignore synthetic clicks.
		if (!downloaded) {
			if (options.popupWindow && !options.popupWindow.closed) {
				options.popupWindow.location.href = url;
				options.popupWindow.focus();
				opened = true;
			} else {
				opened = !!window.open(url, "_blank");
			}
		}

		// Safari can fail if blob URL is revoked too quickly.
		setTimeout(() => {
			if (url) {
				URL.revokeObjectURL(url);
			}
		}, 4000);

		return {
			success: downloaded || opened,
			usedPopup: opened,
		};
	} catch {
		if (url) {
			URL.revokeObjectURL(url);
		}
		return { success: false, usedPopup: false };
	}
}

/**
 * Download image using data URL (legacy fallback)
 */
export function downloadImageDataUrl(dataUrl: string, filename: string): boolean {
	return downloadImageDataUrlWithOptions(dataUrl, filename, {
		allowSyntheticClick: true,
	}).success;
}

function downloadImageDataUrlWithOptions(
	dataUrl: string,
	filename: string,
	options: {
		allowSyntheticClick: boolean;
		popupWindow?: Window | null;
	},
): DownloadAttemptResult {
	try {
		const downloaded = triggerDownloadLinkWithOptions(
			dataUrl,
			filename,
			options.allowSyntheticClick,
		);
		let opened = false;
		if (!downloaded) {
			if (options.popupWindow && !options.popupWindow.closed) {
				options.popupWindow.location.href = dataUrl;
				options.popupWindow.focus();
				opened = true;
			} else {
				opened = !!window.open(dataUrl, "_blank");
			}
		}
		return {
			success: downloaded || opened,
			usedPopup: opened,
		};
	} catch {
		return { success: false, usedPopup: false };
	}
}

export async function exportAnimatedGif(
	element: HTMLElement,
	options: {
		filename: string;
		backgroundColor?: string;
		constrainedFrame?: boolean;
		fps?: number;
		durationSeconds?: number;
		onStatusChange?: (status: ExportStatus) => void;
		onProgressChange?: (progress: ExportProgress) => void;
	},
): Promise<ExportResult> {
	const {
		filename,
		backgroundColor,
		constrainedFrame = false,
		fps = DEFAULT_GIF_EXPORT_FPS,
		durationSeconds,
		onStatusChange,
		onProgressChange,
	} = options;
	const capabilities = detectExportCapabilities();
	const mobileDelivery = resolveMobileExportDelivery(capabilities);
	const runtimeBuildContext = resolveRuntimeBuildContext();
	const useSyntheticDownload = !(capabilities.isIOS && capabilities.isMobile);
	const preparedPopup =
		capabilities.isMobile && mobileDelivery === "auto-download" && !capabilities.isIOS
			? openPreparedPopupWindow()
			: null;
	let keepPreparedPopupOpen = false;
	const existingExportAttribute = element.getAttribute(EXPORT_ATTRIBUTE);
	element.setAttribute(EXPORT_ATTRIBUTE, "true");
	let exportNode: HTMLElement | null = null;

	console.info("[gif-export:diagnostics] start", {
		filename,
		pipelineVersion: EXPORT_PIPELINE_VERSION,
		constrainedFrame,
		fps,
		durationSeconds,
		capabilities,
		...runtimeBuildContext,
	});

	onStatusChange?.("preparing");
	onProgressChange?.(
		createExportProgress({
			stage: "settling",
			label: "Preparing animated GIF",
			detail: "Waiting for the current UI state to settle",
			progress: 0.03,
		}),
	);

	const { activeElement } = document;
	if (activeElement instanceof HTMLElement && element.contains(activeElement)) {
		activeElement.blur();
	}
	window.getSelection?.()?.removeAllRanges();

	await waitForNextPaint();
	const settleDelayMs = getMaxVisualSettleDelayMs(element);
	if (settleDelayMs > 0) {
		await waitForMs(settleDelayMs + 34);
		await waitForNextPaint();
	}

	try {
		onProgressChange?.(
			createExportProgress({
				stage: "cloning",
				label: "Preparing animated GIF",
				detail: "Cloning the export scene and embedding images",
				progress: 0.12,
			}),
		);
		exportNode = createDetachedExportNode(element, { constrainedFrame });
		await preloadAndEmbedImages(exportNode);
		await waitForMs(100);
		await waitForNextPaint();
		applyAnimationFrameToClone(exportNode, 0);
		const captureScale =
			(durationSeconds ?? 0) > 12
				? GIF_CAPTURE_SCALE_BALANCED
				: GIF_CAPTURE_SCALE_HIGH;
		const plan = buildAnimatedExportPlan(
			exportNode.offsetWidth || exportNode.clientWidth || 1,
			exportNode.offsetHeight || exportNode.clientHeight || 1,
			{
				durationSeconds,
				fps,
				maxFrameCount: MAX_GIF_FRAME_COUNT,
				captureScale,
			},
		);
		const frameDelayMs =
			plan.frameCount === 1 ? 1000 : roundGifDelayMs(plan.frameDelayMs);

		onStatusChange?.("encoding");
		onProgressChange?.(
			createExportProgress({
				stage: "encoding",
				label: "Starting GIF encoder",
				detail: `${plan.frameCount} frames queued for export`,
				progress: 0.2,
				currentFrame: 0,
				totalFrames: plan.frameCount,
			}),
		);

		const worker = createEncoderWorkerClient((workerProgress, workerDetail) => {
			onProgressChange?.(
				createExportProgress({
					stage: "finalizing",
					label: "Finalizing GIF",
					detail: workerDetail ?? "Assembling frames and writing the file",
					progress: 0.84 + workerProgress * 0.06,
					currentFrame: plan.frameCount,
					totalFrames: plan.frameCount,
				}),
			);
		});
		try {
			await worker.call({
				type: "start-gif",
				width: plan.captureWidth,
				height: plan.captureHeight,
			});

			const captureStartTime = performance.now();
			const pendingWorkerTasks: Promise<any>[] = [];

			for (let frameIndex = 0; frameIndex < plan.frameCount; frameIndex += 1) {
				const elapsedMs =
					plan.frameCount === 1
						? 0
						: Math.round(
								(frameIndex /
									(plan.frameCount - 1)) *
									Math.max(
										plan.captureDurationMs -
											frameDelayMs,
										0,
									),
							);
				applyAnimationFrameToClone(exportNode, elapsedMs);
				flushAnimatedCloneLayout(exportNode);
				await waitForNextPaint();
				await waitForMs(12);

				const canvas = await captureGifFrameCanvas(exportNode, {
					backgroundColor,
					pixelRatio: captureScale,
					outputWidth: plan.captureWidth,
					outputHeight: plan.captureHeight,
				});
				const bitmap = await createImageBitmap(canvas);

				const now = performance.now();
				const totalElapsed = now - captureStartTime;
				const msPerFrame = totalElapsed / (frameIndex + 1);
				const remainingFrames = plan.frameCount - (frameIndex + 1);
				const etaSeconds = Math.round((remainingFrames * msPerFrame) / 1000);

				onProgressChange?.(
					createExportProgress({
						stage: "capturing",
						label: "Capturing GIF frames",
						detail: `Frame ${frameIndex + 1} of ${plan.frameCount}`,
						progress:
							0.2 +
							((frameIndex + 1) / plan.frameCount) * 0.58,
						currentFrame: frameIndex + 1,
						totalFrames: plan.frameCount,
						etaSeconds,
					}),
				);

				// Pipeline: Don't await the worker call immediately to allow next frame capture to start
				const workerTask = worker.call(
					{
						type: "append-gif-frame",
						frameIndex,
						width: plan.captureWidth,
						height: plan.captureHeight,
						delayMs: frameDelayMs,
						bitmap,
					},
					[bitmap],
				);
				pendingWorkerTasks.push(workerTask);

				// Limit backpressure: don't let more than 3 frames be in flight to the worker
				if (pendingWorkerTasks.length >= 3) {
					await pendingWorkerTasks.shift();
				}
			}

			// Ensure all frames are processed before finalizing
			await Promise.all(pendingWorkerTasks);

			const finalized = await worker.call({ type: "finalize" });
			if (finalized.type !== "finalized" || !finalized.buffer) {
				throw new Error("GIF encoder did not return output");
			}

			const blob = new Blob([finalized.buffer], {
				type: finalized.mimeType ?? "image/gif",
			});
			if (capabilities.isMobile && mobileDelivery === "auto-share") {
				onStatusChange?.("sharing");
				onProgressChange?.(
					createExportProgress({
						stage: "sharing",
						label: "Opening share sheet",
						detail: "Passing the GIF to the system share dialog",
						progress: 0.9,
						currentFrame: plan.frameCount,
						totalFrames: plan.frameCount,
					}),
				);
				try {
					const shared = await shareBlobFile(blob, filename, "image/gif");
					if (shared) {
						const blobSummary = await summarizeBlob(blob);
						if (preparedPopup && !preparedPopup.closed) {
							preparedPopup.close();
						}
						console.info("[gif-export:diagnostics] success", {
							filename,
							method: "share",
							capturePath: "detached-html-to-image-gif",
							frameCount: plan.frameCount,
							frameDelayMs,
							captureScale,
							captureDurationMs: plan.captureDurationMs,
							captureWidth: plan.captureWidth,
							captureHeight: plan.captureHeight,
							...blobSummary,
							pipelineVersion: EXPORT_PIPELINE_VERSION,
							...runtimeBuildContext,
						});
						onStatusChange?.("success");
						onProgressChange?.(
							createExportProgress({
								stage: "complete",
								label: "GIF export complete",
								detail: filename,
								progress: 1,
								currentFrame: plan.frameCount,
								totalFrames: plan.frameCount,
							}),
						);
						return {
							success: true,
							method: "share",
							capturePath: "detached-html-to-image-gif",
							...blobSummary,
						};
					}
				} catch (error) {
					console.warn("GIF share failed, trying download fallback:", error);
				}
			}
			if (capabilities.isMobile && mobileDelivery !== "auto-download") {
				onStatusChange?.("sharing");
				onProgressChange?.(
					createExportProgress({
						stage: "sharing",
						label: "Ready to save GIF",
						detail: "Choose how to hand the file off to your device",
						progress: 0.92,
						currentFrame: plan.frameCount,
						totalFrames: plan.frameCount,
					}),
				);
				const promptMethod = await presentMobileExportPrompt(blob, {
					filename,
					mimeType: "image/gif",
					capabilities,
				});
				const blobSummary = await summarizeBlob(blob);
				console.info("[gif-export:diagnostics] success", {
					filename,
					method: promptMethod,
					capturePath: "detached-html-to-image-gif",
					frameCount: plan.frameCount,
					frameDelayMs,
					captureScale,
					captureDurationMs: plan.captureDurationMs,
					captureWidth: plan.captureWidth,
					captureHeight: plan.captureHeight,
					...blobSummary,
					pipelineVersion: EXPORT_PIPELINE_VERSION,
					...runtimeBuildContext,
				});
				onStatusChange?.("success");
				onProgressChange?.(
					createExportProgress({
						stage: "complete",
						label: "GIF export complete",
						detail: filename,
						progress: 1,
						currentFrame: plan.frameCount,
						totalFrames: plan.frameCount,
					}),
				);
				return {
					success: true,
					method: promptMethod,
					capturePath: "detached-html-to-image-gif",
					...blobSummary,
				};
			}
			onProgressChange?.(
				createExportProgress({
					stage: "downloading",
					label: "Downloading GIF",
					detail: "Handing the finished file to the browser",
					progress: 0.94,
					currentFrame: plan.frameCount,
					totalFrames: plan.frameCount,
				}),
			);
			const downloadResult = downloadImageBlobWithOptions(blob, filename, {
				allowSyntheticClick: useSyntheticDownload,
				popupWindow: preparedPopup,
			});

			if (!downloadResult.success) {
				onStatusChange?.("error");
				return {
					success: false,
					method: "manual",
					capturePath: "detached-html-to-image-gif",
					error: "Browser blocked the GIF download. Try retrying on desktop Chrome.",
				};
			}

			const blobSummary = await summarizeBlob(blob);
			keepPreparedPopupOpen = downloadResult.usedPopup;
			console.info("[gif-export:diagnostics] success", {
				filename,
				method: "download",
				capturePath: "detached-html-to-image-gif",
				frameCount: plan.frameCount,
				frameDelayMs,
				captureScale,
				captureDurationMs: plan.captureDurationMs,
				captureWidth: plan.captureWidth,
				captureHeight: plan.captureHeight,
				...blobSummary,
				pipelineVersion: EXPORT_PIPELINE_VERSION,
				...runtimeBuildContext,
			});
			onStatusChange?.("success");
			onProgressChange?.(
				createExportProgress({
					stage: "complete",
					label: "GIF export complete",
					detail: filename,
					progress: 1,
					currentFrame: plan.frameCount,
					totalFrames: plan.frameCount,
				}),
			);
			return {
				success: true,
				method: "download",
				capturePath: "detached-html-to-image-gif",
				...blobSummary,
			};
		} finally {
			worker.close();
		}
	} catch (error) {
		console.error("[gif-export:diagnostics] failure", {
			filename,
			method: "manual",
			capturePath: "detached-html-to-image-gif",
			pipelineVersion: EXPORT_PIPELINE_VERSION,
			...runtimeBuildContext,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		});
		onStatusChange?.("error");
		onProgressChange?.(
			createExportProgress({
				stage: "error",
				label: "GIF export failed",
				detail:
					error instanceof Error
						? error.message
						: "Unknown error occurred",
				progress: 1,
			}),
		);
		return {
			success: false,
			method: "manual",
			capturePath: "detached-html-to-image-gif",
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	} finally {
		if (preparedPopup && !preparedPopup.closed && !keepPreparedPopupOpen) {
			preparedPopup.close();
		}
		removeExportNode(exportNode);
		if (existingExportAttribute === null) {
			element.removeAttribute(EXPORT_ATTRIBUTE);
		} else {
			element.setAttribute(EXPORT_ATTRIBUTE, existingExportAttribute);
		}
	}
}

export async function exportAnimatedMp4(
	element: HTMLElement,
	options: {
		filename: string;
		backgroundColor?: string;
		constrainedFrame?: boolean;
		fps?: number;
		durationSeconds?: number;
		onStatusChange?: (status: ExportStatus) => void;
		onProgressChange?: (progress: ExportProgress) => void;
	},
): Promise<ExportResult> {
	const {
		filename,
		backgroundColor,
		constrainedFrame = false,
		fps = DEFAULT_MP4_EXPORT_FPS,
		durationSeconds,
		onStatusChange,
		onProgressChange,
	} = options;
	const capabilities = detectExportCapabilities();
	const mobileDelivery = resolveMobileExportDelivery(capabilities);
	const runtimeBuildContext = resolveRuntimeBuildContext();
	const useSyntheticDownload = !(capabilities.isIOS && capabilities.isMobile);
	const preparedPopup =
		capabilities.isMobile && mobileDelivery === "auto-download" && !capabilities.isIOS
			? openPreparedPopupWindow()
			: null;
	let keepPreparedPopupOpen = false;
	const existingExportAttribute = element.getAttribute(EXPORT_ATTRIBUTE);
	element.setAttribute(EXPORT_ATTRIBUTE, "true");
	let exportNode: HTMLElement | null = null;

	console.info("[mp4-export:diagnostics] start", {
		filename,
		pipelineVersion: EXPORT_PIPELINE_VERSION,
		constrainedFrame,
		fps,
		durationSeconds,
		capabilities,
		...runtimeBuildContext,
	});

	if (!capabilities.canEncodeMp4) {
		return {
			success: false,
			method: "manual",
			capturePath: "detached-html-to-image-mp4",
			error: "This browser does not support H.264 MP4 export yet.",
		};
	}

	onStatusChange?.("preparing");
	onProgressChange?.(
		createExportProgress({
			stage: "settling",
			label: "Preparing MP4 export",
			detail: "Waiting for the current UI state to settle",
			progress: 0.03,
		}),
	);

	const { activeElement } = document;
	if (activeElement instanceof HTMLElement && element.contains(activeElement)) {
		activeElement.blur();
	}
	window.getSelection?.()?.removeAllRanges();

	await waitForNextPaint();
	const settleDelayMs = getMaxVisualSettleDelayMs(element);
	if (settleDelayMs > 0) {
		await waitForMs(settleDelayMs + 34);
		await waitForNextPaint();
	}

	try {
		onProgressChange?.(
			createExportProgress({
				stage: "cloning",
				label: "Preparing MP4 export",
				detail: "Cloning the export scene and embedding images",
				progress: 0.12,
			}),
		);
		exportNode = createDetachedExportNode(element, { constrainedFrame });
		await preloadAndEmbedImages(exportNode);
		await waitForMs(100);
		await waitForNextPaint();
		applyAnimationFrameToClone(exportNode, 0);
		const strategy = await resolveMp4ExportStrategy({
			durationSeconds,
			fps,
			targetWidth: exportNode.offsetWidth || exportNode.clientWidth || 1,
			targetHeight: exportNode.offsetHeight || exportNode.clientHeight || 1,
		});
		if (!strategy) {
			throw new Error(
				"This browser does not support H.264 MP4 export for the current capture size",
			);
		}
		const { plan, captureScale, encoder } = strategy;
		const frameDurationUs = Math.round(plan.frameDelayMs * 1000);

		onStatusChange?.("encoding");
		onProgressChange?.(
			createExportProgress({
				stage: "encoding",
				label: "Starting MP4 encoder",
				detail: `${plan.frameCount} frames queued for H.264 export`,
				progress: 0.2,
				currentFrame: 0,
				totalFrames: plan.frameCount,
			}),
		);

		const worker = createEncoderWorkerClient();
		try {
			await worker.call({
				type: "start-mp4",
				width: plan.captureWidth,
				height: plan.captureHeight,
				frameRate: fps,
				bitrate: MP4_BITRATE_BITS_PER_SECOND,
				codec: encoder.codec,
			});

			const captureStartTime = performance.now();
			const pendingWorkerTasks: Promise<any>[] = [];

			for (let frameIndex = 0; frameIndex < plan.frameCount; frameIndex += 1) {
				const elapsedMs =
					plan.frameCount === 1
						? 0
						: Math.round(
								(frameIndex /
									(plan.frameCount - 1)) *
									Math.max(
										plan.captureDurationMs -
											plan.frameDelayMs,
										0,
									),
							);
				applyAnimationFrameToClone(exportNode, elapsedMs);
				flushAnimatedCloneLayout(exportNode);
				await waitForNextPaint();
				await waitForMs(12);

				const canvas = await captureGifFrameCanvas(exportNode, {
					backgroundColor,
					pixelRatio: captureScale,
					outputWidth: plan.captureWidth,
					outputHeight: plan.captureHeight,
				});
				const bitmap = await createImageBitmap(canvas);

				const now = performance.now();
				const totalElapsed = now - captureStartTime;
				const msPerFrame = totalElapsed / (frameIndex + 1);
				const remainingFrames = plan.frameCount - (frameIndex + 1);
				const etaSeconds = Math.round((remainingFrames * msPerFrame) / 1000);

				onProgressChange?.(
					createExportProgress({
						stage: "capturing",
						label: "Encoding MP4 frames",
						detail: `Frame ${frameIndex + 1} of ${plan.frameCount}`,
						progress:
							0.2 +
							((frameIndex + 1) / plan.frameCount) * 0.58,
						currentFrame: frameIndex + 1,
						totalFrames: plan.frameCount,
						etaSeconds,
					}),
				);

				const workerTask = worker.call(
					{
						type: "append-mp4-frame",
						frameIndex,
						timestampUs: frameIndex * frameDurationUs,
						durationUs: frameDurationUs,
						bitmap,
					},
					[bitmap],
				);
				pendingWorkerTasks.push(workerTask);

				// Limit backpressure: don't let more than 4 frames be in flight
				if (pendingWorkerTasks.length >= 4) {
					await pendingWorkerTasks.shift();
				}
			}

			// Ensure all frames are processed before finalizing
			await Promise.all(pendingWorkerTasks);

			onProgressChange?.(
				createExportProgress({
					stage: "finalizing",
					label: "Finalizing MP4",
					detail: "Flushing the encoder and muxing the file",
					progress: 0.84,
					currentFrame: plan.frameCount,
					totalFrames: plan.frameCount,
				}),
			);
			const finalized = await worker.call({ type: "finalize" });
			if (finalized.type !== "finalized" || !finalized.buffer) {
				throw new Error("MP4 encoder did not return output");
			}

			const blob = new Blob([finalized.buffer], {
				type: finalized.mimeType ?? "video/mp4",
			});
			if (capabilities.isMobile && mobileDelivery === "auto-share") {
				onStatusChange?.("sharing");
				onProgressChange?.(
					createExportProgress({
						stage: "sharing",
						label: "Opening share sheet",
						detail: "Passing the MP4 to the system share dialog",
						progress: 0.9,
						currentFrame: plan.frameCount,
						totalFrames: plan.frameCount,
					}),
				);
				try {
					const shared = await shareBlobFile(blob, filename, "video/mp4");
					if (shared) {
						const blobSummary = await summarizeBlob(blob);
						if (preparedPopup && !preparedPopup.closed) {
							preparedPopup.close();
						}
						console.info("[mp4-export:diagnostics] success", {
							filename,
							method: "share",
							capturePath: "detached-html-to-image-mp4",
							frameCount: plan.frameCount,
							frameDurationUs,
							codec: encoder.codec,
							captureScale,
							captureDurationMs: plan.captureDurationMs,
							captureWidth: plan.captureWidth,
							captureHeight: plan.captureHeight,
							...blobSummary,
							pipelineVersion: EXPORT_PIPELINE_VERSION,
							...runtimeBuildContext,
						});
						onStatusChange?.("success");
						onProgressChange?.(
							createExportProgress({
								stage: "complete",
								label: "MP4 export complete",
								detail: filename,
								progress: 1,
								currentFrame: plan.frameCount,
								totalFrames: plan.frameCount,
							}),
						);
						return {
							success: true,
							method: "share",
							capturePath: "detached-html-to-image-mp4",
							...blobSummary,
						};
					}
				} catch (error) {
					console.warn("MP4 share failed, trying download fallback:", error);
				}
			}
			if (capabilities.isMobile && mobileDelivery !== "auto-download") {
				onStatusChange?.("sharing");
				onProgressChange?.(
					createExportProgress({
						stage: "sharing",
						label: "Ready to save MP4",
						detail: "Choose how to hand the file off to your device",
						progress: 0.92,
						currentFrame: plan.frameCount,
						totalFrames: plan.frameCount,
					}),
				);
				const promptMethod = await presentMobileExportPrompt(blob, {
					filename,
					mimeType: "video/mp4",
					capabilities,
				});
				const blobSummary = await summarizeBlob(blob);
				console.info("[mp4-export:diagnostics] success", {
					filename,
					method: promptMethod,
					capturePath: "detached-html-to-image-mp4",
					frameCount: plan.frameCount,
					frameDurationUs,
					codec: encoder.codec,
					captureScale,
					captureDurationMs: plan.captureDurationMs,
					captureWidth: plan.captureWidth,
					captureHeight: plan.captureHeight,
					...blobSummary,
					pipelineVersion: EXPORT_PIPELINE_VERSION,
					...runtimeBuildContext,
				});
				onStatusChange?.("success");
				onProgressChange?.(
					createExportProgress({
						stage: "complete",
						label: "MP4 export complete",
						detail: filename,
						progress: 1,
						currentFrame: plan.frameCount,
						totalFrames: plan.frameCount,
					}),
				);
				return {
					success: true,
					method: promptMethod,
					capturePath: "detached-html-to-image-mp4",
					...blobSummary,
				};
			}
			onProgressChange?.(
				createExportProgress({
					stage: "downloading",
					label: "Downloading MP4",
					detail: "Handing the finished file to the browser",
					progress: 0.94,
					currentFrame: plan.frameCount,
					totalFrames: plan.frameCount,
				}),
			);
			const downloadResult = downloadImageBlobWithOptions(blob, filename, {
				allowSyntheticClick: useSyntheticDownload,
				popupWindow: preparedPopup,
			});
			if (!downloadResult.success) {
				onStatusChange?.("error");
				return {
					success: false,
					method: "manual",
					capturePath: "detached-html-to-image-mp4",
					error: "Browser blocked the MP4 download. Try retrying on desktop Chrome.",
				};
			}

			const blobSummary = await summarizeBlob(blob);
			keepPreparedPopupOpen = downloadResult.usedPopup;
			console.info("[mp4-export:diagnostics] success", {
				filename,
				method: "download",
				capturePath: "detached-html-to-image-mp4",
				frameCount: plan.frameCount,
				frameDurationUs,
				codec: encoder.codec,
				captureScale,
				captureDurationMs: plan.captureDurationMs,
				captureWidth: plan.captureWidth,
				captureHeight: plan.captureHeight,
				...blobSummary,
				pipelineVersion: EXPORT_PIPELINE_VERSION,
				...runtimeBuildContext,
			});
			onStatusChange?.("success");
			onProgressChange?.(
				createExportProgress({
					stage: "complete",
					label: "MP4 export complete",
					detail: filename,
					progress: 1,
					currentFrame: plan.frameCount,
					totalFrames: plan.frameCount,
				}),
			);
			return {
				success: true,
				method: "download",
				capturePath: "detached-html-to-image-mp4",
				...blobSummary,
			};
		} finally {
			worker.close();
		}
	} catch (error) {
		console.error("[mp4-export:diagnostics] failure", {
			filename,
			method: "manual",
			capturePath: "detached-html-to-image-mp4",
			pipelineVersion: EXPORT_PIPELINE_VERSION,
			...runtimeBuildContext,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		});
		onStatusChange?.("error");
		onProgressChange?.(
			createExportProgress({
				stage: "error",
				label: "MP4 export failed",
				detail:
					error instanceof Error
						? error.message
						: "Unknown error occurred",
				progress: 1,
			}),
		);
		return {
			success: false,
			method: "manual",
			capturePath: "detached-html-to-image-mp4",
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	} finally {
		if (preparedPopup && !preparedPopup.closed && !keepPreparedPopupOpen) {
			preparedPopup.close();
		}
		removeExportNode(exportNode);
		if (existingExportAttribute === null) {
			element.removeAttribute(EXPORT_ATTRIBUTE);
		} else {
			element.setAttribute(EXPORT_ATTRIBUTE, existingExportAttribute);
		}
	}
}

/**
 * Main export orchestrator - handles all platforms with fallback chain
 *
 * Fallback Chain:
 * 1. Web Share API with File (mobile) → native share sheet
 * 2. Blob URL download (Desktop) → direct download
 * 3. Data URL download (Legacy) → old method
 * 4. Manual instructions (Ultimate fallback)
 */
export async function exportImage(
	element: HTMLElement,
	options: {
		filename: string;
		backgroundColor?: string;
		pixelRatio?: number;
		constrainedFrame?: boolean;
		onStatusChange?: (status: ExportStatus) => void;
		onProgressChange?: (progress: ExportProgress) => void;
	},
): Promise<ExportResult> {
	const {
		filename,
		backgroundColor,
		pixelRatio,
		constrainedFrame = false,
		onStatusChange,
		onProgressChange,
	} = options;
	const capabilities = detectExportCapabilities();
	const mobileDelivery = resolveMobileExportDelivery(capabilities);
	const runtimeBuildContext = resolveRuntimeBuildContext();
	const useSyntheticDownload = !(capabilities.isIOS && capabilities.isMobile);
	// Only open a fallback popup on non-iOS mobile (e.g. Android) where synthetic
	// clicks may be blocked. iOS uses Web Share API natively; opening a popup on
	// iOS Safari creates a stuck about:blank tab.
	const preparedPopup =
		capabilities.isMobile && mobileDelivery === "auto-download" && !capabilities.isIOS
			? openPreparedPopupWindow()
			: null;
	let keepPreparedPopupOpen = false;
	const existingExportAttribute = element.getAttribute(EXPORT_ATTRIBUTE);
	element.setAttribute(EXPORT_ATTRIBUTE, "true");
	let capturePath = "none";

	console.info("[export:diagnostics] start", {
		filename,
		pipelineVersion: EXPORT_PIPELINE_VERSION,
		constrainedFrame,
		capabilities,
		...runtimeBuildContext,
	});

	onStatusChange?.("preparing");
	onProgressChange?.(
		createExportProgress({
			stage: "settling",
			label: "Preparing image export",
			detail: "Waiting for the current UI state to settle",
			progress: 0.05,
		}),
	);

	// Blur active inline editors so caret/focus artifacts don't leak into capture.
	const { activeElement } = document;
	if (activeElement instanceof HTMLElement && element.contains(activeElement)) {
		activeElement.blur();
	}
	window.getSelection?.()?.removeAllRanges();

	// Snapshot after paint + transition settle so exports don't capture in-between states.
	await waitForNextPaint();
	const settleDelayMs = getMaxVisualSettleDelayMs(element);
	if (settleDelayMs > 0) {
		await waitForMs(settleDelayMs + 34);
		await waitForNextPaint();
	}

	let exportNode: HTMLElement | null = null;
	const ensureDetachedExportNode = async (): Promise<HTMLElement> => {
		if (!exportNode) {
			onProgressChange?.(
				createExportProgress({
					stage: "cloning",
					label: "Preparing image export",
					detail: "Cloning the export scene and embedding images",
					progress: 0.18,
				}),
			);
			exportNode = createDetachedExportNode(element, { constrainedFrame });
			// Pre-load and embed all images as inline data URLs.
			await preloadAndEmbedImages(exportNode);
			// Additional wait for images to settle after conversion.
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		return exportNode;
	};

	try {
		// Prefer detached capture first for deterministic export-safe output.
		let blob: Blob | null = null;
		onProgressChange?.(
			createExportProgress({
				stage: "capturing",
				label: "Capturing image",
				detail: "Rendering the export frame",
				progress: 0.44,
			}),
		);
		try {
			const detachedNode = await ensureDetachedExportNode();
			blob = await captureToBlob(
				detachedNode,
				{ backgroundColor, pixelRatio },
				capabilities,
			);
			if (blob && (await isLikelyBlankCapture(blob))) {
				console.warn("Detached capture looked blank, trying live element");
				blob = null;
			} else if (blob) {
				capturePath = "detached-html-to-image";
			}
		} catch (error) {
			console.warn("Detached blob capture failed, trying live element:", error);
		}

		// Fallback to live element capture if detached capture failed.
		if (!blob && !constrainedFrame) {
			try {
				blob = await captureToBlob(
					element,
					{ backgroundColor, pixelRatio },
					capabilities,
				);
				if (blob && (await isLikelyBlankCapture(blob))) {
					console.warn("Live-element capture looked blank");
					blob = null;
				} else if (blob) {
					capturePath = "live-html-to-image";
				}
			} catch (error) {
				console.warn(
					"Live blob capture failed, will try renderer fallback:",
					error,
				);
			}
		}

		// Renderer fallback: html2canvas is slower, but more compatible on some iOS/WebKit paths.
		if (!blob) {
			try {
				const detachedNode = await ensureDetachedExportNode();
				blob = await captureToBlobWithHtml2Canvas(detachedNode, {
					backgroundColor,
					pixelRatio: Math.min(pixelRatio ?? 4, 3),
				});
				if (blob && (await isLikelyBlankCapture(blob))) {
					console.warn("Detached html2canvas fallback looked blank");
					blob = null;
				} else if (blob) {
					capturePath = "detached-html2canvas";
				}
			} catch (error) {
				console.warn("Detached html2canvas fallback failed:", error);
			}
		}

		if (!blob && !constrainedFrame) {
			try {
				blob = await captureToBlobWithHtml2Canvas(element, {
					backgroundColor,
					pixelRatio: Math.min(pixelRatio ?? 4, 3),
				});
				if (blob && (await isLikelyBlankCapture(blob))) {
					console.warn("Live html2canvas fallback looked blank");
					blob = null;
				} else if (blob) {
					capturePath = "live-html2canvas";
				}
			} catch (error) {
				console.warn("Live html2canvas fallback failed:", error);
			}
		}

		// Final retry from detached node with a conservative-but-sharp ratio.
		if (!blob) {
			try {
				const detachedNode = await ensureDetachedExportNode();
				blob = await captureToBlob(
					detachedNode,
					{
						backgroundColor,
						pixelRatio: Math.min(pixelRatio ?? 4, 3),
					},
					capabilities,
				);
				if (blob && (await isLikelyBlankCapture(blob))) {
					console.warn("Low-ratio detached retry looked blank");
					blob = null;
				} else if (blob) {
					capturePath = "detached-html-to-image-low-ratio";
				}
			} catch (error) {
				console.warn("Low-ratio detached retry failed:", error);
			}
		}

		// Method 1: Web Share API (triggers native share sheet on all platforms)
		if (blob && capabilities.isMobile && mobileDelivery === "auto-share") {
			onStatusChange?.("sharing");
			onProgressChange?.(
				createExportProgress({
					stage: "sharing",
					label: "Opening share sheet",
					detail: "Passing the image to the system share dialog",
					progress: 0.86,
				}),
			);
			try {
				const shared = await shareBlobFile(blob, filename, "image/png");
				if (shared) {
					const blobSummary = await summarizeBlob(blob);
					if (preparedPopup && !preparedPopup.closed) {
						preparedPopup.close();
					}
					console.info("[export:diagnostics] success", {
						filename,
						method: "share",
						capturePath,
						...blobSummary,
						pipelineVersion: EXPORT_PIPELINE_VERSION,
						...runtimeBuildContext,
					});
					onStatusChange?.("success");
					onProgressChange?.(
						createExportProgress({
							stage: "complete",
							label: "Image export complete",
							detail: filename,
							progress: 1,
						}),
					);
					return {
						success: true,
						method: "share",
						capturePath,
						...blobSummary,
					};
				}
			} catch (error) {
				console.warn("Share failed, trying download fallback:", error);
			}
		}

		if (blob && capabilities.isMobile && mobileDelivery !== "auto-download") {
			onStatusChange?.("sharing");
			onProgressChange?.(
				createExportProgress({
					stage: "sharing",
					label: "Ready to save image",
					detail: "Choose how to hand the file off to your device",
					progress: 0.88,
				}),
			);
			const promptMethod = await presentMobileExportPrompt(blob, {
				filename,
				mimeType: "image/png",
				capabilities,
			});
			const blobSummary = await summarizeBlob(blob);
			if (preparedPopup && !preparedPopup.closed) {
				preparedPopup.close();
			}
			console.info("[export:diagnostics] success", {
				filename,
				method: promptMethod,
				capturePath,
				...blobSummary,
				pipelineVersion: EXPORT_PIPELINE_VERSION,
				...runtimeBuildContext,
			});
			onStatusChange?.("success");
			onProgressChange?.(
				createExportProgress({
					stage: "complete",
					label: "Image export complete",
					detail: filename,
					progress: 1,
				}),
			);
			return {
				success: true,
				method: promptMethod,
				capturePath,
				...blobSummary,
			};
		}

		// Method 2: Blob URL download (desktop / non-iOS mobile)
		if (blob) {
			onProgressChange?.(
				createExportProgress({
					stage: "downloading",
					label: "Downloading image",
					detail: "Handing the finished file to the browser",
					progress: 0.9,
				}),
			);
			const downloadResult = downloadImageBlobWithOptions(blob, filename, {
				allowSyntheticClick: useSyntheticDownload,
				popupWindow: preparedPopup,
			});
			if (downloadResult.success) {
				const blobSummary = await summarizeBlob(blob);
				keepPreparedPopupOpen = downloadResult.usedPopup;
				console.info("[export:diagnostics] success", {
					filename,
					method: "download",
					capturePath,
					...blobSummary,
					pipelineVersion: EXPORT_PIPELINE_VERSION,
					...runtimeBuildContext,
				});
				onStatusChange?.("success");
				onProgressChange?.(
					createExportProgress({
						stage: "complete",
						label: "Image export complete",
						detail: filename,
						progress: 1,
					}),
				);
				return {
					success: true,
					method: "download",
					capturePath,
					...blobSummary,
				};
			}
		}

		// Method 3: Data URL download (legacy fallback)
		try {
			const dataUrlNode = exportNode ?? element;
			onProgressChange?.(
				createExportProgress({
					stage: "finalizing",
					label: "Trying compatibility fallback",
					detail: "Switching to a data URL export path",
					progress: 0.74,
				}),
			);
			const dataUrl = await captureToDataUrl(dataUrlNode, {
				backgroundColor,
				pixelRatio,
			});
			const dataUrlBlob = dataUrlToBlob(dataUrl);
			if (await isLikelyBlankCapture(dataUrlBlob)) {
				throw new Error("Data URL fallback looked blank");
			}
			const downloadResult = downloadImageDataUrlWithOptions(dataUrl, filename, {
				allowSyntheticClick: useSyntheticDownload,
				popupWindow: preparedPopup,
			});
			if (downloadResult.success) {
				const blobSummary = await summarizeBlob(dataUrlBlob);
				keepPreparedPopupOpen = downloadResult.usedPopup;
				console.info("[export:diagnostics] success", {
					filename,
					method: "dataurl",
					capturePath:
						capturePath === "none" ? "data-url" : capturePath,
					...blobSummary,
					pipelineVersion: EXPORT_PIPELINE_VERSION,
					...runtimeBuildContext,
				});
				onStatusChange?.("success");
				onProgressChange?.(
					createExportProgress({
						stage: "complete",
						label: "Image export complete",
						detail: filename,
						progress: 1,
					}),
				);
				return {
					success: true,
					method: "dataurl",
					capturePath:
						capturePath === "none" ? "data-url" : capturePath,
					...blobSummary,
				};
			}
		} catch (error) {
			console.error("Data URL fallback failed:", error);
		}

		// Method 4: iOS long-press fallback — show the image in a full-screen
		// overlay so the user can long-press → "Save Image".
		if (capabilities.isIOS && blob) {
			try {
				const blobSummary = await summarizeBlob(blob);
				const url = URL.createObjectURL(blob);
				const overlay = document.createElement("div");
				overlay.style.cssText =
					"position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.85);" +
					"display:flex;flex-direction:column;align-items:center;justify-content:center;" +
					"padding:16px;-webkit-tap-highlight-color:transparent";
				overlay.innerHTML =
					`<p style="color:#fff;font:600 15px/1.4 system-ui;margin:0 0 12px;text-align:center">` +
					`Long-press the image and tap <b>Save Image</b></p>` +
					`<img src="${url}" style="max-width:100%;max-height:75vh;border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,.5)" alt="Export">` +
					`<button style="margin-top:16px;padding:10px 28px;border:none;border-radius:20px;` +
					`background:#fff;color:#000;font:600 15px system-ui;cursor:pointer">Close</button>`;
				overlay.querySelector("button")!.addEventListener("click", () => {
					overlay.remove();
					URL.revokeObjectURL(url);
				});
				overlay.addEventListener("click", (e) => {
					if (e.target === overlay) {
						overlay.remove();
						URL.revokeObjectURL(url);
					}
				});
				document.body.appendChild(overlay);
				console.info("[export:diagnostics] success", {
					filename,
					method: "dataurl",
					capturePath:
						capturePath === "none"
							? "ios-inline-overlay"
							: capturePath,
					...blobSummary,
					pipelineVersion: EXPORT_PIPELINE_VERSION,
					...runtimeBuildContext,
				});
				onStatusChange?.("success");
				onProgressChange?.(
					createExportProgress({
						stage: "complete",
						label: "Image export complete",
						detail: filename,
						progress: 1,
					}),
				);
				return {
					success: true,
					method: "dataurl",
					capturePath:
						capturePath === "none"
							? "ios-inline-overlay"
							: capturePath,
					...blobSummary,
				};
			} catch (error) {
				console.warn("iOS inline image fallback failed:", error);
			}
		}

		// Method 5: Manual instructions (ultimate fallback)
		onStatusChange?.("error");
		onProgressChange?.(
			createExportProgress({
				stage: "error",
				label: "Image export failed",
				detail: "Export failed. Try taking a screenshot manually.",
				progress: 1,
			}),
		);
		console.error("[export:diagnostics] failure", {
			filename,
			method: "manual",
			capturePath,
			pipelineVersion: EXPORT_PIPELINE_VERSION,
			...runtimeBuildContext,
			error: "Export failed. Try taking a screenshot manually.",
		});
		return {
			success: false,
			method: "manual",
			capturePath,
			error: "Export failed. Try taking a screenshot manually.",
		};
	} catch (error) {
		console.error("Export failed:", error);
		console.error("[export:diagnostics] failure", {
			filename,
			method: "manual",
			capturePath,
			pipelineVersion: EXPORT_PIPELINE_VERSION,
			...runtimeBuildContext,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		});
		onStatusChange?.("error");
		onProgressChange?.(
			createExportProgress({
				stage: "error",
				label: "Image export failed",
				detail:
					error instanceof Error
						? error.message
						: "Unknown error occurred",
				progress: 1,
			}),
		);
		return {
			success: false,
			method: "manual",
			capturePath,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	} finally {
		if (preparedPopup && !preparedPopup.closed && !keepPreparedPopupOpen) {
			preparedPopup.close();
		}
		removeExportNode(exportNode);
		if (existingExportAttribute === null) {
			element.removeAttribute(EXPORT_ATTRIBUTE);
		} else {
			element.setAttribute(EXPORT_ATTRIBUTE, existingExportAttribute);
		}
	}
}
