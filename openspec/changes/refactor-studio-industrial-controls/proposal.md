# Change: Industrial control language — one stylized component set for /2d and /3d

## Why

Every cockpit and workbench panel hand-rolls its own buttons, chips, segments, and fields as ad-hoc Tailwind strings, so the control surfaces drift in radius, hairline weight, type scale, and hover behavior. The studio's ratified voice — thin-line industrial minimalism, an homage to 2008-era Apple mechanical/industrial engineering — needs to live in ONE place as styled primitives, so every interactive element across /2d and /3d reads as the same machined instrument and future surfaces (finish library, admin) inherit it for free.

## What Changes

- New `components/ui/studio-controls.tsx`: a small set of stylized control primitives —
  `StudioButton` (hairline border, mono-tracked label), `StudioChip` (swatch + label, hairline-ring active state), `StudioSegment` (1px segmented control, one active segment, no fill), `StudioField` (borderless mono value field), `StudioLabel` (9px tracked small-caps section label), `StudioRow` (label/value/control hairline row).
- One shared microinteraction timing table (hover ~130ms ease-out, selection ~220ms ease-out, never bounce) expressed as Tailwind tokens; fluid and smooth, no shadow stacks, no fills — selection is always a hairline ring or underline.
- Adopt across the entire button feature set: /3d cockpits (color, lighting, studio, camera, battery, now-playing, export dock) and /2d workbench panels/controls.
- No behavior changes — pure presentation refactor; reducer wiring untouched.

## Impact

- Affected specs: `studio-control-language` (new)
- Affected code: `components/ui/studio-controls.tsx` (new); `components/ipod/scenes/ipod-3d-*.tsx`; `components/ipod/workbench/*`, `components/ipod/panels/*`, `components/ipod/controls/*` (presentation-only adoption)
