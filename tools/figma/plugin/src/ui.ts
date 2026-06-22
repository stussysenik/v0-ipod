/**
 * Figma plugin — UI iframe side.
 *
 * Owns the WebSocket connection to the HMR server. The sandbox cannot open
 * sockets, so the UI relays every message through figma.ui.postMessage /
 * parent.postMessage. The rendering work happens in code.ts.
 */

const WS_URL = "ws://localhost:7733/figma-hmr";

const statusEl = document.querySelector("#status")!;
const statusText = document.querySelector("#status-text")!;
const connectBtn = document.querySelector("#connect") as HTMLButtonElement;
const bindInput = document.querySelector("#bind-story") as HTMLInputElement;
const bindBtn = document.querySelector("#bind") as HTMLButtonElement;
const undoBtn = document.querySelector("#undo") as HTMLButtonElement;
const logEl = document.querySelector("#log")!;

let socket: WebSocket | null = null;
let selectedNodeId: string | null = null;

function log(message: string, level: "info" | "ok" | "error" = "info"): void {
	const line = document.createElement("div");
	line.className = `log-line ${level === "info" ? "" : level}`;
	const ts = new Date().toLocaleTimeString();
	line.textContent = `[${ts}] ${message}`;
	logEl.prepend(line);
}

function setConnected(connected: boolean): void {
	statusEl.classList.toggle("connected", connected);
	statusEl.classList.toggle("error", !connected);
	statusText.textContent = connected ? "Connected" : "Disconnected";
	bindBtn.disabled = !connected;
	parent.postMessage({ pluginMessage: { type: "connect-state", connected } }, "*");
}

function openSocket(): void {
	if (socket?.readyState === WebSocket.OPEN) return;
	try {
		socket = new WebSocket(WS_URL);
	} catch (error) {
		log(`connect failed: ${(error as Error).message}`, "error");
		setConnected(false);
		return;
	}
	socket.addEventListener("open", () => {
		setConnected(true);
		log("connected to HMR server", "ok");
	});
	socket.addEventListener("close", () => {
		setConnected(false);
		log("disconnected", "error");
	});
	socket.addEventListener("error", () => {
		log("socket error", "error");
	});
	socket.addEventListener("message", (event) => {
		try {
			const data = JSON.parse(event.data as string);
			parent.postMessage(
				{ pluginMessage: { type: "server-message", message: data } },
				"*",
			);
			log(data.type ?? "(message)", "info");
		} catch (error) {
			log(`invalid message: ${(error as Error).message}`, "error");
		}
	});
}

connectBtn.addEventListener("click", () => {
	if (socket?.readyState === WebSocket.OPEN) {
		socket.close();
		return;
	}
	openSocket();
});

bindBtn.addEventListener("click", () => {
	const value = bindInput.value.trim();
	if (!value) {
		log("enter a story id before binding", "error");
		return;
	}
	parent.postMessage({ pluginMessage: { type: "bind-selected", storyId: value } }, "*");
});

undoBtn.addEventListener("click", () => {
	if (!selectedNodeId) {
		log("select a bound frame first", "error");
		return;
	}
	parent.postMessage(
		{ pluginMessage: { type: "undo-restore", nodeId: selectedNodeId } },
		"*",
	);
});

window.addEventListener("message", (event) => {
	const msg = event.data.pluginMessage;
	if (!msg) return;
	switch (msg.type) {
		case "update-applied":
			selectedNodeId = msg.nodeId;
			log(`applied ${msg.storyId}`, "ok");
			break;
		case "update-skipped":
			log(`skipped ${msg.storyId}: ${msg.reason}`, "error");
			break;
		case "story-error":
			log(`error on ${msg.storyId}: ${msg.error}`, "error");
			break;
		case "bind-applied":
			selectedNodeId = msg.nodeId;
			log(`bound ${msg.storyId}`, "ok");
			break;
		case "bind-error":
			log(`bind failed: ${msg.reason}`, "error");
			break;
		case "undo-applied":
			log(`undo applied`, "ok");
			break;
		case "undo-empty":
			log(`snapshot stack empty`, "error");
			break;
		case "tokens-sync-progress":
			log(`tokens-sync: ${(msg.collections ?? []).join(", ")}`, "info");
			break;
		case "token-ack":
			log(`token-ack: ${JSON.stringify(msg).slice(0, 120)}`, "ok");
			break;
		case "variable-changed":
			if (socket?.readyState !== WebSocket.OPEN) return;
			socket.send(
				JSON.stringify({
					type: "token-changed",
					payload: {
						collection: "Semantic",
						variableName: msg.id,
						modeId: "light",
						newValue: "",
					},
				}),
			);
			break;
	}
});
