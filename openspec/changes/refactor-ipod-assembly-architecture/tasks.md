## 1. Spec And Documentation Foundation
- [x] 1.1 Define the assembly naming model and target folder taxonomy in project documentation.
- [x] 1.2 Update `TECHSTACK.md` to describe the current runtime stack, current local-state strategy, and the dependency policy for TanStack Query and client-state libraries.
- [x] 1.3 Record the target `model -> update -> view -> effects` direction for the iPod workbench.

## 2. Canonical State Model
- [x] 2.1 Define a canonical snapshot-oriented domain model for metadata, playback, presentation, and interaction state.
- [x] 2.2 Extract pure update functions from the current top-level workbench so transitions are testable outside React render code.
- [x] 2.3 Preserve current behavior while reducing logic embedded directly in large feature components.

## 3. Assembly And Scene Decomposition
- [x] 3.1 Split display chrome from scene-specific content in the current `ipod-screen` implementation.
- [x] 3.2 Introduce explicit categories for workbench, device assemblies, scenes, panels, editors, and hooks.
- [x] 3.3 Move now-playing drag-layout behavior into a dedicated hook or domain helper.

## 4. Effect Boundaries
- [x] 4.1 Keep local persistence behind explicit effect helpers rather than visual leaf components.
- [x] 4.2 Keep export orchestration behind explicit effect helpers rather than scene components.
- [x] 4.3 Keep file import and click-audio behaviors isolated from display and panel rendering.

## 5. Validation
- [ ] 5.1 Preserve existing behavior with `bun run type-check` and the relevant Playwright suites.
- [ ] 5.2 Validate that the refactor does not introduce regressions in export, mobile editing, or authentic iPod interaction flow.
- [x] 5.3 Run `openspec validate refactor-ipod-assembly-architecture --strict --no-interactive`.
