import { toPng, toBlob } from "html-to-image";

export type ExportStatus = "idle" | "preparing" | "sharing" | "success" | "error";

const EXPORT_ATTRIBUTE = "data-exporting";
const MAX_EXPORT_SETTLE_DELAY_MS = 900;

const waitForMs = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, ms)));

const waitForNextPaint = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

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

  const nodes: HTMLElement[] = [element, ...Array.from(element.querySelectorAll("*"))];
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
      reject(new Error(`Image load timeout: ${img.src.substring(0, 100)}`));
    }, 5000);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve();
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error(`Image load failed: ${img.src.substring(0, 100)}`));
    };
  });
}

/**
 * Preload and embed all images in the element as inline data URLs
 * This ensures html-to-image can capture them correctly
 */
async function preloadAndEmbedImages(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll("img");

  const imagePromises = Array.from(images).map(async (img) => {
    try {
      // Wait for image to load
      await waitForImageLoad(img);

      // Skip if no valid image
      if (!img.naturalWidth || !img.naturalHeight) {
        console.warn("Skipping invalid image:", img.src.substring(0, 100));
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

function createDetachedExportNode(element: HTMLElement): HTMLElement {
  const rect = element.getBoundingClientRect();
  const width = Math.ceil(element.offsetWidth || rect.width || 1);
  const height = Math.ceil(element.offsetHeight || rect.height || 1);
  const clone = element.cloneNode(true) as HTMLElement;

  clone.setAttribute("aria-hidden", "true");
  clone.style.position = "fixed";
  // Keep the clone off-screen without extreme coordinates that can trigger
  // shadow/compositing artifacts on mobile WebKit captures.
  clone.style.left = "-4096px";
  clone.style.top = "0";
  clone.style.margin = "0";
  clone.style.pointerEvents = "none";
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.maxWidth = "none";
  clone.style.maxHeight = "none";
  clone.style.overflow = "visible";
  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";
  clone.style.isolation = "isolate";
  clone.setAttribute(EXPORT_ATTRIBUTE, "true");

  // Freeze animations/transitions to avoid capturing in-between visual states.
  const freezeStyle = document.createElement("style");
  freezeStyle.textContent = `
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
      caret-color: transparent !important;
    }
  `;
  clone.appendChild(freezeStyle);

  document.body.appendChild(clone);
  return clone;
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
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
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
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to decode exported blob"));
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
          0.2126 * data[left] + 0.7152 * data[left + 1] + 0.0722 * data[left + 2];
        edgeAccumulator += Math.abs(luma - leftLuma);
      }
      if (y > startY) {
        const up = i - width * 4;
        const upLuma = 0.2126 * data[up] + 0.7152 * data[up + 1] + 0.0722 * data[up + 2];
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

export interface ExportCapabilities {
  canShare: boolean;
  canShareFiles: boolean;
  isIOS: boolean;
  isMobile: boolean;
}

export interface ExportResult {
  success: boolean;
  method: "share" | "download" | "dataurl" | "manual";
  error?: string;
}

interface DownloadAttemptResult {
  success: boolean;
  usedPopup: boolean;
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
    if (popup && popup.document) {
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

/**
 * Detect platform capabilities for export
 */
export function detectExportCapabilities(): ExportCapabilities {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent,
  );

  const canShare = typeof navigator !== "undefined" && !!navigator.share;
  // Check if navigator.canShare exists and supports files
  let canShareFiles = false;
  if (typeof navigator !== "undefined" && navigator.canShare) {
    try {
      // Test with a dummy file to see if files are supported
      const testFile = new File(["test"], "test.png", { type: "image/png" });
      canShareFiles = navigator.canShare({ files: [testFile] });
    } catch {
      canShareFiles = false;
    }
  }

  return { canShare, canShareFiles, isIOS, isMobile };
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
          if (node instanceof HTMLElement && node.tagName === "SCRIPT") {
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
 * Share image file using Web Share API (iOS/Android native share sheet)
 */
export async function shareImageFile(blob: Blob, filename: string): Promise<boolean> {
  const file = new File([blob], filename, { type: "image/png" });

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
    onStatusChange?: (status: ExportStatus) => void;
  },
): Promise<ExportResult> {
  const { filename, backgroundColor, pixelRatio, onStatusChange } = options;
  const capabilities = detectExportCapabilities();
  const useSyntheticDownload = !(capabilities.isIOS && capabilities.isMobile);
  // Only open a fallback popup on non-iOS mobile (e.g. Android) where synthetic
  // clicks may be blocked. iOS uses Web Share API natively; opening a popup on
  // iOS Safari creates a stuck about:blank tab.
  const preparedPopup =
    capabilities.isMobile && !capabilities.isIOS ? openPreparedPopupWindow() : null;
  let keepPreparedPopupOpen = false;
  const existingExportAttribute = element.getAttribute(EXPORT_ATTRIBUTE);
  element.setAttribute(EXPORT_ATTRIBUTE, "true");

  onStatusChange?.("preparing");

  // Blur active inline editors so caret/focus artifacts don't leak into capture.
  const activeElement = document.activeElement;
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
      exportNode = createDetachedExportNode(element);
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
      }
    } catch (error) {
      console.warn("Detached blob capture failed, trying live element:", error);
    }

    // Fallback to live element capture if detached capture failed.
    if (!blob) {
      try {
        blob = await captureToBlob(
          element,
          { backgroundColor, pixelRatio },
          capabilities,
        );
        if (blob && (await isLikelyBlankCapture(blob))) {
          console.warn("Live-element capture looked blank");
          blob = null;
        }
      } catch (error) {
        console.warn("Live blob capture failed, will try renderer fallback:", error);
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
        }
      } catch (error) {
        console.warn("Detached html2canvas fallback failed:", error);
      }
    }

    if (!blob) {
      try {
        blob = await captureToBlobWithHtml2Canvas(element, {
          backgroundColor,
          pixelRatio: Math.min(pixelRatio ?? 4, 3),
        });
        if (blob && (await isLikelyBlankCapture(blob))) {
          console.warn("Live html2canvas fallback looked blank");
          blob = null;
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
          { backgroundColor, pixelRatio: Math.min(pixelRatio ?? 4, 3) },
          capabilities,
        );
        if (blob && (await isLikelyBlankCapture(blob))) {
          console.warn("Low-ratio detached retry looked blank");
          blob = null;
        }
      } catch (error) {
        console.warn("Low-ratio detached retry failed:", error);
      }
    }

    // Method 1: Web Share API (triggers native share sheet on all platforms)
    if (blob && capabilities.canShareFiles && capabilities.isMobile) {
      onStatusChange?.("sharing");
      try {
        const shared = await shareImageFile(blob, filename);
        if (shared) {
          if (preparedPopup && !preparedPopup.closed) {
            preparedPopup.close();
          }
          onStatusChange?.("success");
          return { success: true, method: "share" };
        }
      } catch (error) {
        console.warn("Share failed, trying download fallback:", error);
      }
    }

    // Method 2: Blob URL download (desktop / non-iOS mobile)
    if (blob) {
      const downloadResult = downloadImageBlobWithOptions(blob, filename, {
        allowSyntheticClick: useSyntheticDownload,
        popupWindow: preparedPopup,
      });
      if (downloadResult.success) {
        keepPreparedPopupOpen = downloadResult.usedPopup;
        onStatusChange?.("success");
        return { success: true, method: "download" };
      }
    }

    // Method 3: Data URL download (legacy fallback)
    try {
      const dataUrlNode = exportNode ?? element;
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
        keepPreparedPopupOpen = downloadResult.usedPopup;
        onStatusChange?.("success");
        return { success: true, method: "dataurl" };
      }
    } catch (error) {
      console.error("Data URL fallback failed:", error);
    }

    // Method 4: iOS long-press fallback — show the image in a full-screen
    // overlay so the user can long-press → "Save Image".
    if (capabilities.isIOS && blob) {
      try {
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
        onStatusChange?.("success");
        return { success: true, method: "dataurl" };
      } catch (error) {
        console.warn("iOS inline image fallback failed:", error);
      }
    }

    // Method 5: Manual instructions (ultimate fallback)
    onStatusChange?.("error");
    return {
      success: false,
      method: "manual",
      error: "Export failed. Try taking a screenshot manually.",
    };
  } catch (error) {
    console.error("Export failed:", error);
    onStatusChange?.("error");
    return {
      success: false,
      method: "manual",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  } finally {
    if (preparedPopup && !preparedPopup.closed && !keepPreparedPopupOpen) {
      preparedPopup.close();
    }
    exportNode?.remove();
    if (existingExportAttribute === null) {
      element.removeAttribute(EXPORT_ATTRIBUTE);
    } else {
      element.setAttribute(EXPORT_ATTRIBUTE, existingExportAttribute);
    }
  }
}
