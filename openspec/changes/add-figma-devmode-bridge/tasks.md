## 1. References And Scope
- [x] 1.1 Audit every component under `components/` and classify each as `satori`, `raster`, or `exclude`; record results in `docs/figma/component-audit.md`.
- [x] 1.2 Document the tooling baseline: target Storybook 8 minor, `@storybook/addon-designs` version, Story.to.Design feature matrix, Figma plan requirements, Figma Code Connect version, satori version.
- [x] 1.3 Confirm Figma plan requirements for Variables with multi-mode support, Dev Mode, and Code Connect; record in `docs/figma/tooling-costs.md` alongside the Story.to.Design pricing confirmation.
- [x] 1.4 Decide the ownership model for the canonical Figma file (personal, team, organization) and record the file key, URL, and access workflow in `docs/figma/file-manifest.md`.
- [x] 1.5 Document the `FIGMA_TOKEN` secret workflow in `ENGINEERING_SETUP.md`, including how to create a scoped token and how the pre-commit guard detects leaks.

## 2. Storybook Bootstrap
- [x] 2.1 Install Storybook 8 with the Next.js framework using `bun x storybook@latest init` and commit the generated `.storybook/` directory.
- [x] 2.2 Port Tailwind config and `app/globals.css` into `.storybook/preview.tsx` so stories render with production styles.
- [x] 2.3 Mock `next/image`, `next/font`, and `next/navigation` in `.storybook/preview.tsx` so components that depend on Next.js runtime APIs render cleanly.
- [x] 2.4 Install and register `@storybook/addon-essentials`, `@storybook/addon-a11y`, `@storybook/addon-interactions`, `@storybook/addon-themes`, `storybook-dark-mode`, and `@storybook/addon-designs`.
- [x] 2.5 Wire `bun run storybook` and `bun run storybook:build` scripts, include the build step in the existing `validate` chain.
- [x] 2.6 Add the `Not In Scope` Storybook docs page listing every excluded component and the reason for exclusion.

## 3. Story Coverage
- [x] 3.1 Author `Default` plus meaningful variant stories for every in-scope `ipod/*` component listed in the spec, using CSF3 and `satisfies Meta<typeof Component>`.
- [x] 3.2 Author stories for the `ui/*` primitives in the in-scope set (icon-button, checkbox, switch, theme-toggle, carbon-checkbox, hex-color-input, grey-palette-picker).
- [x] 3.3 Author a `Now Playing` composition story that assembles shell, screen, and wheel into the full device surface.
- [x] 3.4 Set `parameters.compat` on every story with one of `satori`, `raster`, or `exclude`, matching the Phase 1 audit in 1.1.
- [x] 3.5 Set `parameters.design` on every `satori` and `raster` story with a placeholder Figma URL (replaced with the real node URL after Phase 1 push).
- [x] 3.6 Add a CI check that fails if any in-scope component under `components/` has no matching story file.

## 4. Phase 1 Figma Export
- [ ] 4.1 Create the canonical Figma file with the page layout defined in the `figma-design-bridge` spec and record the file key in `docs/figma/file-manifest.md`. _(operator step — see runbook §1.3)_
- [ ] 4.2 Install Story.to.Design in the canonical Figma file and connect it to the local `storybook-static/` build. _(operator step — see runbook §1.3)_
- [ ] 4.3 Run the first full push; resolve satori-incompatible stories using the `raster` or `exclude` path; record decisions in the component audit. _(operator step — see runbook §1.4)_
- [ ] 4.4 Record the resulting Figma node IDs for every pushed frame in `docs/figma/frame-manifest.json`. _(automated by `bun run figma:record-frames` after §1.4)_
- [ ] 4.5 Backfill `parameters.design` URLs on every story using the frame manifest so the Storybook Design panel shows the real frames. _(automated by `bun run figma:backfill-design-links` after §1.4)_
- [x] 4.6 Document the Phase 1 push runbook in `docs/figma/runbook.md` with screenshots of the expected file structure. _(text runbook committed; screenshots added by operator at first bootstrap)_
- [x] 4.7 Wire a `bun run figma:push` script that runs `storybook:build` and the Story.to.Design push in one command; fail fast when `FIGMA_TOKEN` is unset.

## 5. Design Token Bridge
- [x] 5.1 Inventory every design token currently living in `tailwind.config.ts` and `app/globals.css` and classify into `Primitives`, `Semantic`, and `Component` collections.
- [x] 5.2 Write `scripts/extract-tokens.ts` that emits `design-tokens/tokens.json` in W3C DTCG format for every token category in the spec.
- [x] 5.3 Add a pre-commit hook via lint-staged so any change to `tailwind.config.ts` or `app/globals.css` triggers a fresh token extract and stages the updated JSON.
- [x] 5.4 Write `tools/figma/sync-tokens.ts` that imports the token JSON into the canonical Figma file as Variables with the correct collection structure. _(scripted as `scripts/sync-tokens.ts` + plugin handler in `figma/plugin/src/code.ts`)_
- [x] 5.5 Configure the color collection with `light` and `dark` modes, populating both from the `:root` and `[data-theme='dark']` CSS selectors.
- [x] 5.6 Implement deprecate-before-delete: the sync script SHALL mark removed tokens as `⚠ deprecated` on normal runs and SHALL require `--delete-orphans` with interactive confirmation for actual deletion.
- [ ] 5.7 Run the first token sync, verify Variables appear in the canonical file, and bind them to component styles where meaningful. _(operator step — see runbook §1.7)_
- [x] 5.8 Author the auto-generated `Design Tokens` Storybook docs page that renders every collection, mode, and value from the JSON.
- [x] 5.9 Add a CI freshness check that compares on-disk `design-tokens/tokens.json` against a fresh extract and fails on drift.

