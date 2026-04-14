# Tasks — add-figma-atomic-foundations

## 1. Wire the canonical Figma file
- [ ] 1.1 Update `figma.config.json` fileKey from `PLACEHOLDER_FILE_KEY` to `UEUmBeQrbJd5gjbUennIg3`.
- [ ] 1.2 Verify `bun run figma:check-token` reaches the live file.
- [ ] 1.3 Add a pre-merge test that fails if `figma.config.json` contains `PLACEHOLDER_FILE_KEY`.

## 2. Figma foundations bootstrap
- [ ] 2.1 Write `scripts/figma-bootstrap.ts` — idempotent page skeleton creator using Plugin API via `use_figma`.
- [ ] 2.2 Create all pages from the design spec §6.1 with two-digit prefixes and separator pages.
- [ ] 2.3 Populate `00 Cover` with version stamp, status pill, maintainer handle placeholder.
- [ ] 2.4 Populate `01 Changelog` with first entry: "C1: foundations seeded, 2026-04-14".
- [ ] 2.5 Populate `02 How to Use` with three-step onboarding callout.
- [ ] 2.6 Create `Primitives` Variable collection — seed color ramp, space scale, radius scale, stroke scale, type scale.
- [ ] 2.7 Create `Semantic` Variable collection — surface/text/border roles with `Light` and `Dark` modes referencing Primitives.
- [ ] 2.8 Create empty `Component` Variable collection (reserved for C2).
- [ ] 2.9 Provision `Motion` and `Material` collections as stubs (filled in C4).
- [ ] 2.10 Write `design-tokens/figma-id-map.json` — stable token-path → Figma Variable ID manifest.
- [ ] 2.11 Add a "Bootstrap file" button to the plugin UI that calls the same underlying library as the CLI.
- [ ] 2.12 Re-run test: running `bun run figma:bootstrap` twice on the same file produces zero new nodes.

## 3. DTCG token pipeline
- [ ] 3.1 Write `scripts/tokens-extract.ts` — Figma Variables → `design-tokens/tokens.json` (DTCG format).
- [ ] 3.2 Write `scripts/tokens-sync.ts` — `design-tokens/tokens.json` → Figma Variables (via plugin or REST where supported).
- [ ] 3.3 Write `scripts/tokens-build.ts` — `design-tokens/tokens.json` → `app/globals.css` custom properties + `tailwind.config.ts` extension via Style Dictionary.
- [ ] 3.4 Add `package.json` scripts: `tokens:extract`, `tokens:sync`, `tokens:build`.
- [ ] 3.5 Round-trip determinism test: `extract → sync → extract` produces zero delta.
- [ ] 3.6 Visual regression test: `tokens:build` output replaces hand-authored `globals.css` blocks without Storybook story diffs.

## 4. Token provenance
- [ ] 4.1 Define `design-tokens/.schema/provenance.schema.json` — JSON Schema for provenance entries.
- [ ] 4.2 Initialize `design-tokens/.provenance.json` with schema version 1.0.0 and empty entries array.
- [ ] 4.3 Create `design-tokens/.provenance-history.jsonl` as an empty append-only log.
- [ ] 4.4 Write `scripts/provenance-stamp.ts` — internal helper callable from every write path.
- [ ] 4.5 Write `scripts/provenance-show.ts` — CLI that queries history for a given token path.
- [ ] 4.6 Integrate provenance stamping into `tokens-sync`, `tokens-extract`, and the Figma plugin write paths.
- [ ] 4.7 Add a CI check that fails if any token in `tokens.json` lacks a matching provenance entry.
- [ ] 4.8 Add a plugin poll (2s interval) that retroactively stamps provenance for out-of-band Figma UI writes with `source: "ui-write"`.

## 5. Dimensional fidelity
- [ ] 5.1 Define `design-tokens/.schema/device-reference.schema.json`.
- [ ] 5.2 Create `design-tokens/device-reference.json` for `classic-5g` with `[STICKY:...]` markers for all measurements.
- [ ] 5.3 Extend `tokens-build` to read `device-reference.json` and emit `device/classic-5g/*` Figma Variables plus `--device-*` CSS custom properties.
- [ ] 5.4 Wire derived formula Variable `device/classic-5g/body/height-px = body.heightMm * scale.targetPxPerMm` as a CSS `calc()` expression.
- [ ] 5.5 Populate the `Foundations / Dimensions` Figma page with a swatch frame showing every `device/*` Variable as labeled swatches.
- [ ] 5.6 Emit warnings (not errors) for unresolved `[STICKY:...]` values at build time.
- [ ] 5.7 Surface unresolved stickies in the Storybook toolbar with click-to-copy of the sticky key.

