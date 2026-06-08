# Change: Animate the Now Playing Screen in /3d Clip Exports

## Why

The `/3d` studio clip (MP4) export reproduces the camera move faithfully, but the Now
Playing **screen itself is frozen**. The export pipeline bakes the screen DOM to a single
static PNG once and then only moves the camera per frame, so in the exported clip the title
**marquee never scrolls** and the **progress bar + elapsed/remaining time never advance** —
the device flies around a dead screen. This breaks the WYSIWYG contract: what the user
scrubs/plays in the live preview is not what the clip shows.

The root causes are verified in code:

1. **One static bake.** `renderClipFrames` (`components/three/three-d-ipod.tsx:1700`) calls
   the capture hook `prepare()` (`:1709`) **exactly once** before the frame loop. `prepare()`
   rasterizes the screen DOM to a single PNG via `html-to-image` `toPng`
   (`components/three/three-d-ipod.tsx:959`) and swaps it onto the LCD plane. The per-frame
   loop then only updates the **camera**, so the screen texture is fixed for the whole clip.
2. **The screen DOM is already animating during the export — it just isn't re-sampled.**
   `renderClipFrames` calls `setFrameloop("never")` to stop R3F's loop, but the browser keeps
   running the marquee `requestAnimationFrame` and the progress `setInterval`
   (`components/ipod/scenes/ipod-3d-stage.tsx:220`), and the loop `await`s the encoder so the
   event loop yields between frames. So the live screen moves the whole time; the export
   simply snapshots it once. The minimal fix is to **re-sample the texture**, not to rebuild
   any animation.
3. **A full re-bake on *every* frame is too slow for long clips.** Measured this session: a
   screen bake is ≈ **115ms** cold and ≈ **85–104ms** warm (warm `toPng@3x` 96–104ms,
   `toCanvas@2x` 78–87ms; warmth/pixel-ratio do not rescue it). A 60s @ 30fps clip (1800
   frames) is still ≈ 2.5–3 min — unshippable. But a **throttled** re-bake (capped cadence)
   is fine for the short clips that dominate (length slider defaults to 5s), which is why the
   design is **phased**, not one big compositor.
4. **The marquee also does not scroll in live preview.** `components/ui/marquee-text.tsx`
   only animates when `(preview || captureReady) && overflow` (`:80`); during normal preview
   neither flag drives it, so the title sits still even before export.

The animated parts are **deterministic functions of clip-time**, so the screen can be advanced
to any `t` reproducibly:

- Marquee offset is a pure function: `getMarqueeFrame(metrics, elapsedMs, staggerIndex, mode)`
  → `translateX` in `lib/marquee.ts`.
- Progress = `currentTime / duration` (`components/ipod/controls/ipod-progress-bar.tsx:70`),
  advanced 1s per real second by a `setInterval` while the transport `isPlaying`
  (`components/ipod/scenes/ipod-3d-stage.tsx:220`).
- Elapsed/remaining time text changes ~once per second off the same clock.

Because these are all functions of `t`, the export can advance the screen to each frame's
clip-`t` and re-sample it — either by re-baking on a bounded cadence (Phase 1) or by
compositing the moving layers over a once-baked chrome (Phase 2) — yielding a clip that equals
the live screen advanced by `t`.

Note: the existing 2D GIF/marquee animation in `components/ipod/ipod-classic.tsx` is a
**separate** pipeline (the flat 2D classic export). This proposal is exclusively about the
`/3d` WebGL clip (MP4) pipeline.

## What Changes

- **Drive the screen by clip-`t` (shared foundation).** Add a deterministic setter that puts
  the screen into the exact state for a frame's clip-`t`: marquee `translateX` via
  `getMarqueeFrame`, `currentTime(t)` via the live transport's map, progress fill + time text
  from it. This is the single source both phases use, and it is the same `t` the camera move
  consumes — guaranteeing export === preview at `t`.
- **Phase 1 — throttled re-bake (ships the common case).** In `renderClipFrames`, replace the
  single `prepare()` bake with a re-bake on a **bounded cadence** (≈12–15 screen updates/sec,
  capped total bakes), advancing the screen to clip-`t` before each. Reuses the existing bake
  path — a small, localized loop change, no new renderer. The applied refresh rate / bake cap
  is logged, never silent. Marquee scrolls and progress/time advance in short clips with a few
  seconds of extra export cost.
- **Phase 2 — layered compositor (fidelity + long clips, if Phase 1 is too steppy).** Bake the
  static chrome once, measure the animated-layer geometry, and composite the moving layers
  (marquee translate, progress fill, time text) onto a `CanvasTexture` per frame — full fps,
  no per-frame DOM rasterization.
- **Fix marquee in live preview.** Make the marquee scroll during normal preview play (not
  only when `captureReady`), so the preview the user scrubs is the truth the export matches
  (`components/ui/marquee-text.tsx`).
- **Hold the WYSIWYG + performance line.** The clip stays WYSIWYG with the preview at the same
  playhead, and full DOM rasterizations are **decoupled from frame count** (bounded re-bakes
  or a single chrome bake), so long clips never incur ~115ms per frame.

## Impact

- Affected specs (delta in this change): `3d-export` (new requirements; this capability has
  no committed `specs/3d-export/spec.md` yet — its requirements live in pending changes such
  as `refine-3d-export-wysiwyg-and-color`).
- Affected code:
  - `components/three/three-d-ipod.tsx` — capture hooks (`prepare()` `:1709`, `toPng` `:959`)
    and `renderClipFrames` (`:1700`): layer geometry capture + per-frame compositor +
    `CanvasTexture` swap on the LCD plane.
  - `components/ui/marquee-text.tsx` — drive the marquee during preview play (`:80`).
  - `lib/marquee.ts` — reuse `getMarqueeFrame` as the deterministic marquee source.
  - `components/ipod/controls/ipod-progress-bar.tsx`,
    `components/ipod/scenes/ipod-3d-stage.tsx` — source of the progress/time clip-`t` mapping.
- User-visible behaviour change (the exported clip now animates); no data migrations.
- Explicitly **out of scope:** the 2D classic GIF/marquee pipeline in
  `components/ipod/ipod-classic.tsx`.
