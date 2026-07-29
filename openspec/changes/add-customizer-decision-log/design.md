# Design — the decision log, and the arc it opens

## 0. The story, in one thread

The iPod was announced 23 October 2001 and discontinued 10 May 2022. **It turns 25 on 23
October 2026.** This project is the instrument you use to bring yours back.

That sentence orders everything. Five acts, each strictly dependent on the one before:

| Act | Claim | State |
| --- | --- | --- |
| 1. The object is faithful | A finish named for hardware measures as that hardware | largely shipped — `color-manifest`, `IPOD_CLASSIC_MM`, ΔE00 gates |
| 2. The instrument is legible | Chrome recedes; a control is anchored to what it changes | `refactor-3d-control-surface-to-inspector` |
| 3. Every choice is remembered | The customisation is a document, not a blob | **this change** |
| 4. The document travels | A state is portable, addressable, forkable | half-shipped — `portable-state.ts` |
| 5. The community is the gallery | The iPods people owned, brought back and shared | `add-community-state-gallery` |

The dependencies are real, not rhetorical. There is no gallery without portable documents;
no portable document worth forking without a decision log; no log worth surfacing without
controls legible enough to read it; and none of it matters if the object is not faithful.

Act 1 is where this repo has spent its effort, and it is the reason the rest is worth
building. Acts 3 and 5 are what turn a very good renderer into something a person returns to.

## 1. The Apple lens

The user's framing: *what would Apple ask for if they used this exact project to mark the
anniversary?* Treated as an acceptance standard, not flattery. Five questions, each of which
becomes a requirement somewhere in the arc:

1. **"Is it the real colour?"** — Attestation. Already this repo's law: a constant whose name
   asserts a generation reads its hex from `authenticFinishes`, never a literal. Apple would
   extend it to the gallery — a user-invented colour must never be able to masquerade as a
   shipped finish. → *provenance badge on every shared state* (change three).
2. **"Does the chrome disappear?"** — Apple ships tools where the UI recedes and the object is
   the hero. Seven permanently-mounted cards currently fight the device. → *selection-driven
   inspection* (change two).
3. **"Can I undo without fear?"** — Direct manipulation is only safe when it is reversible.
   → *this change*.
4. **"Is it honest about what it is?"** — A tribute, not a product. No Apple marks, no
   implied endorsement, no storefront. A shared state must be unmistakably a community
   artifact. This is the one Apple-lens answer that **constrains** the build rather than
   expanding it, and it is a hard line in change three, not a preference.
5. **"Does it work on the phone in someone's hand?"** — A shared link opens on mobile first.
   Already spec'd in `mobile-responsive-layout`; the gallery inherits it rather than
   re-litigating it.

## 2. Why this is nearly free

React reducers **path-copy** on every dispatch — the structural sharing that makes persistent
data structures cheap (Okasaki, *Purely Functional Data Structures*) is already happening on
every keystroke, and the intermediate versions are already allocated. Retaining them costs
O(δ) per edit, not O(state).

"Infinite history" is therefore not machinery to build. It is garbage we currently collect.

## 3. The decision that carries the change: an action log is not a layer stack

Dragging the colour picker emits ~400 `SET_SKIN_COLOR` actions. Four hundred layers is not a
design surface — it is a scroll bar.

So the log needs a **normalisation pass** between "what was dispatched" and "what was
decided" — constant folding, in compiler terms. A gesture collapses to one semantic
`Decision`. That pass is the entire difference between the undo stack the platform gives you
free and the layer list you have to earn.

**Coalescing rule.** Consecutive decisions are merged when they share a `target` *and* fall
within one gesture window (settled by the same trailing-debounce idiom already used for
persistence at `ipod-3d-stage.tsx:133`, so a drag and its save agree on what "one edit" means
rather than inventing a second definition). A decision from a *preset* never coalesces into an
adjacent custom one: "chose Anodized Blue" and "then nudged it" are two different claims, and
act 1 of the story is that the difference is legible.

## 4. Two views, one array

| view | projection | reads as |
| --- | --- | --- |
| History | the full ordered log | time travel, scrub, branch |
| Layers | `dedupeByTarget(keepLast)` | the stack you edit |

Photoshop's History panel and Layers panel, from one structure. Because decisions are keyed
by target and last-write-wins, **disabling a layer lets the previous decision on that target
resurface** — which is what makes it behave like a layer instead of an undo step. That
behaviour is the acceptance test for the whole projection.

## 5. Algebra worth encoding

Decisions on **different** targets commute; on the **same** target the later wins. Encoding
that property in the type turns reorder-and-disable from hopeful into sound, and it is
cheaply testable in both directions (independent reorder → identical model; same-target
reorder → different model).

It also settles sync before we get there. Last-write-wins keying over a keyed map is an
**LWW-element map** — a CRDT whose merge is a *join*, with no conflict resolution to invent.
Change three can therefore add cross-device or community sync **additively**, and change
three's storage decision stops being load-bearing.

## 6. Rejected alternatives

- **Snapshot-per-edit history.** Simple, but O(state) per step, and it can express "go back"
  while being unable to express "this decision, disabled" — it has no notion of a *choice*,
  only of a *result*. It cannot produce the Layers projection at all.
- **Replace the reducer with an event-sourced store.** The fold is correct and well-tested;
  rewriting it would put the project's most load-bearing pure function at risk for zero user
  benefit. This change **wraps** it. The fold-equivalence property test (task 4) is what
  makes the wrap safe.
- **Immer/patch-based undo.** Gives inverse patches, which is an undo stack — the thing we
  already get free — and still leaves the coalescing and projection problems unsolved. It
  would add a dependency to solve the easy half.

## 7. The invariant everything rests on

> Folding the log reproduces the live model, for any dispatch sequence.

If it holds, history, layers, restore, share and provenance cannot silently desync from what
the user sees. It is a property test, it is task 4, and it lands before any consumer is
written.
