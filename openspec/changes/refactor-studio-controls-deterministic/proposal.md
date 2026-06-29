# Change: Deterministic precision-instrument control system, solved against the stage

## Why

The studio chrome reads as undesigned next to the polished iPod, and the reason is
structural, not a missing component library:

- **Affordance is border-only.** `racButton` distinguishes selected from rest by
  border color (`#111827` vs `#D0D4DA`) plus a faint `shadow-sm` — both states are
  white. Controls look like wireframe boxes that "don't want you to interact."
- **The palette is undisciplined.** Three competing blues fight: stage `#0048FF`,
  Carbon `#0F62FE` (in `carbon-checkbox`), and Tailwind `ring-blue-500` (focus).
  Colors are hardcoded hex scattered across panels — impossible to audit for contrast.
- **Radius is divorced from the product.** Controls hardcode `rounded-xl` while the
  device computes `preset.shell.radius`; the chrome's corners have no relationship to
  the device's.
- **The primitive layer is split-brain.** Product surfaces already run on React Aria
  (`colors-panel-body`, `settings-panel-body`, `animated-export-dialog`,
  `kuma-settings-panel`, `color-field`), yet 27 Radix packages are installed with only
  two (`react-checkbox`, `react-switch`) imported, and there are two diverging
  checkboxes (`checkbox`, `carbon-checkbox`).

The fix is not a pre-styled kit (Chakra/Carbon/MUI) — that adds a fourth opinion that
matches neither the iPod nor the stage. The fix is one bespoke, tokenized
**precision-instrument** control language with real affordance, whose colors are
**solved deterministically against the active stage background color** so every
control stays readable and consistent for any stage the user picks. React Aria remains
the invisible behavior engine (keyboard, focus, ARIA) — the reliability layer — and no
pre-styled library is added.

This supersedes and replaces `refactor-studio-industrial-controls`, carrying its
control vocabulary forward but correcting its no-fill selection model (the source of
the weak-affordance problem) and adding the deterministic stage-relative color solve.

## What Changes

- **New control primitives** (`components/ui/studio-controls.tsx`) on React Aria:
  `StudioButton`, `StudioSegment` (single active segment), `StudioChip` (swatch +
  label), `StudioField` (mono value field), `StudioLabel` (tracked small-caps), and
  `StudioRow` (label/value/control). Precision-instrument voice: tight type, single
  radius token, one accent.
- **Deterministic color solve.** Control fill, hairline, text, selected state, and
  focus ring are derived as a pure function of the active stage background color (dcal
  is the color authority), guaranteeing WCAG/APCA contrast across any stage color.
  Selection uses a solved **solid fill** for affordance — replacing the rejected
  no-fill hairline model.
- **One accent, one radius, one timing table.** Collapse the three blues to a single
  solved accent; bind control radius to the device radius family; shared
  microinteraction timings (hover ~130ms, selection ~220ms ease-out, no bounce).
- **Consolidate the behavior layer.** React Aria becomes the canonical headless layer;
  rebuild `checkbox`/`switch` on it; delete `carbon-checkbox`; remove the ~25 unused
  `@radix-ui/*` dependencies.
- **Focus (zen) mode.** A hide-chrome toggle that collapses the inspector panels to a
  clean stage view for screenshots/export, distinct from the existing per-edit
  "Lock editing" state.

## Impact

- Affected specs: `studio-control-language` (new), `ui-primitive-foundation` (new),
  `studio-focus-mode` (new)
- Affected code: `components/ui/studio-controls.tsx` (new),
  `components/ui/checkbox.tsx`, `components/ui/switch.tsx`,
  `components/ui/carbon-checkbox.tsx` (removed), `components/ui/index.ts`,
  `components/ipod/panels/*`, `components/ipod/workbench/*`, `components/ipod/editors/*`,
  `lib/color-manifest.ts`, `lib/design-system.ts`, a new control-token solver module,
  `package.json` (remove unused `@radix-ui/*`)
- Supersedes: `refactor-studio-industrial-controls` (removed by this change)
