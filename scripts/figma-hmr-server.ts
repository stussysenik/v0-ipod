#!/usr/bin/env bun
/**
 * Local HMR WebSocket server for the Figma dev-mode bridge.
 *
 * Responsibilities:
 *   - Own a chokidar watcher over components/** and stories/**.
 *   - On a save, identify affected story ids, re-render them via
 *     scripts/render-story.ts, and emit story-updated / story-error.
 *   - Accept token-changed messages from the plugin and route them to the
 *     token writer (Phase 3).
 *   - Accept tokens-sync HTTP POST (from scripts/sync-tokens.ts) and
 *     forward it to the connected plugin.
 *
 * Single-client design: at most one plugin connection at a time. The server
 * refuses the second connection with a clear reason and keeps the first.
 *
 * Phase gate: this script is a no-op unless `FIGMA_HMR=1` is set. The
 * guard exists so CI and accidental invocations don't spin up a server.
 */

import chokidar from "chokidar";
import { WebSocketServer, type WebSocket } from "ws";
import { createServer } from "node:http";
import { resolve, relative, basename } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { renderStory } from "./render-story";
import { writeTokenChange, type TokenChange } from "./token-writer";

const REPO_ROOT = resolve(import.meta.dir, "..");
const STORIES_DIR = resolve(REPO_ROOT, "stories");
const PORT = Number(process.env.FIGMA_HMR_PORT ?? 7733);
const DEBOUNCE_MS = 300;

interface ServerMessage {
	type: "story-updated" | "story-error" | "token-ack" | "tokens-sync";
	payload: Record<string, unknown>;
}

interface ClientMessage {
	type: "token-changed" | "ping" | "bind-frame";
	payload: Record<string, unknown>;
}

function log(channel: "hmr" | "tokens" | "info" | "error", message: string): void {
	const colors = {
		hmr: "\x1b[36m",
		tokens: "\x1b[33m",
		info: "\x1b[32m",
		error: "\x1b[31m",
	};
	// eslint-disable-next-line no-console
	console.log(`${colors[channel]}[${channel}]\x1b[0m ${message}`);
}

function storyIdsForFile(absPath: string): string[] {
	const rel = relative(REPO_ROOT, absPath);
	// A change to a story file affects exactly that story's exports.
	if (rel.startsWith("stories/") && rel.endsWith(".stories.tsx")) {
		const slug = basename(rel, ".stories.tsx");
		const source = readFileSync(absPath, "utf8");
		const exportRe = /export const (\w+):/g;
		const ids: string[] = [];
		let m: RegExpExecArray | null;
		while ((m = exportRe.exec(source)) !== null) {
			ids.push(`${slug}--${m[1].toLowerCase()}`);
		}
		return ids;
	}
	// A change to a component file affects any story importing it. For
	// correctness we brute-force: re-render every story whose source
	// references the component file.
	if (rel.startsWith("components/")) {
		const needle = `@/${rel.replace(/\.tsx$/, "")}`;
		const matching: string[] = [];
		for (const storyFile of readdirSync(STORIES_DIR)) {
			if (!storyFile.endsWith(".stories.tsx")) continue;
			const storySrc = readFileSync(resolve(STORIES_DIR, storyFile), "utf8");
			if (storySrc.includes(needle)) {
				const slug = basename(storyFile, ".stories.tsx");
				const exportRe = /export const (\w+):/g;
				let m: RegExpExecArray | null;
				while ((m = exportRe.exec(storySrc)) !== null) {
					matching.push(`${slug}--${m[1].toLowerCase()}`);
				}
			}
		}
		return matching;
	}
	return [];
}

function sendTo(socket: WebSocket, message: ServerMessage): void {
	if (socket.readyState === socket.OPEN) {
		socket.send(JSON.stringify(message));
	}
}

