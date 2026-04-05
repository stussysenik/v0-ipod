## Context

This project is a web-based iPod Classic tribute app built with Next.js 15, React 19, Three.js, and Tailwind CSS. It currently renders a 2D flat iPod with editable metadata, 3D WebGL view, and PNG/GIF export. The user (staff growth product designer) is building this as an Apple 50th anniversary tribute, targeting museum-grade fidelity.

**Reference artifacts**: Real iPod Classic photos (black 6th gen, black 7th gen with Cover Flow, 1st gen 2001 white) provide pixel-level reference for all design decisions.

**Constraints**:
- Must work on mobile and desktop
- Export pipeline (PNG + GIF) must produce identical visual output
- Performance: <16ms frame time for smooth interactions
- No Ruby on Rails — stay in Next.js ecosystem

**Stakeholders**: Solo designer/developer creating Instagram-shareable content

## Goals / Non-Goals

### Goals
- 1:1 pixel-level fidelity with real iPod Classic hardware photos
- Wheel-to-case color coupling (black case = black wheel + white labels)
- Complete iPod OS navigation with sub-menus and slide transitions
- GIF exports that always contain visible motion (marquee scrolling)
- Authentic Apple finish library with provenance labels
- 1st Generation iPod as first museum piece
- Instagram-story-ready export quality

### Non-Goals
- Full music playback (this is a visual tribute, not a music player)
- iPod Touch / iPod Nano / iPod Shuffle (future phases)
- VisionOS port (future)
- Ruby on Rails backend
- Real-time weather API integration (future experiment)

## Decisions

### Decision 1: Dynamic wheel color system
**What**: Wheel gradient, label color, and icon color derive from case color luminance.
**Why**: Real iPods couple wheel color to case color. Black case = black wheel with white text. White case = white wheel with grey text. Silver case = silver-toned wheel.
**How**: Add a `deriveWheelColors(caseColor: string)` function in `lib/color-manifest.ts` that returns `{ gradient, labelColor, iconColor, centerBorder }` based on OKLCH lightness of the input case color.
**Alternatives considered**:
- Manual wheel color per finish (too much config, doesn't scale)
- Fixed wheel colors (breaks authenticity for dark finishes)

### Decision 2: SVG icon glyphs for click wheel
**What**: Replace lucide-react icons with hand-crafted inline SVGs matching real iPod hardware.
**Why**: Lucide's `SkipBack`/`SkipForward` are single triangles. Real iPod uses double-triangle-with-bar (⏪⏩). Play/pause must be a tight ▶‖ combined glyph (already fixed).
**How**: Create inline SVG elements in `click-wheel.tsx` with exact proportions traced from reference photos.

### Decision 3: Menu navigation as a stack machine
**What**: iPod OS menu navigation modeled as a stack of `{ menuId, items[], selectedIndex }` frames.
**Why**: Real iPod OS uses hierarchical navigation where Menu button pops the stack. This is the simplest model that supports arbitrary depth.
**How**: Add `osMenuStack: MenuFrame[]` to state in `ipod-classic.tsx`. Push on select, pop on Menu press. Animate with CSS `translateX` slide transitions.
**Alternatives considered**:
- Flat state machine with explicit screen IDs (doesn't scale to sub-menus)
- Router-based navigation (over-engineered for embedded UI)

### Decision 4: GIF motion guarantee
**What**: Detect and prevent static-frame GIFs. Always include marquee animation or progress bar movement.
**Why**: User reports GIF exports produce bunch of identical still images. The frame capture likely fires before marquee animation starts.
**How**:
1. Ensure marquee animation is running before first frame capture
2. Add frame-difference detection: if consecutive frames are identical, extend capture duration
3. Use global color palette across frames (not per-frame quantization) for better quality
4. Bump default capture scale to 2x
5. Add dithering option (Floyd-Steinberg) for smoother gradients

### Decision 5: Authentic finish library with provenance
**What**: Replace ad-hoc color swatches with a curated, labeled finish library grouped by iPod generation.
**Why**: The user wants this to be a museum. Every color must trace to a real Apple product.
**How**: Expand `scripts/color-manifest.json` with `authenticFinishes[]` array, each entry having: `{ id, label, generation, year, hex, wheelVariant, notes }`. UI groups by generation with labels like "Classic 6th Gen (2007)" and "Classic 7th Gen (2009)".

### Decision 6: 1st Gen iPod preset architecture
**What**: Add `ipod-1g-2001` preset with different physical proportions, mechanical scroll wheel (not click wheel), and monochrome menu.
**Why**: User wants museum concept starting with the original 2001 iPod.
**How**: New preset in `lib/ipod-classic-presets.ts` with unique shell/screen/wheel tokens. The scroll wheel renders as a ring with physical rotation affordance (no MENU/skip/play labels on wheel — those were separate buttons above the wheel on 1st gen). Screen renders monochrome green-backlit menu.

## Risks / Trade-offs

- **Risk**: Dynamic wheel color derivation may produce unexpected colors for edge-case hex inputs.
  Mitigation: Clamp derived colors to a known-good range. Use OKLCH lightness thresholds: L < 0.5 = dark wheel (white labels), L >= 0.5 = light wheel (dark labels).

- **Risk**: Menu stack machine adds state complexity.
  Mitigation: Keep the stack shallow (max 4 levels). Serialize to localStorage for persistence.

- **Risk**: GIF frame-difference detection adds export latency.
  Mitigation: Cap at 3 retry rounds. If still static, force a 1px progress bar advance per frame.

- **Risk**: 1st Gen iPod is architecturally different (mechanical wheel, no click wheel).
  Mitigation: Phase 3 work. Start with Classic 6th/7th gen fidelity first.

- **Trade-off**: Global GIF palette (better quality) vs per-frame palette (more color accuracy per frame).
  Decision: Use global palette. iPod UI has limited color range, so 256 colors is sufficient with a shared palette.

## Open Questions

- Should Cover Flow be a separate view mode or a sub-screen within iPod OS Music menu?
- What frame rate should GIF exports target? Current 12fps vs smoother 15fps (larger files)?
- Should the 1st Gen iPod preset share the same `IpodClassicPresetDefinition` type or have its own type?
