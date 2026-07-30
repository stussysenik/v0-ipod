## Session Start (mandatory)

- **Identify your role.** You are Agent A (Architect), B (Builder), or C (Validator). See
  "Multi-Agent Tandem" below. Your role determines what you read and write in this session.
- **Read `docs/FACTORY.md` first** — the factory operating manual: roles, records, the
  provenance trace, gate rules. This file is the law (what must be true); FACTORY.md is
  the mechanism (how it is executed and verified). Where they disagree, this file wins
  and FACTORY.md is the bug.
- Then review `tasks/state.json` — determines current arc, active changes, blockers, and
  your agent slot's assignment. Run `make board` to see the full derived horizon.
- Review `docs/DECISIONS.md` statuses before proposing anything new.

## Context budget — a session ends before it forgets

A session is a working set, not a memory. It has a hard ceiling and the last thing it does
before hitting it must be to write the work down, not to keep going.

- **Ceiling 200k. Land at 150k.** Past 150k, stop starting; finish the unit in hand, write
  the records, commit. A compacted summary is a lossy copy of a ledger that was never
  written.
- **The unit of work is one that fits.** If a task cannot be read, done, tested and
  recorded inside the budget, it is two tasks. Split it in the ledger before starting it,
  not in the middle of it.
- **Write the ledger before the last edit, not after.** `tasks.md` checkboxes,
  `tasks/state.json`, one `tasks/session.log` line. A finding that only exists in the
  reply is lost the moment the session closes.
- **Read narrowly.** Grep for the symbol, read the range. Reading a file twice is the
  cheapest thing to eliminate; re-deriving a recorded measurement is the most expensive.
- **The handoff is a §-numbered task, not prose.** "Resume at §5.5" beats a paragraph
  describing where things stand, because the next session reads the ledger anyway.

## Reading the Factory

```sh
cat tasks/state.json   # raw state — wave, arc, next, gates, carry
npm run board          # derived board from state.json + openspec tasks
git log --oneline -10  # recent commits
```

After any work (teacher or student):
- Update `tasks/state.json` with results
- Append one line to `tasks/session.log`: `YYYY-MM-DDThh:mm+TZ ROLE summary`
- Run `pnpm validate` and record gate results in `state.json.gates`
- Run `npm run board:check` to confirm zero drift

A "continue" instruction means: read state, check gates, dispatch the next eligible
task, and record the result. The system self-heals through state.json — no manual
hand-holding required between sessions.

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Start here

`make board` — one screen: the five-act arc, every active change with derived progress,
the current focus, what is next, what each gate printed when it was last observed, and what
carries forward. Read it before reading anything else. Nothing on it is hand-counted.

- **Derived, never stored:** task counts come from `openspec/changes/<change>/tasks.md` at
  read time. Checkboxes are the only ledger — a summary that disagrees with them cannot
  exist, because there is no summary.
- **Hand-maintained, exactly one file:** `tasks/state.json` — the act ordering, focus,
  blocked, next, gates-as-observed, carry. Update it in the same commit as the work.
- **Enforced, not remembered:** `pnpm validate` runs `board:check` and the pre-commit hook
  runs `pnpm validate`. It fails on a completed-but-unarchived change (printing the exact
  `openspec archive` command), a dangling change reference in `next` or `arc`, a change
  directory missing `proposal.md`/`tasks.md`, and on the board going stale — `openspec/changes`
  edited without `tasks/state.json` moving with it.
- **Archiving is a gate, not a chore.** When a change reaches 100%, the next commit fails
  until it is archived. `openspec archive <change-id> --yes`.

## Ready state — when the project is clear

**Clear** when all five hold. Each is answered by a command, never from memory.

| Condition | Answered by |
|---|---|
| Working tree committed | `git status --porcelain` prints nothing |
| Gates green | `pnpm validate` exits 0 |
| Nothing complete-but-unarchived | `pnpm board:check` |
| Board not stale | `pnpm board:check` |
| No owner-gated item outstanding | `make board` NEXT contains no `USER:` line |

Clear means *ready to accept new work*. It does not mean the arc is finished — it means
nothing already started is waiting on anyone.

