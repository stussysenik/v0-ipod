import { toPng, toBlob } from "html-to-image";

export type ExportStatus =
  | "idle"
  | "preparing"
  | "sharing"
  | "success"
  | "error";

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

/**
 * Trigger a browser download in a way that's compatible across browsers.
 */
function triggerDownloadLink(href: string, filename: string): boolean {
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

/**
 * Detect platform capabilities for export
 */
export function detectExportCapabilities(): ExportCapabilities {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
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
export async function shareImageFile(
  blob: Blob,
  filename: string,
): Promise<boolean> {
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
  let url: string | null = null;
  try {
    url = URL.createObjectURL(blob);
    const downloaded = triggerDownloadLink(url, filename);
    let opened = false;

    // Fallback: some mobile browsers ignore synthetic clicks.
    if (!downloaded) {
      opened = !!window.open(url, "_blank", "noopener,noreferrer");
    }

    // Safari can fail if blob URL is revoked too quickly.
    setTimeout(() => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    }, 4000);

    return downloaded || opened;
  } catch {
    if (url) {
      URL.revokeObjectURL(url);
    }
    return false;
  }
}

/**
 * Download image using data URL (legacy fallback)
 */
export function downloadImageDataUrl(
  dataUrl: string,
  filename: string,
): boolean {
  try {
    const downloaded = triggerDownloadLink(dataUrl, filename);
    let opened = false;
    if (!downloaded) {
      opened = !!window.open(dataUrl, "_blank", "noopener,noreferrer");
    }
    return downloaded || opened;
  } catch {
    return false;
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

  onStatusChange?.("preparing");

  // Wait for UI to settle
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    // Pre-load and embed all images as inline data URLs
    // This ensures html-to-image can capture them correctly
    await preloadAndEmbedImages(element);

    // Additional wait for images to settle after conversion
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Try to capture as blob first (needed for share and blob download)
    let blob: Blob | null = null;
    try {
      blob = await captureToBlob(
        element,
        { backgroundColor, pixelRatio },
        capabilities,
      );
    } catch (error) {
      console.warn("Blob capture failed, will try data URL fallback:", error);
    }

    // Method 1: Web Share API (mobile - triggers native share sheet)
    if (blob && capabilities.canShareFiles && capabilities.isMobile) {
      onStatusChange?.("sharing");
      try {
        const shared = await shareImageFile(blob, filename);
        if (shared) {
          onStatusChange?.("success");
          return { success: true, method: "share" };
        }
      } catch (error) {
        console.warn("Share failed, trying download fallback:", error);
      }
    }

    // Method 2: Blob URL download (desktop)
    if (blob) {
      const downloaded = downloadImageBlob(blob, filename);
      if (downloaded) {
        onStatusChange?.("success");
        return { success: true, method: "download" };
      }
    }

    // Method 3: Data URL download (legacy fallback)
    try {
      const dataUrl = await captureToDataUrl(element, {
        backgroundColor,
        pixelRatio,
      });
      const downloaded = downloadImageDataUrl(dataUrl, filename);
      if (downloaded) {
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
  }
}
