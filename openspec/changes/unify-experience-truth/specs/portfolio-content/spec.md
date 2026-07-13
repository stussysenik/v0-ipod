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
