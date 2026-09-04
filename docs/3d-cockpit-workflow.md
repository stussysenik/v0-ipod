# The `/3d` Cockpit Workflow — edit the live scene in context

The `/3d` studio is built to be **edited, not coded**: every property that reaches the
live canvas is exposed as a semantic Tailwind control in a cockpit panel, and every change
is deterministic by value (the same numbers drive the preview and the WYSIWYG export) and
persists to `localStorage`. This is the same "select the thing, tweak its props, see it live"
loop Onlook gives a web app — here it's the native authoring model, spread across four
dockable panels plus an on-canvas gizmo. This document is the single reference for that
end-to-end workflow.

The panels are independent and composable — open any subset, in any order. The sections
below follow the natural authoring arc: **frame → finish → light → move → export**.

---

## 1. Frame — compose the shot

Set the camera angle and the device's orientation.

- **Orientation snaps** — `Ipod3DStudioShots` (bottom dock): **Product / Front / Back** jump the
  orbit to a named hero angle. These are the same focus presets the 2D workbench uses.
- **Free orbit** — drag on the canvas to azimuth/elevation; scroll to dolly. The custom
  `OrbitRig` eases toward the goal pose every frame, so a snap or a saved-shot recall never
  snaps the camera — it flies.
- **Saved studio shots** — `＋ Shot` bundles the current camera pose + every finish colour
  into one persisted `StudioShot` (right-click a shot pill to delete). Tapping a pill
  repaints the body *and* flies the camera, so a recalled shot lands as one composed look.
  Persisted under `SHOTS_STORAGE_KEY`.

```
pseudocode  recallShot(shot):
    dispatch each colour → repaint the six body zones
    api.setCameraGoal(shot.pose) → orbit eases to the angle
    // both land together; the rig closes on the pose, no snap
```

---

## 2. Finish — paint the six body zones

The device's skin, ring, center button, back, edge, and bezel are each a discrete colour
zone, edited from the **Finish** cockpit (the 2D workbench's colour panel, carried to 3D).
Every zone dispatches a `SET_*_COLOR` action; the geometry reads the colours from the
persisted `presentation` slice, so a body repaint is instant and survives a reload.

> **Colour fidelity is sacred** (see `3d-studio-system.md` §3): the hex you type is the hex
> you get. The only exception is the **Lights Off / Technical** view, which swaps the metal
> for an unlit `meshBasicMaterial` of the exact hex — a true-colour reference, not a rig
> dimming.

---

## 3. Light — rig, presets, and the keyframed cue

Lighting is edited two complementary ways; they layer, they don't fight.

### 3a. The absolute rig (persistent)

`Ipod3DLightingCockpit` owns the **absolute** per-light values — the `StudioLightingConfig`
record that is the single source of truth for the render:

- **Rig presets** — one tap from clean **Apple** to moody **Designer Dark** / **Edge Noir** /
  **Natural Light** (`RIG_PRESETS`). A preset can also set the Stage colour, landing a whole
  look at once.
- **Per-light dials** — colour, intensity, position X/Y/Z, cone angle, softness for the
  ambient + key/fill/rim spots; env preset, intensity, blur, and the softbox panels. Every
  dial dispatches `PATCH_LIGHT` / `PATCH_AMBIENT` / `PATCH_ENV`.
- **Back finish** — the steel back's roughness, independent of the rig.

These values persist in the `studio.lighting` slice and survive a reload via
`sanitizeLightingConfig`.

### 3b. Relative multipliers (ephemeral)

Two transient layers sit **on top** of the rig, both writing the same five-channel
`lightingMultipliersStore` (`ambient / key / fill / rim / env`) that `<StudioLighting>` reads.
They default to identity (1), so production output — where neither layer mounts — is
bit-identical to the rig:

- **Dev scratchpad** (`LevaScratchpad`, dev-only) — throwaway "what if everything were 20%
  brighter" dials for rapid look experimentation. Mounted behind a static `NODE_ENV` gate +
  `next/dynamic`, so Leva never enters the production bundle (0 KB shipped).
- **The keyframed lighting cue** (Theatre moment cards) — a clip can carry a *lighting move*
  alongside its camera move. A second Theatre object (`'Rig'`) on the same `'Camera'` sheet
  authors the five multipliers as keyframe tracks; during preview + export the cue is sampled
  per-frame and pushed to the store, so a card previews and exports its authored **look**, not
  just its framing. Cards that omit lighting hold steady at the rig's intensity.

```
pseudocode  finalIntensity(channel):
    rig      = studio.lighting[channel].intensity   // absolute, persistent
    relative = lightingMultipliersStore.get()[channel]  // 1 unless a cue/dial moves it
    return rig * relative
```

> **Why two layers?** The rig is the *designed* look (persistent, WYSIWYG with export). The
> multiplier store is the *experiment* layer — a scratchpad for "try it brighter" and a
> timeline for "breathe the rim across the move." Keeping them as a multiply keeps each
> honest: reset the store and you're back to the authored rig, guaranteed.

---

## 4. Move — pick, preview, and keyframe the motion

Motion lives in the **Export** dock's **Preview** section (`Ipod3DExportDock`).

- **Move picker** — the procedural moves (orbit, turntable, …) plus, when the dev
  **Theatre timeline** toggle is on, the Theatre moment cards (flagged with a `·` prefix).
  A card is both a camera move and, optionally, a lighting cue.
- **Style** — `loop / boomerang / hold`. `hold` freezes the composed angle for a still.
- **Transport** — scrub the playhead or play live. The `OrbitRig` flies the move directly
  off the clip sampler, so what's on screen **is** what the clip exports (same sampler, same
  cadence, same hero anchor). A scrubber syncs back to the transport at ~15 Hz.

