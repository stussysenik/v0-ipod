## MODIFIED Requirements
### Requirement: Mobile palette controls are reachable
The system SHALL keep palette controls reachable on mobile layouts and provide a compact or navigable layout.

#### Scenario: Mobile user opens palette controls
- **WHEN** a user opens theme controls on a mobile viewport
- **THEN** the top palette sections remain reachable without awkward scrolling.

### Requirement: Curated inspiration palette
The system SHALL provide a curated inspiration palette with recognizable color associations (products, food, teams).

#### Scenario: Selecting inspiration palette
- **GIVEN** the user opens the palette controls
- **WHEN** they choose a curated inspiration color
- **THEN** the case/background updates to the selected color.

### Requirement: Export controls expose framing and preview workflow
The system SHALL expose preset framing controls and a Preview / Record action in the export UI.

#### Scenario: GIF mode offers Preview / Record
- **GIVEN** the user switches export mode to GIF
- **WHEN** they view the export controls
- **THEN** they can choose a framing preset and open Preview / Record before exporting.

#### Scenario: Preview controls stay outside the capture frame
- **GIVEN** the user opens the GIF preview
- **WHEN** the preview modal is shown
- **THEN** transport controls are outside the animated frame so the frame stays clean for manual capture.
