# The `/3d` Studio System

The `/3d` route is a real-time product studio for the iPod classic: a physically-modelled 3D
device you light, colour, frame, and export. This document is the single reference for the
four subsystems that make it work — the **marquee**, the **lighting rig**, the **technical
(lights-off) view**, and the **interaction/lock** model — plus the **mechanical-design
vocabulary** the geometry is written in and the **persistence** that makes it all survive a
refresh.

Everything here is deterministic by value: the same numbers drive the live canvas and the
WYSIWYG export, and every control persists to `localStorage`.

---

## 1. Marquee — the scrolling track text

The marquee is the scrolling-text animation on an overflowing track title/artist/album, just
like a real iPod's now-playing screen.

- **Engine:** `components/ui/marquee-text.tsx` (a `requestAnimationFrame` translateX loop with
  an edge-fade mask) + the timing in `lib/marquee.ts` (start delay → scroll → end pause; or a
  seamless loop; with a per-field stagger).
- **It was missing in 3D.** The engine always existed, but `ipod-3d-stage.tsx` rendered
  `<IpodScreen>` **without** the `animateText` prop, so the device's text never scrolled in the
  live 3D view — it only un-froze during export baking. The fix is one prop:

```
// ipod-3d-stage.tsx → the screen passed into the 3D device
<IpodScreen
  animateText={studio.marquee}          // ← revives the marquee live in 3D
  isEditable={!studio.interactionLocked} // ← presentation lock
  ... />
```

`animateText` makes `EditableText` set both `animate` and `preview`, so `MarqueeText` scrolls.
Toggle it from **Studio cockpit → Marquee**. Persisted in `studio.marquee` (default on).

```
pseudocode  marqueeFrame(text, elapsed):
    if contentWidth <= containerWidth: return static   // no overflow, no scroll
    after START_DELAY: translateX = -speed * (elapsed - START_DELAY)
    at end: hold END_PAUSE, then reset to 0 (mode "reset") or wrap seamlessly (mode "loop")
```

---

## 2. Lighting — env-first, data-driven, deterministic

The device's shells and wheel are **dyed metal** (metalness ≈ 1.0). A metal has almost no
diffuse colour of its own; what you see is `albedo × environment`. So brightness comes **first**
from the surrounding studio (the env softboxes), and the three hard spots (key/fill/rim) only
*shape* — they never floodlight.

- **Data:** `lib/studio-lighting-config.ts` is framework-free. `StudioLightingConfig` is the
  single record that the persisted model, the cockpit, and `<StudioLighting>` all read.
- **Default rig:** `APPLE_PRODUCT_RIG`. **Cockpit:** `ipod-3d-lighting-cockpit.tsx` — precise
  dials per light (colour, intensity, position X/Y/Z, cone angle, softness) + env (preset,
  intensity, blur). Every dial dispatches `PATCH_LIGHT` / `PATCH_AMBIENT` / `PATCH_ENV`.
- **Rig presets (the range):** `RIG_PRESETS` — one tap from clean **Apple** to moody
  **Designer Dark** (low-key warm key + hard cool rim + a near-black stage). A preset can set
  the Stage colour too, so it lands the whole look at once.
- **Ranges are wide on purpose:** env intensity 0–5, ambient 0–3, spot intensity 0–600,
  position ±30 — room to push to extremes.

```
pseudocode  surfaceColour(pixel):
    reflected = sample(environment, reflect(viewDir, normal))  // the softbox wall it mirrors
    shaped    = Σ spot_i.contribution(pixel)                    // key + fill + rim kickers
    return toneMap(albedo * reflected + shaped)                 // toneMap = NoToneMapping → literal
```

---

## 3. Technical view ("Lights Off") — and the colour-fidelity exception

The **Lights Off / Technical** toggle is a flat, unlit CAD view: no reflections, no shadows,
the device rendered as its true finish colour.

Because the device is real metal (metalness ≈ 1.0), you **cannot** get a flat true-colour view
just by dimming the lights — kill the env and pure metal goes black. So the flat view is an
honest **material swap**, not a rig change: each surface renders as an unlit `meshBasicMaterial`
of its exact hex (`FlatFinish` in `three-d-ipod.tsx`), routed through a React context so the
four geometry components opt in with one `useTechnicalFlat()` line.

