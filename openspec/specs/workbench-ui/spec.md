# workbench-ui Specification

## Purpose
TBD - created by archiving change strip-down-ui-feature-flags. Update Purpose after archive.
## Requirements
### Requirement: Feature Flag Gating
The workbench SHALL support gating specific UI sections behind boolean feature flags defined in `lib/feature-flags.ts`. When a flag is `false`, the corresponding UI element MUST not render.

#### Scenario: Hidden preset not rendered
- **WHEN** `SHOW_CLASSIC_2009_PRESET` is `false`
- **THEN** the "Classic 2009 · Late 160GB" hardware preset button is absent from the Revision Attempt section

#### Scenario: Hidden interaction mode not rendered
- **WHEN** `SHOW_IPOD_OS_ORIGINAL` is `false`
- **THEN** the "iPod OS Original" interaction mode button is absent from the Interaction section

#### Scenario: Hidden OKLCH spectrum not rendered
- **WHEN** `SHOW_OKLCH_SPECTRUM` is `false`
- **THEN** the OKLCH Spectrum case color palette grid is absent from the Case Color section

#### Scenario: Hidden OKLCH ambient not rendered
- **WHEN** `SHOW_OKLCH_AMBIENT` is `false`
- **THEN** the OKLCH Ambient background color palette grid is absent from the Background section

#### Scenario: Hidden 3D view mode not rendered
- **WHEN** `SHOW_3D_VIEW_MODE` is `false`
- **THEN** the "3D Experience" button is absent from the view mode toolbar

#### Scenario: Hidden focus mode not rendered
- **WHEN** `SHOW_FOCUS_VIEW_MODE` is `false`
- **THEN** the "Focus Mode" button is absent from the view mode toolbar

#### Scenario: Hidden ASCII mode not rendered
- **WHEN** `SHOW_ASCII_VIEW_MODE` is `false`
- **THEN** the "ASCII Mode" button is absent from the view mode toolbar

#### Scenario: Flag enabled restores UI element
- **WHEN** a feature flag is changed to `true`
- **THEN** the corresponding UI element renders as before

### Requirement: iPod OS Menu Navigation
When the iPod OS interaction model is active and the screen is showing "Now Playing", pressing the Menu button on the click wheel SHALL navigate back to the main menu screen.

#### Scenario: Menu from Now Playing in iPod OS mode
- **GIVEN** interaction model is "ipod-os" and osScreen is "now-playing"
- **WHEN** the Menu button is pressed on the click wheel
- **THEN** osScreen transitions to "menu" and the Now Playing editable state is reset to false

#### Scenario: Menu from Now Playing in iPod OS Original mode
- **GIVEN** interaction model is "ipod-os-original" and osScreen is "now-playing"
- **WHEN** the Menu button is pressed on the click wheel
- **THEN** osScreen transitions to "menu" and the Now Playing editable state is reset to false

