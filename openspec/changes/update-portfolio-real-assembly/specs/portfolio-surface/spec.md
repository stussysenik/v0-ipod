## ADDED Requirements

### Requirement: Portfolio Renders the Real iPod Assembly

`/portfolio` and `/3d-portfolio` SHALL render through the shared physical assembly — `IpodDevice` /
`ThreeDIpod` plus `IpodClickWheel` — the same component and typography design system used by `/` and
`/3d`. `/portfolio` uses the flat 2D shell; `/3d-portfolio` uses the 3D shell; both host the same
feed-driven screen and wheel nodes. Neither SHALL use a bespoke device surface (no ad-hoc
`.ipod-device` CSS substitute, no emoji transport buttons as the primary control). Content is the
only thing the feed adjusts; the chassis and wheel are reused, not reskinned.

#### Scenario: Real chassis and wheel are mounted on both routes

- **WHEN** `/portfolio` or `/3d-portfolio` loads
- **THEN** the device is the real assembly (`IpodDevice` flat, or `ThreeDIpod` in 3D) with its
  hardware preset (machined chamfer, specular sheen, gasket) and the control is an `IpodClickWheel`,
  identical in kind to the device on `/` and `/3d`

#### Scenario: Shared screen across both shells

- **WHEN** the same feed work is opened on `/portfolio` and on `/3d-portfolio`
- **THEN** both render the same feed-driven screen and wheel nodes; only the device shell differs

#### Scenario: No bespoke device fallback

- **WHEN** either route is inspected
- **THEN** the primary navigation control is the real click wheel, not four emoji transport buttons,
  and the device is not a hand-rolled CSS stand-in

### Requirement: Faithful Wheel-Driven Navigation

The click wheel SHALL drive navigation faithfully: rotation maps to previous/next focus, the center
button selects (drill-in / open work), and MENU goes back. Keyboard parity (arrows / Enter / Escape)
SHALL be preserved. Navigation logic SHALL remain in the pure `lib/nav` machine; the screen and wheel
bind to it through a tested adapter with no business logic in the presentation layer.

#### Scenario: Wheel scrub moves the cursor

- **WHEN** the user rotates the wheel on a list screen
- **THEN** focus advances to the next or previous row (with wrap), matching the nav machine's reducer

#### Scenario: Center opens, MENU returns

- **WHEN** the user presses center on a focused work and then presses MENU
- **THEN** the work opens its case study, and MENU returns to the prior list with focus restored

### Requirement: Scrolling Case Studies Respect the Keep-Out Law

A selected work SHALL expand into a scrolling case-study surface that obeys the keep-out structural
law: content scrolls within the device screen and/or docks in an exclusive rail, and SHALL NOT
z-index over the device cell. The surface SHALL be correct on mobile and all breakpoints — no
device/rail overlap, no horizontal overflow.

#### Scenario: Case study docks without overlapping the device

- **WHEN** a work is opened at 390px portrait and at 1280px
- **THEN** the expanded surface docks in a rail (below the device when narrow, beside it when wide),
  scrolls vertically, and never overlaps the device cell or causes horizontal scroll

### Requirement: Single Canonical Feed Source Preserved

`/portfolio` SHALL remain driven by `content/senik.feed.json` through the pure nav machine — the same
data source that drives `/whitelabel` and the Lit embeddable. The on-screen content SHALL be a
feed-driven projection (generic work/writing/about/link renderers), not a hardcoded per-screen
switch. `IpodFeedBrowser` SHALL remain available as the portable renderer for `/whitelabel` and the
embeddable.

#### Scenario: One source of truth

- **WHEN** the feed is updated
- **THEN** `/portfolio` reflects the change with no code edit, and `/whitelabel` continues to render
  the same feed through the portable renderer
