# Change: Refactor iPod assembly architecture for explicit boundaries and minimal infrastructure

## Why
The project already proves the visual idea, but the code architecture still reflects prototype growth rather than a deliberate product assembly model. The main orchestrator and display files currently mix state ownership, scene composition, editing behavior, and visual chrome in ways that make the system harder to extend, review, and present as a disciplined design-engineering codebase.

The next phase should make the code read like a physical assembly backed by an Elm-like `model -> update -> view -> effects` structure. That means clearer naming, explicit file categories, pure state transitions, isolated side effects, and restraint around new infrastructure. The current product does not yet justify TanStack Query, Zustand, or Nanostores because it is still primarily local-state, local-persistence, and local-export driven.

## What Changes
- Define a physical-assembly naming taxonomy for the iPod codebase: workbench, device, shell, display, scene, panel, control, and editor.
- Define a target folder taxonomy that separates workbench orchestration, physical assemblies, scenes, panels, editors, hooks, and pure domain logic.
- Establish one canonical snapshot-oriented state model with pure update functions and explicit effect adapters.
- Require business rules and persistence/export side effects to live outside visual leaf components.
- Record a dependency policy that keeps TanStack Query and external client-state libraries out of the critical path unless real remote state is introduced.
- Update project documentation so the current stack and target direction are clear to contributors and reviewers.

## Impact
- Affected specs: `assembly-architecture`, `state-model`, `effect-boundaries`, `dependency-policy`
- Affected code: `components/ipod/*`, `lib/storage.ts`, `lib/export-utils.ts`, `lib/color-manifest.ts`, `lib/design-system.ts`, `types/ipod*.ts`, docs including `TECHSTACK.md`, and related Playwright coverage
