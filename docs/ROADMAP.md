# Roadmap: iPod Snapshot

## Phase 1: Stabilization & Mobile Usability (Current)
- [x] Predictable 3D export with front-facing reset
- [x] Context-aware export button labels
- [x] Robust pointer-based click wheel interactions
- [x] Fix Marquee Preview tooltips & Animated GIF exports

## Phase 2: Refined Capture & Fidelity
- [ ] Add explicit export quality toggles (1024 / 2048 / 4096).
- [ ] Enable robust transparent backgrounds in both PNG and GIF output formats.
- [ ] Implement custom rotation angle locking prior to 3D exports.

## Phase 3: Performance & Edge Cases
- [ ] Investigate WebGPU / Next.js server actions for ultra-fast generation of frames.
- [ ] Shift image processing optimization chunks to a lightweight WebAssembly module.
- [ ] Support animated artist/album transitions or BPM-reactive speeds for GIF captures.

## Phase 4: Product Expansion
- [ ] Expand theme panel to include UI color/font customizers.
- [ ] Export directly to social integrations (e.g., native share sheet upgrades).
