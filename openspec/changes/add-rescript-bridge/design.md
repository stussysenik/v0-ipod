## Context

We are replacing the vanilla JS demo (`web/index.html` + inline `<script type="module">`) with a
proper ReScript + React application. The original design doc specified exactly this architecture;
the grilling session confirmed it provides the most value for the project's goal of stress-testing
MoonBit's type system and JS FFI.

The key insight: MoonBit and ReScript share the same type philosophy (algebraic data types, pattern
matching, exhaustiveness checking). The FFI boundary between them is a natural fit — MoonBit enum
variants map directly to ReScript variant types. This creates a verifiable type-safe pipeline from
business logic (MoonBit) through the FFI boundary (ReScript bindings) to the UI layer (React props).

## Goals / Non-Goals

- **Goals:**
  - ReScript project with `@rescript/react` for React components
  - Type-safe FFI: ReScript variants mirroring MoonBit's `IpodEvent` constructors
  - All 8 MoonBit JS exports wrapped with typed ReScript functions
  - Click wheel rotational input via Pointer Events
  - Marquee text animation using MoonBit frame math
  - Inline editable text fields for metadata
  - Color picker with all 9 Apple finishes + custom hex
  - Side-effect execution (localStorage persist)
  - Vite HMR dev server with ReScript plugin

- **Non-Goals:**
  - Protobuf serialization (separate change)
  - Export pipeline (separate change)
  - Full 29-transition machine (separate change)
  - OKLCH grey palette (separate change)
  - Audio playback (v2)

## Decisions

### Type-Safe Event Pipeline

```
MoonBit (ipod/events.mbt)          ReScript (MoonBitBindings.res)        React (IpodApp.res)
─────────────────────────          ──────────────────────────────        ────────────────────
enum IpodEvent {                   type rec ipodEvent =                 dispatch(UpdateTitle("Hello"))
  UpdateTitle(String)        →       | UpdateTitle(string)        →     
  SetSkinColor(String)              | SetSkinColor(string)              
  ToggleIsPlaying                   | ToggleIsPlaying                   
  // ... 26 more                    // ... 26 more                      
}                                   }
```

**Decision:** Define ReScript variant types mirroring MoonBit's `IpodEvent` enum. The dispatch
function takes a typed variant, converts it to the `(event_tag, event_data)` string pair that
MoonBit expects, calls `reduce_model()`, and returns the parsed result.

**Rationale:** This is the core architectural value. The type system prevents mistyped event
names at compile time. If MoonBit adds a new variant, ReScript compilation fails until the
binding is updated — the type chain enforces consistency.

**Alternatives considered:**
- String-based dispatch (current vanilla demo) → No compile-time checking of event tags
- TypeScript interfaces → Structural types don't capture variant exhaustiveness

### ReScript React Component: useReducer Pattern

```
// IpodApp.res
@react.component
let make = () => {
  let (model, dispatch) = React.useReducer(MoonBitBindings.reduce, MoonBitBindings.defaultModel)

  // dispatch(UpdateTitle("Hello")) → MoonBit → new model → re-render

  <IpodDevice model>
    <IpodScreen model dispatch />
    <ClickWheel model dispatch />
    <ColorPicker model dispatch />
  </IpodDevice>
}
```

**Decision:** `React.useReducer` with a ReScript reducer that calls MoonBit's `reduce_model()`.
This is exactly the Redux-like pattern: `(model, event) -> (model, effects)`. The reducer
executes effects (localStorage) synchronously before returning.

**Rationale:** Matches MoonBit's functional reducer pattern perfectly. State flows one
direction. No mutable state in ReScript. The entire app re-renders when the model changes.

### MoonBitBindings.res — The FFI Boundary

