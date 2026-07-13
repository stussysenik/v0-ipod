# Tasks — unify-experience-truth

**Read `design.md` first.** D1 (the gizmo is the surviving bar), D3 (the double
"Now Playing" does NOT reproduce — do not "fix" it), D6 (archive, never delete),
D7 (the `/` rail is five controls), **D8 (framing ⟂ chrome — the camera is
deterministic)** and **D9 (ship six angle presets; archive user-authored camera
points)** are decisions, not suggestions. They were made against the running app, not
from reading code.

Verification environment note: Playwright cannot see the `/3d` WebGL canvas here
(known env limitation) — verify `/3d` visuals via chrome-devtools MCP screenshots at
iPhone viewport (390×844, DPR 3); cover logic with unit tests. Run the dev server
under a captured log (`pnpm dev:raw`, port 4001) and read it; a clean 200 hides
streamed errors. **Beware a stale tab:** an already-open tab at `localhost:4001` will
HMR your in-progress edits and dump `ReferenceError`s into the log that are not real.
Confirm against a *fresh* load before believing an error.

---

## 0. Already landed — verify, don't redo

**§1, §2 and §3 are DONE** and committed (`3edabe5` + `c7ac1a5`). Tree is green:
`pnpm lint` 0 errors, `pnpm type-check` clean, `pnpm test:unit` **466 passed**.
Verified on the running app at 390×844/DPR 3 (screenshots): device framed on every
one of the six presets, one bottom bar inside the viewport, one live screen.

- [x] 0.1 `lib/studio-camera-poses.ts` — the one pose model. `NamedPose`
      (azimuth/elevation/framing), the six `NAMED_POSES`, `StudioShot`/`ShotLook`/
      `SavedPose` types, and `matchNamedPose()` (derives the active view from where the
      camera *actually* is, so free-orbit honestly deselects).
- [x] 0.2 `lib/studio-camera-store.ts` — `ipod-3d-camera.v1`, one versioned home for
      `lockedPose` + `shots` + `presets`, with a one-time fold-in of the three legacy
      keys. **Confirmed live**: after one load the legacy keys are gone and `v1` holds
      the migrated shots.
- [x] 0.3 `lib/studio-camera-store.test.ts` — 9 tests, green.
- [x] 0.4 `ipod-3d-camera-bar.tsx` — the single bar, **wired into the stage**.
- [x] 0.5 `lib/feature-flags.ts` — `SHOW_3D_VIEW_MODE`, `SHOW_FOCUS_VIEW_MODE`,
      `SHOW_ASCII_VIEW_MODE`, `SHOW_WORKBENCH_TRANSPORT`, `SHOW_WORKBENCH_EXPORTS` and
      **`SHOW_CUSTOM_CAMERA_POSES`** all `false`, each with an ARCHIVED comment.
- [x] 0.6 `ipod-classic-workbench.tsx` — the `3D Studio` rail button → `/3d`.

## 1. Camera control truth (/3d) — DONE

- [x] 1.1 Pose request path in `ipod-3d-stage.tsx`: `framing` state + `requestPose(...)`
      + a nonce-keyed effect. The ordering trap is handled — framing and angles dispatch
      in one commit, and the rig's framing effect (child) runs before the stage's pose
      effect (parent), so `setCameraGoal` lands last. Verified on `Back` (framing change
      + 180° azimuth land together, device squared and framed).
- [x] 1.2 `Ipod3DStudioShots` → `Ipod3DCameraBar`.
- [x] 1.3 `ipod-3d-touch-controls.tsx` **moved** to `components/ipod/archive/` with a
      header saying what replaced it; `touchControls` state + the cockpit `ToggleRow` gone.
- [x] 1.4 `ipod-3d-studio-shots.tsx` deleted (replaced in place).
- [x] 1.5 The stage owns the `CameraStore`; the cockpit takes `presets`/`onPresetsChange`
      and owns no localStorage. No third camera state owner.
- [x] 1.6 Export/capture path untouched (`heroAnchorRef`, `captureHighRes`,
      prepare/restore) — no edits to those paths. **Still unproven at runtime → 2.3.**
