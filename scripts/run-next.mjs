import { execFileSync, spawn } from "node:child_process";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const command = process.argv[2];

if (!command || (command !== "dev" && command !== "start")) {
	console.error("Usage: node scripts/run-next.mjs <dev|start>");
	process.exit(1);
}

const basePort = Number(process.env.PORT) || 4001;
const strictPort =
	process.env.PORT_STRICT === "1" || command === "start" || process.env.PORT != null;
const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const shouldStartCloudflareTunnel =
	command === "dev" && process.env.CLOUDFLARE_TUNNEL !== "0";
const cloudflaredBin = process.env.CLOUDFLARED_BIN || "cloudflared";
const ANSI_RESET = "\u001B[0m";
const ANSI_BOLD = "\u001B[1m";
const ANSI_CYAN = "\u001B[36m";

if (!process.env.NEXT_DIST_DIR) {
	process.env.NEXT_DIST_DIR = command === "dev" ? ".next-dev" : ".next";
}

function probePort(port) {
	return new Promise((resolve) => {
		const server = createServer();
		server.unref();
		server.once("error", () => resolve(false));
		server.once("listening", () => {
			server.close(() => resolve(true));
		});
		server.listen(port, "::");
	});
}

async function findFreePort(start) {
	for (let port = start; port < start + 50; port++) {
		if (await probePort(port)) return port;
	}
	throw new Error(`No free port found in range ${start}-${start + 49}`);
}

function readLsofValue(args, prefix) {
	try {
		const output = execFileSync("lsof", args, { encoding: "utf8" });
		const line = output
			.split("\n")
			.map((entry) => entry.trim())
			.find((entry) => entry.startsWith(prefix));
		return line ? line.slice(prefix.length).trim() : null;
	} catch {
		return null;
	}
}

function getListeningPid(port) {
	const pidValue = readLsofValue(["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-Fp"], "p");
	return pidValue ? Number(pidValue) : null;
}

function getProcessCwd(pid) {
	const cwd = readLsofValue(["-a", "-p", String(pid), "-d", "cwd", "-Fn"], "n");
	return cwd ? resolve(cwd) : null;
}

async function waitForPortToFree(port, attempts = 20) {
	for (let attempt = 0; attempt < attempts; attempt++) {
		if (await probePort(port)) {
			return true;
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	return false;
}

async function reclaimRepoDevServer(port) {
	if (command !== "dev" || strictPort) {
		return;
	}

	const pid = getListeningPid(port);
	if (!pid || pid === process.pid) {
		return;
	}

	const cwd = getProcessCwd(pid);
	if (cwd !== repoRoot) {
		return;
	}

	console.log(`[run-next] stopping existing dev server on port ${port}`);

	try {
		process.kill(pid, "SIGTERM");
	} catch {
		return;
	}

	const portFreed = await waitForPortToFree(port);
	if (!portFreed) {
		console.warn(`[run-next] port ${port} is still busy after stopping pid ${pid}`);
	}
}

function relayOutput(stream, prefix, onLine) {
	if (!stream) {
		return;
	}

	let buffer = "";
	stream.setEncoding("utf8");
	stream.on("data", (chunk) => {
		buffer += chunk;
		const lines = buffer.split(/\r?\n/u);
		buffer = lines.pop() ?? "";
		for (const line of lines) {
			if (!line.trim()) {
				continue;
			}
			console.log(`${prefix} ${line}`);
			onLine?.(line);
		}
	});
	stream.on("end", () => {
		if (!buffer.trim()) {
			return;
		}
		console.log(`${prefix} ${buffer}`);
		onLine?.(buffer);
	});
}

function logHighlightedCloudflareUrl(url) {
	const line = "=".repeat(Math.max(56, url.length + 24));
	const label = `${ANSI_BOLD}${ANSI_CYAN}Cloudflare tunnel ready${ANSI_RESET}`;
	const highlightedUrl = `${ANSI_BOLD}${ANSI_CYAN}${url}${ANSI_RESET}`;

	console.log("");
	console.log(`[run-next] ${line}`);
	console.log(`[run-next] ${label}`);
	console.log(`[run-next] ${highlightedUrl}`);
	console.log(`[run-next] ${line}`);
	console.log("");
}

function startCloudflareTunnel(port) {
	console.log(`[run-next] starting Cloudflare tunnel for http://localhost:${port}`);

	const tunnel = spawn(
		cloudflaredBin,
		["tunnel", "--url", `http://127.0.0.1:${port}`, "--no-autoupdate"],
		{
			stdio: ["ignore", "pipe", "pipe"],
			env: process.env,
		},
	);

	let tunnelUrlLogged = false;
	const maybeLogTunnelUrl = (line) => {
		if (tunnelUrlLogged) {
			return;
		}
		const match = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/iu);
		if (!match) {
			return;
		}
		tunnelUrlLogged = true;
		logHighlightedCloudflareUrl(match[0]);
	};

	relayOutput(tunnel.stdout, "[cloudflared]", maybeLogTunnelUrl);
	relayOutput(tunnel.stderr, "[cloudflared]", maybeLogTunnelUrl);

	tunnel.on("error", (error) => {
		console.warn(`[run-next] failed to start Cloudflare tunnel: ${error.message}`);
	});

	tunnel.on("exit", (code, signal) => {
		if (signal) {
			console.log(`[run-next] Cloudflare tunnel stopped (${signal})`);
			return;
		}
		if (code && code !== 0) {
			console.warn(`[run-next] Cloudflare tunnel exited with code ${code}`);
		}
	});

	return tunnel;
}

await reclaimRepoDevServer(basePort);

const port = strictPort ? basePort : await findFreePort(basePort);

if (port !== basePort) {
	console.log(`[run-next] port ${basePort} in use — using ${port} instead`);
}

const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));

const nextProcess = spawn(process.execPath, [nextBin, command, "-p", String(port)], {
	stdio: "inherit",
	env: process.env,
});

const tunnelProcess = shouldStartCloudflareTunnel ? startCloudflareTunnel(port) : null;

let shuttingDown = false;

function stopChild(child, signal = "SIGTERM") {
	if (!child || child.killed || child.exitCode !== null || child.signalCode !== null) {
		return;
	}

	try {
		child.kill(signal);
	} catch {
		// Best effort shutdown for child processes during dev.
	}
}

function shutdown(signal = "SIGTERM") {
	if (shuttingDown) {
		return;
	}
	shuttingDown = true;
	stopChild(tunnelProcess, signal);
	stopChild(nextProcess, signal);
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
	process.on(signal, () => {
		shutdown(signal);
	});
}

nextProcess.on("exit", (code, signal) => {
	shutdown(signal ?? "SIGTERM");
	if (signal) {
		process.kill(process.pid, signal);
		return;
	}
	process.exit(code ?? 0);
});

nextProcess.on("error", (error) => {
	shutdown("SIGTERM");
	console.error(error);
	process.exit(1);
});
