## 1. Project Setup
- [ ] 1.1 Initialize `web/` as an npm project: `package.json` with ReScript, React, Vite deps
- [ ] 1.2 Create `rescript.json` with `@rescript/react`, `@rescript/core`, Vite plugin config
- [ ] 1.3 Install deps: `rescript`, `@rescript/react`, `react`, `react-dom`, `vite`, `@jihchi/vite-plugin-rescript`, `concurrently`
- [ ] 1.4 Configure `vite.config.js` with ReScript plugin and MoonBit JS alias
- [ ] 1.5 Configure `package.json` scripts: `dev` (concurrently), `build` (sequential), `res:build`, `res:watch`
- [ ] 1.6 Create `web/index.html` entry point (replaces current, minimal `<div id="root">`)
- [ ] 1.7 Create `web/src/Index.res` — ReactDOM.render entry point
- [ ] 1.8 Verify `npm run dev` starts MoonBit watch + ReScript watch + Vite HMR

## 2. ReScript Types
- [ ] 2.1 Create `web/src/Types.res` — Define `songMetadata`, `presentationState`, `interactionState`, `playbackState`, `ipodModel` record types matching MoonBit structs
- [ ] 2.2 Define `viewMode`, `interactionModel`, `hardwarePresetId`, `osScreen`, `snapshotSelectionKind` variant types
- [ ] 2.3 Define `ipodEvent` variant type with all 29 constructors matching MoonBit's `IpodEvent`
- [ ] 2.4 Define `appleFinish` record type (`{label: string, hex: string}`)
- [ ] 2.5 Define `wheelColors` record type (`{labelColor, borderColor, centerBorder, centerGradient}`)
- [ ] 2.6 Define `dispatchResult` type (`{model: ipodModel, effects: array<string>}`)

## 3. MoonBitBindings.res (FFI Layer)
- [ ] 3.1 Create `web/src/MoonBitBindings.res` — `@module("./js/ipod_moonbit.js")` externals for all 8 exports
- [ ] 3.2 Implement `eventToTagData(event: ipodEvent): (string, string)` — convert variant to (tag, data) pair
- [ ] 3.3 Implement `ipodModelFromJson` / `ipodModelToJson` serialization helpers
- [ ] 3.4 Implement `defaultModel: unit => ipodModel`
- [ ] 3.5 Implement `reduce: (ipodModel, ipodEvent) => dispatchResult` — typed dispatch wrapper
- [ ] 3.6 Implement `authenticFinishes: unit => array<appleFinish>`
- [ ] 3.7 Implement `deriveWheelColors: string => wheelColors`
- [ ] 3.8 Implement `marqueeCycleMs: (float, float, float) => float`
- [ ] 3.9 Implement `marqueeFrame: (float, float) => float`
- [ ] 3.10 Implement `marqueeNeeded: (float, float) => bool`
- [ ] 3.11 Implement `colorIsDark: string => bool`

## 4. Storage.res (localStorage)
- [ ] 4.1 Create `web/src/Storage.res` — localStorage read/write bindings
- [ ] 4.2 Implement `loadModel: unit => option<ipodModel>` — try restore from localStorage
- [ ] 4.3 Implement `setMetadata: songMetadata => unit` — persist to key `v0-ipod-metadata`
- [ ] 4.4 Implement `setUiState: (presentationState, interactionState) => unit` — key `v0-ipod-ui-state`

## 5. Effects.res
- [ ] 5.1 Create `web/src/Effects.res` with `run: (array<string>, ipodModel) => unit`
- [ ] 5.2 Case `"PERSIST_METADATA"` → `Storage.setMetadata(model.metadata)`
- [ ] 5.3 Case `"PERSIST_UI_STATE"` → `Storage.setUiState(model.presentation, model.interaction)`
- [ ] 5.4 Default case → `()` (unknown effects silently ignored)

## 6. IpodApp.res (Top-Level)
- [ ] 6.1 Create component: `React.useReducer(MoonBitBindings.reduce, initialModel)`
- [ ] 6.2 `initialModel`: try `Storage.loadModel()`, fall back to `MoonBitBindings.defaultModel()`
- [ ] 6.3 Reducer function: call `MoonBitBindings.reduce`, run `Effects.run`, return new model
- [ ] 6.4 Render `<IpodDevice>` with model + dispatch props
- [ ] 6.5 Apply dynamic case color: inline style `backgroundColor: model.presentation.skinColor`

## 7. IpodDevice.res
- [ ] 7.1 Render iPod shell div with rounded corners, shadow, dynamic background
- [ ] 7.2 Render screen frame div (inner border)
- [ ] 7.3 Render `<IpodScreen>` inside screen frame
- [ ] 7.4 Render `<ClickWheel>` below screen
- [ ] 7.5 Render `<ColorPicker>` below wheel

