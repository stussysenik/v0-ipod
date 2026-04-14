# Delta: ipod-design-fidelity

## ADDED Requirements

### Requirement: Unified Black/White iPod Theme Toggle
The system SHALL provide a single theme toggle with exactly two variants — `black` and `white` — that drives the case color, click wheel gradient, screen surround, and surrounding chrome atomically. The default theme on first load MUST be `black`. Persisted legacy value `silver` MUST be migrated to `white` transparently.

#### Scenario: Default theme on first load
- **WHEN** a user opens the app with no persisted theme preference
- **THEN** the iPod renders with a black case (`#1A1A1A`)
- **AND** the click wheel renders with the dark gradient `linear-gradient(180deg, #1C1C1E, #202022, #252527)`
- **AND** the wheel border is `#2C2C2E`
- **AND** the MENU label and skip icons render in white

#### Scenario: Toggling to white theme
- **WHEN** the user toggles the theme to `white`
- **THEN** the case color updates to `#F5F5F7`
- **AND** the click wheel renders with the light gradient token set
- **AND** the screen surround adapts to the light-case surround values
- **AND** the view-mode toolbar `IconButton` default state switches to the light gradient variant

#### Scenario: Legacy silver preference migration
- **WHEN** a returning user has `ipod-theme=silver` persisted in localStorage
- **THEN** the hook reads the value as `white` and overwrites the stored key with `white`
- **AND** no visual flicker occurs during hydration

### Requirement: Theme-Aware Toolbar Chrome
The system SHALL render `IconButton` components with a default (non-active, non-contrast) appearance that follows the active iPod theme. Buttons in `isActive` or `contrast` variants MUST keep their dark filled styling regardless of theme so they remain visually distinct.

#### Scenario: Black theme toolbar
- **WHEN** the iPod theme is `black`
- **THEN** every `IconButton` in its default state renders with `bg-[#111315]`, `text-white`, and the dark shadow stack
- **AND** buttons with `isActive={true}` render with the same dark fill plus the active ring and `scale-[1.04]`

#### Scenario: White theme toolbar
- **WHEN** the iPod theme is `white`
- **THEN** every `IconButton` in its default state renders with the light gradient `linear-gradient(180deg, rgba(255,255,255,0.98), rgba(237,239,242,0.96))`, `text-[#111315]`, and the light shadow stack
- **AND** buttons with `isActive={true}` render with the dark fill so the active selection is still obvious

### Requirement: Grouped View-Mode Button Ordering
The view-mode `IconButton` list SHALL render working modes grouped above in-progress (WIP) modes, so the user scans shipped affordances first and experimental modes second.

#### Scenario: View-mode toolbar order
- **WHEN** the view-mode toolbar renders
- **THEN** the vertical order is: Flat, Preview, Focus, 3D Experience (WIP), ASCII Mode (WIP)
- **AND** the two WIP-tagged buttons appear contiguously at the bottom

### Requirement: Typographic WIP Badge
The WIP badge on `IconButton` SHALL be presented as pure typography — no fill color, no border chip — so it reads as a label rather than a warning sticker.

#### Scenario: WIP badge styling
- **WHEN** an `IconButton` is rendered with `badge="WIP"`
- **THEN** the badge renders as small uppercase letter-spaced text in a muted foreground color
- **AND** the badge has no background fill and no colored border
- **AND** the badge position remains anchored to the top-right of the button

## MODIFIED Requirements

### Requirement: Dynamic Wheel-to-Case Color Coupling
The system SHALL derive click wheel surface color, label color, and icon color from the current case color using luminance analysis. Dark cases (L < 0.18) MUST produce the authentic iPod 6G dark wheel using gradient `from #1C1C1E, via #202022, to #252527` and border `#2C2C2E`, matching the original hardware shader. Mid-dark cases (0.18 ≤ L < 0.45) MUST produce a charcoal wheel. Light cases (L ≥ 0.45) MUST produce the iPod 6G silver wheel with grey labels.

#### Scenario: Black case selected
- **WHEN** the user selects a case color with luminance below 0.18 (e.g., `#1A1A1A`)
- **THEN** the click wheel surface renders with the gradient `linear-gradient(180deg, #1C1C1E, #202022, #252527)`
- **AND** the wheel border renders as `#2C2C2E`
- **AND** the MENU label, skip icons, and play/pause glyph render in white (`#FFFFFF`)
- **AND** the center button renders with a subtle lighter-than-wheel fill

#### Scenario: White case selected
- **WHEN** the user selects a case color with luminance at or above 0.45 (e.g., `#F5F5F7`)
- **THEN** the click wheel surface renders with the iPod 6G silver gradient
- **AND** the MENU label, skip icons, and play/pause glyph render in grey (`#8E8E93`)
- **AND** the center button renders with a subtle lighter-than-wheel fill

## REMOVED Requirements

### Requirement: OKLCH Grid Color Pickers in Theme Panel
**Reason:** Redundant with Authentic Apple Releases + GreyPalettePicker + HexColorInput + eyedropper. The OKLCH grids added decision fatigue without shipping meaningful palette coverage.
**Migration:** Users can still pick any hex via the HexColorInput or eyedropper, and the Authentic Apple Releases grid remains the primary discoverable path.

### Requirement: ASCII Mode Explanatory Notice
**Reason:** The floating "Terminal-style Now Playing" card duplicated information already visible via the WIP-tagged ASCII IconButton tooltip, and pushed the preview down on small viewports.
**Migration:** None required — the ASCII view mode itself is unchanged; only the instructional card is removed.
