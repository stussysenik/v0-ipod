## Context
The user wants a persistent Kimi-powered specialist in the project, but only for the part of the workflow where Kimi is strongest: design-reference research, provenance synthesis, and audit drafting. Planning, OpenSpec, review, and validation remain separate responsibilities.

This change should create a reusable local research surface instead of continuing with one-off shell scripts and hand-assembled prompts.

## Goals
- Provide a repo-local `pi-research` agent that uses NVIDIA NIM with `moonshotai/kimi-k2.5`.
- Keep the agent focused on research and audit output rather than direct product implementation.
- Make the research surface reusable for Apple reference gathering, iPod finish provenance, visual fidelity critique, and Kimi implementation-brief preparation.
- Ensure the agent fits local project tooling and can be reviewed, versioned, and improved inside the repo.
- Ensure a fresh clone can discover and validate the research surface from committed files alone.
- Make the research-only boundary visible in runner behavior, not only in prompt text and docs.

## Non-Goals
- Letting the research agent mutate product code directly
- Replacing OpenSpec, Playwright, or human review
- Building a generic multi-model router for every task
- Storing API secrets in the repo or plugin metadata

## Architecture Decisions
### 1. Repo-local plugin, not an invisible script
The research surface should be explicit in the repository so its purpose, prompts, and boundaries are inspectable. A repo-local plugin or agent scaffold is preferred over hidden ad hoc shell snippets.

### 2. Research-only contract
`pi-research` should output briefs, source packs, provenance tables, audit notes, or implementation prompts. It should not write application code, update OpenSpec, or run destructive commands by itself.

### 3. Structured presets over freeform prompting
The agent should expose a small set of durable presets such as:
- `provenance-audit`
- `reference-pack`
- `visual-fidelity-critique`
- `implementation-brief`

These presets keep Kimi focused on repeatable, comparable outputs.

### 4. Local secret boundary
The agent should read `NIM_API_KEY` from the local environment at runtime. No secrets should be written into manifests, checked into docs, or echoed into generated files.

### 5. Planner-reviewed handoff
Research output is advisory until it is reviewed and normalized into either OpenSpec changes, implementation briefs, or test plans. The research agent is a source generator, not a source of truth.

### 6. Committed discovery surface
Discovery and structural validation should rely on versioned files in the repository. Ignored local assistant state such as `.agents/` may integrate optionally, but it cannot be required for a fresh clone to discover or validate the plugin.

### 7. Explicit redirect for implementation misuse
If a user tries to use the research agent as a coding agent, the tooling and docs should redirect that request into an implementation brief, critique, or research handoff rather than pretending the research surface owns code mutation.

## Risks
- Research quality can drift if prompts are too open-ended; presets must stay narrow.
- The NIM endpoint or preferred model ID may evolve, so the implementation should make the default explicit and overridable.
- If the tool appears to “do everything,” users may try to route implementation through it; the boundary docs and command UX need to make the research-only scope obvious.
- Optional local assistant marketplace integration can create false confidence if validation quietly depends on ignored files; the committed-path validation must remain the authoritative baseline.
