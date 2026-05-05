## ADDED Requirements

### Requirement: ReScript Type Bridge
The web/ layer SHALL define ReScript types (records and variants) mirroring MoonBit's
struct and enum types, creating a type-safe pipeline from MoonBit through the FFI boundary
to React component props.

#### Scenario: Event variant mirroring
- **WHEN** MoonBit defines `IpodEvent::UpdateTitle(String)`
- **THEN** ReScript defines the corresponding variant `UpdateTitle(string)` in `ipodEvent`

#### Scenario: Compile-time consistency
- **WHEN** MoonBit adds a new `IpodEvent` variant
- **THEN** ReScript compilation fails until the new variant is added to `ipodEvent`, enforcing type consistency

#### Scenario: Model record mirroring
- **WHEN** MoonBit defines `SongMetadata` with fields title, artist, album, etc.
- **THEN** ReScript has a matching `songMetadata` record with the same field names and types

### Requirement: MoonBit FFI Bindings
A `MoonBitBindings.res` module SHALL provide typed wrappers around all 8 MoonBit JS exports,
handling JSON marshaling and variant-to-tag conversion.

#### Scenario: Typed dispatch
- **WHEN** `MoonBitBindings.reduce(model, UpdateTitle("Hello"))` is called
- **THEN** the function converts the variant to `("UPDATE_TITLE", "Hello")`, calls MoonBit's `reduce_model`, and returns `{model, effects}` as typed ReScript records

#### Scenario: Apple finishes
- **WHEN** `MoonBitBindings.authenticFinishes()` is called
- **THEN** an array of 9 `appleFinish` records is returned with `label` and `hex` fields

#### Scenario: Wheel color derivation
- **WHEN** `MoonBitBindings.deriveWheelColors("#111111")` is called
- **THEN** a `wheelColors` record is returned with label, border, and center color fields

### Requirement: useReducer State Management
The `IpodApp` component SHALL use `React.useReducer` with a reducer function that calls
MoonBit's dispatch and executes side effects, matching the `(model, event) -> (model, effects)` pattern.

#### Scenario: State reacts to dispatch
- **WHEN** `dispatch(UpdateTitle("Hello"))` is called
- **THEN** the model's title is set to "Hello" and all child components re-render

#### Scenario: Effects executed in reducer
- **WHEN** MoonBit returns effects `["PERSIST_METADATA"]`
- **THEN** the reducer calls `Effects.run()` to write to localStorage before returning new state

#### Scenario: Initial model from localStorage
- **WHEN** the app mounts and localStorage has a persisted model
- **THEN** the initial state is restored from localStorage instead of using defaults

#### Scenario: Initial model fallback
- **WHEN** the app mounts and localStorage has no persisted model
- **THEN** the initial state uses `MoonBitBindings.defaultModel()`

### Requirement: IpodDevice Shell Component
A component SHALL render the iPod Classic physical shell with dynamic case color from
the model's `presentation.skinColor` field.

#### Scenario: Dynamic case color
- **WHEN** `model.presentation.skinColor` is `"#C0C0C0"` (silver)
- **THEN** the iPod shell background renders in silver

#### Scenario: Screen frame rendered
- **WHEN** the component renders
- **THEN** a screen frame div with inner border contains the `<IpodScreen>` child

### Requirement: IpodScreen Display Component
A screen component SHALL render the now-playing view: status bar, artwork placeholder,
song info with marquee text, rating, progress bar, and time display.

#### Scenario: Status bar with battery
- **WHEN** `model.interaction.batteryLevel` is 0.85
- **THEN** the battery indicator shows 4 bars at 85% in green color

#### Scenario: Low battery warning
- **WHEN** `model.interaction.batteryLevel` is 0.15
- **THEN** the battery indicator shows 1 bar at 15% in red color

#### Scenario: Progress bar
- **WHEN** `model.playback.currentTime` is 30 and duration is 154
- **THEN** the progress bar fill width is approximately 19.5%

#### Scenario: Rating display
- **WHEN** `model.metadata.rating` is 4
- **THEN** four star characters (★★★★) are displayed

#### Scenario: Time formatting
- **WHEN** elapsed time is 65 seconds and remaining time is 89 seconds
- **THEN** the display shows "1:05" (elapsed) and "-1:29" (remaining)

### Requirement: ClickWheel Component
A click wheel component SHALL capture Pointer Events on a circular element, compute
rotation angle deltas using `Math.atan2`, and dispatch typed events to the reducer.

#### Scenario: Clockwise rotation
- **WHEN** the user drags clockwise by 30° cumulative
- **THEN** `dispatch(CycleOsMenu(30))` is called

#### Scenario: Counter-clockwise rotation
- **WHEN** the user drags counter-clockwise by 30° cumulative
- **THEN** `dispatch(CycleOsMenu(-30))` is called

