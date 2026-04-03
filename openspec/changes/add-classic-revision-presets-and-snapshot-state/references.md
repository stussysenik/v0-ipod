# iPod Classic Reference Matrix

## Source Priority
1. Apple official product materials, user guides, and technical specifications
2. Archival references such as The Apple Wiki
3. Curated frame matches and annotated screenshots supplied during review

This change uses the following canon sources:
- Apple Newsroom launch note for the original iPod classic on September 5, 2007
- Apple Support technical specifications for the 120GB / 160GB family
- The Apple Wiki historical summary for naming, revision boundaries, and UI-era notes

## Preset Taxonomy
The same revision identifiers are used in settings, saved state, and export filenames:

| Preset ID | User Label | Canon Target | Notes |
| --- | --- | --- | --- |
| `classic-2007` | Classic 2007 · 6th Gen | September 2007 launch model | Thick first all-metal iPod classic revision |
| `classic-2008` | Classic 2008 · 120GB refresh | September 2008 refresh | Transitional gray/silver geometry pass with calmer chrome |
| `classic-2009` | Classic 2009 · Late 160GB | September 2009 late thin revision | Thin late-family front-face target |

## Shared Physical Baseline
- Display: 2.5-inch 320×240
- Face aspect ratio: 103.5 mm × 61.8 mm front face for the thick family
- Thin late-family thickness target: 8.5 mm vs 10.5 mm for the earlier family
- Front-face language: metal shell, black screen surround, white or dark click wheel depending on finish
- UI font direction: Helvetica-family system UI rather than modern web UI defaults

## Per-Preset Visual Matrix

### `classic-2007`
- Front-face read: slightly heavier, earlier launch look
- Screen chrome: marginally larger screen surround and slightly taller overall screen block
- Wheel read: large wheel, strong separation from screen, slightly softer top highlight than later thin models
- Canon `Now Playing` traits: compact status bar, left artwork block, dense metadata column, thin progress bar near the bottom edge

### `classic-2008`
- Front-face read: refinement pass, slightly calmer chrome than 2007
- Screen chrome: similar outer footprint with slightly tighter internal spacing
- Wheel read: large white wheel, center aperture not oversized, spacing to shell edges still generous
- Canon `Now Playing` traits: nearly identical architecture to 2007, but with slightly less visual heaviness in borders and gaps

### `classic-2009`
- Front-face read: late thin family, calmest and tightest of the supported presets
- Screen chrome: slightly tighter outer frame, smallest status bar of the three
- Wheel read: largest apparent wheel-to-body occupancy in this implementation so the thin body does not read like an averaged mockup
- Canon `Now Playing` traits: same 6th/7th-gen UI family, but rendered with the cleanest spacing and least shadow weight

## Ambiguities And Resolution Rules
- Apple’s published materials establish overall dimensions and display specs, but not every front-face spacing measurement. For internal bezel widths, wheel occupancy, and exact status-bar line weights, official product shots are used as the primary visual guide.
- The 2008 refresh is not as exhaustively documented in official marketing as the launch and late thin refresh. Where the evidence is thinner, this preset stays intentionally conservative and only moves where multiple references imply a calmer intermediate geometry.
- Annotated screenshots supplied during review override earlier implementation guesses when they reveal a hybrid or averaged read, but they do not override Apple’s documented product family boundaries.

## Implementation Consequences
- The shell stays on one fixed front-face aspect ratio, but preset tokens must visibly change screen width, screen height, wheel diameter, wheel center ratio, and screen-to-wheel spacing.
- Export slugs must encode the preset ID so revision attempts remain distinguishable in downstream snapshot workflows.
- Manual validation must include all three presets in both direct and `iPod OS` interaction states so the app does not regress into one averaged device.
