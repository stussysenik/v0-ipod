#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
import sys
import textwrap
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_MODEL = "moonshotai/kimi-k2.5"
DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
DEFAULT_MAX_TOKENS = 2800


@dataclass(frozen=True)
class Preset:
    name: str
    title: str
    user_goal: str
    output_contract: str


PRESETS: dict[str, Preset] = {
    "provenance-audit": Preset(
        name="provenance-audit",
        title="Provenance Audit",
        user_goal=(
            "Prepare a provenance-oriented brief focused on sourced product families, finishes, "
            "eras, material distinctions, and confidence levels."
        ),
        output_contract=textwrap.dedent(
            """\
            Respond as a structured brief with these sections:
            1. Goal
            2. Scope
            3. Findings
            4. Provenance Table
            5. Gaps Or Risks
            6. Recommended Product Decisions
            7. Next Brief To Hand Off
            """
        ).strip(),
    ),
    "reference-pack": Preset(
        name="reference-pack",
        title="Reference Pack",
        user_goal=(
            "Prepare a concise reference pack that extracts the most actionable measurements, "
            "ratios, visual cues, and historical notes from the available inputs."
        ),
        output_contract=textwrap.dedent(
            """\
            Respond as a structured brief with these sections:
            1. Objective
            2. Primary References
            3. Measurements And Ratios
            4. Visual Notes
            5. Authenticity Risks
            6. Suggested Implementation Targets
            """
        ).strip(),
    ),
    "visual-fidelity-critique": Preset(
        name="visual-fidelity-critique",
        title="Visual Fidelity Critique",
        user_goal=(
            "Critique the supplied design or code context for what reads authentic, what reads fake, "
            "and what should be fixed first to improve Apple-grade fidelity."
        ),
        output_contract=textwrap.dedent(
            """\
            Respond as a structured brief with these sections:
            1. Scope
            2. What Reads Authentic
            3. What Reads Fake
            4. Ranked Fixes
            5. Validation Ideas
            6. Brief For The Implementer
            """
        ).strip(),
    ),
    "implementation-brief": Preset(
        name="implementation-brief",
        title="Implementation Brief",
        user_goal=(
            "Translate the supplied planning or design material into a narrow implementation brief "
            "for a separate coding agent."
        ),
        output_contract=textwrap.dedent(
            """\
            Respond as a structured brief with these sections:
            1. Goal
            2. Constraints
            3. Required Inputs
            4. Acceptance Criteria
            5. Suggested File Scope
            6. Validation
            7. Final Handoff Brief
            """
        ).strip(),
    ),
}


RESEARCH_BOUNDARY = textwrap.dedent(
    """\
    You are Pi Research, a research-only design and provenance analyst for the v0-ipod project.

    Rules:
    - Do not write product code.
    - Do not claim to have changed files.
    - Do not bypass tests, review, or OpenSpec.
    - Be concrete, scoped, and skeptical.
    - If inputs are incomplete, state the gap clearly instead of inventing certainty.
    - Prefer concise, structured briefs over conversational drift.
    """
).strip()


def parse_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values

    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip("'").strip('"')
    return values


def resolve_setting(name: str, default: str | None = None) -> str | None:
    direct = os.environ.get(name)
    if direct:
        return direct

    for env_path in (REPO_ROOT / ".env.local", REPO_ROOT / ".env"):
        loaded = parse_env_file(env_path)
        if name in loaded and loaded[name]:
            return loaded[name]

    return default


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run the repo-local Pi Research agent against NVIDIA NIM and Kimi K2.5.",
    )
    parser.add_argument("--preset", choices=sorted(PRESETS.keys()))
    parser.add_argument("--prompt", help="Inline prompt text for the selected preset.")
    parser.add_argument(
        "--input-file",
        action="append",
        default=[],
        help="Optional local context file. May be supplied more than once.",
    )
    parser.add_argument(
        "--output",
        help="Optional file path for persisted output. By default, output prints to stdout.",
    )
    parser.add_argument(
        "--model",
        default=resolve_setting("PI_RESEARCH_MODEL", DEFAULT_MODEL),
        help=f"Model override. Defaults to {DEFAULT_MODEL}.",
    )
    parser.add_argument(
        "--base-url",
        default=resolve_setting("PI_RESEARCH_BASE_URL", DEFAULT_BASE_URL),
        help="Chat completions endpoint.",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.2,
        help="Sampling temperature for Kimi.",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=DEFAULT_MAX_TOKENS,
        help="Max completion tokens.",
    )
    parser.add_argument(
        "--list-presets",
        action="store_true",
        help="Print available presets and exit.",
    )
    parser.add_argument(
        "--smoke",
        action="store_true",
        help="Validate local config and optionally the live endpoint.",
    )
    parser.add_argument(
        "--live",
        action="store_true",
        help="When used with --smoke, perform a minimal live NIM call.",
    )
    return parser


