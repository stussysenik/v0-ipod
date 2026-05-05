## 1. Infrastructure ✅
- [x] 1.1 Configure MoonBit workspace with three packages (ibuki, ipod, cmd/main)
- [x] 1.2 Configure build to target JS backend with ES module exports
- [x] 1.3 Set up web/ directory with HTML skeleton and dev server
- [x] 1.4 Verify `moon test` passes on empty workspace

## 2. ibuki FSM Library ✅
- [x] 2.1 Define core types: `State`, `Event`, `Effect`, `Machine`
- [x] 2.2 Implement `make_machine()` constructor
- [x] 2.3 Implement `add_transition()`, `on()`, `on_if()`, `on_any()`
- [x] 2.4 Implement `dispatch(machine, state, event)` → `(State, Array[Effect])`
- [x] 2.5 Write tests: basic transition, guard rejection, guard allow, multi-step (5 tests)

## 3. iPod State Model ✅
- [x] 3.1 Define `IpodModel` with SongMetadata, PresentationState, InteractionState, PlaybackState
- [x] 3.2 Define `IpodEvent` enum with all 29 action constructors
- [x] 3.3 Define model normalization (`normalize_model()`)
- [x] 3.4 Write tests: default model, clamp out-of-range values

## 4. iPod State Machine ✅ (core transitions done)
- [x] 4.1 Implement metadata transitions (title, artist, album, artwork)
- [x] 4.2 Implement time transitions (currentTime, duration via normalize)
- [x] 4.3 Implement rating + track number transitions
- [x] 4.4 Implement view mode transitions (SET_VIEW_MODE with string parsing)
- [x] 4.5 Implement color transitions (SET_SKIN_COLOR, SET_BG_COLOR)
- [x] 4.6 Implement hardware preset transitions with default color derivation
- [x] 4.7 Implement interaction model + OS screen transitions
- [x] 4.8 Implement RESET_MODEL and RESTORE_MODEL
- [x] 4.9 Implement TOGGLE_IS_PLAYING and SET_BATTERY_LEVEL
- [x] 4.10 Write tests: reduce title, view mode, skin color, toggle play, reset (5 tests)
- [ ] 4.11 Implement snapshot operations (APPLY_SONG_SNAPSHOT)
- [ ] 4.12 Implement iPod OS menu navigation (SET_OS_MENU_INDEX, CYCLE_OS_MENU)
- [ ] 4.13 Implement SET_OS_ORIGINAL_MENU_SPLIT with clamp guard
- [ ] 4.14 Implement now-playing editable toggle
- [ ] 4.15 Implement snapshot selection (SET_SELECTION_KIND, SET_RANGE_START_TIME, SET_RANGE_END_TIME)

## 5. Color System ✅ (core done)
- [x] 5.1 Implement Apple finishes (9 colors with label + hex)
- [x] 5.2 Implement hex luminance calculation (sRGB → linear → luminance)
- [x] 5.3 Implement is_dark() heuristic
- [x] 5.4 Implement wheel color derivation (label, border, center) for dark/light cases
- [x] 5.5 Write tests: finish count, dark/light wheel derivation
- [ ] 5.6 Implement OKLCH grey palette (6 undertone families × 23 lightness stops)
- [ ] 5.7 Implement hex deduplication for palette swatches
- [ ] 5.8 Implement screen surround derivation from case color
- [ ] 5.9 Implement OKLCH-to-hex conversion (via MoonBit, not DOM hack)

## 6. Marquee Math ✅
- [x] 6.1 Implement `get_marquee_frame(elapsed, duration)` → translateX offset
- [x] 6.2 Implement `get_marquee_cycle_duration_ms(text_w, container_w, gap_w)` → cycle ms
- [x] 6.3 Implement `get_marquee_gap_width(container_width)` → pixel gap
- [x] 6.4 Implement `needs_marquee()` overflow detection
- [x] 6.5 Implement `simulate_export_time()` for export progress
- [x] 6.6 Write tests: no overflow, overflow, needs detection (3 tests)

## 7. Export Plan ⏳ (partial)
- [x] 7.1 Implement `simulate_export_time(elapsed_ms, duration)` → display time
- [ ] 7.2 Implement `build_export_plan(duration_seconds, fps, scale)` → plan struct
- [ ] 7.3 Implement `clamp_export_duration(seconds)` → clamped seconds
- [ ] 7.4 Implement `apply_animation_frame(elapsed_ms, model)` → interpolated display values
- [ ] 7.5 Write tests: frame count, duration clamp, interpolation

## 8. Snapshot Serialization ⏳ (partial)
- [x] 8.1 Implement `serialize_model(model)` → basic JSON string
- [x] 8.2 Implement `deserialize_model(json_str)` → fallback-to-default (stub)
- [ ] 8.3 Implement proper deserialization from JSON with error handling
- [ ] 8.4 Integrate `@json` package for robust serialization
- [ ] 8.5 Write tests: round-trip with all fields, invalid JSON, missing fields

## 9. Web Demo ✅ (basic)
- [x] 9.1 Build `cmd/main/main.mbt` with public exports (8 functions)
- [x] 9.2 Compile MoonBit to JS ES module (`moon build --target js --release`)
- [x] 9.3 Create HTML skeleton: iPod device, screen area, click wheel (CSS only)
- [x] 9.4 Wire MoonBit dispatch to DOM events (edit buttons, color swatches, play)
- [x] 9.5 Render moonbit model state to DOM (title, artist, progress, battery, colors)
- [x] 9.6 Implement color picker (9 Apple finishes as swatches)
- [ ] 9.7 Implement marquee animation with MoonBit-computed frames
- [ ] 9.8 Implement click wheel rotational input (angle-based Pointer Events)
- [ ] 9.9 Implement editable text fields (inline editing)
- [ ] 9.10 Implement file upload for album artwork

## 10. Verification ✅ (build)
- [x] 10.1 Run `moon test` — 17/17 pass
- [x] 10.2 Run `moon fmt` — code formatted
- [x] 10.3 Run `moon info` — interface files generated
- [x] 10.4 Open demo in browser via dev server
- [ ] 10.5 Screenshot verification via chrome-devtools
- [ ] 10.6 Test full user flow: upload → edit → change color → export

## 11. ReScript Bridge (new phase)
- [ ] 11.1 Initialize ReScript project with `rescript.json` in web/
- [ ] 11.2 Set up Vite builder for ReScript + MoonBit JS integration
- [ ] 11.3 Write `MoonBitBindings.res` — `@module` externals for all 8 MoonBit exports
- [ ] 11.4 Implement `IpodApp.res` — React component owning FSM state (useReducer pattern)
- [ ] 11.5 Implement `IpodDevice.res` — physical shell + screen + wheel layout
- [ ] 11.6 Implement `ClickWheel.res` — Pointer Events angle calculation
- [ ] 11.7 Implement `MarqueeText.res` — requestAnimationFrame with MoonBit frame params
- [ ] 11.8 Implement `Effects.res` — localStorage, auto-save side effects

## 12. Export Pipeline (future phase)
- [ ] 12.1 Implement PNG export orchestration in ReScript (html-to-image fallback chain)
- [ ] 12.2 Implement GIF capture loop (frame-by-frame capture → Web Worker → gifenc)
- [ ] 12.3 Implement marquee/progress simulation during export (MoonBit compute + ReScript render)
- [ ] 12.4 Implement blank capture detection heuristic
- [ ] 12.5 Implement Web Share API / blob download delivery
