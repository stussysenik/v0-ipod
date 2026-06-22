#!/usr/bin/env python3

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
PLUGIN_ROOT = REPO_ROOT / "plugins" / "pi-research"
PLUGIN_MANIFEST = PLUGIN_ROOT / ".codex-plugin" / "plugin.json"
MARKETPLACE_MANIFEST = REPO_ROOT / ".agents" / "plugins" / "marketplace.json"
RUNNER_SCRIPT = PLUGIN_ROOT / "scripts" / "pi_research.py"
SKILL_FILE = PLUGIN_ROOT / "skills" / "pi-research" / "SKILL.md"


def load_runner_module():
    spec = importlib.util.spec_from_file_location("pi_research_runner", RUNNER_SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError("could not load pi_research.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate the pi-research plugin scaffold.")
    parser.add_argument(
        "--require-key",
        action="store_true",
        help="Fail if NIM_API_KEY is not resolvable from local env configuration.",
    )
    parser.add_argument(
        "--live",
        action="store_true",
        help="Perform a minimal live smoke request through the pi-research runner.",
    )
    return parser.parse_args()


def validate_optional_marketplace_manifest() -> None:
    if not MARKETPLACE_MANIFEST.exists():
        return

    marketplace = json.loads(MARKETPLACE_MANIFEST.read_text())
    entries = marketplace.get("plugins", [])
    match = next((entry for entry in entries if entry.get("name") == "pi-research"), None)
    if match is None:
        raise SystemExit("marketplace entry for pi-research is missing")
    if match.get("source", {}).get("path") != "./plugins/pi-research":
        raise SystemExit("marketplace entry path mismatch")


def main() -> int:
    args = parse_args()

    plugin_manifest = json.loads(PLUGIN_MANIFEST.read_text())
    if plugin_manifest.get("name") != "pi-research":
        raise SystemExit("plugin manifest name mismatch")
    if plugin_manifest.get("skills") != "./skills/":
        raise SystemExit("plugin manifest skills path mismatch")

    validate_optional_marketplace_manifest()

    if not SKILL_FILE.exists():
        raise SystemExit("pi-research skill file is missing")

    runner = load_runner_module()
    expected_presets = {
        "provenance-audit",
        "reference-pack",
        "visual-fidelity-critique",
        "implementation-brief",
    }
    if set(runner.PRESETS.keys()) != expected_presets:
        raise SystemExit("pi-research presets do not match the expected set")
    if runner.DEFAULT_MODEL != "moonshotai/kimi-k2.5":
        raise SystemExit("pi-research default model mismatch")

    if args.require_key and not runner.resolve_setting("NIM_API_KEY"):
        raise SystemExit("NIM_API_KEY is not available to pi-research")

    if args.live:
        smoke_args = type(
            "SmokeArgs",
            (),
            {
                "model": runner.resolve_setting("PI_RESEARCH_MODEL", runner.DEFAULT_MODEL),
                "base_url": runner.resolve_setting("PI_RESEARCH_BASE_URL", runner.DEFAULT_BASE_URL),
                "live": True,
            },
        )()
        result = runner.run_smoke(smoke_args)
        if result != 0:
            raise SystemExit(result)

    print("pi-research validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
