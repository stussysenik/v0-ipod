# Change: Initialize MoonBit iPod Re-Implementation

## Why

The original [v0-ipod](https://github.com/stussysenik/v0-ipod) is a Next.js/React/TypeScript application.
This project re-implements it 1:1 using **MoonBit** as the primary language to stress-test its type system,
algebraic data types, JS FFI, package system, and compiler performance on a non-trivial real-world web
application. A general-purpose finite state machine library (`ibuki`) is extracted as a reusable artifact.

## What Changes — Delivered

- **ibuki-fsm** — General-purpose FSM library with `State`, `Event`, `Effect`, `Machine`, `dispatch`, `on`, `on_if`, `on_any`. Pure, side-effect-free. 5 whitebox tests pass.
- **ipod-app** — Re-implementation of the iPod Classic state management:
  - `IpodModel` with 4 sub-records (metadata, presentation, interaction, playback)
  - 29 `IpodEvent` constructors (all 29 original actions)
  - `reduce()` function handling 16 of 29 events (title, artist, album, artwork, view mode, colors, hardware presets, interaction model, OS screen, play toggle, battery, snapshot lifecycle)
  - Color system (9 Apple finishes, luminance, wheel derivation)
  - Marquee animation math (frame, cycle, overflow detection)
  - `normalize_model()` invariant enforcement
  - Basic JSON serialize/deserialize (stub deserializer)
  - 12 tests pass
- **cmd/main** — JS ES module with 8 exported functions for browser consumption
- **web/** — Minimal HTML demo with iPod UI, click wheel, color swatches, state rendering
- **openspec/** — Full proposal with design doc, 3 capability specs, and tasks

## What Changes — Deferred

- Three.js 3D rendering → v2
- MP4 export encoding → v2
- Full ReScript component layer → next phase
- Export pipeline (PNG capture, GIF encoding) → next phase
- OKLCH grey palette (6 families × 23 stops) → next phase
- Robust JSON deserialization → next phase
- PWA service worker → v2

## Impact

- Affected specs: ibuki-fsm (new), ipod-app (new), rescript-bridge (new)
- Affected code: entire repository (greenfield)
- Reference: `stussysenik/v0-ipod` (cloned at `/tmp/v0-ipod-reference`)
- No breaking changes (greenfield project)
