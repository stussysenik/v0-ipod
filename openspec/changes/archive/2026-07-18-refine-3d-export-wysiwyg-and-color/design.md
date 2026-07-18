# Design Notes

## Colour pipeline: NoToneMapping, not ACES
The composer previously forced `NoToneMapping` while mounted, so the *effective* live look
was already untonemapped. Setting `toneMapping: NoToneMapping` directly on the renderer and
deleting the `EffectComposer` therefore preserves the exact look while removing a whole
layer (the "too much code"), the vignette, and the need to keep vignette uniforms in
lockstep across `post-processing.tsx` and `ColorResolvePass`. A filmic curve (ACES) is
deliberately rejected: it rolls off and desaturates the extremes, so `#FFF`/`#000` would
never be true — the opposite of the colour-precision requirement. The export resolve pass
is now a straight linear → sRGB encode, matching the live canvas (which encodes sRGB via
`outputColorSpace`).

## WYSIWYG parity proof
The live preview rig and the offline clip render call the **same** `poseForMove(...)` math
on the **same** anchor, at the **same** FOV (32). Instrumented verification confirmed: at
t=0.5 both report azimuth 14.5°, elevation 5.25°, reach 12.55, FOV 32 — byte-identical. The
only legitimate divergence is output aspect vs current viewport aspect (responsive reach
differs across aspects). The earlier perceived "mismatch" was an artifact of comparing a
landscape live view against a portrait export. A future refinement (out of scope here) is
to letterbox the live preview to the selected export aspect for true visual parity.

## Determinism: drop ambient Float
`<Float>` applied a continuous bob inside the model group. During offline capture the
frameloop is paused (`setFrameloop("never")`), so Float froze at whatever random phase it
held — baking a stray tilt the preview never showed and making exports non-deterministic.
`snapToRest()` only zeroed the *outer* group, not Float. Removing the ambient Float makes
the device rest dead-still and capture deterministic; the one-shot `settle` drop still
gives life on load/finish change, and the camera move supplies any intentional motion.

## Backdrop: flat unlit field
An unlit `meshBasicMaterial` on the cove geometry renders every pixel the exact Stage
colour regardless of curvature or camera angle — definitionally uniform — so it cannot
compete with the subject during motion. Grounding is delegated to the existing
`ContactShadows` catcher, which stays stable because the device is stationary while the
camera orbits.

## Material fidelity vs metallic realism (trade-off)
Lowering metalness/`envMapIntensity` on the face and back trades some mirror-steel realism
for faithful albedo (true black/white). This is the explicit user priority: absolute
colour control over photoreal metal. A future per-finish material mode (e.g. a "polished
steel" toggle that re-introduces metalness for steel picks) could restore the mirror look
without sacrificing colour precision, but is out of scope for this change.

## Control focus (z-order)
The control surface must layer above the transparent R3F canvas. The canvas is
`absolute inset-0`; control groups must sit at a higher stacking context with their own
pointer-event ownership, while the canvas keeps drag-to-orbit only where no control
overlaps. This is a layering/responsiveness change, not a re-architecture of the controls.
