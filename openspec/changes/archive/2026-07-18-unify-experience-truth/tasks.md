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
- [x] 2.4 **Proven by the launch poster (8.1).** `pnpm og:render` drives
      `api.captureHighRes(w, h, framing, heroAnchorRef.current)` — the identical call
      `handleExportPng` makes at `ipod-3d-stage.tsx:469` — and was run in **both**
      framings. `hero` and `front` each returned exactly one device and one live screen.
      The one unproven claim in §1–3 is now an artefact checked into `public/og.png`.
- [x] 2.5 Short-landscape verified at 844×390: the bar re-docks bottom-left, fits the
      viewport, and the device stays framed with one live screen. **Found:** the Next.js
      dev badge sits over the `Front` preset button in landscape. Dev-only — confirmed
      absent from the production build in 8.3.

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

## 4. Studio control language adoption — SPLIT OUT

**Moved to its own change: `adopt-studio-control-language`.** The
`studio-control-adoption` spec went with it, intact; this change ships without it.

Why it was split, not dropped: it is a ~2,600-line restyling sweep across nine files with
no behaviour change and real regression risk on precisely the surfaces this launch
exposes. Holding the launch for a cosmetic pass would have traded a real gate for a
decorative one. It is still owed — the desktop `/3d` screenshot in 7.3 shows the seam
plainly: a machined blue camera bar under white cards with stock Tailwind corners.

- [x] 4.1 Inventory done, and it **corrects this section's own premise**: adoption was
      never "zero" — five of the nine files already import the primitives. The real,
      measured gap is **30 raw `<button>`, 17 `rounded-full`, 40 ad-hoc radii**. Recorded
      as a per-file table in the new change's `proposal.md`, where it is the baseline the
      first task turns into a failing lint gate.
- [~] 4.2–4.4 → `adopt-studio-control-language` tasks 2, 3, 5.

## 5. Default presentation

- [x] 5.1 Cold-load first paint verified on `/3d` at 390×844/DPR 3: Noir black shell on
      the `#0048FF` stage, whole device framed, no hydration colour flash. **Already
      true** — no work needed unless §1–4 regress it; re-verify at the end.
- [x] 5.2 Done (`21a6730`). The apply function was un-testable where it lived (inside the
      cockpit), so the mapping moved out to a pure `themeActions(theme)` in
      `lib/studio-themes.ts`. Two ways the "one tap back to factory" promise breaks
      quietly are now failing tests instead of bugs someone finds in a screenshot: a
      **partial apply** (the test drives the real reducer from a model with all seven
      surfaces dirtied to `#ff00ff` and asserts no dirt survives) and **drift** between
      `NOIR_THEME` and what `createInitialIpodWorkbenchModel` actually boots (a drift test
      binds them — it passes today, which is the point: a guard, not a fix). `/`'s colour
      panel also gained the Factory row it lacked; it applies the four surfaces a *flat*
      device has, because the XState machine has no back/edge/bezel/lighting events — a 2D
      device has no back. Those events are not sent, rather than sent and dropped.

## 6. Portfolio content sync — DONE

**The task as written would have shipped nothing (D11).** `/portfolio` renders the
*feed*, not `data.ts` — whose only consumer is mounted nowhere. The feed was hand-authored
and had drifted: a cut work, a retitled role, a dead URL. So the feed is now *derived*.

- [x] 6.1 `lib/portfolio/data.ts` synced to the D5 snapshot: role → `R&D Experience Design
      Engineer`; the eleven canonical works in the site's order (the 12th, `iPod emulator`,
      removed — the visitor is holding it); `uyr-problem`'s dead URL fixed; Cooper Union's
      real degree; the process is the site's own three steps (REMIX / RE-THINK / RE:IMAGINE),
      its copy carried over from the previous four-phase write-up rather than invented.
      Works now carry a stable authored `slug`.
- [x] 6.2 **(D11)** `lib/portfolio/build-feed.ts` + `pnpm feed:build` + `build-feed.test.ts`:
      the feed is a projection of `data.ts`, and a unit test fails if the checked-in JSON
      drifts from the builder. Verified live at 390×844 — root menu is
      `Works · Process · About · Contact`, both surfaces identical.
- [x] 6.3 **(D6)** Writing / Labs / Likes archived behind `SHOW_PORTFOLIO_WRITINGS`,
      `SHOW_PORTFOLIO_LABS`, `SHOW_PORTFOLIO_LIKES`. Content, screens and rows intact; one
      flip plus a rebuild restores a whole section.
