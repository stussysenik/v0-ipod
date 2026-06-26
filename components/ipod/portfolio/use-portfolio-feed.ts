"use client";

import { useMemo } from "react";

import { useFeedNav } from "@/components/ipod/browser/use-feed-nav";
import { loadFeed } from "@/lib/feed/load";
import type { IpodFeed } from "@/lib/feed/schema";
import { seekToNav } from "@/lib/portfolio/feed-screen";

/**
 * The portfolio interaction layer, shared by both shells.
 *
 * Composes the canonical, unit-tested pieces — `loadFeed` (validated index) and
 * `useFeedNav` (the pure nav machine + keyboard) — and exposes the small handler set
 * the real `IpodClickWheel` consumes. The wheel's rotational `onSeek` maps to the nav
 * action via `seekToNav`; the hardware buttons map to discrete actions. No business
 * logic lives here — it only adapts the machine to the control surface.
 */
export function usePortfolioFeed(feed: IpodFeed) {
	const model = useMemo(() => loadFeed(feed), [feed]);
	const { state, dispatch, onKeyDown } = useFeedNav(feed);

	const wheel = useMemo(
		() => ({
			onSeek: (direction: number) => dispatch({ type: seekToNav(direction) }),
			onCenterClick: () => dispatch({ type: "select" }),
			onMenuPress: () => dispatch({ type: "back" }),
			onPreviousPress: () => dispatch({ type: "prev" }),
			onNextPress: () => dispatch({ type: "next" }),
			onPlayPausePress: () => dispatch({ type: "select" }),
		}),
		[dispatch],
	);

	return { model, state, dispatch, onKeyDown, wheel };
}
