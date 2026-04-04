# Change: Deliver anniversary-grade iPod hero surface

## Why
The repo already has a broad feature set, but it still lacks a single canonical iPod presentation that feels worthy of an Apple 50th anniversary tribute. The next phase should optimize for realism, provenance, and export truth rather than adding breadth.

## What Changes
- Define `Flat` and `Preview` as the anniversary hero surfaces and keep production quality focused there.
- Require a physical-object realism pass for shell, wheel, center button, and screen surround.
- Require a provenance-backed finish library and governed neutral token system.
- Require a mobile-first, least-resistance color workflow that keeps the iPod preview visible while editing.
- Require preview/export parity for PNG and GIF, including worst-case metadata stability and artifact removal.
- Keep `3D`, `Focus`, and `ASCII` accessible, but explicitly secondary until they meet the same quality bar.

## Impact
- Affected specs: `anniversary-hero-surface`, `visual-fidelity`, `finish-provenance`, `surface-hierarchy`, `export-reliability`
- Affected code: `components/ipod/ipod-classic.tsx`, `components/ipod/ipod-screen.tsx`, `components/ipod/editable-text.tsx`, `lib/marquee.ts`, color/theme utilities under `lib/`, and Playwright regression coverage under `tests/`
