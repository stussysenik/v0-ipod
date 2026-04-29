# Design-System Foundation

This document records the local design-system boundary introduced before
Storybook.

## Shared Token Sources

- Shared primitive token source of truth: `tokens/shared-ui.json`
- Shared primitive typed adapter: `lib/shared-ui-tokens.ts`
- Product fidelity token source of truth: `scripts/color-manifest.json`
- Product chrome token source of truth: `scripts/design-system.json`
- Product token adapters: `lib/color-manifest.ts`, `lib/design-system.ts`

## Components UI Inventory

### `components/ui/icon-button.tsx`

- Classification: design-system candidate
- Status: shared primitive
- Notes: now reads semantic visual values from `tokens/shared-ui.json`

### `components/ui/marquee-text.tsx`

- Classification: reusable primitive
- Status: DS-ready for Storybook
- Notes: behavior-first overflow primitive used by the iPod scenes but not
  visually bound to the shell

### `components/ui/theme-provider.tsx`

- Classification: shared infrastructure wrapper
- Status: not a standalone design-system showcase primitive
- Notes: keep as Storybook/provider wiring rather than story-first UI

## Product-Owned Audit

These surfaces remain under `components/ipod/*` because they encode hardware,
screen chrome, or app-specific authoring behavior:

- `controls/*`: physical device controls such as click wheel, rating, progress
- `display/*`: screen surround, status bar, battery, glass overlay, scene frame
- `editors/*`: inline editing affordances, mobile editors, color inputs
- `panels/*` and `scenes/*`: now-playing composition and menu behavior
- `device/*`, `workbench/*`, and `export/*`: app assembly and capture pipeline

## Ownership Rule

- Add code to `components/ui/*` only when the API and styling are intentionally
  reusable beyond the iPod artifact.
- Add code to `components/ipod/*` when the UI depends on product fidelity,
  hardware metaphor, scene state, or iPod-specific semantics.
- If reuse would require iPod-specific prop names, historical assumptions, or
  product-only token lookups, the component stays in `components/ipod/*`.

## Migration Path

1. Seed shared semantics in `tokens/shared-ui.json`.
2. Expose them through typed adapters in `lib/shared-ui-tokens.ts`.
3. Move reusable `components/ui/*` visuals onto those semantics one primitive at
   a time.
4. Leave `components/ipod/*` on product manifests until a reuse case is real.

## Storybook Candidates

Shared primitives to document first:

- `IconButton`
- `MarqueeText`

Shared infrastructure to wire into Storybook:

- `ThemeProvider`

Product showcase artifacts for later Storybook lanes:

- `IpodDisplay`
- `IpodScreen`
- `IpodClickWheel`
- `IpodProgressBar`
- `EditableText`
- `HexColorInput`
- workbench and export surfaces

## Ready-To-Unblock Outcome

The repository now has:

- a local `DESIGN.md`
- an explicit shared token path
- a documented ownership rule for `components/ui` versus `components/ipod`
- a first Storybook candidate list separated from product showcase artifacts
