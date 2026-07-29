# 3d-control-surface

## MODIFIED Requirements

### Requirement: Controls take visual focus over the device
The control surface (HUD panels, cockpits, bottom bar, command surface) SHALL render
ABOVE the iPod canvas with a clear, consistent z-order so the controls always have focus
priority over the 3D device. Controls SHALL remain interactive (pointer events reach them,
not the canvas behind) and SHALL never be occluded or clipped by the canvas. Where the canvas
is NOT covered by a control, it SHALL remain hit-testable so the device itself can be used as
a selection surface; control chrome SHALL NOT be extended over the device merely to catch
stray pointer events.

#### Scenario: Panels sit above the canvas
- **WHEN** a control panel overlaps the device region on screen
- **THEN** the panel renders on top of the device and receives clicks/taps, not the canvas

#### Scenario: Controls keep focus while the device animates
- **WHEN** the device is animating or being orbited
- **THEN** the controls stay visible and on top, never hidden behind the render

#### Scenario: The uncovered device remains selectable
- **WHEN** the user clicks a region of the device not overlapped by any control
- **THEN** the canvas receives the event and the corresponding part is selected

## ADDED Requirements

### Requirement: The control surface is selection-driven, not permanently mounted

The `/3d` control surface SHALL present the device as a navigable structure of its parts, and
SHALL reveal a part's parameters only while that part is selected. Controls for unselected
parts SHALL NOT occupy the surface. No panel SHALL be permanently mounted except the structure
itself and the record of edits.

A parameter SHALL appear under exactly one part. A control whose owning part is ambiguous is
a signal that the part model is wrong, and SHALL be resolved by naming the part rather than by
creating a general-purpose panel to hold orphans.

#### Scenario: Only the selected part's parameters are shown

- **WHEN** a part is selected
- **THEN** the inspector shows that part's parameters and no others

#### Scenario: Selecting in the viewport and in the tree agree

- **WHEN** the user clicks a part on the device, and separately selects the same part in the
  structure list
- **THEN** both produce the same selection and the same inspector contents

#### Scenario: No parameter has two homes

- **WHEN** the surface is enumerated
- **THEN** each parameter is reachable through exactly one part, with no duplicate control
  for it elsewhere on the surface

### Requirement: Edits are presented chronologically as a record

The control surface SHALL present the decision log as an ordered record of edits, one row per
layer, each of which can be disabled, reverted, or re-edited in place. Disabling a row SHALL
take effect on the live device immediately. The record SHALL sit apart from the structure of
the object, so that what the device *is* and what has been *done to it* are never read from
the same list.

#### Scenario: An edit appears as a row

- **WHEN** the user changes a part's parameter
- **THEN** a row describing that change appears in the record

#### Scenario: Disabling a row updates the device

- **WHEN** a row in the record is disabled
- **THEN** the device updates to reflect the model without that decision

#### Scenario: A continuous drag produces one row

- **WHEN** a control is dragged continuously
- **THEN** the record gains exactly one row for that gesture

### Requirement: Development controls are separated from the product surface

The product control surface SHALL contain only controls that customise the device. Controls
that exist to develop the tool — layout bounding boxes, the keyframe timeline overlay, and any
successor — SHALL be reachable only from a separate development affordance, and that
affordance SHALL be absent from production builds.

#### Scenario: Dev toggles are absent from the product surface

- **WHEN** the control surface is rendered
- **THEN** no development-only toggle appears among the device's parameters

#### Scenario: Dev affordance is absent in production

- **WHEN** the application is built for production
- **THEN** the development affordance is not present in the output
