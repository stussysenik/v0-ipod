## Context
The current export implementation clones the render target into an off-screen detached node and captures with `html-to-image`, with `html2canvas` fallbacks. This improves reliability but still leaks compositing/shadow artifacts on some WebKit/Chromium paths, especially where heavy blur shadows extend beyond visible bounds. Input behavior is also split across touch and mouse handlers in multiple components, creating inconsistent editing entry points.

## Goals / Non-Goals
- Goals:
  - Produce deterministic flat exports that avoid clipped/ghost shadows.
  - Make success feedback quieter and reserve intrusive messaging for failures.
  - Provide a fixed touch-friendly editing input surface while preserving desktop editing ergonomics.
  - Unify cross-platform gesture/touch/click handling via pointer-first interaction.
- Non-Goals:
  - Full framework migration.
  - Redesigning the 3D mode rendering stack.

## Decisions
- Decision: Capture from an export-safe clone with explicit shadow sanitization.
  - Why: The artifact appears when detached captures include large blurred shadows near off-screen bounds. Export-safe styles can preserve visual intent while avoiding clipping/compositor seams.
- Decision: Keep current fallback chain (`html-to-image` then `html2canvas`) but add deterministic clone preparation and diagnostics.
  - Why: Existing chain already handles browser variability; root issue is node style determinism.
- Decision: Introduce a shared fixed editor overlay for touch-coarse pointers.
  - Why: Native inline inputs shift with virtual keyboards and create inconsistent focus behavior on mobile.
- Decision: Move wheel drag handling to Pointer Events.
  - Why: Pointer Events unify mouse/touch/pen and simplify gesture behavior.

## Risks / Trade-offs
- Risk: Over-sanitizing shadows could reduce realism in exports.
  - Mitigation: Apply sanitization only inside export clone/export-safe mode and keep tuned lightweight shadows.
- Risk: Overlay editor could conflict with existing inline edit expectations.
  - Mitigation: Keep desktop inline edit behavior and enable overlay primarily for touch/coarse pointers.
- Risk: Additional export diagnostics could be noisy.
  - Mitigation: Scope logs to explicit export actions and use concise structured fields.

## Migration Plan
1. Add export-safe clone sanitization and diagnostics.
2. Add muted feedback behavior and keep error retry actions.
3. Introduce shared fixed editor overlay and wire editable fields.
4. Switch click wheel drag behavior to pointer events.
5. Update tests and run local verification.

## Open Questions
- Should export diagnostics be persisted (for support) or remain console-only?
- Should desktop users also have an optional fixed editor mode?
