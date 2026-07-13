# Design — unify-experience-truth

## Context

The data layer is already unified (`lib/ipod-state/model.ts` + `studio-themes.ts` +
`content/senik.feed.json`). The fragmentation is entirely at the control-surface
layer: three camera surfaces on `/3d`, two 3D affordances from `/`, duplicated
panels vs. cockpits, and bespoke chrome outside the studio control language. The
audience is design-literate (the link goes to designers); redundant controls read
as unfinished thinking, not as features.

## Goals / Non-Goals

- Goals: one control surface per function; one control vocabulary everywhere;
  mobile-first correctness on `/3d`; visible bidirectional 2D↔3D; truthful
  portfolio content; good defaults on first paint.
- Non-Goals: new features, new panels, new presets, restyling the iPod itself,
  color/metadata editor consolidation across *pages* (each page keeps its native
  editor; only same-page duplicates are removed), touching the Lit `/whitelabel`
  embed, changing the feed schema.

## Decisions

### D1 — Camera: one pose model, two altitudes, one bar (**the gizmo wins**)

The three `/3d` camera surfaces collapse to a single pose model
(azimuth/elevation/reach + framing) with two views of it:

1. **The bar** (mobile + desktop): **the six-view gizmo is the surviving bar** —
   `Front · Right · Back · Left · Top · ¾` — with the saved-shot chips and `＋ Shot`
   folded into the same strip. It is the *only* quick camera control on the page.
2. **The cockpit** (05, desktop): the advanced numeric editor of the same state.
   No third concept.

**Decision (user, 2026-07-14): of the two stacked bars, the upper one — the view
gizmo — is the better control and is the one that survives.** The lower bar's
`Product / Front / Back` focus segment is deleted outright. Rationale: six canonical
product views are a complete, honest vocabulary, whereas the focus segment was a
second control labelled "Front"/"Back" that meant something different from the
gizmo's "Front"/"Back" — the single most confusing element in the mobile shot.

"Focus mode" therefore disappears as a user-facing concept: each named view *carries*
its framing (`Front` squares to the face, `Back` to the engraved steel, the turntable
views frame the whole product). The `IpodCameraFocus` prop on `<ThreeDIpod>` stays as
the internal framing input the pose drives — the concept moves down a layer, it is not
ripped out.

Applying a pose is two writes in one gesture, and **the order matters**: the framing
sets the camera *target*, then the angles set azimuth/elevation. The rig's framing
effect (a child effect) runs before the stage's pose effect (a parent effect) on the
same commit, so the stage's `setCameraGoal` lands last and wins. A named view
deliberately omits `reach` — a view re-aims the camera, it does not dolly — so the
framing's rest distance and the rig's responsive fit floor keep the device framed on a
phone.

Persistence: `ipod-3d-locked-pose`, `ipod-3d-studio-shots`,
`ipod-3d-camera-presets` consolidate under one versioned key
(`ipod-3d-camera.v1`) with a one-time migration read of the legacy keys.

- Alternative considered (and rejected by the user): keep the *lower* bar and fold the
  gizmo's views into it as `¾/Front/Back/Top`. Rejected — it discards Right/Left and
  keeps the weaker of the two controls.

### D2 — One 3D truth: the route

The workbench's inline `viewMode:"3d"` renders a second, lesser 3D iPod inside the
2D page — a duplicate truth. The view rail keeps `flat/preview/focus/ascii`; the 3D
affordance becomes explicit navigation to `/3d` (state already bridges via
localStorage + `?s=`). `/3d` gets a mirrored "2D" affordance in its header.
Both use `StudioSegment`-style header controls, same position, so switching feels
like one toggle, not two apps.

- Alternative considered: keep inline 3D as a "preview" and the route as "studio" —
  rejected; two 3D surfaces with different capabilities is exactly the confusion
  this change removes.

### D3 — Double "Now Playing": NOT REPRODUCIBLE (corrected 2026-07-14)

**The original premise was wrong and no code change is warranted.** Verified live at
390×844 / DPR 3 via chrome-devtools MCP across the ¾, Back and Top poses, plus short
landscape (844×390): **exactly one screen renders in every state.**

Why the premise was wrong: `three-d-ipod.tsx` does render an LCD shader plane
(`:1478`) *and* a drei `<Html transform occlude>` DOM overlay (`:1481-1501`) — but the
shader (`useLcdShader`, `:677-707`) is **backlight only**: `color * vignette *
scanline * brightness`. It has no texture, no text, and therefore *cannot* present a
second readable "Now Playing" — the invariant holds by construction. The overlay's
`occlude={[bodyRef]}` correctly hides the DOM screen when the device is turned away
(confirmed on the Back pose). A DOM query for the literal string finds two nodes, but
the second is the **`03 Now Playing` cockpit header** in the (off-screen) mobile
drawer — a panel title, not a second screen.

