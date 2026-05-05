## ADDED Requirements

### Requirement: MoonBit JS Module Export
The cmd/main package SHALL compile to an ES module with public exports for creating the iPod
FSM instance, dispatching events, serializing/deserializing models, and all pure utility
functions (color, marquee, export).

#### Scenario: ES module output
- **WHEN** `moon build --target js` runs on cmd/main
- **THEN** a JavaScript ES module file is produced with named exports

#### Scenario: Create machine from JS
- **WHEN** `import { createMachine } from './ipod_moonbit.js'` is called in JS
- **THEN** `createMachine()` returns a valid machine object that can be used with `dispatch()`

#### Scenario: Dispatch from JS
- **WHEN** `dispatch(machine, model, { type: "UpdateTitle", payload: "Hello" })` is called
- **THEN** the returned result contains the updated model with title set to "Hello"

### Requirement: ReScript Component Layer
The ReScript web layer SHALL provide thin React components that render the iPod device based
on MoonBit-computed state, with no business logic in the rendering layer.

#### Scenario: State flows one direction
- **WHEN** a user clicks the click wheel center button
- **THEN** ReScript calls MoonBit `dispatch()` and re-renders from the returned model

#### Scenario: Effect execution
- **WHEN** MoonBit returns effects `[persist_metadata]` after dispatch
- **THEN** the ReScript host executes the effect (writes to localStorage) and then re-renders

### Requirement: HTML Skeleton
The web demo SHALL provide a minimal HTML page with an iPod device rendering (shell, screen,
click wheel) styled to visually match the original iPod Classic.

#### Scenario: Device renders
- **WHEN** the HTML page loads
- **THEN** an iPod Classic visual is displayed with screen area and click wheel

#### Scenario: Screen updates from state
- **WHEN** the model's metadata title changes
- **THEN** the on-screen title text updates to reflect the new value

### Requirement: Click Wheel Input
The web demo SHALL capture pointer events on the click wheel to detect rotational input and
center button presses, translating them into MoonBit events.

#### Scenario: Rotational scroll
- **WHEN** the user drags clockwise on the click wheel
- **THEN** a `Seek` event is dispatched with the rotation delta

#### Scenario: Center button press
- **WHEN** the user clicks the center button
- **THEN** a `CenterClick` event is dispatched

### Requirement: Color Picker UI
The web demo SHALL provide a color picker interface showing the 9 Apple finishes and a basic
grey palette, with live preview updating the iPod case color.

#### Scenario: Select Apple finish
- **WHEN** the user clicks the "Blue" finish swatch
- **THEN** the iPod case and wheel colors update to match

#### Scenario: Custom color input
- **WHEN** the user enters a hex color in the color input
- **THEN** the model's skin color updates and persists

### Requirement: Export Workflow (PNG)
The web demo SHALL export a PNG snapshot of the iPod device at high resolution using
html-to-image or html2canvas.

#### Scenario: PNG export
- **WHEN** the user clicks "Export PNG"
- **THEN** a PNG file is downloaded at 4x resolution with the current model state rendered

### Requirement: Marquee Text Animation
The web demo SHALL animate marquee text scrolling for overflowing titles using
requestAnimationFrame with frame parameters computed by MoonBit.

#### Scenario: Marquee scrolls
- **WHEN** the song title is longer than the screen width and view mode is Preview
- **THEN** the title text scrolls smoothly left-to-right in a loop
