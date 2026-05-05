# Project Context

## Purpose

A 1:1 re-implementation of [stussysenik/v0-ipod](https://github.com/stussysenik/v0-ipod) — an interactive
iPod Classic digital clone — using **MoonBit** as the primary language, with **ReScript** for the
web rendering layer. This project exists to stress-test MoonBit's type system, JS FFI, algebraic data
types, and module system on a non-trivial real-world web application.

## Tech Stack

- **MoonBit** (JS backend) — FSM library (`ibuki`), state management, color system, export math, serialization
- **ReScript** — React component layer, DOM event handling, Web Worker orchestration, Canvas export surface
- **HTML/CSS** — Minimal skeleton, Tailwind for styling (if needed)
- **JavaScript** — Web Worker for GIF/MP4 encoding (gifenc, WebCodecs — unavoidable browser APIs)
- **MoonBit toolchain** — `moon build`, `moon test`, `moon fmt`, `moon info`

## Project Conventions

### Code Style
- MoonBit: block style with `///|` separators; follow `moon fmt` output
- ReScript: standard ReScript formatting; first-class variant types for tagged unions
- Deprecated blocks go in `deprecated.mbt` per package

### Architecture Patterns
- **Three MoonBit packages** in one workspace:
  - `ibuki/` — General-purpose finite state machine library (standalone, mooncakes-ready)
  - `ipod/` — iPod application logic (state machine, color system, marquee math, export, snapshots)
  - `cmd/main/` — WASM entry point, exports public API for ReScript consumption
- **ReScript layer** — Thin React components, bindings to MoonBit-exported JS functions
- **State flows one direction:** User event → ReScript handler → MoonBit FSM `dispatch(event)` → new model → ReScript re-renders
- MoonBit code is **pure computation, zero DOM access**
- ReScript code is **thin glue, zero business logic**

### Testing Strategy
- MoonBit: `moon test` for all packages; snapshot tests for color system outputs, assertion tests for FSM transitions
- ReScript: minimal — React components are visual wrappers; test MoonBit functions directly
- Export pipeline: manual verification (depends on browser Canvas APIs)

### Git Workflow
- Conventional commits with semantic prefixes: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- Feature branches from `main`
- PR required for merge

## Domain Context

- **iPod Classic**: 6th generation (2007-2009), click wheel interface, 2.5" LCD
- **OKLCH color space**: Perceptually uniform, used for the grey palette system
- **Marquee text**: Scrolling text animation for overflow content on the iPod screen
- **Web Workers**: Used for non-blocking GIF/MP4 encoding in the export pipeline
- **Song metadata**: title, artist, album, artwork (data URL), duration, currentTime, rating, trackNumber, totalTracks

## Important Constraints

- MoonBit JS backend must support `--target js` with ES module exports
- ReScript must compile to compatible JS module format
- No server-side rendering needed (static HTML + JS app)
- Export encoding (gifenc, WebCodecs) must remain in JavaScript due to browser API dependency
- Three.js 3D rendering is **out of scope for v1** (complexity/cost ratio too high)

## External Dependencies

- **MoonBit**: `moonbitlang/core` standard library
- **ReScript**: `@rescript/react`, `@rescript/core`
- **JavaScript**: `gifenc` (GIF encoding), `mp4-muxer` (MP4 container), potential `html-to-image` or `html2canvas` for PNG export
- **Build**: Vite or similar bundler for ReScript + MoonBit JS assets
