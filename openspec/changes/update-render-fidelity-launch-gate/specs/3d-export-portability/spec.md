# 3d-export-portability

## ADDED Requirements

### Requirement: Export delivery SHALL reach the device through a platform-correct channel

The `/3d` still and clip exports SHALL hand the finished blob to the device through the
same capability-aware delivery the 2D exports use — a direct download on desktop, and an
in-page share / save / preview prompt on mobile. A synthetic `<a download>` click (which
silently no-ops on iOS Safari) SHALL NOT be the mobile delivery path. Delivery routing is
a pure function of detected capabilities (`planExportDelivery`) so the boundary is unit-
guarded.

#### Scenario: A still exported from an iPhone reaches the device

- **WHEN** a user on iOS Safari exports a PNG from `/3d`
- **THEN** the render is offered via the system share sheet / save picker / inline
  preview (never a synthetic download), so the file actually lands on the device

#### Scenario: Desktop keeps the direct download

- **WHEN** a user on a desktop browser exports a still or clip
- **THEN** the blob downloads directly, unchanged from prior behavior

### Requirement: The offscreen export target SHALL scale to the device's GPU limits

The high-resolution capture SHALL clamp its render-target dimensions and MSAA sample
count to what the active WebGL context reports (`MAX_TEXTURE_SIZE`, `MAX_SAMPLES`,
`MAX_RENDERBUFFER_SIZE`) rather than allocating a fixed 4K / 8× target that exceeds a
mobile GPU's budget and drops the context.

#### Scenario: A phone requests a 4K still

- **WHEN** the requested export exceeds the device's reported texture or sample limits
- **THEN** the target is reduced to the largest supported size/sample count and the
  export proceeds, instead of allocating an over-budget target that loses the context

### Requirement: Export SHALL fail safe on WebGL context loss

The capture path SHALL check for a lost WebGL context before reading pixels and abort
with a surfaced, non-fatal error rather than producing a blank or corrupt file or hanging
on the encoder.

#### Scenario: The context drops mid-export

- **WHEN** the GL context is lost during a capture (`isContextLost()` is true)
- **THEN** the export aborts, the UI reports it, and the app returns to an interactive
  state without a wedged veil or a black image
