# Change: Multi-Format Colour Input (Hex / RGB / HSL) for 3D Controls

## Why

Every colour control in the `/3d` studio is a native `<input type="color">` swatch with a
monospace **hex-only** readout — per-part rows (Case/face, wheel ring, centre, well floor,
back, bezel) in `components/ipod/scenes/ipod-3d-color-cockpit.tsx`, and the
Ambient/Key/Fill/Rim wells in `components/ipod/scenes/ipod-3d-lighting-cockpit.tsx`. A user
who copies a colour from Figma, a CSS file, or a design token in `rgb(...)` or `hsl(...)`
notation cannot paste it: they must hand-convert to hex first. There is no way to read or
type a colour in any notation other than `#rrggbb`. This is friction for a tool whose whole
premise is faithful, fast colour iteration.

## What Changes

- **Typed colour entry in any common notation** — each colour control gains a small
  text-entry affordance (next to the existing native swatch) that accepts and parses
  **hex** (`#rgb` / `#rrggbb`), **`rgb()` / `rgba()`**, and **`hsl()` / `hsla()`** input,
  so a colour pasted/typed in any of those formats is applied.
- **Bidirectional conversion** — a pure, dependency-light conversion helper
  (`lib/color-format.ts`, backed by `THREE.Color` parsing where convenient) normalizes any
  accepted notation to the canonical stored hex string the reducer/engine already use
  (`SET_SKIN_COLOR`, `SET_RING_COLOR`, `SET_CENTER_COLOR`, `SET_BACK_COLOR`,
  `SET_BEZEL_COLOR`, `SET_BG_COLOR`, `PATCH_AMBIENT`/light colours), and can format a stored
  hex value back into hex / rgb / hsl for display so the user can read and re-edit in their
  preferred notation. Conversion is colour-preserving and round-trip stable.
- **Graceful invalid-input handling** — unparseable or partial text is rejected without
  mutating state, throwing, or corrupting the swatch; the control falls back to the last
  valid value and gives the user clear, non-destructive feedback.
- **Applies to every colour control** — the new typed input covers all device-part colours
  (face, wheel ring, centre, well floor, back, bezel) AND all lighting colours
  (Ambient, Key, Fill, Rim), not just one cockpit. Existing native-swatch picking and the
  current hex readout continue to work unchanged.
- **Unit-tested helper** — `lib/color-format.ts` ships with tests covering hex/rgb/hsl
  parsing, conversion round-trips, edge cases (`#000`, `#FFFFFF`, shorthand hex), and
  invalid input rejection.

## Impact

- Affected specs (delta in this change): `3d-control-surface`.
- Affected code: new `lib/color-format.ts` (+ tests); `components/ipod/scenes/ipod-3d-color-cockpit.tsx`
  (per-part colour rows — replace/augment the hex-only readout with a multi-format text
  input wired through the helper); `components/ipod/scenes/ipod-3d-lighting-cockpit.tsx`
  (`ColorRow` / light colour wells — same affordance). Reducer actions in
  `lib/ipod-state/update.ts` are unchanged (still receive a canonical hex string).
- User-visible behaviour change (richer colour entry); no data migration. Stored values
  remain canonical hex, so snapshots/presets/favourites stay compatible.
