# portfolio-content

## ADDED Requirements

### Requirement: Portfolio mirrors stussysenik.com

The portfolio feed SHALL mirror the live content of stussysenik.com — via
`lib/portfolio/data.ts` compiled into `content/senik.feed.json` — as
snapshotted in this change's `design.md` (D5): identity "Mengxuan 'Senik' Zou —
R&D Experience Design Engineer, NYC / Prague", the eleven dated works with their
titles and links, the process statement, the education history, the GitHub link,
and the footer line. Works not present on the live site MUST NOT appear, and both
`/portfolio` and `/3d-portfolio` SHALL inherit the update through the shared feed
with no per-page content forks.

#### Scenario: Works list matches the live site

- **WHEN** `/portfolio` renders the works section
- **THEN** it lists exactly the eleven works from the D5 snapshot, newest first
  (2026.01 → 2024.10), each with its live link

#### Scenario: Both portfolio surfaces agree

- **WHEN** `/portfolio` and `/3d-portfolio` are compared
- **THEN** they present identical feed content, differing only in device shell

### Requirement: The feed is derived from data.ts, never hand-authored

`content/senik.feed.json` SHALL be generated from `lib/portfolio/data.ts` by
`lib/portfolio/build-feed.ts` (via `pnpm feed:build`), and a unit test SHALL fail when
the checked-in JSON no longer equals the builder's output. The rendered surfaces read
the JSON, so a hand-edit to either file alone is a silent content bug — this is the
mechanism that makes the two incapable of drifting rather than merely asking reviewers
to notice.

#### Scenario: An edit to data.ts that never reached the feed fails the build

- **WHEN** `lib/portfolio/data.ts` is changed and `pnpm feed:build` is not run
- **THEN** `pnpm test:unit` fails, naming `pnpm feed:build` as the fix

#### Scenario: A hand-edit to the feed is rejected

- **WHEN** `content/senik.feed.json` is edited directly
- **THEN** the freshness test fails, because the builder is the only writer

### Requirement: Works carry a stable slug

Each work SHALL declare its own kebab-case `slug` in `lib/portfolio/data.ts`, and the
feed SHALL address works by it. The slug is the permalink the feed indexes by, so it is
authored rather than derived from the title — retitling a work MUST NOT silently break
a link that is already in the wild.

#### Scenario: Retitling a work preserves its address

- **WHEN** a work's `title` changes but its `slug` does not
- **THEN** the work resolves at the same slug in `worksBySlug`

### Requirement: Sections absent from the canonical site are archived, not deleted

Portfolio sections the live site does not serve — Writing, Labs, Likes — SHALL be hidden
behind `lib/feature-flags.ts` flags, with their content, screens and menu rows left
intact (D6). Flipping a flag and rebuilding the feed MUST restore the whole section.
Unfinished content on a link sent to designers reads as an unfinished product, but the
project must keep room to grow back into these surfaces.

#### Scenario: The root menu serves only the canonical sections

- **WHEN** `/portfolio` renders its root menu with the archive flags false
- **THEN** the rows are exactly Works · Process · About · Contact

#### Scenario: One flag flip restores a section

- **WHEN** `SHOW_PORTFOLIO_LABS` is set true and the feed is rebuilt
- **THEN** the Labs section and every experiment behind it render again
