import * as THREE from "three"

/**
 * Capture a high-resolution render from a Three.js scene
 * Uses WebGLRenderTarget for 4096x4096 resolution per PDF Section 4.2
 */
export async function captureThreeCanvas(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  width = 4096,
  height = 4096
): Promise<Blob | null> {
  // Store original size
  const originalSize = new THREE.Vector2()
  gl.getSize(originalSize)

  // Create high-resolution render target with MSAA
  const renderTarget = new THREE.WebGLRenderTarget(width, height, {
    samples: 4,
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  })

  try {
    // Render to the high-res target
    gl.setRenderTarget(renderTarget)
    gl.render(scene, camera)

    // Read pixels from the render target
    const buffer = new Uint8Array(width * height * 4)
    gl.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer)

    // Restore original render target
    gl.setRenderTarget(null)

    // Convert to PNG blob via canvas
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Failed to get canvas 2D context")
    }

    const imageData = ctx.createImageData(width, height)

    // Flip Y axis (WebGL renders upside down) and convert from HalfFloat to 8-bit
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIndex = ((height - y - 1) * width + x) * 4
        const dstIndex = (y * width + x) * 4

        // The buffer is already in 8-bit format after readRenderTargetPixels
        imageData.data[dstIndex] = buffer[srcIndex]
        imageData.data[dstIndex + 1] = buffer[srcIndex + 1]
        imageData.data[dstIndex + 2] = buffer[srcIndex + 2]
        imageData.data[dstIndex + 3] = buffer[srcIndex + 3]
      }
    }

    ctx.putImageData(imageData, 0, 0)

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob)
        },
        "image/png",
        1.0
      )
    })
  } finally {
    // Cleanup
    renderTarget.dispose()
  }
}

/**
 * Alternative capture method using toDataURL for simpler cases
 */
export function captureCanvasDataUrl(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera
): string {
  // Render one frame
  gl.render(scene, camera)

  // Preserve drawing buffer must be true in the renderer for this to work
  return gl.domElement.toDataURL("image/png")
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.download = filename
  link.href = url
  link.click()

  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
