"use client";

/**
 * React binding for the pure nav machine.
 *
 * All navigation logic lives in `lib/nav/machine.ts` (framework-neutral, unit-tested);
 * this hook only adapts it to React: a reducer, keyboard bindings, and honoring the
 * transient `pendingLink` intent by opening the URL and acking it. The Lit element
 * binds the same machine its own way — neither owns the logic.
 */

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer } from "react";

import type { IpodFeed } from "@/lib/feed/schema";
import { initNav, navReducer, type PlainNavActionType } from "@/lib/nav/machine";

/**
 * An in-app route (`/portfolio`), as opposed to an outbound work link.
 *
 * `//evil.com` is protocol-relative — it starts with a slash but leaves the origin —
 * so a bare `startsWith("/")` would route an external URL through the in-app router.
 */
function isInAppRoute(href: string): boolean {
	return href.startsWith("/") && !href.startsWith("//");
}

export function useFeedNav(feed: IpodFeed) {
	const [state, dispatch] = useReducer(navReducer, feed, initNav);
	const router = useRouter();

	// A selected link node surfaces as `pendingLink`; open it, then ack so the
	// machine clears the intent (keeps the reducer pure — no side effects inside it).
	//
	// A work's link leaves the site, so it opens in a new tab. A surface's nav node
	// (§10 — the way home, and the portfolio pair) is the same site: it must navigate
	// in place, or "back to the iPod" would spawn a second tab instead of going back.
	useEffect(() => {
		if (state.pendingLink === undefined) return;
		const href = state.pendingLink;
		if (isInAppRoute(href)) {
			router.push(href);
		} else if (typeof window !== "undefined") {
			window.open(href, "_blank", "noopener,noreferrer");
		}
		dispatch({ type: "linkHandled" });
	}, [state.pendingLink, router]);

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
