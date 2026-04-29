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

await reclaimRepoDevServer(basePort);

const port = strictPort ? basePort : await findFreePort(basePort);

if (port !== basePort) {
	console.log(`[run-next] port ${basePort} in use — using ${port} instead`);
}

const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));

const child = spawn(process.execPath, [nextBin, command, "-p", String(port)], {
	stdio: "inherit",
	env: process.env,
});

child.on("exit", (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
		return;
	}
	process.exit(code ?? 0);
});

child.on("error", (error) => {
	console.error(error);
	process.exit(1);
});
