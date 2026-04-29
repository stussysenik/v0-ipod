## 1. Local Design Contract
- [x] 1.1 Create a local `DESIGN.md` that overrides the active global manifest for this repository.
- [x] 1.2 Define token, typography, spacing, and primitive-scope rules appropriate for this project.
- [x] 1.3 Record explicit exclusions for this pass, including broad product redesign and full iPod visual normalization.

## 2. Primitive Boundary Audit
- [x] 2.1 Inventory `components/ui` and classify each file as reusable primitive, design-system candidate, or product-specific helper.
- [x] 2.2 Audit nearby iPod display/control/editor surfaces and identify which ones should remain product-owned.
- [x] 2.3 Define the ownership rule for `components/ui` versus `components/ipod`.

## 3. Token Foundation
- [x] 3.1 Choose the shared token source-of-truth path for this repository.
- [x] 3.2 Define the migration path from hardcoded shared styles to token-backed primitives.
- [x] 3.3 Keep product manifests and fidelity-specific tokens separate where reuse would be artificial.

## 4. Repository Follow-Through
- [x] 4.1 Update docs and architecture notes to reflect the local DS foundation and ownership boundaries.
- [x] 4.2 Identify DS-ready primitives that Storybook should document first.
- [x] 4.3 Identify product-only components that Storybook should treat as showcase artifacts rather than system primitives.

## 5. Validation
- [x] 5.1 Run `openspec validate refactor-design-system-foundation --strict --no-interactive`.
- [x] 5.2 Confirm the resulting contract is ready to unblock the Storybook design-system change.
