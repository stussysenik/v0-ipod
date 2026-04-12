import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

const command = process.argv[2];

if (!command || (command !== "dev" && command !== "start")) {
  console.error('Usage: node scripts/run-next.mjs <dev|start>');
  process.exit(1);
}

const basePort = Number(process.env.PORT) || 4001;
const strictPort =
  process.env.PORT_STRICT === "1" ||
  command === "start" ||
  process.env.PORT != null;

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

const port = strictPort ? basePort : await findFreePort(basePort);

if (port !== basePort) {
  console.log(`[run-next] port ${basePort} in use — using ${port} instead`);
}

const nextBin = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);

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