## 8. IpodScreen.res
- [ ] 8.1 Status bar: "Now Playing" label + battery indicator (bar chars + percentage)
- [ ] 8.2 Battery color threshold: green > 20%, red ≤ 20%
- [ ] 8.3 Artwork placeholder: gradient div when no artwork data URL, image when present
- [ ] 8.4 `<MarqueeText>` for title, static `<span>` for artist/album
- [ ] 8.5 Rating: star chars (★) × `model.metadata.rating` + track info
- [ ] 8.6 Progress bar: width % from `playback.currentTime / playback.duration`
- [ ] 8.7 Time display: elapsed mm:ss (left), remaining -mm:ss (right)
- [ ] 8.8 `<Editors>` for title, artist, album fields

## 9. ClickWheel.res
- [ ] 9.1 Ref-based access to DOM element for coordinate calculation
- [ ] 9.2 `onPointerDown` → record start angle via `atan2(y - cy, x - cx)`
- [ ] 9.3 `onPointerMove` → compute angle delta, accumulate rotation degrees
- [ ] 9.4 Dispatch `CycleOsMenu(delta)` every 30° rotation threshold
- [ ] 9.5 Center button: pointer events within inner radius → dispatch `SetOsScreen(NowPlaying)`
- [ ] 9.6 Render concentric circles: outer ring, inner center button
- [ ] 9.7 4 label positions: MENU (top), PREV (left), NEXT (right), PLAY/PAUSE (bottom)
- [ ] 9.8 Wheel color derivation: `MoonBitBindings.deriveWheelColors(model.presentation.skinColor)`

## 10. MarqueeText.res
- [ ] 10.1 Props: `~text: string`, `~containerWidth: float`, `~font: string`
- [ ] 10.2 On mount: measure text width via Canvas `measureText`
- [ ] 10.3 Call `MoonBitBindings.marqueeNeeded(textWidth, containerWidth)` — if false, render static
- [ ] 10.4 If true: call `MoonBitBindings.marqueeCycleMs(textWidth, containerWidth, gapWidth)`
- [ ] 10.5 `requestAnimationFrame` loop calling `MoonBitBindings.marqueeFrame(elapsed, cycle)`
- [ ] 10.6 Apply `translateX` transform to text wrapper element via ref
- [ ] 10.7 Render two text copies side-by-side for seamless loop

## 11. Editors.res
- [ ] 11.1 Props: `~field: string`, `~value: string`, `~onUpdate: (string => unit)`, `~dispatch: (ipodEvent => unit)`
- [ ] 11.2 State: `editing: bool` ref toggle on double-click
- [ ] 11.3 Edit mode: render `<input>` with current value, auto-focus, select all
- [ ] 11.4 Save on blur or Enter → call `onUpdate(newValue)` → dispatch appropriate event
- [ ] 11.5 Cancel on Escape → revert to original, exit edit mode
- [ ] 11.6 Display mode: render `<span>` with value, double-click to edit

## 12. ColorPicker.res
- [ ] 12.1 Load Apple finishes via `MoonBitBindings.authenticFinishes()` on mount
- [ ] 12.2 Render swatch grid: 9 colored circles with labels from finish data
- [ ] 12.3 On swatch click: dispatch `SetSkinColor(hex)`
- [ ] 12.4 Highlight active swatch: border when matches `model.presentation.skinColor`
- [ ] 12.5 Custom hex input: text input with `#` prefix, dispatch on change/blur
- [ ] 12.6 Background color toggle: separate control dispatching `SetBgColor(hex)`

## 13. CSS/Styling
- [ ] 13.1 Create `web/src/styles.css` — iPod shell, screen, wheel, swatches styling
- [ ] 13.2 Migrate existing CSS from `web/index.html` into stylesheet
- [ ] 13.3 Add ReScript-friendly class names (avoid inline styles where possible)

## 14. Build & Verify
- [ ] 14.1 Run `moon build --target js --release` — verify JS output
- [ ] 14.2 Run `npm run res:build` — verify ReScript compilation
- [ ] 14.3 Run `npm run build` — verify Vite production build
- [ ] 14.4 Run `npm run dev` — verify HMR for .res and .mbt changes
- [ ] 14.5 Run `moon test` — all 17 tests pass
- [ ] 14.6 Run `moon fmt && moon info` — format + generate interfaces

## 15. OpenSpec Artifacts
- [ ] 15.1 Verify tasks.md checklist complete
- [ ] 15.2 Verify design.md reflects final implementation
- [ ] 15.3 Verify spec.md scenarios match delivered behavior