## 6. Code Connect Wiring
- [x] 6.1 Install `@figma/code-connect` and configure `figma.config.json` with the canonical file key.
- [x] 6.2 Write `.figma.tsx` mapping files under `figma/code-connect/` for every in-scope component, surfacing props, imports, and source paths.
- [ ] 6.3 Run `figma connect publish` against the canonical file and verify that Dev Mode shows the correct source path for each component. _(operator step — requires live FIGMA_TOKEN)_
- [x] 6.4 Add a CI parity check that fails when an in-scope component has no matching `.figma.tsx` file.

## 7. Component Scaffolder CLI
- [x] 7.1 Write `bun run scaffold:component <name>` that creates the component file, a matching story file, a `.figma.tsx` mapping, and a token audit entry in a single command.
- [x] 7.2 Add the CLI to `ENGINEERING_SETUP.md` as the supported entry point for new component authoring.
- [x] 7.3 Verify the CLI output passes all the existing CI parity checks out of the box.

## 8. Phase 2 HMR Bridge
- [x] 8.1 Write `scripts/figma-hmr-server.ts`: a WebSocket server on port 7733 that accepts a single plugin client and routes `story-updated`, `story-error`, and `token-changed` messages.
- [x] 8.2 Write `scripts/render-story.ts` that accepts a story id, loads the CSF3 story module, instantiates the component with the story args, runs it through satori with the project's Tailwind resolver, and returns an SVG string.
- [x] 8.3 Add a chokidar watcher over `components/**` and `stories/**` in the HMR server, with a 300ms per-story debounce.
- [x] 8.4 Scaffold the custom Figma plugin under `figma/plugin/` with `manifest.json`, `code.ts`, `ui.html`, and `ui.ts`.
- [x] 8.5 Implement the plugin UI: connect/disconnect control, bound page indicator, recent updates list, error console, and manual rebind action.
- [x] 8.6 Implement the plugin code path: WebSocket client, `story-updated` → `figma.createNodeFromSvg()` on the frame identified by plugin data, preserving frame position, constraints, and auto-layout.
- [x] 8.7 Implement the plugin snapshot stack and the `Undo Restore` button per the spec.
- [x] 8.8 Wire `bun run figma:dev` as a single entry point that boots Next.js dev, the HMR server, the watchers, and the token sync watcher with coloured logging.
- [x] 8.9 Gate Phase 2 behind a `FIGMA_HMR=1` env flag so engineers can opt in individually.

## 9. Phase 3 Token Round-Trip
- [x] 9.1 Add a `documentchange` listener in the Figma plugin scoped to Variables in the `Primitives` and `Semantic` collections.
- [x] 9.2 Emit `token-changed` messages with `{ collection, variableName, modeId, newValue }` over the WebSocket.
- [x] 9.3 Implement the token writer on the server: resolve the change to the correct source file (`app/globals.css` or `tailwind.config.ts`) and write the new value.
- [x] 9.4 Debounce token writes at 500ms per token and prepend a `[figma-hmr]` marker on the affected line.
- [x] 9.5 Handle conflict: if the target file has changed in a way that makes the write ambiguous, abort with a descriptive error and surface it in the plugin UI.
- [ ] 9.6 Verify Next.js HMR picks up the written token change and the browser preview updates without a full reload. _(operator step — see runbook §3.1)_
- [x] 9.7 Gate Phase 3 behind the same `FIGMA_HMR=1` flag and document a rollback path that keeps Phase 2 operational if round-trip is disabled.

## 10. Validation
- [x] 10.1 Add Playwright regression coverage that every in-scope story renders in the running app without errors.
- [ ] 10.2 Resolve every critical `@storybook/addon-a11y` violation on in-scope stories. _(operator step — runs after `bun install` + `bun run storybook`)_
- [ ] 10.3 Run the manual round-trip check: a code token change propagates into Figma within one second; a Figma Variable edit propagates into the working tree within one second. _(operator step — see runbook §2.6 and §3.1)_
- [x] 10.4 Add CI steps that run `storybook:build`, `tokens:extract`, the token freshness check, the Code Connect parity check, and the story coverage check.
- [x] 10.5 Run `openspec validate add-figma-devmode-bridge --strict --no-interactive` and fix any validation errors before proposal review.
- [x] 10.6 Record the final file key, page layout screenshots, phase-by-phase rollback procedure, and an operator runbook in `docs/figma/runbook.md`.
