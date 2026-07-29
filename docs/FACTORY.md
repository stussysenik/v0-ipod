# The Factory

How iPod Snapshot is built. Read this to operate the system, audit it, or pick it up cold.

`CLAUDE.md` is the law — what must be true. This file is the mechanism — how the law
is executed and how to verify it was. Where the two disagree, `CLAUDE.md` wins and this
file is the bug.

## The one-paragraph version

This project is built by a loop of four roles working from disk, not from memory. A **scholar**
reads sources and writes evidence. A **teacher** turns evidence into one spec. A **student**
implements exactly one approved spec. The **user** holds every creative and one-way-door
decision and is the only one who promotes a decision to `agreed`. Each pass writes its
result to disk before it ends, so the next pass — human or agent, hours or weeks later —
resumes from files alone. Nothing important lives in a conversation.

## The records

Seven files carry the whole story. Each answers a different question, and they interlock —
that interlock is the provenance system.

| Record | Answers | Written by |
|---|---|---|
| `AGENTS.md` | What are we building and why | teacher, from user direction |
| `docs/DECISIONS.md` | Who decided what, when, at what confidence | any role; **only the user** promotes to `agreed` |
| `docs/READINGS.md` | What evidence a claim rests on | scholar |
| `openspec/changes/*/` | What exactly gets built | teacher |
| `tasks/state.json` | Where the build stands right now | every pass |
| `tasks/session.log` | What happened, in order | every pass |
| `tasks/lessons.md` | What was learned the hard way | every pass |

Plus git: one commit per completed unit, and the diff is the proof.

### The trace

Any line of code answers "why do you exist?" by walking backwards:

```
line of code
  → the task in openspec/changes/<change>/tasks.md that required it
  → the requirement in that change's spec/
  → the proposal that framed it
  → the DECISIONS.md entry the proposal cites
  → the READINGS.md entry that decision rests on
  → the source itself
```

And forwards, from any commit:

```
git show <sha> -- tasks/session.log     → the one-line narrative of that commit
git log -S"<phrase>" -- tasks/session.log → the commit that phrase describes
```

Every commit contains exactly one new `session.log` line. That is what makes the mapping
bidirectional and total: narrative → diff and diff → narrative, with no index to maintain
and nothing that can drift out of sync.

**A claim with no reachable source is a defect**, not a style problem. `READINGS.md`
entries carry an explicit caveat line when the source was not actually consumed. An honest
gap is a record; a confident gap is a lie.

## The roles

Never mixed in one session. Mixing them is how specs acquire implementation bias and
implementations acquire scope.

**Scholar** — reads literature and reference tools, writes `READINGS.md` entries: source,
mechanism-level takeaway, spec-impact line. No opinions without a source. No spec text.
Dispatched whenever a spec would otherwise rest on confident vibes.

**Teacher** — brainstorm → converge → write ONE spec. Zero implementation code. Every
non-obvious claim cites a `READINGS.md` entry. Output is a change under
`openspec/changes/`: proposal, spec deltas, tasks.

**Student** — implements exactly one approved spec. If the spec is ambiguous, stop and
flag it. Never improvise around a spec — ambiguity is a bug in the spec, fixed there.

**User** — holds product shape, GUI look and feel, pricing, brand, legal, and every
one-way door. Promotes decisions to `agreed`. Runs the live visual review. Merges.

## The loop

### Unattended (overnight)

```sh
git checkout -b night/$(date +%F)
MODEL=sonnet UNITS=40 tasks/night.sh
```

One headless process per unit — fresh context every time, disk is the only memory.
`tasks/loop.md` is the contract each unit reads first. The runner stops on: blocked
state, two consecutive units with no commit, two consecutive failures, or `UNITS`.

Cost controls: `MAX_USD` caps spend per unit (API billing; ignored on a subscription
plan, where the constraint is rate limits instead). `MODEL` selects the tier — teacher
and scholar units earn the top model, mechanical student units usually do not.

The runner refuses to start outside a `night/*` branch. `main` is never written to by
the loop, nothing is pushed, and merging stays the user's act.

### Attended

`CLAUDE.md` applies unchanged. The loop's commit permission is scoped to unattended
runs only.

### Reading the result

```sh
npm run board         # derived board from state.json + openspec tasks
cat tasks/state.json  # raw state
git log --oneline main..HEAD
```

## Gates

A gate is a script that exits non-zero, not a sentence that says "done". `pnpm validate`
runs the cumulative suite; each change carries its own. Results are recorded in
`state.json.gates` with the number that proved them.

Two rules that keep gates honest:

- **A gate that only passes because a sentence exists is a defective gate.** Fix the
  gate before the surface.
- **Gates print what they did *not* prove.** A green gate with an unproven claim beside
  it is worth more than a green gate that implies more than it tested.

**No visual gate is ever self-certified.** The face is judged by the user looking at it.
An agent may build the surface, serve it, and stop — never assert that it looks right.

## Standing bars

- **Professional tool, not a hobbyist toy.** iPod Snapshot is the destination, never the
  thing people outgrow. "It's early" is not a defense — the bar applies to what exists
  today.
- **Face Law** governs every surface string, density value, and palette choice. Held
  beside an actual iPod, a screenshot that reads as a web page has failed regardless of
  green gates.
- **Surgical minimalism.** Every line justified or absent. No placeholders, no
  "temporary" code, no steps beyond what the outcome strictly requires.
- **Determinism.** Meaning comes from grammar and compositional semantics. The LLM
  proposes; the type system disposes.

## Failure modes this system is built against

| Failure | The mechanism that prevents it |
|---|---|
| Work lost when a session ends or compacts | Every unit is resumable from disk alone |
| A decision quietly reversed | `DECISIONS.md` status + binding veto, user-only promotion |
| A confident claim with no source | `READINGS.md` citation requirement + explicit caveat lines |
| A spec that only its author can implement | Specs must be self-contained; ambiguity is a spec bug |
| A green board that doesn't match reality | Board is derived; gates print their own gaps |
| A 200-file diff nobody can review | One commit per unit, one `session.log` line per commit |
| An agent asserting the face looks right | No visual gate is self-certifiable |
