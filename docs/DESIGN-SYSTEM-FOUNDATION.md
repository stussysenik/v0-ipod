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

## Storybook Workflow

- `Foundations/*` documents repository rules, token ownership, and contributor workflow.
- `tokens/*` mirrors repository token files such as `tokens/shared-ui.json`.
- `scripts/*` mirrors repository manifest files such as `scripts/color-manifest.json`.
- `components/ui/*` mirrors shared primitive files.
- `components/ipod/*` mirrors product-owned files and assemblies.
- `components/ipod/device/PhysicalIpod` is the default Storybook surface for hardware-shell, screen, and click-wheel review.

## Token Sync Workflow

1. Update shared primitive tokens in `tokens/shared-ui.json`.
2. Read those tokens through `lib/shared-ui-tokens.ts`.
3. Review the resulting primitive behavior in Storybook before widening usage in the app.
4. Sync Tokens Studio / Figma against the repository token JSON so design stays aligned with code.
5. Treat repository token files and code review as the approval path for shared primitive token changes.

## Going-Forward Rule

- Default to Storybook for token edits, shared primitive work, and physical iPod assembly review.
- Default to the full app workbench for end-to-end authoring behavior, persistence, export, and broader integration checks.
- Keep Storybook titles aligned with repository paths so contributors can jump from sidebar to file ownership without translation.

## Working Method

- For shared UI:
  edit `tokens/shared-ui.json` → review `tokens/*` → review `components/ui/*`
- For product finish and chrome:
  edit `scripts/color-manifest.json` or `scripts/design-system.json` → review `scripts/*` → review `components/ipod/*`
- For product assembly behavior:
  edit the owning `components/ipod/*` file → review the matching element story → review `components/ipod/device/PhysicalIpod`
- Use the app page only after Storybook review when you need export, persistence, or full workbench confirmation.

## Storybook Validation

- Run `bun run storybook` for local primitive and showcase iteration.
- Run `bun run build-storybook` to verify the static docs build.
- Run `bun run storybook:test` for Storybook/Vitest coverage.
- Run `bun run storybook:validate` before landing Storybook-specific changes when you need the full verification pass.

## Ready-To-Unblock Outcome

The repository now has:

- a local `DESIGN.md`
- an explicit shared token path
- a documented ownership rule for `components/ui` versus `components/ipod`
- a first Storybook candidate list separated from product showcase artifacts
