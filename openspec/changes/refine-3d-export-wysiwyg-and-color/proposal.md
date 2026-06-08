# Change: WYSIWYG 3D Export, Absolute Colour Precision, and Control Focus

## Why

The `/3d` studio (delivered under `add-3d-studio-control-suite`) shipped a working export
pipeline, but live iteration surfaced four classes of defect that make exports read as a
"render," not the clean product artifact `/3d` promises — and that break the WYSIWYG
contract between the live preview and the exported file:

1. **Backdrop competes with the subject.** The studio sweep was a *radial gradient* fixed
   in world space, so the moment the camera moves the device slides across a varying
   field — the loop reads inconsistent and the falloff fights the Now Playing screen for
   the eye. Exports were not neutral.
2. **Colour is not faithful.** Picking `#FFFFFF` or `#000000` produced **gray**: the
   click wheel ran through a luminance floor that lerped dark picks toward white; the
   face/back used metalness + high `envMapIntensity` so the metal mirrored the gray studio
   env instead of showing the chosen albedo; and an ACES tone curve rolled off the
   extremes. On a light/white finish, auto-darkened seams/grooves read as stark "doodle"
   outlines.
3. **Export did not match the preview.** A post-processing **vignette** was baked into
   every export (darkening the corners of the "uniform" field), and an ambient `<Float>`
   bob froze at a *random* phase during the offline (frameloop-paused) capture — baking a
   stray tilt the live preview never showed, so no two exports (and no export vs preview)
   agreed.
4. **Controls lack focus priority and responsiveness.** The HUD panels do not reliably
   sit above the iPod canvas, and at narrow widths the surface can overlap/overwhelm
   rather than use the available space — it can feel unusable.

Several fixes already landed during live verification (items 1–3 implementation); this
proposal ratifies them as requirements, and scopes the remaining motion/export/control
work so we stop carrying it in conversation context.

## What Changes

- **Neutral, uniform field** — the studio backdrop becomes a FLAT, unlit, Stage-colour
  field (no radial gradient), constant every frame so the device reads identically through
  any move and exports land neutral. *(Landed; ratified here.)*
- **Absolute per-surface colour precision** — every surface (face, wheel ring, centre,
  well floor, back, bezel) renders its picked hex faithfully: true `#000000` and
  `#FFFFFF` are achievable. Remove the wheel luminance floor and the well-floor darkening
  tint; make materials albedo-dominant (low metalness/env); render with **NoToneMapping**
  so the chosen colour survives to the pixel. Natural form-shading on turned-away faces is
  expected and is not "graying." *(Largely landed; ratified + extended to any remaining
  auto-tint lines on the white theme.)*
- **WYSIWYG export = live preview** — exports reproduce the live view exactly: same
  NoToneMapping + sRGB, **no vignette**, same flat field, and **deterministic capture**
  (no ambient Float frozen at a random phase). The clip camera, colours, and the loop
  seam match the preview at the same playhead position. *(Landed; ratified.)*
- **Boomerang loop + motion speed** — the loop plays as a seam-free **boomerang**
  (ping-pong) and the motion **speed** is user-settable, applied identically in the live
  preview and the export. *(Pending.)*
- **Custom-angle / motion-free export** — any landed camera pose can be saved as a
  reusable preset and exported (still or clip) with **no motion preset** applied — exports
  are not bound only to the motion moves. *(Pending.)*
- **Control focus + responsiveness** — the control surface renders **above** the iPod
  canvas (clear z-order / focus priority), and the layout is **non-overlapping, fluid, and
  web-responsive** at every width so it uses the shown space and never feels unusable.
  *(Pending.)*

## Impact

- Affected specs (deltas in this change): `3d-export`, `3d-product-fidelity`,
  `3d-control-surface`.
- Affected code: `components/three/three-d-ipod.tsx` (materials, capture, Float removal,
  renderer tonemapping), `components/three/studio-lighting.tsx` (flat backdrop),
  `lib/three-color-resolve.ts` (vignette removed from resolve), `components/three/post-processing.tsx`
  (removed), `lib/studio-camera.ts` (boomerang + speed), `components/ipod/scenes/ipod-3d-stage.tsx`
  and `ipod-3d-export-dock.tsx` (speed control, static/custom-angle export, z-order/responsive HUD).
- WYSIWYG and colour are user-visible behaviour changes; no data migrations.
