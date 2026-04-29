# iPod Dev Bridge Plugin

Custom Figma plugin that owns the Figma-side state of the Phase 2 HMR loop
and the Phase 3 token round-trip. See `docs/figma/runbook.md` for the
operator workflow.

## Build

```bash
cd figma/plugin
bun install
bun run build      # one-shot
bun run watch      # incremental
```

The build emits `dist/code.js`, `dist/ui.js`, and copies `src/ui.html` into
`dist/`. The `manifest.json` at the plugin root points at `dist/code.js`
and `dist/ui.html`.

## Load into Figma

1. In Figma, `Plugins → Development → Import plugin from manifest`.
2. Select `figma/plugin/manifest.json`.
3. Run the plugin from `Plugins → Development → iPod Dev Bridge`.

## Architecture

- `src/code.ts` — runs in the Figma sandbox (no DOM, no Node, no sockets).
  Owns all Figma-side state: frame lookup by `storyId`, SVG replacement,
  snapshot stack, Variable import, `documentchange` listener.
- `src/ui.ts` — runs in the plugin iframe. Owns the WebSocket connection to
  the HMR server on `ws://localhost:7733/figma-hmr` because sandbox code
  cannot open sockets. Relays messages through `postMessage` to the sandbox.
- `src/ui.html` — minimal plugin UI with Connect, Bind, and Undo Restore
  controls plus a log pane.

The two halves are compiled separately by `build.mjs` (esbuild) so that
the sandbox and iframe bundles stay independent.

## Failure modes

- **Socket disconnected:** UI shows red status, disables write operations.
  The sandbox receives a `connect-state` message and refuses any update
  that would require a round-trip.
- **SVG render error:** server emits `story-error`, UI logs it, sandbox
  leaves the bound frame untouched.
- **Snapshot stack empty:** `Undo Restore` surfaces a visible error in the
  log and does not mutate the frame.

## Known limits

- Variable import deprecate-before-delete logic is scaffolded but not yet
  fully symmetric with the DTCG spec — review
  `docs/figma/runbook.md` step 1.7 before first run.
- The `documentchange` listener currently fires on any variable edit and
  emits a token-changed message without a debounce on the sandbox side.
  Debouncing happens on the server side in `scripts/token-writer.ts`.
