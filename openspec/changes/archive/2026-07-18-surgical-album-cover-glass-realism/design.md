## Context
The iPod Classic (6th gen) uses a 2.5" QVGA LCD (320×240, 163 ppi) behind a glossy plastic screen cover. The plastic cover diffuses LCD light and catches ambient reflections, creating a characteristic "behind glass" look. The current implementation renders artwork with no diffusion layer, making it appear pasted-on rather than rendered-through.

Reference: The HTML prototype at `/Users/s3nik/Downloads/Recreating-Now-Playing-UI.html` uses `perspective(600px)` + `rotateY(25deg)` to simulate depth. **This approach is rejected** — real iPod displays artwork flat; depth comes from the glossy surface, not 3D transforms.

## Goals
- Make artwork read as LCD content behind glossy plastic, not a bare `<img>` tag
- Soften the reflection to feel like a glossy-screen surface reflection, not a mirror
- Remove UI-widget framing (border) around artwork, matching real iPod LCD rendering
- Preserve all existing functionality: drag layout, inline editing, export safety, image upload

## Non-Goals
- Changing the screen-wide glass overlay (`ipod-glass-overlay.tsx`)
- Adding 3D transforms, perspective, or tilt to artwork
- Modifying artwork sizing or positioning tokens
- Adding new decorative effects beyond the glass simulation

## Decisions

### Decision 1: `backdrop-filter: blur(1.5px)` layered over artwork
**Why**: The glossy plastic LCD cover diffuses pixel light. `backdrop-filter` applies a real-time blur to everything behind the overlay element, matching the physical diffusion model.
**Alternatives considered**:
- CSS `filter: blur()` on the img itself → Rejected: blurs the image source, creating a soft-focus photo look rather than glass diffusion
- Canvas-based WebGL blur → Rejected: over-engineered for this need
- No blur, just gradient overlay → Rejected: gradients alone don't simulate pixel diffusion

### Decision 2: Gradient + blur combined
A `linear-gradient(135deg, rgba(255,255,255,0.07) ...)` provides the glossy "light catch" at the top-left corner of the screen (matching typical studio lighting), while the `backdrop-filter` provides the pixel-level diffusion. Together they model both the specular and diffusive properties of the plastic cover.

### Decision 3: Reflection height 30% (was 45%), blur 2.5px, mask opacity 0.38 (was 0.65)
These values were chosen by analyzing real iPod Classic photographs. The glossy screen reflection is:
- Shorter than LCD content (~25-30% of height, not 45%)
- Visibly blurred (plastic cover scatters reflected light)
- Soft at origin, fading quickly

### Decision 4: `boxShadow` hairline instead of `border`
A `1px solid #A1A1A1` border reads as HTML widget chrome. Real iPod LCD shows artwork edge-to-edge with only a sub-pixel anti-aliasing transition against the white screen background. `boxShadow: 0 0 0 1px rgba(0,0,0,0.07)` provides a barely-perceptible edge at ~7% opacity — enough to define the artwork boundary without looking like a frame.

### Decision 5: Disable glass overlay during export (`!exportSafe`)
The `backdrop-filter` uses GPU compositing that may not render identically in headless export paths. Following the existing pattern in `ipod-glass-overlay.tsx`, the glass diffusion layer is suppressed during export to avoid rendering inconsistency.

## Proportions Reference (iPod Classic 6th Gen)
| Measurement | Value | Rationale |
|---|---|---|
| Screen resolution | 320×240 px | QVGA LCD |
| Status bar height | 18 px | `classic-2008` preset |
| Progress bar zone | 34 px | Footer + bottom margin |
| Content area height | 184 px | 240 − 18 − 34 − 4 |
| Artwork size | 132 px | 71.7% of content height |
| Artwork column width | 144 px | Left column grid allocation |
| Glass blur radius | 1.5 px | ~0.47% of screen width, subtle |
| Reflection height | 40 px | 30% of 132px ≈ minimal gloss |
| Reflection blur | 2.5 px | Scattered by plastic cover |
| Border opacity | 0.07 | ~7%, near-invisible |

## Risks / Trade-offs
- **`backdrop-filter` performance**: Adds GPU compositing cost. Mitigated by single-layer application limited to artwork zone (~132×132px), disabled during export.
- **Browser compatibility**: `backdrop-filter` is supported in all modern browsers (Chrome 76+, Safari 9+, Firefox 103+). Falls back gracefully — artwork just appears without diffusion.
- **Over-blurring**: At 1.5px, the blur is subtle enough to not muddy detail. If visual verification shows it's too strong, reduce to 1px or increase gradient opacity to compensate.

## Open Questions
- [ ] Does the glass diffusion effect read correctly at both 1x and 2x device pixel ratios? (Vision model verification needed)
- [ ] Does the reflection feel authentic when compared side-by-side with a real iPod Classic photograph? (Vision model verification needed)
- [ ] Should the glass overlay effect be extended to cover the *entire* screen content area (not just artwork)? (Deferred — focus on artwork first)
