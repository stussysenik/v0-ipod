## ADDED Requirements

### Requirement: Native Embeddable Element

The system SHALL provide a native custom element `<ipod-classic>` that renders the iPod stage and browser navigation from a feed, with no host-framework runtime required. It SHALL accept a `feed` (URL or inline object) and `theme` via attributes/properties.

#### Scenario: Element renders in plain HTML

- **WHEN** `<ipod-classic feed="...">` is placed in a non-React HTML document
- **THEN** it upgrades and renders the device, navigable, from the feed, without React present

#### Scenario: Feed swap re-renders content

- **WHEN** the `feed` property is changed to a different valid feed
- **THEN** the element re-renders the new works without a page reload

### Requirement: Viewport-Independent Embedding

The element SHALL size entirely against its host container (container queries) and SHALL NOT read viewport dimensions, so it renders correctly at any embed size.

#### Scenario: Correct at arbitrary embed sizes

- **WHEN** the element is embedded in a 300px sidebar and in a 1000px hero
- **THEN** both render the device proportionally with no overlap and no horizontal overflow

### Requirement: White-Label Demonstration Route

The app SHALL expose `/whitelabel` rendering `<ipod-classic>` with a swappable feed + theme to demonstrate re-branding without code changes.

#### Scenario: Whitelabel route swaps brand

- **WHEN** `/whitelabel` switches between two themed feeds
- **THEN** the same element re-skins to each brand via tokens only