#### Scenario: Center button press
- **WHEN** the user clicks within the center button radius
- **THEN** `dispatch(SetOsScreen(NowPlaying))` is called

#### Scenario: Wheel label colors
- **WHEN** the skin color is dark
- **THEN** wheel labels (MENU, PREV, NEXT, PLAY/PAUSE) render in light color from MoonBit's wheel derivation

### Requirement: MarqueeText Component
A marquee component SHALL animate scrolling text using `requestAnimationFrame` with frame
parameters computed by MoonBit's marquee math functions.

#### Scenario: Static text when fits
- **WHEN** `MoonBitBindings.marqueeNeeded(textWidth, containerWidth)` returns false
- **THEN** the text renders without animation

#### Scenario: Scrolling animation
- **WHEN** text overflows the container
- **THEN** `requestAnimationFrame` drives a continuous left-to-right scroll loop

#### Scenario: Frame position applied
- **WHEN** the animation calls `MoonBitBindings.marqueeFrame(elapsed, cycleDuration)`
- **THEN** the returned pixel offset is applied as CSS `translateX` to the text wrapper

### Requirement: Editors Component
An editors component SHALL provide inline editing for song metadata fields with
double-click to edit, blur/Enter to save, and Escape to cancel.

#### Scenario: Enter edit mode
- **WHEN** the user double-clicks the title text
- **THEN** an `<input>` replaces the `<span>`, focused with text selected

#### Scenario: Save on Enter
- **WHEN** the user presses Enter after editing
- **THEN** `dispatch(UpdateTitle(newValue))` is called and the input is replaced with the new text

#### Scenario: Cancel on Escape
- **WHEN** the user presses Escape while editing
- **THEN** the original value is restored and the `<input>` is replaced with the original text without dispatching

### Requirement: ColorPicker Component
A color picker component SHALL display all 9 Apple iPod finishes as clickable swatches
with active-state highlighting, plus a custom hex color input.

#### Scenario: Swatch grid renders
- **WHEN** the component mounts
- **THEN** 9 colored circles with finish labels are displayed in a grid

#### Scenario: Select finish dispatches event
- **WHEN** the user clicks the "Blue" finish swatch
- **THEN** `dispatch(SetSkinColor("#..."))` is called with the blue hex value

#### Scenario: Active swatch highlighted
- **WHEN** `model.presentation.skinColor` matches a finish's hex value
- **THEN** that swatch renders with a highlighted border

#### Scenario: Custom hex input
- **WHEN** the user enters a hex color in the custom input
- **THEN** `dispatch(SetSkinColor(enteredHex))` is called

### Requirement: localStorage Persistence
The `Storage.res` module SHALL serialize and deserialize model data to/from localStorage
using the same key names as the original v0-ipod for data compatibility.

#### Scenario: Metadata persistence
- **WHEN** metadata is updated and `PERSIST_METADATA` effect is emitted
- **THEN** metadata is serialized to `localStorage` key `v0-ipod-metadata`

#### Scenario: UI state persistence
- **WHEN** presentation/interaction state changes and `PERSIST_UI_STATE` effect is emitted
- **THEN** UI state is serialized to `localStorage` key `v0-ipod-ui-state`

#### Scenario: Load on startup
- **WHEN** the app initializes
- **THEN** `Storage.loadModel()` attempts to restore state from localStorage keys

### Requirement: Build Pipeline
The web/ build SHALL use Vite with the ReScript plugin, running concurrently with
`moon build --watch` for HMR development and sequential builds for production.

#### Scenario: Dev server
- **WHEN** `npm run dev` is executed
- **THEN** MoonBit, ReScript, and Vite all run concurrently with HMR for both .res and .mbt changes

#### Scenario: Production build
- **WHEN** `npm run build` is executed
- **THEN** MoonBit compiles to JS, ReScript compiles to JS, and Vite bundles everything into optimized output

#### Scenario: MoonBit rebuild triggers HMR
- **WHEN** a `.mbt` file is modified and MoonBit rebuilds
- **THEN** Vite detects the JS file change and triggers browser HMR

## MODIFIED Requirements

### Requirement: HTML Entry Point (modified from init-ipod-moonbit)
The `web/index.html` SHALL be a minimal React mount point (`<div id="root">`) with a
single `<script>` tag loading the Vite-bundled entry, replacing the previous full-page
inline demo.

#### Scenario: Minimal entry point
- **WHEN** the page loads
- **THEN** React mounts the `<IpodApp>` component into the root div and the iPod UI renders

#### Scenario: No inline script
- **WHEN** the page source is viewed
- **THEN** no inline MoonBit JS calls or DOM manipulation are present — all logic is in ReScript
