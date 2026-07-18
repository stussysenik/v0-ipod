## ADDED Requirements

### Requirement: Lit Components Are Styled With UnoCSS Inside Shadow DOM
The system SHALL style the Lit design-system components using UnoCSS `shadow-dom` mode, so utility classes resolve inside each component's shadow root.

#### Scenario: Styling the embeddable element
- **GIVEN** the `<ipod-classic>` Lit element renders into its shadow root
- **WHEN** it uses UnoCSS utility classes in its template
- **THEN** UnoCSS SHALL inject the generated CSS into the element's `static styles` via the `@unocss-placeholder`
- **AND** the utilities SHALL apply inside the shadow root without leaking a global stylesheet into the host page

#### Scenario: Embedding on an arbitrary host page
- **GIVEN** the element is embedded on a page whose own CSS is unknown
- **WHEN** it renders
- **THEN** its styling SHALL remain encapsulated within the shadow root
- **AND** host-page styles SHALL NOT alter the element's intended appearance

### Requirement: The Design System Shares One Utility Vocabulary Across React And Lit
The system SHALL drive both the React surfaces and the Lit Shadow-DOM components from the same UnoCSS preset configuration, so the design system has a single source of utility and token definitions.

#### Scenario: Changing a shared token
- **GIVEN** a design token is defined once in the UnoCSS configuration
- **WHEN** that token is referenced by both a React component and a Lit component
- **THEN** both SHALL reflect the same resolved value
- **AND** no parallel token definition SHALL be required for the Shadow-DOM layer
