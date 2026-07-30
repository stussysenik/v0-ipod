# Change: Put the target machine's two numbers in the gate

## Why

The target is a ThinkPad T480s on Intel UHD 620 at 1080p — `CLAUDE.md`, *The machine we fit*.
Nothing measures whether the artifact fits it.

Measured 2026-07-30: 4.5 MB of `.next/static` on disk. That is not the wire cost of one route,
and **no gate reports the wire cost of one route at all**. Nothing reports a frame rate on
integrated graphics either. The absence is the finding, not the number.

A budget is held, not recovered. One measured only after it is missed has never been met — and
three renderers are about to arrive on the dimension axis, so the first honest reading has to
exist before the third one is written. Otherwise the machine that discovers the miss is the
owner's machine, in front of a visitor.

This repo already knows the shape of the answer: the colour envelope is exhaustive, gated, and
prints its reading on pass. Size and frame rate get the same treatment or they get rhetoric.

## What Changes

- Add a wire-byte gate: transferred JavaScript and CSS for each route, measured from the build
  output rather than from disk totals, against a declared per-route ceiling.
- Add a frame gate on the named target: a deterministic scene walk timed under a GPU profile
  matching Intel UHD 620, failing on a declared frame budget.
- Both print their reading on pass, so a passing run is evidence and not a green tick.
- Both join `pnpm validate`, which the pre-commit hook already runs.
- Declare the baked-asset rule: an asset shipped rather than generated states what it bought.

## Impact

- Affected specs: `artifact-budget` (ADDED). Deliberately one capability rather than two —
  bytes and frames are one law about one machine, and splitting them puts that law in two homes.
  `stage-render-performance` is unchanged: its three requirements are about persistence, pose
  stability and viewport subscription, none of which is a budget.
- Affected code: `scripts/**` (new gates), `package.json` (`validate`), `tasks/state.json.gates`.
- Depends on: nothing.
- **Blocks `add-binocular-dimension-machines`.** A third renderer added while nothing measures
  cost is how the budget gets missed, and the ceiling has to be set from a reading taken before
  the barrel exists rather than negotiated after.
- The first run will establish ceilings from the current tree, so it passes by construction.
  That is correct: the gate's job is to stop regression, and its value starts at the next commit.
  A ceiling set generously enough to pass a future miss is worse than no ceiling.
