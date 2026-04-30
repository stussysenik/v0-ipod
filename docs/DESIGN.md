# Local Design Contract

This file overrides `/users/s3nik/.gemini/DESIGN.md` for this repository.

## Purpose

This project is an iPod assembly artifact first and a reusable design system
second. The local contract exists to make that boundary explicit before
Storybook or broader design-system tooling is added.

## Layer Boundaries

- `components/ui/*` is reserved for intentionally reusable primitives that can
  outlive the iPod assembly.
- `components/ipod/*` owns product fidelity, hardware metaphor, scene
  composition, editor overlays, and historically specific styling.
- `lib/color-manifest.ts` and `lib/design-system.ts` remain product-token
  adapters for iPod fidelity surfaces.
- `tokens/shared-ui.json` is the source of truth for shared primitive tokens.

## Token Policy

- Shared primitives MUST read semantic values from `tokens/shared-ui.json`
  through a typed adapter.
- Product-owned iPod surfaces MAY continue to read from
  `scripts/color-manifest.json`, `scripts/design-system.json`, and preset data
  when the styling is specific to the artifact.
- New raw color literals SHOULD NOT be introduced in `components/ui/*`.
- Existing raw color literals in `components/ipod/*` are acceptable in this
  phase when they encode product fidelity rather than general UI reuse.

## Typography

- App-shell and shared-primitive typography stays on the current
  `Geist Sans` / `Geist Mono` stack during this foundation pass.
- iPod screen chrome and hardware labels may continue to use
  `"Helvetica Neue", Helvetica, Arial, sans-serif` where visual fidelity
  depends on it.
- This change does not introduce a broader font redesign.

## Spacing And Geometry

- Shared primitives use a 4px-derived spacing scale: `4, 8, 12, 16, 24, 32, 48`.
- Shared primitives use semantic radii from tokens rather than ad hoc values.
- Full-pill controls are valid in `components/ui` when the primitive semantics
  call for them, as with icon buttons and badges.

## Primitive Inventory

- `components/ui/icon-button.tsx`
  - Design-system candidate.
  - Reusable outside the iPod artifact.
  - Must stay token-backed.
- `components/ui/marquee-text.tsx`
  - Reusable primitive.
  - Behavior-first and not visually tied to the iPod shell.
- `components/ui/theme-provider.tsx`
  - Infrastructure wrapper.
  - Shared, but not a first-class Storybook primitive.

## Product-Owned Surfaces

The following stay under `components/ipod/*` and are not shared primitives in
this phase:

- display assemblies such as `ipod-display`, `ipod-screen`, `ipod-status-bar`
- hardware controls such as `ipod-click-wheel` and `ipod-progress-bar`
- editors such as `editable-text`, `editable-time`, `hex-color-input`
- panels, scenes, workbench, export surfaces, and device shells

## Storybook Readiness

- Storybook should start with `IconButton` and `MarqueeText`.
- `ThemeProvider` should be used as Storybook infrastructure or decorator
  support rather than a standalone showcase story.
- iPod assemblies should appear later as product showcase artifacts, not as
  shared design-system primitives.

## Workflow

1. Update shared primitive tokens in `tokens/shared-ui.json`.
2. Read those tokens through `lib/shared-ui-tokens.ts`.
3. Keep product token changes in `scripts/color-manifest.json` and
   `scripts/design-system.json`.
4. Document any new primitive boundary decisions in
   `docs/DESIGN-SYSTEM-FOUNDATION.md`.

## Explicit Exclusions

- No Storybook setup in this change.
- No broad redesign of the iPod artifact.
- No forced extraction of product assemblies into generic components.
- No requirement that every existing component become token-backed now.
