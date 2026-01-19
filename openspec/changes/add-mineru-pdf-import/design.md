## Context

The v0-iPod project is a pixel-perfect iPod Classic simulator with 2D and 3D views. Users currently enter metadata manually. We want to enable automatic extraction from PDF documents (album liner notes, posters, catalogs) using MinerU.

**Constraints:**
- MinerU is Python-based (3.10-3.13), Next.js is JavaScript/TypeScript
- MinerU requires 8-16GB RAM minimum, optional GPU acceleration
- PDF processing can take 5-60+ seconds depending on size

**Stakeholders:**
- End users who want easier metadata entry
- Developers maintaining the codebase

## Goals / Non-Goals

**Goals:**
- Enable PDF upload and automatic metadata extraction
- Create new 3D visualization modes using extracted content
- Maintain existing manual editing functionality
- Support various PDF types (liner notes, posters, catalogs)

**Non-Goals:**
- Real-time PDF processing (async is acceptable)
- Cloud deployment of MinerU (local service is primary target)
- Support for non-PDF formats (images, Word docs, etc.)

## Decisions

### Decision 1: Python Microservice Architecture

**What:** Create a standalone Python Flask service that runs MinerU, communicating with Next.js via HTTP REST API.

**Why:**
- Clean separation of concerns (Python handles PDF, JS handles UI)
- MinerU dependencies isolated from Node.js environment
- Service can run on separate hardware with GPU acceleration
- Can be containerized for easy deployment
- Enables future scaling (multiple workers, job queues)

**Alternatives considered:**
| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| CLI Wrapper (spawn Python from Node) | Simple | Slow startup, dependency management | Rejected |
| External Cloud API | No infrastructure | Cost, latency, privacy | Rejected |
| WebAssembly | Frontend-only | MinerU incompatible, 16GB+ RAM | Rejected |

### Decision 2: Async Processing with Status Polling

**What:** PDF uploads return immediately with a job ID. Frontend polls for status until complete.

**Why:**
- PDF processing can take 5-60+ seconds
- Prevents HTTP timeouts
- Better UX with progress indicators
- Allows cancellation

**Implementation:**
```
POST /api/pdf/upload → { jobId: "abc123", status: "processing" }
GET /api/pdf/status/abc123 → { status: "processing", progress: 45 }
GET /api/pdf/status/abc123 → { status: "completed", result: {...} }
```

### Decision 3: Intelligent Metadata Heuristics

**What:** Python service uses heuristics to identify album metadata from raw MinerU output.

**Why:** MinerU extracts raw content but doesn't understand album semantics. We need custom logic to:
- Find album title (usually first H1 or largest text)
- Identify artist name (often near title or in credits)
- Parse tracklists (tables with numbers, titles, durations)
- Select album artwork (largest square-ish image near document start)

### Decision 4: Extend Existing State vs. Separate PDF State

**What:** Extend the existing `SongMetadata` interface with new optional fields.

**Why:**
- Maintains single source of truth for iPod display
- PDF-extracted data integrates seamlessly with manual edits
- No need for separate state synchronization
- Backward compatible (new fields are optional)

**New fields:**
```typescript
interface SongMetadata {
  // ... existing
  linerNotes?: string[]
  credits?: Record<string, string>
  tracklist?: TrackInfo[]
  extractedImages?: ExtractedImage[]
  sourceFile?: string
}
```

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Python service unavailable | PDF import fails | Clear error message, fallback to manual entry |
| Large PDF causes timeout | Poor UX | Progress indicator, file size warnings |
| MinerU extraction errors | Missing/wrong data | Allow user editing of all extracted fields |
| Memory usage spikes | Service crash | Implement job queue, limit concurrent processing |
| Security (malicious PDFs) | XSS, data leaks | Validate file type, sanitize output, temp file cleanup |

## Migration Plan

No migration needed - this is additive functionality. Existing iPod state and functionality remain unchanged.

**Rollout:**
1. Deploy Python service (can run locally or containerized)
2. Add environment variable for service URL
3. Enable feature flag (optional)
4. Deploy Next.js changes

**Rollback:** Remove API routes and UI components. Python service can be stopped independently.

## Open Questions

1. **Should we support batch PDF processing?** (Multiple files at once)
   - Recommendation: Start with single file, add batch later if needed

2. **Should extracted data be persisted?** (Local storage, database)
   - Recommendation: Start with session-only, add persistence later

3. **How to handle multi-album PDFs?** (Boxset liner notes)
   - Recommendation: Extract all, let user select which album to apply
