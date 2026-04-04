---
name: pi-research
description: Use for provenance audits, Apple reference packs, visual fidelity critiques, and implementation brief generation. This skill is research-only and should not be used to mutate product code directly.
---

# Pi Research

Use this skill when the task is strongest as structured research rather than direct implementation.

Good fits:
- historical iPod finish provenance
- Apple hardware reference synthesis
- visual fidelity critique against current screenshots or specs
- implementation brief preparation for a separate coding model

Current project use:
- support the approved `restore-finish-provenance` change with provenance briefs, critique notes, and implementation handoff drafts

Do not use this skill to:
- write application code
- bypass OpenSpec
- replace testing or review

## Presets

- `provenance-audit`
- `reference-pack`
- `visual-fidelity-critique`
- `implementation-brief`

## Commands

List presets:

```bash
python3 plugins/pi-research/scripts/pi_research.py --list-presets
```

Run a provenance audit:

```bash
python3 plugins/pi-research/scripts/pi_research.py \
  --preset provenance-audit \
  --prompt "Document the sourced iPod family finishes relevant to this project."
```

Prepare an implementation brief from local spec inputs:

```bash
python3 plugins/pi-research/scripts/pi_research.py \
  --preset implementation-brief \
  --input-file openspec/changes/restore-finish-provenance/proposal.md \
  --input-file openspec/changes/restore-finish-provenance/design.md \
  --prompt "Create a narrow brief for the next UI fidelity slice."
```

Validate configuration:

```bash
python3 plugins/pi-research/scripts/validate_pi_research.py --require-key
```

## Output Contract

The runner asks Kimi for a structured brief. Expect sections such as:

- Goal
- Constraints
- Findings
- Risks or unknowns
- Recommended next steps
- Implementation brief or handoff notes

Persist output only when you intentionally pass `--output`.
