# Loop Contract

Read at the start of every autonomous iteration, before any other file. Governs unattended runs only; an attended session follows `CLAUDE.md` unchanged.

Executed by `tasks/night.sh`: one headless `claude -p` process per unit, so each unit
starts at zero context. `docs/FACTORY.md` is the operating manual around this contract.

## Iteration shape

One iteration does exactly one unit of work, then ends. A unit is one of: one spec drafted, one task in a `tasks.md` implemented, one gate repaired, one research pass distilled. Never two.

1. Read `tasks/state.json`, this file, and nothing else yet.
2. Pick the single next unit from `state.json.next`, honouring arc order and the `blocked` flag.
3. Do the work.
4. Verify it — `pnpm validate`, plus the change's own gate.
5. Record: `tasks/state.json` updated, one line appended to `tasks/session.log`, then `npm run board:check` to confirm drift is zero.
6. Commit (see Git).
7. End the iteration. Do not start the next unit.

The iteration must be resumable from disk alone. A successor that never saw this conversation reads `state.json` and continues — if that is not true after step 5, step 5 is incomplete.

## Record integrity

Nothing may be recorded as passing that a command did not just print.

- **Never write a gate result you did not observe this iteration.** If a gate is not re-run, its old text is copied verbatim and left alone — never upgraded, never restated as fresh.
- **`openspec` is a real binary** — resolve it from the project's tooling. Do not use `npx openspec`.
- **session.log format is fixed**: `YYYY-MM-DDThh:mm+0200 ROLE summary`, local offset only, one line, appended never inserted. File order is authoritative.
- Anything discovered mid-unit that a later unit must not lose goes into `state.json.carry` before the iteration ends, not into prose.

## Context budget

Ceiling is 200k per session. The mechanism is scope, not summarization.

- Read only the one change directory in play.
- Never re-read a file whose conclusion is already recorded in `state.json`.
- Files over ~400 lines: extract with `rg`/`jq`/`sed -n`, never a full `Read`.
- Gate output is piped through `tail -20`. Full logs never enter context.
- Hard stop: past ~40 tool calls or ~15 files opened in one iteration, finish step 5, commit, and end early. A half-unit recorded honestly beats a whole unit that blows the window.
- State written to disk is the only memory that carries between iterations. Conversation history is assumed lost.
- **A dirty tree at iteration start is not yours.** If `night.sh` killed a previous unit mid-flight, adopt it — finish to a gate and commit, or revert by path and say so in `session.log`. Never build on top of it, never leave it for the next iteration.

## Git

Branch `night/YYYY-MM-DD`, cut from `main` when the loop is armed. `main` is never written to by the loop.

- One commit per completed unit. One-line message, label only, conventional prefix per conventional commits. No body, no trailer.
- **Hard limit: the description after `type: ` must be ≤100 characters.** The husky `commit-msg` hook enforces this. A rejected message is not a warning — fix it and retry.
- `wip:` prefix when the unit's gate did not pass; the message names what is unproven.
- Stage explicitly by path. `git add -A` only when the iteration's own edits are the entire diff.
- Never: `push`, `merge`, `rebase`, `reset`, `commit --amend`, `checkout`/`restore` over uncommitted edits, force anything.
- Merging to `main` is the user's act. The loop leaves a branch and stops.

## Standing bars

- **Professional tool, not a hobbyist toy.** iPod Snapshot is the destination, never the thing people outgrow.
- **Face Law is unchanged and binding** (`CLAUDE.md`). No visual gate may be marked passed by the loop; the face is judged by the user looking at it.
- **No creative decision is settled by the loop.** GUI shape, product form, and anything requiring a `DECISIONS.md` promotion stay `proposed` and land in `state.json.next` for the user.

## Stop conditions

Stop the loop and leave the branch when any holds:

- `state.json.blocked` is true.
- Every remaining item in `next` is owned by USER.
- The same unit fails its gate twice in consecutive iterations — record the failure, do not attempt a third.
- A unit would require a creative or one-way-door decision.