> **EXCEPTION — colour fidelity over physical correctness.** This is the one place the
> designer's hex is *sacred*: **black must be black, white must be white.** We guarantee it by
> bypassing the whole light/colour pipeline — `meshBasicMaterial` (unlit), `toneMapped={false}`
> (no tone curve), the canvas's `NoToneMapping` + sRGB round-trip (loss-free), and **no**
> luminance floor or saturation clamp (those would drift `#000000` toward grey). Do **not**
> "fix" it to react to lights — that would defeat the colour-true view.

So: **Lights On** = physically-lit (a lit `#000000` reads as dark graphite, correct physics);
**Lights Off** = the hex-true reference (the value you typed, verbatim).

---

## 4. Interaction & Lock

`ipod-3d-studio-cockpit.tsx` brings the 2D workbench's controls to 3D (which is why composing
in 3D used to feel "stuck"):

- **Interaction mode** — Direct ↔ iPod OS ↔ Original, the exact same models as 2D via the
  shared `SET_INTERACTION_MODEL` reducer action (one source of truth).
- **Lock** — freezes inline editing into a clean screenshot/export state (`isEditable=false`).
  Distinct from the **camera lock** (which freezes the *angle*; persisted via `LOCKED_POSE_KEY`).

---

## 5. Mechanical-design vocabulary

The geometry in `three-d-ipod.tsx` is written like a drawing. Dimensions come from real iPod
measurements (`lib/ipod-3d-dimensions.ts`, mm → world units); the `MECHANICAL` block names the
edge breaks and fits:

- **Datums** — DATUM A is the front face plane (`z = +depth/2`); every `zLayers()` offset is a
  signed distance from it. DATUM B is the wheel-bore axis; the touch ring, select button, and
  the bore cut in the face are all **concentric** to it.
- **Edge breaks** — `FILLET` (rounded: the steel back's roll-over) vs `CHAMFER` (flat angled:
  the crisp hairline around the screen aperture and wheel bore). Kept to a true fraction of
  body depth so the silhouette doesn't balloon into a fat chrome band.
- **Fits** — apertures are cut with a **clearance fit** (opened slightly larger than the part
  that seats in them).
- **Finish** — the face is **anodized aluminium**: a dyed dielectric over metal (albedo-true
  colour under a thin clearcoat), not a chromed mirror.

```
pseudocode  buildFace():
    sketch  = roundedRect(faceOutline) on DATUM A
    sketch -= roundedRect(screenAperture + CLEARANCE)
    sketch -= circle(wheelBore + CLEARANCE) about DATUM B
    solid   = extrude(sketch, FACE_PLATE_DEPTH)
    solid   = chamfer(solid.edges, FACE_CHAMFER)
    seat(solid, at = DATUM A − parting_seam)
```

---

## 6. Persistence — refresh-resistant

All studio state lives in the `studio` slice of `IpodWorkbenchModel`
(`lib/ipod-state/model.ts`): `{ lighting, technicalFlat, interactionLocked, marquee }`.

- The stage persists the whole model on every change (`saveWorkbenchModel`); the `studio` slice
  rides its **own** `localStorage` key (`ipodSnapshotStudio`) with a tolerant validator
  (`sanitizeLightingConfig`), so a corrupt/old blob can never render black or crash — it falls
  back to the Apple defaults.
- `loadWorkbenchModel()` hydrates `studio` on init, so lighting, the lights-off toggle, the
  interaction mode, the lock, and the marquee toggle all survive a reload.
- **Camera framing** survives separately, by design, through the camera-lock persistence
  (`LOCKED_POSE_KEY`) — it deliberately does **not** live in the studio slice.

> Known pre-existing note: because the persisted model is read inside `useReducer`'s init, the
> first client render can differ from SSR (a benign hydration warning that React self-recovers).
> This predates the studio slice; the clean fix is to init with defaults and hydrate via
> `RESTORE_MODEL` in an effect.

---

## File map

| Concern | File |
|---|---|
| Lighting data (rigs, presets, validator) | `lib/studio-lighting-config.ts` |
| Lighting render | `components/three/studio-lighting.tsx` |
| Device geometry + materials + flat swap | `components/three/three-d-ipod.tsx` |
| Studio state slice + actions | `lib/ipod-state/model.ts`, `update.ts` |
| Studio persistence | `lib/ipod-state/storage.ts` |
| Lighting cockpit | `components/ipod/scenes/ipod-3d-lighting-cockpit.tsx` |
| Interaction/lock/marquee cockpit | `components/ipod/scenes/ipod-3d-studio-cockpit.tsx` |
| Marquee engine | `components/ui/marquee-text.tsx`, `lib/marquee.ts` |
| Stage (wires it all) | `components/ipod/scenes/ipod-3d-stage.tsx` |
