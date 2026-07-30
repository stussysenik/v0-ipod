# Tasks: add-customize-walkthrough

## 1. Steps as data

- [ ] 1.1 Declare the step list: ordered, each naming its node paths. Record the chosen sequence
  and why it is that order — a sequence is a claim about what people decide first.
- [ ] 1.2 Gate: a step naming a nonexistent node path fails, naming both.
- [ ] 1.3 Test that reordering steps changes no node declaration.

## 2. Lossless traversal

- [ ] 2.1 Back and forward derived from the log, not from a step cursor. A cursor is a second
  record of a position the log already holds.
- [ ] 2.2 Test backward-then-forward preserves every later value. This is the direction that breaks;
  testing only forward is the half-gate this repo has shipped twice.
- [ ] 2.3 Direct step access without traversal.
- [ ] 2.4 Resume: the step a returning visitor lands on is derived, with no stored pointer. A stored
  pointer would be the second home of a fact the log owns, and it would dangle on a reset.

## 3. History as projection

- [ ] 3.1 Project the log: what changed, which step, what order. Read time only.
- [ ] 3.2 Assert this change persists nothing. Grep the workspace-storage registry: if this change
  adds a key, the log is being duplicated rather than projected.
- [ ] 3.3 A history point restores the document at that point, and presents the step containing it.
- [ ] 3.4 Test recovery, not absence of throw: assert the restored document's **values**, because a
  test that only asserts "does not throw" passes on an inert restore. That has already happened here.

## 4. Not a wizard

- [ ] 4.1 Configurator centre and live at every step; an edit is visible without leaving the step.
- [ ] 4.2 Every sequenced control reachable outside the sequence; every state attainable without
  completing the walkthrough.
- [ ] 4.3 First-run: a meaningful edit with no stored state and no instruction.
- [ ] 4.4 Step transitions read their duration from the motion module. No literal.

## 5. Gates

- [ ] 5.1 `pnpm validate` exit 0, including the budget gates; record readings in `tasks/state.json.gates`.
- [ ] 5.2 `openspec validate add-customize-walkthrough --strict --no-interactive`.
- [ ] 5.3 USER: visual review of the walkthrough and its history.
