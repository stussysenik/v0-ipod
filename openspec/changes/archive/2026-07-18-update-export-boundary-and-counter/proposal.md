# Change: Boundary-Constrained Export and Incremental Export IDs

## Why
Mobile exports still show clipped/ghosted edge shadows in some runs. The export path needs stricter deterministic framing. Users also need a concrete export identifier per output for tracking production behavior.

## What Changes
- Add a constrained export mode that captures from detached sanitized nodes only and suppresses external shadows that can clip at capture bounds.
- Add incremental export IDs (`0000`, `0001`, …) persisted in local storage and included in exported filenames.
- Expand default muted case/background color presets to better match a classic low-contrast gray/lofi aesthetic.

## Impact
- Affected specs: `export-ux`
- Affected code:
  - `lib/export-utils.ts`
  - `lib/storage.ts`
  - `components/ipod/ipod-classic.tsx`
  - `components/ipod/ipod-screen.tsx`
  - `components/ipod/click-wheel.tsx`
  - `tests/interactions.spec.ts`