- [x] 1.7 **(D9)** Saved studio shots + the cockpit's "Save pose" archived behind
      `SHOW_CUSTOM_CAMERA_POSES`. The bar ships exactly six angle presets.

## 2. Mobile correctness (/3d)

- [x] 2.1 One-screen invariant **verified, not fixed** (D3). A DOM query finds two
      `Now Playing` nodes: the device status bar (on-screen) and the `03 Now Playing`
      cockpit title at `y≈2190` (`onScreen: false`, in the closed drawer). Exactly one
      live screen. Occlusion on the `Back` pose confirmed by screenshot.
- [x] 2.2 The bar fits the viewport: measured `left:12 → right:378` inside 390, body does
      not overflow in x, and it scrolls within itself when it needs to. With the six
      presets alone it no longer needs to.
- [x] 2.3 **(D8) The real mobile defect, found live:** the device hung off the
      bottom-right corner. The stage was inset by *every* floating-panel frame regardless
      of viewport (`left:156, top:338` on a phone). Panel symbiosis is now desktop-only
      (≥1024px). Canvas measures exactly `0,0,390×844`.
- [ ] 2.4 Verify **export** still captures exactly one screen and one device, on the
      current build (the export path was not edited, but it has not been re-run since the
      camera rewire — this is the one unproven claim in §1–3).
- [ ] 2.5 Short-landscape (≤540px height) pass — the bar re-docks bottom-left via
      `landscape`, but this was not re-verified after the inset fix.

## 3. Surface mode switching + the `/` rail (design D7) — DONE

- [x] 3.1 `/3d` header gets a `2D` control (`data-testid="2d-button"`) returning to `/`,
      in the studio control language, mirroring the `/` rail's `3D Studio` button.
      **Not yet hand-checked:** that customization survives the round trip both ways.
- [x] 3.2 Rail gated to five controls: Flat, Preview, 3D Studio, Zen, Copy share link.
      Transport + reset behind `SHOW_WORKBENCH_TRANSPORT`; PNG/GIF/MP4 behind
      `SHOW_WORKBENCH_EXPORTS`. Nothing deleted. **Note:** the ⌘K opener button still
      renders on compact viewports — it is the *only* way a touch user reaches the
      archived actions the spec promises stay reachable, so it stays. Flag if unwanted.
- [x] 3.3 Hydration migration extracted to `migrateViewMode()` in `lib/view-modes.ts`
      (the rule now lives where the gating lives) and unit-tested in
      `lib/view-modes.test.ts` — 5 tests, asserted against the flags, not hard-coded.
- [x] 3.4 `nav:3d-studio` decoupled from `SHOW_3D_VIEW_MODE`. **Also found and fixed:**
      `RESET_MODEL` had *no* palette command at all, so archiving the rail's Reset button
      would have orphaned it — D7 promised it "lives in ⌘K". Added `model:reset`.
- [x] 3.5 `tests/export-downloads.spec.ts` → `test.describe.skip` with a comment naming
      `SHOW_WORKBENCH_EXPORTS` as the restore switch. Not deleted.

## 4. Studio control language adoption

Biggest, least launch-critical section (~2,900 lines across the cockpits, currently at
**zero** adoption — every cockpit is bespoke Tailwind). Land it as its own commit(s);
it is a restyling sweep with real regression risk on a page about to ship.

- [ ] 4.1 Inventory the bespoke control clusters (ast-grep for local button/pill class
      strings) across the `/3d` cockpits and `/portfolio` chrome; list them in the PR.
- [ ] 4.2 Migrate the `/3d` cockpits to `StudioButton`/`Segment`/`Chip`/`Field`/`Row`,
      deleting the bespoke styles in place. Files, by size: `ipod-3d-color-cockpit`
      (765), `ipod-3d-export-dock` (560), `ipod-3d-lighting-cockpit` (526),
      `ipod-3d-camera-cockpit` (272), `ipod-3d-nowplaying-cockpit` (219),
      `ipod-3d-studio-cockpit` (182), `ipod-3d-export-proof-panel` (159),
      `ipod-3d-battery-cockpit` (82).
