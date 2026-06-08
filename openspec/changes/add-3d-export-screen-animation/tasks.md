## 0. Implementation note (Phase 1 shipped)

Phase 1 ships as a **throttled re-sample of the live, already-animating screen** rather than an
explicit clip-`t` setter. Per design finding #1, the marquee `requestAnimationFrame` and the
progress `setInterval` keep advancing the screen DOM through the encoder `await` even under
`frameloop("never")`; the only gap was that the LCD texture was baked once. `renderClipFrames`
now re-bakes the LCD on a capped cadence (`refreshScreen` capture hook), carrying that live
motion into the clip. This is **more** WYSIWYG-correct than a separate clip-`t` clock: the export
reproduces exactly what the live preview shows (same `getMarqueeFrame` source, same transport),
so there is no second clock to drift. The explicit clip-`t` *setter* (1.2/1.3) is therefore
superseded for Phase 1; it remains the route for the Phase-2 compositor if pixel-exact clip-`t`
determinism is later required. Trade-off: screen timing tracks export wall-clock, not clip-`t`,
so a clip whose render wall-time differs greatly from its duration advances progress/time at the
render rate — acceptable for the short clips that dominate.

## 1. Deterministic clip-`t` drive of the screen state (shared by both phases)

- [x] 1.1 Confirm the finding that the screen DOM animates during export: the marquee `requestAnimationFrame` and the progress `setInterval` (`components/ipod/scenes/ipod-3d-stage.tsx:220`) keep running under `frameloop("never")`. The fix is to re-sample/redraw the texture deterministically, not to rebuild the animation.
- [ ] 1.2 In `renderClipFrames` (`components/three/three-d-ipod.tsx:1700`), expose the per-frame clip-`t` as the single time source for the screen, the same value the camera move consumes. — SUPERSEDED for Phase 1 by the live re-sample (see note); reserved for the Phase-2 compositor.
- [ ] 1.3 Add a deterministic screen-state setter: marquee `translateX = getMarqueeFrame(metrics, base + t, staggerIndex, mode)` (`lib/marquee.ts`); `currentTime(t) = base + t` advanced at 1s/real-sec and clamped/looped against `duration`; progress fill = `currentTime/duration` (`components/ipod/controls/ipod-progress-bar.tsx:70`) with elapsed/remaining text. This drives the live DOM (Phase 1) or the compositor layers (Phase 2) identically. — SUPERSEDED for Phase 1 (see note); reserved for Phase 2.

## 2. Phase 1 — throttled, clip-`t`-driven re-bake (ship the common short-clip case)

- [x] 2.1 In `renderClipFrames`, replace the single `prepare()` bake with a re-bake on a capped cadence: compute a screen-refresh interval (`min(fps, ~12–15)` and a hard cap on total screen bakes, e.g. ≤ ~120); on frames that hit the interval, set the screen DOM to the frame's clip-`t` state (Task 1.3), re-bake via the existing baker, and swap the LCD texture; hold the texture between updates while the camera renders every frame.
- [x] 2.2 Reuse the existing `bakeNodeOnto`/`prepare` rasterization path (no new renderer); use `cacheBust:false` for re-bakes since the assets are stable.
- [x] 2.3 Surface the applied screen-refresh rate / bake count via `log()` (or the export progress UI) so the cap is never silent.
- [ ] 2.4 Verify on short clips (2–10s): marquee scrolls and progress/time advance in the exported MP4; export time stays within a few seconds of extra cost behind the render veil.

## 3. Phase 2 — layered compositor (full-fps fidelity + long clips, only if Phase 1 too steppy)

- [ ] 3.1 At bake time, in addition to the static-chrome bake, measure the device-pixel rects of the animated layers (title strip content+container width, progress track/fill rect, time-text boxes) and the `MarqueeMetrics` + `duration` + base `currentTime` into a per-export descriptor.
- [ ] 3.2 Bake the static chrome with the animated regions excluded/cleared so the compositor owns them without double-draw.
- [ ] 3.3 Create a 2D `CanvasTexture` for the LCD plane; each frame draw the chrome, then the title strip translated by `translateX`, the progress fill at its width, and the time text (redrawn only on whole-second change); mark the texture dirty per frame. Never call `html-to-image` inside the frame loop.
- [ ] 3.4 Drive the compositor from the same Task 1.3 clip-`t` state so it is full-fps but identical in value to Phase 1.

## 4. Make the marquee animate in live preview

- [x] 4.1 In `components/ui/marquee-text.tsx`, drive the marquee during normal preview play (not only when `captureReady`) so `shouldAnimate` (`:80`) is true while the transport `isPlaying` and the text overflows.
- [x] 4.2 Ensure the preview marquee uses the same `getMarqueeFrame` source/timing as the export drive so preview and export stay phase-aligned at the same `t`.

## 5. Verify WYSIWYG + performance

- [ ] 5.1 Assert clip frames DIFFER across `t`: sample frames at several `t` values and confirm marquee offset, progress width, and time text change (guard against the frozen-screen regression).
- [ ] 5.2 Assert preview === export at the same playhead: scrub preview to `t`, export the same move/length, and confirm the exported frame at `t` matches the preview screen (marquee position, progress, time).
- [x] 5.3 Assert bounded export cost: full DOM rasterizations are decoupled from frame count (capped re-bakes in Phase 1, or a single chrome bake in Phase 2) — a 60s @ 30fps clip does NOT incur ~115ms-per-frame (≈1800 rasterizations).
