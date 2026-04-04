## 1. Agent Definition
- [x] 1.1 Decide and document the repo-local agent surface (`plugin`, `command`, or both) for `pi-research`.
- [x] 1.2 Scaffold the repo-local `pi-research` plugin metadata, runner, docs, and skill files.
- [x] 1.3 Bind the default research model to NVIDIA NIM `moonshotai/kimi-k2.5` with local environment configuration.
- [x] 1.4 Make committed-file validation work without hard dependence on ignored local assistant marketplace state.

## 2. Research Workflow
- [x] 2.1 Add structured presets for provenance audit, reference pack, visual fidelity critique, and implementation brief generation.
- [x] 2.2 Define a consistent output format for research briefs so results can be fed into OpenSpec and implementation review.
- [x] 2.3 Document how `pi-research` supports `restore-finish-provenance` without bypassing review or tests.

## 3. Boundaries And Safety
- [ ] 3.1 Enforce a research-only contract in prompts, docs, and user-visible runner behavior.
- [x] 3.2 Ensure the agent fails clearly when `NIM_API_KEY` is missing or invalid.
- [x] 3.3 Prevent secrets, generated prompts, or transient research output from being persisted in unsafe locations by default.
- [ ] 3.4 Add an explicit redirect/refusal path for direct product-code mutation requests.

## 4. Validation
- [x] 4.1 Add a lightweight validation or smoke path for agent configuration and manifest integrity.
- [x] 4.2 Verify the committed repo metadata is structurally valid without ignored local marketplace state.
- [ ] 4.3 Add automated checks for missing-key failure and default stdout-only persistence behavior.
- [x] 4.4 Run `openspec validate add-pi-research-agent --strict --no-interactive`.
