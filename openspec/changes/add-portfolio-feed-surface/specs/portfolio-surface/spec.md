## ADDED Requirements

### Requirement: Portfolio Driven By Senik Feed

`/portfolio` SHALL render from `senik.feed.json` (mapped from `sveltekit-portfolio-forever`) through the shared iPod renderer, with every work a navigable slug that opens its case study. Content SHALL be data-driven, not hardcoded.

#### Scenario: All works are navigable

- **WHEN** `/portfolio` loads
- **THEN** every work in the feed appears in the menu and opens its preview/case study on select

#### Scenario: Feed parity with source

- **WHEN** the feed is built from the source portfolio
- **THEN** each source work has a corresponding slug entry with title, summary, and cover

### Requirement: Portfolio Responsive Parity

`/portfolio` SHALL be correct on mobile and all breakpoints via the keep-out stage — no device/HUD overlap, no horizontal overflow.

#### Scenario: Mobile portfolio is clean

- **WHEN** `/portfolio` is viewed at 390px portrait
- **THEN** the device and rails render without overlap or horizontal scroll, and works are navigable
