## ADDED Requirements

### Requirement: Case-Light Pairing Strip

The color cockpit SHALL open with a pairing strip that places the active case swatch directly against the named rig presets, so color and light read as one decision. Tapping a rig chip relights the current colors; applying a finish sets both sides of the strip atomically. The strip SHALL display the active pairing as a mono spec readout (e.g. `NANO-2G RED × ANODIZED POP`).

#### Scenario: Relight without recolor
- **WHEN** the user taps a different rig chip in the pairing strip
- **THEN** only the lighting rig (and its stage, if the rig carries one) changes; all surface colors persist

#### Scenario: Pairing readout stays truthful
- **WHEN** any surface or rig changes from any control
- **THEN** the spec readout reflects the live state (finish name when exact, otherwise "Custom")

### Requirement: Generation-Grouped Finish Library

The color cockpit SHALL present built-in finishes grouped by generation family with Apple marketing names, each chip previewing case, wheel, and stage. Selection feedback SHALL be a hairline ring; applying is one tap. The library replaces the previous Finish / Combinations / Quick sections.

#### Scenario: Grouped browsing
- **WHEN** the user opens the finish section
- **THEN** finishes appear under their generation labels (Classic, Mini, Nano, Special) in library order

#### Scenario: Active finish indicated
- **WHEN** the live look exactly matches a built-in finish (all seven surfaces and rig)
- **THEN** that chip carries the active hairline ring; otherwise no library chip claims active state