## 6. Drawing-board escape hatch
- [ ] 6.1 Write `scripts/design-back-to-figma.ts` — enter/exit drawing-board mode CLI.
- [ ] 6.2 Initialize `.design-holds.json` as an empty array.
- [ ] 6.3 Look up Figma node IDs from `figma/code-connect/*.figma.tsx` and `docs/figma/frame-manifest.json`.
- [ ] 6.4 Open the Figma frame URL in the default browser on enter.
- [ ] 6.5 On `--done`, validate that provenance was stamped for any changed tokens; fail if not.
- [ ] 6.6 Add a 14-day expiry with a plugin UI nag for long-running holds.
- [ ] 6.7 Add `package.json` script: `design:back-to-figma`.

## 7. Physical reference pane
- [ ] 7.1 Write `stories/decorators/physical-reference.tsx` — Storybook decorator accepting `{ device, photo, show? }`.
- [ ] 7.2 Render a transparent overlay that holds the reference photo at matching mm scale using `device/classic-5g/scale/target-px-per-mm`.
- [ ] 7.3 Add a draggable ruler reading out `"<X.X>mm (<Y>px)"` at the cursor position.
- [ ] 7.4 Bind keyboard shortcuts: `R` toggles reference photo, `L` toggles rulers.
- [ ] 7.5 Wrap every story under `stories/hardware/*` in the decorator; everything else opts out.
- [ ] 7.6 Ship a placeholder SVG reference photo until `[STICKY:reference-photos]` is resolved.

## 8. Environment portability gate
- [ ] 8.1 Write `scripts/setup.ts` — idempotent one-shot setup covering `bun install`, `.env.local` bootstrap, `figma.config.json` validation, `figma:check-token`, `tokens:extract`, `tokens:build`, `figma/plugin` build, `storybook:build`.
- [ ] 8.2 Print a green checkmark summary on success; each failure prints a one-line remedy pointing at the runbook.
- [ ] 8.3 Add `package.json` script: `setup`.
- [ ] 8.4 Add a CI job in `.github/workflows/figma-bridge.yml` that runs `bun run setup` on a throwaway container.
- [ ] 8.5 Fail the CI job if any step of `setup` exits non-zero.
- [ ] 8.6 Document the workflow in `ENGINEERING_SETUP.md` and `README.md` ("Getting started → run `bun run setup`").

## 9. Documentation
- [ ] 9.1 Insert "Phase 0 — Foundations bootstrap (C1)" above the existing Phase 1 in `docs/figma/runbook.md`.
- [ ] 9.2 Replace `docs/figma/file-manifest.md` with the page skeleton from the design spec §6.1.
- [ ] 9.3 Write `docs/figma/provenance.md` — model, CLI commands, rules.
- [ ] 9.4 Write `docs/figma/dimensional-fidelity.md` — schema, mm-to-px derivation, frozen-by-default rule.
- [ ] 9.5 Update `ENGINEERING_SETUP.md` to describe the `bun run setup` flow.

## 10. Validation and handoff
- [ ] 10.1 `bun run setup` on a clean checkout completes with a green checkmark and no manual intervention other than `FIGMA_TOKEN`.
- [ ] 10.2 `bun run figma:bootstrap` against the live file creates the full page skeleton and populates seed content.
- [ ] 10.3 `bun run tokens:extract && bun run tokens:build` produces `globals.css` + `tailwind.config.ts` that render the app visually identical to the current state.
- [ ] 10.4 `bun run provenance:show color.surface.raised` returns a non-empty history.
- [ ] 10.5 `bun run design:back-to-figma click-wheel` creates a hold and opens the frame.
- [ ] 10.6 Every Hardware Storybook story wraps in the physical-reference decorator and the ruler reads `<mm> (<px>)`.
- [ ] 10.7 CI portability job passes on a throwaway container.
- [ ] 10.8 Round-trip determinism test passes: `extract → sync → extract` yields zero delta.
- [ ] 10.9 Existing Storybook stories render identically to pre-change baseline (no regression).
- [ ] 10.10 `openspec validate add-figma-atomic-foundations --strict --no-interactive` passes.
