## Context

Four research passes (2D layout, 3D architecture, state/export, test infra) mapped
the finish-line gaps. Constraints: pixel-exact export must not change (the scaled
native-px device stage and the export fingerprint pipeline are load-bearing);
`/3d` WebGL Playwright specs fail environmentally in this dev machine, so runtime
verification of `/3d` happens via chrome-devtools MCP, and new automated
robustness tests anchor on the CI-green 2D route.

## Goals / Non-Goals

- Goals: finish responsiveness, remove the interaction-time jank sources, make a
  look portable (link/file), make failure observable and recoverable, encode all
  of it in tests.
- Non-Goals: `frameloop="demand"` (the LCD shader time uniform and marquee are
  continuously animated — demand mode would need per-frame invalidate, i.e. an
  always-loop with extra steps); removing `preserveDrawingBuffer` (clip capture
  depends on it); a mobile floating-panel system (the compact dock +
  KumaSettingsPanel remain the mobile editing surface; the palette trigger closes
  the access gap); server-side named-config storage (localStorage + URL + file
  cover save/share; PocketBase stays export-history-only).

## Decisions

- **Persistence debounce, not throttle:** `saveWorkbenchModel` moves behind a
  ~300ms trailing debounce with an explicit flush on `pagehide`/unmount. Trailing
  loss on tab kill is bounded to the last 300ms of edits; a throttle would still
  do synchronous JSON serialization mid-drag.
- **Portable payload = full model, one codec:** `lib/ipod-state/portable-state.ts`
  exposes `encodePortableState(model)` → base64url(JSON) and
  `decodePortableState(str)` → normalized model or null. It reuses
  `stableStringify` (canonical output) and `normalizeModel` (validation for free).
  The URL param is `?s=`; oversized payloads fall back to file export. Live
  multi-key localStorage layout is untouched — the codec is a marshalling layer.
- **Settle spring keys on finish identity, not color:** the drop animation
  re-arms only when the finish/preset changes; color-only edits keep the pose.
- **Error boundary is a class component around the workbench and the 3D stage**
  rendering a minimal fallback with a reset action and
  `data-testid="app-error-fallback"` — turning silent white-screens into an
  assertable signal.
- **Context-loss recovery:** `webglcontextlost` → `preventDefault()` (allows
  restore) + surface a non-blocking notice; `webglcontextrestored` → the R3F tree
  re-renders naturally. No bespoke re-init machinery.
- **Short-landscape = compact:** the compact/scroll branch keys on
  `width < 768 || height < 480` so landscape phones get the same stable
  scroll-escape layout as portrait, ending the overflow-hidden trap.
- **Intensity caps:** `sanitizeLightingConfig` clamps env/spot/softbox
  intensities to a documented ceiling (no tone mapping means no rolloff — the
  sanitizer is the only safety net).

## Risks / Trade-offs

- Debounce flush must fire before export snapshots read storage → export paths
  read the in-memory model, not storage; verified by existing export unit tests.
- Changing compact breakpoint semantics can shift desktop layouts in narrow
  windows → gate strictly on the short-landscape condition and verify 320/390/768
  /1024 widths in-browser.
- URL-state restore runs before first paint on a client-only surface → decode
  failures must be silent (fall back to persisted state) and never throw.

## Migration Plan

No data migration: storage keys and schema versions unchanged. The
`isHardwarePreset` fix widens accepted values (forward-compatible). Rollback =
revert commits; portable links degrade gracefully (decode returns null → default
state).

## Open Questions

None blocking; naming of share/export UI copy settled during implementation
against existing control-language conventions.
