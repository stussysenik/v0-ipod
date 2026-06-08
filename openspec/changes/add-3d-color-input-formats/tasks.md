## 1. Conversion helper (`lib/color-format.ts`)

- [x] 1.1 Create `lib/color-format.ts` exporting a pure `parseColor(input: string)` that
      accepts hex (`#rgb` / `#rrggbb`), `rgb()` / `rgba()`, and `hsl()` / `hsla()` and
      returns a canonical `#rrggbb` hex string, or `null` for unparseable input.
- [x] 1.2 Add a `formatColor(hex: string, format: "hex" | "rgb" | "hsl")` that converts a
      canonical hex value into the requested notation for display.
- [x] 1.3 Back parsing/formatting with `THREE.Color` where convenient (it parses several CSS
      formats and emits hex); keep the module pure and free of React/three-scene imports so
      it is trivially unit-testable.
- [x] 1.4 Normalize output (uppercase hex, expand shorthand) so conversion is round-trip
      stable and matches the existing `normalizeHex` canonical form.

## 2. Tests (`lib/color-format.test.ts`)

- [x] 2.1 Parse valid hex (`#000`, `#FFF`, `#1a2b3c`, `#FFFFFF`) → canonical hex.
- [x] 2.2 Parse valid `rgb()` / `rgba()` and `hsl()` / `hsla()` → canonical hex.
- [x] 2.3 Round-trip: `formatColor(parseColor(x)!, fmt)` re-parses to the same canonical hex
      across hex/rgb/hsl for representative colours including pure black/white.
- [x] 2.4 Invalid input (`"nope"`, `"#12"`, empty string, out-of-range channels) → `null`.

## 3. Wire the device-part cockpit (`components/ipod/scenes/ipod-3d-color-cockpit.tsx`)

- [x] 3.1 Add a multi-format text input beside each per-part native swatch (face, wheel
      ring, centre, well floor, back, bezel), pre-filled with the current value.
- [x] 3.2 On commit, run input through `parseColor`; if valid, dispatch the matching
      `SET_*_COLOR` action with the canonical hex; if invalid, revert to the last valid
      value and surface non-destructive feedback.
- [x] 3.3 Keep the native swatch and existing hex readout working; ensure the text input
      stays in sync when the swatch (or a preset/favourite) changes the value.

## 4. Wire the lighting cockpit (`components/ipod/scenes/ipod-3d-lighting-cockpit.tsx`)

- [x] 4.1 Apply the same multi-format text input to the `ColorRow` / colour wells for
      Ambient, Key, Fill, and Rim.
- [x] 4.2 On valid commit, dispatch the existing light-colour patch (`PATCH_AMBIENT` /
      per-light colour patch) with canonical hex; revert on invalid input.

## 5. Verify

- [x] 5.1 Run unit tests for `lib/color-format.ts` and confirm green.
- [ ] 5.2 Visually verify in `/3d`: paste a colour as hex, as `rgb(...)`, and as `hsl(...)`
      into a device-part control and a lighting control; confirm the device/lights update
      and invalid text is rejected cleanly.
- [x] 5.3 Confirm presets, favourites, and snapshots still round-trip (stored values remain
      canonical hex).