- [x] 6.4 **The task's premise was wrong.** Fetched stussysenik.com to compare: the site
      lists REMIX / RE-THINK / RE:IMAGINE as *names only*, with no supporting copy beneath
      them. So the descriptions have not drifted from the site — there is nothing there to
      drift from. They are the user's own words from the earlier four-phase write-up,
      carried over deliberately. Nothing to sync.
- [x] 6.5 Done (`aafbfe1`). **Resolved against `stussysenik.com/cv`, which the user named
      as the standard.** The CV reads "Computer Engineering + Interdisciplinary Arts,
      Sep 2022 → May 2025" and makes no claim about leaving. `data.ts`'s title and dates
      already matched it exactly — so the CV is the authority and the stray "dropped out
      junior year" in the description was the thing that disagreed with it. Cut.

## 10. Reachability — the graph, not just the pages (NEW, launch-blocking)

Raised by the user, and it was right. Nothing in this change — or any spec, or any test —
asserted that the surfaces are **connected**. They are not. A page that exists and a page
a visitor can *find* are different claims, and only the first was ever checked.

Measured route graph (`router.push` + the ⌘K registry are the complete set of edges):

```
/  ⇄  /3d          ← the only two edges in the entire app
/portfolio         ← no inbound edge, and no way back out
/3d-portfolio      ← no inbound edge, and no way back out
/whitelabel        ← no inbound edge
```

- [x] 10.1 **Every work's link was dead** (`1caf027`). A *menu* node's `href` opened; a
      *work's* `links[]` did not — center on an open work was a silent no-op, and the
      screen drew the link as inert text wearing a `↗`. All eleven project URLs were dead
      ends on the surface whose whole job is to show the work. The reducer now carries
      slug → primary href from `initNav` and emits it through the same `pendingLink` path
      the contact nodes already used, so it works on both portfolio surfaces; the links
      are real anchors for pointer and keyboard. Three tests, one per branch.
**Resolved.** The graph is no longer four hard-coded hrefs scattered across a rail button, a
command entry and two pages — it is one value, `SURFACE_EDGES` in `lib/nav/routes.ts`. That
is what makes 10.5 assertable at all: reachability became a property of data, not a claim
about source. The app now has eight edges where it had two.

- [x] 10.2 **Inbound edges to `/portfolio`.** A `Portfolio` rail control on `/` (mirroring
      the `3D Studio` button — "the portfolio is a place, not a mode") and a ⌘K
      `nav:portfolio` command, which is the palette's *second* route; `nav:3d-studio` had
      been its only one, which is half of why the surface stayed orphaned.
- [x] 10.3 **The way home — D12 honored, not traded against.** Both portfolio surfaces
      already render a real `IpodDevice` + `IpodClickWheel` with a working MENU button, and
      an iPod's menu *is* a navigation hierarchy. So the way out lives **inside the device's
      own menu**, not in chrome wrapped around it: `surfaceNavNodes()` appends href-only
      menu nodes that ride the existing `href` → `pendingLink` path 10.1 built. No chrome
      added, so D12's cut stands.
      This exposed a real bug it depends on: `useFeedNav` opened **every** `pendingLink` via
      `window.open(…, "_blank")`. Correct for a work's outbound link, wrong for an in-app
      route — "back to the iPod" would have spawned a second tab instead of going back.
      Internal routes now navigate in place via the router, guarded against
      protocol-relative `//evil.com` (which starts with `/` but leaves the origin).
      The nodes are appended **at the surface, not in `senik.feed.json`** — that file is also
      the portable custom element's content, and an embedded iPod must not carry links to
      *this* site's routes (`/` would resolve to the embedder's root). Routes belong to the
      host, so the host is what adds them. The Lit element is untouched.
- [x] 10.4 `/portfolio ⇄ /3d-portfolio` now mirrors `/ ⇄ /3d`, asserted directly.
- [x] 10.5 **The graph test** — `lib/nav/routes.test.ts`. It reads the shipped routes off
      disk (`app/**/page.tsx`) rather than from a list someone must remember to update, then
      BFS-asserts: every surface reachable from `/`, and every surface has a path back to it.
      Proven real by red/green — reverted to the pre-fix graph it fails naming both orphans
      exactly (`['/portfolio', '/3d-portfolio']` unreachable, same two stranded). A new
      `page.tsx` that nobody links to now fails on the day it is added.
- [x] 10.6 `/whitelabel` and `/dev` are **intentionally unlisted** — the embed demo for the
      portable element and an internal workbench, neither part of a visitor's journey. Said
      so in `UNLISTED_ROUTES`, which is load-bearing rather than a comment: the graph test
      treats any route absent from *both* the graph and that list as a failure.

## 7. Gate

