# content-feed Specification

## Purpose
Governs the iPod content feed: a versioned, schema-validated feed model whose theme tokens drive white-labeling of the surface.
## Requirements
### Requirement: Validated Feed Schema

The system SHALL define a versioned `IpodFeed` schema covering `meta`, `theme` tokens, a `menu` tree, `works[]`, and `assets[]`, and SHALL validate any feed against it before render. Each `work` SHALL be self-contained (slug, title, summary, cover, optional body/links) so it can render as a standalone preview.

#### Scenario: Valid feed loads into a typed model

- **WHEN** a feed matching the schema is loaded
- **THEN** the loader returns a normalized, typed model with every work addressable by slug

#### Scenario: Invalid feed fails loudly

- **WHEN** a feed is missing a required field or has a wrong type
- **THEN** the loader rejects it with a field-level validation error and renders nothing from it

### Requirement: Theme Tokens Drive White-Labeling

The feed `theme` SHALL express brand as design tokens that map to CSS custom properties consumed by the stage. Swapping the theme SHALL re-skin the element with no code change.

#### Scenario: Swapping theme tokens re-skins the element

- **WHEN** two feeds with identical structure but different `theme` tokens are rendered
- **THEN** both render the same layout with different brand colors/type, driven only by the token values

