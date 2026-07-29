"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import type { PostHog } from "posthog-js";
import { setAnalyticsClient } from "@/lib/analytics/client";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
// EU cloud — this project (id 361511) lives in the EU region. Defaulting here
// (not US) means events land in the right project even if NEXT_PUBLIC_POSTHOG_HOST
// is forgotten in an env. Override via that var if the project ever moves.
const POSTHOG_HOST =
	process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

type ProviderComponent = ComponentType<{ client: PostHog; children: ReactNode }>;

/**
 * Initializes PostHog once, client-side, and ONLY when a key is configured.
 *
 * Presence of `NEXT_PUBLIC_POSTHOG_KEY` is the on/off switch: set it in Vercel's
 * production env, leave it unset locally so dev traffic and session recordings
 * never pollute the dataset — the same posture as the gated `@vercel/analytics`.
 * With no key this is a transparent pass-through.
 *
 * Both vendor modules are imported dynamically inside the effect, behind the key
 * check. A static import would place 206 KB raw / 67 KB gz in the shared layout
 * chunk and charge it to every route including `/_not-found`, because the guard
 * runs only after those bytes are fetched, parsed and evaluated. The instance is
 * published to `lib/analytics/client` so the synchronous `track()` surface can
 * reach it without a vendor import of its own.
 *
 * `defaults: "2025-05-24"` turns on autocapture, SPA-aware ($pageview on App
 * Router navigations via history changes), pageleave, and web-vitals capture.
 * `identified_only` profiles keep anonymous visitors off the billed person count
 * (free-tier friendly). Session replay is enabled in the PostHog project
 * settings, not here.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
	const [loaded, setLoaded] = useState<{
		Provider: ProviderComponent;
		client: PostHog;
	} | null>(null);

	useEffect(() => {
		if (!POSTHOG_KEY) return;
		let cancelled = false;

		void (async () => {
			const [{ default: posthog }, { PostHogProvider }] = await Promise.all([
				import("posthog-js"),
				import("posthog-js/react"),
			]);
			if (cancelled) return;

			if (!posthog.__loaded) {
				posthog.init(POSTHOG_KEY, {
					api_host: POSTHOG_HOST,
					defaults: "2025-05-24",
					person_profiles: "identified_only",
				});
			}
			setAnalyticsClient(posthog);
			setLoaded({
				Provider: PostHogProvider as ProviderComponent,
				client: posthog,
			});
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	if (!loaded) return <>{children}</>;
	const { Provider, client } = loaded;
	return <Provider client={client}>{children}</Provider>;
}