def render_preset_list() -> str:
    lines = ["Available presets:"]
    for preset in PRESETS.values():
        lines.append(f"- {preset.name}: {preset.title}")
    return "\n".join(lines)


def load_context(paths: list[str]) -> str:
    blocks: list[str] = []
    for raw_path in paths:
        path = (REPO_ROOT / raw_path).resolve() if not Path(raw_path).is_absolute() else Path(raw_path)
        if not path.exists():
            raise FileNotFoundError(f"context file not found: {raw_path}")
        blocks.append(f"FILE: {path}\n{path.read_text()}")
    return "\n\n".join(blocks)


def build_messages(args: argparse.Namespace) -> list[dict[str, str]]:
    if not args.preset:
        raise ValueError("--preset is required unless --list-presets or --smoke is used")

    preset = PRESETS[args.preset]
    prompt_parts = [f"Preset: {preset.title}", f"Goal: {preset.user_goal}"]

    if args.prompt:
        prompt_parts.append(f"User Request:\n{args.prompt.strip()}")

    if args.input_file:
        prompt_parts.append(f"Local Context:\n{load_context(args.input_file)}")

    prompt_parts.append(f"Output Contract:\n{preset.output_contract}")
    prompt_parts.append(
        "Reminder: remain research-only. Produce a brief that can be reviewed by a planner or "
        "handed to a separate implementation model."
    )

    return [
        {"role": "system", "content": RESEARCH_BOUNDARY},
        {"role": "user", "content": "\n\n".join(prompt_parts)},
    ]


def request_completion(
    *,
    api_key: str,
    base_url: str,
    model: str,
    messages: list[dict[str, str]],
    temperature: float,
    max_tokens: int,
    allow_reasoning_only: bool = False,
) -> str:
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "top_p": 0.9,
        "max_tokens": max_tokens,
    }
    request = urllib.request.Request(
        base_url,
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=240) as response:
            data = json.load(response)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"NIM request failed with HTTP {exc.code}: {body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"NIM request failed: {exc}") from exc

    message = data.get("choices", [{}])[0].get("message", {})
    content = message.get("content")
    if isinstance(content, str) and content.strip():
        return content.strip()

    reasoning = message.get("reasoning")
    if isinstance(reasoning, str) and reasoning.strip():
        if allow_reasoning_only:
            return reasoning.strip()
        raise RuntimeError(
            "NIM returned reasoning without final content. Reduce request size or tighten the preset scope."
        )

    raise RuntimeError("NIM returned no usable content.")


def run_smoke(args: argparse.Namespace) -> int:
    api_key = resolve_setting("NIM_API_KEY")
    if not api_key:
        print(
            "pi-research smoke check failed: NIM_API_KEY is missing from the shell environment or local env files.",
            file=sys.stderr,
        )
        return 2

    print("pi-research smoke: local configuration looks present")
    print(f"model: {args.model}")
    print(f"base_url: {args.base_url}")

    if not args.live:
        return 0

    response = request_completion(
        api_key=api_key,
        base_url=args.base_url,
        model=args.model,
        messages=[
            {"role": "system", "content": "Return only the text ok."},
            {"role": "user", "content": "Reply with the exact text: ok"},
        ],
        temperature=0.1,
        max_tokens=32,
        allow_reasoning_only=True,
    )
    print("pi-research smoke: live NIM check passed")
    return 0


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if args.list_presets:
        print(render_preset_list())
        return 0

    if args.smoke:
        return run_smoke(args)

    api_key = resolve_setting("NIM_API_KEY")
    if not api_key:
        print(
            "NIM_API_KEY is required for pi-research. Set it in the shell environment or local repo env files before running.",
            file=sys.stderr,
        )
        return 2

    try:
        messages = build_messages(args)
        result = request_completion(
            api_key=api_key,
            base_url=args.base_url,
            model=args.model,
            messages=messages,
            temperature=args.temperature,
            max_tokens=args.max_tokens,
        )
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(result + "\n")
    else:
        print(result)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
