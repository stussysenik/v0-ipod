"use client";

/**
 * React binding for the pure nav machine.
 *
 * All navigation logic lives in `lib/nav/machine.ts` (framework-neutral, unit-tested);
 * this hook only adapts it to React: a reducer, keyboard bindings, and honoring the
 * transient `pendingLink` intent by opening the URL and acking it. The Lit element
 * binds the same machine its own way — neither owns the logic.
 */

import { useCallback, useEffect, useReducer } from "react";

import type { IpodFeed } from "@/lib/feed/schema";
import { initNav, navReducer, type PlainNavActionType } from "@/lib/nav/machine";

export function useFeedNav(feed: IpodFeed) {
	const [state, dispatch] = useReducer(navReducer, feed, initNav);

	// A selected link node surfaces as `pendingLink`; open it, then ack so the
	// machine clears the intent (keeps the reducer pure — no side effects inside it).
	useEffect(() => {
		if (state.pendingLink === undefined) return;
		if (typeof window !== "undefined") {
			window.open(state.pendingLink, "_blank", "noopener,noreferrer");
		}
		dispatch({ type: "linkHandled" });
	}, [state.pendingLink]);

	const onKeyDown = useCallback((e: React.KeyboardEvent) => {
		const map: Record<string, PlainNavActionType> = {
			ArrowUp: "prev",
			ArrowDown: "next",
			ArrowLeft: "back",
			Enter: "select",
			" ": "select",
			ArrowRight: "select",
			Backspace: "back",
			Escape: "back",
		};
		const action = map[e.key];
		if (action) {
			e.preventDefault();
			dispatch({ type: action });
		}
	}, []);

	return { state, dispatch, onKeyDown };
}
