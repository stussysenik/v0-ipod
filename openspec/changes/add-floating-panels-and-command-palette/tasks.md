# Tasks

## 1. Panel layout state (foundation)
- [x] 1.1 Add `PanelId`, `PanelFrame` ({x,y,w,h,collapsed,visible,z}), and `panelLayout: Partial<Record<IpodViewMode, Partial<Record<PanelId, PanelFrame>>>>` to `lib/ipod-state/model.ts`
- [x] 1.2 Default + normalize `panelLayout` in `lib/ipod-state/update.ts` (`normalizeModel`, initial model) so absent/old snapshots round-trip cleanly
- [x] 1.3 Add XState events to `lib/xstate/central-machine.ts`: `SET_PANEL_FRAME`, `SET_PANEL_COLLAPSED`, `SET_PANEL_VISIBLE`, `FOCUS_PANEL` (z-order), `RESET_PANEL`, `RESET_PANEL_LAYOUT` (plus `SUMMON_PANEL`, `HYDRATE_PANEL_LAYOUT`) — keyed by current `viewMode`
- [x] 1.4 Verify: `pnpm type-check` passes; a snapshot without `panelLayout` normalizes to registry defaults (`lib/ipod-state/panel-layout.test.ts`, 8/8)

## 2. FloatingPanel primitive (MVP slice)
- [x] 2.1 Create `components/ipod/panels/panel-registry.tsx`: `PANEL_REGISTRY` with `{ title, idealMinSize, minSize, defaultFrame, content }` per panel; seeded with ONE real panel (`view`) migrated from an existing dock control
- [x] 2.2 Create `components/ipod/panels/floating-panel.tsx`: title-bar drag (pointer capture + rAF, commit on release), edge + corner resize, collapse/expand to `idealMinSize` (preserve prior frame), focus-to-front, viewport clamping; `touch-action: none` on handles
- [x] 2.3 Create `components/ipod/panels/panel-host.tsx`: render visible registered panels for the current mode from `panelLayout`; clamp persisted frames into viewport on mount + on `resize`
- [x] 2.4 Verify (browser, Playwright): drag stays in-bounds, resize respects min/viewport, collapse→ideal-minimal and expand→restore, focus brings to front (`tests/floating-panels.spec.ts`, 8/8)

## 3. Command palette (MVP slice)
- [x] 3.1 Create `components/ipod/command/command-registry.ts`: live command source reading machine state — switch-mode (feature-gated), summon/toggle/collapse per registered panel, reset-layout
- [x] 3.2 Create `components/ipod/command/command-palette.tsx` using `cmdk`: fuzzy search, arrow/Enter keyboard nav, Esc to close
- [x] 3.3 Mount palette + global ⌘K / Ctrl+K listener. NOTE: mounted via `panel-system.tsx` inside each route's hydrated client tree (workbench + 3D stage) rather than `app/layout.tsx` — in this Next setup the layout's client siblings of `{children}` render but don't hydrate, so their key listeners never bind; the page trees share the same store, so the palette is still effectively global. (preventDefault on open, Esc closes, restore focus)
- [x] 3.4 Verify (browser): ⌘K opens/closes, fuzzy filter works, switch-mode restores that mode's layout, summon/toggle/collapse + reset-layout drive panel state (`tests/floating-panels.spec.ts`)

## 4. Canvas symbiosis
- [x] 4.1 In `components/ipod/scenes/ipod-3d-stage.tsx`, compute a "safe content rect" = viewport minus union of visible non-collapsed panel frames (`useSafeInsets` / `computeSafeInsets`); inset/size the canvas container to it; keep model centered
- [x] 4.2 Suspend symbiosis during export (reuse the existing `exporting` guard) so export framing is untouched
- [x] 4.3 Verify: insets derived from the same resolved visible/non-collapsed panels the host renders; capped at 40%/axis so the model can never be squeezed out; suspended while exporting

## 5. Compact fallback (no mobile regression)
- [x] 5.1 Below the compact breakpoint (`< 768`), `panel-host` renders nothing — tool surfaces fall back to the existing docked / bottom-sheet layout with no drag/resize affordances
- [x] 5.2 Verify: `tests/mobile-usability.spec.ts` still passes (4/4) — no regression to `add-mobile-responsive-stability`

## 6. Incremental migration of remaining tool docks  — IN PROGRESS
Panels migrate in one at a time; both surfaces read the same store until the dock retires.
- [~] 6.1 Migrated so far: `view` (seed) and `settings` (Physical Revision / Control Interface /
  Power Cell — fully store-backed, `settings-panel-body.tsx`). REMAINING: color editors (need the
  saved-color history + snapshot I/O lifted into the store/context first), studio controls, shots.
- [x] 6.2 Add palette commands for each migrated panel — automatic via the live registry (summon/
  toggle/collapse Settings appear with no extra wiring)
- [x] 6.3 Verify after each migration: `view` + `settings` — type-check 0, floating-panels.spec 8/8,
  lint 0 errors; Settings panel summons, renders all three sections, and toggling drives the store

## 7. Validation
- [x] 7.1 `pnpm type-check` (exit 0) and `pnpm lint` (0 errors; 62 pre-existing warnings, no new)
- [x] 7.2 `tests/floating-panels.spec.ts`: drag-clamp, resize-min, collapse/restore, per-mode persistence, off-screen reclamp, palette open + mode-switch + panel summon — 8/8 against a hydrating dev server (`PLAYWRIGHT_BASE_URL=http://localhost:4001`, `pnpm dev:raw`)
- [x] 7.3 `openspec validate add-floating-panels-and-command-palette --strict --no-interactive` passes. Fixed a reload-persistence bug found during the live pass: `loadPersistedWorkbenchModel` was restoring `panelLayout: fallback.panelLayout` (empty) instead of `loadPanelLayout()`, so the mount `RESTORE_MODEL` clobbered the hydrated layout and the save effect then wiped localStorage. Now loads from its own key like studio state.
