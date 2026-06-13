# Wheel Label QC + Natural Light Template (2026-06-13)

## Context

The mm-derivation pass landed the machined face (Ø38.0 wheel, 30.4mm seat) but
`ipod-click-wheel.tsx` still carries `transform: scale(0.8)` — a stale
compensation from the old oversized 272px wheel token (battery commit cb6241c;
0.8 × 272 ≈ the new mm-true 212.9). Today it double-shrinks the rendered wheel
to a Ø30.4mm equivalent and drags MENU/⏮/⏭/⏯ toward the center hub — confirmed
in SCR-20260613-deiq.png. On top of that, lopsided CSS paddings seat the four
labels at three different radial distances (≈23 / 30 / 37px from the rim), an
asymmetry any perspective exposes. Labels on the black device also sink into
the dark rigs, and there is no natural-light rig template for clear product
exports.

User constraints: CNC realism — spacing accounted for, nothing floats;
symmetry must survive perspective; headless verification only (math + tests);
MENU must stay linked (verified: wired in workbench, 3D stage, portfolio);
truth-preserving fixes only — new presentation ideas (stand/wall placement,
material types) are separate additive changes, not this pass.

```mermaid
mindmap
  root((Wheel QC + light evidence))
    Geometry truth
      Remove stale scale 0.8
      Seat all four labels on annulus midline
      Subtract inset tokens — derive instead
    Industrial QC tests
      Equal radial seat by construction
      In-band clearance rim and button
      Inter-label separation
      3D overlay 1to1 with wheel mesh
      Label contrast per preset
    Light evidence
      Natural Light rig preset
      Chromeless label presence lift
      Rig invariants test
```

## Tasks

- [x] 1. `lib/ipod-classic-presets.ts`: export `wheelLabelSeatPx` (annulus mid-band
      seat, derived from size/centerSize); subtract `menuTopInset`/`sideInset`/
      `bottomInset` tokens from `WheelPresetTokens` + all presets
- [x] 2. `components/ipod/controls/ipod-click-wheel.tsx`: remove `scale(0.8)`;
      center-anchor all four labels on the derived seat with symmetric hit padding;
      lift label presence in chromeless (3D) mode
- [x] 3. QC tests in `lib/ipod-classic-presets.test.ts`: seat symmetry, in-band
      clearances, inter-label separation, overlay 1:1, label/ring contrast
- [x] 4. `lib/studio-lighting-config.ts`: `NATURAL_LIGHT_RIG` + `RIG_PRESETS` entry —
      bright daylight front fill so dark wheels keep label legibility, warm stage
- [x] 5. New `lib/studio-lighting-config.test.ts`: preset ids unique, sanitize
      round-trip, light-evidence QC (front fill energy, ambient floor)
- [x] 6. Verify: vitest unit 170/170 ✓, type-check ✓, lint 0 errors ✓,
      production build ✓ (all routes prerendered)

## Follow-ups (separate changes, by design)

- Product-placement display poses (Float / Stand / Wall lean) as its own
  OpenSpec change — additive layer over the stable 3D stage.
- User-facing material/finish types (gloss piano, matte, brushed) building on
  `studio-owned-finish.ts` invariants.

## Review

Landed on `feat/wheel-label-qc-natural-light` (stable version pushed to main
first as 374ac34, per request).

Geometry: the stale `scale(0.8)` is gone — the wheel renders at its true
Ø38.0mm projection in 2D and 1:1 under the 3D mesh. All four labels now sit on
the annulus radial midline by construction (one derived `wheelLabelSeatPx`,
center-anchored, symmetric hit padding) — replacing optical centers that sat at
≈23/30/37px from the rim. The per-preset inset tokens were subtracted entirely.

Light: `NATURAL_LIGHT_RIG` ("Natural Light", id `natural`) added to
RIG_PRESETS with a warm paper stage — a window-daylight template whose big
bright front softbox is what lifts dark-wheel label contrast (metal tone =
albedo × environment). Chromeless (3D) label ink lifted to 0.82/0.78.

QC: 39 new headless tests — label seat symmetry, in-band clearances,
inter-label separation, overlay 1:1 with the mesh, WCAG ink contrast per
shipped colourway, rig persistence round-trips, and Natural Light's
light-evidence invariants. 170/170 unit tests, type-check, lint, and a full
production build all pass. Export WYSIWYG holds: the capture path rasterizes
the live wheel DOM, so baked glyphs inherit the new seating automatically.

MENU wiring verified linked in all three surfaces (workbench, 3D stage,
portfolio) — nothing needed removal.
