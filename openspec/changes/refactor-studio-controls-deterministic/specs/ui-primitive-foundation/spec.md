## ADDED Requirements

### Requirement: Control Colors Are Solved Deterministically Against The Stage

The system SHALL derive control color tokens — surface, hairline, label, accent,
selected fill, selected label, and focus ring — as a pure function of the active stage
background color, using the project color authority (dcal). For any stage color the
solved tokens SHALL meet a defined contrast floor (WCAG AA / APCA equivalent) against
the surface each token sits on, and the same stage color SHALL always yield the same
control palette.

#### Scenario: Stage color changes

- **GIVEN** the user changes the stage background color
- **WHEN** the studio controls re-render
- **THEN** their color tokens SHALL be recomputed from the new stage color
- **AND** each token SHALL still clear the contrast floor against its surface

#### Scenario: Mid-luminance stage fallback

- **GIVEN** a stage color where neither dark nor light label color clears the floor
- **WHEN** the solver resolves control tokens
- **THEN** it SHALL tint or shade the control surface away from the stage to restore
  contrast rather than only swapping label color

#### Scenario: Determinism is verifiable

- **GIVEN** a fixed stage background color
- **WHEN** the solver runs more than once
- **THEN** it SHALL produce identical control tokens each time (snapshot-stable)

### Requirement: React Aria Is The Canonical Headless Layer

The system SHALL use `react-aria-components` as the single headless behavior layer for
interactive primitives, and SHALL NOT add any pre-styled component library
(e.g. Chakra, Carbon, MUI) for visual styling.

#### Scenario: Building an interactive primitive

- **GIVEN** a new or rebuilt interactive primitive (button, checkbox, switch, segment)
- **WHEN** it is implemented
- **THEN** its keyboard, focus, and ARIA behavior SHALL come from `react-aria-components`
- **AND** no pre-styled component-library dependency SHALL be introduced for its look

### Requirement: Dead And Duplicate Primitives Are Removed

The system SHALL rebuild `checkbox` and `switch` on the canonical headless layer,
remove the duplicate `carbon-checkbox`, and remove `@radix-ui/*` packages that have no
remaining import.

#### Scenario: Consolidating checkboxes

- **GIVEN** `checkbox` and `carbon-checkbox` exist with divergent styling
- **WHEN** consolidation completes
- **THEN** a single checkbox primitive SHALL remain, exported from `components/ui`
- **AND** `carbon-checkbox` SHALL be removed with no dangling imports

#### Scenario: Pruning unused dependencies

- **GIVEN** ~25 `@radix-ui/*` packages are installed but unimported
- **WHEN** the consolidation lands
- **THEN** every `@radix-ui/*` package with no source import SHALL be removed from
  `package.json`
- **AND** the build and `oxlint` gate SHALL pass with the reduced dependency set
