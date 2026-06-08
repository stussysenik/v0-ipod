## Context

The `/3d` studio exports a WebGL clip (MP4) by replaying a deterministic camera move and
capturing one frame per step. To get the Now Playing screen into the 3D scene at all, the
capture hook rasterizes the screen DOM to a PNG (`html-to-image` `toPng`,
`components/three/three-d-ipod.tsx:959`) and maps it onto the LCD plane. `renderClipFrames`
(`:1700`) calls `prepare()` (`:1709`) **once**, then the per-frame loop moves only the
camera. Result: the screen texture is a single static image for the entire clip — the title
marquee and the progress bar/time are frozen.

Two facts from a code+measurement study this session reshape the fix:

1. **The screen DOM already animates *during* the export.** `renderClipFrames` sets
   `frameloop("never")` to stop R3F's render loop, but that does not stop the browser: the
   marquee's `requestAnimationFrame` (`components/ui/marquee-text.tsx`) and the progress
   `setInterval` (`components/ipod/scenes/ipod-3d-stage.tsx:220`) keep ticking on wall-clock,
   and the per-frame loop `await`s the encoder so the event loop yields between frames. So the
   live screen is *moving* the whole time — the export just never re-samples it. The gap is
   "the texture is baked once," not "the screen isn't animating." That makes the minimal fix
   **re-baking the texture**, not rebuilding the animation.

2. **Re-bake cost is ~85–115ms regardless of cache warmth.** Measured this session: cold
   `toPng@3x` ≈115ms; *warm* repeats ≈96–104ms (`toPng@3x`), ≈78–87ms (`toCanvas@2x`), and
   ≈49ms (`toSvg`, but SVG still needs rasterizing to become a texture). Warmth/lower pixel
   ratio do **not** rescue it: the cost is DOM serialization + rasterization, not the cache.
   A full per-frame re-bake of a 60s@30fps clip (1800 frames) is still ≈2.5–3 min — not
   shippable for long clips, though tolerable for the short clips that are the common case
   (the length slider defaults to 5s; range 2–60s).

This yields a **phased** design rather than one architecture: a simple throttled re-bake that
ships the common short-clip case immediately, and a layered compositor for full-fps smoothness
and long clips.

The animated parts of the screen are **deterministic functions of time**:
- Marquee offset: `getMarqueeFrame(metrics, elapsedMs, staggerIndex, mode)` → `translateX`
  (`lib/marquee.ts`), a pure function.
- Progress: `currentTime / duration` (`components/ipod/controls/ipod-progress-bar.tsx:70`),
  with `currentTime` advancing 1s per real second while playing
  (`components/ipod/scenes/ipod-3d-stage.tsx:220`).
- Elapsed/remaining time text: derived from the same `currentTime`, changing ~once/sec.

A separate concern: the marquee does not animate in normal live preview either
(`components/ui/marquee-text.tsx:80` gates animation on `(preview || captureReady) && overflow`).
Since the export must be WYSIWYG with the preview, the preview must animate too.

## Goals / Non-Goals

Goals:
- The exported `/3d` clip animates the title marquee and the progress bar + elapsed/remaining
  time, instead of freezing them.
- The marquee animates in the live `/3d` preview during playback.
- Export === preview at the same playhead `t` (WYSIWYG): screen and camera share one clip-`t`.
- Export time stays bounded — no per-frame full DOM re-rasterization.

Non-Goals:
- The 2D classic GIF/marquee pipeline in `components/ipod/ipod-classic.tsx` (separate, untouched).
- Animating screen content beyond marquee, progress, and time (e.g. live album-art motion).
- Changing the camera move, loop, colour, or tone-mapping behaviour (owned by other specs).

## Decisions

### Decision: Phase 1 — throttled, clip-`t`-driven re-bake (ship the common case first)
Per "Simplicity First": reuse the **existing bake path** but call it on a capped cadence
during `renderClipFrames` instead of once. Before each re-bake, advance the screen DOM
deterministically to the frame's clip-`t` (set the marquee `translateX` via `getMarqueeFrame`
and `currentTime` via the same map the live transport uses), then re-rasterize and swap the
LCD texture. This is a small, localized change to the loop — no new compositor, no layer
geometry to track — and it directly leverages finding (1): the screen already animates; we
just re-sample it deterministically.

