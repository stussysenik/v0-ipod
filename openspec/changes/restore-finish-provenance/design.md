## Context
The celebration goal changes the bar for this project. This phase is not about maximizing modes or customization breadth; it is about producing a digital object that reads as a real iPod Classic artifact. The primary surfaces are Flat and Preview because they are the most controllable, most exportable, and most likely to serve as the canonical tribute presentation.

Repo and delegate review both point to the same issue: the product already has enough features, but the hero object is not yet sufficiently resolved. The device body, wheel, center button, screen surround, finish library, color-selection workflow, and export parity still need convergence.

## Goals
- Make Flat and Preview feel physically believable and visually disciplined
- Restrict primary finish choices to provenance-backed iPod-family finishes plus governed neutrals
- Make color selection low-friction, mobile-first, and preview-led
- Ensure still and animated exports preserve the same illusion as the live product
- Treat tests as proof of hero-surface stability, not just feature coverage

## Non-Goals
- Polishing 3D, Focus, or ASCII to the same production standard in this phase
- Expanding to a broad Apple archive palette without provenance
- Adding new novelty modes or secondary customization systems

## Workstreams

### 1. Hero Object Realism
The shell, wheel, center button, and screen surround must read as real parts with disciplined edge definition and restrained lighting. The design should prefer quiet material separation over decorative glow. Visual hierarchy must keep the device itself as the hero.

### 2. Finish Authenticity
Finish selection should start with documented iPod-family finishes and governed neutrals. Generic abundance is less valuable than a curated, trustworthy set. Provenance labels and family grouping are part of the experience.

### 3. Picker Flow And Local Disclosure
When selecting finish or background color, the user should be able to see the object they are tuning. On narrow viewports, the active picker should receive space by collapsing or yielding competing chrome. The interaction should follow a principle of least resistance.

### 4. Export Truth
Preview and export must agree on timing, alpha handling, and layout. PNG and GIF outputs should preserve the same first impression as the live Flat/Preview surfaces, including worst-case metadata cases.

## Ruthless Implementation Order
1. Rework the hero object surface: shell, wheel, center button, screen surround, and primary action touchability.
2. Lock the finish library and neutral token system around documented iPod-family finishes.
3. Redesign the color-selection workflow so the preview remains visible and the active picker gets space, especially on mobile.
4. Make the internal screen composition stable under long metadata and stress states.
5. Eliminate preview/export mismatch and artifact regressions for PNG and GIF.
6. Leave secondary modes clearly labeled and out of the critical path.

## Delegate Audit Summary
- MTS #1 highlighted physicality gaps in the wheel/button area, overly software-like control surfaces, and the need to prioritize device-body realism over extra chrome.
- MTS #2 highlighted that finish choice breadth currently outruns provenance, and that picker UX still competes with the preview instead of serving it.
- MTS #3 highlighted that the anniversary goal depends on export truth: if preview and export diverge or metadata breaks under stress, the artifact fails the tribute purpose.
