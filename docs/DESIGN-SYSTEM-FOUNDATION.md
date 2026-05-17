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

## Physical Assembly Constraints

Every device surface that touches the shell must observe two hard rules.

### Adaptive Gasket

The screen gasket (the recessed edge between the aluminum shell and the display)
is derived from the current case color via `deriveGasketColor()` in
`lib/color-proximity.ts`. It must never be a fixed hex value.

The formula:

```
L < 0.18  →  #110f0f                  (near-black — dark cases)
L ≤ 0.7   →  hsl(h, s×0.5, L×ratio)   (smoothed darkening, ratio 0.55→0.88)
L > 0.7   →  hsl(h, s, L)             (exact skin match — no visible line)
```

On light cases (L > 0.7) the gasket is indistinguishable from the shell.
Only the inset box shadow defines the screen boundary — no colored frame.

### Overflow Containment

The outer shell div must carry `overflow-hidden`. Without it, internal surfaces
(especially the screen gasket, whose `borderRadius` is smaller than the shell's)
will "leak" their background color past the shell's curved corners.

- `ipod-device-shell.tsx` — already enforced at line 75
- `ipod-device.tsx` — enforced at the outer shell div

Any new shell assembly that composes a gasket, screen frame, or chamfer overlay
must include `overflow-hidden` on the parent that carries the shell
`borderRadius`.

### Alignment Check

When a gasket leak or border misalignment is reported, verify:

1. Shell `overflow-hidden` is present on the correct ancestor.
2. `deriveGasketColor()` is used; no `bg-[#…]` override.
3. The gasket's `borderRadius` (`preset.screen.outerRadius`) sits fully inside
   the shell's padding area — the shell's `paddingX` / `paddingY` must be larger
   than the gasket's corner radius to avoid the gasket reaching the shell edge.
4. Inset shadow opacity on the gasket scales with case lightness
   (`L < 0.45 → 0.5`, otherwise `0.18`).

### Viewport Containment

The device must never overflow or scroll. The constraint stack:

```
<main>          h-dvh w-full overflow-hidden   ← locks viewport
  <container>   relative h-full w-full flex    ← strict parent
                  items-center justify-center
                  overflow-hidden
    <wrapper>   width={scaledW} height={scaledH}  ← clips to fit
                  overflow-hidden
      <inner>   transform: scale(previewScale)    ← natural size
                  transformOrigin: top left
```

Rules:
- The root `<main>` is always `h-dvh overflow-hidden` — no page scroll.
- The device wrapper is sized to `frameWidth × previewScale` and clips
  overflow. The inner div stays at natural frame size with `transform: scale()`
  and `transformOrigin: top left` — ghost space to the right/bottom is hidden
  by the wrapper's `overflow-hidden`. No negative margins.
- `previewScale` reserves horizontal space for container padding plus toolbox
  chrome. Vertical reserve accounts for the mobile toolbox dock (fixed at
  bottom). On desktop both reserves tighten.
- The 3D canvas uses `absolute inset-0` within the `relative` container — it
  fills the viewport independently of the 2D scaling engine.

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

- Run `pnpm storybook` for local primitive and showcase iteration.
- Run `pnpm build-storybook` to verify the static docs build.
- Run `pnpm storybook:test` for Storybook/Vitest coverage.
- Run `pnpm storybook:validate` before landing Storybook-specific changes when you need the full verification pass.

## Ready-To-Unblock Outcome

The repository now has:

- a local `DESIGN.md`
- an explicit shared token path
- a documented ownership rule for `components/ui` versus `components/ipod`
- a first Storybook candidate list separated from product showcase artifacts
