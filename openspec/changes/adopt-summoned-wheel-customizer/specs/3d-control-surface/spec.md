## MODIFIED Requirements

### Requirement: Controls take visual focus over the device

The control surface SHALL be summoned rather than resident. On `/3d` the only chrome that
persists while no gesture is in flight is the ratified six-view bar (`camera-control-truth`)
and the surface-mode pill; every other control SHALL be reachable only through the radial
wheel summoned at the pointer, or through the command palette.

While a wheel or a value readout is presented it SHALL render ABOVE the canvas with a clear,
consistent z-order, SHALL receive pointer events rather than the canvas behind it, and SHALL
never be occluded or clipped by the canvas. On dismissal it SHALL surrender pointer events to
the canvas in the same frame, so a press that follows a dismissal orbits rather than being
swallowed.

The wheel SHALL be summoned by a press that has not travelled beyond the orbit threshold, and
a press that travels beyond that threshold SHALL become an orbit that can never become a wheel.
Time alone SHALL NOT disambiguate the two.

#### Scenario: The idle stage carries no panel

- **WHEN** `/3d` loads and no pointer is pressed
- **THEN** the only chrome rendered is the six-view bar and the surface-mode pill
- **AND** no draggable, resizable or docked tool panel is present on the stage

#### Scenario: The wheel takes focus while presented

- **WHEN** the wheel is summoned over the device region
- **THEN** the wheel renders on top of the device and receives clicks/taps, not the canvas

#### Scenario: A travelling press is an orbit, not a wheel

- **WHEN** a press moves beyond the orbit threshold before the hold threshold elapses
- **THEN** no wheel is presented for the remainder of that press
- **AND** the camera orbits from the first movement, with no flicker of wheel chrome

#### Scenario: Controls keep focus while the device animates

- **WHEN** the device is animating or being orbited and a value readout is presented
- **THEN** the readout stays visible and on top, never hidden behind the render

### Requirement: Non-overlapping, responsive control layout

Summoned chrome SHALL be clamped to the viewport: a wheel summoned near an edge SHALL shift so
every wedge remains within bounds, and SHALL NOT reflow the canvas or move the device to make
room. The device framing SHALL remain a pure function of pose and viewport
(`camera-control-truth`), unaffected by whether chrome is presented.

#### Scenario: A wheel summoned at the edge stays whole

- **WHEN** the user presses within one wheel radius of any viewport edge
- **THEN** the wheel shifts inward so every wedge is fully within the viewport
- **AND** no wedge is clipped

#### Scenario: Summoning does not move the device

- **WHEN** a wheel is summoned and then dismissed
- **THEN** the device occupies exactly the same pixels before and after

## ADDED Requirements

### Requirement: Every tool panel is listed, and each is shown or hidden individually

The `/3d` stage SHALL declare its tool panels in one roster that owns each panel's stable id,
its position number and its title, and every panel's header SHALL read its number and title
from that roster rather than being told them at its mount site.

The surface SHALL present the roster as a single list in which each entry carries a control
that shows or hides that panel. A hidden panel SHALL remain listed, so the set of tools is
legible whether or not any member is on screen and no panel is reachable only by knowing it
exists.

One command SHALL hide every panel and one command SHALL show every panel. Both SHALL write
values of the same per-panel map the individual controls write; neither SHALL introduce a mode,
a flag, or a state the surface cannot leave by the same gesture that entered it.

Panel visibility SHALL persist across reload and SHALL survive the share payload. A stored or
shared value that omits a panel SHALL heal to shown, and a key the roster does not declare
SHALL be dropped.

Showing or hiding a panel SHALL NOT move the device: framing stays a pure function of pose and
viewport (`camera-control-truth`).

#### Scenario: The list names every panel, including the hidden ones

- **WHEN** the user opens the tool list with some panels hidden
- **THEN** every panel the stage declares is listed
- **AND** each entry shows whether that panel is currently on screen

#### Scenario: Hiding every panel leaves the object and the bar

- **WHEN** the user issues the command that hides every panel
- **THEN** no tool panel is rendered
- **AND** the six-view bar and the object remain, and the device occupies the same pixels

#### Scenario: The product view is reversible in one gesture

- **WHEN** every panel is hidden and the user issues the command that shows every panel
- **THEN** every panel returns to the stage
- **AND** the surface is identical to the factory state

#### Scenario: A record written before the roster existed opens with every panel

- **WHEN** a stored studio slice or a shared payload carries no panel-visibility value
- **THEN** every panel is shown
- **AND** no panel is hidden by anything other than a gesture the user made
