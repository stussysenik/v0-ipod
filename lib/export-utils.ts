import { toPng, toBlob } from "html-to-image";

export type ExportStatus = "idle" | "preparing" | "sharing" | "success" | "error";

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
  const width = Math.ceil(rect.width || element.offsetWidth || 1);
  const height = Math.ceil(rect.height || element.offsetHeight || 1);
  const clone = element.cloneNode(true) as HTMLElement;

  clone.setAttribute("aria-hidden", "true");
  clone.style.position = "fixed";
  clone.style.left = "-99999px";
  clone.style.top = "0";
  clone.style.margin = "0";
  clone.style.pointerEvents = "none";
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.maxWidth = "none";
  clone.style.maxHeight = "none";
  clone.style.overflow = "hidden";

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
    // User cancelled share or share failed
    if (error instanceof Error && error.name === "AbortError") {
      // User cancelled - this is still a "success" in that we tried
      return true;
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
 * 1. Web Share API with File (iOS/Android) → native share sheet
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
  // Only open a fallback popup on mobile where synthetic clicks may be blocked.
  const preparedPopup = capabilities.isMobile ? openPreparedPopupWindow() : null;
  let keepPreparedPopupOpen = false;

  onStatusChange?.("preparing");

  // Blur active inline editors so caret/focus artifacts don't leak into capture.
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement && element.contains(activeElement)) {
    activeElement.blur();
  }
  window.getSelection?.()?.removeAllRanges();

  // Snapshot after the next paint to capture exactly what the user sees now.
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

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
    // Try a live capture first so the export matches exactly what is rendered.
    let blob: Blob | null = null;
    try {
      blob = await captureToBlob(element, { backgroundColor, pixelRatio }, capabilities);
      if (blob && (await isLikelyBlankCapture(blob))) {
        console.warn("Live-element capture looked blank, trying detached clone");
        blob = null;
      }
    } catch (error) {
      console.warn("Live blob capture failed, trying detached clone:", error);
    }

    // Fallback to a detached clone if live capture failed/blank.
    if (!blob) {
      try {
        const detachedNode = await ensureDetachedExportNode();
        blob = await captureToBlob(
          detachedNode,
          { backgroundColor, pixelRatio },
          capabilities,
        );
      } catch (error) {
        console.warn("Detached blob capture failed, will try renderer fallback:", error);
      }
    }

    // If detached clone looks blank, one final retry from the live element.
    if (blob && (await isLikelyBlankCapture(blob))) {
      console.warn("Detached capture looked blank, retrying live-element capture");
      try {
        const liveBlob = await captureToBlob(
          element,
          { backgroundColor, pixelRatio },
          capabilities,
        );
        if (await isLikelyBlankCapture(liveBlob)) {
          console.warn("Live-element capture retry also looked blank");
          blob = null;
        } else {
          blob = liveBlob;
        }
      } catch (retryError) {
        console.warn(
          "Live-element capture retry failed after detached clone:",
          retryError,
        );
        blob = null;
      }
    }

    // Renderer fallback: html2canvas is slower, but more compatible on some iOS/WebKit paths.
    if (!blob) {
      try {
        blob = await captureToBlobWithHtml2Canvas(element, {
          backgroundColor,
          pixelRatio: Math.min(pixelRatio ?? 4, 3),
        });

        if (blob && (await isLikelyBlankCapture(blob))) {
          console.warn("Fallback capture also looked blank");
          blob = null;
        }
      } catch (error) {
        console.warn("html2canvas fallback failed:", error);
      }
    }

    // Method 1: Web Share API (mobile - triggers native share sheet)
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

    // Method 2: Blob URL download (desktop)
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

    // Method 4: Manual instructions (ultimate fallback)
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
  }
}
