# Figma Dev-Mode Bridge — Operator Runbook

End-to-end playbook for taking the `add-figma-devmode-bridge` change from a
clean checkout to a live round-trip loop. Each phase is independently
shippable and independently rollback-safe. Do not skip ahead.

Every step in every phase has a named command and a success criterion. If the
success criterion fails, stop and file a bug rather than working around it.

## Pre-flight

1. `bun install`
2. `cp .env.example .env.local` and fill in `FIGMA_TOKEN` per
   `ENGINEERING_SETUP.md`.
3. Confirm the canonical Figma file exists and its key matches
   `figma.config.json`. If the file has not been created yet, create it with
   the page layout in `file-manifest.md`.
4. Read `component-audit.md` and `tooling-costs.md` end-to-end.

## Phase 1 — Storybook + Static Push

### 1.1 Storybook comes up

```bash
bun run storybook
```

- **Success:** Storybook loads on http://localhost:6006, the sidebar lists all
  in-scope components, and the Controls + Design + A11y panels are present.
- **Failure:** Re-run `bun install`. If the failure persists, check
  `.storybook/main.ts` against `tooling-costs.md` for version drift.

### 1.2 Static build succeeds

```bash
bun run storybook:build
```

- **Success:** `storybook-static/` exists and contains `index.html`.
- **Failure:** A story is throwing. CI will name the broken story. Fix in
  isolation and rerun.

### 1.3 Bootstrap the canonical Figma file

Only run on a brand-new canonical file.

1. Open the file in Figma.
2. Create the page layout in `file-manifest.md` exactly, in order.
3. Install Story.to.Design from the Figma plugin store.
4. Record the file key in `figma.config.json` and commit.

### 1.4 First push

```bash
bun run figma:push
```

- **Success:** Every `satori` and `raster` story appears as a frame on the
  corresponding page. The script prints a pushed / updated / skipped summary.
- **Failure:** `FIGMA_TOKEN` unset → export it and retry. Story-to-Design fails
  on a satori-incompatible story → reclassify the story to `raster` or
  `exclude` in the audit and rerun.

### 1.5 Record frame IDs

After a successful push, run:

```bash
bun run figma:record-frames
```

- **Success:** `docs/figma/frame-manifest.json` is updated with one entry per
  pushed story, mapping story id → Figma node id.
- **Failure:** Check the sync log for unresolved story ids. Any story on
  either side that cannot be matched should surface here and not silently drop.

### 1.6 Backfill design URLs on stories

```bash
bun run figma:backfill-design-links
```

Populates `parameters.design` on every story from the frame manifest. The
Storybook Design panel now shows the real frame.

### 1.7 Token extract + sync

```bash
bun run tokens:extract
bun run tokens:sync
```

- **Success:** `design-tokens/tokens.json` exists and is DTCG-valid;
  the canonical file contains `Primitives`, `Semantic`, and `Component`
  Variable collections with light and dark modes.
- **Failure:** Sync will list unknown Figma Variables that were created by
  hand. Remove them or open a PR to add them to `tailwind.config.ts`.

### 1.8 Code Connect publish

```bash
bunx figma connect publish
```

- **Success:** Dev Mode shows the source path for every in-scope component.
- **Failure:** Parity check will name missing `.figma.tsx` files. Add them via
  the scaffolder: `bun run scaffold:component <name>`.

## Phase 2 — Live HMR

### 2.1 Opt-in flag

```bash
export FIGMA_HMR=1
```

Phase 2 and Phase 3 are both gated behind this flag. Without it, the HMR
server refuses to start.

### 2.2 Custom plugin build

```bash
cd figma/plugin && bun run build
```

- **Success:** `figma/plugin/dist/code.js` and `figma/plugin/dist/ui.js` exist.
- **Failure:** Fix the plugin TypeScript compile error; `esbuild` prints a
  direct pointer.

### 2.3 Load the plugin in Figma

1. In Figma, `Plugins → Development → Import plugin from manifest`
2. Select `figma/plugin/manifest.json`
3. Run the plugin from `Plugins → Development → iPod Dev Bridge`

### 2.4 Dev server

```bash
bun run figma:dev
```

- **Success:** Next.js dev, the HMR WebSocket server, the chokidar watcher,
  and the token sync watcher all start under one process with `[next]`,
  `[hmr]`, and `[tokens]` labelled log lines.
- **Failure:** Port 7733 already in use → identify the stale process and kill
  it. Do not pick a different port.

### 2.5 Connect the plugin

In the plugin UI, click `Connect`. Confirm the status indicator goes green and
the plugin reports the Next.js dev URL on the server log.

### 2.6 Live update check

Edit `components/ipod/click-wheel.tsx` — change a label color. Save.

- **Success:** The bound Figma frame updates within ~1s. The frame's position,
  parent, and auto-layout settings are preserved. Only the interior children
  change.
- **Failure:** Check the plugin console for a `story-error` message and fix the
  render. Check that the frame has `storyId=click-wheel--default` in its plugin
  data.

## Phase 3 — Token Round-Trip

### 3.1 Designer edits a Variable

In the canonical file, open the `Semantic` variable collection and edit
`surface.primary` in light mode.

- **Success:** `app/globals.css` gains a new value on the `--surface-primary`
  line within 500ms. The line's git blame shows a `[figma-hmr]` marker. Next.js
  hot-reloads and the app preview updates.
- **Failure:** If the server log shows a `conflict` error, the target file
  changed under the writer's feet. Reload the plugin and retry.

### 3.2 Rollback

- Phase 3 can be disabled by dropping `FIGMA_HMR=1`. Phase 2 keeps working.
- Phase 2 can be disabled by refusing to import the plugin. Phase 1 keeps
  working.
- Phase 1 can be disabled by removing `bun run figma:push` from CI. The app is
  unaffected.

## Known Sharp Edges

- The 3D iPod view is **not** in Figma. This is by design. See the cover page
  callout and `component-audit.md`.
- `@react-three/fiber`, `backdrop-filter`, `mix-blend-mode`, and SVG filters
  are outside satori's support surface. Components using them must be
  classified `exclude`.
- Dragging a Variable slider in Figma produces at most one `token-changed`
  write per 500ms. Rapid-fire edits are intentionally debounced.
- Tokens renamed in code mark the old Figma Variable `⚠ deprecated`. Actual
  deletion requires `bun run tokens:sync -- --delete-orphans` with explicit
  confirmation.

## Changelog

Update this section each time the runbook evolves. Dates are absolute.