function main(): void {
	if (process.env.FIGMA_HMR !== "1") {
		log(
			"info",
			"FIGMA_HMR is not set — server will not start. See docs/figma/runbook.md Phase 2.",
		);
		process.exit(0);
	}

	const http = createServer((req, res) => {
		if (req.method === "POST" && req.url === "/tokens/sync") {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			req.on("end", () => {
				try {
					const parsed = JSON.parse(body) as ServerMessage["payload"];
					if (currentClient) {
						sendTo(currentClient, {
							type: "tokens-sync",
							payload: parsed,
						});
						res.writeHead(200, {
							"content-type": "application/json",
						});
						res.end(JSON.stringify({ forwarded: true }));
					} else {
						res.writeHead(503);
						res.end("no plugin connected");
					}
				} catch (err) {
					res.writeHead(400);
					res.end((err as Error).message);
				}
			});
			return;
		}
		if (req.method === "GET" && req.url === "/health") {
			res.writeHead(200);
			res.end("ok");
			return;
		}
		res.writeHead(404);
		res.end();
	});

	const wss = new WebSocketServer({ server: http, path: "/figma-hmr" });
	let currentClient: WebSocket | null = null;

	wss.on("connection", (socket) => {
		if (currentClient && currentClient.readyState === socket.OPEN) {
			log("error", "rejecting second plugin connection");
			socket.close(1008, "another plugin is already connected");
			return;
		}
		currentClient = socket;
		log("info", "plugin connected");

		socket.on("close", () => {
			if (currentClient === socket) {
				currentClient = null;
				log("info", "plugin disconnected");
			}
		});

		socket.on("message", async (buffer) => {
			const raw = buffer.toString();
			let msg: ClientMessage;
			try {
				msg = JSON.parse(raw) as ClientMessage;
			} catch {
				log("error", `invalid plugin message: ${raw.slice(0, 120)}`);
				return;
			}
			if (msg.type === "ping") {
				sendTo(socket, { type: "token-ack", payload: { pong: true } });
				return;
			}
			if (msg.type === "token-changed") {
				if (process.env.FIGMA_HMR !== "1") return;
				try {
					await writeTokenChange(
						msg.payload as unknown as TokenChange,
					);
					sendTo(socket, {
						type: "token-ack",
						payload: {
							ok: true,
							variable: msg.payload.variableName,
						},
					});
					log("tokens", `wrote ${String(msg.payload.variableName)}`);
				} catch (err) {
					sendTo(socket, {
						type: "token-ack",
						payload: {
							ok: false,
							error: (err as Error).message,
						},
					});
					log(
						"error",
						`token write failed: ${(err as Error).message}`,
					);
				}
			}
		});
	});

	const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

	const watcher = chokidar.watch(["components/**/*.{ts,tsx}", "stories/**/*.{ts,tsx,mdx}"], {
		cwd: REPO_ROOT,
		ignoreInitial: true,
		ignored: /node_modules/,
	});

	watcher.on("change", (rel: string) => {
		const abs = resolve(REPO_ROOT, rel);
		const ids = storyIdsForFile(abs);
		if (ids.length === 0) return;
		for (const id of ids) {
			const existing = debounceTimers.get(id);
			if (existing) clearTimeout(existing);
			debounceTimers.set(
				id,
				setTimeout(async () => {
					debounceTimers.delete(id);
					if (!currentClient) return;
					try {
						const result = await renderStory({ storyId: id });
						sendTo(currentClient, {
							type: "story-updated",
							payload: {
								storyId: id,
								svg: result.svg,
								renderedAt: result.renderedAt,
							},
						});
						log("hmr", `rendered ${id}`);
					} catch (err) {
						sendTo(currentClient, {
							type: "story-error",
							payload: {
								storyId: id,
								error: (err as Error).message,
							},
						});
						log(
							"error",
							`render failed: ${id} — ${(err as Error).message}`,
						);
					}
				}, DEBOUNCE_MS),
			);
		}
	});

	http.listen(PORT, () => {
		log(
			"info",
			`HMR server listening on ws://localhost:${PORT}/figma-hmr (http://localhost:${PORT}/health)`,
		);
		log("info", "waiting for plugin connection...");
	});

	const shutdown = () => {
		log("info", "shutting down");
		watcher.close();
		wss.close();
		http.close();
		process.exit(0);
	};
	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
}

main();
