## ADDED Requirements

### Requirement: Short-Landscape Compact Layout
The workbench SHALL treat viewports narrower than 768px OR shorter than 480px as
compact, using the scrollable compact layout instead of an overflow-hidden
centered layout, so short landscape phones can always reach the full device and
controls.

#### Scenario: Landscape phone gets scroll escape
- **WHEN** the viewport is 844×390 (landscape phone)
- **THEN** the workbench renders the compact scrollable layout and no control or
  device region is clipped without a scroll path

### Requirement: Coordinated Bottom Band
The workbench SHALL coordinate a shared inset budget for bottom-anchored chrome
— toast notifications, the compact toolbox dock, and the soft-notice pill — so
no element renders on top of another in compact viewports.

#### Scenario: Toast clears the compact dock
- **WHEN** a toast fires while the compact toolbox dock is visible
- **THEN** the toast renders offset above the dock's band and both remain fully
  visible and tappable

### Requirement: Touch Access to Command Palette
The command palette SHALL be reachable without a keyboard: compact viewports
expose a visible trigger control in the toolbox dock that opens the palette.

#### Scenario: Palette opens by touch
- **WHEN** a compact-viewport user taps the palette trigger in the toolbox dock
- **THEN** the command palette opens and its commands are executable by touch

### Requirement: Consistent Dynamic Viewport Units
Full-height stage containers SHALL use dynamic viewport units (`dvh`) rather than
`vh`/`screen` units so mobile browser chrome changes do not jump the layout.

#### Scenario: /3d stage height is stable
- **WHEN** the /3d stage renders on a mobile browser whose URL bar collapses
- **THEN** the stage container height tracks the dynamic viewport without a
  layout jump