Anything less than all five is **carrying**. Name the failing condition in the first line of
the reply. Do not call the project done, clean, safe, or ready while one fails.

## Multi-Agent Tandem — A·B·C

Three agents coordinate through `tasks/state.json`. Zero conversation cross-contamination,
because there is no conversation — only disk reads and writes.

| Agent | Role | Reads | Writes |
|---|---|---|---|
| **A** | Architect | requirements, specs, C's verdicts | task slices, assignments in `state.json` |
| **B** | Builder | A's task slices | code commits, local gate results |
| **C** | Validator | B's commits, A's specs | measurements, gate verdicts |
| **Human** | Supervisor | `make board`, diffs, C's reports | merge, promote decisions to `agreed` |

### The handoff cycle

```
A: write → state.json.next[idx] = "B:&lt;spec-path&gt; &lt;criteria&gt;"
B: read → implement → validate (tsc, lint, test) → commit → write → state.json.gates += {commit, results}
C: read → review → measure → gate → write → state.json.next[idx] = "A:&lt;ship|rework|escalate&gt;"
A: read → decide → write next slice or flag human
```

Three slots in `state.json.next` (0=A, 1=B, 2=C). Each agent owns one slot. An empty slot
means the agent is idle. `make board` renders each agent's current item and who they are
waiting on. The bottleneck is always in the file, never in a chat log.

### Supervisor cold-start

1. `cat CLAUDE.md` — law
2. `make board` — arc, agents, gates, blockage
3. `git log --oneline -10` — landscape
4. `tasks/state.json` — raw, when board raises a question

The answer to "where are we stuck" is in slot 0, 1, or 2. If none are occupied, the project
is ready for new work.

## Priority — what gets worked next

New work does not displace work in flight. Rank by first match:

1. **Defect against a ratified requirement** — shipped code contradicts an accepted spec in
   `openspec/specs/`. Preempts everything, including the arc. A spec the code disagrees with
   is worse than a missing feature: every downstream claim inherits the disagreement, and the
   spec stops being evidence of anything.
2. **Owner-gated item** — only the owner can close it. It goes to them immediately, and other
   work continues around it. Never a reason to stall.
3. **Act blocker** — the change that unblocks the next act on the arc.
4. **Nearest to done** — the in-flight change with the highest derived percentage. Finishing
   beats starting.
5. **New work** — enters at the back.

**WIP limit: 3.** At most three changes may sit strictly between 0% and 100%. Above that,
finish before proposing. This is a statement about attention, not capacity: a change at 42%
that nobody is reading is indistinguishable from an unwritten one, except that it looks like
progress on the board.

## Determinism and recovery

One law in two halves. Determinism is what makes a recovered version falsifiable; without it,
"recovered" cannot be checked, only asserted.

- **The same document produces the same pixels and the same bytes.** Any machine, any day. No
  wall clock, no `Math.random`, no ambient state on a render or an export path. A seed is a
  stored value like any other. This is the reason an export fingerprint can be an identity.
- **Every persisted shape carries a version.** A stored studio slice, a share payload, an
  export record and a re-open are four boundaries — a version honoured at three of them is
  not a version.
- **A migration is not a migration until a test asserts the converted value.** A test that
  only asserts "does not throw" passes on an inert migration. That has already happened here
  once: an option's fallback was never passed by any of the four boundaries, so every legacy
  value converted to the same constant while the ledger claimed the conversion could not be
  missed.
- **No gesture destroys a version that cannot be restored.** Save over, delete and reset
  write a new version rather than replacing the last. Back to factory is a version, not an
  erasure.
- **A cited commit is immutable.** A SHA referenced by a ledger, an archive note or a spec is
  part of the record; rewriting it deletes the evidence a claim rests on.

## The machine we fit

The target is a ThinkPad T480s on integrated graphics at 1080p, not a workstation. A budget is
held, not recovered — one that is measured only after it is missed has never been met.

- **Two numbers gate the artifact:** bytes over the wire for one route, and frames per second
  on Intel UHD 620 at 1080p. Both belong in `pnpm validate` beside the colour envelope, and
  both print their reading on pass.