The mobile-experience spec keeps its "exactly one live screen render" requirement as a
**standing invariant / regression guard**, not as a bug to fix. What was *actually*
wrong on mobile — and is real, screenshotted, and fixed by D1 — is the **two competing
bottom bars**, plus the shots bar **overflowing the viewport** (its `＋ Shot` label
clipped off the right edge at 390px).

Anything that looked like a duplicate screen at capture time is already handled by the
existing prepare/restore layer swap (`setOverlaysHidden`, `:1287-1349`); leave it alone.

### D6 — Archive, never delete

Nothing removed by this change is deleted. The repo's established idiom is
`lib/feature-flags.ts` — a flag with an `ARCHIVED (…) Flip to true to restore.`
comment — and every retirement here uses it. Rationale: this codebase has been through
long development and accumulated surfaces that were exploratory, not wrong; the product
direction is to *stop showing* them, not to lose them. A reviewer must be able to bring
any archived surface back with a one-line flag flip, with its code path intact.

Applies to: the inline `viewMode:"3d"` render path, Focus and ASCII view modes, the
workbench transport + reset, the 2D export rail, and `ipod-3d-touch-controls.tsx`
(moved to an archive directory, not `rm`'d).

This **supersedes** the earlier "adoption means deletion" phrasing in D4 for *page
surfaces*. D4 still holds for **bespoke control styles** — a one-off Tailwind button
string genuinely is deleted when its surface adopts the primitives, because the
primitive replaces it in place. Archive the *feature*; delete the *duplicate styling*.

### D7 — The `/` rail is five controls

The `/` rail shipped twelve controls, two badged `WIP` (screenshot, 2026-07-14). For a
link tapped from a tweet by a design-literate stranger, authoring chrome reads as an
unfinished tool, not a product. The rail ships exactly five:

| Visible | Archived behind a flag |
| --- | --- |
| Flat | `3D Experience` (inline mode, WIP) |
| Preview | `ASCII Mode` (WIP) |
| **3D Studio → `/3d`** | Focus Mode |
| Zen | Play/Pause (the click wheel already plays) |
| Copy share link | Reset defaults (lives in ⌘K) |
| | Export PNG · GIF · MP4 (`/3d` owns the export dock) |

Every archived action that a user could still want stays reachable through ⌘K. The one
real cost: `tests/export-downloads.spec.ts` drives the GIF/MP4 rail buttons and has no
palette equivalent, so it is **skipped while `SHOW_WORKBENCH_EXPORTS` is false** — the
2D export pipeline keeps its code and loses its E2E coverage until the flag returns.

### D8 — The camera moves deterministically: framing ⟂ chrome (found live, 2026-07-14)

**Root cause, measured, not guessed.** On a 390px phone the device hung off the
bottom-right corner of the stage — a real, screenshotted defect (it survived a reload,
so it was not a mid-ease transient). The canvas was the correct size (390×844) but its
container was inset to `left:156, top:338`.

The culprit is the floating-panel *symbiosis* inset in `ipod-3d-stage.tsx`:
`useSafeInsets` computes an inset from **every non-collapsed panel frame, regardless of
viewport**, and the stage applies it as `stageStyle`. On desktop that is the intended
behaviour (nudge the canvas out from under a floating panel). On a phone the panels do
not float at all — the controls live in the bottom drawer — yet their frames still
produced a large inset, which shoved the whole stage off-screen.

**Decision: panel symbiosis is a desktop affordance.** The inset applies only at
≥1024px (`lg`, the same breakpoint at which the cockpits actually float); below it the
stage fills the viewport untouched. The framing of the device is now a pure function of
*the pose and the viewport* and never of control chrome — which is the property the
user asked for ("be really deterministic and in ownership of how it moves").

This was pre-existing (nothing in this change touched the panel or inset code), but it
only became *visible* once the stacked bars were removed and the device was the only
thing on screen. Fixed here rather than deferred: it is the single worst thing a
designer tapping the link from a tweet would see.

### D9 — Ship a closed set of angles; archive user-authored camera points (user, 2026-07-14)

**Decision (user): archive the custom camera point for now — just give presets for the
angles.** The `/3d` bar ships the six named angle presets and nothing else. The saved
studio shots (`＋ Shot` + chips) and the camera cockpit's numeric "Save pose" presets go
behind `SHOW_CUSTOM_CAMERA_POSES` (false).

Rationale, and it is the same one as D8: a *named preset* is a pose the product
guarantees — it carries its framing, omits `reach`, and is proven to frame the device on
every supported viewport. A *user-saved point* is an arbitrary azimuth/elevation/reach
captured on whatever viewport the user happened to be on, with no such guarantee when it
is recalled somewhere else. Shipping both means shipping one control the camera can keep
its promise about and one it cannot. The determinism requirement therefore *implies*
this cut; it is not merely a scope trim.

Per D6 this is an archive, not a deletion: the shots and presets already in a user's
`ipod-3d-camera.v1` store are preserved, still migrated, and simply not rendered. One
flag flip brings both surfaces back with their data intact.

### D10 — The corner is machined, not a pill (user, 2026-07-14)

**Decision (user): drop the stadium pills — rectangles, or a custom corner; the default
`rounded-full` is too easy to catch.** They are right, and the system already had the
answer: `studio-controls.tsx` derives `CONTROL_RADIUS` from the *device's own* radius
family (screen aperture 3.0mm ÷ body corner 6.4mm ≈ 0.47, applied to the 16px base ≈ 7px).
Every `Studio*` primitive already sets it inline. The new camera bar and header controls
were overriding that with `rounded-full` — an ad-hoc pill bolted around a machined corner.

The fix is to *stop overriding the system*, plus one addition it was missing: a radius for
a **surface** that holds controls. Concentric corners require `outer = inner + padding`,
and our surfaces pad by `p-1` (4px), so `SURFACE_RADIUS = CONTROL_RADIUS + 4`. The bar,
the `2D` control and the `Menu` button now all sit on that family. No component invents a
radius; §4's adoption sweep should delete every remaining `rounded-full` / `rounded-xl`
on a studio surface in favour of these two constants.

### D4 — Adoption means deletion

`studio-control-adoption` is measured by what is removed: bespoke button/pill/chip
styles in the `/3d` cockpits, `/portfolio` chrome, and the `/3d` panel registry
entries that duplicate cockpit functions. No new primitive variants are invented;
if a surface needs something the primitives lack, that is a change to
`refactor-studio-controls-deterministic`'s spec, not a local override.

### D5 — Portfolio content is copied, not invented

Content snapshot from stussysenik.com (fetched 2026-07-14), the implementation
source (do not paraphrase, do not add works):

- Identity: **Mengxuan "Senik" Zou** — **R&D Experience Design Engineer** — NYC /
  Prague. GitHub: `github.com/stussysenik`.
- Works (date · title · link):
  - 2026.01 · FYOA: Find your own answer · perplexica.stussysenik.com
  - 2026.01 · Spinning wheel AR face filter lottery · spinning-wheel-filter.vercel.app
  - 2026.01 · MyMind.com clone (personal software) · curate-your-own-network.stussysenik.com
  - 2025.12 · Typewriter that doesn't delete · clean-writer.vercel.app
  - 2025.12 · AR b-boy filter · bboy-filter.vercel.app
  - 2025.12 · Uyr-problem (cooking) · reflex-untangle-your-problem.onrender.com
  - 2025.12 · Infinite checklist (todo) · infinite-checklist.vercel.app
  - 2025.12 · Creative block helper · creative-block.vercel.app
  - 2025.02 · DVD corner video animation · dvd-video-animation.vercel.app
  - 2024.11 · PH-213 physics concepts viz · ph213.vercel.app
  - 2024.10 · @Wavelength Radio · wavelength-radio.vercel.app
- Process: "1.REMIX 2.RE-THINK 3.RE:IMAGINE"
- Education: Cooper Union (Computer Engineering + Interdisciplinary Arts,
  2022–2025, NYC); FAMU Prague (AAS Film Production & Creative Management,
  2021–2022); Northfield Mount Hermon (2019–2021); Gymnázium Altis Prague
  (2015–2019).
- Footer: "Made with 💙 in Bed-Stuy" · Available @2026.

## Risks / Trade-offs

- Removing inline `viewMode:"3d"` may break saved models persisted with that mode →
  migration: hydrate legacy `viewMode:"3d"` as `"preview"`.
- Deleting the focus-mode concept changes saved studio shots' shape → shots
  migration maps `focus` into the pose's framing field; legacy shots must still
  restore.
- Blanking the shader LCD under the Html overlay could regress export/capture
  (which *swaps* layers) → keep the capture path's existing prepare/restore
  contract; add the live guard as a separate, capture-aware state.
- E2E blind spot: `/3d` canvas is not visible to Playwright here → visual claims
  verified via chrome-devtools MCP screenshots at iPhone viewport; logic covered by
  unit tests on the pose model/migrations.

## Open Questions

- None blocking. (If `¾/Front/Back/Top` proves too wide with saved-shot chips on
  a 320px viewport, the pose segment may scroll horizontally within the bar — the
  bar count stays one.)
