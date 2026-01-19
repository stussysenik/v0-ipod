#!/usr/bin/env npx tsx
/**
 * CLI script to extract content from PDFs using MinerU service.
 *
 * Usage:
 *   npx tsx scripts/extract-pdf.ts <pdf-path> [--output <output-dir>] [--service-url <url>]
 *
 * Prerequisites:
 *   1. Start the MinerU service: cd mineru-service && python app.py
 *   2. Run this script with a PDF path
 *
 * Examples:
 *   npx tsx scripts/extract-pdf.ts album-cover.pdf
 *   npx tsx scripts/extract-pdf.ts album-cover.pdf --output ./extracted
 *   npx tsx scripts/extract-pdf.ts album-cover.pdf --service-url http://localhost:5001
 */

import * as fs from "fs"
import * as path from "path"
import type { PDFExtractionResult } from "../types/pdf"

const DEFAULT_SERVICE_URL = "http://localhost:5000"

interface CLIOptions {
  pdfPath: string
  outputDir: string
  serviceUrl: string
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
MinerU PDF Extraction CLI

Usage:
  npx tsx scripts/extract-pdf.ts <pdf-path> [options]

Options:
  --output, -o <dir>     Output directory for extracted data (default: ./extracted)
  --service-url <url>    MinerU service URL (default: ${DEFAULT_SERVICE_URL})
  --help, -h             Show this help message

Prerequisites:
  Start the MinerU service first:
    cd mineru-service && python app.py

Examples:
  npx tsx scripts/extract-pdf.ts document.pdf
  npx tsx scripts/extract-pdf.ts document.pdf --output ./my-output
  npx tsx scripts/extract-pdf.ts document.pdf --service-url http://localhost:5001
`)
    process.exit(0)
  }

  let pdfPath = ""
  let outputDir = "./extracted"
  let serviceUrl = DEFAULT_SERVICE_URL

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === "--output" || arg === "-o") {
      outputDir = args[++i] || outputDir
    } else if (arg === "--service-url") {
      serviceUrl = args[++i] || serviceUrl
    } else if (!arg.startsWith("-")) {
      pdfPath = arg
    }
  }

  if (!pdfPath) {
    console.error("Error: PDF path is required")
    process.exit(1)
  }

  return { pdfPath, outputDir, serviceUrl }
}

async function checkServiceHealth(serviceUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${serviceUrl}/health`)
    if (!response.ok) {
      return false
    }
    const health = await response.json()
    console.log("Service status:", health)
    return true
  } catch {
    return false
  }
}

async function extractPdf(
  pdfPath: string,
  serviceUrl: string
): Promise<PDFExtractionResult> {
  // Read the PDF file
  const absolutePath = path.resolve(pdfPath)

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`PDF file not found: ${absolutePath}`)
  }

  const pdfBuffer = fs.readFileSync(absolutePath)
  const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" })

  // Create form data
  const formData = new FormData()
  formData.append("file", pdfBlob, path.basename(pdfPath))

  // Send to MinerU service
  console.log(`Sending PDF to MinerU service at ${serviceUrl}...`)

  const response = await fetch(`${serviceUrl}/process`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Service error (${response.status}): ${errorText}`)
  }

  return response.json() as Promise<PDFExtractionResult>
}

function saveResults(result: PDFExtractionResult, outputDir: string, pdfPath: string): void {
  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true })

  const baseName = path.basename(pdfPath, ".pdf")
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

  // Save full result as JSON
  const jsonPath = path.join(outputDir, `${baseName}-${timestamp}.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2))
  console.log(`Saved extraction result: ${jsonPath}`)

  // Save extracted text if any
  if (result.text) {
    const textPath = path.join(outputDir, `${baseName}-${timestamp}.md`)
    fs.writeFileSync(textPath, result.text)
    console.log(`Saved extracted text: ${textPath}`)
  }

  // Save images individually
  if (result.images && result.images.length > 0) {
    const imagesDir = path.join(outputDir, `${baseName}-${timestamp}-images`)
    fs.mkdirSync(imagesDir, { recursive: true })

    result.images.forEach((img, index) => {
      if (img.base64) {
        // Extract base64 data (remove data URL prefix)
        const base64Data = img.base64.replace(/^data:image\/\w+;base64,/, "")
        const imgPath = path.join(imagesDir, `${img.id || `image-${index}`}.png`)
        fs.writeFileSync(imgPath, Buffer.from(base64Data, "base64"))
        console.log(`Saved image: ${imgPath}`)
      }
    })
  }

  // Save color palette
  if (result.colors && result.colors.length > 0) {
    const colorsPath = path.join(outputDir, `${baseName}-${timestamp}-colors.json`)
    fs.writeFileSync(colorsPath, JSON.stringify({ colors: result.colors }, null, 2))
    console.log(`Saved color palette: ${colorsPath}`)
  }
}

async function main() {
  const options = parseArgs()

  console.log("=" .repeat(50))
  console.log("MinerU PDF Extraction CLI")
  console.log("=" .repeat(50))
  console.log(`PDF: ${options.pdfPath}`)
  console.log(`Output: ${options.outputDir}`)
  console.log(`Service: ${options.serviceUrl}`)
  console.log("")

  // Check service health
  console.log("Checking MinerU service...")
  const isHealthy = await checkServiceHealth(options.serviceUrl)

  if (!isHealthy) {
    console.error(`
Error: MinerU service is not running at ${options.serviceUrl}

Please start the service first:
  cd mineru-service && python app.py
`)
    process.exit(1)
  }

  console.log("Service is healthy!")
  console.log("")

  // Extract PDF
  try {
    console.log("Processing PDF...")
    const result = await extractPdf(options.pdfPath, options.serviceUrl)

    if (!result.success) {
      console.error(`Extraction failed: ${result.error}`)
      process.exit(1)
    }

    console.log("")
    console.log("Extraction complete!")
    console.log(`- Images: ${result.images?.length || 0}`)
    console.log(`- Text length: ${result.text?.length || 0} characters`)
    console.log(`- Colors: ${result.colors?.length || 0}`)
    console.log(`- Pages: ${result.layout?.pageCount || "unknown"}`)
    console.log("")

    // Save results
    saveResults(result, options.outputDir, options.pdfPath)

    console.log("")
    console.log("Done!")
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  }
}

main()
