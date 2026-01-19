export interface ExtractedImage {
  id: string
  base64: string
  width: number
  height: number
  colors: string[]
}

export interface PDFExtractionResult {
  success: boolean
  images: ExtractedImage[]
  text: string
  colors: string[]
  layout: {
    pageCount: number
  }
  error?: string
}
