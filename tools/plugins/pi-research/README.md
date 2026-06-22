# Pi Research

`pi-research` is a repo-local research agent for this project. It uses NVIDIA NIM with `moonshotai/kimi-k2.5` to generate structured briefs for:

- iPod finish provenance audits
- Apple reference packs
- visual fidelity critiques
- implementation handoff briefs

It is deliberately research-only. It does not modify product code, update OpenSpec, or bypass review and test validation.

For the current program of work, it is intended to support the approved `restore-finish-provenance` change by generating provenance audits, fidelity critiques, and narrow implementation briefs that can then be reviewed and handed to a separate implementation model.

## Commands

```bash
python3 plugins/pi-research/scripts/validate_pi_research.py
npm run pi-research:smoke
npm run pi-research -- --list-presets
npm run pi-research -- --preset visual-fidelity-critique --prompt "Critique the current flat mode."
npm run pi-research -- --preset implementation-brief --input-file openspec/changes/restore-finish-provenance/proposal.md --prompt "Prepare the first UI slice."
```

## Configuration

The runner resolves `NIM_API_KEY` from the shell environment first, then from local repo env files like `.env.local`.

Optional overrides:

- `PI_RESEARCH_MODEL`
- `PI_RESEARCH_BASE_URL`

Defaults:

- model: `moonshotai/kimi-k2.5`
- base URL: `https://integrate.api.nvidia.com/v1/chat/completions`

## Discovery And Validation

The committed plugin manifest, skill, docs, and runner are intended to be enough for a fresh clone to discover and validate the research surface.

Local assistant integration via ignored directories such as `.agents/` may exist on a given machine, but it is optional and not required for the committed validation path.

## Persistence

Results print to stdout by default. Nothing is written into the repository unless `--output <path>` is explicitly provided.
