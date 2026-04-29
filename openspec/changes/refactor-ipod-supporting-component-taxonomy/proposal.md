# Change: Refactor remaining iPod support components and repository module taxonomy

## Why
The first architecture pass established a clear workbench, display, scene, panel, and state/effects spine for the core iPod assembly. The rest of the repository still carries a mixed vocabulary across support components, export helpers, editor primitives, tests, and module placement, which makes the project read like a partial refactor instead of a fully disciplined design-engineering system.

The next pass should finish the taxonomy across the remaining TS/JS surface so the repository reads consistently as a portfolio-grade product assembly with Elm-like state discipline, explicit effect boundaries, and typed view primitives. This pass should explicitly avoid visual theme standardization or token redesign.

## What Changes
- Audit the remaining TypeScript and JavaScript surface and classify modules by workbench, device, display, scene, panel, control, editor, export, hook, test, script, or config responsibility.
- Extend the iPod component taxonomy to the remaining root-level support files such as ASCII rendering, click wheel, progress, star rating, fixed editor, image upload, palette tooling, export stage, and GIF preview.
- Require shared controls and editors to expose typed props and intent-first callbacks rather than own durable business state or side effects.
- Clarify where export-stage and preview-recording UI belong so workbench orchestration, visual primitives, and export infrastructure do not blur together.
- Align app entrypoints, tests, page objects, and documentation with the finalized assembly vocabulary and repository topology.
- Keep design theme standardization, token redesign, and visual restyling out of scope for this change.

## Impact
- Affected specs: `support-component-architecture`, `interaction-primitive-boundaries`, `repository-module-topology`, `export-surface-architecture`, `test-topology`
- Affected code:
  - `components/ipod/**/*`
  - `components/three/**/*`
  - `components/ui/**/*`
  - `app/**/*.ts*`
  - `lib/**/*.ts`
  - `tests/**/*.ts`
  - `scripts/**/*.ts` and `scripts/**/*.mjs`
  - supporting docs such as `TECHSTACK.md`, `docs/IPOD-ASSEMBLY.md`, and related architecture notes
