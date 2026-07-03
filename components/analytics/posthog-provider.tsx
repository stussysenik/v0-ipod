"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useState, type ReactNode } from "react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
// EU cloud — this project (id 361511) lives in the EU region. Defaulting here
// (not US) means events land in the right project even if NEXT_PUBLIC_POSTHOG_HOST
// is forgotten in an env. Override via that var if the project ever moves.
const POSTHOG_HOST =
	process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

/**
 * Initializes PostHog once, client-side, and ONLY when a key is configured.
 *
 * Presence of `NEXT_PUBLIC_POSTHOG_KEY` is the on/off switch: set it in Vercel's
 * production env, leave it unset locally so dev traffic and session recordings
 * never pollute the dataset — the same posture as the gated `@vercel/analytics`.
 * With no key this is a transparent pass-through.
 *
 * `defaults: "2025-05-24"` turns on autocapture, SPA-aware ($pageview on App
 * Router navigations via history changes), pageleave, and web-vitals capture.
 * `identified_only` profiles keep anonymous visitors off the billed person count
 * (free-tier friendly). Session replay is enabled in the PostHog project
 * settings, not here.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		if (!POSTHOG_KEY) return;
		if (posthog.__loaded) {
			setReady(true);
			return;
		}
		posthog.init(POSTHOG_KEY, {
			api_host: POSTHOG_HOST,
			defaults: "2025-05-24",
			person_profiles: "identified_only",
		});
		setReady(true);
	}, []);

	if (!POSTHOG_KEY || !ready) return <>{children}</>;
	return <PHProvider client={posthog}>{children}</PHProvider>;
}
