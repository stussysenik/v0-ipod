# studio-control-adoption

## ADDED Requirements

### Requirement: One control vocabulary across all surfaces

All interactive chrome SHALL be built from the studio control primitives — every
button, segmented control, chip, value field, and label on `/`, `/3d`, and
`/portfolio` — from `components/ui/studio-controls.tsx`. Bespoke one-off control styles
in the `/3d` cockpits, the `/3d` bottom bar, and the `/portfolio` stage chrome
SHALL be deleted, not visually approximated. New primitive variants MUST NOT be
invented inside page code; a missing capability is a change to the control-language
spec.

#### Scenario: Cockpit controls use the primitives

- **WHEN** any `/3d` cockpit panel renders
- **THEN** its buttons, segments, chips, and fields are instances of the studio
  primitives with no locally defined control styling

#### Scenario: Portfolio chrome matches

- **WHEN** `/portfolio` renders its stage chrome
- **THEN** interactive elements use the same primitives, radius token, and accent
  as `/` and `/3d`

### Requirement: No same-page duplicate control surfaces

On `/3d`, floating panels that duplicate a cockpit's function SHALL be removed
from that page's panel registry; command-palette entries for those functions SHALL
focus or open the cockpit instead of a parallel panel.

#### Scenario: One color editor on /3d

- **WHEN** the user invokes the color command from ⌘K on `/3d`
- **THEN** the finish-color cockpit is surfaced, and no separate floating color
  panel exists on that page
