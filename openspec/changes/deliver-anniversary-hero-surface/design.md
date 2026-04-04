## Context
This project is now acting less like a broad interaction sandbox and more like a digital product tribute. The anniversary objective demands a calm, historically respectful, shareable iPod Classic artifact rather than a wide set of equally emphasized modes.

## Goals
- Produce one convincing, export-ready iPod Classic hero artifact.
- Make the device read as a physical product through restrained geometry, edge definition, and material separation.
- Curate finishes around documented iPod families before any broader speculative Apple palette.
- Make finish/background editing fast on mobile and non-obstructive to the live preview.
- Keep exported PNG/GIF output visually aligned with the on-screen preview.

## Non-Goals
- Expanding secondary modes just because they already exist.
- Adding more novelty palettes before provenance is documented.
- Hiding fidelity issues behind decorative overlays, atmospheric effects, or theatrical framing.

## Product Principles

### 1. The object is the hero
The iPod itself must dominate the page. Settings, tabs, drawers, and mode chrome support the object; they do not compete with it.

### 2. Authenticity beats abundance
A smaller, documented finish library is better than a large but weakly sourced palette. Curation is part of fidelity.

### 3. Physicality comes from discipline
The shell, wheel, and center button should feel touchable through edge control, contrast, inset relationships, and restrained highlights rather than glow.

### 4. Preview and export must tell the same truth
If the preview looks right but the exported PNG/GIF diverges in timing, matte treatment, or layout, the hero artifact is not actually delivered.

### 5. Mobile editing is not a fallback
Color selection and related controls must work cleanly on narrow viewports, with the preview remaining visible when choosing finishes.

## Implementation Workstreams

### Workstream A: Hero object realism
Rework the front-face composition in `components/ipod/ipod-classic.tsx` so the shell, wheel, center button, and screen surround read as a believable product. Remove decorative treatments that dilute the industrial-design read.

### Workstream B: Screen composition fidelity
Refine `components/ipod/ipod-screen.tsx` and supporting text/layout logic so long metadata, artwork, rating, counters, and progress remain stable and balanced.

### Workstream C: Finish authenticity and picker UX
Move finish selection toward documented families with governed neutrals, then redesign the picker flow so active pickers yield surrounding chrome and preserve preview visibility on mobile.

### Workstream D: Export truth
Align preview and export timing/state, remove white or alpha-matte artifacts, and verify worst-case metadata in both still and animated outputs.

## Delivery Sequence
1. Capture the current hero-surface baseline and failing cases.
2. Fix the physical read of the device body and controls.
3. Stabilize the screen composition under stress content.
4. Redesign finish selection and active-picker disclosure.
5. Lock preview/export parity and artifact removal.
6. Re-run visual and interaction regressions before broadening scope.
