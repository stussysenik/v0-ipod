# Design: Deterministic precision-instrument control system

## Context

The studio is a configurator/inspector for a polished 3D iPod render on a
user-colorable stage. The chrome must read as the same machined instrument as the
product and stay legible on any stage color. Three forces collide: a split primitive
layer (React Aria vs Radix), a hardcoded undisciplined palette, and a no-fill control
voice that fails the affordance test. This change resolves all three under one
principle: **controls are a pure function of the stage.**

## Decisions

### 1. No pre-styled library; React Aria is the only (headless) dependency

Pre-styled kits (Chakra, Carbon, MUI) impose their own look — a fourth opinion beside
the iPod and the stage. They make chrome more templated, not less. We add none.

React Aria is not a "look" — it is keyboard/focus/ARIA behavior, the reliability layer
the user explicitly values. It already powers the product panels. We standardize on it
and **remove** the ~25 unused `@radix-ui/*` packages. Net dependency count drops.

### 2. Control color is solved, not authored

A fixed control palette breaks contrast when the stage changes (stage is user-set,
e.g. `#0048FF`). Instead the control token set is a pure function:

```
controlTokens = solve(stageBackground)
  → { surface, hairline, label, accent, selectedFill, selectedLabel, focusRing }
```

The solver (dcal as the color authority) guarantees each token meets a contrast floor
(WCAG AA / APCA equivalent) against the surface it sits on. Determinism means the same
stage color always yields the same control palette — auditable and snapshot-testable.
This is `UI = f(state)` applied to color.

### 3. Selection uses a solved solid fill (reverses the superseded no-fill voice)

The replaced `refactor-studio-industrial-controls` ratified "selection is always a
hairline ring or underline, no fill." That treatment is exactly what the current
`racButton` does, and it is what reads as inert ("the buttons don't want you to
interact"). We reverse it: **selected = solved solid fill** (guaranteed contrast),
**rest = hairline**. Affordance comes from a real state change, not a border swap.
Precision is preserved through a single small radius token, tight type, and one accent
— not through the absence of fill.

### 4. One radius, one accent, one timing table

- Radius: a single control token bound to the device radius family (`preset.shell`
  derivatives) rather than ad-hoc `rounded-xl`.
- Accent: the three blues (`#0048FF`, `#0F62FE`, `ring-blue-500`) collapse to one
  solved accent.
- Motion: hover ~130ms ease-out, selection ~220ms ease-out, no bounce.

### 5. Focus (zen) mode is orthogonal to Lock editing

"Lock editing" freezes per-edit state for clean export. Focus mode hides the inspector
chrome entirely for a clean stage view. They compose; neither implies the other.

## Risks / Trade-offs

- **Solver edge cases** (near-mid-luminance stages where neither dark nor light text
  clears the floor): the solver must fall back to an elevated surface (tint/shade the
  control surface away from the stage) rather than only swapping text color.
- **Determinism vs taste:** a solved palette can look mechanical. Mitigated by fixing
  the neutral ramp and accent hue, solving only lightness/contrast relationships.
- **Migration breadth:** many panels adopt the primitives. Mitigated by
  presentation-only swaps with visual parity checks per surface.

## Migration

Incremental: build primitives + solver first, adopt panel-by-panel with visual parity,
then remove `carbon-checkbox` and unused Radix once no imports remain.
