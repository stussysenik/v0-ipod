## 1. Repository Audit
- [x] 1.1 Inventory the remaining `*.ts`, `*.tsx`, `*.js`, `*.jsx`, and `*.mjs` surface that still participates in the iPod product assembly or its validation flow.
- [x] 1.2 Classify each touched module by responsibility: workbench, device, display, scene, panel, control, editor, export, hook, test, script, config, or type support.
- [x] 1.3 Record explicit exclusions for this pass, including visual theme standardization and token redesign.

## 2. Component Taxonomy Completion
- [x] 2.1 Move or wrap remaining root-level iPod support components into explicit categories such as scenes, controls, editors, and export surfaces.
- [x] 2.2 Reclassify alternate renderers such as ASCII output so they read as scene-level concerns rather than unrelated artifacts.
- [x] 2.3 Reduce legacy compatibility naming where safe while preserving behavior and reviewability.

## 3. Typed Primitives And Intent Boundaries
- [x] 3.1 Ensure shared controls expose typed, intent-first contracts.
- [x] 3.2 Ensure shared editors expose typed draft and commit behavior without owning durable business state.
- [x] 3.3 Keep persistence, export, recording, upload policy, and click-audio side effects above leaf primitives.

## 4. Export And Support Infrastructure
- [x] 4.1 Place framed export stage and GIF preview/recording surfaces behind explicit export-oriented ownership.
- [x] 4.2 Normalize related helper modules in `lib/` so export, state, and persistence responsibilities remain legible.
- [x] 4.3 Keep the current local-first and explicit-effects direction intact.

## 5. Repository Follow-Through
- [x] 5.1 Update app entrypoints and compatibility imports to match the finalized taxonomy.
- [x] 5.2 Align Playwright helpers, page objects, and relevant tests with the updated vocabulary.
- [x] 5.3 Update `TECHSTACK.md`, `docs/IPOD-ASSEMBLY.md`, and related docs to reflect the final supporting taxonomy.

## 6. Validation
- [x] 6.1 Run `bun run type-check`.
- [x] 6.2 Run `bun run build`.
- [ ] 6.3 Run the relevant Playwright suites for interactions, export, and mobile behavior.
- [x] 6.4 Run `openspec validate refactor-ipod-supporting-component-taxonomy --strict --no-interactive`.
