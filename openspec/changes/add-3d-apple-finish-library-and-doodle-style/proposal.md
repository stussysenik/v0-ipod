# Change: Centralized Finish system, Apple generation library, and doodle render style

## Why

The /3d customizer currently splits one concept across three shapes — `FinishAsset` (2 preloaded finishes), `DeviceLook` (6 curated "Combinations"), and `StudioTheme` (saved looks) — and only `StudioTheme` carries the lighting rig. The user's mental model is singular: **a Finish IS the complete combination** (every body surface + stage + light). The split causes real defects: edges fall back to `backColor`, combinations don't set the rig, and the case-color ↔ lighting relationship — the heart of how a polished metal object reads — is buried in two separate panels. Meanwhile the library holds zero of Apple's actual factory colors, and exports should be share-ready (stage included) the moment a finish is tapped.

## What Changes

- **Centralize the Finish record.** One `StudioFinish` type in `lib/studio-finishes.ts`: id, label, family/generation, all seven surface colors **explicit** (case, ring, center, back, edge, bezel, stage) and a paired `rigName`. No optional surfaces, no fallback gaps — applying a finish fully determines the rendered object and its light. `FinishAsset` and `DeviceLook`/`CURATED_LOOKS` are **REMOVED**; `StudioTheme` becomes a user-saved `StudioFinish` (persistence shape unchanged plus `family: "Custom"`).
- **Preload the Apple factory library**, named by generation and marketing color: iPod classic 6G (Silver, Black/Noir), iPod mini 1G (Silver, Gold, Pink, Blue, Green), iPod nano 2G (Black, Blue, Green, Pink, (PRODUCT) RED), iPod nano 4G chromatic (Purple, Yellow, Orange), and the U2 Special Edition (black body, red click wheel). Hex values research-grounded from archival/press sources; tuned as PBR albedo for metalness ≈ 1.0 rendering.
- **Pair every finish with a lighting rig** by luminance/chroma class: light neutrals → Apple Product; saturated anodized (incl. the reds) → new `ANODIZED_POP_RIG` (neutral-white, chroma-preserving — a warm key shifts red toward orange, so Pop's sources are achromatic); dark finishes → Designer Dark / Edge Noir. Stage colors follow Apple campaign language (nano-chromatic tone-on-tone fields, Noir blue, white studio).
- **Add the doodle render style.** `studio.technicalFlat: boolean` generalizes to `renderStyle: "studio" | "flat" | "doodle"` (**BREAKING** for the persisted studio slice; sanitizer migrates `technicalFlat: true → "flat"`). Doodle renders unlit albedo plus black inverted-hull outlines on every part (case, wheel ring, center, bezel, back) so parts read with clear cartoon separation.
- **Restructure the color cockpit around case × light.** The Finish library (generation-grouped) replaces the Finish/Combinations/Quick triad; a pairing strip places the active case swatch directly against the rig presets so the relationship is one visible, directly-manipulable decision; a Style segment (Studio / Flat / Doodle) joins the cockpit.

## Impact

- Affected specs: `3d-finish-library` (new), `3d-render-styles` (new), `3d-control-surface` (modified layout)
- Affected code: `lib/studio-finishes.ts` (new), `lib/studio-themes.ts`, `lib/studio-lighting-config.ts` (+1 rig), `lib/ipod-state/model.ts` / `update.ts` / `storage.ts` (renderStyle migration), `components/three/three-d-ipod.tsx` (doodle outlines), `components/ipod/scenes/ipod-3d-color-cockpit.tsx`, `ipod-3d-lighting-cockpit.tsx`, `ipod-3d-studio-cockpit.tsx`
- Pending-change overlap: `add-3d-color-combinations` (superseded by this centralization), `add-3d-studio-control-suite` (cockpit layout coordination)
