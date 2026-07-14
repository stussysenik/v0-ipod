# Tasks — adopt-studio-control-language

Split out of `unify-experience-truth` §4 after that change shipped. Read its `design.md`
D10 (machined radius) first — the radius rule here is that decision, not a new one.

The inventory in `proposal.md` is the baseline: **30 raw `<button>`, 17 `rounded-full`,
40 ad-hoc radii** across nine files. Those three numbers reaching zero *is* the change.

This is a **restyle, not a refactor**. No task here may change what a control does. If a
migration surfaces a behaviour bug, land the fix as its own commit so the restyle diff
stays reviewable by eye.

- [ ] 1. Land the lint gate first, failing. Add an `oxlint`/`ast-grep` rule (or a unit
      test over the file set, matching the repo's existing token-drift idiom) that fails
      on a raw `<button>`, a `rounded-full`, or an ad-hoc `rounded-*` inside the nine
      files. It must be **red** at this commit — a gate written after the work proves
      nothing about the work. Every task below turns part of it green.
- [ ] 2. Migrate the cockpits, largest first so the vocabulary gaps surface early — a
      missing primitive variant is a change to `studio-controls.tsx` and its spec, never
      a local override:
  - [ ] 2.1 `ipod-3d-color-cockpit.tsx` (756 lines; 7 buttons, 5 pills)
  - [ ] 2.2 `ipod-3d-export-dock.tsx` (560; 7 buttons, 4 pills, 12 ad-hoc radii)
  - [ ] 2.3 `ipod-3d-lighting-cockpit.tsx` (526; 6 buttons, 3 pills)
  - [ ] 2.4 `ipod-3d-camera-cockpit.tsx` (259; 6 buttons, no primitives imported yet)
  - [ ] 2.5 `ipod-3d-studio-cockpit.tsx` (169; 2 buttons, 2 pills)
  - [ ] 2.6 `ipod-3d-export-proof-panel.tsx` (159; 1 button, 2 pills)
  - [ ] 2.7 `ipod-3d-battery-cockpit.tsx` (82; 1 button, 1 pill)
  - [ ] 2.8 `ipod-3d-nowplaying-cockpit.tsx` (219; 0 buttons, 4 ad-hoc radii — radii only)
- [ ] 3. Migrate `/portfolio` chrome (`portfolio-feed-stage.tsx`, 97 lines, 1 ad-hoc
      radius). Small, but it is the surface a designer taps into from the shared link.
- [ ] 4. Drive the gate from task 1 to green. `pnpm lint` + `pnpm type-check` clean,
      `pnpm test:unit` green.
- [ ] 5. De-duplicate the control surfaces (the spec's third requirement, and the only
      task here that is not purely cosmetic — land it separately):
  - [ ] 5.1 List `/3d` panel-registry entries that duplicate a cockpit's function.
  - [ ] 5.2 Remove those entries; re-route their ⌘K commands to focus/open the cockpit.
  - [ ] 5.3 Verify no ⌘K command is orphaned by the removal — the trap `unify-experience-
        truth` 3.4 already hit once, where archiving a rail button would have orphaned
        `RESET_MODEL` because it had no palette command at all.
- [ ] 6. Visual regression pass: `/3d` and `/portfolio` at 390×844 and desktop, against
      the screenshots in `unify-experience-truth` §7.3. The device, its framing, and every
      control's *behaviour* must be pixel-for-pixel unchanged in what they do; only the
      chrome's corners and colours may differ. Attach before/after.
