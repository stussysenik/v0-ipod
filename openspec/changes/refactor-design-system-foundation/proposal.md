# Change: Establish local design-system foundation and reusable UI boundaries

## Why
The repository now has a stronger product architecture for the iPod assembly, but it does not yet have a stable design-system contract. Shared UI still lives in a very small `components/ui` surface, many reusable-looking visuals are still product-specific, and the active global `DESIGN.md` contract has no project-level override.

Before introducing Storybook or broader visual standardization, the project needs a local design foundation that defines tokens, reusable primitive boundaries, and what remains intentionally iPod-specific.

## What Changes
- Add a local `DESIGN.md` that overrides the global manifest with project-specific rules, scope, and design-system workflow.
- Define the source-of-truth strategy for tokens and identify the migration path from hardcoded shared-UI styles toward token-backed primitives.
- Classify current UI surfaces into reusable primitives versus product assembly components.
- Establish repository rules for `components/ui` versus `components/ipod` ownership.
- Keep iPod product fidelity, product-specific styling, and broad visual redesign out of scope for this change.

## Impact
- Affected specs:
  - `design-system-foundation`
  - `ui-primitive-boundaries`
- Affected code:
  - `DESIGN.md`
  - `components/ui/**/*`
  - `components/ipod/display/**/*`
  - `components/ipod/editors/**/*`
  - `components/ipod/controls/**/*`
  - `lib/color-manifest.ts`
  - `lib/design-system.ts`
  - token-related scripts or generated assets added for the shared system
