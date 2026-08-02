# Design — the wheel, the throw, and the ghost arc

## The one-line claim

The iPod's input device is a radial menu. The configurator for an iPod is therefore a radial
menu, summoned where the hand already is. Nothing else on the stage is permanent.

## D1 — Why radial, and why summoned

Pie menus beat linear menus on both time and error rate, and the reason is geometric: a wedge
is a direction rather than a distance, so its effective target width is unbounded and Fitts's
law stops charging for travel (Callahan, Hopkins, Weiser & Shneiderman, *An empirical comparison
of pie vs. linear menus*, CHI '88).

Marking menus close the gap between discovering the menu and being fast at it. Press and hold →
the wheel is drawn; press and flick → the same command fires with no wheel at all. The novice
and expert paths are the *same physical gesture*, so practice transfers instead of resetting
(Kurtenbach & Buxton, *The limits of expert performance using hierarchic marking menus*, CHI '93).
This is the mechanism that lets the surface satisfy pick-up-and-play with zero tutorial: the
tutorial is a slow version of the shortcut.

Summoning chrome to the cursor rather than parking it at the edge is the Toolglass reading —
the tool travels to the work, the work never travels to the tool (Bier, Stone, Pier, Buxton &
DeRose, *Toolglass and Magic Lenses*, SIGGRAPH '93).

**Constraint this creates.** Buxton's three-state model (*A three-state model of graphical
input*, GI '90) says a mouse has an out-of-range, a tracking and a dragging state, while a
finger has only two. Hold-to-summon and drag-to-orbit therefore begin identically on touch.
Disambiguation is by movement, not by time alone: a press that moves beyond ~8px before the
hold threshold is an orbit and can never become a wheel. Time-only disambiguation ships a
surface where every orbit starts with a flicker.

## D2 — The throw is the track edit

Six tracks exist: `azimuth`, `elevation`, `reach`, `targetX/Y/Z` (`lib/motion/track-edit.ts`).
The stored override is a whole `MotionTrack`; the *edit* is three scalars.

| Gesture | Reads | Writes |
|---|---|---|
| Drag horizontally | pointer Δx across the virtual sphere | `azimuth` |
| Drag vertically | pointer Δy across the virtual sphere | `elevation` |
| Wheel / pinch | scalar | `reach` |
| Two-finger drag / right-drag | pointer Δ in view plane | `targetX/Y/Z` |
| **Release with velocity** | \|v\| → `gain`, ∠v → `phase`, path curvature → `curve` | the move |

Rotation follows the virtual sphere rather than two independent Euler sliders, because the
virtual sphere was measured as the best 2D-device mapping for arbitrary 3D rotation (Chen,
Mountford & Sellen, *A study in interactive 3-D rotation using 2-D control devices*, SIGGRAPH '88)
and formalised as Arcball (Shoemake, *ARCBALL*, GI '92). Camera interpolation between poses stays
on great circles for the same reason it always has (Shoemake, *Animating rotation with quaternion
curves*, SIGGRAPH '85) — this is not new work, it is the existing pose path, unchanged.

**Why this deletes rather than adds.** `applyTrackEdit` already derives every edit from the
shipped base, never from the previous edit, so throwing the same object twice the same way
produces bit-identical tracks and no float drift. The gesture needs no model, no format change,
no `FINGERPRINT_VERSION` bump, and no keyframe editor. `add-motion-shape-authoring`'s D1 ("the
trace becomes the editor") is answered by there being no trace on screen; its D2 ("a path is a
view, not a store") is answered by the throw being the capture gesture it asked for; its D3 and
D7 concern a stored shape that no longer exists.

**What the gesture genuinely cannot reach**, stated rather than hidden: a move whose axes have
different cycle lengths, and a move authored to a numeric target ("exactly 45°"). Both stay
reachable in the wheel's Motion branch as typed values. If the owner finds a third, the ruling
is to add it to that branch, never to bring the curve pad back. The owner found a third — a
route the catalogue never drew — and D6 is where it went.

## D3 — The ghost arc replaces the curve pad

At release, the authored path draws once through the scene as a thin great-circle arc from the
release point, marks its own cycle, and fades over ~600ms. It is the same polyline the curve pad
was drawing — shown in space, at the moment it means something, then gone.

This is the feedback loop direct manipulation requires: continuous representation, physical
action, immediately visible effect (Shneiderman, *Direct manipulation: a step beyond programming
languages*, IEEE Computer '83). A panel that shows the curve permanently is not more feedback,
it is the same feedback detached from its cause.

**Cost ruling.** The arc is one dynamic line in the existing scene, not a new pass. The HUD
itself is DOM, not WebGL: text stays crisp at any DPR, costs no shader, and remains reachable
by a screen reader. It reads as spatial because it is *positioned* by projecting a 3D anchor to
screen space each frame and it takes its shadow direction from the key light. One projection per
frame is the whole trick — a rendered-in-scene HUD would buy a look and spend the byte and frame
budget `add-artifact-budget-gates` has not yet set, on the machine that counts (Intel UHD 620,
1080p).

## D4 — First contact, without a tutorial

`add-customize-walkthrough` owns sequencing and this change does not duplicate it. What is owned
here is the first *gesture*.

On a first visit the device is already performing its idle move. On the first pointer movement
the wheel ghosts in at low opacity under the cursor for one beat and settles out. It is drawn
once, ever, keyed off a `seen` flag in the workspace storage registry. Nothing is modal, nothing
must be dismissed, and the thing that appears is the thing that will appear again when asked for.

Self-revelation is the marking-menu property, not a bolted-on coach mark: the hint *is* the
control, at the position the control will occupy, responding to the gesture that summons it.

## D5 — What the surface looks like when idle

Object, centred, full bleed. The six-view bar at the bottom, ratified and unchanged. One
2D/3D pill. Nothing else. Values appear at the point of the gesture — 11px, monospaced digits,
in ~120ms, out ~400ms — and every one of them is a value, never a label explaining itself.

## D6 — The arc takes a hand, and that is the custom path

The third thing the throw cannot reach is a **route the catalogue never drew**: a pause on the
far side, a dip before the rise, a second approach. D2 ruled that a third goes into the Motion
branch and never into a curve pad. This is how it does both.

**Why it is a view request and not a feature request.** `azimuth`, `elevation` and `reach` about
`targetX/Y/Z` are spherical coordinates about a movable origin, so the six tracks already span
every route through space. Nothing about a custom path is unrepresentable; what was missing was
**keyframe placement and a picture**. Scaffolding a spline store would have shipped two encodings
of one path, which is the second-copy defect this project has now paid for six times.

**The mechanism.** The arc §4 already draws is held rather than faded when Motion → Shape is
engaged. Its knots — the union of every axis's keyframe positions — become beads on the line.
Pull a bead and neighbours follow under a raised cosine over `cycleDistance`, which measures
around the seam, so the closing knot and the opening knot are one point read twice and the loop
survives a pull with no special case. Tap the line between beads and a knot is placed there.
`lib/hud/motion-path.ts` is that model, and it stores nothing: a path is an edit over the base
document, exactly as `applyTrackEdit` is, so a drag out and back returns the original bytes and
`isPristineTrack` can still clear an override instead of storing a copy of the base.

**Placement moves no pixel, and that is the load-bearing claim.** Adding a control point is only
honest if adding it changes nothing; otherwise the author's next gesture corrects the tool rather
than the move. So the segment's ease is **split exactly** by de Casteljau subdivision
(`lib/theatre/bezier-split.ts`) rather than resampled. Measured over 128 phases at 15 insertion
positions on the shipped orbit: **2.60e-5 degrees of azimuth against a 17° amplitude**, 1.5e-6
relative. Reading `crane` as one arc costs the same order — 3.60e-5° — because its elevation is
keyframed at eighths while its other axes are at quarters, so the arc must place knots on them;
the other four catalogue moves keyframe every axis together and round-trip bit-identically. Both
readings are the shipped sampler's own 1e-6 x→t epsilon, not the split's, which inverts to 2^-40.

**One curve in the vocabulary cannot be cut, and it is not the one that looks it.** A subdivided
half of a monotone curve is still monotone, but its control polygon can carry an x outside
`[0,1]`, and `resolveEase` clamps x on every read. Measured across all 23 easings: only
`easeInOutExpo` fails, at **52 of 99 interior positions, by up to 0.089**, and clamping would have
shipped a silent **3.5e-2** reshape of the segment. `easeInOutCubic`, `easeInOutQuart` and
`easeInOutBack` have crossed handles too and split cleanly, so inspection would not have found
this. The ruling is to refuse the knot rather than take it and bend, and nothing outside
`easings.ts` authors that curve. It is also why the test asks at the quarter as well as the
midpoint: a symmetric curve cuts fine at its centre, so a gate that only asked at 0.5 would have
reported the curve splittable — the same defect class as the wheel-label contrast pair.

**Why this is not the curve pad returning.** The curve pad was a second coordinate system: a
graph of phase against value, beside the object, that the author had to map onto the motion in
their head. The arc is the object's own trajectory at 1:1 with the thing it moves. There are no
rows, no pad, no second space — the continuous representation, the physical action and the
immediately visible effect are all one surface (Shneiderman 1983), which is the same argument D3
made for showing the path in space rather than in a panel.

**Cost ruling.** The beads are points on the line §4 already spends; no new pass, no new material,
no second geometry. Holding the arc costs one polyline that was going to be drawn anyway, kept.

## D7 — Why not WebGPU

The ask is legitimate: a compute-shaded ribbon for the arc, a GPU-resident trail along the path,
order-independent transparency on the finish. `three` 0.182 ships the renderer, so this is a
choice rather than a limitation.

**It is ruled out for this change, on the project's own gate.** Two numbers gate the artifact —
bytes over the wire for one route, and frames per second on Intel UHD 620 at 1080p — and §7.2,
the first reading on that machine, **has not been taken**. Adopting a renderer to buy headroom
before the deficit is measured is headroom used as a design input, which is named as a defect
rather than a trade.

**What it would actually cost today**, since "three ships it" understates the work:
`@react-three/postprocessing` and `@theatre/r3f` both bind the `WebGLRenderer`, so the swap is
not a flag — it forks the effect chain and the keyframe bridge, and the keyframe bridge is the
parity oracle the export path is pinned to. That is a change proposal of its own, not a bullet in
this one.

**What reopens it**, stated so the decision is falsifiable rather than permanent: §7.2 reads below
60fps on Intel UHD 620 at 1080p with the wheel summoned during an authored move, **and** a profile
attributes the deficit to draw-call or shader cost rather than to DOM layout. The second half is
not a formality — D3 ruled the HUD is DOM, and a DOM-bound deficit is one a renderer swap does not
touch. The arc and its beads are deliberately cheap for the same reason: the reading should be
about the object, not about the tool measuring it.

## Sources

- Callahan, Hopkins, Weiser & Shneiderman (1988). *An empirical comparison of pie vs. linear menus.* CHI.
- Kurtenbach & Buxton (1993). *The limits of expert performance using hierarchic marking menus.* CHI.
- Bier, Stone, Pier, Buxton & DeRose (1993). *Toolglass and Magic Lenses.* SIGGRAPH.
- Buxton (1990). *A three-state model of graphical input.* Graphics Interface / INTERACT.
- Chen, Mountford & Sellen (1988). *A study in interactive 3-D rotation using 2-D control devices.* SIGGRAPH.
- Shoemake (1992). *ARCBALL: a user interface for specifying 3D orientation using a mouse.* Graphics Interface.
- Shoemake (1985). *Animating rotation with quaternion curves.* SIGGRAPH.
- Shneiderman (1983). *Direct manipulation: a step beyond programming languages.* IEEE Computer.
- Hinckley, Pausch, Goble & Kassell (1994). *A survey of design issues in spatial input.* UIST.
