# default-presentation

## ADDED Requirements

### Requirement: First paint is the finished look

On first load with no persisted state, `/` and `/3d` SHALL present the Noir
default (black `classic-2008-black` shell on the `#0048FF` stage) with no
hydration flash of intermediate colors, and on mobile the entire device SHALL be
framed within the viewport without user interaction.

#### Scenario: Cold load on a phone

- **WHEN** a first-time visitor opens `/3d` at 390×844
- **THEN** the fully framed black iPod on the blue stage renders without a visible
  flash of non-default colors and without the device being cropped

### Requirement: The link unfurls before it loads

The deployed site SHALL declare Open Graph and Twitter card metadata — real title,
one-sentence description, and a 1200×630 `og:image` of the Noir device on the
`#0048FF` stage — so the URL renders a preview card when pasted into a tweet or
message. The `generator: "v0.app"` tell SHALL be removed.

#### Scenario: Pasted into a tweet reply

- **WHEN** the production URL is pasted into a tweet or iMessage
- **THEN** a preview card unfurls showing the Noir iPod image and the project's
  real title and description, not a bare URL or scaffold-default text

### Requirement: Presets are presented, not hunted

Built-in looks (Noir theme; 2008 black/silver hardware finishes) SHALL be exposed
as one-tap choices inside the primary color/theme surface of each customizer page,
using studio chip primitives, and applying one SHALL fully restore that look's
colors deterministically.

#### Scenario: One tap back to factory

- **WHEN** the user has customized colors and taps the Noir preset chip
- **THEN** all seven theme colors return to the Noir values in one action