- [x] 7.1 `pnpm lint` **0 errors** (49 warnings, pre-existing) · `pnpm type-check` clean ·
      `pnpm test:unit` **481 passed** across 44 files.
- [x] 7.2 Playwright on `/` — **RESOLVED by measurement: all 23 failures are pre-existing.
      Zero regressions. This change does not block the launch on E2E.**
      The baseline landed. A git worktree at `8be7b16` — the commit *before* this change's
      first — ran the identical spec set, and the seven spec files are **byte-identical** at
      both commits (`git diff 8be7b16 HEAD -- tests/…` is empty), so this is a controlled
      comparison: same tests, different app code. Both legs ran with `CI=1` on separate
      ports, sequentially, so a reused dev server could not serve the wrong commit's code
      and CPU contention could not fabricate flakes in the timing-sensitive specs.

      | spec | baseline `8be7b16` | HEAD |
      |---|---|---|
      | `floating-panels` | 8f / 0p | 8f / 0p |
      | `classic-fidelity` | 4f / 0p | 4f / 0p |
      | `preview-marquee` | 3f / 0p | 3f / 0p |
      | `mobile-usability` | 3f / 1p | 3f / 1p |
      | `rapid-interaction` | 2f / 2p | 2f / 2p |
      | `hydration-desync` | 2f / 0p | 2f / 0p |
      | `interaction-sanity` | 1f / 1p | 1f / 1p |
      | **total** | **23f / 4p** | **23f / 4p** |

      Identical failure-for-failure. So the task's original prediction of "two failures" was
      simply wrong about the *count*, but right about the *cause*: the specs are **stale**,
      not the app. They still wait for elements the panel migration moved into ⌘K panels
      (`classic-fidelity` fails the same way at `dd3e885` for exactly this reason).
      **Follow-up, not a blocker:** re-point the seven stale specs at the panel surfaces as
      their own change. They are asserting a UI that no longer exists.
- [x] 7.3 Visual pass done via chrome-devtools at 390×844 and 1440×900 on `/`, `/3d`,
      `/portfolio`. One bottom bar, one live screen, no WIP badge, 2D↔3D toggle present
      and correctly labelled, device framed on every surface. Console clean (only benign
      Next font-preload warnings). Two findings:
      · The `/` rail carries the five D7 controls exactly (`flat-button`,
        `preview-button`, `3d-studio-button`, `zen-mode-button`, `share-link-button`) plus
        three affordances kept by prior decision: `Theme & Controls` (without it a touch
        user cannot customize at all), `Command Palette` (3.2 — the only touch route to the
        archived actions), and `Hide Toolbox`. Flagged to the user, not silently cut.
      · Control language is **not** coherent, exactly as §4 predicted — the desktop `/3d`
        shot shows the machined blue camera bar under white cockpit cards with stock
        Tailwind corners. That is the split-out change's whole job.

## 8. Launch (run via `agent-skills:shipping-and-launch`)

The link ships to a designer audience via tweet reply; the gate above proves the build,
this section proves the launch. Verify against the **deployed URL**, not localhost — prod
builds differ (minification, caching, env).

- [x] 8.1 Done (`63b70d5`). `openGraph` + `twitter: summary_large_image` + a real
      title/description; `generator: "v0.app"` deleted. `metadataBase` is the **branded**
      alias `https://ipod-music.stussysenik.com` (verified 200, and verified an alias of
      this project) — a relative `og:image` unfurls as a broken card on X.
      The poster is a **render, not a screenshot**: `pnpm og:render`
      (`scripts/render-og.ts`) drives the app's own `captureHighRes` through a dev-gated
      `__ipodCaptureOg` seam. A page screenshot could not have avoided framing the chrome
      around the device, and would have sampled the live canvas (transparent, at DPR)
      rather than the export renderer (opaque, stage colour baked in). Framing is `front`,
      not `hero`: the 3/4 hero shot fills a 1200×630 frame by **cropping the device top and
      bottom**, which would read as an accident on the one surface that must look
      deliberate. Unfurl validated against the deployment in 8.3.
- [ ] 8.2 Proofread pass on all user-facing copy: `/portfolio` verbatim against the D5
      snapshot, every external link resolves (no 404s), control labels/toasts/microcopy on
      every surface; zero placeholder, lorem, or debug strings anywhere.
