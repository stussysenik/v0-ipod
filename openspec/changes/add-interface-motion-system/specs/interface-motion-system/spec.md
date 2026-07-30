# interface-motion-system

## ADDED Requirements

### Requirement: Interface motion is named, and a raw duration fails the gate

Every interface transition SHALL read its duration and easing from a single motion module.
A duration or easing literal in application markup or styling SHALL fail a gate that names the
offending file and value.

The module SHALL declare each duration by the job it does rather than by its length, so a
surface asks for the transition it needs and cannot ask for a number. Interface motion is
execution rather than visual truth, so these values SHALL NOT be exported through the Figma
token bridge, and the bridge's collections SHALL be unchanged by this capability.

#### Scenario: A hard-coded duration fails the build

- **WHEN** a transition duration or easing literal appears in application source outside the motion module
- **THEN** the gate fails and names the file and the literal

#### Scenario: Every declared duration states its job

- **WHEN** the motion module is read
- **THEN** every entry is named for the transition it serves, and no two entries share a name

### Requirement: A revealed command set is reachable without a pointer

A control set that appears on hover SHALL also appear on focus-within, and SHALL be reachable
by keyboard alone in the surface's reading order.

Revealed commands SHALL occupy their space whether or not they are visible, so revealing them
never reflows the row that holds them.

#### Scenario: Keyboard user reaches a revealed command

- **WHEN** a keyboard user tabs into a row carrying revealed commands
- **THEN** the commands are visible and focusable without any pointer event

#### Scenario: Revealing commands does not move the row

- **WHEN** commands are revealed on a row
- **THEN** the row's height and the position of its other contents are unchanged

### Requirement: A value that changes states its new value in place at fixed width

A readout SHALL transition to its new value in place, and SHALL reserve width such that the
value changing does not change the readout's measured width.

A readout SHALL be derived from stored values rather than typed, so the value shown and the
value held cannot disagree.

#### Scenario: A numeric readout does not change width when its value changes

- **WHEN** a readout's value changes to one with a different digit count within its declared range
- **THEN** the readout's measured width is unchanged

#### Scenario: A readout reflects the stored value

- **WHEN** the stored values behind a readout change
- **THEN** the readout shows the value derived from them, with no separate stored copy of the string

### Requirement: One saved row serves every saved collection

Every surface listing saved entries SHALL use one shared row, composing an entry name, a
readout derived from what the entry stores, and a command set. No surface SHALL re-implement
the row's markup or its rename, save-over, or delete gestures.

Save over SHALL drop any override it just absorbed in the same gesture, so an entry that
absorbs a diff does not become a stored copy of its own base.

#### Scenario: Every saved collection renders the shared row

- **WHEN** the saved motion, saved theme, and saved state surfaces are rendered
- **THEN** each uses the shared row, and no duplicate row markup exists in application source

#### Scenario: Save over clears the override it absorbed

- **WHEN** an entry with an active override is saved over
- **THEN** the entry stores the resolved value and the override is cleared in the same gesture

#### Scenario: Rename commits on Enter and on blur, and abandons on Escape

- **WHEN** a row's rename is committed by Enter or by taking focus elsewhere
- **THEN** the entry carries the new name
- **AND** Escape leaves the entry's previous name unchanged
