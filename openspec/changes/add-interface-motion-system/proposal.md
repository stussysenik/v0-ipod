# Change: Name the interface's motion, and write its saved row once

## Why

One row in the motion inspector is the quality bar for the whole surface, and it is an
accident. `ipod-3d-motion-inspector.tsx:489` puts a name on the left, `1× · 0.5s · seamless`
on the right derived from two stored numbers, and three commands — Rename, Save over, Delete
— that fade in on hover and on focus-within. It reads like a tool.

Nothing about it is declared:

- **The fade is Tailwind's default.** There is no motion module in this repo. Every transition
  on every surface is 150ms by omission, so no other surface can match this row on purpose —
  only by coincidence.
- **The row is written three times.** The Rename / Save over / Delete triple appears in
  `ipod-3d-motion-inspector.tsx`, `ipod-3d-color-cockpit.tsx` and `ipod-3d-stage.tsx`. Three
  copies of one gesture, and two of them will drift.
- **The readout's stability is undeclared.** The numbers are `tabular-nums` in one place. A
  value that jumps its own width while changing is the defect the loved row happens to avoid.

Two more consumers arrive shortly — the export shelf and the local gallery — so the third
copy is the last affordable one.

## What Changes

- Add `lib/motion-tokens.ts`: named durations and easings for interface transitions, with the
  constraint that a raw duration in a class name is a gate failure. Interface motion is
  execution, not visual truth, so these are **not** part of the Figma bridge's three token
  collections and `design-token-bridge` is unchanged.
- Add three primitives under `components/ui/`: a **reveal** (commands appearing on hover and
  focus-within, keyboard-reachable without hover), a **readout** (a value that changes in
  place at fixed width), and a **saved row** composing name + readout + a command set.
- Migrate all three existing shelves onto the saved row and delete the duplicated markup.
- Prove the migration moves no pixels on the motion inspector, which is under owner review.

## Impact

- Affected specs: `interface-motion-system` (ADDED).
- Affected code: `lib/motion-tokens.ts` (new), `components/ui/**` (new),
  `components/ipod/scenes/ipod-3d-motion-inspector.tsx`,
  `components/ipod/scenes/ipod-3d-color-cockpit.tsx`,
  `components/ipod/scenes/ipod-3d-stage.tsx`.
- Depends on: nothing.
- Blocks: nothing, but every later surface inherits it — `add-surface-node-tree`,
  `add-customize-walkthrough` and `add-community-state-gallery` each ship rows.
- **Net deletion expected.** Three copies become one primitive plus three call sites. If the
  diff adds lines overall, the primitive is carrying something that is not shared.
- **Pixel-identical by construction.** The motion inspector is awaiting the owner's visual
  review (`add-motion-authoring-system` §6.8). This change either proves identity by snapshot
  or it waits for that gate to close. It does not get to move those pixels quietly.