- **Content is generated, not shipped.** Geometry is parametric from `IPOD_CLASSIC_MM`, colour
  is derived from the manifest, motion is documents rather than baked frames. A baked asset is
  a withdrawal from the byte budget and has to state what it bought.
- **Headroom is not a design input.** A surface that holds its frame rate only on the author's
  machine is a defect on the target machine, and the target machine is the one that counts.

## Before proposing

Two checks. Both cheap, both skipped by default, and each has already cost a session.

- **A new capability is the last resort.** `openspec/specs/` holds the ratified requirements,
  and new work usually contradicts one rather than sitting beside it. Read the capability whose
  name is nearest before scaffolding anything. If a ratified requirement disagrees with the
  proposal, the delta is `MODIFIED` with the migration named — not `ADDED` under a new name that
  leaves two requirements disagreeing in the same repo. A dimension axis was one command from
  being built against `surface-mode-switching`, which ratifies `/3d` as the only 3D surface;
  shipping that would have been the defect class this file ranks first, above the arc.
- **A question is a cost, and most forks are already closed.** Before asking, check whether this
  project's own law eliminates the options. Layered-parallax art was one of three readings of
  2.5D until the attestation rule removed it: a finish is a material under light, so a flat fill
  cannot carry one. What stays genuinely open is an **input** — a visual reference, a brand, a
  price — and an input is asked for in one plain sentence. An option menu is the shape of a
  decision that was not made.

## Where decisions live

Reasoning is written where the thing it governs lives, so a cold session reads one file
rather than reconstructing intent from a diff.

- **Module docs carry the mechanism and the constraint.** `lib/color-manifest.ts`,
  `lib/color-verdict.ts`, `lib/color-fidelity.ts` and `lib/case-color-presets.ts` each open
  with the rule they enforce and the defect that motivated it. Read those before changing a
  colour constant.
- **The active change's `tasks.md` carries the measurements.** Numbers already derived are
  recorded there so they are never re-derived — the fidelity envelope, the 16.7M-colour
  sweep, the per-follow-up rulings. Check it before running a long measurement.
- **Tests carry the invariant, with the failure in the docstring.** A test that pins a
  colour states what shipped broken and what it measured.

## Documentation layout

One fact, one home. A document that restates a fact owned elsewhere is drift, and drift is
what makes a session repeat itself.

- **`README.md` is the table of contents.** It links; it does not explain. Every document is
  one hop away. Feature prose belongs in the document that owns the feature.
- **Prose documentation is MDX under `docs/`**, so a rendered example can sit beside the rule
  it states. Plain `.md` is for documents with nothing to render.
- **Mechanism and constraint stay in the module doc-comment**, next to the code they govern.
  MDX links to the module; it does not paraphrase it.
- **Measurements stay in the active change's `tasks.md`.**
- **No status file.** Progress, roadmap, and next-task documents are derived at read time by
  `make board` or they do not exist. `docs/PROGRESS.md`, `docs/ROADMAP.md` and
  `docs/NEXT-TASK.md` are that drift class — hand-checked boxes competing with the change
  ledgers, stale since April and May. They are scheduled for deletion, not for updating.
- **A count never appears in prose.** Write "see `make board`".

## Colour work — the rules that already cost a session to learn

- **Attestation is a factual claim.** The manifest attests hardware. A constant whose name
  asserts a generation must read its hex from `authenticFinishes` (`finishHex`), never a
  typed literal — two shipped constants had drifted onto the wrong generation's value.
  House colours are not attested and do not belong in the manifest; they live in
  `lib/case-color-presets.ts`.
- **Never nudge a measured value to make a check pass.** Change the check, or rule the value
  house and say so with its reading. Both moves are on the record in
  `add-color-fidelity-verification`; the distinction is the whole point of the change.
- **A gate that checks only the passing case is not a gate.** The wheel-label contrast pair
  covered the dark wheel and not the light one; the label solver checked the gradient
  midpoint and not the ends. Both passed while shipping the defect they existed to catch.
- **Anything that moves a pixel gates on the owner's review**, however well measured. State
  the ΔE00 and what moved, then stop.