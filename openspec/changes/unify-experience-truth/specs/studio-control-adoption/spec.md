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

### Requirement: One corner radius family, machined not default

Every studio control and control-holding surface SHALL take its corner radius from the
two exported constants in `studio-controls.tsx` — `CONTROL_RADIUS` (derived from the
device's own aperture:body corner ratio) for a control, and `SURFACE_RADIUS`
(`CONTROL_RADIUS + 4`, the concentric outer corner for a `p-1` surface) for a bar, dock,
or tray that holds controls. Stadium pills (`rounded-full`) and ad-hoc Tailwind radii
(`rounded-xl` and friends) SHALL NOT appear on any studio surface: a default corner reads
as a stock component bolted around a machined one. No page SHALL define its own radius.

#### Scenario: No pills on the studio surfaces

- **WHEN** the `/3d` header controls and bottom camera bar render
- **THEN** their corners come from `CONTROL_RADIUS` / `SURFACE_RADIUS`, and no
  `rounded-full` class is applied to any control or control surface

#### Scenario: Surfaces nest concentrically

- **WHEN** a surface wraps controls with `p-1` padding
- **THEN** its radius is the control radius plus that padding, so the corners run parallel

### Requirement: No same-page duplicate control surfaces

On `/3d`, floating panels that duplicate a cockpit's function SHALL be removed
from that page's panel registry; command-palette entries for those functions SHALL
focus or open the cockpit instead of a parallel panel.

#### Scenario: One color editor on /3d

- **WHEN** the user invokes the color command from ⌘K on `/3d`
- **THEN** the finish-color cockpit is surfaced, and no separate floating color
  panel exists on that page
