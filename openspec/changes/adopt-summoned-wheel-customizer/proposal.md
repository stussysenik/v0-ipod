# Change: The customizer is summoned at the pointer, not parked at the edges

## Why

The stage carries two permanent panels and the object sits between them. Every control is
present at all times, which is the opposite of the reading `shipped-surface-minimalism`
already ratifies — *the device is the product, no chrome restates it*. A surface that keeps
its whole vocabulary on screen has not decided what the work is.

The motion inspector is where the cost shows. To move the camera you pick a named move, then
shape it on a curve pad with two draggable handles, a repeat row, a length row, a style row, a
turnaround row, a transport, and a proof strip. That is an animation tool standing next to an
iPod. `add-motion-shape-authoring` proposed to grow it further — keyframe insertion, per-segment
curves, custom paths — which is five more controls answering a question the object could answer
by being thrown.

**The finding that makes this a deletion rather than a redesign:** a track edit is already three
scalars. `lib/motion/track-edit.ts` stores `TrackEdit = {gain, phase, curve}` and derives every
edit from the base rather than the previous edit. A throw produces exactly three numbers —
release speed, release angle, path curvature — so the gesture and the model are the same shape.
The curve pad is a second way to type in what the hand already said.

## What Changes

- **The stage is the object and nothing else.** No panel is parked. The ratified bottom bar of
  six named views (`camera-control-truth`) is the one permanent control and stays exactly as it is.
- **Chrome is summoned to the pointer.** Press and hold on the canvas blooms a radial wheel at the
  cursor carrying the top-level axes; flick toward one to drill in; release to commit. Holding is
  the novice path and the flick alone is the expert path — the same gesture, so nothing has to be
  unlearned (Kurtenbach & Buxton 1993). The wheel is the iPod's own input device pointed at itself.
- **Motion is authored by throwing the object.** Drag rotates (arcball); release with velocity
  turns the drag into a move. Speed sets `gain`, release angle sets `phase`, path curvature sets
  `curve`. No new persisted shape, no format change, no `FINGERPRINT_VERSION` bump.
- **The curve pad becomes a ghost arc.** At the moment of release the authored path draws once as
  a thin great-circle arc through the scene and fades over ~600ms. The graph still exists; it is
  shown in space, at the moment it is meant, instead of in a panel forever.
- **The arc takes a hand.** Held from the wheel's Motion branch, the arc stays instead of fading
  and its keyframes become beads on it: pull one and the route bends under a wrap-aware falloff,
  tap the line between two and a bead is placed there. That is custom-path authoring — the one
  capability the throw genuinely cannot reach — done in the space the move occupies rather than
  in a graph beside it. Placement is proven not to move a pixel by splitting the segment's ease
  exactly; a tool that bends the curve at the moment a point is added makes the author spend the
  next gesture correcting the tool.
- **The proof strip, shelf, transport and per-track rows move into the wheel's Motion branch**,
  reachable but not resident.
- **`add-motion-shape-authoring` is absorbed, not built.** Its D1 — "the trace becomes the
  editor" — is honoured here in three dimensions rather than two; its D2, D3 and D7 concern a
  stored spline that is not needed, because the six tracks already span every route through
  space. The reasoning is preserved in `design.md` D6.
- **WebGPU is ruled out for this change, with the condition that reopens it named** (`design.md`
  D7). The frame reading on the target machine has not been taken yet, and a renderer adopted to
  buy headroom before the deficit is measured is headroom used as a design input.

## Impact

- Affected specs: `floating-panel-system` (MODIFIED — panels do not float over `/3d`'s stage),
  `3d-control-surface` (MODIFIED — the control surface is summoned), `interaction-models`
  (MODIFIED — the Direct / iPod OS / Original choice moves into the wheel).
- Unaffected and deliberately so: `camera-control-truth` (the six-view bar survives untouched),
  `3d-export`, `3d-export-proof-cache`, the whole motion document format.
- Affected code: `components/ipod/scenes/ipod-3d-studio-cockpit.tsx`, `ipod-3d-lighting-cockpit.tsx`,
  `ipod-3d-stage.tsx`, `lib/motion/**` (read-only — no model change), new `lib/hud/**`, new
  `lib/theatre/bezier-split.ts`.
- Retires: `add-motion-shape-authoring`. Reshapes `add-motion-authoring-system` §6/§6b/§6c from a
  built inspector to engine-only, which releases three owner gates that were waiting on its look.
- Depends on: nothing. Blocks nothing.