- [ ] 4.3 Migrate `/portfolio` (`portfolio-feed-stage.tsx`) chrome to the primitives.
- [ ] 4.4 Remove `/3d` panel-registry entries duplicating a cockpit's function; re-route
      their ⌘K commands to the cockpit.

## 5. Default presentation

- [x] 5.1 Cold-load first paint verified on `/3d` at 390×844/DPR 3: Noir black shell on
      the `#0048FF` stage, whole device framed, no hydration colour flash. **Already
      true** — no work needed unless §1–4 regress it; re-verify at the end.
- [ ] 5.2 The Noir chip already exists in the colour cockpit (`aria-label="Apply Noir
      theme"`), as do the `Black`/`Silver` hardware chips. Confirm the apply function
      restores all seven colours deterministically and unit-test it; surface the chips in
      the *primary* colour surface of each customizer page if they are not already.

## 6. Portfolio content sync

- [ ] 6.1 Update `lib/portfolio/data.ts` to the D5 snapshot (identity, the 11 works,
      process, education, GitHub, footer); remove drifted entries. Copy, do not
      paraphrase; do not add works.
- [ ] 6.2 Regenerate `content/senik.feed.json`; confirm `/portfolio` and `/3d-portfolio`
      render identical content.

## 7. Gate

- [ ] 7.1 `pnpm lint` + `pnpm type-check` clean; `pnpm test:unit` green.
- [ ] 7.2 Playwright on `/` green except the two pre-existing known failures
      (interaction-sanity:46, floating-panels:88 — from the panel migration, not
      regressions) and the intentionally-skipped export spec (3.5). Do not regress others.
      Note: the `/3d` specs all fail "canvas not visible" in this environment — that is
      environmental, not a regression.
- [ ] 7.3 chrome-devtools visual pass: `/`, `/3d`, `/portfolio` at 390×844 and desktop —
      one bottom bar, one screen, five rail controls, no WIP badge, working 2D↔3D toggle,
      coherent control language. Attach screenshots.

## 8. Launch (run via `agent-skills:shipping-and-launch`)

The link ships to a designer audience via tweet reply; the gate above proves the build,
this section proves the launch. Verify against the **deployed URL**, not localhost — prod
builds differ (minification, caching, env).

- [ ] 8.1 Share metadata in `app/layout.tsx`: `openGraph` + `twitter` card with a
      1200×630 `og:image`, real title/description; delete `generator: "v0.app"`. Produce
      the og:image as a deliberate poster frame — the Noir device on `#0048FF` via the
      app's own export/capture path, not a screenshot of chrome. Validate the unfurl on
      the deployed URL (opengraph.xyz or `curl` the meta tags).
- [ ] 8.2 Proofread pass on all user-facing copy: `/portfolio` verbatim against the D5
      snapshot, every external link resolves (no 404s), control labels/toasts/microcopy on
      every surface; zero placeholder, lorem, or debug strings anywhere.
- [ ] 8.3 Deploy a Vercel preview; repeat the 7.3 visual pass against the preview URL at
      390×844/DPR 3, and confirm PostHog events fire from the deployment.
- [ ] 8.4 Cold-load performance on the deployed `/` and `/3d` at mobile emulation:
      chrome-devtools Lighthouse, plus a performance trace across a camera pose transition
      and wheel interaction — no sustained long-frame jank; fix anything that blocks first
      meaningful paint of the framed device.
- [ ] 8.5 Promote to production; smoke the prod URL (unfurl card, `/`, `/3d`,
      `/portfolio`); confirm a PostHog event from prod; note the previous deployment as
      the instant-rollback target.
- [ ] 8.6 Audience-path pass (user-assisted — needs a physical iPhone): open the prod link
      from the X app or iMessage; confirm the unfurl card, framed Noir device, one bottom
      bar, working wheel + camera gestures, no safe-area collisions. This is the only step
      Claude cannot run; everything else must already be green before asking for it.
