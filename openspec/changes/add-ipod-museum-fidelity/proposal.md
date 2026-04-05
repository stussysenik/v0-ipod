# Change: Deliver museum-grade iPod fidelity, complete OS, and fix GIF motion

## Why
The app is close to being a definitive iPod tribute, but three gaps prevent it from reaching museum quality: (1) the flat 2D rendering doesn't match real iPod hardware at the pixel level — proportions, shadows, wheel-to-case color coupling, and skip icon glyphs diverge from reference photos, (2) the iPod OS is a shallow stub with no sub-menus, transitions, or hierarchical navigation, and (3) GIF exports produce a series of still frames rather than a smoothly looping animation. Fixing these transforms the project from "nice demo" into "Apple 50th anniversary tribute."

## What Changes
### Phase 1 — Design Fidelity + GIF Fix (today, Instagram-ready)
- **1:1 design decomposition** from reference photos (black iPod Classic 6th/7th gen)
- Wheel color dynamically matches case color (black case = black wheel, white case = white wheel)
- Skip icons use correct ⏪⏩ double-triangle-with-bar glyphs (not single triangles)
- Play/pause is a tight combined ▶‖ glyph (already fixed)
- Progress bar area is seamless — no extra divider line (already fixed)
- Screen bezel proportions, corner radii, and shadow depth match reference
- **Authentic Apple case color suite**: all documented iPod Classic finishes with provenance labels
  - White (1G-5G variants), Black (5G, 6G, 2008), Silver (6G), Charcoal, U2 Special Edition
  - Color relationships: when case changes, wheel/surround/label colors adapt automatically
- **GIF motion fix**: ensure exported GIFs always contain animated frames with marquee scrolling, not static duplicates. Fix frame timing, add global palette optimization, bump to 2x capture scale.

### Phase 2 — iPod OS Completion
- Hierarchical sub-menu system: Music > Artists > Albums > Songs
- Slide-left/slide-right transitions between menu levels
- Menu button navigates back one level (breadcrumb stack)
- "Now Playing" accessible from any menu depth via status bar tap
- Settings sub-menu renders inline (not modal)
- Cover Flow view (horizontal album art carousel in landscape-like strip)

### Phase 3 — 3D WebGL + iPod Museum
- Photorealistic Three.js materials: subsurface scattering, directional anisotropic scratches, environment reflections
- **1st Generation iPod** preset: mechanical scroll wheel, monochrome screen (Playlists/Artists/Songs/Contacts/Settings), thicker body proportions
- Generation switcher UI for museum browsing
- Each generation with accurate proportions, menu items, and color options

## Impact
- Affected specs: `ipod-design-fidelity`, `ipod-os`, `gif-export`, `ipod-museum`
- Affected code:
  - `components/ipod/ipod-screen.tsx` — screen layout, bezel, progress
  - `components/ipod/click-wheel.tsx` — icon glyphs, dynamic wheel color
  - `components/ipod/ipod-classic.tsx` — OS state machine, menu navigation, color relationships
  - `lib/color-manifest.ts` + `scripts/color-manifest.json` — authentic finish library
  - `lib/gif-export.ts` — frame capture, palette optimization, motion guarantee
  - `lib/ipod-classic-presets.ts` — 1st gen + museum presets
  - `components/three/three-d-ipod.tsx` — material upgrades
- Supersedes active work in: `deliver-anniversary-hero-surface`, `restore-finish-provenance`
