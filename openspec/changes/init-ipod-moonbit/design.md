## Context

We are re-implementing a complex web application (iPod Classic digital clone) using **MoonBit** for all
computation and **ReScript** for the DOM/React rendering layer. The original app has 2328 lines of
workbench logic, 2859 lines of export pipeline, and ~3000 lines of components — all in TypeScript.

The key architectural challenge is the **language boundary**: MoonBit and ReScript need a clean
protocol for state management, event dispatching, and side-effect handling.

## Goals / Non-Goals

- **Goals:**
  - General-purpose FSM library (`ibuki`) usable beyond this project
  - All business logic (state transitions, color math, marquee, export planning) in MoonBit
  - Clean FFI boundary: MoonBit exports pure functions, ReScript consumes them
  - All 29 iPod workbench actions modeled as FSM events
  - Full color system (138 grey tones, 9 Apple finishes, OKLCH spectrum)
  - Snapshot persistence (same localStorage keys for compatibility)
  - Export pipeline compute (frame planning, marquee interpolation, progress simulation)
- **Non-Goals:**
  - Three.js 3D rendering (v2)
  - MP4 export encoding (v2, requires WebCodecs)
  - PWA service worker (v2)
  - Storybook integration (v2)
  - Audio playback

## Decisions

### Architecture Evolution: From ibuki FSM to Direct Reducer

**Implemented:** The iPod machine uses a `reduce(model, event_tag, event_data)` function directly
rather than composing ibuki transitions. Rationale:

- ibuki's string-tag dispatch pattern introduces serialization overhead at every transition
  (deserialize model from state → compute → serialize back into state). For 29 tight-knit
  transitions, this adds boilerplate without benefit.
- The `reduce()` function is a pure reducer — same semantics, no ibuki dependency. The host
  (ReScript/JS) calls it like a Redux reducer: `(model, event) -> (model, effects)`.
- ibuki remains a fully functional standalone library (5 tests) suitable for other projects
  where string-based event routing is the right abstraction.
- Both approaches produce side effects as data — `reduce()` returns `Array[String]` effect tags
  that the host executes (persist to localStorage, play click sound, etc.).

**Decision:** MoonBit code is 100% side-effect-free. All effects (DOM updates, localStorage, timers,
Canvas operations) are described as data (`Effect` values) returned by the FSM interpreter, then
executed by the ReScript host layer.

**Rationale:**
- Keeps MoonBit testable without a browser
- Clean separation of concerns
- Matches FSM architecture: the machine computes effects, the host executes them

**Alternatives considered:**
- MoonBit calling JS FFI directly for effects → couples MoonBit to browser APIs, harder to test
- MoonBit owning mutable state via `Ref` → less idiomatic, harder to reason about

### Language Boundary Protocol

```
ReScript (host)                      MoonBit (compute)
──────────────                      ──────────────────

event ← user action                  IpodEvent(type, payload)
  ↓
model ← machine.dispatch(model,      machine: IpodMachine
        event)                       model: IpodModel
  ↓
effects = model.effects              effects: List[Effect]
  ↓
execute(effects)  ──→  newEvent ──→  (maybe a self-triggered event)
```

**Decision:** MoonBit exports:
1. `createMachine(): IpodMachine` — factory for the FSM
2. `dispatch(machine, model, event): DispatchResult` — the reducer
3. `serializeModel(model): String` / `deserializeModel(json): IpodModel` — persistence
4. Various pure utility functions (color math, marquee, export plan)

**ReScript imports:** These as `@module("./path/to/ipod_moonbit.js")` externals.

### ibuki FSM Library Design

```
State    = state_type + context_data
Event    = event_type + payload
Transition = State × Event → Guard? → NextState × List[Effect]
Machine  = Map[State, List[Transition]]
Actor    = spawned effect executor (e.g., battery drain timer)
```

**Decision:** ibuki is a standalone MoonBit package with no external dependencies (except core).
It's pure, functional, and side-effect-free. The interpreter returns `(next_state, effects, actors)`
for each dispatch.

### Package Structure

```
ipod_moonbit/           # MoonBit workspace root
├── ibuki/              # moon.pkg → "ibuki"
│   ├── fsm.mbt         # Core types: State, Event, Transition, Machine, Interpreter
│   ├── fsm_test.mbt
│   └── moon.pkg
├── ipod/               # moon.pkg → "ipod" (depends on ibuki)
│   ├── model.mbt       # IpodModel, IpodEvent, IpodState, Effect types
│   ├── machine.mbt     # IpodMachine — all 29 transitions + guards
│   ├── color.mbt       # OKLCH grey palette, Apple finishes, wheel color derivation
│   ├── marquee.mbt     # Frame calculation, cycle duration, gap width math
│   ├── export.mbt      # Frame plan builder, duration clamp, progress interpolation
│   ├── snapshot.mbt    # Serialize/deserialize IpodModel to/from JSON
│   └── *_test.mbt
├── cmd/main/           # moon.pkg → "cmd/main" (exports for ReScript)
│   ├── main.mbt
│   └── moon.pkg
└── web/                # ReScript + HTML frontend (separate build system)
    ├── package.json
    ├── rescript.json
    ├── src/
    │   ├── IpodApp.res         # Top-level component, owns FSM state
    │   ├── IpodDevice.res      # Physical shell + screen + wheel layout
    │   ├── IpodScreen.res      # Screen content (menu/now-playing/ASCII)
    │   ├── ClickWheel.res      # Pointer-event-based rotational input
    │   ├── Editors.res         # Editable text, time, track number components
    │   ├── MarqueeText.res     # requestAnimationFrame-based scrolling
    │   ├── ColorPicker.res     # Grey palette, Apple colors, OKLCH spectrum
    │   ├── ExportPipeline.res  # Worker orchestration, capture loop, delivery
    │   ├── Storage.res         # localStorage bindings
    │   └── MoonBitBindings.res # @module externals to MoonBit exports
    ├── public/
    │   └── index.html
    └── build.mjs               # Build script

## Risks / Trade-offs

- **Risk:** MoonBit JS backend may not produce tree-shakeable output → Mitigation: measure bundle size, if too large consider WASM + minimal JS shim
- **Risk:** Type mismatches at FFI boundary (MoonBit algebraic types ↔ ReScript variants) → Mitigation: JSON as serialization format for complex types; primitive types pass directly
- **Risk:** Performance of MoonBit-compiled JS in animation loops (marquee, export capture) → Mitigation: animation runs in ReScript's requestAnimationFrame using pre-computed values from MoonBit; MoonBit only computes frame parameters
- **Trade-off:** Duplicating type definitions (once in MoonBit, once in ReScript for debug) → Accept: the FFI boundary requires it

## Migration Plan

N/A — greenfield project. No migration from existing code.

## Open Questions

- Q: Should events carry opaque JSON payloads or typed MoonBit variants at the FFI boundary?
  - A: Typed MoonBit variants are preferred. ReScript passes enum tags + payload as separate JS values.
- Q: Should the MoonBit package produce ES modules or IIFE?
  - A: ES modules (`"format": "esm"` in link config), consumed by Vite bundler.
- Q: Tailwind or raw CSS for the ReScript layer?
  - A: Tailwind (consistent with original), imported at HTML entry point.
