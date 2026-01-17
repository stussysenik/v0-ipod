import { toPng, toBlob } from "html-to-image"

export type ExportStatus = "idle" | "preparing" | "sharing" | "success" | "error"

export interface ExportCapabilities {
  canShare: boolean
  canShareFiles: boolean
  isIOS: boolean
  isMobile: boolean
}

export interface ExportResult {
  success: boolean
  method: "share" | "download" | "dataurl" | "manual"
  error?: string
}

/**
 * Detect platform capabilities for export
 */
export function detectExportCapabilities(): ExportCapabilities {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : ""
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)

  const canShare = typeof navigator !== "undefined" && !!navigator.share
  // Check if navigator.canShare exists and supports files
  let canShareFiles = false
  if (typeof navigator !== "undefined" && navigator.canShare) {
    try {
      // Test with a dummy file to see if files are supported
      const testFile = new File(["test"], "test.png", { type: "image/png" })
      canShareFiles = navigator.canShare({ files: [testFile] })
    } catch {
      canShareFiles = false
    }
  }

  return { canShare, canShareFiles, isIOS, isMobile }
}

/**
 * Capture element to blob with iOS retry logic
 */
export async function captureToBlob(
  element: HTMLElement,
  options: {
    backgroundColor?: string
    pixelRatio?: number
  },
  capabilities: ExportCapabilities
): Promise<Blob> {
  const maxAttempts = capabilities.isIOS ? 2 : 1

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const blob = await toBlob(element, {
        cacheBust: true,
        pixelRatio: options.pixelRatio ?? 4,
        backgroundColor: options.backgroundColor,
        style: {
          transform: "scale(1)",
        },
      })

      if (blob) {
        return blob
      }

      // If blob is null and we have more attempts, wait and retry
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error
      }
      // Wait before retry on iOS
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }

  throw new Error("Failed to capture image after retries")
}

/**
 * Capture element to data URL (fallback method)
 */
export async function captureToDataUrl(
  element: HTMLElement,
  options: {
    backgroundColor?: string
    pixelRatio?: number
  }
): Promise<string> {
  return toPng(element, {
    cacheBust: true,
    pixelRatio: options.pixelRatio ?? 4,
    backgroundColor: options.backgroundColor,
    style: {
      transform: "scale(1)",
    },
  })
}

/**
 * Share image file using Web Share API (iOS/Android native share sheet)
 */
export async function shareImageFile(blob: Blob, filename: string): Promise<boolean> {
  const file = new File([blob], filename, { type: "image/png" })

  // iOS ONLY supports files-only share - no title or text!
  // Adding title or text will cause the share to fail on iOS Safari
  const shareData: ShareData = { files: [file] }

  try {
    await navigator.share(shareData)
    return true
  } catch (error) {
    // User cancelled share or share failed
    if (error instanceof Error && error.name === "AbortError") {
      // User cancelled - this is still a "success" in that we tried
      return true
    }
    throw error
  }
}

/**
 * Download image using blob URL (desktop browsers)
 */
export function downloadImageBlob(blob: Blob, filename: string): boolean {
  try {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.download = filename
    link.href = url
    link.click()

    // Clean up blob URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return true
  } catch {
    return false
  }
}

/**
 * Download image using data URL (legacy fallback)
 */
export function downloadImageDataUrl(dataUrl: string, filename: string): boolean {
  try {
    const link = document.createElement("a")
    link.download = filename
    link.href = dataUrl
    link.click()
    return true
  } catch {
    return false
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
    filename: string
    backgroundColor?: string
    pixelRatio?: number
    onStatusChange?: (status: ExportStatus) => void
  }
): Promise<ExportResult> {
  const { filename, backgroundColor, pixelRatio, onStatusChange } = options
  const capabilities = detectExportCapabilities()

  onStatusChange?.("preparing")

  // Wait for UI to settle
  await new Promise(resolve => setTimeout(resolve, 300))

  try {
    // Try to capture as blob first (needed for share and blob download)
    let blob: Blob | null = null
    try {
      blob = await captureToBlob(element, { backgroundColor, pixelRatio }, capabilities)
    } catch (error) {
      console.warn("Blob capture failed, will try data URL fallback:", error)
    }

    // Method 1: Web Share API (mobile - triggers native share sheet)
    if (blob && capabilities.canShareFiles && capabilities.isMobile) {
      onStatusChange?.("sharing")
      try {
        const shared = await shareImageFile(blob, filename)
        if (shared) {
          onStatusChange?.("success")
          return { success: true, method: "share" }
        }
      } catch (error) {
        console.warn("Share failed, trying download fallback:", error)
      }
    }

    // Method 2: Blob URL download (desktop)
    if (blob) {
      const downloaded = downloadImageBlob(blob, filename)
      if (downloaded) {
        onStatusChange?.("success")
        return { success: true, method: "download" }
      }
    }

    // Method 3: Data URL download (legacy fallback)
    try {
      const dataUrl = await captureToDataUrl(element, { backgroundColor, pixelRatio })
      const downloaded = downloadImageDataUrl(dataUrl, filename)
      if (downloaded) {
        onStatusChange?.("success")
        return { success: true, method: "dataurl" }
      }
    } catch (error) {
      console.error("Data URL fallback failed:", error)
    }

    // Method 4: Manual instructions (ultimate fallback)
    onStatusChange?.("error")
    return {
      success: false,
      method: "manual",
      error: "Export failed. Try taking a screenshot manually.",
    }
  } catch (error) {
    console.error("Export failed:", error)
    onStatusChange?.("error")
    return {
      success: false,
      method: "manual",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
