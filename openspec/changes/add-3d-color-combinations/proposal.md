# Change: Curated Color Combinations Beside the Per-Part Controls

## Why

The `/3d` color cockpit (delivered under `add-3d-studio-control-suite`, refined by
`refine-3d-export-wysiwyg-and-color`) gives every body part its own row with an absolute,
faithful hex picker — Case, Wheel, Center, Back, Bezel, Stage. That precision is the point,
but it pushes all the *relationship* work onto the user: nothing in the per-part rows tells
you which shades sit logically next to your current palette, and the coordinated full-device
"Looks" live in a separate strip lower in the card, disconnected from the part you are
actually recoloring. The result is that individual picks drift out of harmony with the rest
of the device, and the curated combinations feel like a different tool than the precise
controls right above them.

We want the harmonious choice to be the *nearby* choice: surface logically-related shades
right where you recolor a part, and surface full-device coordinated palettes in proximity to
the controls — both derived from the same harmony logic that already keeps the wheel coherent
with the case (`deriveWheelColors` in `lib/color-manifest.ts`).

## What Changes

- **Per-part inline "related shades"** — under each recolorable part row (Case, Wheel,
  Center, Back, Bezel), render a small strip of harmonious shade suggestions derived from the
  current palette. Tapping a swatch sets ONLY that part, so a single part can be nudged into
  a logically related tone without disturbing the rest of the device. Suggestions for the
  Wheel/Center reuse the existing `deriveWheelColors` recession ladder; suggestions for
  Case/Back/Bezel reuse the same analogous-hue + lightness-separation harmony used by
  `randomCompatibleLook`.
- **Coordinated "Combinations" strip near the controls** — add a Combinations strip
  positioned in proximity to the per-part rows (not buried below the helper actions). Each
  chip previews the FULL device palette as mini color dots (case + wheel + center + back +
  bezel), so the relationship between parts is visible before you commit. Tapping a chip
  applies ALL parts together as one coherent look (the wheel/center re-derived from the case)
  so the device stays a single object.
- **Harmony / relationship logic** — both surfaces draw from one shared, deterministic
  harmony helper so suggestions and combinations are logically connected (shared/analogous
  hue, controlled lightness separation, dark bezel grounding, stage chosen to separate the
  silhouette). The same input palette always yields the same suggestions (no per-render
  randomness for the inline strips).
- **Placement in proximity to controls** — the related-shade strips sit directly beneath
  their owning part row, and the Combinations strip sits adjacent to the per-part rows, so
  related and coordinated choices read as part of the same control cluster, not a separate
  section.

No data migrations; the existing `SET_*_COLOR` actions and `IpodPresentationState` are reused
unchanged. This is additive UI plus a shared harmony helper.

## Impact

- Affected specs (deltas in this change): `3d-control-surface`.
- Affected code:
  - `components/ipod/scenes/ipod-3d-color-cockpit.tsx` — add per-part related-shade strips
    under `PARTS` rows; add the coordinated Combinations strip in proximity to the rows;
    reuse `applyLook` / `deriveWheelColors`; extend the curated `DeviceLook` chips to render
    full-palette mini-dots.
  - `lib/color-manifest.ts` — extend the harmony helpers (alongside `deriveWheelColors`) with
    a shared, deterministic "related shades" derivation reused by both surfaces.
  - `lib/ipod-state/update.ts` — no behavior change; the existing `SET_SKIN_COLOR`,
    `SET_RING_COLOR`, `SET_CENTER_COLOR`, `SET_BACK_COLOR`, `SET_BEZEL_COLOR` actions are the
    dispatch targets for taps.
- User-visible behavior change in the `/3d` color cockpit only; no schema or storage changes.
