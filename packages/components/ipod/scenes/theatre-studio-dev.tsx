"use client";

import { useEffect } from "react";

/**
 * Bridges the React `enabled` flag (the cockpit toggle, persisted in studio state)
 * to the imperative Theatre.js studio overlay — development only. Renders nothing;
 * the studio injects its own full-screen editor overlay when shown.
 *
 * The whole thing is tree-shaken out of production builds via the NODE_ENV guard,
 * and the dynamic import keeps the studio bundle out of the initial chunk. Toggling
 * `enabled` shows/hides the overlay (init is lazy + one-time), so flipping it off
 * fully clears it from the view — and it starts hidden, so it can never surprise an
 * export.
 */
export function TheatreStudioDev({ enabled }: { enabled: boolean }) {
	useEffect(() => {
		if (process.env.NODE_ENV === "production") {
			return;
		}
		let cancelled = false;
		void import("@ipod/lib/theatre/theatre-runtime").then((m) => {
			if (!cancelled) {
				void m.setTheatreStudioVisible(enabled);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [enabled]);

	return null;
}
