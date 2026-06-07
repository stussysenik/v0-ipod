## ADDED Requirements

### Requirement: Functional click wheel and menu in /3d
The system SHALL make the click wheel controls (Menu, Previous, Next, Play/Pause, center
Select) and the menu functional within the 3D stage, driving the same OS state the 2D
surface uses so navigation and playback behave identically.

#### Scenario: Navigate the menu from the 3D wheel
- **WHEN** the user activates Menu or the directional wheel controls in `/3d`
- **THEN** the on-device menu navigates exactly as it does on the 2D surface

#### Scenario: Play/pause from the 3D wheel
- **WHEN** the user activates Play/Pause on the 3D wheel
- **THEN** playback state toggles and the now-playing screen reflects it

### Requirement: Click-wheel interactions fire web-API events
Wheel and menu interactions SHALL dispatch real web-API interaction events
(pointer/keyboard semantics) rather than purely internal handlers.

#### Scenario: Interaction emits a web-API event
- **WHEN** the user actuates a wheel control
- **THEN** a corresponding DOM/web-API interaction event is dispatched and observable

### Requirement: Edits function in the 3D stage
Edits available on the 2D surface SHALL function within `/3d` as well.

#### Scenario: Edit affects state in 3D
- **WHEN** the user performs an edit in the 3D stage
- **THEN** the edit takes effect on the shared state and is reflected on the device

### Requirement: Direct double-tap editing of the now-playing screen in /3d

The now-playing screen rendered on the 3D device SHALL be directly customizable in place,
the same way the 2D authoring surface is. Double-tapping an editable element on the device
screen SHALL open the appropriate inline editor: double-tapping the **album artwork** opens
an image picker to insert/replace the cover; double-tapping a **text field** (title,
artist, album, track info) opens an inline text input. Because the live screen is a drei
`Html` DOM portal, these are real DOM interactions on the device itself — no separate panel.

#### Scenario: Insert/replace the album cover by double-tap
- **WHEN** the user double-taps the album artwork on the 3D device screen
- **THEN** an image picker opens and the chosen image becomes the now-playing cover, reflected live and in subsequent exports

#### Scenario: Edit now-playing text by double-tap
- **WHEN** the user double-taps the title / artist / album / track text on the 3D screen
- **THEN** an inline text input appears pre-filled, and committing updates the shared state and the on-device text

#### Scenario: Customizations carry into exports
- **WHEN** the user has customized artwork/text in `/3d` and runs an export
- **THEN** the exported frame shows the customized now-playing screen, since export bakes the live screen
</content>
