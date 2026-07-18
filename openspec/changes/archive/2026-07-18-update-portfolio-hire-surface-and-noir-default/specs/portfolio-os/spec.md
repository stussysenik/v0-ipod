## ADDED Requirements

### Requirement: Hire Surface on the Portfolio OS

The portfolio OS SHALL serve a "Hire Me" section sourced from the
portfolio-forever hiring manifest: a mission statement, five hiring tracks
(design engineer, AI product craft, frontend systems, mobile engineering,
ML & research), four proof pillars, and contact rows that deep-link to email
and profiles. The root menu SHALL lead with proof: Works first, Hire Me second.

#### Scenario: Recruiter reaches contact in three gestures

- **WHEN** a visitor on the root menu scrolls to "Hire Me", selects it, and selects "Contact"
- **THEN** contact rows are listed and activating the email row opens a `mailto:` link

#### Scenario: Hiring tracks browsable on-device

- **WHEN** the visitor opens Hire Me → Tracks and selects a track
- **THEN** the track's summary renders as an iPod content screen with wheel stepping between sibling tracks

### Requirement: Noir Portfolio Presentation

`/portfolio` SHALL present the canonical noir device — black case, explicit
wheel overrides, Designer Dark rig — on the `#0048FF` stage, with identity and
hint overlays inked for the dark stage.

#### Scenario: Portfolio matches the studio default

- **WHEN** a visitor opens `/portfolio` with no persisted state
- **THEN** the device colors and lighting equal the `/3d` factory default and the page background is `#0048FF`

### Requirement: Mobile-First Wheel Lock

On coarse-pointer (touch) devices the portfolio stage SHALL default to a locked
camera so wheel gestures never fight orbit panning, SHALL suppress browser
scroll/zoom gestures over the stage, and SHALL expose a toggle to re-enable
orbit. The wheel SHALL remain operable on viewports down to 320px wide.

#### Scenario: iPhone visitor uses the wheel immediately

- **WHEN** a visitor on an iPhone-class touch viewport (≤ 393px wide) drags a circle on the click wheel
- **THEN** the menu cursor moves and the page does not scroll, zoom, or orbit the camera

#### Scenario: Orbit is opt-in on touch

- **WHEN** the touch visitor activates the orbit toggle
- **THEN** stage drags orbit the camera until the toggle is returned to locked
