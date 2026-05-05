# Change: Add ReScript Bridge Layer

## Why

The current `web/index.html` is a vanilla HTML/JS demo (~223 lines) that proves MoonBit's compute
layer works — it imports the MoonBit ES module, calls `reduce_model()`, and updates DOM elements
imperatively. While functional, it doesn't leverage the architectural value this project was built
to demonstrate:

- **Type-safe FFI boundary** — Vanilla JS has no compile-time checking of MoonBit event names
  or model field access. `dispatch('UPDATE_TITLE', ...)` can silently mistype the tag.
- **End-to-end algebraic types** — MoonBit's enum variants (`IpodEvent::UpdateTitle("...")`) map
  naturally to ReScript's variants (`UpdateTitle("...")`). The type chain flows unbroken from
  MoonBit through the FFI boundary to React props.
- **Stress-test value** — This project exists to push MoonBit's type system, JS FFI, and module
  system. A type-safe bridge to a peer language (ReScript, which also has algebraic data types)
  demonstrates this more than untyped JS glue.

ReScript + `@rescript/react` replaces the vanilla demo with typed React components, making the
entire pipeline verifiable at compile time: **MoonBit variant → ReScript variant → React prop**.

## What Changes

### Delivered

- **web/ ReScript project** — `rescript.json`, `package.json`, Vite config with ReScript plugin
- **MoonBitBindings.res** — Typed `@module` externals for all 8 MoonBit JS exports with proper
  `JSON.parse`/`JSON.stringify` marshaling and ReScript variant types for events
- **IpodApp.res** — Top-level React component owning FSM state via `useReducer` pattern,
  dispatching events to MoonBit, executing effects (localStorage auto-save)
- **IpodDevice.res** — Physical iPod shell layout (screen frame, click wheel, case body) with
  dynamic case color from model state
- **IpodScreen.res** — Screen content renderer: now-playing view, status bar, progress bar,
  time display, rating stars, artwork placeholder
- **ClickWheel.res** — Pointer Events angle calculation, center button press detection,
  rotation delta → event dispatch
- **Editors.res** — Inline editable text fields (title, artist, album) with blur-to-save
- **MarqueeText.res** — `requestAnimationFrame`-based scrolling using MoonBit-computed
  frame parameters
- **ColorPicker.res** — Apple finishes grid + custom hex input, dispatching color events
- **Effects.res** — Side-effect executor: localStorage persist (metadata, UI state)
- **Storage.res** — localStorage bindings for initial model load
- **Vite build** — Dev server with HMR, production build bundling ReScript + MoonBit JS

### Deferred

- Protobuf serialization → `add-protobuf-serialization`
- Export pipeline (PNG capture, GIF encoding) → `add-export-pipeline`
- Full iPod machine (remaining 17 transitions) → `add-full-ipod-machine`

## Impact

- Affected specs: `rescript-bridge` (MODIFIED — from deferred spec to implemented)
- Affected code: entire `web/` directory (replaced), `cmd/main/main.mbt` (possible minor API additions)
- No changes to `ibuki/`, `ipod/color.mbt`, `ipod/marquee.mbt`, `ipod/model.mbt`
- Replaces vanilla JS demo with typed ReScript + React components
- Delivers 8 ReScript components from the original design doc
- ExportPipeline.res and full machine deferred to subsequent changes
