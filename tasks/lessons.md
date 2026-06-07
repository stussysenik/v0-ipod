# Lessons

## 2026-06-07 — /3d now-playing build

- **Deliver the headline; don't stop at a checkpoint when the core ask is unbuilt.**
  User asked for the 3D export (MP4/GIF) and I paused before building any export control.
  Rule: finish the thing the user actually asked to see before reporting "done"/checkpointing.
- **White means white.** Preloaded "White" finish used #E8E8E8 (silver) — user reads that as
  not-white. When a preset is named for a color, make it that color (true white ≈ #FFFFFF/#FAFAFA).
- **Principled subtraction applies to the 3D body too, not just UI.** Over-detailed physical
  bits (headphone-jack torus, hold switch) poked above the silhouette as artifacts ("fix this").
  Don't add hardware greebles that create nubs/noise. Keep the body clean unless asked.
- **Don't over-engineer the click wheel.** Glossy clearcoat + env reflections produced a bright
  halo ring around the center button — read as "too many complex things." Keep wheel surfaces
  matte and flat; one touch ring + one center, no specular drama.

## 2026-06-07 — /3d export (vertical IG still + clip)

- **The live screen/wheel are drei `Html` DOM portals — they never reach the WebGL framebuffer.**
  A `gl.render`/`captureStream` capture shows the device WITHOUT the now-playing UI. To bake them
  in, rasterize the DOM (`html-to-image`) and paint it onto an in-scene plane. The screen plane
  geometry (`screenW×screenH`) gives correct perspective for free; the wheel plane is
  `2·wheelOuterR` square (because `wheelHtmlPx·unit = 2·wheelOuterR`).
- **The `ScreenBezel` is a SOLID plate, larger than the screen, extruded forward.** The LCD plane
  sat behind its front face, so the baked screen rendered as the bezel color [~22,24,24] (it only
  "showed" in live view because the DOM portal floats over the whole canvas). Seat the baked plane
  IN FRONT of the bezel (between bezel front and glass). This was the multi-cycle bug — sample
  actual pixel colors to tell "occluded by X" from "material didn't apply."
- **`captureHighRes` must set `camera.aspect = width/height`.** It rendered to a square/vertical
  target while the camera kept the window's landscape aspect → the iPod was stretched. Restore
  aspect after.
- **PostProcessing `EffectComposer` runs with `gl.autoClear = false`,** so `setClearColor` does NOT
  paint the export background. Set `scene.background = new THREE.Color(bg)` instead — rendered by
  both the direct RT render and the composer — to bake the stage color (matches 2D PNG).
- **`next/dynamic` does not forward refs.** Expose the imperative handle via a plain `apiRef` prop
  in addition to `forwardRef` so the dynamically-imported canvas is reachable.
- **Imperative material swaps get clobbered by React reconciliation.** A `<primitive attach="material">`
  (or any `<meshXMaterial>` child) re-attaches on re-render mid-capture. Assign the material via a
  callback ref / imperatively and give the mesh NO material child, so the capture swap survives.
- **Browser-native canvas video is WebM only** (VP9/VP8); MP4/GIF needs a downstream transcode.
  Vertical clip = resize the live buffer (`gl.setSize(w,h,false)` + `cam.aspect`) so `captureStream`
  streams 9:16; leave OrbitRig driving the camera so it records the user's composed angle.

## 2026-06-07 — /3d cinematic clip (diagonal robo move + camera HUD)

- **Run `pnpm build` before claiming anything is done.** A ref mutated during render
  (`bgRef.current = x` at top level) passes type-check + dev (Fast Refresh) but FAILS
  `next build` via `react-hooks/refs`. User caught it with "it's not even building." Build,
  don't assume. (Fix: write the ref in a `useEffect`.)
- **In the offline clip loop, R3F resets `cam.aspect` back to the canvas mid-render.**
  The resize observer / drei `makeDefault` camera fires on the first event-loop yield
  (encoder backpressure ~frame 7) and clobbers the portrait aspect → the device re-frames
  mid-clip (a hard pop, broken loop seam). The camera *positions* were correct the whole
  time; only the *projection* was wrong. Fix: set `cam.aspect` + `updateProjectionMatrix()`
  EVERY frame inside the loop. (The one-shot still escapes this; a multi-frame loop doesn't.)
- **Debug by instrumentation, not by theory.** I shipped 3 plausible fixes (composer race,
  MSAA-resolve lag, frameloop pause) that all produced IDENTICAL failing numbers. Logging
  `camera.position` + a pixel checksum per frame found the truth in one run (pose fine,
  pixels jump at i=7 = projection reset). Instrument first when a fix doesn't move the metric.
- **Verify clips frame-by-frame with real metrics, not eyeballing.** ffmpeg
  `tblend=difference,signalstats` per-frame YAVG finds pops (spike = jump); SSIM(last,first)
  vs SSIM(adjacent) proves a loop is *continuous* (seam ≈ adjacent) vs a freeze/pop.
- **A seamless loop's last frame ≠ first frame — it's one motion-step before it** (`t=i/total`).
  Asserting SSIM(first,last) ≥ 0.97 is wrong; assert seam ≈ adjacent-frame SSIM instead.
## 2026-06-07 — /3d export "pop" (studio sweep + hero framing + lockable perspective)

- **Lazy-ref init must use `if (ref.current == null)`, never `if (!ref.current)`.** A bare
  `!ref.current` reads to the `react-hooks/refs` rule as an illegal render-time ref ACCESS and
  **fails `next build`** (passes type-check + dev). This is the same class as the `bgRef`
  lesson — and it was a pre-existing failure the prior "build ✓" claim missed. ALWAYS run a
  clean `pnpm build`, not just type-check/dev, before claiming green. The rule even prints the
  exact fix: the `== null` lazy-init idiom.
- **A horizontal contact shadow is invisible in a near-front shot — it needs a backdrop cove
  + camera elevation to read.** `<ContactShadows>` was already in the scene but the device
  still "floated," because a flat floor shadow seen edge-on contributes nothing. Grounding =
  a graduated **sweep behind** (drei `<Backdrop>`) so there's a surface, plus a hero angle
  with enough crane to actually see the floor. Sweep + shadow together, not either alone.
- **Make the studio sweep UNLIT (`meshBasicMaterial` + `toneMapped={false}`), not lit.** An
  env-lit white backdrop blows out to flat white under the env-first rig and the gradient
  vanishes; a baked radial-gradient texture is exactly predictable and WYSIWYG between live
  and export. The contact-shadow plane (separate) does the grounding; the sweep does the depth.
- **`setCameraGoal` no-ops until the OrbitRig registers — poll `getCameraPose()`, not the
  handle.** Restoring a persisted pose on load by firing `setCameraGoal` the instant
  `apiRef.current` exists silently misses: the handle mounts before the rig owns the camera, so
  the call hits a null `cameraApiRef` and the default pose wins. Poll until `getCameraPose()`
  returns non-null (rig live), THEN set the goal.

- **Click wheel is satin POLYCARBONATE, not the anodized face.** Earlier lesson said "keep
  matte/flat" — refined: it's a smooth satin plastic catching ONE soft broad sheen (low
  clearcoat + high clearcoatRoughness), and on a black body it's a distinct CHARCOAL, never
  pure black (floor over-dark derived colors or it vanishes into the face). Distinct material
  + distinct color = reads as its own part; dead-flat black does not.
