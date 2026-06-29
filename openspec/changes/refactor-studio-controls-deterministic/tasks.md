# Tasks

## 1. Foundation — deterministic color solver

- [ ] 1.1 Add a control-token solver module that maps an active stage background color
      to `{ surface, hairline, label, accent, selectedFill, selectedLabel, focusRing }`,
      enforcing a contrast floor (WCAG AA / APCA equivalent) per token, with the
      mid-luminance surface tint/shade fallback (dcal as color authority).
- [ ] 1.2 Wire the solver to the real active stage background color source.
- [ ] 1.3 Unit-test the solver: contrast floor holds across a sweep of stage colors,
      output is deterministic (snapshot-stable), and the mid-luminance fallback fires.

## 2. Control primitives

- [ ] 2.1 Build `components/ui/studio-controls.tsx` on `react-aria-components`:
      `StudioButton`, `StudioSegment`, `StudioChip`, `StudioField`, `StudioLabel`,
      `StudioRow` — single radius token (bound to the device radius family), one type
      scale, shared timing table (hover ~130ms, selection ~220ms ease-out, no bounce).
- [ ] 2.2 Consume solved tokens; selected = solid fill, rest = hairline; one accent.
- [ ] 2.3 Export the primitives from `components/ui/index.ts`; add Storybook stories.

## 3. Adopt across studio surfaces (presentation-only, visual parity per surface)

- [ ] 3.1 Migrate `components/ipod/panels/*` (colors, settings, lighting, export).
- [ ] 3.2 Migrate `components/ipod/workbench/*` and `components/ipod/editors/*`.
- [ ] 3.3 Verify each surface against its pre-migration rendering and confirm controls
      stay legible across representative stage colors.

## 4. Consolidate the behavior layer

- [ ] 4.1 Rebuild `checkbox` and `switch` on `react-aria-components`.
- [ ] 4.2 Remove `carbon-checkbox`; update all imports to the single checkbox.
- [ ] 4.3 Remove every `@radix-ui/*` package with no remaining source import from
      `package.json`; reinstall and confirm a clean lockfile.

## 5. Focus (zen) mode

- [ ] 5.1 Add a focus-mode toggle that hides inspector chrome and restores it, kept
      independent of "Lock editing" and non-mutating to configuration.

## 6. Validate

- [ ] 6.1 Run `oxlint` + `tsc --noEmit` to zero; build succeeds with the reduced deps.
- [ ] 6.2 Confirm Lighthouse accessibility (≥0.95) and CLS (≤0.1) gates still pass.
- [ ] 6.3 Remove the superseded `refactor-studio-industrial-controls` change folder.
