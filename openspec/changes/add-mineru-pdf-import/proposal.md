# Change: Add MinerU PDF Import to Refine 2D Visual Experience

## Why

The 2D iPod render can be enhanced with high-quality visual content extracted from PDFs. Album liner notes, concert posters, and music-related documents contain high-resolution images, color palettes, and visual elements that can refine the physical appearance and render quality of the iPod display.

MinerU is an open-source PDF extraction tool that preserves document structure, images, and layout - ideal for extracting visual assets to improve the 2D experience.

This integration will:
- Extract high-quality images from PDFs for artwork and textures
- Derive color palettes to refine the iPod's visual appearance
- Use extracted visual elements to enhance the 2D render quality

## What Changes

- **NEW**: Local Python service running MinerU for PDF processing (localhost:5000)
- **NEW**: Next.js API route for PDF upload
- **NEW**: Simple PDF upload modal component
- **MODIFIED**: iPod Classic component to apply visual refinements from extracted content

## Impact

- Affected specs: New `pdf-import` capability
- Affected code:
  - `mineru-service/` (new Python service - local only)
  - `app/api/pdf/upload/route.ts` (new API route)
  - `components/pdf-upload-modal.tsx` (new)
  - `components/ipod-classic.tsx` (modified - apply 2D refinements)

## Technical Approach

**Architecture**: Local Python service + HTTP API (simplest setup)

MinerU is Python-based, so we create a local Flask service on localhost:5000 that Next.js communicates with via REST. Focus is on simplicity - no Docker, no complex deployment.

**Data Flow**:
1. User uploads PDF via modal
2. Next.js forwards to local Python service
3. MinerU extracts images, text, layout info
4. Extracted content used to refine 2D iPod render:
   - High-quality images → artwork/textures
   - Color extraction → visual theme refinements
   - Layout info → improved display quality
