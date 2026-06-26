"use client";

/**
 * Thin React wrapper that mounts the REAL `<ipod-classic>` custom element (not the
 * React renderer). This is what makes `/whitelabel` a faithful proof of the
 * embeddable: the same browser-native element a third party would drop into plain
 * HTML. The element is registered client-side (dynamic import — it touches
 * `customElements`), and `feed`/`theme` are set as DOM *properties* via ref, since
 * objects can't pass through HTML attributes.
 */

import { createElement, useEffect, useRef } from "react";

import type { IpodFeed, ThemeTokens } from "@/lib/feed/schema";

export function IpodClassicEmbed({ feed, theme }: { feed: IpodFeed; theme?: ThemeTokens }) {
	const ref = useRef<HTMLElement & { feed?: IpodFeed; theme?: ThemeTokens }>(null);

	// Register the element once on the client (it references customElements).
	useEffect(() => {
		void import("@/packages/ipod-wc/src/index");
	}, []);

	// Push object props to the element whenever they change (drives feed-swap).
	useEffect(() => {
		if (ref.current) ref.current.feed = feed;
	}, [feed]);
	useEffect(() => {
		if (ref.current) ref.current.theme = theme;
	}, [theme]);

	return createElement("ipod-classic", { ref });
}
