/**
 * Feed → screen view-model (pure).
 *
 * The portfolio's real iPod screen and click wheel are framework-neutral atoms; this
 * module is the only new logic that binds them to the canonical feed + nav machine.
 * It derives a small, presentation-ready view-model from `NavState` and maps the
 * wheel's rotational `onSeek(direction)` to a nav action — keeping the screen a pure
 * projection and the wheel a dumb control. No React, no DOM. Unit-tested.
 *
 * Both shells (`/portfolio` flat 2D, `/3d-portfolio` 3D) consume this verbatim; only
 * the device wrapper differs, so this is written once.
 */

import type { NormalizedFeed } from "@/lib/feed/load";
import type { IpodFeed, MenuNode, Work } from "@/lib/feed/schema";
import { focusedNode, type NavState, type PlainNavActionType } from "@/lib/nav/machine";

/** One list row on the menu screen. */
export type ScreenRow = { id: string; label: string; hint: string };

/** Everything the screen needs to render, derived from nav state. */
export type PortfolioScreenModel = {
	/** Status-bar title: the current menu's name, or the open work's title. */
	title: string;
	/** True for a list (menu) screen; false when a work case study is open. */
	isMenu: boolean;
	rows: ScreenRow[];
	cursor: number;
	openWork?: Work;
};

/** The chevron a node shows: submenu/work drill-in, or external-link arrow. */
function hintFor(node: MenuNode): string {
	if (node.children && node.children.length > 0) return "›";
	if (node.href) return "↗";
	return ""; // a slug opens in place — no affordance glyph, the row IS the work
}

/** Flatten the menu tree into id → label so a drilled frame can name its title. */
function buildTitleIndex(nodes: MenuNode[], into: Map<string, string>): Map<string, string> {
	for (const n of nodes) {
		into.set(n.id, n.label);
		if (n.children) buildTitleIndex(n.children, into);
	}
	return into;
}

/**
 * Resolve the status-bar title for the active frame: feed title at root, the drilled
 * node's own label in a submenu, the work's title when one is open.
 */
function titleFor(state: NavState, feed: IpodFeed, openWork: Work | undefined): string {
	if (openWork) return openWork.title;
	const frame = state.stack[state.stack.length - 1];
	if (!frame || frame.parentId === "root") return feed.meta.title;
	const index = buildTitleIndex(feed.menu, new Map());
	return index.get(frame.parentId) ?? feed.meta.title;
}

/** Pure projection of nav state into the screen view-model. */
export function deriveScreen(state: NavState, model: NormalizedFeed): PortfolioScreenModel {
	const feed = model.feed;
	const frame = state.stack[state.stack.length - 1];
	const openWork =
		state.view.kind === "work" ? model.worksBySlug.get(state.view.slug) : undefined;

	if (state.view.kind === "work") {
		return {
			title: titleFor(state, feed, openWork),
			isMenu: false,
			rows: [],
			cursor: frame?.focus ?? 0,
			openWork,
		};
	}

	void focusedNode; // focus is carried by `cursor`; node lookup not needed here
	return {
		title: titleFor(state, feed, undefined),
		isMenu: true,
		rows: (frame?.nodes ?? []).map((n) => ({ id: n.id, label: n.label, hint: hintFor(n) })),
		cursor: frame?.focus ?? 0,
	};
}

/**
 * Map the wheel's rotational delta to a nav action. Clockwise (`direction > 0`)
 * scrolls DOWN the list (next), counter-clockwise scrolls up (prev) — the faithful
 * iPod gesture. Returns the plain action the reducer accepts.
 */
export function seekToNav(direction: number): PlainNavActionType {
	return direction > 0 ? "next" : "prev";
}