Bound the cost with a **screen-refresh budget**: re-bake at most `min(fps, ~12–15)` times/sec
of clip and cap total screen bakes (e.g. ≤ ~120), holding the camera at full fps between
screen updates. A 5s clip → ~60–75 bakes ≈ 5–6s of extra export time (acceptable behind the
existing render veil); long clips degrade screen-refresh rate gracefully instead of blowing
up export time. `log()`/surface the screen-refresh rate so the cap is never silent.

- Trade-off: marquee refreshes at ~12–15fps, not the camera's fps — slightly steppy on close
  inspection. Acceptable for the short clips that dominate; if it reads as too steppy, Phase 2.

### Decision: Phase 2 — layered compositor (full-fps fidelity + long clips)
If Phase 1's refresh rate is insufficient, bake the **static chrome once**, then composite
only the animated layers per frame onto a 2D `CanvasTexture`: the title strip translated by
the marquee `translateX`, the progress fill at its width, and the time text (redrawn only on
whole-second change). Per-frame cost is a few `drawImage`/`fillRect` calls — full fps, no
re-bake. This is the higher-fidelity target; Phase 1 ships first and de-risks it.

- Alternatives considered:
  - **Full per-frame `html-to-image` re-bake (every frame).** ≈85–115ms/frame → ≈3 min for a
    60s@30fps clip. Rejected as the default; Phase 1's *throttled* re-bake is the viable subset.
  - **Render the screen as native Three.js/text geometry (no DOM at all).** Highest fidelity
    control but a large rewrite of the screen-into-scene path and risks drifting from the DOM
    screen's exact look. Rejected as over-scope.

### Decision: Capture animated-layer geometry at bake time
During `prepare()`, in addition to the chrome bake, measure the device-pixel rects of the
title strip, the progress track/fill, and the time-text boxes, plus the `MarqueeMetrics`,
`duration`, and base `currentTime`. These go into a per-export descriptor the compositor
reads. Measuring once is cheap and keeps the compositor a pure function of `t` + descriptor.

- Alternatives considered: hard-coding layer positions (brittle across themes/locales) —
  rejected; measure from the live DOM instead.

### Decision: One clip-`t` clock for camera and screen
The screen layers are advanced by the **same** clip-`t` mapping the camera move uses in
`renderClipFrames`. Marquee `elapsedMs = base + t`; `currentTime(t) = base + t` advanced at
the live 1s/sec cadence and clamped/looped against `duration`. This guarantees the exported
screen at `t` equals the live screen advanced by `t`, satisfying WYSIWYG with no separate
screen clock that could drift.

### Decision: Animate the marquee in preview from the shared source
Flip `components/ui/marquee-text.tsx` so the marquee animates during preview play (transport
`isPlaying` + overflow), using the same `getMarqueeFrame` source as the compositor. This makes
the preview the authoritative target the export reproduces.

## Risks / Trade-offs

- **Layer geometry mismatch** (compositor rects vs. baked chrome) → seams/double-draw.
  Mitigation: measure rects from the same DOM at the same instant as the chrome bake; clear
  the animated regions out of the chrome layer so the compositor owns them exclusively.
- **Phase drift between preview and export marquee** → not WYSIWYG. Mitigation: both consume
  `getMarqueeFrame` with the same `base`, `staggerIndex`, and `mode`; assert agreement at a
  sampled `t` in verification.
- **Loop seam on progress/time** (60s clip vs. song duration) → progress jump at the loop.
  Mitigation: clamp/loop `currentTime(t)` consistently in preview and export; cover in tests.
- **CanvasTexture cost** if redrawn naively. Mitigation: redraw time text only on
  whole-second change; the per-frame cost is a few `drawImage`/`fillRect` calls, not a bake.

## Migration Plan

No data migration. Behaviour-only change to the `/3d` clip export and the preview marquee.
Rollback = revert to the single static bake (`prepare()` once, camera-only loop); the static
PNG path remains the fallback if the descriptor/compositor is unavailable.

## Open Questions

- When the clip length exceeds the song `duration`, should progress/time loop, clamp at the
  end, or ping-pong with the boomerang camera loop? (Default proposed: loop to match the live
  transport's `% (duration + 1)` behaviour at `components/ipod/scenes/ipod-3d-stage.tsx:222`.)
- Should the marquee start-delay / end-pause (`MARQUEE_START_DELAY_MS`, `MARQUEE_END_PAUSE_MS`
  in `lib/marquee.ts`) be honored from clip `t=0`, or offset by the preview's current phase so
  a scrubbed-then-exported clip continues from the visible position?
