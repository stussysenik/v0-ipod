# Tasks — unify-experience-truth

**Read `design.md` first.** D1 (the gizmo is the surviving bar), D3 (the double
"Now Playing" does NOT reproduce — do not "fix" it), D6 (archive, never delete) and
D7 (the `/` rail is five controls) are decisions, not suggestions. They were made
against the running app, not from reading code.

Verification environment note: Playwright cannot see the `/3d` WebGL canvas here
(known env limitation) — verify `/3d` visuals via chrome-devtools MCP screenshots at
iPhone viewport (390×844, DPR 3); cover logic with unit tests. Run the dev server
under a captured log (`pnpm dev:raw`, port 4001) and read it; a clean 200 hides
streamed errors.

---

## 0. Already landed (session of 2026-07-14) — verify, don't redo

Tree is green at this point: `pnpm lint` 0 errors, `pnpm type-check` clean,
`pnpm test:unit` 461 passed.

- [x] 0.1 `lib/studio-camera-poses.ts` — the one pose model. `NamedPose`
      (azimuth/elevation/framing), the six `NAMED_POSES`, `StudioShot`/`ShotLook`/
      `SavedPose` types, and `matchNamedPose()` (derives the active view from where the
      camera *actually* is, so free-orbit honestly deselects).
- [x] 0.2 `lib/studio-camera-store.ts` — `ipod-3d-camera.v1`, one versioned home for
      `lockedPose` + `shots` + `presets`, with a one-time fold-in of the three legacy
      keys (legacy `focus` → pose framing; missing `edgeColor` → `backColor`).
- [x] 0.3 `lib/studio-camera-store.test.ts` — 9 tests, green: migration, framing
      default, round-trip + legacy-key retirement, v1-wins-over-stale, malformed
      storage, and named-pose matching across the ±180° azimuth seam.
- [x] 0.4 `components/ipod/scenes/ipod-3d-camera-bar.tsx` — the merged single bar
      (six named views + shot chips + `＋ Shot`), built on `StudioButton`/`StudioChip`/
      `StudioControlScope`. **Written but not yet wired into the stage** — see 1.2.
- [x] 0.5 `lib/feature-flags.ts` — `SHOW_3D_VIEW_MODE`, `SHOW_FOCUS_VIEW_MODE`,
      `SHOW_ASCII_VIEW_MODE` flipped to `false` with ARCHIVED comments; new
      `SHOW_WORKBENCH_TRANSPORT` and `SHOW_WORKBENCH_EXPORTS` flags added (both
      `false`).
- [x] 0.6 `ipod-classic-workbench.tsx` — `useRouter` + the `3D Studio` rail button
      (`data-testid="3d-studio-button"`) that navigates to `/3d`. **The remaining rail
      buttons are not yet gated** — see 3.2.

---

## 1. Camera control truth (/3d) — one bar, the gizmo's

- [ ] 1.1 Wire the pose request path in `ipod-3d-stage.tsx`. Replace the local
      `focus` state with `framing` + a `requestPose({framing, azimuth, elevation, reach?})`
      callback. **Order matters** (design D1): set framing state, then apply the angles
      in an effect keyed on a request nonce, so the stage's `setCameraGoal` lands after
      the rig's framing effect instead of being clobbered by it.
- [ ] 1.2 Swap `Ipod3DStudioShots` for `Ipod3DCameraBar` (already written, 0.4) and pass
      it `onPose`, `framing`, `shots`, `onShotsChange`.
- [ ] 1.3 Archive `ipod-3d-touch-controls.tsx` — **move it, do not delete it** (D6) to
      `components/ipod/archive/` with a header comment saying what replaced it. Remove
      its render + the `touchControls` state/gating in `ipod-3d-stage.tsx`, and the
      "Touch controls" `ToggleRow` in `ipod-3d-studio-cockpit.tsx` (plus its now-unused
      `touchControls`/`onToggleTouchControls` props).
- [ ] 1.4 Delete `ipod-3d-studio-shots.tsx` outright — it is *replaced in place* by the
      camera bar, not archived (D6: archive the feature, delete the duplicate).
- [ ] 1.5 Point the camera cockpit at the shared store: the stage owns the `CameraStore`
      and passes `presets` + `onPresetsChange` down, so the cockpit stops owning
      `ipod-3d-camera-presets` itself. Same for the locked pose (drop `LOCKED_POSE_KEY`
      from the stage in favour of `readCameraStore`/`writeCameraStore`). **No third
      camera state owner** — the bar and the cockpit must edit the same pose state.
- [ ] 1.6 Confirm the export/capture path is untouched: `heroAnchorRef`, `captureHighRes`,
      and the prepare/restore contract must behave exactly as before.

## 2. Mobile correctness (/3d)

- [ ] 2.1 **Do not "fix" the double Now Playing — it does not reproduce** (design D3).
      Verify the invariant instead: one screen at 390×844/DPR 3 across the six views and
      in short landscape. If a genuine duplicate ever appears, the root cause is *not*
      the LCD shader (it is backlight-only, `three-d-ipod.tsx:677-707`).
- [ ] 2.2 Fix the real defect: the bottom bar **overflows the viewport** at 390px (its
      `＋ Shot` label is clipped off the right edge). The bar must fit within
      `100vw - 1.5rem`, scroll horizontally within itself, and respect
      `env(safe-area-inset-bottom)`. Audit stacking (header, stage, bar, drawer, toasts,
      coach hint) at 390×844 and short landscape (≤540px height).
- [ ] 2.3 Verify export still captures exactly one screen (existing export path).

## 3. Surface mode switching + the `/` rail (design D7)

- [ ] 3.1 Mirror the header affordance: `/3d` gets a `2D` control returning to `/`, in
      the same header slot as the `/` rail's `3D Studio` button, in the studio control
      language. Customization carries across via the existing localStorage/portable-state
      bridge — check both directions by hand.
- [ ] 3.2 Gate the archived rail controls in `ipod-classic-workbench.tsx` behind the
      flags added in 0.5: Play/Pause + Reset under `SHOW_WORKBENCH_TRANSPORT`; the PNG,
      GIF and MP4 export buttons under `SHOW_WORKBENCH_EXPORTS`. The rail must end up as
      exactly five visible controls: Flat, Preview, 3D Studio, Zen, Copy share link.
      Nothing is deleted.
- [ ] 3.3 Hydration migration: a persisted `viewMode` whose flag is now off
      (`"3d"`, `"ascii"`, `"focus"`) must hydrate as `"preview"` and persist the migrated
      mode — otherwise a returning user is stranded in an unreachable mode with no rail
      button to leave it. Unit-test it.
- [ ] 3.4 `command-registry.ts`: the `nav:3d-studio` command is currently gated behind
      `SHOW_3D_VIEW_MODE` — **decouple it** (that flag is now `false`, which would remove
      the only palette route to `/3d`). The inline-mode command disappears on its own via
      `availableViewModes()`. Confirm the archived-but-useful actions (reset, share,
      config import/export) are still in the palette.
- [ ] 3.5 `tests/export-downloads.spec.ts` drives the now-archived GIF/MP4 rail buttons
      and has no palette equivalent → `test.skip` it with a comment naming
      `SHOW_WORKBENCH_EXPORTS` as the restore switch. **Do not delete the spec.**

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
