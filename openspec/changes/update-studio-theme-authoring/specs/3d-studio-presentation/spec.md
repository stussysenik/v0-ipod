# 3d-studio-presentation

## MODIFIED Requirements

### Requirement: Savable Studio Themes

The studio SHALL let the user save the current full look — all seven surface colors plus the
active rig **as it is currently configured** — as a named theme, persist saved themes across
reloads, apply any theme in one gesture, and delete user-saved themes. A built-in "Noir" theme
SHALL ship the canonical black look and SHALL NOT be deletable.

A theme SHALL record its rig as a preset name together with the fields that deviate from that
preset. Applying a theme SHALL restore the rig the user saved, including any hand-tuned
values, and SHALL NOT substitute the pristine preset for a tuned rig. A theme saved while its
rig was untouched SHALL record no deviations, so that a later revision of the named preset
still reaches it.

A theme persisted before this contract, carrying only a rig name, SHALL load as that preset
with no deviations rather than being discarded.

#### Scenario: Save and re-apply a theme

- **WHEN** the user saves the current look as a theme, changes colors, then applies the saved theme
- **THEN** all seven surface colors and the rig return to the saved values, and the theme survives a page reload

#### Scenario: A hand-tuned rig survives the round trip

- **WHEN** the user adjusts a rig's values away from its preset, saves the look as a theme, applies a different theme, then re-applies the saved one
- **THEN** the rig returns to the adjusted values, not to the preset's values

#### Scenario: An untouched rig tracks its preset

- **WHEN** a theme is saved while its rig matches the named preset exactly, and the preset is later revised
- **THEN** applying that theme yields the revised preset, because the theme recorded no deviations

#### Scenario: Built-in Noir theme

- **WHEN** the user opens the Themes shelf on any device state
- **THEN** the "Noir" theme is present, applies the canonical black look, and offers no delete affordance

#### Scenario: A theme stored under the previous contract still loads

- **WHEN** a persisted theme carries a rig name and no deviation record
- **THEN** it loads as that preset with no deviations, and neither the theme nor its colors are discarded

### Requirement: Noir Factory Default Presentation

The studio SHALL boot first-load visitors into the canonical "Noir" look: the
`classic-2008-black` hardware preset with case `#1b1818`, wheel ring `#313030`,
wheel center `#141212`, back `#cfd3d7`, edge `#cfd3d7`, bezel `#0a0a0a`, stage
`#0048FF`, lit by the "Designer Dark" rig. Hardware presets SHALL be able to
carry explicit wheel ring/center overrides that take precedence over
case-derived wheel colors.

The look a fresh visitor boots SHALL be resolved from a single stored default-theme
reference, so that the booted look and the theme bearing its name cannot disagree. Exactly one
theme SHALL be the default at any time. If the reference names a theme that no longer exists,
the built-in "Noir" theme SHALL be the default.

#### Scenario: Fresh visitor sees the noir hero look

- **WHEN** a visitor with no persisted snapshot opens `/3d`
- **THEN** the device renders the black case `#1b1818` with wheel ring `#313030` and center `#141212` on the `#0048FF` stage under the "Designer Dark" rig

#### Scenario: Corrupt lighting blob heals to the default rig

- **WHEN** a persisted lighting config fails validation
- **THEN** the sanitized config falls back to the "Designer Dark" rig, matching what a fresh load produces

#### Scenario: The booted look is the theme that claims to be default

- **WHEN** a visitor with no persisted snapshot opens `/3d`
- **THEN** the resulting seven surface colors and rig equal those of the theme the shelf marks as default

#### Scenario: A user theme can become the default

- **WHEN** the user sets one of their own saved themes as the default and reloads with no persisted snapshot
- **THEN** the studio boots that theme's look, and the shelf marks that theme and no other as default

#### Scenario: A dangling default reference heals to Noir

- **WHEN** the stored default reference names a theme that has been deleted
- **THEN** the studio boots the built-in "Noir" look and the shelf marks "Noir" as default

## ADDED Requirements

### Requirement: A saved theme is editable in place

The studio SHALL let the user rename a saved theme and SHALL let the user overwrite a saved
theme with the current look, so that changing one value in an existing look does not require
creating a second theme and deleting the first. Renaming and overwriting SHALL preserve the
theme's identity, so a theme that is the default remains the default across either operation.

Built-in themes SHALL NOT be renamed or overwritten, for the same reason they cannot be
deleted: they are the guaranteed route back to the factory look.

#### Scenario: Change one colour in an existing theme

- **WHEN** the user applies a saved theme, changes a single surface colour, and overwrites that same theme
- **THEN** the theme holds the new colour, the theme count is unchanged, and no new label is generated

#### Scenario: Renaming preserves identity

- **WHEN** the user renames a saved theme that is currently the default
- **THEN** the theme keeps its position and remains the default under its new name

#### Scenario: Built-in themes reject editing

- **WHEN** the user opens the built-in "Noir" theme's controls
- **THEN** no rename or overwrite affordance is offered
