import { toPng } from "html-to-image";
import { GIFEncoder, applyPalette, quantize } from "gifenc";

const EXPORT_ATTRIBUTE = "data-exporting";

const waitForNextPaint = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

async function waitForImages(element: HTMLElement) {
  const images = Array.from(element.querySelectorAll<HTMLImageElement>("img"));

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve, reject) => {
          if (image.complete && image.naturalWidth > 0) {
            resolve();
            return;
          }

          const timeoutId = window.setTimeout(() => {
            reject(new Error(`Image load timeout: ${image.src.slice(0, 96)}`));
          }, 5000);

          image.onload = () => {
            window.clearTimeout(timeoutId);
            resolve();
          };
          image.onerror = () => {
            window.clearTimeout(timeoutId);
            reject(new Error(`Image load failed: ${image.src.slice(0, 96)}`));
          };
        }),
    ),
  );
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode GIF frame"));
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
  pixelRatio = 1,
  durationMs = 2600,
  fps = 12,
  onProgress,
  onFrame,
}: GifCaptureOptions): Promise<GifCapturedFrames> {
  const existingExportAttribute = element.getAttribute(EXPORT_ATTRIBUTE);
  element.setAttribute(EXPORT_ATTRIBUTE, "true");

  try {
    await waitForImages(element);

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

export async function encodeGifFrames(
  frameDataUrls: string[],
  delayMs: number,
): Promise<Blob> {
  if (frameDataUrls.length === 0) {
    throw new Error("GIF preview did not generate any frames");
  }

  const gif = GIFEncoder();

  for (let i = 0; i < frameDataUrls.length; i += 1) {
    const frameData = await drawImageToCanvas(frameDataUrls[i]);
    const palette = quantize(frameData.data, 256);
    const indexed = applyPalette(frameData.data, palette);

    gif.writeFrame(indexed, frameData.width, frameData.height, {
      delay: delayMs,
      palette,
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
  pixelRatio = 1,
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
