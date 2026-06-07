## ADDED Requirements

### Requirement: Keyframed now-playing UI choreography
The system SHALL animate now-playing UI element positions as keyframed transitions that
lead into the now-playing screen, choreographing the draggable layout elements into place.

#### Scenario: Animate into now-playing
- **WHEN** the now-playing transition runs
- **THEN** the UI elements animate from their start keyframes to their now-playing positions

#### Scenario: Choreography respects authored positions
- **WHEN** the user has authored custom element positions
- **THEN** the transition resolves to those positions as its end state

### Requirement: Human- and machine-readable choreography export
The choreography SHALL be exportable in a format that is both human-readable (named,
diffable keyframes) and machine-readable, and SHALL round-trip without loss.

#### Scenario: Export choreography
- **WHEN** the user exports the choreography
- **THEN** a readable, structured document (named keyframes + element positions/timings) is produced

#### Scenario: Re-import reproduces the animation
- **WHEN** an exported choreography document is re-imported
- **THEN** the resulting animation matches the original exactly
</content>
