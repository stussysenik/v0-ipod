/**
 * Browser navigation machine.
 *
 * The iPod menu *is* a browser: a stack of lists, a focused row per list, center to
 * drill in or open a work, menu to go back. This module is that interaction as a
 * pure reducer over the feed's menu tree — no React, no DOM, no timers — so it is
 * unit-testable and shared verbatim by the React workbench and the Lit element.
 *
 * State is a stack of frames. Each frame is a list of menu nodes plus the focused
 * index. Drilling pushes a frame; back pops it (restoring the prior focus exactly).
 * Selecting a `slug` node opens a work surface; a `href` node yields an external
 * intent the host decides how to honor.
 */

import type { IpodFeed, MenuNode } from "@/lib/feed/schema";

/** One level of the menu stack: the list shown and which row is focused. */
export type NavFrame = {
	/** Stable id of the node whose children this frame shows, or "root". */
	parentId: string;
	nodes: MenuNode[];
	focus: number;
};

/** What the device's screen should be showing. */
export type NavView =
	| { kind: "menu" }
	/** A work is open (IA-C expand). `slug` indexes the feed's works. */
	| { kind: "work"; slug: string };

export type NavState = {
	stack: NavFrame[];
	view: NavView;
	/** Set transiently when a `href` node is selected; host opens it, then clears. */
	pendingLink?: string;
	/**
	 * slug → the work's primary link. Carried in state because the reducer is pure and
	 * otherwise has no way to reach the feed's works: a *menu* node's `href` was openable,
	 * but a *work's* `links[]` were not, so every project URL was a dead end while the
	 * screen still drew a `↗` promising otherwise.
	 */
	workLinks: Readonly<Record<string, string>>;
};

export type NavAction =
	| { type: "prev" }
	| { type: "next" }
	/** Point focus directly at a row (pointer parity with the wheel). */
	| { type: "focus"; index: number }
	/** Center button: drill into a submenu, open a work, or emit a link intent. */
	| { type: "select" }
	/** Menu button: pop a frame, or close an open work back to the menu. */
	| { type: "back" }
	/** Host acknowledges it opened `pendingLink`. */
	| { type: "linkHandled" };

/** Action types that carry no payload — the wheel/keyboard buttons. */
export type PlainNavActionType = Exclude<NavAction["type"], "focus">;

/** Build the initial state: a single root frame focused on its first row. */
export function initNav(feed: IpodFeed): NavState {
	const workLinks: Record<string, string> = {};
	for (const work of feed.works) {
		// The first link is the primary one — for every work in this feed that is the
		// live site. A work with no links simply has no entry, and center does nothing.
		const primary = work.links[0];
		if (primary) workLinks[work.slug] = primary.href;
	}
	return {
		stack: [{ parentId: "root", nodes: feed.menu, focus: 0 }],
		view: { kind: "menu" },
		workLinks,
	};
}

/** The currently focused node, or undefined for an empty frame. */
export function focusedNode(state: NavState): MenuNode | undefined {
	const frame = state.stack[state.stack.length - 1];
	return frame?.nodes[frame.focus];
}

function clampFocus(frame: NavFrame, next: number): NavFrame {
	const n = frame.nodes.length;
	if (n === 0) return frame;
	// Wrap like a real click wheel: past the end loops to the start and vice-versa.
	const wrapped = ((next % n) + n) % n;
	return { ...frame, focus: wrapped };
}

function replaceTop(state: NavState, frame: NavFrame): NavState {
	return { ...state, stack: [...state.stack.slice(0, -1), frame] };
}

export function navReducer(state: NavState, action: NavAction): NavState {
	const top = state.stack[state.stack.length - 1];

	switch (action.type) {
		case "prev":
			if (state.view.kind !== "menu" || !top) return state;
			return replaceTop(state, clampFocus(top, top.focus - 1));

		case "next":
			if (state.view.kind !== "menu" || !top) return state;
			return replaceTop(state, clampFocus(top, top.focus + 1));

		case "focus":
			if (state.view.kind !== "menu" || !top) return state;
			return replaceTop(state, clampFocus(top, action.index));

		case "select": {
			// Center on an *open* work opens that work's live link. Without this the wheel
			// had no verb left on a work screen: the link was drawn with a `↗` and could
			// never be followed, which made all eleven project URLs unreachable.
			if (state.view.kind === "work") {
				const href = state.workLinks[state.view.slug];
				if (!href) return state;
				return { ...state, pendingLink: href };
			}
			if (state.view.kind !== "menu" || !top) return state;
			const node = top.nodes[top.focus];
			if (!node) return state;
			if (node.children && node.children.length > 0) {
				return {
					...state,
					stack: [...state.stack, { parentId: node.id, nodes: node.children, focus: 0 }],
				};
			}
			if (node.slug) return { ...state, view: { kind: "work", slug: node.slug } };
			if (node.href) return { ...state, pendingLink: node.href };
			return state;
		}

		case "back": {
			// An open work closes back to the menu it came from (stack untouched).
			if (state.view.kind === "work") return { ...state, view: { kind: "menu" } };
			// Otherwise pop a level — but never past the root frame.
			if (state.stack.length <= 1) return state;
			return { ...state, stack: state.stack.slice(0, -1) };
		}

		case "linkHandled":
			if (state.pendingLink === undefined) return state;
			return { ...state, pendingLink: undefined };

		default:
			return state;
	}
}
