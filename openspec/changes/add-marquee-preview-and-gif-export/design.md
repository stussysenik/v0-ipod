## Context
The app already has a stable detached-node PNG export path, but it explicitly freezes animations during capture. The title row is currently rendered as editable text, and the older `MarqueeText` helper is hover-driven and does not participate in the actual screen UI. Animated preview and GIF export therefore need a shared deterministic motion model rather than a CSS-only animation.

## Goals / Non-Goals
- Goals:
  - Add a dedicated preview mode for the title marquee without disrupting current flat editing.
  - Recreate the iPod-style marquee with hard pause, linear leftward crawl, integer-pixel steps, and a blank loop gap.
  - Export a full-frame animated GIF from the flat iPod composition.
- Non-Goals:
  - Replace PNG export.
  - Animate artist/album metadata.
  - Add BPM-reactive speed, font changes, or edge masks in this change.

## Decisions
- Decision: Add `preview` as a new persisted view mode.
  - Rationale: It isolates animation preview from the current editing-focused flat mode.
- Decision: Use a shared marquee timing helper for both live preview and GIF capture.
  - Rationale: Preview and export must stay visually identical, and the current export pipeline disables ambient CSS animations.
- Decision: Keep GIF export download-only and available only in Preview Mode.
  - Rationale: Browser support for sharing animated GIF files is less reliable than direct download, and mode-gating keeps the UI understandable.
- Decision: Encode GIFs client-side with `gifenc`.
  - Rationale: It is lightweight, browser-friendly, and avoids worker asset complexity for this UI-sized capture.

## Risks / Trade-offs
- Risk: GIF encoding can be slower than PNG export.
  - Mitigation: Encode at `pixelRatio: 1` and `12 fps`, and surface an explicit `encoding` state in the UI.
- Risk: Long titles could generate large animations.
  - Mitigation: Export a single loop cycle and keep speed fixed instead of increasing resolution or frame rate.

## Migration Plan
1. Add new spec deltas and change proposal files.
2. Update view-mode persistence and screen rendering for preview mode.
3. Add deterministic marquee behavior and integrate it into the title row.
4. Add GIF export pipeline and toolbar action.
5. Update Playwright coverage for preview mode and GIF download behavior.

## Open Questions
- None. Product decisions were settled in planning.
