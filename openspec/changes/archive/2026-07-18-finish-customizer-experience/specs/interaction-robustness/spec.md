## ADDED Requirements

### Requirement: Observable Error Boundary
The workbench and the 3D stage SHALL be wrapped in an error boundary that renders
an identifiable fallback (`data-testid="app-error-fallback"`) with a reset
action, so render-time exceptions never produce a silent blank screen.

#### Scenario: Render throw shows fallback
- **WHEN** a child component throws during render
- **THEN** the fallback with the reset action renders instead of a blank page

### Requirement: WebGL Context-Loss Recovery
The 3D canvas SHALL handle `webglcontextlost` by preventing default (permitting
restoration) and surfacing a non-blocking notice, and SHALL resume rendering
after `webglcontextrestored` without a page reload.

#### Scenario: Context loss recovers
- **WHEN** the WebGL context is lost and subsequently restored
- **THEN** the scene resumes rendering and no unhandled error is thrown

### Requirement: Camera Gesture Finiteness
Camera rig math SHALL keep azimuth, polar, and radius finite and within clamps
under any pointer sequence, including coincident-pointer pinches (a minimum
pinch-spread floor) and rapid opposing gestures; gesture listeners SHALL restore
any canvas style mutations on unmount.

#### Scenario: Coincident pinch cannot jump the camera
- **WHEN** a second pointer lands at (or within the spread floor of) the first
- **THEN** the zoom radius change is bounded and all camera values remain finite

#### Scenario: Gesture storm stays finite
- **WHEN** a randomized storm of orbit/pinch/wheel deltas is applied
- **THEN** every resulting camera value is finite and within its clamp range

### Requirement: Bounded Light Intensities
Lighting configuration sanitization SHALL clamp environment, spot, and softbox
intensities to documented upper bounds so corrupt or hand-edited values cannot
clip the un-tone-mapped render to white.

#### Scenario: Oversized intensity is clamped
- **WHEN** a lighting config with an extreme intensity is loaded
- **THEN** the sanitized value is at most the documented ceiling

### Requirement: Rapid-Interaction Stability
The 2D customizer SHALL withstand deterministic input storms (control spam,
panel drag storms, view-mode toggling) with zero page errors, zero error-boundary
activations, and full interactivity afterward, enforced by an automated test
suite.

#### Scenario: Input storm leaves app healthy
- **WHEN** the automated storm suite drives rapid clicks, toggles, and drags
- **THEN** no page error is recorded, the error fallback never mounts, and a
  subsequent normal interaction produces its expected state change
