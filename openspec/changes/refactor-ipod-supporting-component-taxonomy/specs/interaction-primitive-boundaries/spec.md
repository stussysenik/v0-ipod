## ADDED Requirements

### Requirement: Shared Controls Use Typed Intent Contracts
The system SHALL require shared control primitives to expose typed props and intent-level callbacks.

#### Scenario: Reusing A Control Primitive
- **GIVEN** a contributor is modifying or reusing a control such as the click wheel, progress bar, or rating control
- **WHEN** they inspect the component contract
- **THEN** the public API SHALL use explicit typed props and callbacks that describe user intent
- **AND** the control SHALL avoid owning durable application policy outside ephemeral interaction state

### Requirement: Shared Editors Stay Local And Intent-First
The system SHALL require editor primitives to isolate draft-editing mechanics from durable business state and side effects.

#### Scenario: Editing Metadata Or Artwork
- **GIVEN** a contributor is working on editable text, editable time, track editing, fixed editor, image upload, or color-input surfaces
- **WHEN** the component commits a change
- **THEN** it SHALL emit a typed callback or intent describing the desired update
- **AND** persistence, export, or broader orchestration SHALL remain outside the editor primitive
