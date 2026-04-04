# Change: Add Pi Research Agent

## Why
The project needs a controlled way to use Kimi K2.5 for design-reference research, provenance gathering, and fidelity audits without letting model-driven implementation sprawl into the codebase unchecked. The current workflow relies on ad hoc prompts and manual orchestration, which makes research outputs inconsistent and hard to reuse.

## What Changes
- Add a repo-local `pi-research` agent/plugin powered by NVIDIA NIM with `moonshotai/kimi-k2.5` as the default model.
- Constrain the agent to research and audit output only: provenance briefs, design critiques, reference packs, and prompt-prep artifacts.
- Define structured presets for iPod finish provenance, Apple reference research, export/fidelity critique, and implementation brief generation.
- Require `NIM_API_KEY` and explicit runtime safeguards so secrets stay local and the agent fails closed when configuration is missing.
- Make discovery and validation depend on committed repo files rather than ignored local assistant marketplace state.
- Add an explicit redirect path when users try to route direct product-code mutation through the research agent.
- Document how `pi-research` feeds the approved `restore-finish-provenance` work without bypassing OpenSpec, tests, or review.

## Impact
- Affected specs: `research-agent`, `research-workflow`, `tooling-boundaries`
- Affected code: repo-local plugin/agent scaffolding, NIM client wrapper, research presets, usage docs, validation script, marketplace/plugin metadata
