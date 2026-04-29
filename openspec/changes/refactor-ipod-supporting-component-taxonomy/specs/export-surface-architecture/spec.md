## ADDED Requirements

### Requirement: Export UI Has Explicit Ownership
The system SHALL place framed export staging and preview-recording UI behind explicit export-oriented ownership.

#### Scenario: Working On Preview Or Capture Surfaces
- **GIVEN** a contributor is modifying framed export stage or GIF preview behavior
- **WHEN** they inspect the component and helper boundaries
- **THEN** the relevant modules SHALL read as export surfaces or workbench-owned export support
- **AND** general device rendering SHALL remain separate from preview and capture orchestration concerns

### Requirement: Export Helpers Remain Adapter-Like
The system SHALL keep export helpers legible as adapters around rendering and capture flows rather than implicit view owners.

#### Scenario: Inspecting Export Infrastructure
- **GIVEN** a contributor is tracing how PNG or GIF export works
- **WHEN** they move from view code into helper modules
- **THEN** the export modules SHALL expose explicit rendering or capture helpers
- **AND** the system SHALL avoid hiding unrelated UI ownership inside those helpers