```
// MoonBitBindings.res — @module externals
@module("./js/ipod_moonbit.js")
external defaultModelJson: unit => string = "default_model_json"

@module("./js/ipod_moonbit.js")
external reduceModel: (string, string, string) => string = "reduce_model"

// ... other 6 exports

// Typed wrapper
let reduce = (model: ipodModel, event: ipodEvent): (ipodModel, array<string>) => {
  let (tag, data) = eventToTagData(event)
  let result = reduceModel(model->ipodModelToJson, tag, data)
  let parsed = result->Js.Json.parseExn->decodeDispatchResult
  (parsed.model, parsed.effects)
}
```

**Decision:** Raw `@module` externals for MoonBit functions, plus typed wrapper functions
that handle JSON serialization/deserialization and variant-tag conversion. Components never
call the raw externals directly.

**Rationale:** Centralizes the FFI boundary in one module. When switching to protobuf later,
only `MoonBitBindings.res` changes. Components remain untouched.

### Vite + ReScript Build Pipeline

```
// package.json
{
  "scripts": {
    "dev": "concurrently \"moon build --target js --watch\" \"vite\"",
    "build": "moon build --target js --release && vite build",
    "res:build": "rescript build -with-deps",
    "res:watch": "rescript build -with-deps -w"
  }
}

// vite.config.js
import { defineConfig } from 'vite';
import rescript from '@jihchi/vite-plugin-rescript';

export default defineConfig({
  plugins: [rescript()],
});
```

**Decision:** Three concurrent processes for dev: `moon build --watch` (MoonBit → JS),
`rescript -w` (ReScript → JS), `vite` (bundle + HMR). Vite plugin handles ReScript
compilation automatically.

**Rationale:** Each tool watches its own source files. Vite's HMR picks up changes from
both MoonBit JS output and ReScript JS output.

### Component Tree

```
IpodApp.res              ← owns model & dispatch via useReducer
├── IpodDevice.res       ← iPod shell, dynamic background color
│   ├── IpodScreen.res   ← now-playing view, status bar, progress, time, rating
│   │   ├── MarqueeText.res  ← requestAnimationFrame scrolling
│   │   └── Editors.res      ← inline edit title/artist/album
│   ├── ClickWheel.res   ← Pointer Events rotation + center button
│   └── ColorPicker.res  ← Apple finishes grid + custom hex
```

**Decision:** 7 components in a shallow tree. `IpodApp` is the single owner of state.
Children receive `model` and `dispatch` as props.

### Effects.res — Side Effect Execution

```
// Effects.res
let run = (effects: array<string>, model: ipodModel): unit => {
  effects->Belt.Array.forEach(effect => {
    switch effect {
    | "PERSIST_METADATA" => Storage.setMetadata(model.metadata)
    | "PERSIST_UI_STATE" => Storage.setUiState(model.presentation, model.interaction)
    | _ => ()  // unknown effects are silently ignored
    }
  })
}
```

**Decision:** A dedicated module with a switch on effect tag strings. Effects are executed
synchronously inside the `useReducer` reducer function before returning the new state.

**Rationale:** Keeps React components free of side-effect logic. Easy to test in isolation.

## Risks / Trade-offs

- **Risk:** `moon build --watch` rebuild latency may lag behind ReScript + Vite HMR
  → Mitigation: MoonBit JS output is small (~26KB), rebuild should be sub-second
- **Risk:** Type duplication between MoonBit structs and ReScript types
  → Mitigation: Accept as inherent cost of FFI boundary; document linkage in comments
- **Trade-off:** Two compile-to-JS pipelines (MoonBit + ReScript)
  → Accept: This is the project's raison d'être — demonstrating multi-language JS compilation

## Open Questions

- Q: Should `useReducer` execute effects synchronously or defer them?
  - A: Synchronously. Effects are simple localStorage writes, not async I/O.
- Q: Should MarqueeText measure text width via DOM Canvas API or MoonBit?
  - A: Web Canvas `measureText` in the component (rendering concern). MoonBit computes
    frame position and cycle duration given the measured width.
