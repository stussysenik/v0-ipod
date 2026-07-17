# Change: Render-fidelity launch gate — screen integration, dark-finish response, shaped light

## Why

The mobile screenshot (`iPod · 3D Focus 2.jpeg`, 2026-07) is the signal: on a black
iPod at the hero ¾ pose the render fails the exact audience the product courts —
people who judge hardware renders for a living.

Three defects, all visible in one frame:

1. **The screen is a sticker.** The live Now Playing screen is a DOM `<Html>` portal
   floating over the canvas (`three-d-ipod.tsx` ~1481). The WebGL glass plane sits
   *behind* it in stacking order, so the screen gets no glass sweep, no bezel recess
   shadow, no lighting response — a flat white rectangle pasted on a rotated body.
   A green specular haze leaks around its top edge where the WebGL layer (glass/bezel
   catching a Lightformer) shows past the DOM overlay: two renderers disagreeing in
   public.
2. **Black reads as void.** Face plastic ships `envMapIntensity 0.16`, the wheel
   `metalness 0 / roughness 0.62`. On a black finish those return almost nothing, so
   the click wheel — the product's icon — disappears into the housing. Real hardware
   separates acrylic wheel, polycarbonate face, and touch ring by *specular
   signature*, even at #111.
3. **Light has no shape.** The rig is deterministic and dial-driven (correct), but one
   global softbox arrangement serves every camera pose. Product photography designs
   lights in reflection space: a long softbox is placed so its reflection draws one
   continuous highlight along the chamfer being described. Camera poses are already
   first-class data (`studio-camera-poses.ts`); their light compositions are not.

This is the launch gate for public/ProductHunt: the pixel is the product's resume.
The determinism/test substrate underneath is already strong — this change points that
same rigor at the image itself, and adds nothing else.

## What Changes

- **Color pipeline (first — everything downstream is tuned against it)**: replace
  `NoToneMapping` with Khronos PBR Neutral (`THREE.NeutralToneMapping`, present in
  the installed three r182). Neutral was designed for product configurators: colors
  below linear peak 0.76 pass through identically (WYSIWYG preserved, now as a
  tested guarantee instead of an implicit one), highlights roll off instead of
  clipping. Centralize the device-render color path: manifest → materials → export
  through one resolve, CPU-tested (the formula is closed-form and portable).
- **Screen integration**: eliminate the cross-layer bleed; give the LCD a bezel
  recess (inner shadow) and a glass treatment that appears *over* the live screen,
  matched between live view and export.
- **Finish material response**: a finish-aware material table so dark finishes keep
  wheel/face/ring separation and every finish clears a minimum env-response floor.
- **Shaped light compositions**: named, per-camera-pose softbox compositions as pure
  data alongside the existing dials — selection is a pure function of (pose, dials).
  Highlight continuity along fillets/chamfers becomes an acceptance criterion (this
  also covers the "optical flaws in lines": banding highlights are either coarse
  fillet segments or badly shaped env — the requirement states the observable).
- **Launch readiness**: a golden-pose × finish visual checklist that must pass in a
  dedicated visual session before the public link ships.

## Non-Goals

- No new customizer features, controls, or surfaces (other active changes own those).
- No transmission/refraction passes or per-frame env re-render — determinism and the
  frame budget stay untouched.
- No adoption of the DialKit library — the existing cockpit is the dial system; this
  change only extends its data model.

## Impact

- Affected specs: `3d-color-pipeline` (new), `3d-screen-integration` (new),
  `3d-finish-material-response` (new), `3d-shaped-light-compositions` (new),
  `launch-readiness` (extends the capability introduced in `unify-experience-truth`)
- Affected code: `components/three/three-d-ipod.tsx` (screen stack, materials),
  `lib/studio-lighting-config.ts` (+ per-pose compositions),
  `lib/studio-camera-poses.ts` (pose keys referenced by compositions),
  `components/ipod/scenes/ipod-3d-lighting-cockpit.tsx` (composition dial)
- Verification: unit tests on the pure data (finish table, composition selection);
  visual confirmation deferred to an explicitly-requested dedicated session per the
  project's testing cadence
