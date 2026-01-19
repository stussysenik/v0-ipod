## 1. Python MinerU Service Setup (Local)
- [ ] 1.1 Create `mineru-service/` directory
- [ ] 1.2 Create `requirements.txt` with MinerU and Flask dependencies
- [ ] 1.3 Implement `app.py` Flask server with `/health` and `/process` endpoints
- [ ] 1.4 Add image extraction and color palette analysis
- [ ] 1.5 Test service locally with sample PDF

## 2. Next.js API Integration
- [ ] 2.1 Create `app/api/pdf/upload/route.ts` for PDF upload handling
- [ ] 2.2 Add environment variable for local service URL (localhost:5000)
- [ ] 2.3 Implement error handling for service unavailable

## 3. Upload UI Component
- [ ] 3.1 Create `components/pdf-upload-modal.tsx` with simple file input
- [ ] 3.2 Add loading state during processing
- [ ] 3.3 Display extracted images for selection

## 4. 2D Visual Refinements
- [ ] 4.1 Apply extracted images as artwork in `ipod-classic.tsx`
- [ ] 4.2 Extract dominant colors from PDF and apply to iPod color scheme
- [ ] 4.3 Use high-quality extracted visuals to refine display quality

## 5. Testing
- [ ] 5.1 Test PDF upload flow end-to-end
- [ ] 5.2 Verify extracted content applies to 2D render
- [ ] 5.3 Test with various PDF types (liner notes, posters)
