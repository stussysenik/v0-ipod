## 1. Hero Object Realism
- [ ] 1.1 Capture fresh Flat and Preview baseline screenshots for comparison against anniversary-quality targets.
- [ ] 1.2 Rework shell, screen surround, wheel, and center-button geometry to read as physically believable parts.
- [ ] 1.3 Make primary buttons and tappable controls feel touchable through disciplined edge, highlight, and shadow treatment.
- [ ] 1.4 Remove decorative glow, theatrical chrome, and competing editorial surface treatments from the production path.

## 2. Finish Authenticity
- [ ] 2.1 Build a provenance-backed iPod family finish library with labels and family grouping.
- [ ] 2.2 Introduce governed neutral tokens for shell, wheel, surround, and backdrop relationships.
- [ ] 2.3 Move speculative or broad archive colors out of the primary production flow until provenance is documented.

## 3. Color Selection UX
- [ ] 3.1 Redesign finish and background selection around a principle-of-least-resistance, mobile-first flow.
- [ ] 3.2 Ensure active color pickers collapse or yield competing rails, tabs, or panels so the target device preview stays visible.
- [ ] 3.3 Keep common finish decisions reachable with minimal taps and without opening multiple competing panels.

## 4. Screen Composition Fidelity
- [ ] 4.1 Add worst-case metadata fixtures and visual baselines for long title, artist, and album combinations.
- [ ] 4.2 Preserve stable spacing between artwork, metadata lanes, counter, rating, and progress regions under stress.
- [ ] 4.3 Verify Flat and Preview preserve the same internal screen composition rules.

## 5. Export Truth
- [ ] 5.1 Unify preview and export timing for marquee, progress, and capture start states.
- [ ] 5.2 Remove white-rectangle, alpha-matte, and transparency artifacts from PNG and GIF exports.
- [ ] 5.3 Verify worst-case metadata remains legible and stable in still and animated exports.

## 6. Product Hierarchy
- [x] 6.1 Make Flat and Preview the primary surfaced production modes.
- [x] 6.2 Keep 3D, Focus, and ASCII accessible but clearly marked WIP/Experimental.
- [ ] 6.3 Review surrounding settings architecture so the device remains the visual hero of the page.

## 7. Validation
- [x] 7.1 Add failing Playwright coverage for long-metadata layout drift, picker visibility on mobile, and PNG/GIF artifact regressions.
- [x] 7.2 Run npm type-check and the relevant Playwright suites after each major workstream.
- [x] 7.3 Run openspec validate restore-finish-provenance --strict --no-interactive.
