# 3d-screen-integration

## ADDED Requirements

### Requirement: The screen SHALL read as a recessed, glazed component of the device

The live Now Playing screen SHALL carry the same optical events as the surrounding
WebGL device — a bezel recess (inner shadow at the LCD boundary) and a glass sweep —
derived as pure functions of the same camera/lighting state, so the screen reads as
hardware, not a pasted decal, at every camera pose.

#### Scenario: Hero ¾ pose on a dark finish

- **WHEN** the device is viewed at the hero ¾ pose with a black finish
- **THEN** the screen shows a visible recess boundary against the bezel and a glass
  sweep consistent with the camera azimuth
- **AND** the live-view treatment matches the exported capture's glass treatment

#### Scenario: Screen remains inline-editable

- **WHEN** the user taps title/artist/album/rating on the 3D screen
- **THEN** inline editing works exactly as before (the DOM overlay is retained; only
  its optical treatment changes)

### Requirement: The DOM/WebGL seam SHALL produce no visible artifacts

No WebGL specular, emissive, or lighting response SHALL leak past the DOM screen
overlay's bounds (e.g. the green haze at the screen's top edge in the 2026-07 mobile
screenshot) at any camera pose or finish.

#### Scenario: Specular leak eliminated at the failing pose

- **WHEN** the device is orbited through the pose that previously showed the green
  edge haze
- **THEN** no color fringe or glow appears outside the screen's glass boundary
