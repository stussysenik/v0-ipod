# Decision Ledger

Every non-trivial decision lives here: status `proposed | contested | agreed`, who holds it, confidence (0–1). Only the user promotes to `agreed`. Veto is binding — a user veto flips status to `contested` and reverts dependent artifact text the same turn.

## Adopting the factory pattern

| Decision | Status | Holder | Confidence | Date |
|---|---|---|---|---|
| Adopt valoric-style factory pattern (FACTORY.md, expanded state.json, session.log, loop.md, DECISIONS.md) | `agreed` | user | 1.0 | 2026-07-29 |
| Archive /3d mobile menu toggle — controls always visible | `proposed` | student | 0.95 | 2026-07-29 |

## Decision log

### 2026-07-29 — Adopt factory pattern

The project adopts the software factory pattern from valoric: four roles (scholar, teacher, student, user), six interlocking records, disk-only memory between sessions, no visual gate self-certified. `docs/FACTORY.md` is the operating manual, `CLAUDE.md` is the law.

**Reasoning:** The project's existing OpenSpec workflow already uses changes, proposals, specs, and tasks. Adding the factory role structure, the provenance trace, and the unattended loop contract closes the gap between "we have specs" and "we have a system that builds itself from disk."

**Source:** `docs/FACTORY.md`

### 2026-07-29 — Archive /3d mobile menu toggle

The Menu/Close hamburger button in the /3d shell header is archived to a comment block. The controls drawer is now always visible at every breakpoint.

**Reasoning:** The mobile toggle added complexity (state, transition, conditional rendering, animation classes) for a single-button drawer that desktop users never saw. Making the controls always visible collapses two layouts into one, removes a state variable, and eliminates the animation code path. The original code is preserved in an archived comment.

**Contrast:** The drawer's content (cockpit, color cockpit, now-playing, battery, camera, lighting, export) is unchanged — only the toggle button is removed.
