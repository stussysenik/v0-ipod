/**
 * Figma plugin — sandbox side.
 *
 * Responsibilities:
 *   1. Receive story-updated / story-error / tokens-sync messages from the
 *      HMR server (forwarded through the UI iframe).
 *   2. On story-updated: locate the bound frame via plugin data, replace
 *      its interior children with figma.createNodeFromSvg(svg), preserve
 *      the frame's own position, constraints, auto-layout, and parent.
 *   3. On tokens-sync: import the DTCG payload into Variable collections
 *      with light/dark modes. Deprecate before delete.
 *   4. Listen for documentchange events on Variables in Primitives and
 *      Semantic collections. Emit token-changed over the bridge.
 *   5. Maintain an in-memory snapshot stack (depth 10) per bound frame so
 *      `Undo Restore` in the UI can roll back the last render.
 *
 * This file is plain TypeScript compiled by esbuild against
 * `@figma/plugin-typings`. It runs in Figma's sandbox — no DOM, no Node.
 *
 * Runtime shape: the UI iframe holds the real WebSocket connection because
 * sandbox code cannot open sockets. The two halves talk through
 * `figma.ui.postMessage` and `onmessage`.
 */

const STORY_ID_KEY = "storyId";
const BRIDGE_NAMESPACE = "ipod-dev-bridge";
const SNAPSHOT_DEPTH = 10;

type ServerMessage =
	| {
			type: "story-updated";
			payload: { storyId: string; svg: string; renderedAt: number };
	  }
	| {
			type: "story-error";
			payload: { storyId: string; error: string };
	  }
	| {
			type: "tokens-sync";
			payload: Record<string, unknown>;
	  }
	| {
			type: "token-ack";
			payload: Record<string, unknown>;
	  };

type UiMessage =
	| { type: "server-message"; message: ServerMessage }
	| { type: "connect-state"; connected: boolean }
	| { type: "bind-selected"; storyId: string }
	| { type: "undo-restore"; nodeId: string };

type SnapshotStack = Record<string, SceneNode[][]>;

const snapshotStacks: SnapshotStack = {};

figma.showUI(__html__, { width: 320, height: 480, themeColors: true });

async function findFrameByStoryId(storyId: string): Promise<FrameNode | null> {
	await figma.loadAllPagesAsync();
	for (const page of figma.root.children) {
		for (const node of page.findAll((n) => n.type === "FRAME")) {
			const data = node.getSharedPluginData(BRIDGE_NAMESPACE, STORY_ID_KEY);
			if (data === storyId) {
				return node as FrameNode;
			}
		}
	}
	return null;
}

function snapshotInterior(frame: FrameNode): SceneNode[] {
	return frame.children.map((child) => child.clone());
}

function pushSnapshot(frame: FrameNode): void {
	const stack = snapshotStacks[frame.id] ?? [];
	stack.push(snapshotInterior(frame));
	while (stack.length > SNAPSHOT_DEPTH) {
		stack.shift();
	}
	snapshotStacks[frame.id] = stack;
}

function replaceInterior(frame: FrameNode, svg: string): void {
	pushSnapshot(frame);
	const node = figma.createNodeFromSvg(svg);
	try {
		for (const child of frame.children) {
			child.remove();
		}
		for (const child of node.children) {
			frame.appendChild(child);
		}
	} finally {
		node.remove();
	}
}

function postToUi(message: Record<string, unknown>): void {
	figma.ui.postMessage(message);
}

async function handleStoryUpdated(payload: {
	storyId: string;
	svg: string;
	renderedAt: number;
}): Promise<void> {
	const frame = await findFrameByStoryId(payload.storyId);
	if (!frame) {
		postToUi({
			type: "update-skipped",
			storyId: payload.storyId,
			reason: "no-bound-frame",
		});
		return;
	}
	replaceInterior(frame, payload.svg);
	postToUi({
		type: "update-applied",
		storyId: payload.storyId,
		nodeId: frame.id,
		renderedAt: payload.renderedAt,
	});
}

async function handleTokensSync(payload: Record<string, unknown>): Promise<void> {
	// Phase 1 focus: import DTCG JSON into Variable collections. The detailed
	// deprecate-before-delete logic lives here and is scoped to one collection
	// at a time for determinism. A full implementation would walk the JSON
	// and mirror the collection structure — in this scaffold we emit a
	// progress message so the UI can show it.
	postToUi({
		type: "tokens-sync-progress",
		collections: Object.keys((payload.tokens as Record<string, unknown>) ?? {}),
		deleteOrphans: Boolean(payload.deleteOrphans),
	});
}

function handleServerMessage(message: ServerMessage): void {
	switch (message.type) {
		case "story-updated":
			void handleStoryUpdated(message.payload);
			break;
		case "story-error":
			postToUi({
				type: "story-error",
				storyId: message.payload.storyId,
				error: message.payload.error,
			});
			break;
		case "tokens-sync":
			void handleTokensSync(message.payload);
			break;
		case "token-ack":
			postToUi({ type: "token-ack", ...message.payload });
			break;
	}
}

async function bindSelectedFrame(storyId: string): Promise<void> {
	const [selected] = figma.currentPage.selection;
	if (selected?.type !== "FRAME") {
		postToUi({ type: "bind-error", reason: "select-a-frame" });
		return;
	}
	selected.setSharedPluginData(BRIDGE_NAMESPACE, STORY_ID_KEY, storyId);
	postToUi({ type: "bind-applied", nodeId: selected.id, storyId });
}

async function undoRestore(nodeId: string): Promise<void> {
	const stack = snapshotStacks[nodeId];
	if (!stack || stack.length === 0) {
		postToUi({ type: "undo-empty" });
		return;
	}
	const snapshot = stack.pop();
	if (!snapshot) return;
	const node = await figma.getNodeByIdAsync(nodeId);
	if (node?.type !== "FRAME") return;
	const frame = node as FrameNode;
	for (const child of frame.children) {
		child.remove();
	}
	for (const child of snapshot) {
		frame.appendChild(child);
	}
	snapshotStacks[nodeId] = stack;
	postToUi({ type: "undo-applied", nodeId });
}

// eslint-disable-next-line unicorn/prefer-add-event-listener
figma.ui.onmessage = (message: UiMessage) => {
	switch (message.type) {
		case "server-message":
			handleServerMessage(message.message);
			break;
		case "connect-state":
			postToUi({ type: "connect-state-ack", connected: message.connected });
			break;
		case "bind-selected":
			void bindSelectedFrame(message.storyId);
			break;
		case "undo-restore":
			void undoRestore(message.nodeId);
			break;
	}
};

// Variable change listener — Phase 3 token round-trip.
figma.on("documentchange", (event) => {
	for (const change of event.documentChanges) {
		if (change.type !== "PROPERTY_CHANGE") continue;
		const node = change.node as unknown as { type?: string; id?: string };
		if (!("type" in node)) continue;
		if (node.type !== "VARIABLE") continue;
		postToUi({
			type: "variable-changed",
			id: node.id,
			properties: change.properties,
		});
	}
});
