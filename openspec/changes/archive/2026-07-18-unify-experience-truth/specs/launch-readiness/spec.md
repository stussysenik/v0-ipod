# launch-readiness

## ADDED Requirements

### Requirement: Production is the verified artifact

Launch verification SHALL run against the deployed production (or
promotion-candidate preview) URL. A gate item passing on localhost SHALL NOT
count as launch-passing — prod builds differ (minification, caching, env).

#### Scenario: Gate repeated on the deployment

- **WHEN** the section-7 visual pass has passed on localhost
- **THEN** the same pass is repeated against the deployed URL at 390×844/DPR 3
  and desktop before the change is considered launchable

### Requirement: The audience path is the tested path

The launch SHALL be verified once along the actual audience path: the production
link opened on a physical iPhone from a tweet/iMessage context (X in-app browser
or iOS Safari). The device SHALL render framed with one bottom bar, wheel and
camera gestures SHALL respond, and no chrome SHALL collide with safe areas.

#### Scenario: Tweet tap on a real phone

- **WHEN** the production URL is opened on a physical iPhone from the X app or
  iMessage
- **THEN** the unfurl card shows, the Noir device loads framed, and touch
  interaction works without layout collisions

### Requirement: Motion holds on mobile

Camera pose transitions and wheel interaction SHALL sustain smooth frame pacing
on the deployed `/3d` at mobile emulation (no sustained dropped-frame stutter
under a performance trace), and the framed device SHALL reach first meaningful
paint without blocking on non-essential resources.

#### Scenario: Pose transition under trace

- **WHEN** a performance trace is recorded while switching poses on the deployed
  `/3d` at mobile emulation
- **THEN** the transition shows no sustained long-frame jank attributable to the
  page's own work

### Requirement: Launch is observable and reversible

At promotion time, analytics events SHALL be confirmed firing from the
production deployment, and the previous known-good deployment SHALL be
identified as the instant-rollback target.

#### Scenario: Promotion with a way back

- **WHEN** the change is promoted to production
- **THEN** a PostHog event from the prod URL is observed and the prior Vercel
  deployment is noted as the rollback target
