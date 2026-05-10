# Change: Surgical Album Cover Glass Realism

## Why
The iPod Classic Now Playing screen's album artwork currently renders as a flat, bare pixel grid — it lacks the "behind glossy plastic LCD cover" sensation that makes a real iPod recognizable at first glance. The glass overlay exists screen-wide (`ipod-glass-overlay.tsx`) but does not diffuse the artwork specifically. The reflection below the artwork is too tall, sharp, and mirror-like, reading as a fake effect rather than the soft glossy-screen reflection of a physical device. The visible `#A1A1A1` border frames the artwork like a UI widget, not like an LCD-rendered image. These three gaps are the last fidelity delta separating the digital artifact from photographic iPod Classic realism.

## What Changes
- **Artwork glass diffusion**: Add a `backdrop-filter: blur(1.5px)` overlay with a subtle 135° gradient specifically over the artwork, simulating light diffusion through the glossy plastic LCD cover
- **Reflection softening**: Reduce reflection height from 45% → 30% of artwork, apply `filter: blur(2.5px)`, soften mask gradient from 0.65 → 0.38 opacity
- **Border removal**: Replace `border border-[#A1A1A1]` with `boxShadow` hairline (`0 0 0 1px rgba(0,0,0,0.07)`), matching the near-invisible edge of artwork on real iPod LCD
- **Verification gate**: Requires visual confirmation against photographic references via vision model or Chrome DevTools screenshot comparison

## Impact
- Affected specs: `album-cover-realism` (new capability)
- Affected code: `components/ipod/panels/ipod-artwork-panel.tsx` (primary, +14 LOC net), `components/ipod/display/ipod-glass-overlay.tsx` (reference only, no changes)
- No breaking changes — preserves all existing props, export-safe paths, drag layout compatibility
- No new dependencies
