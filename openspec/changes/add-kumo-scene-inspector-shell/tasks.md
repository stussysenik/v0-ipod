## 1. Design And Dependencies
- [ ] 1.1 Add project design context for the inspector shell and define its token vocabulary.
- [ ] 1.2 Add Kumo dependencies and any required peer dependencies, then document import patterns for tree-shakeable usage.
- [ ] 1.3 Define the inspector component ownership map and archive path conventions.

## 2. Legacy Archive
- [ ] 2.1 Copy the current live toolbox/settings implementation into a frozen archive module tree under `components/ipod/archive/`.
- [ ] 2.2 Add archive documentation that explains the freeze policy and how the legacy shell can be referenced later.
- [ ] 2.3 Ensure the live app no longer depends on the archived implementation by default.

## 3. Shell Foundation
- [ ] 3.1 Replace the current toolbox dock with a new scene inspector shell container.
- [ ] 3.2 Rebuild the mobile toolbox button as the entry point into the new shell.
- [ ] 3.3 Define motion tokens and implement responsive open/close transitions for mobile and desktop.

## 4. Tree Navigation
- [ ] 4.1 Render the parent/child scene tree from the canonical scene document.
- [ ] 4.2 Add breadcrumb navigation synced to the selected scene path.
- [ ] 4.3 Support collapsing and expanding tree branches without losing selection context.

## 5. Semantic Panels
- [ ] 5.1 Move scene-level controls into a dedicated scene panel.
- [ ] 5.2 Move node-specific controls into selected-node panels grouped by node semantics.
- [ ] 5.3 Remove the live grouped theme/settings sheet once parity is reached.

## 6. Scene History
- [ ] 6.1 Define local-first persistence contracts for saved snapshots and completed exports.
- [ ] 6.2 Surface history artifacts inside the inspector shell with metadata and restore/revisit actions.
- [ ] 6.3 Record completed export provenance from the now-playing/currently-playing flow.

## 7. Quality And Verification
- [ ] 7.1 Update or replace Playwright coverage for the new shell, tree behavior, and history surface.
- [ ] 7.2 Preserve lint, format, and type-check quality gates; add pre-commit automation if `husky` is introduced.
- [ ] 7.3 Run `openspec validate add-kumo-scene-inspector-shell --strict --no-interactive`.

