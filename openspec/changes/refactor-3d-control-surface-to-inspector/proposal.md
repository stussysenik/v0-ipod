# Change: Left is space, right is time — the /3d surface becomes an inspector

## Why

Act 2 of the anniversary arc (`add-customizer-decision-log/design.md` §0): *the instrument is
legible*. Today it is not, and the reason is structural rather than cosmetic.

Seven cockpit cards are permanently mounted across two absolutely-positioned rails
(`ipod-3d-stage.tsx:907` and `:938`), each a bag of unrelated controls — the Studio card
alone holds interaction mode, an editing lock, marquee, chassis ports, and two dev-only
toggles. **A control's only link to the thing it changes is its name.** That is the confusing
relationship, and it is also why every option must be on screen at once: retained-mode chrome
has nowhere to put a control except permanently in front of you.

The Apple lens question this answers is *"does the chrome disappear?"* — the object should be
the hero and the surface should recede. Seven cards cannot recede.

There is also a second, competing control system: `panel-registry.tsx` duplicates cockpit
functions, already ruled a defect by `adopt-studio-control-language` task 5.

And the chrome itself is solved but not **owned**: `solveControlTokens` is already
`UI = f(state)` with WCAG floors, but its input is hardcoded to the stage colour and radius
and density are not in the token set at all — so there is no way for a person to set the
global style and colour of their controls.

## What Changes

- **Left rail becomes the object.** A parts tree mirroring the scene graph — Case, Wheel,
  Front, Back, Edge, Bezel, Screen, Ports, then Stage: Backdrop, Lighting, Camera. Selecting
  a part opens an inspector directly beneath it showing **only that part's** parameters.
- **Clicking a part in the 3D viewport drives the same selection**, making the
  control↔object relationship spatial rather than nominal.
- **Right rail becomes the record.** The layer projection from `customizer-decision-log`,
  chronological, each row toggle / revert / re-edit in place; beneath it the export shelf,
  each entry restorable through the existing `proof-restore.ts` path.
- **Subtraction.** Dev-only toggles (`layoutMode`, `theatreStudio`) leave the product surface
  for a dev drawer. `marquee` and `showPorts` become properties of the parts they belong to.
  Duplicate `panel-registry` entries are removed and their ⌘K commands re-routed.
- **Chrome becomes owned.** `solveControlTokens(stageBackground)` widens to
  `solveControlTokens(spec: ChromeSpec)` where `ChromeSpec = { tint, radius, density, weight }`,
  surfaced in Settings. The palette stays *solved* and contrast-floored — that module's whole
  thesis — but the input becomes the user's.

## Impact

- Affected specs: `3d-control-surface` (MODIFIED — canvas hit-testing; ADDED — selection-driven
  inspection, the record rail, product/dev separation), `design-system-foundation` (ADDED —
  chrome spec is user-owned but still solved).
- Affected code: `components/ipod/scenes/ipod-3d-stage.tsx` (rails), the eight
  `ipod-3d-*-cockpit`/`-dock`/`-panel` files (~2,627 lines, dissolved into tree + inspector),
  `components/ipod/panels/panel-registry.tsx`, `lib/studio-control-tokens.ts`,
  `components/ui/studio-controls.tsx`, `components/ipod/panels/settings-panel-body.tsx`.
- **Depends on `adopt-studio-control-language`** (not started; `make board` for the count —
  never hand-copied here, that is the drift the board exists to kill). That change drives 30 raw buttons, 17
  pills and 40 ad-hoc radii to zero across the same nine files this one rewrites. Landing this
  first means restyling twice — and `ChromeSpec.radius` cannot exist until radius comes from
  `CONTROL_RADIUS`.
- **Depends on `add-customizer-decision-log`** for the right rail's contents.
- This change moves pixels on the surface the launch exposes. Per repo law, **it gates on the
  owner's visual review** before any of it hardens.
