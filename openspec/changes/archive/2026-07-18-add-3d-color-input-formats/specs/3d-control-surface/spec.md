## ADDED Requirements

### Requirement: Colour controls accept multiple typed notations

Every colour control in the 3D studio SHALL accept typed colour input in multiple common
notations — hexadecimal (`#rgb` and `#rrggbb`), `rgb()` / `rgba()`, and `hsl()` / `hsla()` —
in addition to the native colour-swatch picker. The user MUST be able to paste or type a
colour in any of these notations and have it applied to the corresponding surface or light.

#### Scenario: Typed hex is accepted
- **WHEN** the user types a valid hex value (e.g. `#1a2b3c` or shorthand `#abc`) into a colour control and commits it
- **THEN** the control applies that colour and the device/light updates accordingly

#### Scenario: Typed rgb() is accepted
- **WHEN** the user pastes an `rgb(...)` or `rgba(...)` value into a colour control and commits it
- **THEN** the control parses it and applies the equivalent colour

#### Scenario: Typed hsl() is accepted
- **WHEN** the user pastes an `hsl(...)` or `hsla(...)` value into a colour control and commits it
- **THEN** the control parses it and applies the equivalent colour

### Requirement: Bidirectional, colour-preserving conversion

The system SHALL convert between hex, rgb, and hsl notations through a single pure
conversion helper, normalizing every accepted notation to the canonical stored hex form
that the reducer and 3D engine already consume. Conversion MUST be colour-preserving and
round-trip stable: a value formatted into one notation and re-parsed MUST yield the same
canonical colour, including pure black (`#000000`) and pure white (`#FFFFFF`).

#### Scenario: Notation normalized to canonical hex on commit
- **WHEN** a valid colour is committed in any supported notation
- **THEN** it is converted to a canonical `#rrggbb` hex string before being stored/dispatched

#### Scenario: Stored value can be displayed and edited in another notation
- **WHEN** a stored hex colour is shown for editing in rgb or hsl notation
- **THEN** the displayed value represents the same colour and re-committing it leaves the colour unchanged

#### Scenario: Black and white survive conversion
- **WHEN** `#000000` or `#FFFFFF` is entered in any supported notation
- **THEN** the stored canonical value is exactly `#000000` or `#FFFFFF` respectively

### Requirement: Invalid colour input is rejected gracefully

The colour controls SHALL reject unparseable or out-of-range input without mutating state,
throwing, or corrupting the active swatch. On invalid input the control MUST fall back to
the last valid value and provide non-destructive feedback to the user.

#### Scenario: Unparseable text is ignored
- **WHEN** the user commits text that is not a valid colour (e.g. `nope`, `#12`, an empty string, or channel values out of range)
- **THEN** no colour change is dispatched and the control retains its last valid value

#### Scenario: Invalid input does not crash the control
- **WHEN** invalid input is entered into a colour control
- **THEN** the control surface remains functional and the device/light render is unaffected

### Requirement: All colour controls support multi-format input

Multi-format typed colour input SHALL apply to every colour control in the 3D studio: all
device-part colours (face, wheel ring, centre, well floor, back, bezel) in the colour
cockpit AND all lighting colours (Ambient, Key, Fill, Rim) in the lighting cockpit. The
existing native-swatch picker and the current value readout MUST continue to function
unchanged, and the typed input MUST stay in sync when the value is changed by the swatch,
a preset, or a saved favourite.

#### Scenario: Device-part colours support typed input
- **WHEN** the user enters a colour in any supported notation for a device part (face, wheel ring, centre, well floor, back, or bezel)
- **THEN** that part updates and the value is stored as canonical hex

#### Scenario: Lighting colours support typed input
- **WHEN** the user enters a colour in any supported notation for a light (Ambient, Key, Fill, or Rim)
- **THEN** that light's colour updates and the value is stored as canonical hex

#### Scenario: Typed input stays in sync with other inputs
- **WHEN** a colour is changed via the native swatch, a preset, or a saved favourite
- **THEN** the typed-input field reflects the new value in its current display notation
