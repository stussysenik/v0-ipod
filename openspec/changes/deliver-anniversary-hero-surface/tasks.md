## 1. Baseline And References
- [x] 1.1 Capture current `Flat` and `Preview` baselines on desktop and mobile with canonical and stress metadata fixtures.
- [ ] 1.2 Capture current PNG and GIF exports for those same states and log parity/artifact failures.
- [x] 1.3 Assemble the reference set for front-face geometry, finish families, and screen composition that will anchor the anniversary pass.

## 2. Hero Object Realism
- [ ] 2.1 Rework shell, screen surround, and wheel proportions in `components/ipod/ipod-classic.tsx` so the front face reads as a believable iPod Classic.
- [ ] 2.2 Make the click wheel and center button feel physically pressable through edge, inset, shadow, and highlight discipline.
- [ ] 2.3 Remove decorative glow, editorial side treatments, and other non-essential chrome that weakens the industrial-design read.

## 3. Screen Composition Fidelity
- [ ] 3.1 Stabilize the `Now Playing` layout in `components/ipod/ipod-screen.tsx` for long titles, artists, and albums.
- [ ] 3.2 Tune artwork, metadata lanes, rating, counters, and progress spacing so the composition remains calm and legible.
- [ ] 3.3 Ensure `Preview` preserves the same core information hierarchy as the polished `Flat` surface.

## 4. Finish Authenticity And Picker UX
- [ ] 4.1 Implement a provenance-backed primary finish library for documented iPod-family finishes.
- [ ] 4.2 Apply governed neutral tokens consistently across shell, wheel, screen surround, and backdrop relationships.
- [ ] 4.3 Redesign finish/background selection for a mobile-first, least-resistance workflow.
- [ ] 4.4 Make active color pickers collapse or yield competing tabs, rails, and large settings chrome so the preview remains visible.

## 5. Mode Hierarchy And Export Truth
- [x] 5.1 Make `Flat` and `Preview` the clearly primary anniversary surfaces in the mode hierarchy.
- [x] 5.2 Keep `3D`, `Focus`, and `ASCII` accessible but explicitly experimental and non-competing.
- [ ] 5.3 Unify preview/export start state, marquee timing, and transparency handling across PNG and GIF capture.
- [ ] 5.4 Eliminate white-rectangle, alpha-matte, and layout drift artifacts from exported assets.

## 6. Validation
- [x] 6.1 Add Playwright regression coverage for control tactility cues, long-metadata stability, active-picker visibility, mode disclosure, and export parity.
- [x] 6.2 Run `npm run type-check`.
- [ ] 6.3 Run the relevant Playwright suites and record any required manual visual checks.
- [ ] 6.4 Run `openspec validate deliver-anniversary-hero-surface --strict --no-interactive`.
