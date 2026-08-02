# Tasks: add-interface-motion-system

## 1. Name the motion

- [x] 1.1 `lib/motion-tokens.ts` — durations and easings named by job, not by length. Open with
  the mechanism and the defect: every transition in the repo is Tailwind's default by omission,
  so no surface can match another on purpose.
- [x] 1.2 Record the shipped reading before changing anything: the loved row's fade is the
  Tailwind default. Write the measured value into this file so no later task re-derives it.
- [x] 1.3 Gate: a duration or easing literal in application markup fails, naming file and value.
  The gate must fail on the pre-change tree — a gate that passes on the defect it exists to
  catch is not a gate.
- [x] 1.4 **The gate was over-broad and it cost a red suite.** It listed `animate-in`/`animate-out`
  as literals. Those are animation NAMES and state no duration and no curve — exactly like
  `animate-spin`, which the same regex passes on purpose — so the gate failed on 22 call sites
  that state no timing at all while `transition-opacity`, default-by-omission in precisely the
  same way, passed. Narrowed to what is actually written down: `duration-*`, `ease-*`,
  `animate-[…]` (a shorthand, duration included) and a bare `cubic-bezier(…)`. The timing an
  enter animation runs at is the `duration-*` beside it, which the gate still catches — asserted
  by a new self-test on `animate-in fade-in duration-500`.
- [x] 1.5 The 19 real literals migrated to jobs, in 8 files. `duration-500` → `SHIFT_JOB`
  (export dialog, progress overlay ×4, workbench stage cross-fade), `duration-300` → `SETTLE_JOB`
  (toolbox), `duration-700` → `SWEEP_JOB` (workbench view cross-fade ×2), `duration-200` →
  `POP_JOB` (switch ×2, theme toggle ×3), `duration-150` → `FADE_JOB` (checkbox).
  TWO TIMINGS MOVED, and both were already the module's recorded consolidation rather than a new
  ruling — the export progress fill 300ms → `PRESS_JOB` 100ms, and the icon button's bare
  `ease-out` (Tailwind's default 150ms) → `PRESS_JOB` 100ms ease-out. §1.6 gates them.
- [x] 1.6 `components/ui/studio-controls.tsx` held its OWN timing table — `HOVER_MS = 130`,
  `SELECT_MS = 220`, `EASE = cubic-bezier(0.22, 1, 0.36, 1)` — which is the second copy the
  module exists to prevent. The three constants now read `HOVER_JOB`/`SELECT_JOB`. Same values,
  one home; no pixel moves.
- [ ] 1.7 **USER** — the two timing moves in §1.5 are the only visible change in this batch:
  the export progress bar and the icon-button hover both go from 150/300ms to 100ms.

## 2. The three primitives

- [ ] 2.1 Reveal — visible on hover **and** focus-within, reserving its space when hidden.
  Test: revealing does not change the host row's measured height.
- [ ] 2.2 Readout — value changes in place at fixed width. Test: two values of different digit
  count within the declared range measure the same width.
- [ ] 2.3 Saved row — name + readout + command set, composed from 2.1 and 2.2. The readout is
  derived from what the entry stores; the row never holds a formatted copy.
- [ ] 2.4 Save-over drops the override it absorbed, in the same gesture. This is the fifth
  appearance of that defect; the test asserts the override is cleared, not that the value matches.

## 3. Collapse the three copies

- [ ] 3.1 Snapshot the motion inspector's shelf markup before migrating. This is the pixel proof
  for §3.5, and it cannot be taken after the change.
- [ ] 3.2 Migrate `ipod-3d-motion-inspector.tsx` onto the saved row; delete its row markup.
- [ ] 3.3 Migrate `ipod-3d-color-cockpit.tsx`; delete its row markup.
- [ ] 3.4 Migrate `ipod-3d-stage.tsx`; delete its row markup.
- [ ] 3.5 Prove identity: the migrated motion inspector renders byte-identical markup to §3.1.
  If it does not, this change **waits** for `add-motion-authoring-system` §6.8 to close rather
  than moving pixels that are under review.
- [ ] 3.6 Report the size: lines added, lines deleted, net. A net addition means the primitive is
  carrying something unshared — split it rather than shipping it.

## 4. Gates

- [ ] 4.1 `pnpm validate` exit 0; record the reading in `tasks/state.json.gates`.
- [ ] 4.2 `openspec validate add-interface-motion-system --strict --no-interactive`.
- [ ] 4.3 USER: visual review. The claim is that nothing moved on the motion inspector and every
  other shelf now moves the way it does. Only the owner can confirm the second half.
