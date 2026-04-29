#!/usr/bin/env node

import process from "node:process";
import path from "node:path";

import nextEnv from "@next/env";
import { Agent } from "@cursor/sdk";

const DEFAULT_MODEL = process.env.CURSOR_MODEL ?? "composer-2";
const { loadEnvConfig } = nextEnv;

async function main() {
	loadEnvConfig(process.cwd());

	const options = parseArgs(process.argv.slice(2));

	if (options.help) {
		printHelp();
		return;
	}

	const apiKey = process.env.CURSOR_API_KEY;
	if (!apiKey) {
		throw new Error(
			"Set CURSOR_API_KEY in your shell or .env.local before running the harness.",
		);
	}

	const prompt = await readPrompt(options.prompt);
	if (!prompt) {
		throw new Error("Provide a prompt as an argument or pipe one on stdin.");
	}

	const agent = await Agent.create({
		apiKey,
		name: "v0-ipod Cursor harness",
		model: { id: options.model },
		local: { cwd: options.cwd },
	});

	try {
		const run = await agent.send(prompt, {
			...(options.force ? { local: { force: true } } : {}),
		});

		let assistantEndedWithNewline = true;
		let printedAssistantText = false;

		for await (const event of run.stream()) {
			if (event.type === "assistant") {
				for (const block of event.message.content) {
					if (block.type !== "text") continue;
					process.stdout.write(block.text);
					printedAssistantText = true;
					assistantEndedWithNewline = block.text.endsWith("\n");
				}
				continue;
			}

			if (event.type === "tool_call") {
				const status = event.status ?? "running";
				process.stderr.write(`[tool] ${status} ${event.toolName}\n`);
				continue;
			}

			if (event.type === "thought") {
				const text = compact(event.text);
				if (text) {
					process.stderr.write(`[thinking] ${text}\n`);
				}
			}
		}

		const result = await run.wait();
		if (printedAssistantText && !assistantEndedWithNewline) {
			process.stdout.write("\n");
		}
		process.stderr.write(
			`[done] status=${result.status} duration=${formatDuration(result.durationMs)}\n`,
		);
	} finally {
		await agent[Symbol.asyncDispose]();
	}
}

function parseArgs(argv) {
	let cwd = process.cwd();
	let force = false;
	let help = false;
	let model = DEFAULT_MODEL;
	const promptParts = [];

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];

		if (arg === "--") {
			promptParts.push(...argv.slice(index + 1));
			break;
		}

		if (arg === "--help" || arg === "-h") {
			help = true;
			continue;
		}

		if (arg === "--force") {
			force = true;
			continue;
		}

		if (arg === "--cwd" || arg === "-C") {
			cwd = path.resolve(readOptionValue(argv, index, arg));
			index += 1;
			continue;
		}

		if (arg.startsWith("--cwd=")) {
			cwd = path.resolve(arg.slice("--cwd=".length));
			continue;
		}

		if (arg === "--model" || arg === "-m") {
			model = readOptionValue(argv, index, arg);
			index += 1;
			continue;
		}

		if (arg.startsWith("--model=")) {
			model = arg.slice("--model=".length);
			continue;
		}

		if (arg.startsWith("-")) {
			throw new Error(`Unknown option: ${arg}`);
		}

		promptParts.push(arg, ...argv.slice(index + 1));
		break;
	}

	return {
		cwd,
		force,
		help,
		model,
		prompt: promptParts.join(" ").trim(),
	};
}

function readOptionValue(argv, index, option) {
	const value = argv[index + 1];
	if (!value || value.startsWith("-")) {
		throw new Error(`Expected a value after ${option}.`);
	}
	return value;
}

async function readPrompt(prompt) {
	if (prompt) {
		return prompt;
	}

	if (process.stdin.isTTY) {
		return "";
	}

	const chunks = [];
	for await (const chunk of process.stdin) {
		chunks.push(chunk);
	}

	return Buffer.concat(chunks).toString("utf8").trim();
}

function printHelp() {
	process.stdout.write(`Cursor harness for this repo

Usage:
  bun run cursor:harness -- "Summarize this project"
  echo "Find the export flow" | bun run cursor:harness

Options:
  -C, --cwd <path>     Workspace to run against. Defaults to the repo root.
  -m, --model <id>     Cursor model id. Defaults to CURSOR_MODEL or ${DEFAULT_MODEL}.
      --force          Allow local execution even with uncommitted changes.
  -h, --help           Show this help text.

Environment:
  CURSOR_API_KEY       Required. Loaded from the shell or .env.local.
  CURSOR_MODEL         Optional default model override.
`);
}

function compact(value) {
	return value.replace(/\s+/g, " ").trim();
}

function formatDuration(durationMs) {
	if (!Number.isFinite(durationMs)) {
		return "unknown";
	}

	if (durationMs < 1000) {
		return `${durationMs}ms`;
	}

	return `${(durationMs / 1000).toFixed(1)}s`;
}

main().catch((error) => {
	process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
	process.exitCode = 1;
});
