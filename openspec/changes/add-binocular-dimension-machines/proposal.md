# Change: Three barrels, one focus — dimension as a binocular

## Why

`/` and `/3d` are two state models that have never disagreed because they never meet.
`ipodCentralMachine` is mounted app-wide (`app/layout.tsx:126`) and drives the flat iPod;
`/3d` runs its own `useReducer(ipodWorkbenchReducer)` (`ipod-3d-stage.tsx:112`). A dimension
the visitor chooses makes them meet.

The obvious move is to merge them, and it is the wrong one. Merging two live models is the
riskiest change in the repo and it forecloses experiment. A binocular does not merge its
barrels — it gives them one focus:

- **Barrel** — one machine per dimension. No barrel imports a sibling, so a barrel cannot
  break one, and a fourth costs nothing to try.
- **Focus** — the shared document. Switching dimension changes which barrel you look through,
  never what you are looking at.
- **Diopter** — a per-barrel sparse override. Empty means the barrel tracks the document.

That last shape is not new here. Theme rig, motion document, `sanitizeSpot` and
`applyTrackEdit` are four instances of base-plus-sparse-diff, and each cost a session to get
right. The law they produced applies unchanged: when the base absorbs the diff, the diff is
dropped in the same gesture, or the barrel silently stops tracking forever after.

Two consequences worth stating before they surprise anyone:

- **This is what gives `/` a history.** `add-customizer-decision-log` as written wraps the
  reducer at `/3d`'s single host, so it logs the studio and leaves the flat iPod without one.
  The focus is the thing both barrels project, so the log attaches once.
- **`surface-mode-switching` currently ratifies the opposite.** It states that `/3d` is the
  only 3D surface and that switching is route navigation carrying customization along. A
  dimension axis contradicts both, so this change amends that spec rather than sitting beside it.

## What Changes

- Extract the **focus**: the configuration both models already hold, as one document with one
  owner. Neither existing model is deleted in this change; each becomes a barrel reading it.
- Declare the **barrel contract**: a barrel reads the focus and its own diopter, and imports no
  sibling barrel. Enforced by a gate on the import graph, not by convention.
- Add the **2.5D barrel** — real geometry under an orthographic projection with a constrained
  rig, pointer response expressed as a low-amplitude motion document that returns to the hero
  seam. Layered-parallax flat art is ruled out on mechanism: a finish here is a material under
  light, so a flat fill cannot carry an attested one, and a barrel that cannot carry attestation
  must not present it.
- Measure **projection translation**: move a position in one barrel, land it in the others, and
  record the round-trip deviation per axis. `lib/motion/port-deviation.ts` already does exactly
  this for ported motion documents; same pattern, new axis.
- Amend `surface-mode-switching`: the visible toggle becomes a three-position dimension control,
  and a route names a barrel rather than owning a surface.

## Impact

- Affected specs: `dimension-binocular` (ADDED), `surface-mode-switching` (MODIFIED — both
  requirements). `browser-navigation` is unchanged: a route still names a reachable address, it
  now names a barrel rather than a surface, so existing links and the PWA keep working.
- Affected code: `lib/dimension/**` (new), `lib/xstate/central-machine.ts`,
  `components/ipod/scenes/ipod-3d-stage.tsx`, `app/page.tsx`, `app/3d/page.tsx`.
- **Depends on `add-artifact-budget-gates`.** A third renderer added while nothing measures wire
  bytes or frames on the target machine is how the budget gets missed, and the ceiling must come
  from a reading taken before the barrel exists.
- Blocks: nothing, but `add-customizer-decision-log` attaches to the focus rather than to one
  host once this lands, which is what makes the log cover both dimensions.
- **The 2.5D barrel's art direction is owner-gated and currently unnamed.** Its machine boundary
  is not — a barrel is a barrel whatever it draws — so every other task proceeds. §4 is the only
  section that waits.
- **Pixel-neutral by design for 2D and 3D.** If either existing barrel renders differently after
  the focus extraction, that is a defect in the extraction, not a consequence of it.
