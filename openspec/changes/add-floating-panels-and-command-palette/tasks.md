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
- [~] 6.1 Migrated so far: `view` (seed), `settings` (Physical Revision / Control Interface /
  Power Cell — `settings-panel-body.tsx`), and `colors` (Case / Outer Click Wheel / Center Button /
  Studio Background + snapshot Restore/Save — `colors-panel-body.tsx`). The colors migration
  required the state-lift it was blocked on: the per-target "Recent Custom" history now lives in
  `model.savedColors` (+ `SAVE_CUSTOM_COLOR` event in both the central machine and the local
  reducer, `pushSavedColor` helper, `loadSavedColors`/`saveSavedColors` persistence reusing the
  legacy per-target keys). The dock's `KumaSettingsPanel` now reads the same store slice and the
  shared `ColorField`/`ColorSwatchButton` (extracted to `components/ipod/editors/color-field.tsx`),
  so both surfaces stay in lockstep. REMAINING: studio controls + shots — these live in the `/3d`
  stage's *local* `useReducer` (not the central store the panels read), so they need a 3D-local
  context bridge (reducer + camera `apiRef`) rather than a store read; deferred until the dev
  harness hydrates (see 6.3) so the 3D refactor can be runtime-verified.
- [x] 6.2 Add palette commands for each migrated panel — automatic via the live registry (summon/
  toggle/collapse Settings appear with no extra wiring)
- [~] 6.3 Verify after each migration: `view` + `settings` + `colors` — type-check 0, full unit
  suite 353/353 (incl. panel-layout 8/8 + model/normalize/snapshot round-trips exercising
  `savedColors`), lint 0 errors (61 warnings, −1 vs the 62 baseline). LIVE e2e BLOCKED: in the
  current dev environment the client tree does not hydrate — `npm run dev` / `dev:raw` both serve
  HTML (200) and React's runtime executes, but interactive React (button clicks, the ⌘K document
  listener) never responds and the HMR socket returns `ERR_INVALID_HTTP_RESPONSE`. Confirmed
  identical on a clean `git stash` of all this work (baseline `floating-panels.spec:39` fails the
  same way), so it is a pre-existing harness/tooling issue, NOT a regression from §6. Colors panel
  is a structural twin of the verified Settings panel; re-run floating-panels.spec once the harness
  hydrates again to close this out.

## 7. Validation
- [x] 7.1 `pnpm type-check` (exit 0) and `pnpm lint` (0 errors; 62 pre-existing warnings, no new)
- [x] 7.2 `tests/floating-panels.spec.ts`: drag-clamp, resize-min, collapse/restore, per-mode persistence, off-screen reclamp, palette open + mode-switch + panel summon — 8/8 against a hydrating dev server (`PLAYWRIGHT_BASE_URL=http://localhost:4001`, `pnpm dev:raw`)
- [x] 7.3 `openspec validate add-floating-panels-and-command-palette --strict --no-interactive` passes. Fixed a reload-persistence bug found during the live pass: `loadPersistedWorkbenchModel` was restoring `panelLayout: fallback.panelLayout` (empty) instead of `loadPanelLayout()`, so the mount `RESTORE_MODEL` clobbered the hydrated layout and the save effect then wiped localStorage. Now loads from its own key like studio state.
