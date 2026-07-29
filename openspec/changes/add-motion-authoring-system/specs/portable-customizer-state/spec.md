## ADDED Requirements

### Requirement: A shared look SHALL carry its motion

The portable state payload SHALL include the authored motion — document identity, sparse
overrides, repeat count, duration and time map — so that a received link reproduces the motion
as well as the finish and the lighting. The playhead position SHALL be excluded at the codec
boundary, in the same way transient editing flags already are, because it is a live transport
position and not part of the look.

#### Scenario: A link reproduces the motion

- **WHEN** a user copies a share link after authoring a custom motion and another opens it
- **THEN** the received studio flies the same motion at the same repeat count and duration

#### Scenario: The playhead does not travel

- **WHEN** a link is copied mid-scrub
- **THEN** the received studio opens at the start of the clip, not at the sender's playhead

#### Scenario: A pre-motion payload still decodes

- **WHEN** a payload written before this change is decoded
- **THEN** it decodes successfully, its retired `speed` value is converted to the equivalent
  repeat count, and the motion heals to the default document rather than failing the decode
