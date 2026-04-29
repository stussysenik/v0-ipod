## 1. Repository Audit
- [ ] 1.1 Inventory the remaining `*.ts`, `*.tsx`, `*.js`, `*.jsx`, and `*.mjs` surface that still participates in the iPod product assembly or its validation flow.
- [ ] 1.2 Classify each touched module by responsibility: workbench, device, display, scene, panel, control, editor, export, hook, test, script, config, or type support.
- [ ] 1.3 Record explicit exclusions for this pass, including visual theme standardization and token redesign.

## 2. Component Taxonomy Completion
- [ ] 2.1 Move or wrap remaining root-level iPod support components into explicit categories such as scenes, controls, editors, and export surfaces.
- [ ] 2.2 Reclassify alternate renderers such as ASCII output so they read as scene-level concerns rather than unrelated artifacts.
- [ ] 2.3 Reduce legacy compatibility naming where safe while preserving behavior and reviewability.

## 3. Typed Primitives And Intent Boundaries
- [ ] 3.1 Ensure shared controls expose typed, intent-first contracts.
- [ ] 3.2 Ensure shared editors expose typed draft and commit behavior without owning durable business state.
- [ ] 3.3 Keep persistence, export, recording, upload policy, and click-audio side effects above leaf primitives.

## 4. Export And Support Infrastructure
- [ ] 4.1 Place framed export stage and GIF preview/recording surfaces behind explicit export-oriented ownership.
- [ ] 4.2 Normalize related helper modules in `lib/` so export, state, and persistence responsibilities remain legible.
- [ ] 4.3 Keep the current local-first and explicit-effects direction intact.

## 5. Repository Follow-Through
- [ ] 5.1 Update app entrypoints and compatibility imports to match the finalized taxonomy.
- [ ] 5.2 Align Playwright helpers, page objects, and relevant tests with the updated vocabulary.
- [ ] 5.3 Update `TECHSTACK.md`, `docs/IPOD-ASSEMBLY.md`, and related docs to reflect the final supporting taxonomy.

## 6. Validation
- [ ] 6.1 Run `bun run type-check`.
- [ ] 6.2 Run `bun run build`.
- [ ] 6.3 Run the relevant Playwright suites for interactions, export, and mobile behavior.
- [ ] 6.4 Run `openspec validate refactor-ipod-supporting-component-taxonomy --strict --no-interactive`.
