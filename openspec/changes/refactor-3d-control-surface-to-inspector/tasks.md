# Tasks — refactor-3d-control-surface-to-inspector

**Do not start until `adopt-studio-control-language` is green and `add-customizer-decision-log`
has landed its fold-equivalence test.** Starting earlier means restyling the same nine files
twice and building the record rail against a log whose invariant is unproven.

This change **moves pixels on the surface the launch exposes**. Per repo law, tasks 4 and 6
stop for the owner's review with screenshots. Nothing hardens into spec before that.

- [ ] 1. Name the parts. `lib/customizer/parts.ts`: a closed part tree — Case, Wheel (Ring,
      Centre), Front, Back, Edge, Bezel, Screen, Ports; then Stage: Backdrop, Lighting,
      Camera. It MUST agree 1:1 with `DecisionTarget` from the decision log; two part
      vocabularies is the same defect as two control systems.
- [ ] 2. Assign every existing control to exactly one part. Produce the mapping as a table
      before writing components — an orphan means the part model is wrong, and the fix is to
      name the missing part, never to invent a general panel to hold it (spec: "no parameter
      has two homes").
  - [ ] 2.1 Rule the four current orphans explicitly: `marquee` → Screen, `showPorts` →
        Ports, `interactionLocked` → Screen, `interactionModel` → Screen.
- [ ] 3. Left rail: structure list + inspector beneath the selection. One part expanded at a
      time.
- [ ] 4. **Review gate.** Screenshot the left rail against today's five stacked cockpits, at
      desktop and 390×844. Stop.
- [ ] 5. Viewport selection: raycast a click on the device to its part, driving the same
      selection state as the tree. Verify the canvas stays hit-testable where uncovered, and
      that no control chrome was widened to swallow stray events (the MODIFIED requirement).
- [ ] 6. Right rail: the layer projection as rows — disable, revert, re-edit in place — with
      the export shelf beneath, restoring through the existing `proof-restore.ts`.
  - [ ] 6.1 **Review gate.** Screenshot. Stop.
- [ ] 7. Subtract:
  - [ ] 7.1 `layoutMode` and `theatreStudio` out of the product surface into a dev drawer,
        absent from production builds.
  - [ ] 7.2 Remove `panel-registry` entries duplicating a part inspector; re-route their ⌘K
        commands. Verify no command is orphaned — `unify-experience-truth` 3.4 hit exactly
        this trap once, where a rail button carried the only path to `RESET_MODEL`.
- [ ] 8. Chrome ownership:
  - [ ] 8.1 Widen `solveControlTokens(stageBackground)` → `solveControlTokens(spec: ChromeSpec)`,
        keeping stage-derived behaviour as the default specification so nothing changes for a
        user who never opens Settings.
  - [ ] 8.2 Add `radius` and `density` to the token set; route `CONTROL_RADIUS` /
        `SURFACE_RADIUS` through it, preserving the concentric `+4` relationship.
  - [ ] 8.3 Property test: for a swept space of specifications, every solved palette clears
        the text and non-text floors. This is the same discipline as the colour work — a gate
        that only checks the passing case is not a gate.
  - [ ] 8.4 Surface it in `settings-panel-body.tsx`; persist with the model.
- [ ] 9. Green tree: `pnpm test:unit`, `pnpm type-check`, `pnpm lint`, story coverage. The
      `adopt-studio-control-language` lint gate must stay green — this change adds surfaces
      and must not reintroduce raw buttons or ad-hoc radii.
- [ ] 10. Responsive pass at 390×844 and desktop against `mobile-responsive-layout`. Attach
      before/after.