### Authoring a move (dev)

The **Theatre timeline** toggle opens the `@theatre/studio` overlay, where a designer
keyframes the camera (`'Lens'` object) and — now — the lighting cue (`'Rig'` object) on the
same sheet. The authored state exports to JSON and drops into the moment-card catalogue,
read back by the pure `keyframe-sampler` (proven identical to `@theatre/core` by the parity
test). Studio is dev-only and dynamically imported, so it never ships.

---

## 5. Select & transform — the on-canvas gizmo

With the **Scene Inspector** open, clicking any object in the scene selects it and mounts a
`TransformControls` gizmo (`SelectionGizmo`) bound to it:

- **Modes** — a segmented **Move / Rotate / Scale** toggle in the inspector panel switches
  the gizmo. The gizmo only appears when something is selected.
- **Orbit coexistence** — the gizmo sets a `gizmoDragging` flag on `inspectorStore` while a
  handle is active; the `OrbitRig` yields to it (no orbit/zoom mid-drag), mirroring the
  existing `lockedRef` pattern.

---

## 6. Export — bake the exact loop you see

The **Export** dock renders the composed scene to PNG (still) or MP4/GIF (clip) through the
same `OrbitRig` + `StudioLighting` path the live view uses, so the export is WYSIWYG:

- **Still** — the current composed frame at the chosen aspect.
- **Clip** — the selected move, repeated a whole number of times at its natural cycle (a
  60s turntable spins ~10×, not one sluggish turn) so any length keeps a crisp cadence while
  closing on the hero seam. `speed` and `loop`/`boomerang` enter exactly as they do in the
  preview. The lighting cue is baked in lockstep with the camera, so a clip exports its
  authored look.

```
pseudocode  bakeFrame(i, total):
    progress = i / total
    phase    = phaseForProgress(progress, cycles, loop)
    pose     = sampleClipPose(phase)        // camera
    lighting.setAll(sampleClipLighting(phase))  // cue, identity if none
    camera.position = poseToPosition(pose)
    gl.render(scene, camera)
    resolveLinearToSrgb(gl, renderTarget, buffer)
```

---

## File map

| Concern | File |
|---|---|
| Studio cockpit (interaction / lock / marquee / toggles) | `components/ipod/scenes/ipod-3d-studio-cockpit.tsx` |
| Lighting cockpit (rig + presets + per-light dials) | `components/ipod/scenes/ipod-3d-lighting-cockpit.tsx` |
| Studio shots dock (orientation + saved shots) | `components/ipod/scenes/ipod-3d-studio-shots.tsx` |
| Export dock (preview / move picker / transport / bake) | `components/ipod/scenes/ipod-3d-export-dock.tsx` |
| Selection gizmo | `components/three/scene-inspector/SelectionGizmo.tsx` |
| Inspector panel (transform modes) | `components/three/scene-inspector/SceneInspectorPanel.tsx` |
| Dev lighting scratchpad | `components/three/scene-inspector/LevaScratchpad.tsx` |
| Lighting multiplier store | `components/three/scene-inspector/lighting-multipliers.tsx` |
| Lighting render | `components/three/studio-lighting.tsx` |
| Orbit rig (preview + gizmo coexistence) | `components/three/three-d-ipod.tsx` |
| Clip pose + lighting samplers | `lib/studio-clip.ts` |
| Theatre project/lighting object layout | `lib/theatre/studio-project.ts`, `theatre-runtime.ts` |
| Moment cards (camera + lighting keyframes) | `lib/theatre/motion-presets.ts` |
| Pure keyframe sampler | `lib/theatre/keyframe-sampler.ts` |
| Stage (wires every panel) | `components/ipod/scenes/ipod-3d-stage.tsx` |
