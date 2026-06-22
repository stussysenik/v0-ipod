## 1. Convention (land first)

- [x] 1.1 Add the `package-architecture` capability spec defining the layer taxonomy
- [x] 1.2 Record the layer→folder mapping in `openspec/project.md` Architecture section
- [x] 1.3 Diff `packages/lib/export-scene.ts` vs `packages/lib/export/export-scene.ts` — root file was a back-compat shim (`export * from "@ipod/lib/export/export-scene"`) with no importers; nested file is canonical → moved to `services/export/export-scene.ts`, shim deleted

## 2. Reorganize `@ipod/lib` into layer folders (git mv, no logic edits)

- [x] 2.1 `domain/`: ipod-revision-data, ipod-classic-presets, ipod-assets, color-manifest
- [x] 2.2 `state/`: xstate/*, ipod-state/* (including theme.css.ts)
- [x] 2.3 `services/`: export/*, export-delivery, gif-export, three-export, storage, feature-flags, export-utils (+ tests)
- [x] 2.4 `serializers/`: song-snapshots
- [x] 2.5 `support/`: time-utils, marquee (+ test), utils, color-proximity, shared-ui-tokens, design-system
- [x] 2.6 Collapse the duplicate `export-scene` to the canonical `services/export/export-scene.ts`

## 3. Rewrite import specifiers

- [x] 3.1 Build the explicit old→new specifier mapping from §2 moves
- [x] 3.2 Apply the rewrite across `packages/**`, `apps/web/**`, `stories/**` (incl. dynamic `import()` in effects.ts and `components.json` utils path); intra-lib relative imports preserved by moving subtrees intact
- [x] 3.3 Grep-verify zero remaining old `@ipod/lib/<oldpath>` specifiers

## 4. Resolution & tooling

- [x] 4.1 Confirmed `tsconfig.base.json` `@ipod/lib/*` glob and `vitest.config.ts` alias resolve all new subpaths (no remap needed)
- [x] 4.2 Confirmed vitest `include: packages/lib/**/*.test.ts` (recursive) still matches relocated tests
- [x] 4.3 Verified `export-encoder.worker.ts` resolves under both Next build and vitest

## 5. Repo-wide convention conformance (docs + misfiles only)

- [x] 5.1 components/hooks/types/tokens/config already map to their documented layer; no misfiled files found; no `packages/components` internal churn

## 6. Validation gate

- [x] 6.1 Type-check passes (`pnpm type-check` — @ipod/web authoritative)
- [x] 6.2 Unit tests pass (`pnpm test:unit` — 7/8; the 1 failure in `marquee.test.ts` is pre-existing, reproduced identically on the pre-refactor tree, and unrelated to imports)
- [x] 6.3 Production build succeeds (`pnpm build` — Next.js compile + TS + static pages)
- [ ] 6.4 `openspec validate refactor-packages-layered-structure --strict --no-interactive` — OpenSpec CLI not installed in this environment; spec delta format verified manually (1 `## ADDED Requirements`, 4 requirements, 8 `#### Scenario:`)
