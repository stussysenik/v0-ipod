# community-state-gallery

## ADDED Requirements

### Requirement: States are kept locally and published only on an explicit act

The customizer SHALL maintain a local library of saved states that functions with no backend
configured. Publishing a state SHALL require an explicit confirmation naming what becomes
public. Where no backend is configured in a production build, the gallery SHALL be disabled
rather than directed at a default host.

#### Scenario: The library works offline

- **WHEN** no gallery backend is configured
- **THEN** states can still be saved, listed, opened, and forked locally

#### Scenario: Publishing is never implicit

- **WHEN** a state is saved to the local library
- **THEN** it is not visible to anyone else until the user separately confirms publication

#### Scenario: Unconfigured production disables the gallery

- **WHEN** the application runs in production with no gallery backend configured
- **THEN** no gallery request is issued to any host and the gallery surface is absent

### Requirement: A published state carries its derivation and can be forked

A published state SHALL consist of the portable payload, the decision log that produced it,
and a proof frame. Opening a published state SHALL yield its decision log, so that continuing
from it records the point of divergence. A state continued from another SHALL record the
identity of the state it came from.

#### Scenario: Opening yields history, not just a result

- **WHEN** a user opens a published state
- **THEN** its decision log is available and its edits are visible as a record

#### Scenario: Forking records lineage

- **WHEN** a user edits an opened published state and publishes the result
- **THEN** the new state records the identity of the state it was derived from

#### Scenario: An original has no ancestor

- **WHEN** a state authored from scratch is published
- **THEN** its lineage field is empty rather than self-referential

### Requirement: Authenticity is derived from the manifest, never asserted by the publisher

For each recolourable part, a published state SHALL be labelled as an attested hardware
finish, a house colour, or a custom colour, determined by comparing its value against the
colour manifest and the house colour presets. The publisher SHALL NOT be able to set this
label by any means, including the state's title or description. A colour that does not match
an attested finish exactly SHALL be labelled custom, however close it measures.

Provenance SHALL be recomputed from the manifest when a state is displayed, so that a
correction to the manifest is reflected in previously published states.

#### Scenario: A shipped finish is named

- **WHEN** a published state's case colour matches an attested finish
- **THEN** it is labelled with that finish's name

#### Scenario: A near-miss is not rounded up

- **WHEN** a published state's colour is close to but not equal to an attested finish
- **THEN** it is labelled custom, and its distance from that finish may be shown, but it is
  never presented as the attested finish

#### Scenario: A title cannot make a claim the value does not support

- **WHEN** a publisher titles a custom colour with the name of a shipped finish
- **THEN** the provenance label still reads custom

#### Scenario: A manifest correction propagates

- **WHEN** an attested finish's value is corrected in the manifest
- **THEN** previously published states re-derive their labels against the corrected manifest

### Requirement: The gallery presents itself as a tribute, not a product

The gallery SHALL NOT display marks, logos, or branding of the manufacturer, and SHALL NOT
present itself as affiliated with or endorsed by them. It SHALL NOT offer any state, device,
or artifact for sale or present any purchase affordance. Referring to a hardware finish by the
name under which it shipped is description and SHALL remain permitted.

#### Scenario: No branding is presented

- **WHEN** any gallery surface renders
- **THEN** it displays no manufacturer logo or mark and makes no claim of affiliation

#### Scenario: No commerce affordance

- **WHEN** a published state is viewed
- **THEN** no purchase, pricing, or ordering affordance is present

### Requirement: Published user content can be reported and removed

Free-form user content that becomes public SHALL be reportable from the surface where it
appears, and SHALL be removable from public view once a report is upheld. This covers
engraving text, titles, descriptions, and track metadata.

#### Scenario: Anything public can be reported

- **WHEN** a published state displaying user-authored text is viewed
- **THEN** a report affordance is available on that surface

#### Scenario: Removal takes effect on public surfaces

- **WHEN** a report is upheld
- **THEN** the state is no longer served to gallery visitors

### Requirement: Uploaded artwork is not published unless explicitly included

A published state SHALL omit user-uploaded raster artwork by default. The publisher MAY
include it by explicit choice. Where artwork is omitted, the payload SHALL record the omission
so that a recipient renders a deliberate placeholder rather than a broken or empty state.

#### Scenario: Uploaded artwork stays private by default

- **WHEN** a state containing user-uploaded artwork is published without an explicit choice to
  include it
- **THEN** the published payload contains no raster artwork

#### Scenario: An omission is legible, not a defect

- **WHEN** a recipient opens a state whose artwork was omitted
- **THEN** the device renders a placeholder and the omission is indicated, rather than
  appearing as a failed load