- [~] 8.3 Preview deployed and visually verified at 390×844 and 844×390 (landscape). The
      **Next.js dev badge is confirmed absent from the production build** — it was sitting
      over the `Front` pose button in dev landscape (2.5); on the preview, `Front` is fully
      visible. Unfurl validated on the deployment: `summary_large_image`, absolute
      `og:image`, and `/og.png` served as a real 1200×630 PNG.
      **Still owed:** confirm PostHog events fire from the deployment.
      ⚠️ **The card will not render until you promote.** `og:image` is absolute to
      `ipod-music.stussysenik.com`, and *current production* still 404s `/og.png` and still
      serves `generator: "v0.app"`. Sharing the link before promoting yields a broken card.
- [~] 8.4 Lighthouse on the deployed `/3d` (mobile): **Best Practices 96 · Accessibility
      90 · SEO 63**. SEO is a false alarm — the only failure is `is-crawlable`, i.e.
      Vercel's preview `noindex` header, which does not exist in production.
      **Found and fixed (`e8c88d8`):** Best Practices flagged console errors, and the
      failing request was `http://127.0.0.1:8090` — `lib/pocketbase.ts` fell back to a
      localhost URL when unset, so the deployed page fired a request at **the visitor's own
      machine** on every `/3d` load. Unconfigured in production now disables the feature.
      Re-verified on the redeployed preview: **zero localhost requests**.
      **Still owed:** the two real Accessibility failures (`aria-command-name` — buttons
      without accessible names; `label` — form elements without labels; both in the `/3d`
      cockpits), and the performance trace across a pose transition + wheel interaction.
- [ ] 8.5 Promote to production; smoke the prod URL (unfurl card, `/`, `/3d`,
      `/portfolio`); confirm a PostHog event from prod; note the previous deployment as
      the instant-rollback target.
- [ ] 8.6 Audience-path pass (user-assisted — needs a physical iPhone): open the prod link
      from the X app or iMessage; confirm the unfurl card, framed Noir device, one bottom
      bar, working wheel + camera gestures, no safe-area collisions. This is the only step
      Claude cannot run; everything else must already be green before asking for it.

## 9. Portfolio surface — the device is the product (D12/D13)

`/portfolio` and `/3d-portfolio` are the shared link's actual destination for a designer
who taps through. They were wearing chrome that restated the device.

- [x] 9.1 **(D12)** `/portfolio`: title card + wheel caption cut. Device carries
      `aria-describedby` → an `sr-only` description of the wheel, arrow keys, Enter and
      Escape. (First use of `sr-only` in the repo.)
- [x] 9.2 **(D12)** `/3d-portfolio`: identity card + wheel caption cut, same treatment.
- [x] 9.3 **(D1, missed until now)** `/3d-portfolio` was still rendering the in-canvas
      `Product / Front / Back` focus segment — the control D1 deleted from `/3d` as "the
      single most confusing element in the mobile shot". Pinning `focus="product"` (the
      rig's own default) makes it controlled, which suppresses the pill; composition
      unchanged, chrome gone.
- [x] 9.4 **(D10/D13)** `/3d-portfolio` orbit toggle: bespoke `rounded-full` + hover-only
      → `StudioButton`. Machined radius, and it gains a focus-visible state and a real
      accessible name describing what activating it does.
- [x] 9.5 Done (`aafbfe1`). Cut. It was decided against the CV: the name already renders
      twice (the device's own screen header, and the page title), so at 4% opacity the
      watermark was neither legible nor load-bearing — dead pixels restating a name the
      device already says. Making it *read* would have been a third rendering of the same
      name on a surface whose whole thesis (D12) is that the device is the product.
- [x] 9.6 **Premise does not reproduce — no code change earned.** Re-measured at 500×844:
      the canvas is exactly `0,0,500×844` and the device's lit centroid sits at **x=247.5
      against a viewport centre of 250** — 2.5px, half a percent. It is centred. The
      "left-of-centre with dead space bottom-right" was real when written and was fixed by
      the D8 inset fix in 2.3 (the stage had been inset by every floating-panel frame
      regardless of viewport). Recon confirms the mechanism: nothing in the render chain
      offsets X, the device group sits at world origin, and the rig always looks at
      `target.x === 0`, so the origin projects to the exact canvas centre.
- [x] 9.7 **Premise does not hold — no guard needed.** Portfolio nav state is *never*
      persisted: `use-feed-nav.ts:18` is a plain in-memory `useReducer`, so every load
      boots at the feed root. There is no rehydration path to poison. Belt and braces
      anyway: `build-feed.ts` strips `writing`/`labs` from the JSON at **build** time when
      the flags are false (pinned by `build-feed.test.ts`), so the archived sections are
      not in the feed the page imports. A stale deep link cannot reach them because there
      is no deep link — and the `ScreenId`s that *do* name them belong to `usePortfolioOs`,
      which has no consumers.
