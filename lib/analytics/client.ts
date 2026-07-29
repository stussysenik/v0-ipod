import type { PostHog } from "posthog-js";

/**
 * Holds the analytics client once the provider has loaded it.
 *
 * `posthog-js` is 206 KB raw / 67 KB gz. A static `import posthog from
 * "posthog-js"` anywhere reachable from the root layout puts those bytes in the
 * shared chunk, so every route — including `/_not-found` — downloads, parses and
 * evaluates them before any runtime key check can decline to use them. A
 * runtime guard gates initialization, not cost.
 *
 * Registration keeps the import dynamic: `AnalyticsProvider` fetches the module
 * only when `NEXT_PUBLIC_POSTHOG_KEY` is set and hands the instance here, so
 * `track()` can stay synchronous without importing the vendor at module scope.
 * With no key the client is never fetched and this module holds null.
 */
let client: PostHog | null = null;

export function setAnalyticsClient(next: PostHog | null): void {
	client = next;
}

export function getAnalyticsClient(): PostHog | null {
	return client;
}
